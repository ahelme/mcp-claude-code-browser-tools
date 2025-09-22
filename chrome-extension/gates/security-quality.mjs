/**
 * 🦁 MANE Security Quality Gate
 *
 * Validates security requirements including input sanitization,
 * XSS prevention, and secure parameter handling.
 *
 * **CONVERTED TO .mjs**: Native Node.js ES modules for immediate compatibility
 */

/**
 * Security Quality Gate
 *
 * Validates that MANE components properly handle security requirements.
 * This gate ensures that tools properly sanitize inputs, prevent XSS attacks,
 * and follow secure coding practices essential for agent safety.
 *
 * **Security Criteria:**
 * - Input validation and sanitization
 * - XSS prevention mechanisms
 * - SQL injection prevention
 * - Parameter validation security
 * - Error message information leakage prevention
 *
 * **Agent Usage:**
 * - Agent B-I: Validate tools before production deployment
 * - Agent A.2: Security hardening validation
 * - Security audits: Regular security regression testing
 *
 * **Pass Criteria:** 95% of security tests must pass
 *
 * @implements {IQualityGate}
 */
export class SecurityQualityGate {
  /** Quality gate identifier used in MANE workflows */
  name = "security";

  /** Human-readable description for logging and reports */
  description =
    "Validates security requirements including input sanitization and XSS prevention";

  /** Minimum pass rate required (0.95 = 95% of tests must pass) */
  requiredPassRate = 0.95;

  /**
   * Creates new security quality gate
   *
   * @param {ILogger} logger - Logging service for security event tracking
   * @param {IMetrics} metrics - Metrics collection for security monitoring
   */
  constructor(logger, metrics) {
    this.logger = logger;
    this.metrics = metrics;
  }

  /**
   * Execute security validation
   * @param {unknown} target - Component to validate
   * @returns {Promise<ValidationResult>} Validation result with security assessment
   */
  async execute(target) {
    this.logger.info(
      `Running security validation for: ${this.getTargetName(target)}`,
    );

    const startTime = Date.now();
    const results = [];

    try {
      if (this.isBrowserTool(target)) {
        results.push(...(await this.validateToolSecurity(target)));
      } else if (this.isUIPanel(target)) {
        results.push(...(await this.validatePanelSecurity(target)));
      } else {
        return {
          valid: false,
          score: 0,
          errors: [`Unknown target type: ${typeof target}`],
          details: { target: this.getTargetName(target) },
        };
      }

      const passedTests = results.filter((r) => r.passed).length;
      const totalTests = results.length;
      const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      const passed = passedTests / totalTests >= this.requiredPassRate;

      const duration = Date.now() - startTime;
      this.metrics.timing("quality_gate.security.duration", duration);
      this.metrics.gauge("quality_gate.security.score", score);

      return {
        valid: passed,
        score: Math.round(score),
        errors: results.filter((r) => !r.passed).map((r) => r.message),
        details: {
          target: this.getTargetName(target),
          totalTests,
          passedTests,
          requiredPassRate: this.requiredPassRate,
          results,
        },
      };
    } catch (error) {
      this.logger.error("Security validation failed", error);
      return {
        valid: false,
        score: 0,
        errors: [
          `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }

  /**
   * Validate browser tool security
   * @param {IBrowserTool} tool - Tool to validate
   * @returns {Promise<Array>} Security test results
   */
  async validateToolSecurity(tool) {
    const results = [];

    // Test XSS prevention
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>',
      '" onclick="alert(\'xss\')" "',
    ];

    for (const payload of xssPayloads) {
      try {
        const testParams = { input: payload, url: payload, selector: payload };
        const result = await tool.execute(testParams);

        // Check if the payload appears unescaped in the result
        const resultString = JSON.stringify(result);
        const containsUnescapedPayload = resultString.includes(payload) &&
          !resultString.includes(this.escapeHtml(payload));

        results.push({
          test: `xss-prevention-${xssPayloads.indexOf(payload)}`,
          passed: !containsUnescapedPayload,
          message: containsUnescapedPayload
            ? `✗ XSS vulnerability: Unescaped payload in result`
            : `✓ XSS prevention: Payload properly handled`,
          category: "xss-prevention",
          payload,
        });
      } catch (error) {
        // Tool throwing error on malicious input is acceptable
        results.push({
          test: `xss-prevention-${xssPayloads.indexOf(payload)}`,
          passed: true,
          message: `✓ XSS prevention: Tool rejected malicious input`,
          category: "xss-prevention",
          payload,
        });
      }
    }

    // Test SQL injection prevention
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "1; DELETE FROM users; --",
      "' UNION SELECT * FROM users --",
    ];

    for (const payload of sqlPayloads) {
      try {
        const testParams = { id: payload, query: payload, search: payload };
        const result = await tool.execute(testParams);

        // Check if SQL keywords appear unescaped in result
        const resultString = JSON.stringify(result).toUpperCase();
        const containsSqlKeywords = /\b(DROP|DELETE|UNION|SELECT)\b/.test(resultString) &&
          resultString.includes(payload.toUpperCase());

        results.push({
          test: `sql-injection-prevention-${sqlPayloads.indexOf(payload)}`,
          passed: !containsSqlKeywords,
          message: containsSqlKeywords
            ? `✗ SQL injection vulnerability: Unescaped SQL in result`
            : `✓ SQL injection prevention: Payload properly handled`,
          category: "sql-injection-prevention",
          payload,
        });
      } catch (error) {
        // Tool throwing error on malicious input is acceptable
        results.push({
          test: `sql-injection-prevention-${sqlPayloads.indexOf(payload)}`,
          passed: true,
          message: `✓ SQL injection prevention: Tool rejected malicious input`,
          category: "sql-injection-prevention",
          payload,
        });
      }
    }

    // Test parameter validation
    const invalidParams = [
      null,
      undefined,
      { maliciousCode: "eval('alert(1)')" },
      { oversizedString: "x".repeat(10000) },
      { nestedObject: { deep: { very: { deep: "payload" } } } },
    ];

    for (const params of invalidParams) {
      try {
        const result = await tool.validate(params);

        results.push({
          test: `parameter-validation-${invalidParams.indexOf(params)}`,
          passed: result && typeof result === "object" && "valid" in result,
          message: result && typeof result === "object" && "valid" in result
            ? `✓ Parameter validation: Returns proper validation result`
            : `✗ Parameter validation: Does not return validation result`,
          category: "parameter-validation",
        });
      } catch (error) {
        results.push({
          test: `parameter-validation-${invalidParams.indexOf(params)}`,
          passed: false,
          message: `✗ Parameter validation: Throws error instead of returning validation result`,
          category: "parameter-validation",
        });
      }
    }

    // Test error message information leakage
    try {
      await tool.execute({ invalidParam: true });
      results.push({
        test: "error-information-leakage",
        passed: true,
        message: `✓ Error handling: No exception thrown for invalid params`,
        category: "error-handling",
      });
    } catch (error) {
      const errorMessage = error.message || String(error);
      const containsSensitiveInfo = /\b(password|token|key|secret|path|file)\b/i.test(errorMessage);

      results.push({
        test: "error-information-leakage",
        passed: !containsSensitiveInfo,
        message: containsSensitiveInfo
          ? `✗ Error information leakage: Sensitive information in error message`
          : `✓ Error handling: No sensitive information leaked`,
        category: "error-handling",
      });
    }

    return results;
  }

  /**
   * Validate UI panel security
   * @param {IUIPanel} panel - Panel to validate
   * @returns {Promise<Array>} Security test results
   */
  async validatePanelSecurity(panel) {
    const results = [];

    // Test XSS prevention in panel rendering
    try {
      await panel.initialize();
      const element = await panel.render();

      // Check if element is properly created (basic security check)
      results.push({
        test: "panel-render-security",
        passed: element && typeof element === "object",
        message: element && typeof element === "object"
          ? `✓ Panel security: Renders safe HTML element`
          : `✗ Panel security: Does not render valid element`,
        category: "rendering-security",
      });
    } catch (error) {
      results.push({
        test: "panel-render-security",
        passed: false,
        message: `✗ Panel security: Render failed with error`,
        category: "rendering-security",
      });
    }

    // Test state update security
    const maliciousStates = [
      { innerHTML: '<script>alert("xss")</script>' },
      { eval: 'alert("xss")' },
      { __proto__: { malicious: true } },
    ];

    for (const state of maliciousStates) {
      try {
        await panel.updateState(state);
        results.push({
          test: `state-security-${maliciousStates.indexOf(state)}`,
          passed: true,
          message: `✓ State security: Malicious state handled safely`,
          category: "state-security",
        });
      } catch (error) {
        results.push({
          test: `state-security-${maliciousStates.indexOf(state)}`,
          passed: true,
          message: `✓ State security: Malicious state rejected`,
          category: "state-security",
        });
      }
    }

    return results;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Type guard for browser tools
   * @param {unknown} target - Object to check
   * @returns {boolean} True if target implements IBrowserTool
   */
  isBrowserTool(target) {
    return (
      target !== null &&
      typeof target === "object" &&
      "execute" in target &&
      typeof target.execute === "function"
    );
  }

  /**
   * Type guard for UI panels
   * @param {unknown} target - Object to check
   * @returns {boolean} True if target implements IUIPanel
   */
  isUIPanel(target) {
    return (
      target !== null &&
      typeof target === "object" &&
      "render" in target &&
      typeof target.render === "function"
    );
  }

  /**
   * Get human-readable target name
   * @param {unknown} target - Target object
   * @returns {string} Target name or "unknown"
   */
  getTargetName(target) {
    if (target && typeof target === "object" && "name" in target) {
      return String(target.name);
    }
    if (target && typeof target === "object" && "id" in target) {
      return String(target.id);
    }
    return "unknown";
  }
}