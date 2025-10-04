/**
 * Screenshot Module for Browser Tools MCP Extension
 *
 * Implements browser_screenshot functionality for Agent D (Screenshot Visualizer).
 * Handles screenshot capture requests from the MCP server via WebSocket communication.
 *
 * 📄 **WebSocket Protocol**: chrome-extension/contracts/websocket.asyncapi.yaml
 * 🔗 **AsyncAPI Spec**: https://spec.asyncapi.com/v3.0.0/
 * 🌐 **Documentation**: http://localhost:3020/ws-docs
 *
 * Features:
 * - Full page and element-specific screenshots with Chrome tabs API
 * - Smart naming system based on page content and timestamps
 * - Format options: PNG and JPEG with quality settings (1-100)
 * - Integration with MCP HTTP bridge and WebSocket communication
 * - Thread-safe operations with retry logic and error handling
 * - Performance monitoring and load time tracking
 * - Listener pool management for memory efficiency
 *
 * Agent D (Screenshot Visualizer) implementation
 *
 * @see {@link ./contracts/websocket.asyncapi.yaml} ScreenshotRequestMessage schema
 */

console.log("📸 Screenshot module loading...");

class ScreenshotManager {
  /**
   * Initialize Screenshot Manager with thread-safe configuration and listener management
   *
   * Creates a new ScreenshotManager instance with enterprise-grade features:
   * - Thread-safe capture state management
   * - Screenshot history tracking with automatic cleanup
   * - Listener pool management for memory efficiency
   * - Performance monitoring and load time tracking
   * - Retry logic with exponential backoff for failed captures
   *
   * @example
   * const manager = new ScreenshotManager();
   *
   * // Capture full page screenshot
   * const result = await manager.captureScreenshot({ fullPage: true });
   * if (result.success) {
   *   console.log(`Screenshot saved: ${result.filename}`);
   * }
   *
   * @since 1.2.0
   */
  constructor() {
    this.isCapturing = false;
    this.captureTimeout = 30000; // 30 second timeout
    this.currentCaptureController = null;
    this.activeCaptureListener = null; // Track active listener for cleanup

    // Filename generation (using shared module)
    this.filenameGenerator = new FilenameGenerator();
    this.screenshotHistory = this.filenameGenerator.screenshotHistory; // Reference for backward compatibility

    // Screenshot UI manager (using screenshot module)
    this.uiManager = new ScreenshotUIManager(this.filenameGenerator);

    // Screenshot capture engine (using screenshot module)
    this.captureEngine = new ScreenshotCaptureEngine(this.filenameGenerator);

    // Retry logic (using shared utility)
    this.retryExecutor = new RetryExecutor({
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 5000,
      retryablePatterns: [
        "timeout",
        "network",
        "connection",
        "unreachable",
        "temporary",
        "capture failed",
        "tabs api",
        "ERR_",
      ],
      debugPrefix: "[Screenshot]",
    });

    // Thread-safe configuration (using shared utility)
    this.threadSafeConfig = new ThreadSafeState(
      {
        timeout: { value: 30000, min: 5000, max: 120000 },
        isCapturing: false,
      },
      {
        debugPrefix: "[Screenshot]",
      }
    );

    // Provide backward-compatible methods
    this.threadSafeConfig.setTimeoutSafe = (timeout) =>
      this.threadSafeConfig.setStateSafe("timeout", timeout);
    this.threadSafeConfig.getTimeoutSafe = () =>
      this.threadSafeConfig.getState("timeout");
    this.threadSafeConfig.setCaptureStateSafe = (state) =>
      this.threadSafeConfig.setState("isCapturing", state);
    this.threadSafeConfig.getCaptureStateSafe = () =>
      this.threadSafeConfig.getState("isCapturing");

    // Listener Pool Management for better event handling (using shared utility)
    this.listenerPool = new ListenerPoolManager({
      max: 5,
      maxAge: 300000, // 5 minutes
      minInactiveTime: 60000, // 1 minute
      debugPrefix: "[Screenshot]",
    });

    // Bind methods to preserve context
    this.captureScreenshot = this.captureScreenshot.bind(this);

    this.initializeEventListeners();

    // Start listener pool management (using shared utility)
    this.listenerPool.startListenerPoolCleanup();

    console.log(
      "📸 Screenshot Manager initialized with enterprise-grade features"
    );
  }

  initializeEventListeners() {
    // Listen for WebSocket messages related to screenshots
    if (window.wsManager) {
      window.wsManager.on("message", (message) => {
        this.handleWebSocketMessage(message);
      });
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "SCREENSHOT_RESPONSE") {
        this.handleScreenshotResponse(message);
      }
    });
  }

  /**
   * Capture screenshot with enterprise-grade error handling and retry logic
   *
   * Main screenshot capture function that supports both MCP API calls and direct panel interactions.
   * Features comprehensive error handling, retry logic with exponential backoff, thread-safe operations,
   * and performance monitoring.
   *
   * @param {Object} [options={}] - Screenshot capture options
   * @param {string|null} [options.selector=null] - CSS selector for element-specific screenshots
   * @param {boolean} [options.fullPage=false] - Whether to capture full page including below fold
   * @param {string|null} [options.filename=null] - Custom filename (auto-generated if null)
   * @param {string} [options.format="png"] - Image format: "png" or "jpeg"
   * @param {number} [options.quality=90] - JPEG quality (1-100, ignored for PNG)
   * @param {string} [options.source="panel"] - Source of request: "panel" or "mcp"
   * @param {number} [options.timeout] - Custom timeout in milliseconds (5000-120000)
   *
   * @returns {Promise<Object>} Screenshot result with the following structure:
   *   - success: {boolean} Whether capture succeeded
   *   - filename: {string} Generated filename (if successful)
   *   - path: {string} Full path to saved screenshot (if successful)
   *   - data: {string} Base64 image data (WebSocket method only)
   *   - loadTime: {number} Capture duration in milliseconds
   *   - error: {string} Error message (if failed)
   *   - retryCount: {number} Number of retry attempts made
   *   - timestamp: {number} Completion timestamp
   *
   * @example
   * // Capture full page screenshot with PNG format
   * const result = await manager.captureScreenshot({
   *   fullPage: true,
   *   format: "png"
   * });
   * if (result.success) {
   *   console.log(`Screenshot saved: ${result.filename}`);
   * }
   *
   * @example
   * // Capture specific element with JPEG compression
   * const result = await manager.captureScreenshot({
   *   selector: "#main-content",
   *   format: "jpeg",
   *   quality: 85,
   *   filename: "element-capture.jpg"
   * });
   *
   * @example
   * // MCP API call with custom timeout
   * const result = await manager.captureScreenshot({
   *   fullPage: true,
   *   source: "mcp",
   *   timeout: 45000
   * });
   *
   * @throws {Error} When capture is already in progress
   * @throws {Error} When Chrome extension context is invalidated
   * @throws {Error} When WebSocket connection is unavailable (MCP source)
   *
   * @since 1.2.0
   */
  async captureScreenshot(options = {}) {
    const {
      selector = null,
      fullPage = false,
      filename = null,
      format = "png", // "png" or "jpeg"
      quality = 90, // 1-100 for JPEG quality
      source = "panel", // "panel" or "mcp"
      timeout,
    } = options;

    // Enhanced message validation
    if (!options || typeof options !== "object") {
      const error = "Invalid options format - expected object";
      console.error("❌ Screenshot error:", error);
      this.uiManager.addLogEntry("error", error);
      return { success: false, error };
    }

    // Set custom timeout if provided with validation (thread-safe)
    let effectiveTimeout = this.captureTimeout;
    if (timeout && typeof timeout === "number" && timeout > 0) {
      // Use thread-safe configuration to prevent race conditions
      effectiveTimeout = this.threadSafeConfig.setTimeoutSafe(timeout);
      this.captureTimeout = effectiveTimeout;
      console.log(
        "🕐 Custom capture timeout safely set:",
        effectiveTimeout + "ms"
      );
    }

    // Check if already capturing
    if (this.isCapturing) {
      const error = "Screenshot capture already in progress";
      console.warn("⚠️ Screenshot warning:", error);
      this.uiManager.addLogEntry("error", error);
      return { success: false, error };
    }

    try {
      // Start capture (thread-safe)
      this.threadSafeConfig.setCaptureStateSafe(true);
      this.isCapturing = true;
      this.uiManager.updateUI("capturing", "Taking screenshot...");
      this.uiManager.addLogEntry(
        "info",
        `Capturing screenshot - fullPage: ${fullPage}, selector: ${
          selector || "none"
        }`
      );

      // Generate intelligent filename (using FilenameGenerator module)
      const smartFilename =
        filename ||
        (await this.filenameGenerator.generateSmartFilename(
          selector,
          fullPage,
          format
        ));

      console.log(
        `📸 Starting screenshot capture - fullPage: ${fullPage}, selector: ${
          selector || "none"
        }, filename: ${smartFilename}`
      );

      // Perform capture with retry logic
      const result = await this.captureWithRetry(
        selector,
        fullPage,
        smartFilename,
        format,
        quality,
        source
      );

      if (result.success) {
        console.log("✅ Screenshot capture successful");
        // Note: Detailed log message added by updateUI() - no need for duplicate here
        this.uiManager.updateUI("success", smartFilename);
        return {
          ...result,
          loadTime: result.loadTime,
          retryCount: this.retryAttempts,
          timestamp: Date.now(),
        };
      } else {
        console.error("❌ Screenshot capture failed:", result.error);
        this.uiManager.addLogEntry(
          "error",
          `Screenshot capture failed: ${result.error}`
        );
        this.uiManager.updateUI("error", result.error);
        return {
          ...result,
          retryCount: this.retryAttempts,
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error("❌ Screenshot capture error:", error);

      // Provide helpful message for extension context invalidation
      let errorMessage = error.message;
      if (
        error.message.toLowerCase().includes("extension context invalidated")
      ) {
        errorMessage =
          "Chrome extension needs reload - please refresh DevTools tab and try again";
        console.log(
          "💡 Suggestion: Refresh the DevTools tab to reinitialize the extension context"
        );
      }

      this.uiManager.addLogEntry(
        "error",
        `Screenshot capture error: ${errorMessage}`
      );
      this.uiManager.updateUI("error", errorMessage);
      return {
        success: false,
        error: errorMessage,
        retryCount: this.retryAttempts,
        timestamp: Date.now(),
      };
    } finally {
      // Reset capture state (thread-safe)
      this.threadSafeConfig.setCaptureStateSafe(false);
      this.isCapturing = false;
      this.retryAttempts = 0; // Reset retry counter
      // Reset timeout to default
      this.captureTimeout = 30000;

      // Clear status after delay
      setTimeout(() => {
        this.uiManager.updateUI("ready", "Ready for screenshot capture");
      }, 3000);
    }
  }

  /**
   * Screenshot capture with retry logic for transient failures
   *
   * Implements comprehensive retry logic with exponential backoff for handling
   * transient failures such as network timeouts, temporary system issues, or
   * Chrome API availability problems.
   *
   * @param {string|null} selector - CSS selector for element-specific screenshots
   * @param {boolean} fullPage - Whether to capture full page
   * @param {string} filename - Generated filename for the screenshot
   * @param {string} format - Image format: "png" or "jpeg"
   * @param {number} quality - JPEG quality (1-100)
   * @param {string} source - Source of request: "panel" or "mcp"
   * @returns {Promise<Object>} Screenshot capture result
   *
   * @example
   * const result = await manager.captureWithRetry(
   *   "#main-content",
   *   false,
   *   "element-screenshot.png",
   *   "png",
   *   90,
   *   "panel"
   * );
   *
   * @since 1.2.0
   */
  /**
   * Capture screenshot with retry logic (using shared RetryExecutor and ScreenshotCaptureEngine)
   */
  async captureWithRetry(
    selector,
    fullPage,
    filename,
    format,
    quality,
    source
  ) {
    return this.retryExecutor.executeWithRetry(async () => {
      // Choose capture method based on source (delegated to capture engine)
      let result;
      if (source === "panel") {
        result = await this.captureEngine.captureViaBackground(
          selector,
          fullPage,
          filename,
          format,
          quality
        );

        // Update UI and add to history for panel captures
        if (result.success) {
          this.uiManager.updateUI("success", result.filename, result);
          this.addToHistory(result);
        } else {
          this.uiManager.updateUI("error", result.error);
        }
      } else {
        // Check if we're connected to the HTTP bridge for WebSocket method
        if (!window.wsManager || !window.wsManager.isConnected) {
          throw new Error("Not connected to HTTP bridge");
        }
        result = await this.captureEngine.captureViaWebSocket(
          selector,
          fullPage,
          filename,
          format,
          quality
        );

        // Update UI and add to history for WebSocket captures
        if (result.success) {
          this.uiManager.updateUI("success", filename);
          this.addToHistory(result);
        }
      }

      // If result indicates failure, throw error for retry logic
      if (!result.success && result.error) {
        throw new Error(result.error);
      }

      return result;
    });
  }

  // Capture methods delegated to ScreenshotCaptureEngine module
  // (captureViaBackground, captureViaWebSocket, handleHttpBridgeScreenshotRequest)
  // All filename generation methods delegated to FilenameGenerator module
  // (generateSessionCode, trimPageName, generateSmartFilename, getPageInfo,
  //  sanitizeFilename, getSessionScreenshotCount, getFallbackFilename)

  // UI methods delegated to ScreenshotUIManager module
  // (updateUI, updateScreenshotPreview, addLogEntry)
  // Filename generation methods delegated to FilenameGenerator module
  // (generateSmartFilename, predictNextFilename, etc.)

  /**
   * Add screenshot to history tracking
   */
  addToHistory(screenshotData) {
    const historyKey = `history_${Date.now()}`;
    this.screenshotHistory.set(historyKey, {
      ...screenshotData,
      timestamp: new Date().toISOString(),
      tabId: chrome.devtools.inspectedWindow.tabId,
    });

    // Keep only last 10 screenshots in memory
    if (this.screenshotHistory.size > 10) {
      const oldestKey = [...this.screenshotHistory.keys()][0];
      this.screenshotHistory.delete(oldestKey);
    }
  }

  /**
   * Handle WebSocket messages related to screenshots
   */
  handleWebSocketMessage(message) {
    switch (message.type) {
      case "take-screenshot":
        // Handle HTTP bridge screenshot requests
        console.log(
          "📸 Received take-screenshot request from HTTP bridge:",
          message
        );
        this.handleHttpBridgeScreenshotRequest(message);
        break;

      case "screenshot-progress":
        console.log(`📸 Screenshot progress: ${message.progress}%`);
        this.uiManager.addLogEntry(
          "info",
          `Screenshot progress: ${message.progress}%`
        );
        break;

      case "screenshot-error":
        console.error(`❌ Screenshot error: ${message.error}`);
        this.uiManager.updateUI("error", message.error);
        break;

      case "screenshot-data":
        console.log("📸 Screenshot data received via WebSocket");
        // This is handled in captureViaWebSocket
        break;

      default:
        // Not a screenshot-related message
        break;
    }
  }

  /**
   * Handle screenshot requests from HTTP bridge via WebSocket
   * (Delegated to ScreenshotCaptureEngine)
   */
  async handleHttpBridgeScreenshotRequest(message) {
    return this.captureEngine.handleHttpBridgeScreenshotRequest(message);
  }

  /**
   * Handle screenshot response from background script
   */
  handleScreenshotResponse(message) {
    if (message.success) {
      console.log(`✅ Background screenshot response: ${message.filename}`);
      this.uiManager.updateUI("success", message.filename);
      this.addToHistory(message);
    } else {
      console.error(`❌ Background screenshot error: ${message.error}`);
      this.uiManager.updateUI("error", message.error);
    }
  }

  /**
   * Get screenshot history for debugging
   */
  getHistory() {
    return Array.from(this.screenshotHistory.entries());
  }

  // Listener pool methods now delegated to shared ListenerPoolManager
  // All methods available via this.listenerPool (createManagedListener, removeListener, etc.)

  /**
   * Get current capture state
   * @returns {Object} Current capture state
   */
  getCaptureState() {
    return {
      isCapturing: this.isCapturing,
      hasActiveController: this.currentCaptureController !== null,
      activeListenerCount: this.listenerPool.listenerPool.size,
      listenerPoolStatus: this.listenerPool.getListenerPoolStatus(),
    };
  }

  /**
   * Destroy manager and cleanup all resources
   */
  destroy() {
    console.log("📸 Destroying ScreenshotManager...");

    // Cancel any active capture
    if (this.currentCaptureController) {
      this.currentCaptureController.abort();
      this.currentCaptureController = null;
    }

    // Destroy listener pool (uses shared utility)
    this.listenerPool.destroy();

    console.log("📸 ScreenshotManager destroyed and resources cleaned up");
  }

  /**
   * Clear screenshot history
   */
  clearHistory() {
    this.screenshotHistory.clear();
    console.log("📸 Screenshot history cleared");
  }
}

// Initialize screenshot manager
console.log("🔍 Screenshot.js: Initializing ScreenshotManager...");
const screenshotManager = new ScreenshotManager();

// Export for global access
window.screenshotManager = screenshotManager;
console.log(
  "✅ Screenshot.js: window.screenshotManager created successfully:",
  {
    type: typeof window.screenshotManager,
    methods: Object.keys(screenshotManager),
  }
);

// Enhanced captureScreenshot function for panel.js integration
window.captureScreenshot = function (options = {}) {
  return screenshotManager.captureScreenshot({ ...options, source: "panel" });
};

// MCP API integration
window.mcp_browser_screenshot = function (params = {}) {
  const { selector, fullPage = false, format = "png", quality = 90 } = params;
  return screenshotManager.captureScreenshot({
    selector,
    fullPage,
    format,
    quality,
    source: "mcp",
  });
};

console.log("📸 Screenshot module loaded - Agent D ready for action!");
