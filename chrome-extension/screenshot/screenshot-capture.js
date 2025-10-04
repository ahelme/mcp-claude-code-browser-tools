/**
 * Screenshot Capture Module - Screenshot Module
 *
 * Core capture logic for browser screenshots via Chrome tabs API and WebSocket.
 * Extracted from screenshot.js to create focused, maintainable module.
 *
 * @module screenshot/screenshot-capture
 * @version 1.0.0
 * @since 2025-10-02
 */

/**
 * Screenshot capture engine with dual communication pathways
 *
 * Features:
 * - Chrome tabs API integration for direct captures
 * - WebSocket communication for MCP integration
 * - Performance monitoring and timing metrics
 * - Result formatting and validation
 * - Error handling and recovery
 *
 * @class ScreenshotCaptureEngine
 *
 * @example
 * const captureEngine = new ScreenshotCaptureEngine();
 * const result = await captureEngine.captureViaBackground(
 *   null,     // selector
 *   true,     // fullPage
 *   'screenshot.png',
 *   'png',
 *   90        // quality
 * );
 */
class ScreenshotCaptureEngine {
  /**
   * Create a new screenshot capture engine
   * @param {FilenameGenerator} filenameGenerator - Filename generator instance for smart naming
   */
  constructor(filenameGenerator = null) {
    this.isCapturing = false;
    this.filenameGenerator = filenameGenerator;
    console.log("📸 ScreenshotCaptureEngine initialized");
  }

  /**
   * Capture screenshot via background script (for panel button clicks)
   *
   * Captures screenshots using Chrome extension background script with performance monitoring
   * and comprehensive error handling. Tracks capture duration and provides detailed timing metrics.
   *
   * @param {string|null} selector - CSS selector for element-specific screenshots
   * @param {boolean} fullPage - Whether to capture full page including below fold
   * @param {string} filename - Generated filename for the screenshot
   * @param {string} [format="png"] - Image format: "png" or "jpeg"
   * @param {number} [quality=90] - JPEG quality (1-100, ignored for PNG)
   * @param {boolean} [sendToHttpBridge=false] - Whether to send to HTTP bridge for MCP integration
   * @returns {Promise<Object>} Screenshot result with performance metrics
   *
   * @example
   * const result = await engine.captureViaBackground(
   *   '#main-content',
   *   false,
   *   'element-screenshot.png',
   *   'png',
   *   90,
   *   false
   * );
   * console.log(`Captured in ${result.loadTime}ms: ${result.filename}`);
   *
   * @since 1.0.0
   */
  async captureViaBackground(
    selector,
    fullPage,
    filename,
    format = "png",
    quality = 90,
    sendToHttpBridge = false
  ) {
    const startTime = performance.now();

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "CAPTURE_SCREENSHOT",
          tabId: chrome.devtools.inspectedWindow.tabId,
          selector,
          fullPage,
          filename,
          format,
          quality,
          sendToHttpBridge,
          timestamp: Date.now(),
        },
        (response) => {
          const loadTime = performance.now() - startTime;

          if (response && response.success) {
            console.log(
              `✅ Screenshot captured via background in ${loadTime.toFixed(
                2
              )}ms: ${response.filename}`
            );

            const enhancedResponse = {
              ...response,
              loadTime: Math.round(loadTime),
              performanceMetrics: {
                captureMethod: "background",
                totalTime: loadTime,
                timestamp: Date.now(),
                format,
                quality,
                fullPage,
                hasSelector: Boolean(selector),
              },
            };

            resolve(enhancedResponse);
          } else {
            const error = response?.error || "Unknown error";
            console.error(
              `❌ Screenshot failed via background after ${loadTime.toFixed(
                2
              )}ms: ${error}`
            );
            resolve({
              success: false,
              error,
              loadTime: Math.round(loadTime),
              performanceMetrics: {
                captureMethod: "background",
                totalTime: loadTime,
                timestamp: Date.now(),
                failed: true,
              },
            });
          }
        }
      );
    });
  }

  /**
   * Capture screenshot via WebSocket (for MCP calls)
   *
   * Captures screenshots using WebSocket communication with performance monitoring
   * and comprehensive error handling. Tracks capture duration and provides detailed timing metrics.
   *
   * @param {string|null} selector - CSS selector for element-specific screenshots
   * @param {boolean} fullPage - Whether to capture full page including below fold
   * @param {string} filename - Generated filename for the screenshot
   * @param {string} [format="png"] - Image format: "png" or "jpeg"
   * @param {number} [quality=90] - JPEG quality (1-100, ignored for PNG)
   * @returns {Promise<Object>} Screenshot result with performance metrics
   *
   * @example
   * const result = await engine.captureViaWebSocket(
   *   null,
   *   true,
   *   'fullpage.png',
   *   'png',
   *   90
   * );
   * console.log(`WebSocket capture: ${result.filename}`);
   *
   * @since 1.0.0
   */
  async captureViaWebSocket(
    selector,
    fullPage,
    filename,
    format = "png",
    quality = 90
  ) {
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      const requestId = Date.now().toString();
      const timeout = setTimeout(() => {
        reject(new Error("Screenshot request timeout"));
      }, 30000);

      // Set up one-time listener for screenshot response
      const messageHandler = (message) => {
        if (
          message.type === "screenshot-data" &&
          message.requestId === requestId
        ) {
          clearTimeout(timeout);
          window.wsManager.off("message", messageHandler);

          const loadTime = performance.now() - startTime;

          console.log(
            `✅ Screenshot captured via WebSocket in ${loadTime.toFixed(
              2
            )}ms: ${filename}`
          );

          const response = {
            success: true,
            filename,
            data: message.data,
            path: message.path || `.screenshots/${filename}`,
            loadTime: Math.round(loadTime),
            performanceMetrics: {
              captureMethod: "websocket",
              totalTime: loadTime,
              timestamp: Date.now(),
              format,
              quality,
              fullPage,
              hasSelector: Boolean(selector),
              requestId,
            },
          };

          resolve(response);
        }
      };

      window.wsManager.on("message", messageHandler);

      // Send screenshot request via WebSocket
      const request = {
        type: "take-screenshot",
        selector,
        fullPage,
        filename,
        format,
        quality,
        requestId,
        tabId: chrome.devtools.inspectedWindow.tabId,
        timestamp: Date.now(),
      };

      console.log("📤 Sending screenshot request via WebSocket:", request);
      console.log("🔍 WebSocket manager state:", {
        wsManager: typeof window.wsManager,
        isConnected: window.wsManager?.isConnected,
        send: typeof window.wsManager?.send,
      });

      try {
        window.wsManager.send(request);
        console.log("✅ WebSocket screenshot request sent successfully");
      } catch (error) {
        console.error("❌ WebSocket send error:", error);
        clearTimeout(timeout);
        reject(new Error(`WebSocket send failed: ${error.message}`));
        return;
      }
    });
  }

  /**
   * Handle screenshot requests from HTTP bridge via WebSocket
   *
   * Processes screenshot requests initiated by the HTTP bridge through WebSocket communication.
   * Captures screenshots and returns results back to the bridge for MCP integration.
   *
   * @param {Object} message - WebSocket message from HTTP bridge
   * @param {string} message.requestId - Unique request identifier
   * @param {string|null} message.selector - CSS selector for element screenshot
   * @param {boolean} message.fullPage - Whether to capture full page
   * @returns {Promise<void>}
   *
   * @example
   * await engine.handleHttpBridgeScreenshotRequest({
   *   requestId: '1234567890',
   *   selector: null,
   *   fullPage: true
   * });
   *
   * @since 1.0.0
   */
  async handleHttpBridgeScreenshotRequest(message) {
    // Prevent concurrent screenshot captures
    if (this.isCapturing) {
      console.warn(
        "⚠️ Screenshot capture already in progress, ignoring request"
      );
      if (window.wsManager && window.wsManager.isConnected) {
        window.wsManager.send({
          type: "screenshot-data",
          requestId: message.requestId,
          success: false,
          error: "Screenshot capture already in progress",
        });
      }
      return;
    }

    try {
      this.isCapturing = true;
      console.log("🔄 Processing HTTP bridge screenshot request...");

      // Generate smart filename using FilenameGenerator
      const filename = this.filenameGenerator
        ? await this.filenameGenerator.generateSmartFilename(
            message.selector,
            message.fullPage || false,
            "png"
          )
        : `screenshot-${message.requestId || Date.now()}.png`;

      console.log(`📝 Generated filename: ${filename}`);

      // Capture screenshot using background script method
      // IMPORTANT: sendToHttpBridge=false to avoid infinite loop!
      // We send the response via WebSocket directly below
      const result = await this.captureViaBackground(
        message.selector,
        message.fullPage || false,
        filename,
        "png",
        90,
        false // Don't POST to HTTP bridge - we'll send WebSocket response directly
      );

      if (result.success && window.wsManager && window.wsManager.isConnected) {
        // Send screenshot data back to HTTP bridge
        const response = {
          type: "screenshot-data",
          requestId: message.requestId,
          data: result.data,
          filename: result.filename,
          success: true,
        };

        console.log(
          "📤 Sending screenshot data to HTTP bridge:",
          response.filename
        );
        window.wsManager.send(response);
      } else {
        // Send error response
        const errorResponse = {
          type: "screenshot-data",
          requestId: message.requestId,
          success: false,
          error: result.error || "Screenshot capture failed",
        };

        console.error(
          "❌ Sending screenshot error to HTTP bridge:",
          errorResponse
        );
        if (window.wsManager && window.wsManager.isConnected) {
          window.wsManager.send(errorResponse);
        }
      }
    } catch (error) {
      console.error("❌ Error handling HTTP bridge screenshot request:", error);

      // Send error response to HTTP bridge
      if (window.wsManager && window.wsManager.isConnected) {
        window.wsManager.send({
          type: "screenshot-data",
          requestId: message.requestId,
          success: false,
          error: error.message,
        });
      }
    } finally {
      // Always reset the capture flag
      this.isCapturing = false;
    }
  }

  /**
   * Validate screenshot capture result
   *
   * @private
   * @param {Object} result - Capture result to validate
   * @returns {boolean} True if result is valid
   */
  validateCaptureResult(result) {
    if (!result || typeof result !== "object") {
      return false;
    }

    if (!result.success) {
      return result.error && typeof result.error === "string";
    }

    // Success result must have filename
    return Boolean(result.filename);
  }

  /**
   * Format capture result with standard structure
   *
   * @private
   * @param {Object} rawResult - Raw capture result
   * @param {number} loadTime - Capture duration in ms
   * @param {string} method - Capture method ('background' or 'websocket')
   * @returns {Object} Formatted result
   */
  formatCaptureResult(rawResult, loadTime, method) {
    return {
      ...rawResult,
      loadTime: Math.round(loadTime),
      performanceMetrics: {
        captureMethod: method,
        totalTime: loadTime,
        timestamp: Date.now(),
        ...rawResult.performanceMetrics,
      },
    };
  }
}

// Export for use in other modules
window.ScreenshotCaptureEngine = ScreenshotCaptureEngine;
