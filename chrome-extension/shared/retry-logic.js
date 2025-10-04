/**
 * Retry Logic Utility - Shared Module
 *
 * Provides retry execution with exponential backoff for transient failures.
 * Extracted from screenshot.js and navigation.js to eliminate code duplication.
 *
 * @module shared/retry-logic
 * @version 1.0.0
 * @since 2025-10-02
 */

/**
 * Executes async operations with automatic retry logic and exponential backoff
 *
 * Features:
 * - Configurable retry attempts
 * - Exponential backoff with maximum delay cap
 * - Customizable retryable/non-retryable error patterns
 * - Detailed error logging
 *
 * @class RetryExecutor
 *
 * @example
 * const retryExecutor = new RetryExecutor({
 *   maxRetries: 2,
 *   baseDelay: 1000,
 *   maxDelay: 5000,
 *   debugPrefix: 'Screenshot'
 * });
 *
 * const result = await retryExecutor.executeWithRetry(
 *   async () => await captureScreenshot(),
 *   (error) => error.message.includes('timeout')
 * );
 */
class RetryExecutor {
  /**
   * Create a new retry executor
   *
   * @param {Object} config - Configuration options
   * @param {number} [config.maxRetries=2] - Maximum number of retry attempts
   * @param {number} [config.baseDelay=1000] - Base delay in milliseconds
   * @param {number} [config.maxDelay=5000] - Maximum delay cap in milliseconds
   * @param {string[]} [config.retryablePatterns] - Patterns indicating retryable errors
   * @param {string[]} [config.nonRetryablePatterns] - Patterns indicating non-retryable errors
   * @param {string} [config.debugPrefix=''] - Prefix for console logs
   */
  constructor(config = {}) {
    this.maxRetries = config.maxRetries ?? 2;
    this.baseDelay = config.baseDelay ?? 1000;
    this.maxDelay = config.maxDelay ?? 5000;
    this.debugPrefix = config.debugPrefix || '';

    // Default retryable error patterns
    this.retryablePatterns = config.retryablePatterns || [
      'timeout',
      'network',
      'connection',
      'unreachable',
      'temporary',
      'ERR_',
      'capture failed',
      'tabs api'
    ];

    // Default non-retryable error patterns
    this.nonRetryablePatterns = config.nonRetryablePatterns || [
      'extension context invalidated',
      'context invalidated',
      'extension context',
      'disconnected port',
      'message port closed',
      'invalid selector',
      'element not found'
    ];
  }

  /**
   * Execute an async operation with retry logic
   *
   * @param {Function} operation - Async function to execute
   * @param {Function} [isRetryableCallback] - Optional custom retry checker
   * @returns {Promise<any>} Result from successful operation
   * @throws {Error} When all retry attempts are exhausted
   *
   * @example
   * const result = await executor.executeWithRetry(
   *   async () => {
   *     const response = await fetch(url);
   *     return response.json();
   *   },
   *   (error) => error.message.includes('network')
   * );
   */
  async executeWithRetry(operation, isRetryableCallback = null) {
    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Log retry attempts
        if (attempt > 0) {
          console.log(
            `🔄 ${this.debugPrefix} Retry attempt ${attempt}/${this.maxRetries}`
          );

          // Calculate delay with exponential backoff
          const exponentialDelay = Math.pow(2, attempt) * this.baseDelay;
          const cappedDelay = Math.min(exponentialDelay, this.maxDelay);

          console.log(
            `⏳ ${this.debugPrefix} Waiting ${cappedDelay}ms before retry...`
          );

          await new Promise((resolve) => setTimeout(resolve, cappedDelay));
        }

        // Execute the operation
        const result = await operation();

        // Success!
        if (attempt > 0) {
          console.log(
            `✅ ${this.debugPrefix} Operation succeeded on attempt ${attempt + 1}`
          );
        }

        return result;
      } catch (error) {
        lastError = error;

        console.warn(
          `⚠️ ${this.debugPrefix} Attempt ${attempt + 1} failed:`,
          error.message
        );

        // Check if we should retry
        const shouldRetry = isRetryableCallback
          ? isRetryableCallback(error)
          : this.isRetryableError(error);

        // Don't retry if:
        // 1. We've hit max retries, OR
        // 2. Error is not retryable
        if (attempt === this.maxRetries || !shouldRetry) {
          if (!shouldRetry) {
            console.log(
              `🚫 ${this.debugPrefix} Non-retryable error detected, stopping retries`
            );
          }
          throw error;
        }
      }
    }

    // This should never be reached, but just in case
    throw (
      lastError ||
      new Error(`${this.debugPrefix} Operation failed after all retry attempts`)
    );
  }

  /**
   * Check if an error should be retried based on patterns
   *
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   *
   * @example
   * const isRetryable = executor.isRetryableError(new Error('Connection timeout'));
   * // Returns: true
   */
  isRetryableError(error) {
    const errorMessage = error.message.toLowerCase();

    // First check if error is explicitly non-retryable
    const isNonRetryable = this.nonRetryablePatterns.some((pattern) =>
      errorMessage.includes(pattern.toLowerCase())
    );

    if (isNonRetryable) {
      console.log(
        `🚫 ${this.debugPrefix} Non-retryable error detected: ${error.message}`
      );
      return false;
    }

    // Then check if it's retryable
    const isRetryable = this.retryablePatterns.some((pattern) =>
      errorMessage.includes(pattern.toLowerCase())
    );

    return isRetryable;
  }

  /**
   * Add a custom retryable pattern
   *
   * @param {string} pattern - Pattern to add
   *
   * @example
   * executor.addRetryablePattern('custom error');
   */
  addRetryablePattern(pattern) {
    if (!this.retryablePatterns.includes(pattern)) {
      this.retryablePatterns.push(pattern);
      console.log(`➕ ${this.debugPrefix} Added retryable pattern: ${pattern}`);
    }
  }

  /**
   * Add a custom non-retryable pattern
   *
   * @param {string} pattern - Pattern to add
   *
   * @example
   * executor.addNonRetryablePattern('fatal error');
   */
  addNonRetryablePattern(pattern) {
    if (!this.nonRetryablePatterns.includes(pattern)) {
      this.nonRetryablePatterns.push(pattern);
      console.log(`➕ ${this.debugPrefix} Added non-retryable pattern: ${pattern}`);
    }
  }

  /**
   * Get current retry configuration
   *
   * @returns {Object} Configuration object
   *
   * @example
   * const config = executor.getConfig();
   * console.log(`Max retries: ${config.maxRetries}`);
   */
  getConfig() {
    return {
      maxRetries: this.maxRetries,
      baseDelay: this.baseDelay,
      maxDelay: this.maxDelay,
      retryablePatterns: [...this.retryablePatterns],
      nonRetryablePatterns: [...this.nonRetryablePatterns],
      debugPrefix: this.debugPrefix
    };
  }
}

// Export for use in other modules
window.RetryExecutor = RetryExecutor;
