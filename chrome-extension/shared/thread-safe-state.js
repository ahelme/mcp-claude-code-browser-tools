/**
 * Thread-Safe State Management - Shared Utility
 *
 * Provides atomic state management with lock mechanisms to prevent race conditions.
 * Extracted and generalized from screenshot.js, navigation.js, and bug-fixes.js.
 *
 * @module shared/thread-safe-state
 * @version 1.0.0
 * @since 2025-10-02
 */

/**
 * Thread-safe state manager with atomic operations and locking
 *
 * Features:
 * - Atomic state updates with validation
 * - Lock mechanisms to prevent concurrent modifications
 * - Conditional state changes
 * - Safe getters for all state values
 *
 * @class ThreadSafeState
 *
 * @example
 * const state = new ThreadSafeState({
 *   timeout: { value: 10000, min: 1000, max: 60000 },
 *   isActive: false
 * }, {
 *   debugPrefix: 'Navigation'
 * });
 *
 * // Atomic state update
 * state.setState('timeout', 15000);
 *
 * // Conditional state update
 * state.setStateSafe('isActive', true, () => !state.getState('isActive'));
 */
class ThreadSafeState {
  /**
   * Create a new thread-safe state manager
   *
   * @param {Object} initialState - Initial state values
   * @param {Object} config - Configuration options
   * @param {string} [config.debugPrefix=''] - Prefix for console logs
   * @param {boolean} [config.strictMode=false] - Throw errors on invalid operations
   */
  constructor(initialState = {}, config = {}) {
    this._state = {};
    this._locks = new Map();
    this._configLock = false;
    this.debugPrefix = config.debugPrefix || '';
    this.strictMode = config.strictMode || false;

    // Initialize state with validation
    for (const [key, value] of Object.entries(initialState)) {
      if (typeof value === 'object' && value !== null && 'value' in value) {
        // Complex state with constraints
        this._state[key] = {
          value: value.value,
          min: value.min,
          max: value.max,
          validator: value.validator
        };
      } else {
        // Simple state
        this._state[key] = { value };
      }
    }
  }

  /**
   * Atomically set state value with optional validation
   *
   * @param {string} key - State key
   * @param {any} value - New value
   * @param {Function} [condition] - Optional condition function (currentValue) => boolean
   * @returns {boolean} True if state was updated
   *
   * @example
   * // Simple update
   * state.setState('isActive', true);
   *
   * // Conditional update (only if not already active)
   * state.setState('isActive', true, (current) => !current);
   */
  setState(key, value, condition = null) {
    if (!this._state[key]) {
      if (this.strictMode) {
        throw new Error(`${this.debugPrefix} Unknown state key: ${key}`);
      }
      console.warn(`${this.debugPrefix} Unknown state key: ${key}, initializing`);
      this._state[key] = { value: undefined };
    }

    const currentValue = this._state[key].value;

    // Check condition if provided
    if (condition && !condition(currentValue)) {
      console.log(
        `${this.debugPrefix} Condition not met for ${key}, state unchanged`
      );
      return false;
    }

    // Validate against constraints if they exist
    let validatedValue = value;
    const stateConfig = this._state[key];

    if (stateConfig.validator && typeof stateConfig.validator === 'function') {
      validatedValue = stateConfig.validator(value);
    } else if (typeof value === 'number' && (stateConfig.min !== undefined || stateConfig.max !== undefined)) {
      validatedValue = Math.max(
        stateConfig.min ?? value,
        Math.min(value, stateConfig.max ?? value)
      );
    }

    const previousValue = this._state[key].value;
    this._state[key].value = validatedValue;

    console.log(
      `${this.debugPrefix} State ${key}: ${previousValue} → ${validatedValue}`
    );

    return true;
  }

  /**
   * Atomically set state with lock protection (prevents concurrent modifications)
   *
   * @param {string} key - State key
   * @param {any} value - New value
   * @param {Function} [condition] - Optional condition function
   * @returns {any} The actually set value (may differ if locked or constrained)
   *
   * @example
   * const actualValue = state.setStateSafe('timeout', 15000);
   */
  setStateSafe(key, value, condition = null) {
    // Prevent concurrent modifications
    if (this._configLock) {
      console.warn(
        `⚠️ ${this.debugPrefix} State configuration locked - skipping ${key} update`
      );
      return this.getState(key);
    }

    try {
      this._configLock = true;
      this.setState(key, value, condition);
      return this.getState(key);
    } finally {
      this._configLock = false;
    }
  }

  /**
   * Get current state value safely
   *
   * @param {string} key - State key
   * @returns {any} Current state value
   *
   * @example
   * const isActive = state.getState('isActive');
   */
  getState(key) {
    if (!this._state[key]) {
      if (this.strictMode) {
        throw new Error(`${this.debugPrefix} Unknown state key: ${key}`);
      }
      console.warn(`${this.debugPrefix} Unknown state key: ${key}, returning undefined`);
      return undefined;
    }

    return this._state[key].value;
  }

  /**
   * Get state safely (alias for getState for consistency with other safe methods)
   *
   * @param {string} key - State key
   * @returns {any} Current state value
   */
  getStateSafe(key) {
    return this.getState(key);
  }

  /**
   * Update state atomically using an updater function
   *
   * @param {string} key - State key
   * @param {Function} updater - Function (currentValue) => newValue
   * @returns {any} New state value
   *
   * @example
   * // Increment counter
   * state.updateState('counter', (current) => current + 1);
   */
  updateState(key, updater) {
    const currentValue = this.getState(key);
    const newValue = updater(currentValue);
    this.setState(key, newValue);
    return newValue;
  }

  /**
   * Execute operation with exclusive lock
   *
   * @param {string} operationId - Unique operation identifier
   * @param {Function} operation - Async operation to execute
   * @param {number} [timeout=5000] - Operation timeout in ms
   * @returns {Promise<any>} Operation result
   *
   * @example
   * await state.lockOperation('update-config', async () => {
   *   await performComplexUpdate();
   * });
   */
  async lockOperation(operationId, operation, timeout = 5000) {
    // Check if operation is already running
    if (this._locks.has(operationId)) {
      throw new Error(
        `${this.debugPrefix} Operation ${operationId} is already running`
      );
    }

    // Set lock
    this._locks.set(operationId, Date.now());

    try {
      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`${this.debugPrefix} Operation timeout: ${operationId}`)),
          timeout
        )
      );

      const result = await Promise.race([operation(), timeoutPromise]);

      return result;
    } finally {
      // Always clean up lock
      this._locks.delete(operationId);
    }
  }

  /**
   * Check if an operation is currently locked
   *
   * @param {string} operationId - Operation identifier
   * @returns {boolean} True if operation is locked
   */
  isLocked(operationId) {
    return this._locks.has(operationId);
  }

  /**
   * Reset state to initial values
   *
   * @param {Object} [initialState] - Optional new initial state
   */
  reset(initialState = null) {
    if (initialState) {
      this._state = {};
      for (const [key, value] of Object.entries(initialState)) {
        if (typeof value === 'object' && value !== null && 'value' in value) {
          this._state[key] = { ...value };
        } else {
          this._state[key] = { value };
        }
      }
    } else {
      // Reset to defaults
      for (const key of Object.keys(this._state)) {
        if (this._state[key].default !== undefined) {
          this._state[key].value = this._state[key].default;
        }
      }
    }

    this._locks.clear();
    this._configLock = false;

    console.log(`🔄 ${this.debugPrefix} State reset to defaults`);
  }

  /**
   * Get all current state as plain object
   *
   * @returns {Object} Current state snapshot
   */
  getSnapshot() {
    const snapshot = {};
    for (const [key, config] of Object.entries(this._state)) {
      snapshot[key] = config.value;
    }
    return snapshot;
  }

  /**
   * Get detailed state information for debugging
   *
   * @returns {Object} Detailed state info
   */
  getDebugInfo() {
    return {
      state: this.getSnapshot(),
      locks: Array.from(this._locks.keys()),
      configLocked: this._configLock,
      debugPrefix: this.debugPrefix
    };
  }
}

// Export for use in other modules
window.ThreadSafeState = ThreadSafeState;
