/**
 * Navigation Handler for Browser Tools MCP Extension
 *
 * Implements browser_navigate functionality for Agent C (Navigation Specialist).
 * Handles URL navigation requests from the MCP server via WebSocket communication.
 *
 * 📄 **WebSocket Protocol**: chrome-extension/contracts/websocket.asyncapi.yaml
 * 🔗 **AsyncAPI Spec**: https://spec.asyncapi.com/v3.0.0/
 * 🌐 **Documentation**: http://localhost:3020/ws-docs
 *
 * Features:
 * - URL validation and normalization
 * - Navigation with proper error handling (navigationResult messages per AsyncAPI)
 * - Loading state management
 * - Integration with Configuration Panel UI
 * - Real-time status updates via WebSocket
 *
 * @see {@link ./contracts/websocket.asyncapi.yaml} NavigationResultMessage schema
 */

class NavigationHandler {
  constructor() {
    this.isNavigating = false;
    this.navigationTimeout = 10000; // 10 second timeout
    this.currentNavigationController = null;
    this.activeNavigationListener = null; // Track active listener for cleanup

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
      ],
      debugPrefix: "[Navigation]",
    });

    // Thread-safe configuration (using shared utility)
    this.threadSafeConfig = new ThreadSafeState(
      {
        timeout: { value: 10000, min: 1000, max: 60000 },
        isNavigating: false,
      },
      {
        debugPrefix: "[Navigation]",
      }
    );

    // Provide backward-compatible methods
    this.threadSafeConfig.setTimeoutSafe = (timeout) =>
      this.threadSafeConfig.setStateSafe("timeout", timeout);
    this.threadSafeConfig.getTimeoutSafe = () =>
      this.threadSafeConfig.getState("timeout");
    this.threadSafeConfig.setNavigationStateSafe = (state) =>
      this.threadSafeConfig.setState("isNavigating", state);
    this.threadSafeConfig.getNavigationStateSafe = () =>
      this.threadSafeConfig.getState("isNavigating");

    // Listener Pool Management for better event handling (using shared utility)
    this.listenerPool = new ListenerPoolManager({
      max: 5,
      maxAge: 300000, // 5 minutes
      minInactiveTime: 60000, // 1 minute
      debugPrefix: "[Navigation]",
    });

    // Bind methods to preserve context
    this.handleNavigationRequest = this.handleNavigationRequest.bind(this);
    this.validateUrl = this.validateUrl.bind(this);
    this.normalizeUrl = this.normalizeUrl.bind(this);
    this.navigateToUrl = this.navigateToUrl.bind(this);
    this.updateNavigationStatus = this.updateNavigationStatus.bind(this);

    // Start listener pool management (using shared utility)
    this.listenerPool.startListenerPoolCleanup();

    console.log(
      "🧭 Navigation Handler initialized with listener pool management"
    );
  }

  /**
   * Handle navigation request from WebSocket
   * @param {Object} message - WebSocket message with navigation data
   * @param {Function} sendResponse - Response callback function
   */
  async handleNavigationRequest(message, sendResponse) {
    const { url, requestId, timeout } = message;

    console.log("🧭 Navigation request received:", { url, requestId, timeout });

    // Enhanced message validation
    if (!message || typeof message !== "object") {
      const error = "Invalid message format - expected object";
      console.error("❌ Navigation error:", error);
      this.sendNavigationResponse(sendResponse, requestId, {
        success: false,
        error,
      });
      return;
    }

    // Set custom timeout if provided with validation (thread-safe)
    let effectiveTimeout = this.navigationTimeout;
    if (timeout && typeof timeout === "number" && timeout > 0) {
      // Use thread-safe configuration to prevent race conditions
      effectiveTimeout = this.threadSafeConfig.setTimeoutSafe(timeout);
      this.navigationTimeout = effectiveTimeout;
      console.log("🕐 Custom timeout safely set:", effectiveTimeout + "ms");
    }

    // Enhanced input validation
    if (!url) {
      const error = "URL is required for navigation";
      console.error("❌ Navigation error:", error);
      this.addLogEntry("error", error);
      this.sendNavigationResponse(sendResponse, requestId, {
        success: false,
        error,
      });
      return;
    }

    // Check if already navigating
    if (this.isNavigating) {
      const error = "Navigation already in progress";
      console.warn("⚠️ Navigation warning:", error);
      this.addLogEntry("error", error);
      this.sendNavigationResponse(sendResponse, requestId, {
        success: false,
        error,
      });
      return;
    }

    try {
      // Validate and normalize URL
      const validationResult = this.validateUrl(url);
      if (!validationResult.isValid) {
        console.error("❌ URL validation failed:", validationResult.error);
        this.addLogEntry("error", `Invalid URL: ${validationResult.error}`);
        this.sendNavigationResponse(sendResponse, requestId, {
          success: false,
          error: validationResult.error,
        });
        return;
      }

      const normalizedUrl = this.normalizeUrl(validationResult.url);
      console.log("🔄 Normalized URL:", normalizedUrl);

      // Start navigation (thread-safe)
      this.threadSafeConfig.setNavigationStateSafe(true);
      this.isNavigating = true;
      this.updateNavigationStatus(
        "navigating",
        `Navigating to ${normalizedUrl}...`
      );
      this.addLogEntry("info", `Navigating to: ${normalizedUrl}`);

      // Perform navigation with retry logic
      const result = await this.navigateToUrlWithRetry(normalizedUrl);

      if (result.success) {
        console.log("✅ Navigation successful");
        this.addLogEntry("info", `Successfully navigated to: ${normalizedUrl}`);
        this.updateNavigationStatus("success", `Loaded: ${normalizedUrl}`);
        this.sendNavigationResponse(sendResponse, requestId, {
          success: true,
          url: normalizedUrl,
          finalUrl: result.finalUrl,
          title: result.title,
          loadTime: result.loadTime,
          timestamp: Date.now(),
        });
      } else {
        console.error("❌ Navigation failed:", result.error);
        this.addLogEntry("error", `Navigation failed: ${result.error}`);
        this.updateNavigationStatus("error", `Failed: ${result.error}`);
        this.sendNavigationResponse(sendResponse, requestId, {
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("❌ Navigation error:", error);

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

      this.addLogEntry("error", `Navigation error: ${errorMessage}`);
      this.updateNavigationStatus("error", errorMessage);
      this.sendNavigationResponse(sendResponse, requestId, {
        success: false,
        error: errorMessage,
      });
    } finally {
      // Reset navigation state (thread-safe)
      this.threadSafeConfig.setNavigationStateSafe(false);
      this.isNavigating = false;
      this.retryAttempts = 0; // Reset retry counter
      // Reset timeout to default
      this.navigationTimeout = 10000;

      // Clear status after delay
      setTimeout(() => {
        this.updateNavigationStatus("ready", "Ready for navigation");
      }, 3000);
    }
  }

  /**
   * Validate URL format and accessibility
   * @param {string} url - URL to validate
   * @returns {Object} Validation result with isValid boolean and error message
   */
  validateUrl(url) {
    // Basic validation
    if (typeof url !== "string" || url.trim().length === 0) {
      return { isValid: false, error: "URL must be a non-empty string" };
    }

    const trimmedUrl = url.trim();

    // Check for blocked protocols (allow devtools for Chrome extension context)
    const blockedProtocols = [
      "file:",
      "chrome:",
      "chrome-extension:",
      "moz-extension:",
    ];

    // Allow devtools URLs when running in Chrome extension context
    const isDevtools = trimmedUrl.toLowerCase().startsWith("devtools:");
    if (isDevtools && typeof chrome !== "undefined" && chrome.devtools) {
      console.log("🔧 Allowing devtools URL in Chrome extension context");
      // Don't block devtools URLs - they're internal browser functionality
    } else {
      for (const protocol of blockedProtocols) {
        if (trimmedUrl.toLowerCase().startsWith(protocol)) {
          return {
            isValid: false,
            error: `Protocol ${protocol} not allowed for security reasons`,
          };
        }
      }
    }

    // Check for data URLs (can be dangerous)
    if (trimmedUrl.toLowerCase().startsWith("data:")) {
      return {
        isValid: false,
        error: "Data URLs not allowed for security reasons",
      };
    }

    // Basic URL format validation
    try {
      // Try to create URL object for validation
      let testUrl;

      // Handle devtools URLs specially
      if (trimmedUrl.toLowerCase().startsWith("devtools:")) {
        if (typeof chrome !== "undefined" && chrome.devtools) {
          return { isValid: true, url: trimmedUrl };
        } else {
          return {
            isValid: false,
            error: "Devtools URLs only allowed in Chrome extension context",
          };
        }
      }

      // If no protocol specified, assume https
      if (!trimmedUrl.includes("://")) {
        testUrl = new URL(`https://${trimmedUrl}`);
      } else {
        testUrl = new URL(trimmedUrl);
      }

      // Validate protocol
      const allowedProtocols = ["http:", "https:"];
      if (!allowedProtocols.includes(testUrl.protocol)) {
        return {
          isValid: false,
          error: `Protocol ${testUrl.protocol} not supported. Use http: or https:`,
        };
      }

      // Validate hostname
      if (!testUrl.hostname || testUrl.hostname.length === 0) {
        return {
          isValid: false,
          error: "Invalid hostname",
        };
      }

      return { isValid: true, url: testUrl.href };
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid URL format: ${error.message}`,
      };
    }
  }

  /**
   * Normalize URL for consistent handling
   * @param {string} url - URL to normalize
   * @returns {string} Normalized URL
   */
  normalizeUrl(url) {
    try {
      // If no protocol specified, assume https
      if (!url.includes("://")) {
        url = `https://${url}`;
      }

      const urlObj = new URL(url);

      // Remove trailing slash for consistency (except for root)
      if (
        urlObj.pathname === "/" &&
        urlObj.search === "" &&
        urlObj.hash === ""
      ) {
        return urlObj.href;
      } else if (
        urlObj.href.endsWith("/") &&
        urlObj.search === "" &&
        urlObj.hash === ""
      ) {
        return urlObj.href.slice(0, -1);
      }

      return urlObj.href;
    } catch (error) {
      console.warn(
        "🔄 URL normalization failed, using original:",
        error.message
      );
      return url;
    }
  }

  /**
   * Navigation with retry logic (using shared RetryExecutor)
   * @param {string} url - Normalized URL to navigate to
   * @returns {Promise<Object>} Navigation result
   */
  async navigateToUrlWithRetry(url) {
    return this.retryExecutor.executeWithRetry(async () => {
      const result = await this.navigateToUrl(url);

      // If result indicates failure, throw error for retry logic
      if (!result.success && result.error) {
        throw new Error(result.error);
      }

      return result;
    });
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is retryable
   */
  // Retry error checking now delegated to shared RetryExecutor
  // Available via this.retryExecutor.isRetryableError(error)

  /**
   * Perform the actual navigation
   * @param {string} url - Normalized URL to navigate to
   * @returns {Promise<Object>} Navigation result
   */
  async navigateToUrl(url) {
    const startTime = Date.now();

    try {
      // Get current tab ID
      const tabId = chrome.devtools?.inspectedWindow?.tabId;
      if (!tabId) {
        throw new Error("No active tab found");
      }

      console.log(`🧭 Navigating tab ${tabId} to: ${url}`);

      // Create abort controller for timeout
      this.currentNavigationController = new AbortController();

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (this.currentNavigationController) {
          this.currentNavigationController.abort();
        }
      }, this.navigationTimeout);

      // Delegate navigation to background script via message passing
      // DevTools panels don't have access to chrome.tabs API
      return new Promise((resolve, reject) => {
        const requestId = `nav_${Date.now()}`;

        // Set up timeout rejection
        this.currentNavigationController.signal.addEventListener(
          "abort",
          () => {
            reject(
              new Error(`Navigation timeout after ${this.navigationTimeout}ms`)
            );
          }
        );

        // Send navigation request to background script
        chrome.runtime.sendMessage(
          {
            type: "NAVIGATE_TAB",
            tabId,
            url,
            requestId,
            timeout: this.navigationTimeout,
          },
          (response) => {
            clearTimeout(timeoutId);

            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }

            const loadTime = Date.now() - startTime;

            if (response && response.success) {
              console.log(`✅ Navigation completed in ${loadTime}ms`);
              resolve({
                success: true,
                finalUrl: response.url || url,
                title: response.title || "",
                loadTime,
              });
            } else {
              reject(new Error(response?.error || "Navigation failed"));
            }
          }
        );
      });
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error(`❌ Navigation failed after ${loadTime}ms:`, error);
      return {
        success: false,
        error: error.message,
        loadTime,
      };
    } finally {
      this.currentNavigationController = null;
    }
  }

  /**
   * Update navigation status in the UI
   * @param {string} state - Navigation state (ready, navigating, success, error)
   * @param {string} message - Status message
   */
  updateNavigationStatus(state, message) {
    // Update scan status indicator (reusing existing UI element)
    const scanIndicator = document.getElementById("scan-indicator");
    const scanText = document.getElementById("scan-text");

    if (scanIndicator && scanText) {
      // Map navigation states to scan indicator states
      const stateMapping = {
        ready: "ready-state",
        navigating: "scanning",
        success: "connected",
        error: "failed",
      };

      const indicatorState = stateMapping[state] || "ready-state";
      scanIndicator.className = `scan-indicator ${indicatorState}`;
      scanText.textContent = message;
    }

    console.log(`🧭 Navigation status: ${state} - ${message}`);
  }

  /**
   * Add log entry to the logs display
   * @param {string} level - Log level (info, error, warning)
   * @param {string} message - Log message
   */
  addLogEntry(level, message) {
    // Use the existing panel.js addLogEntry function if available
    if (window.addLogEntry && typeof window.addLogEntry === "function") {
      window.addLogEntry(level, `[NAV] ${message}`);
      return;
    }

    // Fallback: direct DOM manipulation
    const logsDisplay = document.getElementById("logs-display");
    if (logsDisplay) {
      const timestamp = new Date().toLocaleTimeString();
      const logClass = level === "error" ? "log-error" : "log-info";

      const logEntry = document.createElement("div");
      logEntry.className = `log-entry ${logClass}`;
      logEntry.textContent = `[${timestamp}] [NAV] ${message}`;

      logsDisplay.appendChild(logEntry);
      logsDisplay.scrollTop = logsDisplay.scrollHeight;
    }
  }

  /**
   * Cancel any ongoing navigation with proper cleanup
   */
  cancelNavigation() {
    if (this.currentNavigationController) {
      console.log("🛑 Cancelling ongoing navigation");
      this.currentNavigationController.abort();
      this.currentNavigationController = null;
    }

    // Navigation cleanup handled by background script
    this.activeNavigationListener = null;

    this.isNavigating = false;
    this.navigationTimeout = 10000; // Reset to default
    this.updateNavigationStatus("ready", "Navigation cancelled");
  }

  /**
   * Enhanced response handler with request tracking
   * @param {Function} sendResponse - Response callback function
   * @param {string} requestId - Request identifier for tracking
   * @param {Object} responseData - Response data to send
   */
  sendNavigationResponse(sendResponse, requestId, responseData) {
    try {
      // Add metadata to response
      const enhancedResponse = {
        ...responseData,
        requestId,
        timestamp: Date.now(),
        source: "NavigationHandler",
        version: "1.1.0",
      };

      console.log("📤 Sending navigation response:", enhancedResponse);

      // Send response via callback
      if (typeof sendResponse === "function") {
        sendResponse(enhancedResponse);
      } else {
        console.warn("⚠️ No response callback provided - response not sent");
      }

      // Log response for debugging
      this.addLogEntry(
        "info",
        `Response sent for request ${requestId || "unknown"}: ${
          responseData.success ? "SUCCESS" : "FAILED"
        }`
      );
    } catch (error) {
      console.error("❌ Error sending navigation response:", error);
      this.addLogEntry("error", `Failed to send response: ${error.message}`);

      // Fallback response
      if (typeof sendResponse === "function") {
        try {
          sendResponse({
            success: false,
            error: "Response transmission failed",
            requestId,
            timestamp: Date.now(),
          });
        } catch (fallbackError) {
          console.error("❌ Even fallback response failed:", fallbackError);
        }
      }
    }
  }

  /**
   * Get current navigation state
   * @returns {Object} Current navigation state
   */
  getNavigationState() {
    return {
      isNavigating: this.isNavigating,
      hasActiveController: this.currentNavigationController !== null,
      activeListenerCount: this.listenerPool.listenerPool.size,
      listenerPoolStatus: this.listenerPool.getListenerPoolStatus(),
    };
  }

  // Listener pool methods now delegated to shared ListenerPoolManager
  // All methods available via this.listenerPool (createManagedListener, removeListener, etc.)

  /**
   * Destroy handler and cleanup all resources
   */
  destroy() {
    console.log("🧭 Destroying NavigationHandler...");

    // Cancel any active navigation
    this.cancelNavigation();

    // Destroy listener pool (uses shared utility)
    this.listenerPool.destroy();

    console.log("🧭 NavigationHandler destroyed and resources cleaned up");
  }
}

// Create global navigation handler instance
window.NavigationHandler = NavigationHandler;

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = NavigationHandler;
}

console.log("🧭 Navigation module loaded successfully");
