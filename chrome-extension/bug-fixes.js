/**
 * Bug Fixes and Race Condition Prevention
 *
 * This module contains patches for critical bugs identified in the codebase:
 * 1. Race condition in timeout setting
 * 2. Silent failure in CSP-compliant script execution
 * 3. Thread-safe operations for concurrent access
 */

import { NAVIGATION_TIMEOUTS, ERROR_MESSAGES } from './constants.js';

/**
 * Thread-Safe Navigation Configuration
 * Prevents race conditions in timeout settings and navigation state
 */
export class ThreadSafeNavigationConfig {
  constructor() {
    this._timeout = NAVIGATION_TIMEOUTS.DEFAULT;
    this._isNavigating = false;
    this._lockTimeout = null;
    this._configLock = false;
  }

  /**
   * Atomically set timeout with validation
   * @param {number} timeout - Desired timeout value
   * @returns {number} Actually set timeout value
   */
  setTimeoutSafe(timeout) {
    // Prevent concurrent modifications
    if (this._configLock) {
      console.warn('⚠️ Timeout configuration locked - using current value');
      return this._timeout;
    }

    try {
      this._configLock = true;

      if (timeout && typeof timeout === 'number' && timeout > 0) {
        const validatedTimeout = Math.max(
          NAVIGATION_TIMEOUTS.MIN,
          Math.min(timeout, NAVIGATION_TIMEOUTS.MAX)
        );

        // Only set if not currently navigating to prevent race condition
        if (!this._isNavigating) {
          this._timeout = validatedTimeout;
          console.log(`🕐 Timeout safely set: ${validatedTimeout}ms`);
        } else {
          console.warn('⚠️ Cannot change timeout during active navigation');
        }

        return this._timeout;
      }

      return this._timeout;
    } finally {
      this._configLock = false;
    }
  }

  /**
   * Atomically set navigation state
   * @param {boolean} isNavigating - Navigation state
   * @returns {boolean} Successfully changed state
   */
  setNavigationStateSafe(isNavigating) {
    if (this._isNavigating === isNavigating) {
      return true; // No change needed
    }

    // Prevent race conditions during state transition
    const previousState = this._isNavigating;
    this._isNavigating = isNavigating;

    console.log(`🧭 Navigation state: ${previousState} → ${isNavigating}`);
    return true;
  }

  /**
   * Get current timeout value safely
   * @returns {number} Current timeout
   */
  getTimeoutSafe() {
    return this._timeout;
  }

  /**
   * Get current navigation state safely
   * @returns {boolean} Current navigation state
   */
  getNavigationStateSafe() {
    return this._isNavigating;
  }

  /**
   * Reset to default values
   */
  reset() {
    this._timeout = NAVIGATION_TIMEOUTS.DEFAULT;
    this._isNavigating = false;
    this._configLock = false;
    console.log('🔄 Navigation config reset to defaults');
  }
}

/**
 * CSP-Safe Script Execution
 * Provides fallback mechanisms for script execution with proper error handling
 */
export class CSPSafeScriptExecutor {
  constructor() {
    this.fallbackMethods = [
      this._executeViaChromeTabs,
      this._executeViaContentScript,
      this._executeViaMessagePassing
    ];
    this.lastWorkingMethod = null;
  }

  /**
   * Execute script with automatic fallback on CSP failures
   * @param {number} tabId - Target tab ID
   * @param {string} script - JavaScript code to execute
   * @param {Object} options - Execution options
   * @returns {Promise} Execution result
   */
  async executeScript(tabId, script, options = {}) {
    const { timeout = 10000, retries = 2 } = options;

    // Try the last working method first if available
    if (this.lastWorkingMethod) {
      try {
        const result = await this._executeWithTimeout(
          () => this.lastWorkingMethod(tabId, script),
          timeout
        );
        console.log('✅ Script executed using cached working method');
        return result;
      } catch (error) {
        console.warn('⚠️ Cached method failed, trying all methods:', error.message);
        this.lastWorkingMethod = null; // Reset cached method
      }
    }

    // Try each fallback method
    for (const method of this.fallbackMethods) {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          console.log(`🔄 Attempting script execution with method ${method.name} (attempt ${attempt + 1})`);

          const result = await this._executeWithTimeout(
            () => method.call(this, tabId, script),
            timeout
          );

          // Cache working method for future use
          this.lastWorkingMethod = method;
          console.log(`✅ Script executed successfully using ${method.name}`);
          return result;

        } catch (error) {
          console.warn(`⚠️ Method ${method.name} attempt ${attempt + 1} failed:`, error.message);

          if (attempt < retries) {
            // Brief delay before retry
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          }
        }
      }
    }

    // All methods failed
    throw new Error('All script execution methods failed. CSP may be blocking execution.');
  }

  /**
   * Primary method: Chrome tabs API
   * @private
   */
  async _executeViaChromeTabs(tabId, script) {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.executeScript(tabId, { code: script }, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Chrome tabs execution failed: ${chrome.runtime.lastError.message}`));
            return;
          }

          if (result && result.length > 0) {
            resolve(result[0]);
          } else {
            reject(new Error('No result from Chrome tabs script execution'));
          }
        });
      } catch (error) {
        reject(new Error(`Chrome tabs execution error: ${error.message}`));
      }
    });
  }

  /**
   * Fallback method: Chrome scripting API
   * @private
   */
  async _executeViaContentScript(tabId, script) {
    return new Promise((resolve, reject) => {
      try {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabId },
            func: function(scriptCode) {
              try {
                // Use indirect eval to avoid CSP issues
                const result = (function() {
                  return eval(scriptCode);
                })();
                return result;
              } catch (error) {
                return {
                  success: false,
                  error: `Script execution error: ${error.message}`,
                  cspBlocked: error.name === 'EvalError'
                };
              }
            },
            args: [script]
          },
          (result) => {
            if (chrome.runtime.lastError) {
              reject(new Error(`Chrome scripting execution failed: ${chrome.runtime.lastError.message}`));
              return;
            }

            if (result && result[0]) {
              const executionResult = result[0].result;
              if (executionResult && executionResult.success === false) {
                reject(new Error(executionResult.error));
              } else {
                resolve(executionResult);
              }
            } else {
              reject(new Error('No result from Chrome scripting execution'));
            }
          }
        );
      } catch (error) {
        reject(new Error(`Chrome scripting execution error: ${error.message}`));
      }
    });
  }

  /**
   * Ultimate fallback: Message passing to content script
   * @private
   */
  async _executeViaMessagePassing(tabId, script) {
    return new Promise((resolve, reject) => {
      const messageId = `script_exec_${Date.now()}_${Math.random()}`;

      // Listen for response
      const responseHandler = (message, sender, sendResponse) => {
        if (message.type === 'script_execution_result' && message.messageId === messageId) {
          chrome.runtime.onMessage.removeListener(responseHandler);

          if (message.success) {
            resolve(message.result);
          } else {
            reject(new Error(message.error || 'Message passing execution failed'));
          }
        }
      };

      chrome.runtime.onMessage.addListener(responseHandler);

      // Send execution request
      chrome.tabs.sendMessage(tabId, {
        type: 'execute_script',
        script: script,
        messageId: messageId
      }, (response) => {
        if (chrome.runtime.lastError) {
          chrome.runtime.onMessage.removeListener(responseHandler);
          reject(new Error(`Message passing failed: ${chrome.runtime.lastError.message}`));
        }
      });

      // Cleanup timeout
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(responseHandler);
        reject(new Error('Message passing execution timeout'));
      }, 10000);
    });
  }

  /**
   * Execute function with timeout
   * @private
   */
  async _executeWithTimeout(fn, timeout) {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), timeout)
      )
    ]);
  }

  /**
   * Test if script execution is working
   * @param {number} tabId - Target tab ID
   * @returns {Promise<Object>} Test result
   */
  async testExecution(tabId) {
    const testScript = '(function() { return { test: true, timestamp: Date.now() }; })()';

    try {
      const result = await this.executeScript(tabId, testScript, { timeout: 5000, retries: 1 });
      return {
        working: true,
        method: this.lastWorkingMethod ? this.lastWorkingMethod.name : 'unknown',
        result: result
      };
    } catch (error) {
      return {
        working: false,
        error: error.message,
        cspBlocked: error.message.includes('CSP') || error.message.includes('EvalError')
      };
    }
  }
}

/**
 * Race Condition Prevention Utilities
 */
export class RaceConditionPreventer {
  constructor() {
    this.operationLocks = new Map();
    this.operationTimeouts = new Map();
  }

  /**
   * Execute operation with exclusive lock
   * @param {string} operationId - Unique operation identifier
   * @param {Function} operation - Operation to execute
   * @param {number} timeout - Maximum operation time
   * @returns {Promise} Operation result
   */
  async executeExclusive(operationId, operation, timeout = 30000) {
    // Check if operation is already in progress
    if (this.operationLocks.has(operationId)) {
      throw new Error(`Operation ${operationId} is already in progress`);
    }

    // Set lock
    this.operationLocks.set(operationId, Date.now());

    // Set timeout
    const timeoutHandle = setTimeout(() => {
      this.operationLocks.delete(operationId);
      this.operationTimeouts.delete(operationId);
      console.warn(`⚠️ Operation ${operationId} timed out after ${timeout}ms`);
    }, timeout);

    this.operationTimeouts.set(operationId, timeoutHandle);

    try {
      console.log(`🔒 Starting exclusive operation: ${operationId}`);
      const result = await operation();

      console.log(`✅ Exclusive operation completed: ${operationId}`);
      return result;

    } catch (error) {
      console.error(`❌ Exclusive operation failed: ${operationId}`, error);
      throw error;

    } finally {
      // Clean up lock and timeout
      this.operationLocks.delete(operationId);

      const timeoutHandle = this.operationTimeouts.get(operationId);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.operationTimeouts.delete(operationId);
      }
    }
  }

  /**
   * Check if operation is currently locked
   * @param {string} operationId - Operation identifier
   * @returns {boolean} True if locked
   */
  isLocked(operationId) {
    return this.operationLocks.has(operationId);
  }

  /**
   * Get operation lock status
   * @returns {Object} Lock status information
   */
  getLockStatus() {
    const locks = [];
    for (const [operationId, startTime] of this.operationLocks.entries()) {
      locks.push({
        operationId,
        startTime,
        duration: Date.now() - startTime
      });
    }

    return {
      activeLocks: locks.length,
      locks: locks
    };
  }

  /**
   * Force unlock operation (emergency use)
   * @param {string} operationId - Operation to unlock
   */
  forceUnlock(operationId) {
    if (this.operationLocks.has(operationId)) {
      this.operationLocks.delete(operationId);

      const timeoutHandle = this.operationTimeouts.get(operationId);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.operationTimeouts.delete(operationId);
      }

      console.warn(`⚠️ Force unlocked operation: ${operationId}`);
      return true;
    }
    return false;
  }

  /**
   * Clean up all locks (emergency use)
   */
  clearAllLocks() {
    console.warn('⚠️ Clearing all operation locks');

    // Clear timeouts
    for (const timeoutHandle of this.operationTimeouts.values()) {
      clearTimeout(timeoutHandle);
    }

    this.operationLocks.clear();
    this.operationTimeouts.clear();
  }
}

// Create default instances
export const threadSafeConfig = new ThreadSafeNavigationConfig();
export const cspSafeExecutor = new CSPSafeScriptExecutor();
export const raceConditionPreventer = new RaceConditionPreventer();

export default {
  ThreadSafeNavigationConfig,
  CSPSafeScriptExecutor,
  RaceConditionPreventer,
  threadSafeConfig,
  cspSafeExecutor,
  raceConditionPreventer
};