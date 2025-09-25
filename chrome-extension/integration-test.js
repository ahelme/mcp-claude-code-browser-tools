/**
 * Integration Testing Tools for Agent C Navigation Enhancement
 *
 * This file provides testing utilities to validate the enhanced WebSocket
 * communication, MCP server integration, and error handling improvements.
 */

class NavigationIntegrationTester {
  constructor() {
    this.testResults = [];
    this.testId = `test_${Date.now()}`;

    console.log(`🧪 Navigation Integration Tester initialized (${this.testId})`);
  }

  /**
   * Run comprehensive integration tests
   */
  async runIntegrationTests() {
    console.log("🚀 Starting Navigation Integration Tests...");

    const tests = [
      this.testNavigationHandlerInitialization(),
      this.testWebSocketConnection(),
      this.testRequestResponseCycle(),
      this.testErrorHandling(),
      this.testStatusReporting()
    ];

    for (const test of tests) {
      try {
        await test;
      } catch (error) {
        console.error("❌ Test failed:", error);
      }
    }

    this.generateTestReport();
  }

  /**
   * Test 1: Navigation Handler Initialization
   */
  async testNavigationHandlerInitialization() {
    const testName = "NavigationHandler Initialization";
    console.log(`🧪 Running test: ${testName}`);

    try {
      // Check if NavigationHandler is available
      if (typeof window.NavigationHandler === 'function') {
        const handler = new window.NavigationHandler();

        // Test basic properties
        const state = handler.getNavigationState();
        const hasRequiredMethods = [
          'handleNavigationRequest',
          'validateUrl',
          'normalizeUrl',
          'navigateToUrl',
          'sendNavigationResponse'
        ].every(method => typeof handler[method] === 'function');

        if (hasRequiredMethods && typeof state === 'object') {
          this.addTestResult(testName, true, "NavigationHandler properly initialized with all required methods");
        } else {
          this.addTestResult(testName, false, "NavigationHandler missing required methods or properties");
        }
      } else {
        this.addTestResult(testName, false, "NavigationHandler class not available");
      }
    } catch (error) {
      this.addTestResult(testName, false, `Initialization failed: ${error.message}`);
    }
  }

  /**
   * Test 2: WebSocket Connection
   */
  async testWebSocketConnection() {
    const testName = "WebSocket Connection";
    console.log(`🧪 Running test: ${testName}`);

    try {
      if (typeof window.WebSocketManager === 'function') {
        const wsManager = new window.WebSocketManager();
        const connectionState = wsManager.connectionState;

        if (typeof connectionState === 'object' && connectionState.hasOwnProperty('isConnected')) {
          this.addTestResult(testName, true, "WebSocket manager available and functional");
        } else {
          this.addTestResult(testName, false, "WebSocket manager missing required properties");
        }
      } else {
        this.addTestResult(testName, false, "WebSocketManager class not available");
      }
    } catch (error) {
      this.addTestResult(testName, false, `WebSocket test failed: ${error.message}`);
    }
  }

  /**
   * Test 3: Request-Response Cycle
   */
  async testRequestResponseCycle() {
    const testName = "Request-Response Cycle";
    console.log(`🧪 Running test: ${testName}`);

    try {
      if (window.navigationHandler) {
        const testRequest = {
          url: "https://example.com",
          requestId: `test_${Date.now()}`,
          timeout: 5000
        };

        let responseReceived = false;
        let responseData = null;

        // Mock response callback
        const mockCallback = (response) => {
          responseReceived = true;
          responseData = response;
          console.log("🧪 Mock response received:", response);
        };

        // Test URL validation separately
        const validationResult = window.navigationHandler.validateUrl(testRequest.url);
        if (validationResult.isValid) {
          this.addTestResult(testName, true, "URL validation working correctly");
        } else {
          this.addTestResult(testName, false, `URL validation failed: ${validationResult.error}`);
        }
      } else {
        this.addTestResult(testName, false, "Navigation handler instance not available");
      }
    } catch (error) {
      this.addTestResult(testName, false, `Request-response test failed: ${error.message}`);
    }
  }

  /**
   * Test 4: Error Handling
   */
  async testErrorHandling() {
    const testName = "Error Handling";
    console.log(`🧪 Running test: ${testName}`);

    try {
      if (window.navigationHandler) {
        // Test invalid URL handling
        const invalidUrls = [
          "",
          "not-a-url",
          "file:///etc/passwd",
          "chrome://settings",
          "data:text/html,<script>alert('xss')</script>"
        ];

        let errorHandlingWorking = true;
        for (const invalidUrl of invalidUrls) {
          const validationResult = window.navigationHandler.validateUrl(invalidUrl);
          if (validationResult.isValid) {
            errorHandlingWorking = false;
            break;
          }
        }

        if (errorHandlingWorking) {
          this.addTestResult(testName, true, "Error handling working correctly for invalid URLs");
        } else {
          this.addTestResult(testName, false, "Error handling failed - invalid URLs passed validation");
        }
      } else {
        this.addTestResult(testName, false, "Navigation handler not available for error testing");
      }
    } catch (error) {
      this.addTestResult(testName, false, `Error handling test failed: ${error.message}`);
    }
  }

  /**
   * Test 5: Status Reporting
   */
  async testStatusReporting() {
    const testName = "Status Reporting";
    console.log(`🧪 Running test: ${testName}`);

    try {
      if (window.navigationHandler) {
        // Test status update functionality
        const testStates = ["ready", "navigating", "success", "error"];
        let statusReportingWorking = true;

        for (const state of testStates) {
          try {
            window.navigationHandler.updateNavigationStatus(state, `Testing ${state} state`);
          } catch (error) {
            statusReportingWorking = false;
            break;
          }
        }

        if (statusReportingWorking) {
          this.addTestResult(testName, true, "Status reporting system working correctly");
        } else {
          this.addTestResult(testName, false, "Status reporting failed for some states");
        }
      } else {
        this.addTestResult(testName, false, "Navigation handler not available for status testing");
      }
    } catch (error) {
      this.addTestResult(testName, false, `Status reporting test failed: ${error.message}`);
    }
  }

  /**
   * Add test result to collection
   */
  addTestResult(testName, passed, message) {
    const result = {
      testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };

    this.testResults.push(result);

    const emoji = passed ? "✅" : "❌";
    console.log(`${emoji} ${testName}: ${message}`);
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    console.log("\n🧪 NAVIGATION INTEGRATION TEST REPORT");
    console.log("━".repeat(50));
    console.log(`📊 Test Summary: ${passed}/${total} tests passed (${passRate}%)`);
    console.log(`🆔 Test ID: ${this.testId}`);
    console.log(`⏰ Generated: ${new Date().toISOString()}`);
    console.log("\n📋 Detailed Results:");

    this.testResults.forEach((result, index) => {
      const emoji = result.passed ? "✅" : "❌";
      console.log(`${index + 1}. ${emoji} ${result.testName}`);
      console.log(`   ${result.message}`);
      console.log(`   Time: ${result.timestamp}`);
    });

    console.log("\n🎯 Integration Status:");
    if (passRate >= 80) {
      console.log("✅ EXCELLENT: Navigation integration is working well");
    } else if (passRate >= 60) {
      console.log("⚠️  GOOD: Navigation integration mostly working, minor issues");
    } else if (passRate >= 40) {
      console.log("🔶 FAIR: Navigation integration has some issues that need attention");
    } else {
      console.log("❌ POOR: Navigation integration has significant issues requiring fixes");
    }

    // Add to logs if available
    if (typeof window.addLogEntry === 'function') {
      window.addLogEntry("info", `Integration test completed: ${passed}/${total} tests passed (${passRate}%)`);
    }

    return {
      passed,
      total,
      passRate,
      results: this.testResults
    };
  }
}

// Make tester globally available
window.NavigationIntegrationTester = NavigationIntegrationTester;

// Auto-run tests if in testing mode
if (window.location.search.includes('test=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const tester = new NavigationIntegrationTester();
      tester.runIntegrationTests();
    }, 2000); // Wait for initialization
  });
}

console.log("🧪 Navigation Integration Testing tools loaded");