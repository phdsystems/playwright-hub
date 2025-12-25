import { describe, test, expect, beforeAll } from 'bun:test';
import { join } from 'path';
import { analyzeReactFile } from '../src/analyzers/react';

const FIXTURES_DIR = join(import.meta.dir, 'fixtures');

describe('React Analyzer', () => {
  describe('analyzeReactFile', () => {
    test('should parse SimpleButton component', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'SimpleButton.tsx'));

      expect(result).not.toBeNull();
      expect(result!.name).toBe('SimpleButton');
      expect(result!.framework).toBe('react');
    });

    test('should detect button with data-testid', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'SimpleButton.tsx'));

      expect(result!.elements).toHaveLength(1);
      expect(result!.elements[0].type).toBe('button');
      expect(result!.elements[0].testId).toBe('simple-button');
      expect(result!.elements[0].handlers).toContain('onClick');
    });

    test('should detect props interface', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'SimpleButton.tsx'));

      expect(result!.props.length).toBeGreaterThanOrEqual(2);
      expect(result!.props.find(p => p.name === 'label')).toBeDefined();
      expect(result!.props.find(p => p.name === 'onClick')).toBeDefined();
    });

    test('should parse LoginForm with multiple elements', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'LoginForm.tsx'));

      expect(result).not.toBeNull();
      expect(result!.name).toBe('LoginForm');

      // Should find: form, 2 inputs (email, password), checkbox, button, link
      expect(result!.elements.length).toBeGreaterThanOrEqual(5);
    });

    test('should detect form element', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'LoginForm.tsx'));

      const form = result!.elements.find(e => e.type === 'form');
      expect(form).toBeDefined();
      expect(form!.testId).toBe('login-form');
      expect(form!.handlers).toContain('onSubmit');
    });

    test('should detect input elements', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'LoginForm.tsx'));

      const inputs = result!.elements.filter(e => e.type === 'input');
      expect(inputs.length).toBeGreaterThanOrEqual(2);

      const emailInput = inputs.find(i => i.testId === 'email-input');
      expect(emailInput).toBeDefined();
      expect(emailInput!.inputType).toBe('email');
      expect(emailInput!.handlers).toContain('onChange');
    });

    test('should detect checkbox element', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'LoginForm.tsx'));

      const checkbox = result!.elements.find(e => e.type === 'checkbox');
      expect(checkbox).toBeDefined();
      expect(checkbox!.testId).toBe('remember-checkbox');
    });

    test('should detect link element', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'LoginForm.tsx'));

      const link = result!.elements.find(e => e.type === 'link');
      expect(link).toBeDefined();
      expect(link!.testId).toBe('forgot-password-link');
      expect(link!.href).toBe('/forgot-password');
    });

    test('should suggest testIds for elements without them', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'NoTestIds.tsx'));

      expect(result).not.toBeNull();

      // All elements should have suggested testIds but no actual testIds
      for (const element of result!.elements) {
        expect(element.testId).toBeUndefined();
        expect(element.suggestedTestId).toBeDefined();
        expect(element.suggestedTestId.length).toBeGreaterThan(0);
      }
    });

    test('should detect button without data-testid', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'NoTestIds.tsx'));

      const button = result!.elements.find(e => e.type === 'button');
      expect(button).toBeDefined();
      expect(button!.testId).toBeUndefined();
      expect(button!.handlers).toContain('onClick');
    });

    test('should detect input with name attribute', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'NoTestIds.tsx'));

      const input = result!.elements.find(e => e.type === 'input');
      expect(input).toBeDefined();
      // Should suggest testId based on name
      expect(input!.suggestedTestId).toContain('username');
    });

    test('should detect select element', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'NoTestIds.tsx'));

      const select = result!.elements.find(e => e.type === 'select');
      expect(select).toBeDefined();
      expect(select!.handlers).toContain('onChange');
    });

    test('should detect textarea element', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'NoTestIds.tsx'));

      const textarea = result!.elements.find(e => e.type === 'textarea');
      expect(textarea).toBeDefined();
      expect(textarea!.handlers).toContain('onBlur');
    });

    test('should return null for non-component files', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'NotAComponent.ts'));

      // Should return null since it's not a React component
      expect(result).toBeNull();
    });

    test('should extract line numbers for elements', () => {
      const result = analyzeReactFile(join(FIXTURES_DIR, 'LoginForm.tsx'));

      for (const element of result!.elements) {
        expect(element.line).toBeGreaterThan(0);
      }
    });
  });
});
