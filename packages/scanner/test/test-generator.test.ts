import { describe, test, expect } from 'bun:test';
import { generateTestFile } from '../src/generators/test-template';
import type { ComponentInfo } from '../src/types';

describe('Test Generator', () => {
  const mockComponentWithTestIds: ComponentInfo = {
    filePath: 'src/components/LoginForm.tsx',
    name: 'LoginForm',
    framework: 'react',
    elements: [
      {
        type: 'form',
        testId: 'login-form',
        suggestedTestId: 'login-form',
        line: 10,
        handlers: ['onSubmit'],
      },
      {
        type: 'input',
        testId: 'email-input',
        suggestedTestId: 'email-input',
        line: 15,
        handlers: ['onChange'],
        inputType: 'email',
      },
      {
        type: 'input',
        testId: 'password-input',
        suggestedTestId: 'password-input',
        line: 20,
        handlers: ['onChange'],
        inputType: 'password',
      },
      {
        type: 'button',
        testId: 'submit-button',
        suggestedTestId: 'submit-button',
        label: 'Sign In',
        line: 25,
        handlers: ['onClick'],
      },
      {
        type: 'link',
        testId: 'forgot-link',
        suggestedTestId: 'forgot-link',
        href: '/forgot-password',
        label: 'Forgot Password?',
        line: 30,
        handlers: [],
      },
      {
        type: 'checkbox',
        testId: 'remember-checkbox',
        suggestedTestId: 'remember-checkbox',
        label: 'Remember me',
        line: 35,
        handlers: [],
      },
    ],
    props: [],
    routes: ['/login'],
    hasTests: false,
  };

  const mockComponentWithoutTestIds: ComponentInfo = {
    filePath: 'src/components/SimpleForm.tsx',
    name: 'SimpleForm',
    framework: 'react',
    elements: [
      {
        type: 'button',
        suggestedTestId: 'submit-button',
        label: 'Submit',
        line: 10,
        handlers: ['onClick'],
      },
      {
        type: 'input',
        suggestedTestId: 'name-input',
        line: 15,
        handlers: ['onChange'],
        inputType: 'text',
      },
    ],
    props: [],
    routes: ['/'],
    hasTests: false,
  };

  describe('generateTestFile', () => {
    test('should generate test file with correct structure', () => {
      const result = generateTestFile(mockComponentWithTestIds);

      expect(result.componentName).toBe('LoginForm');
      expect(result.filePath).toContain('login-form.spec.ts');
      expect(result.testCount).toBeGreaterThan(0);
    });

    test('should include playwright imports', () => {
      const result = generateTestFile(mockComponentWithTestIds);

      expect(result.content).toContain("import { test, expect } from '@playwright/test'");
    });

    test('should include test.describe block', () => {
      const result = generateTestFile(mockComponentWithTestIds);

      expect(result.content).toContain("test.describe('LoginForm'");
    });

    test('should include beforeEach with page.goto', () => {
      const result = generateTestFile(mockComponentWithTestIds);

      expect(result.content).toContain('test.beforeEach');
      expect(result.content).toContain("await page.goto('/login')");
    });

    test('should generate visibility tests for elements with testId', () => {
      const result = generateTestFile(mockComponentWithTestIds);

      expect(result.content).toContain('[data-testid="email-input"]');
      expect(result.content).toContain('[data-testid="password-input"]');
      expect(result.content).toContain('toBeVisible()');
    });

    test('should generate button click tests', () => {
      const result = generateTestFile(mockComponentWithTestIds);

      expect(result.content).toContain("should handle Sign In click");
      expect(result.content).toContain('[data-testid="submit-button"]');
      expect(result.content).toContain('button.click()');
    });

    test('should generate link navigation tests', () => {
      const result = generateTestFile(mockComponentWithTestIds);

      expect(result.content).toContain('should navigate via');
      expect(result.content).toContain('[data-testid="forgot-link"]');
      expect(result.content).toContain('link.click()');
    });

    test('should generate checkbox tests', () => {
      const result = generateTestFile(mockComponentWithTestIds);

      expect(result.content).toContain('checkbox');
      expect(result.content).toContain('.check()');
      expect(result.content).toContain('.uncheck()');
      expect(result.content).toContain('toBeChecked()');
    });

    test('should generate form submission tests', () => {
      const result = generateTestFile(mockComponentWithTestIds);

      expect(result.content).toContain('should submit');
      expect(result.content).toContain('[data-testid="login-form"]');
    });

    test('should add TODO comments when addTodos is true', () => {
      const result = generateTestFile(mockComponentWithTestIds, { addTodos: true });

      expect(result.content).toContain('// TODO:');
    });

    test('should not add TODO comments when addTodos is false', () => {
      const result = generateTestFile(mockComponentWithTestIds, { addTodos: false });

      expect(result.content).not.toContain('// TODO:');
    });

    test('should generate comments for elements without testId', () => {
      const result = generateTestFile(mockComponentWithoutTestIds);

      // Should have comments suggesting to add data-testid
      expect(result.content).toContain('Add data-testid');
    });

    test('should use text selector for buttons without testId', () => {
      const result = generateTestFile(mockComponentWithoutTestIds);

      expect(result.content).toContain('button:has-text');
    });

    test('should use correct input type values for fill', () => {
      const result = generateTestFile(mockComponentWithTestIds);

      // Email input should suggest email value
      expect(result.content).toContain('test@example.com');
      // Password input should suggest password value
      expect(result.content).toContain('TestPassword123!');
    });

    test('should respect custom baseUrl', () => {
      const result = generateTestFile(mockComponentWithTestIds, {}, 'http://localhost:3000');

      // Should use the route from component, not baseUrl directly
      expect(result.content).toContain("await page.goto('/login')");
    });

    test('should generate correct file path in kebab-case', () => {
      const component: ComponentInfo = {
        ...mockComponentWithTestIds,
        name: 'UserProfileSettings',
        filePath: 'src/components/UserProfileSettings.tsx',
      };

      const result = generateTestFile(component);

      expect(result.filePath).toContain('user-profile-settings.spec.ts');
    });

    test('should skip disabled options when false', () => {
      const result = generateTestFile(mockComponentWithTestIds, {
        includeVisibility: false,
        includeInteractions: false,
        includeNavigation: false,
        includeForms: false,
      });

      // Should have minimal content
      expect(result.testCount).toBe(0);
    });

    test('should include auto-generated comment', () => {
      const result = generateTestFile(mockComponentWithTestIds);

      expect(result.content).toContain('Auto-generated tests');
      expect(result.content).toContain('@ux.qa/scanner');
    });
  });
});
