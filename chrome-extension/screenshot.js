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
    this.screenshotHistory = new Map();
    this.sessionCode = this.generateSessionCode(); // Randomized session code

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
    this.captureViaBackground = this.captureViaBackground.bind(this);
    this.captureViaWebSocket = this.captureViaWebSocket.bind(this);
    this.generateSmartFilename = this.generateSmartFilename.bind(this);
    this.updateUI = this.updateUI.bind(this);

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
  /**
   * Capture screenshot with retry logic (using shared RetryExecutor)
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

      // If result indicates failure, throw error for retry logic
      if (!result.success && result.error) {
        throw new Error(result.error);
      }

      return result;
    });
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
   * Generate randomized session code (10 characters: alphanumeric)
   * Format: xPqj3jTa2c
   */
  generateSessionCode() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Trim page name to 4 letters (capitalize first letter)
   * Examples: "Google" → "Goog", "github" → "Gith", "API" → "Api"
   */
  trimPageName(title) {
    if (!title || title.length === 0) return "Page";

    // Remove special characters and spaces, take first word
    const cleaned = title.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/)[0];
    if (!cleaned || cleaned.length === 0) return "Page";

    // Take first 4 characters and capitalize first letter
    const trimmed = cleaned.substring(0, 4);
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }

  /**
   * Generate intelligent filename based on page content
   * Format: Goog_xPqj3jTa2c_25_10_02_0001.png
   * - 4-letter page name
   * - 10-char session code
   * - Short date (YY_MM_DD)
   * - 4-digit sequence number
   */
  async generateSmartFilename(selector, fullPage, format = "png") {
    try {
      // Get current page info
      const pageInfo = await this.getPageInfo();

      // Generate 4-letter page name
      let baseName = this.trimPageName(pageInfo.title);

      // Add selector info if capturing specific element
      if (selector) {
        const selectorName = this.sanitizeFilename(
          selector.replace(/[#.]/g, "")
        ).substring(0, 4);
        baseName += `_${selectorName}`;
      }

      // Add fullPage indicator
      if (fullPage) {
        baseName += "_full";
      }

      // Add session code
      baseName += `_${this.sessionCode}`;

      // Add short date (YY_MM_DD)
      const now = new Date();
      const year = String(now.getFullYear()).slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const shortDate = `${year}_${month}_${day}`;

      // Generate sequential number for this session
      const sessionCount = this.getSessionScreenshotCount(baseName);
      const paddedCount = String(sessionCount).padStart(4, "0");

      // Use correct file extension based on format
      const extension = format === "jpeg" ? "jpg" : format;
      return `${baseName}_${shortDate}_${paddedCount}.${extension}`;
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
          logMessage = `Screenshot saved to disk: ${message}`;
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
   * Shows NEXT predicted filename only
   */
  async updateScreenshotPreview(filename) {
    const previewDiv = document.querySelector(".screenshot-preview");
    if (!previewDiv) return;

    // Generate next predicted filename (after current screenshot was taken)
    const nextFilename = await this.predictNextFilename();
    const filenameSpan = previewDiv.querySelector(".screenshot-filename");
    if (filenameSpan) {
      filenameSpan.textContent = nextFilename;
    }
  }

  /**
   * Predict the next screenshot filename for UI preview
   * Uses actual page title and smart naming logic to show accurate preview
   * Format: Goog_xPqj3jTa2c_25_10_02_0001.png
   */
  async predictNextFilename() {
    try {
      // Get actual page info (same logic as generateSmartFilename)
      const pageInfo = await this.getPageInfo();

      // Generate 4-letter page name
      const baseName = this.trimPageName(pageInfo.title);

      // Add session code
      const baseWithSession = `${baseName}_${this.sessionCode}`;

      // Add short date (YY_MM_DD)
      const now = new Date();
      const year = String(now.getFullYear()).slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const shortDate = `${year}_${month}_${day}`;

      // Get NEXT count (current + 1 since we're predicting)
      const currentCount =
        this.screenshotHistory.get(`session_${baseWithSession}`) || 0;
      const nextCount = currentCount + 1;
      const paddedCount = String(nextCount).padStart(4, "0");

      return `${baseWithSession}_${shortDate}_${paddedCount}.png`;
    } catch (error) {
      console.warn("⚠️ Could not predict next filename:", error);
      return "Page_session_25_10_02_0001.png";
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
