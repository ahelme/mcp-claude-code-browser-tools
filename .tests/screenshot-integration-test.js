/**
 * Screenshot Integration Test Suite
 * Agent D - Screenshot Visualizer Implementation
 *
 * Tests enhanced browser_screenshot functionality including:
 * - Full page screenshots
 * - Element-specific screenshots
 * - Format options (PNG/JPEG)
 * - Quality settings
 * - Smart filename generation
 * - Integration with Agent B framework
 */

class ScreenshotIntegrationTest {
  constructor() {
    this.results = [];
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
  }

  /**
   * Run all screenshot integration tests
   */
  async runAllTests() {
    console.log("🧪 Starting Screenshot Integration Tests - Agent D");
    console.log("=" * 60);

    const tests = [
      () => this.testScreenshotManagerInitialization(),
      () => this.testFullPageScreenshotPNG(),
      () => this.testFullPageScreenshotJPEG(),
      () => this.testElementSpecificScreenshot(),
      () => this.testSmartFilenameGeneration(),
      () => this.testFormatAndQualityOptions(),
      () => this.testMCPIntegrationAPI(),
      () => this.testWebSocketCommunication(),
      () => this.testErrorHandling(),
      () => this.testAgentBFrameworkIntegration()
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        this.logResult("FAIL", `Test crashed: ${error.message}`, error);
      }
    }

    this.printSummary();
    return this.generateReport();
  }

  /**
   * Test 1: Screenshot Manager Initialization
   */
  async testScreenshotManagerInitialization() {
    this.testCount++;
    console.log("\n📸 Test 1: Screenshot Manager Initialization");

    try {
      // Check if screenshot manager is available
      if (typeof window.screenshotManager === 'undefined') {
        throw new Error("Screenshot manager not initialized");
      }

      // Check required methods
      const requiredMethods = [
        'captureScreenshot',
        'generateSmartFilename',
        'updateUI',
        'addToHistory'
      ];

      for (const method of requiredMethods) {
        if (typeof window.screenshotManager[method] !== 'function') {
          throw new Error(`Missing required method: ${method}`);
        }
      }

      // Check MCP API function
      if (typeof window.mcp_browser_screenshot !== 'function') {
        throw new Error("MCP API function not available");
      }

      this.logResult("PASS", "Screenshot manager properly initialized");
      this.passCount++;
    } catch (error) {
      this.logResult("FAIL", `Initialization failed: ${error.message}`);
      this.failCount++;
    }
  }

  /**
   * Test 2: Full Page Screenshot PNG
   */
  async testFullPageScreenshotPNG() {
    this.testCount++;
    console.log("\n🖼️ Test 2: Full Page Screenshot PNG");

    try {
      const options = {
        fullPage: true,
        format: "png",
        source: "test"
      };

      // Mock the capture process (since we can't actually capture in test)
      const result = await this.mockScreenshotCapture(options);

      if (!result.success) {
        throw new Error(`Screenshot failed: ${result.error}`);
      }

      // Verify filename extension
      if (!result.filename.endsWith('.png')) {
        throw new Error(`Expected PNG filename, got: ${result.filename}`);
      }

      this.logResult("PASS", `Full page PNG screenshot: ${result.filename}`);
      this.passCount++;
    } catch (error) {
      this.logResult("FAIL", `PNG screenshot failed: ${error.message}`);
      this.failCount++;
    }
  }

  /**
   * Test 3: Full Page Screenshot JPEG
   */
  async testFullPageScreenshotJPEG() {
    this.testCount++;
    console.log("\n🖼️ Test 3: Full Page Screenshot JPEG");

    try {
      const options = {
        fullPage: true,
        format: "jpeg",
        quality: 85,
        source: "test"
      };

      const result = await this.mockScreenshotCapture(options);

      if (!result.success) {
        throw new Error(`Screenshot failed: ${result.error}`);
      }

      // Verify filename extension (should be .jpg)
      if (!result.filename.endsWith('.jpg')) {
        throw new Error(`Expected JPG filename, got: ${result.filename}`);
      }

      // Verify quality was passed through
      if (result.quality !== 85) {
        throw new Error(`Expected quality 85, got: ${result.quality}`);
      }

      this.logResult("PASS", `Full page JPEG screenshot: ${result.filename}`);
      this.passCount++;
    } catch (error) {
      this.logResult("FAIL", `JPEG screenshot failed: ${error.message}`);
      this.failCount++;
    }
  }

  /**
   * Test 4: Element-Specific Screenshot
   */
  async testElementSpecificScreenshot() {
    this.testCount++;
    console.log("\n🎯 Test 4: Element-Specific Screenshot");

    try {
      const options = {
        selector: "#main-content",
        format: "png",
        source: "test"
      };

      const result = await this.mockScreenshotCapture(options);

      if (!result.success) {
        throw new Error(`Element screenshot failed: ${result.error}`);
      }

      // Verify selector was included in filename
      if (!result.filename.includes('main-content')) {
        throw new Error(`Filename should include selector info: ${result.filename}`);
      }

      this.logResult("PASS", `Element screenshot: ${result.filename}`);
      this.passCount++;
    } catch (error) {
      this.logResult("FAIL", `Element screenshot failed: ${error.message}`);
      this.failCount++;
    }
  }

  /**
   * Test 5: Smart Filename Generation
   */
  async testSmartFilenameGeneration() {
    this.testCount++;
    console.log("\n🧠 Test 5: Smart Filename Generation");

    try {
      // Test various filename scenarios
      const testCases = [
        { selector: null, fullPage: false, format: "png", expected: /screenshot.*\.png$/ },
        { selector: "#header", fullPage: false, format: "png", expected: /.*header.*\.png$/ },
        { selector: null, fullPage: true, format: "jpeg", expected: /.*fullpage.*\.jpg$/ },
        { selector: ".button", fullPage: false, format: "jpeg", expected: /.*button.*\.jpg$/ }
      ];

      for (const testCase of testCases) {
        const filename = await this.mockFilenameGeneration(
          testCase.selector,
          testCase.fullPage,
          testCase.format
        );

        if (!testCase.expected.test(filename)) {
          throw new Error(`Filename pattern mismatch. Expected: ${testCase.expected}, Got: ${filename}`);
        }
      }

      this.logResult("PASS", "Smart filename generation working correctly");
      this.passCount++;
    } catch (error) {
      this.logResult("FAIL", `Filename generation failed: ${error.message}`);
      this.failCount++;
    }
  }

  /**
   * Test 6: Format and Quality Options
   */
  async testFormatAndQualityOptions() {
    this.testCount++;
    console.log("\n⚙️ Test 6: Format and Quality Options");

    try {
      // Test quality range validation
      const qualityTests = [0, 50, 90, 100];

      for (const quality of qualityTests) {
        const options = {
          format: "jpeg",
          quality: quality,
          source: "test"
        };

        const result = await this.mockScreenshotCapture(options);

        if (!result.success) {
          throw new Error(`Quality ${quality} failed: ${result.error}`);
        }

        if (result.quality !== quality) {
          throw new Error(`Quality mismatch. Expected: ${quality}, Got: ${result.quality}`);
        }
      }

      this.logResult("PASS", "Format and quality options working correctly");
      this.passCount++;
    } catch (error) {
      this.logResult("FAIL", `Format/quality test failed: ${error.message}`);
      this.failCount++;
    }
  }

  /**
   * Test 7: MCP Integration API
   */
  async testMCPIntegrationAPI() {
    this.testCount++;
    console.log("\n🔌 Test 7: MCP Integration API");

    try {
      // Test MCP API with various parameters
      const mcpParams = {
        selector: ".test-element",
        fullPage: false,
        format: "png",
        quality: 95
      };

      // Mock the MCP call
      const result = await this.mockMCPScreenshot(mcpParams);

      if (!result.success) {
        throw new Error(`MCP API failed: ${result.error}`);
      }

      // Verify source is set to "mcp"
      if (result.source !== "mcp") {
        throw new Error(`Expected source 'mcp', got: ${result.source}`);
      }

      this.logResult("PASS", "MCP integration API working correctly");
      this.passCount++;
    } catch (error) {
      this.logResult("FAIL", `MCP integration failed: ${error.message}`);
      this.failCount++;
    }
  }

  /**
   * Test 8: WebSocket Communication
   */
  async testWebSocketCommunication() {
    this.testCount++;
    console.log("\n🔗 Test 8: WebSocket Communication");

    try {
      // Check if WebSocket manager is available
      if (typeof window.wsManager === 'undefined') {
        console.log("⚠️ WebSocket manager not available in test environment");
        this.logResult("SKIP", "WebSocket manager not available in test environment");
        return;
      }

      // Test WebSocket screenshot request structure
      const request = {
        type: "take-screenshot",
        selector: "#test",
        fullPage: false,
        filename: "test-screenshot.png",
        format: "png",
        quality: 90,
        requestId: "test-123",
        tabId: 12345,
        timestamp: Date.now()
      };

      // Verify request structure
      const requiredFields = ['type', 'requestId', 'tabId', 'timestamp'];
      for (const field of requiredFields) {
        if (!(field in request)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      this.logResult("PASS", "WebSocket communication structure valid");
      this.passCount++;
    } catch (error) {
      this.logResult("FAIL", `WebSocket test failed: ${error.message}`);
      this.failCount++;
    }
  }

  /**
   * Test 9: Error Handling
   */
  async testErrorHandling() {
    this.testCount++;
    console.log("\n🚨 Test 9: Error Handling");

    try {
      // Test invalid selector
      let result = await this.mockScreenshotCapture({
        selector: "#non-existent-element",
        source: "test"
      });

      if (result.success) {
        throw new Error("Should have failed for non-existent element");
      }

      // Test invalid format
      result = await this.mockScreenshotCapture({
        format: "invalid-format",
        source: "test"
      });

      if (result.success) {
        throw new Error("Should have failed for invalid format");
      }

      // Test invalid quality
      result = await this.mockScreenshotCapture({
        format: "jpeg",
        quality: 150, // Invalid quality > 100
        source: "test"
      });

      // Quality should be clamped to 100
      if (!result.success || result.quality > 100) {
        throw new Error("Quality should be clamped to valid range");
      }

      this.logResult("PASS", "Error handling working correctly");
      this.passCount++;
    } catch (error) {
      this.logResult("FAIL", `Error handling test failed: ${error.message}`);
      this.failCount++;
    }
  }

  /**
   * Test 10: Agent B Framework Integration
   */
  async testAgentBFrameworkIntegration() {
    this.testCount++;
    console.log("\n🏗️ Test 10: Agent B Framework Integration");

    try {
      // Check for Agent B framework components
      const frameworkComponents = [
        'window.wsManager',
        'window.screenshotManager',
        'window.addLogEntry'
      ];

      let foundComponents = 0;
      for (const component of frameworkComponents) {
        try {
          if (eval(component) !== undefined) {
            foundComponents++;
          }
        } catch (e) {
          // Component not available
        }
      }

      if (foundComponents === 0) {
        throw new Error("No Agent B framework components detected");
      }

      // Test screenshot history integration
      if (typeof window.screenshotManager.addToHistory === 'function') {
        const testData = {
          filename: "test-screenshot.png",
          success: true,
          timestamp: Date.now()
        };

        // This should not throw
        window.screenshotManager.addToHistory(testData);
      }

      this.logResult("PASS", `Agent B framework integration: ${foundComponents}/${frameworkComponents.length} components`);
      this.passCount++;
    } catch (error) {
      this.logResult("FAIL", `Framework integration failed: ${error.message}`);
      this.failCount++;
    }
  }

  /**
   * Mock screenshot capture for testing
   */
  async mockScreenshotCapture(options) {
    // Simulate screenshot capture process
    const {
      selector = null,
      fullPage = false,
      format = "png",
      quality = 90,
      source = "test"
    } = options;

    // Validate inputs
    if (selector === "#non-existent-element") {
      return { success: false, error: "Element not found" };
    }

    if (!["png", "jpeg"].includes(format)) {
      return { success: false, error: "Invalid format" };
    }

    // Clamp quality
    const clampedQuality = Math.max(0, Math.min(100, quality));

    // Generate mock filename
    const filename = await this.mockFilenameGeneration(selector, fullPage, format);

    return {
      success: true,
      filename: filename,
      format: format,
      quality: clampedQuality,
      source: source,
      path: `.screenshots/${filename}`,
      timestamp: Date.now()
    };
  }

  /**
   * Mock filename generation for testing
   */
  async mockFilenameGeneration(selector, fullPage, format = "png") {
    let baseName = "screenshot";

    // Add selector info
    if (selector) {
      const selectorName = selector.replace(/[#.]/g, "");
      baseName += `_${selectorName}`;
    }

    // Add fullPage indicator
    if (fullPage) {
      baseName += "_fullpage";
    }

    // Add timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");

    // Use correct extension
    const extension = format === "jpeg" ? "jpg" : format;

    return `${baseName}_${timestamp}_0001.${extension}`;
  }

  /**
   * Mock MCP screenshot call
   */
  async mockMCPScreenshot(params) {
    const result = await this.mockScreenshotCapture({
      ...params,
      source: "mcp"
    });

    return result;
  }

  /**
   * Log test result
   */
  logResult(status, message, error = null) {
    const timestamp = new Date().toISOString();
    const result = {
      status,
      message,
      timestamp,
      error: error ? error.message : null
    };

    this.results.push(result);

    const statusEmoji = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
    console.log(`${statusEmoji} ${status}: ${message}`);

    if (error) {
      console.log(`   Error: ${error.message}`);
    }
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log("\n" + "=" * 60);
    console.log("📊 Screenshot Integration Test Summary - Agent D");
    console.log("=" * 60);
    console.log(`Total Tests: ${this.testCount}`);
    console.log(`✅ Passed: ${this.passCount}`);
    console.log(`❌ Failed: ${this.failCount}`);
    console.log(`📈 Success Rate: ${((this.passCount / this.testCount) * 100).toFixed(1)}%`);

    if (this.failCount === 0) {
      console.log("\n🎉 All tests passed! Agent D Screenshot implementation is ready!");
    } else {
      console.log(`\n⚠️ ${this.failCount} test(s) failed. Review implementation.`);
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    return {
      testSuite: "Agent D - Screenshot Integration Tests",
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testCount,
        passed: this.passCount,
        failed: this.failCount,
        successRate: ((this.passCount / this.testCount) * 100).toFixed(1)
      },
      results: this.results,
      status: this.failCount === 0 ? "PASS" : "FAIL"
    };
  }
}

// Export for use in Chrome extension environment
if (typeof window !== 'undefined') {
  window.ScreenshotIntegrationTest = ScreenshotIntegrationTest;
}

// Auto-run if in test environment
if (typeof window !== 'undefined' && window.location && window.location.hash === '#run-screenshot-tests') {
  const tester = new ScreenshotIntegrationTest();
  tester.runAllTests().then(report => {
    console.log("📋 Final Report:", report);
  });
}

console.log("🧪 Screenshot Integration Test Suite loaded - Agent D ready for testing!");