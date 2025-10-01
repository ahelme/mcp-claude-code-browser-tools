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
    this.retryAttempts = 0;
    this.maxRetries = 2; // Maximum retry attempts for transient failures
    this.screenshotHistory = new Map();

    // Thread-safe configuration to prevent race conditions
    const ThreadSafeConfigClass =
      globalThis.ThreadSafeScreenshotConfig ||
      function () {
        // Enhanced fallback implementation with better validation
        console.log(
          "🔄 Using fallback ThreadSafeScreenshotConfig (enhanced module not available)"
        );

        this.setTimeoutSafe = (timeout) => {
          const validTimeout = Math.max(
            5000,
            Math.min(timeout || 30000, 120000)
          );
          console.log(
            `⏱️ ThreadSafe capture timeout set to ${validTimeout}ms (input: ${timeout})`
          );
          return validTimeout;
        };

        this.setCaptureStateSafe = (state) => {
          console.log(`🔄 ThreadSafe capture state set: ${state}`);
          return true;
        };

        this.getTimeoutSafe = () => {
          const timeout = this.captureTimeout || 30000;
          console.log(`⏱️ ThreadSafe capture timeout retrieved: ${timeout}ms`);
          return timeout;
        };

        this.getCaptureStateSafe = () => {
          const state = this.isCapturing || false;
          console.log(`🔄 ThreadSafe capture state retrieved: ${state}`);
          return state;
        };
      };

    try {
      this.threadSafeConfig = new ThreadSafeConfigClass();
    } catch (error) {
      console.error(
        "❌ Failed to initialize ThreadSafeScreenshotConfig:",
        error
      );
      // Use minimal fallback
      this.threadSafeConfig = {
        setTimeoutSafe: (timeout) =>
          Math.max(5000, Math.min(timeout || 30000, 120000)),
        setCaptureStateSafe: () => true,
        getTimeoutSafe: () => 30000,
        getCaptureStateSafe: () => false,
      };
    }

    // Listener Pool Management for better event handling
    this.listenerPool = new Map(); // Store active listeners by ID
    this.listenerIdCounter = 0; // Unique ID generator
    this.maxConcurrentListeners = 5; // Prevent listener accumulation
    this.listenerCleanupInterval = null;
    this.lastListenerCleanup = Date.now();

    // Bind methods to preserve context
    this.captureScreenshot = this.captureScreenshot.bind(this);
    this.captureViaBackground = this.captureViaBackground.bind(this);
    this.captureViaWebSocket = this.captureViaWebSocket.bind(this);
    this.generateSmartFilename = this.generateSmartFilename.bind(this);
    this.updateUI = this.updateUI.bind(this);
    this.createManagedListener = this.createManagedListener.bind(this);
    this.removeListener = this.removeListener.bind(this);
    this.cleanupStaleListeners = this.cleanupStaleListeners.bind(this);

    this.initializeEventListeners();

    // Start listener pool management
    this.startListenerPoolCleanup();

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
      this.addLogEntry("error", error);
      return { success: false, error };
    }

    try {
      // Start capture (thread-safe)
      this.threadSafeConfig.setCaptureStateSafe(true);
      this.isCapturing = true;
      this.updateUI("capturing", "Taking screenshot...");
      this.addLogEntry(
        "info",
        `Capturing screenshot - fullPage: ${fullPage}, selector: ${
          selector || "none"
        }`
      );

      // Generate intelligent filename
      const smartFilename =
        filename ||
        (await this.generateSmartFilename(selector, fullPage, format));

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
        this.updateUI("success", smartFilename);
        return {
          ...result,
          loadTime: result.loadTime,
          retryCount: this.retryAttempts,
          timestamp: Date.now(),
        };
      } else {
        console.error("❌ Screenshot capture failed:", result.error);
        this.addLogEntry("error", `Screenshot capture failed: ${result.error}`);
        this.updateUI("error", result.error);
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

      this.addLogEntry("error", `Screenshot capture error: ${errorMessage}`);
      this.updateUI("error", errorMessage);
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
        this.updateUI("ready", "Ready for screenshot capture");
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
  async captureWithRetry(
    selector,
    fullPage,
    filename,
    format,
    quality,
    source
  ) {
    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `🔄 Screenshot retry attempt ${attempt}/${this.maxRetries} for: ${filename}`
          );
          this.addLogEntry(
            "info",
            `Retry attempt ${attempt}/${this.maxRetries}`
          );
          // Wait before retry (exponential backoff with 5-second cap)
          const baseDelay = 1000;
          const exponentialDelay = Math.pow(2, attempt) * baseDelay;
          const cappedDelay = Math.min(exponentialDelay, 5000); // Max 5 seconds
          console.log(`⏳ Waiting ${cappedDelay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, cappedDelay));
        }

        this.retryAttempts = attempt;

        // Choose capture method based on source
        let result;
        if (source === "panel") {
          result = await this.captureViaBackground(
            selector,
            fullPage,
            filename,
            format,
            quality
          );
        } else {
          // Check if we're connected to the HTTP bridge for WebSocket method
          if (!window.wsManager || !window.wsManager.isConnected) {
            throw new Error("Not connected to HTTP bridge");
          }
          result = await this.captureViaWebSocket(
            selector,
            fullPage,
            filename,
            format,
            quality
          );
        }

        if (result.success) {
          return result;
        }

        lastError = new Error(result.error);

        // Check if error is retryable (network/timeout issues)
        const isRetryable =
          result.error &&
          (result.error.includes("timeout") ||
            result.error.includes("Network") ||
            result.error.includes("ERR_") ||
            result.error.includes("connection") ||
            result.error.includes("capture failed"));

        if (!isRetryable || attempt === this.maxRetries) {
          return result;
        }
      } catch (error) {
        lastError = error;
        console.warn(
          `⚠️ Screenshot capture attempt ${attempt + 1} failed:`,
          error.message
        );

        // Don't retry on non-recoverable errors
        if (attempt === this.maxRetries || !this.isRetryableError(error)) {
          throw error;
        }
      }
    }

    throw (
      lastError ||
      new Error("Screenshot capture failed after all retry attempts")
    );
  }

  /**
   * Check if an error is retryable for screenshot operations
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is retryable
   */
  isRetryableError(error) {
    const retryablePatterns = [
      "timeout",
      "network",
      "connection",
      "unreachable",
      "temporary",
      "capture failed",
      "tabs api",
    ];

    const nonRetryablePatterns = [
      "extension context invalidated",
      "context invalidated",
      "extension context",
      "disconnected port",
      "message port closed",
      "invalid selector",
      "element not found",
    ];

    // First check if error is explicitly non-retryable
    if (
      nonRetryablePatterns.some((pattern) =>
        error.message.toLowerCase().includes(pattern)
      )
    ) {
      console.log(
        `🚫 Non-retryable screenshot error detected: ${error.message}`
      );
      return false;
    }

    // Then check if it's retryable
    return retryablePatterns.some((pattern) =>
      error.message.toLowerCase().includes(pattern)
    );
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
   * @returns {Promise<Object>} Screenshot result with performance metrics
   * @since 1.2.0
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
            this.updateUI("success", response.filename, response);

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

            this.addToHistory(enhancedResponse);
            resolve(enhancedResponse);
          } else {
            const error = response?.error || "Unknown error";
            console.error(
              `❌ Screenshot failed via background after ${loadTime.toFixed(
                2
              )}ms: ${error}`
            );
            this.updateUI("error", error);
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
   * @since 1.2.0
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
          this.updateUI("success", filename);

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

          this.addToHistory(response);
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
   * Generate intelligent filename based on page content
   */
  async generateSmartFilename(selector, fullPage, format = "png") {
    try {
      // Get current page info
      const pageInfo = await this.getPageInfo();

      // Generate base name from page title
      let baseName = this.sanitizeFilename(pageInfo.title) || "screenshot";

      // Add selector info if capturing specific element
      if (selector) {
        const selectorName = this.sanitizeFilename(
          selector.replace(/[#.]/g, "")
        );
        baseName += `_${selectorName}`;
      }

      // Add fullPage indicator
      if (fullPage) {
        baseName += "_fullpage";
      }

      // Add timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:.]/g, "-");

      // Generate sequential number for this session
      const sessionCount = this.getSessionScreenshotCount(baseName);
      const paddedCount = String(sessionCount).padStart(4, "0");

      // Use correct file extension based on format
      const extension = format === "jpeg" ? "jpg" : format;
      return `${baseName}_${timestamp}_${paddedCount}.${extension}`;
    } catch (error) {
      console.warn(
        "⚠️ Could not generate smart filename, using fallback:",
        error
      );
      return this.getFallbackFilename(selector, fullPage, format);
    }
  }

  /**
   * Get current page information for smart naming
   */
  async getPageInfo() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "GET_PAGE_INFO",
          tabId: chrome.devtools.inspectedWindow.tabId,
        },
        (response) => {
          resolve(response || { title: "Untitled Page", url: "about:blank" });
        }
      );
    });
  }

  /**
   * Sanitize filename to be filesystem-safe
   */
  sanitizeFilename(name) {
    return name
      .replace(/[<>:"/\\|?*]/g, "_") // Replace invalid chars
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/_+/g, "_") // Collapse multiple underscores
      .replace(/^_|_$/g, "") // Trim leading/trailing underscores
      .substring(0, 50); // Limit length
  }

  /**
   * Get session screenshot count for filename numbering
   */
  getSessionScreenshotCount(baseName) {
    const key = `session_${baseName}`;
    const current = this.screenshotHistory.get(key) || 0;
    const next = current + 1;
    this.screenshotHistory.set(key, next);
    return next;
  }

  /**
   * Generate fallback filename if smart naming fails
   */
  getFallbackFilename(selector, fullPage, format = "png") {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const type = fullPage ? "fullpage" : selector ? "element" : "page";
    const extension = format === "jpeg" ? "jpg" : format;
    return `screenshot_${type}_${timestamp}.${extension}`;
  }

  /**
   * Update UI elements to show screenshot status
   */
  updateUI(status, message = "", diskStatus = null) {
    const screenshotBtn = document.getElementById("screenshot-btn");
    if (!screenshotBtn) return;

    switch (status) {
      case "capturing":
        screenshotBtn.textContent = "📸 Capturing...";
        screenshotBtn.disabled = true;
        this.addLogEntry("info", "Taking screenshot...");
        break;

      case "success":
        let buttonText = "✅ Captured!";
        let logMessage = `Screenshot captured: ${message}`;

        // Show disk saving status
        if (diskStatus && diskStatus.savedToDisk) {
          buttonText = "💾 Saved!";
          logMessage = `Screenshot saved to disk: ${
            diskStatus.path || `Downloads/screenshots/${message}`
          }`;
        } else if (diskStatus && diskStatus.savedToDisk === false) {
          buttonText = "⚠️ Captured";
          logMessage = `Screenshot captured but not saved to disk: ${
            diskStatus.fallbackReason || "Download failed"
          }`;
        }

        screenshotBtn.textContent = buttonText;
        screenshotBtn.disabled = false;
        this.addLogEntry("info", logMessage);
        this.updateScreenshotPreview(message);

        // Reset button text after 2 seconds
        setTimeout(() => {
          screenshotBtn.textContent = "Take screenshot 📸";
        }, 2000);
        break;

      case "error":
        screenshotBtn.textContent = "❌ Failed";
        screenshotBtn.disabled = false;
        this.addLogEntry("error", `Screenshot failed: ${message}`);

        // Reset button text after 3 seconds
        setTimeout(() => {
          screenshotBtn.textContent = "Take screenshot 📸";
        }, 3000);
        break;

      default:
        screenshotBtn.textContent = "Take screenshot 📸";
        screenshotBtn.disabled = false;
    }
  }

  /**
   * Update screenshot preview in UI
   */
  updateScreenshotPreview(filename) {
    const previewDiv = document.querySelector(".screenshot-preview");
    if (!previewDiv) return;

    // Update the preview with the latest filename
    const lastSpan = previewDiv.querySelector(".screenshot-filename");
    if (lastSpan) {
      lastSpan.textContent = filename;
    }

    // Generate next predicted filename
    const nextFilename = this.predictNextFilename();
    const firstDiv = previewDiv.querySelector("div");
    if (firstDiv) {
      firstDiv.textContent = `Next: ${nextFilename}`;
    }
  }

  /**
   * Predict the next screenshot filename for UI preview
   */
  predictNextFilename() {
    try {
      // Simple prediction based on current page
      const timestamp = new Date().toISOString().slice(0, 10);
      return `page-screenshot_${timestamp}_0001.png`;
    } catch (error) {
      return "screenshot_next.png";
    }
  }

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
        this.addLogEntry("info", `Screenshot progress: ${message.progress}%`);
        break;

      case "screenshot-error":
        console.error(`❌ Screenshot error: ${message.error}`);
        this.updateUI("error", message.error);
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
   */
  async handleHttpBridgeScreenshotRequest(message) {
    try {
      console.log("🔄 Processing HTTP bridge screenshot request...");

      // Capture screenshot using background script method
      const result = await this.captureViaBackground(
        message.selector,
        message.fullPage || false,
        `screenshot-${message.requestId || Date.now()}.png`,
        "png",
        90,
        true // Send to HTTP bridge for MCP integration
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
    }
  }

  /**
   * Handle screenshot response from background script
   */
  handleScreenshotResponse(message) {
    if (message.success) {
      console.log(`✅ Background screenshot response: ${message.filename}`);
      this.updateUI("success", message.filename);
      this.addToHistory(message);
    } else {
      console.error(`❌ Background screenshot error: ${message.error}`);
      this.updateUI("error", message.error);
    }
  }

  /**
   * Add log entry to the console panel
   */
  addLogEntry(level, message) {
    // Use the existing addLogEntry function if available
    if (typeof window.addLogEntry === "function") {
      window.addLogEntry(level, message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Get screenshot history for debugging
   */
  getHistory() {
    return Array.from(this.screenshotHistory.entries());
  }

  /**
   * Create a managed listener with automatic cleanup and pooling
   *
   * This method creates a listener that is automatically tracked in the listener pool
   * with usage analytics and automatic cleanup. Prevents memory leaks by enforcing
   * pool size limits and removing stale listeners.
   *
   * @param {Function} listenerFunction - The listener callback function to manage
   * @param {string} [description="screenshot"] - Debug description for the listener
   * @returns {Object} Listener management object with the following properties:
   *   - id: {string} Unique listener identifier
   *   - listener: {Function} Wrapped listener function with usage tracking
   *   - remove: {Function} Method to remove listener from pool and Chrome API
   *   - isActive: {Function} Method to check if listener is still active
   *
   * @example
   * const managedListener = manager.createManagedListener(
   *   (message) => console.log('Screenshot message received'),
   *   'screenshot-websocket-listener'
   * );
   *
   * window.wsManager.on('message', managedListener.listener);
   *
   * // Clean up when done
   * managedListener.remove();
   *
   * @throws {Error} When listener pool is at capacity and cleanup fails
   * @since 1.2.0
   */
  createManagedListener(listenerFunction, description = "screenshot") {
    // Check if we're approaching listener limit
    if (this.listenerPool.size >= this.maxConcurrentListeners) {
      console.warn(
        "⚠️ Listener pool approaching maximum capacity - cleaning up stale listeners"
      );
      this.cleanupStaleListeners();
    }

    const listenerId = `listener_${++this.listenerIdCounter}_${Date.now()}`;
    const listenerData = {
      id: listenerId,
      function: listenerFunction,
      description,
      createdAt: Date.now(),
      isActive: true,
      usage: {
        calls: 0,
        lastUsed: Date.now(),
      },
    };

    // Create wrapper function for tracking
    const wrappedListener = (...args) => {
      listenerData.usage.calls++;
      listenerData.usage.lastUsed = Date.now();
      return listenerFunction(...args);
    };

    // Store in pool
    this.listenerPool.set(listenerId, listenerData);

    console.log(
      `🔧 Created managed screenshot listener: ${listenerId} (${description})`
    );

    return {
      id: listenerId,
      listener: wrappedListener,
      remove: () => this.removeListener(listenerId),
      isActive: () => this.listenerPool.has(listenerId),
    };
  }

  /**
   * Remove a listener from the pool and cleanup resources
   *
   * Safely removes a managed listener from both the internal pool and any associated
   * Chrome APIs. This method handles cleanup of all associated resources and prevents memory leaks.
   *
   * @param {string} listenerId - Unique ID of listener to remove (from createManagedListener)
   * @returns {boolean} True if listener was successfully removed, false if not found
   *
   * @example
   * const success = manager.removeListener('listener_123_1234567890');
   * if (success) {
   *   console.log('Listener removed successfully');
   * }
   *
   * @since 1.2.0
   */
  removeListener(listenerId) {
    const listenerData = this.listenerPool.get(listenerId);
    if (!listenerData) {
      console.warn(
        `⚠️ Attempted to remove non-existent screenshot listener: ${listenerId}`
      );
      return false;
    }

    try {
      // Remove from pool
      this.listenerPool.delete(listenerId);
      console.log(`🗑️ Removed screenshot listener from pool: ${listenerId}`);

      return true;
    } catch (error) {
      console.error(
        `❌ Error removing screenshot listener ${listenerId}:`,
        error.message
      );
      // Still remove from pool even if other cleanup failed
      this.listenerPool.delete(listenerId);
      return false;
    }
  }

  /**
   * Clean up stale listeners that are no longer needed
   *
   * Removes listeners from the pool based on age and usage patterns to prevent
   * memory leaks. This method is called automatically by the dynamic cleanup system
   * but can also be called manually for immediate cleanup.
   *
   * Cleanup criteria:
   * - Listeners older than 5 minutes AND inactive for more than 1 minute
   * - Listeners that have never been called and are older than 2 minutes
   *
   * @returns {number} Number of listeners cleaned up
   * @since 1.2.0
   */
  cleanupStaleListeners() {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    const minInactivityTime = 60000; // 1 minute
    let cleaned = 0;

    console.log(
      `🧹 Starting screenshot listener pool cleanup (${this.listenerPool.size} listeners)`
    );

    for (const [listenerId, listenerData] of this.listenerPool.entries()) {
      const age = now - listenerData.createdAt;
      const inactivityTime = now - listenerData.usage.lastUsed;

      // Remove listeners that are:
      // 1. Older than 5 minutes AND inactive for more than 1 minute
      // 2. Have never been called and are older than 2 minutes
      const isStale =
        (age > maxAge && inactivityTime > minInactivityTime) ||
        (listenerData.usage.calls === 0 && age > 120000);

      if (isStale) {
        console.log(
          `🧹 Cleaning up stale screenshot listener: ${listenerId} (age: ${age}ms, inactive: ${inactivityTime}ms, calls: ${listenerData.usage.calls})`
        );
        this.removeListener(listenerId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(
        `🧹 Cleaned up ${cleaned} stale screenshot listeners. Pool size: ${this.listenerPool.size}`
      );
    }

    this.lastListenerCleanup = now;
    return cleaned;
  }

  /**
   * Start listener pool cleanup with dynamic intervals
   */
  startListenerPoolCleanup() {
    const scheduleNextCleanup = () => {
      // Dynamic interval based on pool usage
      const poolSize = this.listenerPool.size;
      let interval;

      if (poolSize === 0) {
        interval = 120000; // 2 minutes when no listeners
      } else if (poolSize < 3) {
        interval = 60000; // 1 minute for light usage
      } else if (poolSize < 5) {
        interval = 30000; // 30 seconds for moderate usage
      } else {
        interval = 10000; // 10 seconds for heavy usage
      }

      this.listenerCleanupInterval = setTimeout(() => {
        this.cleanupStaleListeners();
        scheduleNextCleanup(); // Schedule next cleanup
      }, interval);

      console.log(
        `🔄 Next screenshot listener cleanup in ${
          interval / 1000
        }s (${poolSize} listeners active)`
      );
    };

    scheduleNextCleanup();
  }

  /**
   * Get listener pool status for debugging
   * @returns {Object} Pool status information
   */
  getListenerPoolStatus() {
    const now = Date.now();
    const listeners = Array.from(this.listenerPool.values()).map(
      (listener) => ({
        id: listener.id,
        description: listener.description,
        age: now - listener.createdAt,
        calls: listener.usage.calls,
        lastUsed: now - listener.usage.lastUsed,
        isActive: listener.isActive,
      })
    );

    return {
      totalListeners: this.listenerPool.size,
      maxListeners: this.maxConcurrentListeners,
      utilizationPercent: Math.round(
        (this.listenerPool.size / this.maxConcurrentListeners) * 100
      ),
      lastCleanup: now - this.lastListenerCleanup,
      listeners,
    };
  }

  /**
   * Get current capture state
   * @returns {Object} Current capture state
   */
  getCaptureState() {
    return {
      isCapturing: this.isCapturing,
      hasActiveController: this.currentCaptureController !== null,
      activeListenerCount: this.listenerPool.size,
      listenerPoolStatus: this.getListenerPoolStatus(),
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

    // Clean up listener cleanup interval
    if (this.listenerCleanupInterval) {
      clearTimeout(this.listenerCleanupInterval);
      this.listenerCleanupInterval = null;
    }

    // Remove all listeners from pool
    for (const listenerId of this.listenerPool.keys()) {
      this.removeListener(listenerId);
    }

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
