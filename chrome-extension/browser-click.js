/**
 * Browser Click Tool
 *
 * Clicks elements on the page using CSS selectors.
 * Supports various click types and validation.
 */

class BrowserClickTool {
  constructor() {
    this.lastClicked = null;
  }

  /**
   * Click an element by CSS selector
   * @param {string} selector - CSS selector for element to click
   * @param {Object} options - Click options
   * @returns {Object} Click result
   */
  async click(selector, options = {}) {
    const {
      clickType = 'left', // 'left', 'right', 'double', 'middle'
      waitForElement = true,
      timeout = 5000,
      scrollIntoView = true
    } = options;

    try {
      const element = document.querySelector(selector);

      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`
        };
      }

      // Scroll into view if requested
      if (scrollIntoView) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.wait(300); // Wait for scroll animation
      }

      // Perform click based on type
      switch (clickType) {
        case 'left':
          element.click();
          break;

        case 'right':
          element.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: window
          }));
          break;

        case 'double':
          element.dispatchEvent(new MouseEvent('dblclick', {
            bubbles: true,
            cancelable: true,
            view: window
          }));
          break;

        case 'middle':
          element.dispatchEvent(new MouseEvent('auxclick', {
            bubbles: true,
            cancelable: true,
            button: 1,
            view: window
          }));
          break;

        default:
          element.click();
      }

      this.lastClicked = {
        selector,
        element: element.tagName.toLowerCase(),
        clickType,
        timestamp: Date.now()
      };

      return {
        success: true,
        selector,
        element: element.tagName.toLowerCase(),
        clickType,
        text: element.textContent?.trim().substring(0, 50) || '',
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        selector
      };
    }
  }

  /**
   * Wait helper
   * @private
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get last clicked element info
   */
  getLastClicked() {
    return this.lastClicked;
  }
}

// Make available globally
window.BrowserClickTool = BrowserClickTool;
