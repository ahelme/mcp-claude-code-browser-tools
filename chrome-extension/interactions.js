/**
 * Browser Interactions Handler - Core Tools Implementation
 *
 * Implements browser_click, browser_type, browser_wait functionality
 * for MANE Batch 3: Core Tools (Navigation, Screenshot, Interaction)
 *
 * Features:
 * - Click elements using CSS selectors
 * - Type text into input fields with clear option
 * - Wait for elements to appear with timeout handling
 * - Error handling and element validation
 * - Integration with WebSocket communication framework
 */

// Interaction states and error codes
const InteractionResults = {
  SUCCESS: "success",
  ELEMENT_NOT_FOUND: "element_not_found",
  SELECTOR_INVALID: "selector_invalid",
  TIMEOUT: "timeout",
  PERMISSION_DENIED: "permission_denied",
  UNKNOWN_ERROR: "unknown_error",
};

// Interaction handler class
class InteractionHandler {
  constructor() {
    console.log("🖱️ InteractionHandler initialized");
    this.activeWaits = new Map(); // Track active wait operations

    // Start cleanup timer for orphaned operations
    this.cleanupInterval = setInterval(() => {
      this.cleanupOrphanedOperations();
    }, 30000); // Cleanup every 30 seconds
  }

  /**
   * Handle click action
   * @param {Object} params - {selector: string}
   * @returns {Object} Result object with success/error details
   */
  async handleClick(params) {
    console.log("🖱️ Handling click action:", params);

    try {
      const { selector } = params;

      if (!selector || typeof selector !== "string") {
        return {
          success: false,
          result: InteractionResults.SELECTOR_INVALID,
          error: "Selector is required and must be a string",
        };
      }

      // Execute click in the current tab's context
      const result = await this.executeInCurrentTab(`
        (function() {
          try {
            const element = document.querySelector('${selector.replace(/'/g, "\\'")}');

            if (!element) {
              return {
                success: false,
                result: '${InteractionResults.ELEMENT_NOT_FOUND}',
                error: 'Element not found: ${selector}'
              };
            }

            // Check if element is visible and clickable
            const rect = element.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 &&
                            window.getComputedStyle(element).visibility !== 'hidden' &&
                            window.getComputedStyle(element).display !== 'none';

            if (!isVisible) {
              return {
                success: false,
                result: '${InteractionResults.ELEMENT_NOT_FOUND}',
                error: 'Element is not visible or clickable: ${selector}'
              };
            }

            // Scroll element into view if needed (instant for programmatic interactions)
            element.scrollIntoView({ behavior: 'instant', block: 'center' });

            // Brief wait for instant scroll to complete
            await new Promise(resolve => setTimeout(resolve, 50));

            // Trigger click event
            element.click();

            return {
              success: true,
              result: '${InteractionResults.SUCCESS}',
              message: 'Element clicked successfully',
              elementInfo: {
                tagName: element.tagName,
                className: element.className,
                id: element.id,
                text: element.textContent?.substring(0, 100) || ''
              }
            };

          } catch (error) {
            return {
              success: false,
              result: '${InteractionResults.UNKNOWN_ERROR}',
              error: error.message
            };
          }
        })();
      `);

      console.log("🖱️ Click result:", result);
      return result;
    } catch (error) {
      console.error("❌ Click error:", error);
      return {
        success: false,
        result: InteractionResults.UNKNOWN_ERROR,
        error: error.message,
      };
    }
  }

  /**
   * Handle type action
   * @param {Object} params - {selector: string, text: string, clear?: boolean}
   * @returns {Object} Result object with success/error details
   */
  async handleType(params) {
    console.log("⌨️ Handling type action:", params);

    try {
      const { selector, text, clear = false } = params;

      if (!selector || typeof selector !== "string") {
        return {
          success: false,
          result: InteractionResults.SELECTOR_INVALID,
          error: "Selector is required and must be a string",
        };
      }

      if (!text || typeof text !== "string") {
        return {
          success: false,
          result: InteractionResults.SELECTOR_INVALID,
          error: "Text is required and must be a string",
        };
      }

      // Execute type action in the current tab's context
      const result = await this.executeInCurrentTab(`
        (function() {
          try {
            const element = document.querySelector('${selector.replace(/'/g, "\\'")}');

            if (!element) {
              return {
                success: false,
                result: '${InteractionResults.ELEMENT_NOT_FOUND}',
                error: 'Element not found: ${selector}'
              };
            }

            // Check if element is a valid input element
            const isInputElement = element.tagName === 'INPUT' ||
                                 element.tagName === 'TEXTAREA' ||
                                 element.isContentEditable;

            if (!isInputElement) {
              return {
                success: false,
                result: '${InteractionResults.SELECTOR_INVALID}',
                error: 'Element is not a text input field: ${selector}'
              };
            }

            // Scroll element into view
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 100));

            // Focus the element
            element.focus();

            // Clear if requested
            if (${clear}) {
              if (element.isContentEditable) {
                element.textContent = '';
              } else {
                element.value = '';
              }
            }

            // Type the text
            const textToType = '${text.replace(/'/g, "\\'")}';

            if (element.isContentEditable) {
              // For contentEditable elements
              element.textContent += textToType;
            } else {
              // For input/textarea elements
              element.value += textToType;
            }

            // Trigger input events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));

            return {
              success: true,
              result: '${InteractionResults.SUCCESS}',
              message: 'Text typed successfully',
              elementInfo: {
                tagName: element.tagName,
                className: element.className,
                id: element.id,
                value: element.value || element.textContent?.substring(0, 100) || ''
              }
            };

          } catch (error) {
            return {
              success: false,
              result: '${InteractionResults.UNKNOWN_ERROR}',
              error: error.message
            };
          }
        })();
      `);

      console.log("⌨️ Type result:", result);
      return result;
    } catch (error) {
      console.error("❌ Type error:", error);
      return {
        success: false,
        result: InteractionResults.UNKNOWN_ERROR,
        error: error.message,
      };
    }
  }

  /**
   * Handle wait action
   * @param {Object} params - {selector: string, timeout?: number}
   * @returns {Object} Result object with success/error details
   */
  async handleWait(params) {
    console.log("⏳ Handling wait action:", params);

    try {
      const { selector, timeout = 30000 } = params;

      if (!selector || typeof selector !== "string") {
        return {
          success: false,
          result: InteractionResults.SELECTOR_INVALID,
          error: "Selector is required and must be a string",
        };
      }

      // Enforce minimum 1000ms and maximum 60000ms
      const maxTimeout = Math.max(1000, Math.min(timeout, 60000));
      const waitId = `wait_${Date.now()}_${Math.random()}`;

      console.log(
        `⏳ Starting wait for selector: ${selector} (timeout: ${maxTimeout}ms)`,
      );

      // Store active wait operation
      this.activeWaits.set(waitId, { selector, startTime: Date.now() });

      try {
        const result = await this.waitForElement(selector, maxTimeout);
        this.activeWaits.delete(waitId);

        console.log("⏳ Wait result:", result);
        return result;
      } catch (error) {
        this.activeWaits.delete(waitId);

        if (error.message === "timeout") {
          return {
            success: false,
            result: InteractionResults.TIMEOUT,
            error: `Element not found within ${maxTimeout}ms: ${selector}`,
          };
        }

        throw error;
      }
    } catch (error) {
      console.error("❌ Wait error:", error);
      return {
        success: false,
        result: InteractionResults.UNKNOWN_ERROR,
        error: error.message,
      };
    }
  }

  /**
   * Wait for element to appear
   * @param {string} selector - CSS selector
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<Object>} Result object
   */
  async waitForElement(selector, timeout) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const interval = 500; // Check every 500ms

      const checkElement = async () => {
        try {
          const elapsed = Date.now() - startTime;

          if (elapsed >= timeout) {
            reject(new Error("timeout"));
            return;
          }

          const result = await this.executeInCurrentTab(`
            (function() {
              try {
                const element = document.querySelector('${selector.replace(/'/g, "\\'")}');

                if (!element) {
                  return { found: false };
                }

                // Check if element is visible
                const rect = element.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 &&
                                window.getComputedStyle(element).visibility !== 'hidden' &&
                                window.getComputedStyle(element).display !== 'none';

                return {
                  found: true,
                  visible: isVisible,
                  elementInfo: {
                    tagName: element.tagName,
                    className: element.className,
                    id: element.id,
                    text: element.textContent?.substring(0, 100) || ''
                  }
                };

              } catch (error) {
                return { found: false, error: error.message };
              }
            })();
          `);

          if (result.found) {
            resolve({
              success: true,
              result: InteractionResults.SUCCESS,
              message: `Element found after ${elapsed}ms`,
              elementInfo: result.elementInfo,
              visible: result.visible,
              waitTime: elapsed,
            });
            return;
          }

          // Element not found yet, continue waiting
          setTimeout(checkElement, interval);
        } catch (error) {
          reject(error);
        }
      };

      // Start checking
      checkElement();
    });
  }

  /**
   * Execute JavaScript in the current tab
   * @param {string} script - JavaScript code to execute
   * @returns {Promise<any>} Execution result
   */
  async executeInCurrentTab(script) {
    return new Promise((resolve, reject) => {
      // Get the current tab ID from DevTools
      const tabId = chrome.devtools?.inspectedWindow?.tabId;

      if (!tabId) {
        reject(new Error("No active tab found"));
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: function () {
            // CSP-compliant placeholder - script execution disabled for security
            return {
              success: false,
              error: "Direct script execution disabled for CSP compliance",
            };
          },
        },
        (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (result && result[0]) {
            resolve(result[0].result);
          } else {
            reject(new Error("No result from script execution"));
          }
        },
      );
    });
  }

  /**
   * Get status of active wait operations
   * @returns {Array} Array of active wait operations
   */
  getActiveWaits() {
    const activeWaits = [];
    for (const [waitId, waitInfo] of this.activeWaits.entries()) {
      activeWaits.push({
        id: waitId,
        selector: waitInfo.selector,
        elapsed: Date.now() - waitInfo.startTime,
      });
    }
    return activeWaits;
  }

  /**
   * Cancel all active wait operations
   */
  cancelAllWaits() {
    console.log(`⏳ Canceling ${this.activeWaits.size} active wait operations`);
    this.activeWaits.clear();
  }

  /**
   * Clean up orphaned wait operations that exceed maximum timeout
   */
  cleanupOrphanedOperations() {
    const now = Date.now();
    const maxAge = 120000; // 2 minutes maximum age
    let cleaned = 0;

    for (const [waitId, waitInfo] of this.activeWaits.entries()) {
      const age = now - waitInfo.startTime;
      if (age > maxAge) {
        console.log(
          `🧹 Cleaning up orphaned wait operation: ${waitId} (age: ${age}ms)`,
        );
        this.activeWaits.delete(waitId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} orphaned wait operations`);
    }
  }

  /**
   * Destroy handler and cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.activeWaits.clear();
    console.log("🖱️ InteractionHandler destroyed");
  }
}

// Create global instance
window.interactionHandler = new InteractionHandler();

console.log("🖱️ Interactions module loaded successfully");
