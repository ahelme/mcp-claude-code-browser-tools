/**
 * Navigation Handler for Browser Tools MCP Extension
 *
 * Implements browser_navigate functionality for Agent G (Navigation Specialist).
 * Handles URL navigation requests from the MCP server via WebSocket communication.
 *
 * Features:
 * - URL validation and normalization
 * - Navigation with proper error handling
 * - Loading state management
 * - Integration with Configuration Panel UI
 * - Real-time status updates
 */

class NavigationHandler {
  constructor() {
    this.isNavigating = false;
    this.navigationTimeout = 10000; // 10 second timeout
    this.currentNavigationController = null;
    this.activeNavigationListener = null; // Track active listener for cleanup
    this.retryAttempts = 0;
    this.maxRetries = 2; // Maximum retry attempts for transient failures

    // Thread-safe configuration to prevent race conditions
    this.threadSafeConfig = new (globalThis.ThreadSafeNavigationConfig ||
      function () {
        // Fallback if module not loaded
        this.setTimeoutSafe = (timeout) =>
          Math.max(1000, Math.min(timeout || 10000, 60000));
        this.setNavigationStateSafe = (state) => true;
        this.getTimeoutSafe = () => this.navigationTimeout || 10000;
        this.getNavigationStateSafe = () => this.isNavigating || false;
      })();

    // Listener Pool Management for better event handling
    this.listenerPool = new Map(); // Store active listeners by ID
    this.listenerIdCounter = 0; // Unique ID generator
    this.maxConcurrentListeners = 5; // Prevent listener accumulation
    this.listenerCleanupInterval = null;
    this.lastListenerCleanup = Date.now();

    // Bind methods to preserve context
    this.handleNavigationRequest = this.handleNavigationRequest.bind(this);
    this.validateUrl = this.validateUrl.bind(this);
    this.normalizeUrl = this.normalizeUrl.bind(this);
    this.navigateToUrl = this.navigateToUrl.bind(this);
    this.updateNavigationStatus = this.updateNavigationStatus.bind(this);
    this.createManagedListener = this.createManagedListener.bind(this);
    this.removeListener = this.removeListener.bind(this);
    this.cleanupStaleListeners = this.cleanupStaleListeners.bind(this);

    // Start listener pool management
    this.startListenerPoolCleanup();

    console.log(
      "🧭 Navigation Handler initialized with listener pool management",
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
        `Navigating to ${normalizedUrl}...`,
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
      this.addLogEntry("error", `Navigation error: ${error.message}`);
      this.updateNavigationStatus("error", error.message);
      this.sendNavigationResponse(sendResponse, requestId, {
        success: false,
        error: error.message,
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
        error.message,
      );
      return url;
    }
  }

  /**
   * Navigation with retry logic for transient failures
   * @param {string} url - Normalized URL to navigate to
   * @returns {Promise<Object>} Navigation result
   */
  async navigateToUrlWithRetry(url) {
    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `🔄 Navigation retry attempt ${attempt}/${this.maxRetries} for: ${url}`,
          );
          this.addLogEntry(
            "info",
            `Retry attempt ${attempt}/${this.maxRetries}`,
          );
          // Wait before retry (exponential backoff with 5-second cap)
          const baseDelay = 1000;
          const exponentialDelay = Math.pow(2, attempt) * baseDelay;
          const cappedDelay = Math.min(exponentialDelay, 5000); // Max 5 seconds
          console.log(`⏳ Waiting ${cappedDelay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, cappedDelay));
        }

        this.retryAttempts = attempt;
        const result = await this.navigateToUrl(url);

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
            result.error.includes("connection"));

        if (!isRetryable || attempt === this.maxRetries) {
          return result;
        }
      } catch (error) {
        lastError = error;
        console.warn(
          `⚠️ Navigation attempt ${attempt + 1} failed:`,
          error.message,
        );

        // Don't retry on non-recoverable errors
        if (attempt === this.maxRetries || !this.isRetryableError(error)) {
          throw error;
        }
      }
    }

    throw lastError || new Error("Navigation failed after all retry attempts");
  }

  /**
   * Check if an error is retryable
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
    ];

    return retryablePatterns.some((pattern) =>
      error.message.toLowerCase().includes(pattern),
    );
  }

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

      // Perform navigation using Chrome APIs
      return new Promise((resolve, reject) => {
        // Create managed listener for navigation completion
        const updateListenerFunction = (updatedTabId, changeInfo, tab) => {
          if (updatedTabId !== tabId) return;

          // Check for loading complete
          if (changeInfo.status === "complete" && tab.url) {
            clearTimeout(timeoutId);
            managedListener.remove(); // Use managed removal

            const loadTime = Date.now() - startTime;
            console.log(`✅ Navigation completed in ${loadTime}ms`);

            resolve({
              success: true,
              finalUrl: tab.url,
              title: tab.title,
              loadTime,
            });
          }

          // Check for navigation errors
          if (changeInfo.status === "complete" && !tab.url) {
            clearTimeout(timeoutId);
            managedListener.remove(); // Use managed removal
            reject(new Error("Navigation completed but no URL available"));
          }
        };

        // Create managed listener with pool management
        const managedListener = this.createManagedListener(
          updateListenerFunction,
          `navigation-${url.substring(0, 50)}`,
        );

        // Store reference for legacy compatibility
        this.activeNavigationListener = managedListener.listener;

        // Set up timeout rejection
        this.currentNavigationController.signal.addEventListener(
          "abort",
          () => {
            managedListener.remove(); // Use managed removal
            this.activeNavigationListener = null;
            reject(
              new Error(`Navigation timeout after ${this.navigationTimeout}ms`),
            );
          },
        );

        // Start listening for updates using managed listener
        chrome.tabs.onUpdated.addListener(managedListener.listener);

        // Perform the navigation
        chrome.tabs.update(tabId, { url }, (tab) => {
          if (chrome.runtime.lastError) {
            clearTimeout(timeoutId);
            managedListener.remove(); // Use managed removal
            this.activeNavigationListener = null;
            reject(
              new Error(
                `Navigation failed: ${chrome.runtime.lastError.message}`,
              ),
            );
            return;
          }

          console.log("🔄 Navigation started successfully");
        });
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

    // Clean up any lingering event listeners
    if (this.activeNavigationListener) {
      try {
        chrome.tabs.onUpdated.removeListener(this.activeNavigationListener);
        this.activeNavigationListener = null;
      } catch (error) {
        console.warn("⚠️ Failed to remove navigation listener:", error.message);
      }
    }

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
        `Response sent for request ${requestId || "unknown"}: ${responseData.success ? "SUCCESS" : "FAILED"}`,
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
      activeListenerCount: this.listenerPool.size,
      listenerPoolStatus: this.getListenerPoolStatus(),
    };
  }

  /**
   * Create a managed listener with automatic cleanup and pooling
   *
   * This method creates a listener that is automatically tracked in the listener pool
   * with usage analytics and automatic cleanup. Prevents memory leaks by enforcing
   * pool size limits and removing stale listeners.
   *
   * @param {Function} listenerFunction - The listener callback function to manage
   * @param {string} [description="navigation"] - Debug description for the listener
   * @returns {Object} Listener management object with the following properties:
   *   - id: {string} Unique listener identifier
   *   - listener: {Function} Wrapped listener function with usage tracking
   *   - remove: {Function} Method to remove listener from pool and Chrome API
   *   - isActive: {Function} Method to check if listener is still active
   *
   * @example
   * const managedListener = handler.createManagedListener(
   *   (tabId, changeInfo, tab) => console.log('Tab updated'),
   *   'custom-tab-monitor'
   * );
   *
   * chrome.tabs.onUpdated.addListener(managedListener.listener);
   *
   * // Clean up when done
   * managedListener.remove();
   *
   * @throws {Error} When listener pool is at capacity and cleanup fails
   * @since 1.1.0
   */
  createManagedListener(listenerFunction, description = "navigation") {
    // Check if we're approaching listener limit
    if (this.listenerPool.size >= this.maxConcurrentListeners) {
      console.warn(
        "⚠️ Listener pool approaching maximum capacity - cleaning up stale listeners",
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

    console.log(`🔧 Created managed listener: ${listenerId} (${description})`);

    return {
      id: listenerId,
      listener: wrappedListener,
      remove: () => this.removeListener(listenerId),
      isActive: () => this.listenerPool.has(listenerId),
    };
  }

  /**
   * Remove a listener from the pool and Chrome API
   *
   * Safely removes a managed listener from both the internal pool and the Chrome API.
   * This method handles cleanup of all associated resources and prevents memory leaks.
   *
   * @param {string} listenerId - Unique ID of listener to remove (from createManagedListener)
   * @returns {boolean} True if listener was successfully removed, false if not found
   *
   * @example
   * const success = handler.removeListener('listener_123_1234567890');
   * if (success) {
   *   console.log('Listener removed successfully');
   * }
   *
   * @see {@link createManagedListener} for creating managed listeners
   * @since 1.1.0
   */
  removeListener(listenerId) {
    const listenerData = this.listenerPool.get(listenerId);
    if (!listenerData) {
      console.warn(
        `⚠️ Attempted to remove non-existent listener: ${listenerId}`,
      );
      return false;
    }

    try {
      // Remove from Chrome API if it's still active
      if (listenerData.isActive) {
        chrome.tabs.onUpdated.removeListener(listenerData.function);
        console.log(
          `🗑️ Removed listener from Chrome API: ${listenerId} (${listenerData.description})`,
        );
      }

      // Remove from pool
      this.listenerPool.delete(listenerId);
      console.log(`🗑️ Removed listener from pool: ${listenerId}`);

      return true;
    } catch (error) {
      console.error(`❌ Error removing listener ${listenerId}:`, error.message);
      // Still remove from pool even if Chrome API removal failed
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
   *
   * @example
   * const cleanedCount = handler.cleanupStaleListeners();
   * console.log(`Cleaned up ${cleanedCount} stale listeners`);
   *
   * @since 1.1.0
   */
  cleanupStaleListeners() {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    const minInactivityTime = 60000; // 1 minute
    let cleaned = 0;

    console.log(
      `🧹 Starting listener pool cleanup (${this.listenerPool.size} listeners)`,
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
          `🧹 Cleaning up stale listener: ${listenerId} (age: ${age}ms, inactive: ${inactivityTime}ms, calls: ${listenerData.usage.calls})`,
        );
        this.removeListener(listenerId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(
        `🧹 Cleaned up ${cleaned} stale listeners. Pool size: ${this.listenerPool.size}`,
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
        `🔄 Next listener cleanup in ${interval / 1000}s (${poolSize} listeners active)`,
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
      }),
    );

    return {
      totalListeners: this.listenerPool.size,
      maxListeners: this.maxConcurrentListeners,
      utilizationPercent: Math.round(
        (this.listenerPool.size / this.maxConcurrentListeners) * 100,
      ),
      lastCleanup: now - this.lastListenerCleanup,
      listeners,
    };
  }

  /**
   * Destroy handler and cleanup all resources
   */
  destroy() {
    console.log("🧭 Destroying NavigationHandler...");

    // Cancel any active navigation
    this.cancelNavigation();

    // Clean up listener cleanup interval
    if (this.listenerCleanupInterval) {
      clearTimeout(this.listenerCleanupInterval);
      this.listenerCleanupInterval = null;
    }

    // Remove all listeners from pool
    for (const listenerId of this.listenerPool.keys()) {
      this.removeListener(listenerId);
    }

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
