/**
 * Screenshot Module for Browser Tools MCP Extension
 *
 * Implements intelligent screenshot capture with:
 * - Full page and element-specific screenshots
 * - Smart naming system based on page content
 * - Integration with MCP HTTP bridge
 * - WebSocket communication for real-time capture
 * - Error handling and user feedback
 *
 * Agent H (Screenshot Specialist) implementation
 */

class ScreenshotManager {
  constructor() {
    this.isCapturing = false;
    this.screenshotHistory = new Map();
    this.initializeEventListeners();

    console.log("📸 Screenshot Manager initialized");
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
   * Main screenshot capture function
   * Supports both MCP API calls and direct panel interactions
   */
  async captureScreenshot(options = {}) {
    const {
      selector = null,
      fullPage = false,
      filename = null,
      source = "panel" // "panel" or "mcp"
    } = options;

    if (this.isCapturing) {
      console.log("⚠️ Screenshot already in progress");
      return { success: false, error: "Screenshot already in progress" };
    }

    this.isCapturing = true;
    console.log(`📸 Starting screenshot capture - fullPage: ${fullPage}, selector: ${selector || "none"}`);

    try {
      // Update UI to show capture in progress
      this.updateUI("capturing");

      // Generate intelligent filename
      const smartFilename = filename || await this.generateSmartFilename(selector, fullPage);

      // Check if we're connected to the HTTP bridge
      if (!window.wsManager || !window.wsManager.isConnected) {
        throw new Error("Not connected to HTTP bridge");
      }

      // Method 1: Direct via background script (for UI button clicks)
      if (source === "panel") {
        return await this.captureViaBackground(selector, fullPage, smartFilename);
      }

      // Method 2: Via WebSocket for MCP calls
      return await this.captureViaWebSocket(selector, fullPage, smartFilename);

    } catch (error) {
      console.error("❌ Screenshot capture failed:", error);
      this.updateUI("error", error.message);
      return { success: false, error: error.message };
    } finally {
      this.isCapturing = false;
    }
  }

  /**
   * Capture screenshot via background script (for panel button clicks)
   */
  async captureViaBackground(selector, fullPage, filename) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "CAPTURE_SCREENSHOT",
          tabId: chrome.devtools.inspectedWindow.tabId,
          selector,
          fullPage,
          filename,
          timestamp: Date.now(),
        },
        (response) => {
          if (response && response.success) {
            console.log(`✅ Screenshot captured via background: ${response.filename}`);
            this.updateUI("success", response.filename);
            this.addToHistory(response);
            resolve(response);
          } else {
            const error = response?.error || "Unknown error";
            console.error(`❌ Screenshot failed via background: ${error}`);
            this.updateUI("error", error);
            resolve({ success: false, error });
          }
        }
      );
    });
  }

  /**
   * Capture screenshot via WebSocket (for MCP calls)
   */
  async captureViaWebSocket(selector, fullPage, filename) {
    return new Promise((resolve, reject) => {
      const requestId = Date.now().toString();
      const timeout = setTimeout(() => {
        reject(new Error("Screenshot request timeout"));
      }, 30000);

      // Set up one-time listener for screenshot response
      const messageHandler = (message) => {
        if (message.type === "screenshot-data" && message.requestId === requestId) {
          clearTimeout(timeout);
          window.wsManager.off("message", messageHandler);

          console.log(`✅ Screenshot captured via WebSocket: ${filename}`);
          this.updateUI("success", filename);

          const response = {
            success: true,
            filename,
            data: message.data,
            path: message.path || `.screenshots/${filename}`,
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
        requestId,
        tabId: chrome.devtools.inspectedWindow.tabId,
        timestamp: Date.now(),
      };

      console.log("📤 Sending screenshot request via WebSocket:", request);
      window.wsManager.send(request);
    });
  }

  /**
   * Generate intelligent filename based on page content
   */
  async generateSmartFilename(selector, fullPage) {
    try {
      // Get current page info
      const pageInfo = await this.getPageInfo();

      // Generate base name from page title
      let baseName = this.sanitizeFilename(pageInfo.title) || "screenshot";

      // Add selector info if capturing specific element
      if (selector) {
        const selectorName = this.sanitizeFilename(selector.replace(/[#.]/g, ""));
        baseName += `_${selectorName}`;
      }

      // Add fullPage indicator
      if (fullPage) {
        baseName += "_fullpage";
      }

      // Add timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");

      // Generate sequential number for this session
      const sessionCount = this.getSessionScreenshotCount(baseName);
      const paddedCount = String(sessionCount).padStart(4, "0");

      return `${baseName}_${timestamp}_${paddedCount}.png`;
    } catch (error) {
      console.warn("⚠️ Could not generate smart filename, using fallback:", error);
      return this.getFallbackFilename(selector, fullPage);
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
  getFallbackFilename(selector, fullPage) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const type = fullPage ? "fullpage" : selector ? "element" : "page";
    return `screenshot_${type}_${timestamp}.png`;
  }

  /**
   * Update UI elements to show screenshot status
   */
  updateUI(status, message = "") {
    const screenshotBtn = document.getElementById("screenshot-btn");
    if (!screenshotBtn) return;

    switch (status) {
      case "capturing":
        screenshotBtn.textContent = "📸 Capturing...";
        screenshotBtn.disabled = true;
        this.addLogEntry("info", "Taking screenshot...");
        break;

      case "success":
        screenshotBtn.textContent = "✅ Captured!";
        screenshotBtn.disabled = false;
        this.addLogEntry("info", `Screenshot saved: ${message}`);
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
   * Clear screenshot history
   */
  clearHistory() {
    this.screenshotHistory.clear();
    console.log("📸 Screenshot history cleared");
  }
}

// Initialize screenshot manager
const screenshotManager = new ScreenshotManager();

// Export for global access
window.screenshotManager = screenshotManager;

// Enhanced captureScreenshot function for panel.js integration
window.captureScreenshot = function(options = {}) {
  return screenshotManager.captureScreenshot({ ...options, source: "panel" });
};

// MCP API integration
window.mcp_browser_screenshot = function(params = {}) {
  const { selector, fullPage = false } = params;
  return screenshotManager.captureScreenshot({
    selector,
    fullPage,
    source: "mcp"
  });
};

console.log("📸 Screenshot module loaded - Agent H ready for action!");