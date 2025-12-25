import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type { Node, JSXElement, JSXAttribute, JSXIdentifier } from '@babel/types';
import type { ComponentInfo, ElementInfo, ElementType, PropInfo } from '../types';
import { readFileSync } from 'fs';
import { basename, dirname } from 'path';

const INTERACTIVE_ELEMENTS: Record<string, ElementType> = {
  button: 'button',
  a: 'link',
  input: 'input',
  textarea: 'textarea',
  select: 'select',
  form: 'form',
  dialog: 'modal',
  details: 'accordion',
};

const EVENT_HANDLERS = [
  'onClick',
  'onSubmit',
  'onChange',
  'onBlur',
  'onFocus',
  'onKeyDown',
  'onKeyUp',
  'onKeyPress',
  'onMouseEnter',
  'onMouseLeave',
];

export function analyzeReactFile(filePath: string): ComponentInfo | null {
  const code = readFileSync(filePath, 'utf-8');

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
    });

    const components: ComponentInfo[] = [];
    const elements: ElementInfo[] = [];
    const props: PropInfo[] = [];
    let componentName = extractComponentName(filePath);
    let hasDefaultExport = false;

    traverse(ast, {
      // Find function/arrow component declarations
      FunctionDeclaration(path) {
        if (path.node.id && isComponentName(path.node.id.name)) {
          componentName = path.node.id.name;
        }
      },

      VariableDeclarator(path) {
        if (
          path.node.id.type === 'Identifier' &&
          isComponentName(path.node.id.name) &&
          (path.node.init?.type === 'ArrowFunctionExpression' ||
           path.node.init?.type === 'FunctionExpression')
        ) {
          componentName = path.node.id.name;
        }
      },

      ExportDefaultDeclaration() {
        hasDefaultExport = true;
      },

      // Find JSX elements
      JSXElement(path) {
        const element = extractElementInfo(path.node, code);
        if (element) {
          elements.push(element);
        }
      },

      // Find props interface/type
      TSInterfaceDeclaration(path) {
        if (path.node.id.name.includes('Props')) {
          path.node.body.body.forEach((prop) => {
            if (prop.type === 'TSPropertySignature' && prop.key.type === 'Identifier') {
              props.push({
                name: prop.key.name,
                type: extractTypeString(prop.typeAnnotation),
                required: !prop.optional,
              });
            }
          });
        }
      },

      TSTypeAliasDeclaration(path) {
        if (path.node.id.name.includes('Props') && path.node.typeAnnotation.type === 'TSTypeLiteral') {
          path.node.typeAnnotation.members.forEach((member) => {
            if (member.type === 'TSPropertySignature' && member.key.type === 'Identifier') {
              props.push({
                name: member.key.name,
                type: extractTypeString(member.typeAnnotation),
                required: !member.optional,
              });
            }
          });
        }
      },
    });

    if (!hasDefaultExport && elements.length === 0) {
      return null; // Not a component file
    }

    return {
      filePath,
      name: componentName,
      framework: 'react',
      elements,
      props,
      routes: extractRoutes(code),
      hasTests: false,
      testFilePath: undefined,
    };
  } catch (error) {
    console.warn(`Failed to parse ${filePath}:`, error);
    return null;
  }
}

function extractElementInfo(node: JSXElement, code: string): ElementInfo | null {
  const openingElement = node.openingElement;

  // Get element name
  let elementName = '';
  if (openingElement.name.type === 'JSXIdentifier') {
    elementName = openingElement.name.name.toLowerCase();
  } else if (openingElement.name.type === 'JSXMemberExpression') {
    // Handle things like Dialog.Panel
    return null;
  }

  // Check if it's an interactive element or has event handlers
  const isInteractive = elementName in INTERACTIVE_ELEMENTS;
  const handlers = extractEventHandlers(openingElement.attributes);

  if (!isInteractive && handlers.length === 0) {
    return null;
  }

  // Extract attributes
  const testId = extractAttribute(openingElement.attributes, 'data-testid');
  const label = extractAttribute(openingElement.attributes, 'aria-label') ||
                extractAttribute(openingElement.attributes, 'title') ||
                extractTextContent(node);
  const href = extractAttribute(openingElement.attributes, 'href');
  const inputType = extractAttribute(openingElement.attributes, 'type');
  const name = extractAttribute(openingElement.attributes, 'name');
  const id = extractAttribute(openingElement.attributes, 'id');

  // Generate suggested test ID
  const suggestedTestId = generateTestId(elementName, label, name, id);

  const elementType = INTERACTIVE_ELEMENTS[elementName] ||
                      (handlers.includes('onClick') ? 'button' : 'other');

  // Handle checkbox/radio
  let finalType = elementType;
  if (elementType === 'input' && inputType) {
    if (inputType === 'checkbox') finalType = 'checkbox';
    else if (inputType === 'radio') finalType = 'radio';
  }

  return {
    type: finalType,
    testId: testId || undefined,
    suggestedTestId,
    label: label || undefined,
    line: openingElement.loc?.start.line || 0,
    handlers,
    inputType: inputType || undefined,
    href: href || undefined,
  };
}

function extractAttribute(
  attributes: (JSXAttribute | Node)[],
  name: string
): string | null {
  for (const attr of attributes) {
    if (attr.type !== 'JSXAttribute') continue;
    if (attr.name.type !== 'JSXIdentifier') continue;
    if (attr.name.name !== name) continue;

    if (!attr.value) return 'true';
    if (attr.value.type === 'StringLiteral') {
      return attr.value.value;
    }
    if (attr.value.type === 'JSXExpressionContainer') {
      if (attr.value.expression.type === 'StringLiteral') {
        return attr.value.expression.value;
      }
      if (attr.value.expression.type === 'TemplateLiteral') {
        // Return first quasi as approximation
        return attr.value.expression.quasis[0]?.value.raw || null;
      }
    }
  }
  return null;
}

function extractEventHandlers(attributes: (JSXAttribute | Node)[]): string[] {
  const handlers: string[] = [];
  for (const attr of attributes) {
    if (attr.type !== 'JSXAttribute') continue;
    if (attr.name.type !== 'JSXIdentifier') continue;
    if (EVENT_HANDLERS.includes(attr.name.name)) {
      handlers.push(attr.name.name);
    }
  }
  return handlers;
}

function extractTextContent(node: JSXElement): string | null {
  for (const child of node.children) {
    if (child.type === 'JSXText') {
      const text = child.value.trim();
      if (text) return text;
    }
    if (child.type === 'JSXExpressionContainer') {
      if (child.expression.type === 'StringLiteral') {
        return child.expression.value;
      }
    }
  }
  return null;
}

function extractTypeString(typeAnnotation: Node | null | undefined): string {
  if (!typeAnnotation) return 'unknown';
  if (typeAnnotation.type === 'TSTypeAnnotation') {
    return extractTypeString(typeAnnotation.typeAnnotation);
  }
  if (typeAnnotation.type === 'TSStringKeyword') return 'string';
  if (typeAnnotation.type === 'TSNumberKeyword') return 'number';
  if (typeAnnotation.type === 'TSBooleanKeyword') return 'boolean';
  if (typeAnnotation.type === 'TSTypeReference') {
    if (typeAnnotation.typeName.type === 'Identifier') {
      return typeAnnotation.typeName.name;
    }
  }
  return 'unknown';
}

function extractComponentName(filePath: string): string {
  const fileName = basename(filePath, '.tsx').replace('.jsx', '');
  // Convert to PascalCase if needed
  if (fileName === 'index') {
    return basename(dirname(filePath));
  }
  return fileName.charAt(0).toUpperCase() + fileName.slice(1);
}

function isComponentName(name: string): boolean {
  return /^[A-Z]/.test(name);
}

function extractRoutes(code: string): string[] {
  const routes: string[] = [];

  // Look for react-router patterns
  const routePatterns = [
    /path=["']([^"']+)["']/g,
    /to=["']([^"']+)["']/g,
    /navigate\(["']([^"']+)["']\)/g,
  ];

  for (const pattern of routePatterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      if (!routes.includes(match[1])) {
        routes.push(match[1]);
      }
    }
  }

  return routes;
}

function generateTestId(
  elementName: string,
  label: string | null,
  name: string | null,
  id: string | null
): string {
  // Priority: existing name/id > label > generic
  const base = name || id || label || elementName;

  // Convert to kebab-case
  const kebab = base
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  // Add element type suffix if not already present
  const suffix = `-${elementName}`;
  if (!kebab.endsWith(suffix) && !kebab.endsWith('-btn') && !kebab.endsWith('-input')) {
    return `${kebab}${suffix}`;
  }

  return kebab;
}
