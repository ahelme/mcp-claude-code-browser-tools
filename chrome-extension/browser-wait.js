/**
 * Browser Wait Tool
 *
 * Waits for elements, conditions, or timeouts.
 * Essential for handling async page updates and dynamic content.
 */

class BrowserWaitTool {
  constructor() {
    this.defaultTimeout = 30000; // 30 seconds
  }

  /**
   * Wait for an element to appear
   * @param {string} selector - CSS selector to wait for
   * @param {Object} options - Wait options
   * @returns {Promise<Object>} Wait result
   */
  async waitForElement(selector, options = {}) {
    const {
      timeout = this.defaultTimeout,
      visible = true,
      hidden = false
    } = options;

    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkElement = () => {
        const element = document.querySelector(selector);
        const elapsed = Date.now() - startTime;

        if (elapsed >= timeout) {
          resolve({
            success: false,
            error: `Timeout waiting for element: ${selector}`,
            timeout,
            elapsed
          });
          return;
        }

        // Check if element exists
        if (!element) {
          setTimeout(checkElement, 100);
          return;
        }

        // Check visibility if requested
        if (visible) {
          const rect = element.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 &&
                          window.getComputedStyle(element).visibility !== 'hidden';

          if (!isVisible) {
            setTimeout(checkElement, 100);
            return;
          }
        }

        // Check hidden if requested
        if (hidden) {
          const rect = element.getBoundingClientRect();
          const isHidden = rect.width === 0 || rect.height === 0 ||
                         window.getComputedStyle(element).visibility === 'hidden';

          if (!isHidden) {
            setTimeout(checkElement, 100);
            return;
          }
        }

        resolve({
          success: true,
          selector,
          found: true,
          visible: visible ? true : undefined,
          elapsed: Date.now() - startTime,
          timestamp: Date.now()
        });
      };

      checkElement();
    });
  }

  /**
   * Wait for a condition to be true
   * @param {Function} condition - Function that returns boolean
   * @param {Object} options - Wait options
   * @returns {Promise<Object>} Wait result
   */
  async waitForCondition(condition, options = {}) {
    const {
      timeout = this.defaultTimeout,
      interval = 100
    } = options;

    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkCondition = () => {
        const elapsed = Date.now() - startTime;

        if (elapsed >= timeout) {
          resolve({
            success: false,
            error: 'Timeout waiting for condition',
            timeout,
            elapsed
          });
          return;
        }

        try {
          if (condition()) {
            resolve({
              success: true,
              conditionMet: true,
              elapsed: Date.now() - startTime,
              timestamp: Date.now()
            });
          } else {
            setTimeout(checkCondition, interval);
          }
        } catch (error) {
          resolve({
            success: false,
            error: error.message,
            elapsed
          });
        }
      };

      checkCondition();
    });
  }

  /**
   * Wait for navigation to complete
   * @param {Object} options - Wait options
   * @returns {Promise<Object>} Wait result
   */
  async waitForNavigation(options = {}) {
    const {
      timeout = this.defaultTimeout,
      waitUntil = 'load' // 'load', 'domcontentloaded', 'networkidle'
    } = options;

    return new Promise((resolve) => {
      const startTime = Date.now();
      let resolved = false;

      const resolveWait = (event) => {
        if (resolved) return;
        resolved = true;

        resolve({
          success: true,
          event,
          elapsed: Date.now() - startTime,
          timestamp: Date.now()
        });
      };

      // Set timeout
      const timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;

        resolve({
          success: false,
          error: 'Navigation timeout',
          timeout,
          elapsed: Date.now() - startTime
        });
      }, timeout);

      // Listen for appropriate event
      if (waitUntil === 'load') {
        if (document.readyState === 'complete') {
          clearTimeout(timeoutId);
          resolveWait('load');
        } else {
          window.addEventListener('load', () => {
            clearTimeout(timeoutId);
            resolveWait('load');
          }, { once: true });
        }
      } else if (waitUntil === 'domcontentloaded') {
        if (document.readyState !== 'loading') {
          clearTimeout(timeoutId);
          resolveWait('domcontentloaded');
        } else {
          document.addEventListener('DOMContentLoaded', () => {
            clearTimeout(timeoutId);
            resolveWait('domcontentloaded');
          }, { once: true });
        }
      }
    });
  }

  /**
   * Simple timeout wait
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<Object>} Wait result
   */
  async waitForTimeout(ms) {
    const startTime = Date.now();

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          waited: ms,
          elapsed: Date.now() - startTime,
          timestamp: Date.now()
        });
      }, ms);
    });
  }

  /**
   * Wait for text content to appear
   * @param {string} text - Text to wait for
   * @param {Object} options - Wait options
   * @returns {Promise<Object>} Wait result
   */
  async waitForText(text, options = {}) {
    const {
      timeout = this.defaultTimeout,
      selector = 'body'
    } = options;

    return this.waitForCondition(() => {
      const element = document.querySelector(selector);
      return element?.textContent.includes(text) || false;
    }, { timeout });
  }
}

// Make available globally
window.BrowserWaitTool = BrowserWaitTool;
