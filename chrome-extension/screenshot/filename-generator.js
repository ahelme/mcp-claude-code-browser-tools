/**
 * Screenshot Filename Generator - Screenshot Module
 *
 * Intelligent filename generation for screenshots with session tracking.
 * Extracted from screenshot.js to create focused, maintainable module.
 *
 * @module screenshot/filename-generator
 * @version 1.0.0
 * @since 2025-10-02
 */

/**
 * Generates smart filenames for screenshots with session tracking
 *
 * Features:
 * - 4-letter page name generation
 * - 10-character session codes
 * - Short date format (YY_MM_DD)
 * - Sequential numbering per session
 * - Filesystem-safe sanitization
 * - Fallback filename generation
 *
 * @class FilenameGenerator
 *
 * @example
 * const generator = new FilenameGenerator();
 * const filename = await generator.generateSmartFilename(
 *   null, // selector
 *   false, // fullPage
 *   'png' // format
 * );
 * // Returns: "Goog_xPqj3jTa2c_25_10_02_0001.png"
 */
class FilenameGenerator {
  /**
   * Create a new filename generator
   */
  constructor() {
    this.sessionCode = this.generateSessionCode();
    this.screenshotHistory = new Map();

    console.log(`📝 FilenameGenerator initialized with session code: ${this.sessionCode}`);
  }

  /**
   * Generate random 10-character session code
   * Used to group screenshots from same browsing session
   *
   * @returns {string} 10-character alphanumeric code
   *
   * @example
   * const code = generator.generateSessionCode();
   * // Returns: "xPqj3jTa2c"
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
   *
   * @param {string} title - Page title
   * @returns {string} 4-character page name
   *
   * @example
   * generator.trimPageName("Google");    // Returns: "Goog"
   * generator.trimPageName("github");    // Returns: "Gith"
   * generator.trimPageName("API Docs");  // Returns: "Api"
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
   *
   * Format: Goog_xPqj3jTa2c_25_10_02_0001.png
   * - 4-letter page name
   * - 10-char session code
   * - Short date (YY_MM_DD)
   * - 4-digit sequence number
   *
   * @param {string|null} selector - CSS selector for element screenshot
   * @param {boolean} fullPage - Whether capturing full page
   * @param {string} format - Image format (png, jpeg)
   * @returns {Promise<string>} Generated filename
   *
   * @example
   * const filename = await generator.generateSmartFilename(null, true, 'png');
   * // Returns: "Goog_full_xPqj3jTa2c_25_10_02_0001.png"
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
   * Predict the next screenshot filename for UI preview
   *
   * @returns {Promise<string>} Predicted next filename
   *
   * @example
   * const nextFilename = await generator.predictNextFilename();
   * // Returns: "Goog_xPqj3jTa2c_25_10_02_0002.png"
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
   * Get current page information for smart naming
   *
   * @private
   * @returns {Promise<Object>} Page info with title and URL
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
   *
   * @param {string} name - Raw filename
   * @returns {string} Sanitized filename
   *
   * @example
   * generator.sanitizeFilename("My<File>Name");
   * // Returns: "My_File_Name"
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
   *
   * @private
   * @param {string} baseName - Base filename
   * @returns {number} Next sequence number
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
   *
   * @param {string|null} selector - CSS selector
   * @param {boolean} fullPage - Full page flag
   * @param {string} format - Image format
   * @returns {string} Fallback filename with timestamp
   *
   * @example
   * generator.getFallbackFilename(null, true, 'png');
   * // Returns: "screenshot_fullpage_2025-10-02T14-30-45.png"
   */
  getFallbackFilename(selector, fullPage, format = "png") {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const type = fullPage ? "fullpage" : selector ? "element" : "page";
    const extension = format === "jpeg" ? "jpg" : format;
    return `screenshot_${type}_${timestamp}.${extension}`;
  }

  /**
   * Add screenshot to history tracking
   *
   * @param {Object} screenshotData - Screenshot metadata
   */
  addToHistory(screenshotData) {
    const historyKey = `history_${Date.now()}`;
    this.screenshotHistory.set(historyKey, {
      ...screenshotData,
      timestamp: new Date().toISOString(),
      tabId: chrome.devtools.inspectedWindow.tabId,
    });
  }

  /**
   * Get screenshot history
   *
   * @returns {Array} Array of [key, value] history entries
   */
  getHistory() {
    return Array.from(this.screenshotHistory.entries());
  }

  /**
   * Clear screenshot history
   */
  clearHistory() {
    this.screenshotHistory.clear();
    console.log("📝 Screenshot history cleared");
  }

  /**
   * Reset generator (regenerate session code and clear history)
   */
  reset() {
    this.sessionCode = this.generateSessionCode();
    this.screenshotHistory.clear();
    console.log(`📝 FilenameGenerator reset with new session code: ${this.sessionCode}`);
  }
}

// Export for use in other modules
window.FilenameGenerator = FilenameGenerator;
