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
    console.log("🖱️ InteractionHandler initialized with CSP-safe execution");
    this.activeWaits = new Map(); // Track active wait operations
    this.cleanupInterval = null;
    this.lastCleanupTime = Date.now();

    // Initialize CSP-safe script executor with enhanced validation
    const globalValidation = this.validateGlobalReference(
      "CSPSafeScriptExecutor",
      globalThis.CSPSafeScriptExecutor,
    );
    // Enhanced CSP-safe script executor with better validation
    const CSPSafeExecutorClass =
      globalThis.CSPSafeScriptExecutor ||
      function () {
        // Enhanced fallback executor with better error reporting and validation
        console.log(
          "🔄 Using fallback CSPSafeScriptExecutor (enhanced module not available)",
        );

        this.executeScript = async (tabId, script) => {
          console.warn(
            "⚠️ CSP-safe executor not available - script execution disabled",
          );
          console.log(
            "📋 This is expected behavior when enhanced modules are not loaded",
          );

          throw new Error(
            "CSP-safe executor not available - script execution disabled. " +
              "This is expected behavior when enhanced modules are not loaded. " +
              `Requested for tab ${tabId} with script length ${script?.length || 0}`,
          );
        };

        // Add validation method
        this.validateScript = (script) => {
          if (!script || typeof script !== "string") {
            return {
              isValid: false,
              error: "Script must be a non-empty string",
            };
          }
          return {
            isValid: true,
            error: null,
          };
        };
      };

    try {
      this.scriptExecutor = new CSPSafeExecutorClass();
    } catch (error) {
      console.error("❌ Failed to initialize CSPSafeScriptExecutor:", error);
      // Use minimal fallback
      this.scriptExecutor = {
        executeScript: async () => {
          throw new Error("Script executor initialization failed");
        },
        validateScript: () => ({
          isValid: false,
          error: "Executor unavailable",
        }),
      };
    }

    // Start dynamic cleanup timer
    this.startDynamicCleanup();
  }

  /**
   * Sanitize and validate script input before execution
   * @param {string} script - JavaScript code to sanitize
   * @param {Object} context - Execution context information
   * @returns {Object} Validation result with sanitized script or error
   */
  sanitizeScript(script, context = {}) {
    // Input validation
    if (typeof script !== "string") {
      return {
        isValid: false,
        error: "Script must be a string",
        sanitizedScript: null,
      };
    }

    if (!script.trim()) {
      return {
        isValid: false,
        error: "Script cannot be empty",
        sanitizedScript: null,
      };
    }

    // Length validation (prevent excessive script size)
    const maxScriptLength = 10000; // 10KB limit
    if (script.length > maxScriptLength) {
      return {
        isValid: false,
        error: `Script too long (${script.length} chars, max ${maxScriptLength})`,
        sanitizedScript: null,
      };
    }

    // Dangerous pattern detection
    const dangerousPatterns = [
      /eval\s*\(/i, // Direct eval calls
      /function\s*\(\s*\)\s*{\s*return\s+eval/i, // Indirect eval
      /setTimeout\s*\(\s*['"][^'"]*['"]\s*,/i, // setTimeout with string
      /setInterval\s*\(\s*['"][^'"]*['"]\s*,/i, // setInterval with string
      /document\.write/i, // document.write
      /innerHTML\s*\+?=/i, // innerHTML injection
      /outerHTML\s*\+?=/i, // outerHTML injection
      /javascript:/i, // javascript: protocol
      /data:/i, // data: protocol in scripts
      /vbscript:/i, // vbscript: protocol
      /on\w+\s*=/i, // Event handler attributes
      /\.constructor/i, // Constructor access
      /\.__proto__/i, // Prototype pollution
      /Function\s*\(/i, // Function constructor
      /GeneratorFunction/i, // Generator constructor
      /AsyncFunction/i, // Async function constructor
    ];

    const foundDangerousPatterns = [];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(script)) {
        foundDangerousPatterns.push(pattern.toString());
      }
    }

    if (foundDangerousPatterns.length > 0) {
      return {
        isValid: false,
        error: `Script contains dangerous patterns: ${foundDangerousPatterns.join(", ")}`,
        sanitizedScript: null,
        dangerousPatterns: foundDangerousPatterns,
      };
    }

    // Basic script structure validation for our use cases
    const isWrappedFunction =
      /^\s*\(\s*function\s*\(\s*\)\s*\{[\s\S]*\}\s*\)\s*\(\s*\)\s*;?\s*$/.test(
        script,
      );
    if (!isWrappedFunction && context.requireWrappedFunction) {
      return {
        isValid: false,
        error:
          "Script must be wrapped in an immediately invoked function expression (IIFE)",
        sanitizedScript: null,
      };
    }

    // Selector injection prevention
    let sanitizedScript = script;
    if (context.selector) {
      const sanitizedSelector = context.selector
        .replace(/\\/g, "\\\\") // Escape backslashes
        .replace(/'/g, "\\'") // Escape single quotes
        .replace(/"/g, '\\"') // Escape double quotes
        .replace(/\n/g, "\\n") // Escape newlines
        .replace(/\r/g, "\\r") // Escape carriage returns
        .replace(/\t/g, "\\t"); // Escape tabs

      // Replace the selector placeholder with sanitized version
      sanitizedScript = sanitizedScript.replace(
        /\$\{selector\.replace\([^}]+\)\}/g,
        `'${sanitizedSelector}'`,
      );
    }

    // Text injection prevention
    if (context.text) {
      const sanitizedText = context.text
        .replace(/\\/g, "\\\\") // Escape backslashes
        .replace(/'/g, "\\'") // Escape single quotes
        .replace(/"/g, '\\"') // Escape double quotes
        .replace(/\n/g, "\\n") // Escape newlines
        .replace(/\r/g, "\\r") // Escape carriage returns
        .replace(/\t/g, "\\t"); // Escape tabs

      sanitizedScript = sanitizedScript.replace(/\$\{text\}/g, sanitizedText);
    }

    console.log("🔒 Script sanitization passed:", {
      originalLength: script.length,
      sanitizedLength: sanitizedScript.length,
      hasSelector: !!context.selector,
      hasText: !!context.text,
    });

    return {
      isValid: true,
      sanitizedScript: sanitizedScript,
      error: null,
      metadata: {
        originalLength: script.length,
        sanitizedLength: sanitizedScript.length,
        isWrappedFunction: isWrappedFunction,
      },
    };
  }

  /**
   * Enhanced global reference validation with better error messages
   * @param {string} globalName - Name of the global to check
   * @param {*} globalValue - Value of the global reference
   * @returns {Object} Validation result
   */
  validateGlobalReference(globalName, globalValue) {
    if (typeof globalValue === "undefined") {
      console.warn(
        `⚠️ Global reference '${globalName}' is undefined, using fallback implementation`,
      );
      return {
        isValid: false,
        hasValue: false,
        fallbackNeeded: true,
        message: `Global '${globalName}' not available - fallback active`,
      };
    }

    if (typeof globalValue !== "function" && typeof globalValue !== "object") {
      console.warn(
        `⚠️ Global reference '${globalName}' is not a function or object (type: ${typeof globalValue})`,
      );
      return {
        isValid: false,
        hasValue: true,
        fallbackNeeded: true,
        message: `Global '${globalName}' has wrong type - fallback active`,
      };
    }

    console.log(`✅ Global reference '${globalName}' is valid and available`);
    return {
      isValid: true,
      hasValue: true,
      fallbackNeeded: false,
      message: `Global '${globalName}' successfully loaded`,
    };
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

      // Execute click in the current tab's context with enhanced security
      const result = await this.executeInCurrentTab(
        `
        (function() {
          try {
            const element = document.querySelector('${selector}');

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
      `,
        { selector: selector },
      );

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

      // Execute type action in the current tab's context with enhanced security
      const result = await this.executeInCurrentTab(
        `
        (function() {
          try {
            const element = document.querySelector(arguments[0]);

            if (!element) {
              return {
                success: false,
                result: arguments[1],
                error: 'Element not found: ' + arguments[0]
              };
            }

            // Check if element is a valid input element
            const isInputElement = element.tagName === 'INPUT' ||
                                 element.tagName === 'TEXTAREA' ||
                                 element.isContentEditable;

            if (!isInputElement) {
              return {
                success: false,
                result: arguments[2],
                error: 'Element is not a text input field: ' + arguments[0]
              };
            }

            // Scroll element into view
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 100));

            // Focus the element
            element.focus();

            // Clear if requested
            if (arguments[3]) {
              if (element.isContentEditable) {
                element.textContent = '';
              } else {
                element.value = '';
              }
            }

            // Type the text
            const textToType = arguments[4];

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
              result: arguments[5],
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
              result: arguments[6],
              error: error.message
            };
          }
        })();
      `,
        {
          selector: selector,
          text: text,
          clear: clear,
          elementNotFound: InteractionResults.ELEMENT_NOT_FOUND,
          selectorInvalid: InteractionResults.SELECTOR_INVALID,
          success: InteractionResults.SUCCESS,
          unknownError: InteractionResults.UNKNOWN_ERROR,
        },
      );

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
   * Execute JavaScript in the current tab with enhanced security and CSP-safe fallbacks
   * @param {string} script - JavaScript code to execute
   * @param {Object} context - Optional context for script sanitization (selector, text, etc.)
   * @returns {Promise<any>} Execution result
   */
  async executeInCurrentTab(script, context = {}) {
    try {
      // Step 1: Input validation and sanitization
      const sanitizationResult = this.sanitizeScript(script, {
        requireWrappedFunction: true, // Enforce IIFE pattern for safety
        ...context,
      });

      if (!sanitizationResult.isValid) {
        throw new Error(
          `Script sanitization failed: ${sanitizationResult.error}`,
        );
      }

      console.log("🔒 Script sanitization completed successfully");

      // Step 2: Get the current tab ID from DevTools
      const tabId = chrome.devtools?.inspectedWindow?.tabId;

      if (!tabId) {
        throw new Error(
          "No active tab found - ensure DevTools is open and a tab is selected",
        );
      }

      console.log("🔧 Attempting CSP-safe script execution...");

      // Step 3: Use CSP-safe executor with sanitized script
      const result = await this.scriptExecutor.executeScript(
        tabId,
        sanitizationResult.sanitizedScript,
        {
          timeout: 10000,
          retries: 2,
          metadata: {
            originalLength: sanitizationResult.metadata.originalLength,
            sanitizedLength: sanitizationResult.metadata.sanitizedLength,
            hasSelector: !!context.selector,
            hasText: !!context.text,
          },
        },
      );

      console.log("✅ Script executed successfully with enhanced security");
      return result;
    } catch (error) {
      console.error("❌ Enhanced script execution failed:", error.message);

      // Provide fallback result for interaction operations
      if (script.includes("querySelector") && script.includes("click")) {
        console.warn(
          "⚠️ Using interaction fallback - actual click may not have occurred",
        );
        return {
          success: false,
          error: `Script execution failed: ${error.message}`,
          fallbackUsed: true,
          recommendation:
            "Try using Chrome DevTools Protocol or content script injection",
        };
      }

      throw new Error(`Script execution failed: ${error.message}`);
    }
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
   * Start dynamic cleanup based on operation load
   */
  startDynamicCleanup() {
    const scheduleNextCleanup = () => {
      // Dynamic interval based on current load
      const operationCount = this.activeWaits.size;
      let interval;

      if (operationCount === 0) {
        interval = 60000; // 1 minute when idle
      } else if (operationCount < 5) {
        interval = 30000; // 30 seconds for light load
      } else if (operationCount < 15) {
        interval = 15000; // 15 seconds for moderate load
      } else {
        interval = 5000; // 5 seconds for heavy load
      }

      this.cleanupInterval = setTimeout(() => {
        this.cleanupOrphanedOperations();
        scheduleNextCleanup(); // Schedule next cleanup
      }, interval);

      console.log(
        `🔄 Next cleanup scheduled in ${interval / 1000}s (${operationCount} active operations)`,
      );
    };

    scheduleNextCleanup();
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

    this.lastCleanupTime = now;
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
