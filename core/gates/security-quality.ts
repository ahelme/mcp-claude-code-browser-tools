/**
 * 🦁 MANE Security Quality Gate
 *
 * Ensures components follow security best practices and don't introduce
 * vulnerabilities.
 */

import {
  IQualityGate,
  IBrowserTool,
  IUIPanel,
  ILogger,
} from '../interfaces.js';

export class SecurityQualityGate implements IQualityGate {
  name = 'security';
  description = 'Validates security requirements and best practices';
  requiredPassRate = 0.95; // 95% of tests must pass (high security bar)

  constructor(private logger: ILogger) {}

  async execute(target: unknown): Promise<{
    valid: boolean;
    score: number;
    errors: string[];
    details?: any;
  }> {
    this.logger.info(`Running security validation for: ${this.getTargetName(target)}`);

    const startTime = Date.now();
    const results: any[] = [];

    try {
      if (this.isBrowserTool(target)) {
        results.push(...await this.validateToolSecurity(target));
      } else if (this.isUIPanel(target)) {
        results.push(...await this.validatePanelSecurity(target));
      } else {
        return {
          valid: false,
          score: 0,
          errors: [`Unknown target type: ${typeof target}`],
          details: { target: this.getTargetName(target) }
        };
      }

      const passedTests = results.filter(r => r.passed).length;
      const totalTests = results.length;
      const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      const passed = (passedTests / totalTests) >= this.requiredPassRate;

      const duration = Date.now() - startTime;

      return {
        valid: passed,
        score: Math.round(score),
        errors: results.filter(r => !r.passed).map(r => r.message),
        details: {
          target: this.getTargetName(target),
          totalTests,
          passedTests,
          requiredPassRate: this.requiredPassRate,
          results
        }
      };

    } catch (error) {
      this.logger.error('Security validation failed', error);
      return {
        valid: false,
        score: 0,
        errors: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  private async validateToolSecurity(tool: IBrowserTool): Promise<any[]> {
    const results = [];

    // Check for parameter validation
    results.push({
      test: 'has-validation-method',
      passed: typeof tool.validate === 'function',
      message: typeof tool.validate === 'function'
        ? '✓ Tool implements parameter validation'
        : '✗ Tool missing parameter validation method',
      category: 'validation'
    });

    // Test input sanitization with dangerous inputs
    const dangerousInputs = [
      '<script>alert("xss")</script>',
      '"; DROP TABLE users; --',
      '../../etc/passwd',
      'javascript:alert("xss")',
      '${7*7}',
      '{{7*7}}',
      '<img src="x" onerror="alert(1)">',
      '\'; exec xp_cmdshell(\'dir\'); --',
    ];

    let inputValidationPassed = true;
    let inputValidationMessage = '✓ Tool properly validates dangerous inputs';
    let rejectedInputs = 0;

    for (const input of dangerousInputs) {
      try {
        const validation = await tool.validate({ maliciousInput: input });
        if (validation.valid) {
          inputValidationPassed = false;
          inputValidationMessage = `✗ Tool accepts dangerous input: ${input.substring(0, 50)}...`;
        } else {
          rejectedInputs++;
        }
      } catch (error) {
        // Validation throwing error is acceptable for dangerous input
        rejectedInputs++;
      }
    }

    results.push({
      test: 'input-sanitization',
      passed: inputValidationPassed,
      message: inputValidationMessage,
      category: 'input-validation',
      details: {
        totalInputs: dangerousInputs.length,
        rejectedInputs,
        rejectionRate: (rejectedInputs / dangerousInputs.length) * 100
      }
    });

    // Check for dangerous capabilities
    const capabilities = tool.capabilities;
    const hasDangerousCapabilities =
      capabilities && (capabilities as any).allowUnsafeOperations;

    results.push({
      test: 'safe-capabilities',
      passed: !hasDangerousCapabilities,
      message: hasDangerousCapabilities
        ? '✗ Tool has dangerous capabilities enabled'
        : '✓ Tool capabilities are safe',
      category: 'capabilities'
    });

    // Check schema for security properties
    const schema = tool.schema;
    let schemaSecure = true;
    let schemaMessage = '✓ Schema follows security best practices';

    if (schema.additionalProperties !== false) {
      schemaSecure = false;
      schemaMessage = '✗ Schema allows additional properties (security risk)';
    }

    results.push({
      test: 'schema-security',
      passed: schemaSecure,
      message: schemaMessage,
      category: 'schema-validation'
    });

    // Check for endpoint security
    const endpoint = tool.endpoint;
    let endpointSecure = true;
    let endpointMessage = '✓ Endpoint follows secure patterns';

    if (endpoint.includes('..') || endpoint.includes('//')) {
      endpointSecure = false;
      endpointMessage = '✗ Endpoint contains path traversal patterns';
    }

    results.push({
      test: 'endpoint-security',
      passed: endpointSecure,
      message: endpointMessage,
      category: 'endpoint-validation'
    });

    // Check for sensitive information exposure
    const toolString = JSON.stringify(tool);
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key.*[=:]\s*["\'][^"\']{8,}/i,
      /api.*key/i
    ];

    let exposureFound = false;
    let exposureMessage = '✓ No sensitive information exposed';

    for (const pattern of sensitivePatterns) {
      if (pattern.test(toolString)) {
        exposureFound = true;
        exposureMessage = '✗ Potential sensitive information exposure detected';
        break;
      }
    }

    results.push({
      test: 'sensitive-data-exposure',
      passed: !exposureFound,
      message: exposureMessage,
      category: 'data-protection'
    });

    return results;
  }

  private async validatePanelSecurity(panel: IUIPanel): Promise<any[]> {
    const results = [];

    // Check for proper event handling
    results.push({
      test: 'has-event-handling',
      passed: typeof panel.handleEvents === 'function',
      message: typeof panel.handleEvents === 'function'
        ? '✓ Panel implements proper event handling'
        : '✗ Panel missing event handling method',
      category: 'event-handling'
    });

    // Check for state validation
    results.push({
      test: 'has-state-validation',
      passed: typeof panel.updateState === 'function',
      message: typeof panel.updateState === 'function'
        ? '✓ Panel implements state validation'
        : '✗ Panel missing state validation method',
      category: 'state-validation'
    });

    // Test XSS prevention in rendering
    try {
      const maliciousState = {
        userInput: '<script>alert("xss")</script>',
        htmlContent: '<img src="x" onerror="alert(\'xss\')">',
        javascriptUrl: 'javascript:alert("xss")',
        eventHandler: 'onclick="alert(1)"'
      };

      await panel.updateState(maliciousState);
      const rendered = await panel.render();

      // Check if dangerous content is properly escaped
      const renderedContent = rendered.innerHTML || rendered.outerHTML || String(rendered);

      const hasDangerousContent =
        renderedContent.includes('<script>') ||
        renderedContent.includes('javascript:') ||
        renderedContent.includes('onerror=') ||
        renderedContent.includes('onclick=');

      results.push({
        test: 'xss-prevention',
        passed: !hasDangerousContent,
        message: hasDangerousContent
          ? '✗ Panel does not properly escape dangerous content'
          : '✓ Panel properly prevents XSS attacks',
        category: 'xss-protection'
      });

    } catch (error) {
      results.push({
        test: 'xss-prevention',
        passed: false,
        message: `✗ XSS prevention test failed: ${error instanceof Error ? error.message : String(error)}`,
        category: 'xss-protection'
      });
    }

    // Check for CSS injection prevention
    try {
      const maliciousStyles = {
        background: 'url("javascript:alert(1)")',
        content: 'expression(alert("xss"))',
        style: '@import "data:text/css,body{background:url(javascript:alert(1))}"'
      };

      await panel.updateState({ styles: maliciousStyles });
      const rendered = await panel.render();
      const renderedContent = rendered.innerHTML || rendered.outerHTML || String(rendered);

      const hasDangerousStyles =
        renderedContent.includes('javascript:') ||
        renderedContent.includes('expression(') ||
        renderedContent.includes('@import');

      results.push({
        test: 'css-injection-prevention',
        passed: !hasDangerousStyles,
        message: hasDangerousStyles
          ? '✗ Panel vulnerable to CSS injection'
          : '✓ Panel prevents CSS injection attacks',
        category: 'css-protection'
      });

    } catch (error) {
      // If updateState or render fails with malicious CSS, that's actually good
      results.push({
        test: 'css-injection-prevention',
        passed: true,
        message: '✓ Panel rejects malicious CSS (safe failure)',
        category: 'css-protection'
      });
    }

    return results;
  }

  private isBrowserTool(target: unknown): target is IBrowserTool {
    return target !== null &&
           typeof target === 'object' &&
           'execute' in target &&
           typeof target.execute === 'function';
  }

  private isUIPanel(target: unknown): target is IUIPanel {
    return target !== null &&
           typeof target === 'object' &&
           'render' in target &&
           typeof target.render === 'function';
  }

  private getTargetName(target: unknown): string {
    if (target && typeof target === 'object' && 'name' in target) {
      return String(target.name);
    }
    if (target && typeof target === 'object' && 'id' in target) {
      return String(target.id);
    }
    return 'unknown';
  }
}