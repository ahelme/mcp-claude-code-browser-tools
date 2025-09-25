/**
 * URL Validation Unit Tests
 *
 * Comprehensive test suite for URL validation edge cases in NavigationHandler
 * Tests security validation, protocol handling, and edge case scenarios
 */

class URLValidationTester {
  constructor() {
    this.testResults = [];
    this.testSuite = 'URL Validation Edge Cases';
    console.log(`🧪 ${this.testSuite} - Test Suite Initialized`);
  }

  /**
   * Run all URL validation tests
   */
  async runAllTests() {
    console.log(`🚀 Starting ${this.testSuite} Test Suite...`);

    const testMethods = [
      this.testBasicValidUrls,
      this.testInvalidUrls,
      this.testSecurityBlocks,
      this.testProtocolHandling,
      this.testHostnameValidation,
      this.testEdgeCases,
      this.testNormalization
    ];

    for (const testMethod of testMethods) {
      try {
        await testMethod.call(this);
      } catch (error) {
        this.addResult(testMethod.name, false, `Test method failed: ${error.message}`);
      }
    }

    this.generateReport();
    return this.testResults;
  }

  /**
   * Test basic valid URLs
   */
  async testBasicValidUrls() {
    const testName = 'Basic Valid URLs';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const validUrls = [
      'https://example.com',
      'http://localhost:3000',
      'https://sub.domain.com/path?query=value',
      'https://example.com:8080/path#hash',
      'http://192.168.1.1',
      'https://example.com/path/with/many/segments',
      'https://example.com/search?q=test%20query',
      'https://user:pass@example.com'
    ];

    let allValid = true;
    const results = [];

    for (const url of validUrls) {
      const result = handler.validateUrl(url);
      if (!result.isValid) {
        allValid = false;
        results.push(`${url}: ${result.error}`);
      }
    }

    if (allValid) {
      this.addResult(testName, true, `All ${validUrls.length} valid URLs passed validation`);
    } else {
      this.addResult(testName, false, `Some valid URLs failed: ${results.join(', ')}`);
    }
  }

  /**
   * Test invalid URLs that should be rejected
   */
  async testInvalidUrls() {
    const testName = 'Invalid URLs Rejection';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const invalidUrls = [
      '',
      '   ',
      'not-a-url',
      'ftp://example.com',
      'javascript:alert(1)',
      'vbscript:msgbox(1)',
      'about:blank',
      'chrome-extension://abc123',
      'moz-extension://xyz789',
      'resource://internal'
    ];

    let allInvalid = true;
    const failures = [];

    for (const url of invalidUrls) {
      const result = handler.validateUrl(url);
      if (result.isValid) {
        allInvalid = false;
        failures.push(url);
      }
    }

    if (allInvalid) {
      this.addResult(testName, true, `All ${invalidUrls.length} invalid URLs properly rejected`);
    } else {
      this.addResult(testName, false, `Some invalid URLs incorrectly passed: ${failures.join(', ')}`);
    }
  }

  /**
   * Test security blocks for dangerous protocols
   */
  async testSecurityBlocks() {
    const testName = 'Security Protocol Blocks';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const dangerousUrls = [
      'file:///etc/passwd',
      'file:///C:/Windows/System32/',
      'chrome://settings',
      'chrome://flags',
      'data:text/html,<script>alert(1)</script>',
      'data:text/plain,sensitive data',
      'chrome-extension://internal',
      'moz-extension://firefox-ext'
    ];

    let allBlocked = true;
    const bypassed = [];

    for (const url of dangerousUrls) {
      const result = handler.validateUrl(url);
      if (result.isValid) {
        allBlocked = false;
        bypassed.push(url);
      } else {
        // Check that error message mentions security
        if (!result.error.toLowerCase().includes('security')) {
          console.warn(`Security URL blocked but error doesn't mention security: ${url} - ${result.error}`);
        }
      }
    }

    if (allBlocked) {
      this.addResult(testName, true, `All ${dangerousUrls.length} dangerous URLs properly blocked`);
    } else {
      this.addResult(testName, false, `Security bypass detected: ${bypassed.join(', ')}`);
    }
  }

  /**
   * Test protocol handling and auto-correction
   */
  async testProtocolHandling() {
    const testName = 'Protocol Handling';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const testCases = [
      { input: 'example.com', expected: 'https://example.com' },
      { input: 'sub.example.com/path', expected: 'https://sub.example.com/path' },
      { input: 'localhost:3000', expected: 'https://localhost:3000' }
    ];

    let allCorrect = true;
    const failures = [];

    for (const testCase of testCases) {
      const result = handler.validateUrl(testCase.input);
      if (!result.isValid) {
        allCorrect = false;
        failures.push(`${testCase.input}: validation failed - ${result.error}`);
      } else if (result.url !== testCase.expected) {
        allCorrect = false;
        failures.push(`${testCase.input}: expected ${testCase.expected}, got ${result.url}`);
      }
    }

    if (allCorrect) {
      this.addResult(testName, true, `All ${testCases.length} protocol handling cases passed`);
    } else {
      this.addResult(testName, false, `Protocol handling failures: ${failures.join(', ')}`);
    }
  }

  /**
   * Test hostname validation edge cases
   */
  async testHostnameValidation() {
    const testName = 'Hostname Validation';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const invalidHostnames = [
      'http://',
      'https:///',
      'http://.',
      'http://..',
      'http://...',
      'http:// ',
      'https://.',
      'http://[invalid'
    ];

    let allRejected = true;
    const bypassed = [];

    for (const url of invalidHostnames) {
      const result = handler.validateUrl(url);
      if (result.isValid) {
        allRejected = false;
        bypassed.push(url);
      }
    }

    if (allRejected) {
      this.addResult(testName, true, `All ${invalidHostnames.length} invalid hostnames rejected`);
    } else {
      this.addResult(testName, false, `Invalid hostnames bypassed validation: ${bypassed.join(', ')}`);
    }
  }

  /**
   * Test URL edge cases and boundary conditions
   */
  async testEdgeCases() {
    const testName = 'URL Edge Cases';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const edgeCases = [
      { input: null, shouldPass: false, description: 'null input' },
      { input: undefined, shouldPass: false, description: 'undefined input' },
      { input: 123, shouldPass: false, description: 'numeric input' },
      { input: {}, shouldPass: false, description: 'object input' },
      { input: [], shouldPass: false, description: 'array input' },
      { input: 'https://example.com' + 'a'.repeat(2000), shouldPass: false, description: 'extremely long URL' },
      { input: 'https://example.com\n', shouldPass: true, description: 'URL with newline (should be trimmed)' },
      { input: '  https://example.com  ', shouldPass: true, description: 'URL with spaces (should be trimmed)' }
    ];

    let allCorrect = true;
    const failures = [];

    for (const testCase of edgeCases) {
      try {
        const result = handler.validateUrl(testCase.input);
        const passed = result.isValid;

        if (passed !== testCase.shouldPass) {
          allCorrect = false;
          failures.push(`${testCase.description}: expected ${testCase.shouldPass ? 'valid' : 'invalid'}, got ${passed ? 'valid' : 'invalid'}`);
        }
      } catch (error) {
        if (testCase.shouldPass) {
          allCorrect = false;
          failures.push(`${testCase.description}: unexpected error - ${error.message}`);
        }
        // Errors are expected for some invalid inputs
      }
    }

    if (allCorrect) {
      this.addResult(testName, true, `All ${edgeCases.length} edge cases handled correctly`);
    } else {
      this.addResult(testName, false, `Edge case failures: ${failures.join(', ')}`);
    }
  }

  /**
   * Test URL normalization consistency
   */
  async testNormalization() {
    const testName = 'URL Normalization';
    console.log(`🧪 Running: ${testName}`);

    if (!window.NavigationHandler) {
      this.addResult(testName, false, 'NavigationHandler not available');
      return;
    }

    const handler = new window.NavigationHandler();
    const normalizationTests = [
      { input: 'example.com', expected: 'https://example.com' },
      { input: 'https://example.com/', expected: 'https://example.com' },
      { input: 'https://example.com/path/', expected: 'https://example.com/path' },
      { input: 'HTTPS://EXAMPLE.COM', expected: 'https://example.com' }
    ];

    let allNormalized = true;
    const failures = [];

    for (const test of normalizationTests) {
      const normalized = handler.normalizeUrl(test.input);
      if (normalized !== test.expected) {
        allNormalized = false;
        failures.push(`${test.input}: expected ${test.expected}, got ${normalized}`);
      }
    }

    if (allNormalized) {
      this.addResult(testName, true, `All ${normalizationTests.length} normalization tests passed`);
    } else {
      this.addResult(testName, false, `Normalization failures: ${failures.join(', ')}`);
    }
  }

  /**
   * Add test result to collection
   */
  addResult(testName, passed, message) {
    const result = {
      testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };

    this.testResults.push(result);

    const emoji = passed ? '✅' : '❌';
    console.log(`${emoji} ${testName}: ${message}`);
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    console.log(`\n🧪 ${this.testSuite.toUpperCase()} - TEST REPORT`);
    console.log('━'.repeat(60));
    console.log(`📊 Summary: ${passed}/${total} tests passed (${passRate}%)`);
    console.log(`⏰ Completed: ${new Date().toISOString()}\n`);

    this.testResults.forEach((result, index) => {
      const emoji = result.passed ? '✅' : '❌';
      console.log(`${index + 1}. ${emoji} ${result.testName}`);
      console.log(`   ${result.message}`);
    });

    console.log(`\n🎯 Validation Status:`);
    if (passRate === 100) {
      console.log('✅ EXCELLENT: URL validation is robust and secure');
    } else if (passRate >= 80) {
      console.log('⚠️  GOOD: URL validation mostly working, minor issues detected');
    } else {
      console.log('❌ CRITICAL: URL validation has security vulnerabilities that need fixing');
    }

    return { passed, total, passRate, results: this.testResults };
  }
}

// Make tester globally available
window.URLValidationTester = URLValidationTester;

// Auto-run tests if in testing mode
if (window.location.search.includes('urltest=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
      const tester = new URLValidationTester();
      await tester.runAllTests();
    }, 1000);
  });
}

console.log('🧪 URL Validation Test Suite loaded - Run: new URLValidationTester().runAllTests()');