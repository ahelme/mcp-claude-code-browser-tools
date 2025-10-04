/**
 * Screenshot UI Manager - Screenshot Module
 *
 * UI updates, preview management, and user feedback for screenshot operations.
 * Extracted from screenshot.js to create focused, maintainable module.
 *
 * @module screenshot/screenshot-ui
 * @version 1.0.0
 * @since 2025-10-02
 */

/**
 * Screenshot UI manager for visual feedback and preview updates
 *
 * Features:
 * - Button state management (capturing, success, error)
 * - Screenshot preview updates with next filename prediction
 * - Log entry management for user feedback
 * - Disk save status indicators
 * - Automatic state reset after completion
 *
 * @class ScreenshotUIManager
 *
 * @example
 * const uiManager = new ScreenshotUIManager();
 * uiManager.updateUI('capturing', 'Taking screenshot...');
 * uiManager.updateUI('success', 'screenshot.png');
 */
class ScreenshotUIManager {
  /**
   * Create a new screenshot UI manager
   *
   * @param {FilenameGenerator} filenameGenerator - Filename generator instance for predictions
   */
  constructor(filenameGenerator) {
    this.filenameGenerator = filenameGenerator;
    console.log('🎨 ScreenshotUIManager initialized');
  }

  /**
   * Update UI elements to show screenshot status
   *
   * Manages button text, state, and visual feedback for screenshot operations.
   * Provides different UI states for capturing, success, error, and ready.
   *
   * @param {string} status - UI status: 'capturing', 'success', 'error', 'ready'
   * @param {string} [message=''] - Status message (filename for success, error message for error)
   * @param {Object|null} [diskStatus=null] - Disk save status information
   * @param {boolean} diskStatus.savedToDisk - Whether screenshot was saved to disk
   * @param {string} diskStatus.fallbackReason - Reason if disk save failed
   *
   * @example
   * // Show capturing state
   * uiManager.updateUI('capturing', 'Taking screenshot...');
   *
   * @example
   * // Show success with disk save status
   * uiManager.updateUI('success', 'screenshot.png', { savedToDisk: true });
   *
   * @example
   * // Show error
   * uiManager.updateUI('error', 'Screenshot capture failed');
   *
   * @since 1.0.0
   */
  updateUI(status, message = '', diskStatus = null) {
    const screenshotBtn = document.getElementById('screenshot-btn');
    if (!screenshotBtn) return;

    switch (status) {
      case 'capturing':
        screenshotBtn.textContent = '📸 Capturing...';
        screenshotBtn.disabled = true;
        this.addLogEntry('info', 'Taking screenshot...');
        break;

      case 'success':
        let buttonText = '✅ Captured!';
        let logMessage = `Screenshot captured: ${message}`;

        // Show disk saving status
        if (diskStatus && diskStatus.savedToDisk) {
          buttonText = '💾 Saved!';
          logMessage = `Screenshot saved to disk: ${message}`;
        } else if (diskStatus && diskStatus.savedToDisk === false) {
          buttonText = '⚠️ Captured';
          logMessage = `Screenshot captured but not saved to disk: ${
            diskStatus.fallbackReason || 'Download failed'
          }`;
        }

        screenshotBtn.textContent = buttonText;
        screenshotBtn.disabled = false;
        this.addLogEntry('info', logMessage);
        this.updateScreenshotPreview(message);

        // Reset button text after 2 seconds
        setTimeout(() => {
          screenshotBtn.textContent = 'Take screenshot 📸';
        }, 2000);
        break;

      case 'error':
        screenshotBtn.textContent = '❌ Failed';
        screenshotBtn.disabled = false;
        this.addLogEntry('error', `Screenshot failed: ${message}`);

        // Reset button text after 3 seconds
        setTimeout(() => {
          screenshotBtn.textContent = 'Take screenshot 📸';
        }, 3000);
        break;

      default:
        screenshotBtn.textContent = 'Take screenshot 📸';
        screenshotBtn.disabled = false;
    }
  }

  /**
   * Update screenshot preview in UI
   *
   * Shows NEXT predicted filename based on current session and page information.
   * Uses FilenameGenerator to predict the next screenshot filename for user preview.
   *
   * @param {string} filename - Current screenshot filename (optional, not currently used)
   *
   * @example
   * await uiManager.updateScreenshotPreview('current-screenshot.png');
   * // UI will show: "Next: Page_xPqj3jTa2c_25_10_02_0002.png"
   *
   * @since 1.0.0
   */
  async updateScreenshotPreview(filename) {
    const previewDiv = document.querySelector('.screenshot-preview');
    if (!previewDiv) return;

    // Generate next predicted filename (using FilenameGenerator module)
    const nextFilename = await this.filenameGenerator.predictNextFilename();
    const filenameSpan = previewDiv.querySelector('.screenshot-filename');
    if (filenameSpan) {
      filenameSpan.textContent = nextFilename;
    }
  }

  /**
   * Add log entry to the console panel
   *
   * Delegates to global addLogEntry function if available, otherwise logs to console.
   * Provides user feedback for screenshot operations and status updates.
   *
   * @param {string} level - Log level: 'info', 'error', 'warn', 'success'
   * @param {string} message - Log message to display
   *
   * @example
   * uiManager.addLogEntry('info', 'Screenshot captured successfully');
   * uiManager.addLogEntry('error', 'Failed to capture screenshot');
   *
   * @since 1.0.0
   */
  addLogEntry(level, message) {
    // Use the existing addLogEntry function if available (from panel.js)
    if (typeof window.addLogEntry === 'function') {
      window.addLogEntry(level, message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Show temporary status message
   *
   * Displays a status message that auto-clears after specified duration.
   *
   * @param {string} status - Status type: 'capturing', 'success', 'error'
   * @param {string} message - Status message
   * @param {number} [duration=3000] - Duration in milliseconds before auto-clear
   *
   * @example
   * uiManager.showTempStatus('success', 'Screenshot saved!', 2000);
   *
   * @since 1.0.0
   */
  showTempStatus(status, message, duration = 3000) {
    this.updateUI(status, message);

    setTimeout(() => {
      this.updateUI('ready', 'Ready for screenshot capture');
    }, duration);
  }

  /**
   * Reset UI to ready state
   *
   * Clears all status indicators and resets button to default state.
   *
   * @example
   * uiManager.resetUI();
   *
   * @since 1.0.0
   */
  resetUI() {
    this.updateUI('ready', 'Ready for screenshot capture');
  }

  /**
   * Update button loading state
   *
   * @param {boolean} isLoading - Whether button should show loading state
   *
   * @example
   * uiManager.setButtonLoading(true);  // Show loading state
   * uiManager.setButtonLoading(false); // Clear loading state
   *
   * @since 1.0.0
   */
  setButtonLoading(isLoading) {
    const screenshotBtn = document.getElementById('screenshot-btn');
    if (!screenshotBtn) return;

    if (isLoading) {
      screenshotBtn.textContent = '📸 Capturing...';
      screenshotBtn.disabled = true;
    } else {
      screenshotBtn.textContent = 'Take screenshot 📸';
      screenshotBtn.disabled = false;
    }
  }

  /**
   * Show error with details
   *
   * @param {string} message - Error message
   * @param {Object} [details] - Additional error details
   *
   * @example
   * uiManager.showError('Capture failed', { code: 'TIMEOUT', retry: 2 });
   *
   * @since 1.0.0
   */
  showError(message, details = null) {
    this.updateUI('error', message);

    if (details) {
      console.error('Screenshot error details:', details);
      this.addLogEntry('error', `Details: ${JSON.stringify(details)}`);
    }
  }
}

// Export for use in other modules
window.ScreenshotUIManager = ScreenshotUIManager;
