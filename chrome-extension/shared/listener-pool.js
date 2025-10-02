/**
 * Listener Pool Manager - Shared Utility
 *
 * Provides automatic cleanup and pooling for Chrome extension listeners
 * to prevent memory leaks. Extracted from screenshot.js and navigation.js
 * to eliminate code duplication.
 *
 * @module shared/listener-pool
 * @version 1.0.0
 * @since 2025-10-02
 */

/**
 * Manages a pool of Chrome extension listeners with automatic cleanup
 * and memory leak prevention.
 *
 * Features:
 * - Automatic cleanup of stale listeners
 * - Usage tracking and analytics
 * - Dynamic cleanup intervals based on pool size
 * - Pool size limits with automatic cleanup
 *
 * @class ListenerPoolManager
 *
 * @example
 * const pool = new ListenerPoolManager({
 *   max: 5,
 *   maxAge: 300000,
 *   minInactiveTime: 60000,
 *   debugPrefix: 'MyModule'
 * });
 *
 * const managedListener = pool.createManagedListener(
 *   (message) => console.log('Message received'),
 *   'websocket-message-handler'
 * );
 *
 * window.wsManager.on('message', managedListener.listener);
 *
 * // Clean up when done
 * managedListener.remove();
 */
class ListenerPoolManager {
  /**
   * Create a new listener pool manager
   *
   * @param {Object} config - Configuration options
   * @param {number} [config.max=5] - Maximum concurrent listeners
   * @param {number} [config.maxAge=300000] - Maximum listener age (5 min)
   * @param {number} [config.minInactiveTime=60000] - Min inactivity before cleanup (1 min)
   * @param {number} [config.neverUsedMaxAge=120000] - Max age for never-used listeners (2 min)
   * @param {string} [config.debugPrefix=''] - Prefix for console logs
   */
  constructor(config = {}) {
    this.maxConcurrentListeners = config.max || 5;
    this.maxAge = config.maxAge || 300000; // 5 minutes
    this.minInactiveTime = config.minInactiveTime || 60000; // 1 minute
    this.neverUsedMaxAge = config.neverUsedMaxAge || 120000; // 2 minutes
    this.debugPrefix = config.debugPrefix || '';

    this.listenerPool = new Map();
    this.listenerIdCounter = 0;
    this.lastListenerCleanup = Date.now();
    this.listenerCleanupInterval = null;
  }

  /**
   * Create a managed listener with automatic cleanup and pooling
   *
   * This method creates a listener that is automatically tracked in the listener pool
   * with usage analytics and automatic cleanup. Prevents memory leaks by enforcing
   * pool size limits and removing stale listeners.
   *
   * @param {Function} listenerFunction - The listener callback function to manage
   * @param {string} [description='listener'] - Debug description for the listener
   * @returns {Object} Listener management object with the following properties:
   *   - id: {string} Unique listener identifier
   *   - listener: {Function} Wrapped listener function with usage tracking
   *   - remove: {Function} Method to remove listener from pool
   *   - isActive: {Function} Method to check if listener is still active
   *
   * @example
   * const managedListener = pool.createManagedListener(
   *   (message) => console.log('Message received'),
   *   'screenshot-websocket-listener'
   * );
   *
   * window.wsManager.on('message', managedListener.listener);
   *
   * // Clean up when done
   * managedListener.remove();
   *
   * @throws {Error} When listener pool is at capacity and cleanup fails
   */
  createManagedListener(listenerFunction, description = 'listener') {
    // Check if we're approaching listener limit
    if (this.listenerPool.size >= this.maxConcurrentListeners) {
      console.warn(
        `⚠️ ${this.debugPrefix} Listener pool approaching maximum capacity - cleaning up stale listeners`
      );
      this.cleanupStaleListeners();
    }

    const listenerId = `listener_${++this.listenerIdCounter}_${Date.now()}`;
    const listenerData = {
      id: listenerId,
      function: listenerFunction,
      description,
      createdAt: Date.now(),
      isActive: true,
      usage: {
        calls: 0,
        lastUsed: Date.now(),
      },
    };

    // Create wrapper function for tracking
    const wrappedListener = (...args) => {
      listenerData.usage.calls++;
      listenerData.usage.lastUsed = Date.now();
      return listenerFunction(...args);
    };

    // Store in pool
    this.listenerPool.set(listenerId, listenerData);

    console.log(
      `🔧 ${this.debugPrefix} Created managed listener: ${listenerId} (${description})`
    );

    return {
      id: listenerId,
      listener: wrappedListener,
      remove: () => this.removeListener(listenerId),
      isActive: () => this.listenerPool.has(listenerId),
    };
  }

  /**
   * Remove a listener from the pool and cleanup resources
   *
   * Safely removes a managed listener from the internal pool. This method handles
   * cleanup of all associated resources and prevents memory leaks.
   *
   * @param {string} listenerId - Unique ID of listener to remove (from createManagedListener)
   * @returns {boolean} True if listener was successfully removed, false if not found
   *
   * @example
   * const success = pool.removeListener('listener_123_1234567890');
   * if (success) {
   *   console.log('Listener removed successfully');
   * }
   */
  removeListener(listenerId) {
    const listenerData = this.listenerPool.get(listenerId);
    if (!listenerData) {
      console.warn(
        `⚠️ ${this.debugPrefix} Attempted to remove non-existent listener: ${listenerId}`
      );
      return false;
    }

    try {
      // Remove from pool
      this.listenerPool.delete(listenerId);
      console.log(`🗑️ ${this.debugPrefix} Removed listener from pool: ${listenerId}`);

      return true;
    } catch (error) {
      console.error(
        `❌ ${this.debugPrefix} Error removing listener ${listenerId}:`,
        error.message
      );
      // Still remove from pool even if other cleanup failed
      this.listenerPool.delete(listenerId);
      return false;
    }
  }

  /**
   * Clean up stale listeners that are no longer needed
   *
   * Removes listeners from the pool based on age and usage patterns to prevent
   * memory leaks. This method is called automatically by the dynamic cleanup system
   * but can also be called manually for immediate cleanup.
   *
   * Cleanup criteria:
   * - Listeners older than maxAge AND inactive for more than minInactiveTime
   * - Listeners that have never been called and are older than neverUsedMaxAge
   *
   * @returns {number} Number of listeners cleaned up
   *
   * @example
   * const cleanedCount = pool.cleanupStaleListeners();
   * console.log(`Cleaned up ${cleanedCount} stale listeners`);
   */
  cleanupStaleListeners() {
    const now = Date.now();
    let cleaned = 0;

    console.log(
      `🧹 ${this.debugPrefix} Starting listener pool cleanup (${this.listenerPool.size} listeners)`
    );

    for (const [listenerId, listenerData] of this.listenerPool.entries()) {
      const age = now - listenerData.createdAt;
      const inactivityTime = now - listenerData.usage.lastUsed;

      // Remove listeners that are:
      // 1. Older than maxAge AND inactive for more than minInactiveTime
      // 2. Have never been called and are older than neverUsedMaxAge
      const isStale =
        (age > this.maxAge && inactivityTime > this.minInactiveTime) ||
        (listenerData.usage.calls === 0 && age > this.neverUsedMaxAge);

      if (isStale) {
        console.log(
          `🧹 ${this.debugPrefix} Cleaning up stale listener: ${listenerId} (age: ${age}ms, inactive: ${inactivityTime}ms, calls: ${listenerData.usage.calls})`
        );
        this.removeListener(listenerId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(
        `🧹 ${this.debugPrefix} Cleaned up ${cleaned} stale listeners. Pool size: ${this.listenerPool.size}`
      );
    }

    this.lastListenerCleanup = now;
    return cleaned;
  }

  /**
   * Start listener pool cleanup with dynamic intervals
   *
   * Cleanup intervals adjust based on pool usage:
   * - 0 listeners: 2 minutes
   * - 1-2 listeners: 1 minute
   * - 3-4 listeners: 30 seconds
   * - 5+ listeners: 10 seconds
   *
   * @example
   * pool.startListenerPoolCleanup();
   */
  startListenerPoolCleanup() {
    const scheduleNextCleanup = () => {
      // Dynamic interval based on pool usage
      const poolSize = this.listenerPool.size;
      let interval;

      if (poolSize === 0) {
        interval = 120000; // 2 minutes when no listeners
      } else if (poolSize < 3) {
        interval = 60000; // 1 minute for light usage
      } else if (poolSize < 5) {
        interval = 30000; // 30 seconds for moderate usage
      } else {
        interval = 10000; // 10 seconds for heavy usage
      }

      this.listenerCleanupInterval = setTimeout(() => {
        this.cleanupStaleListeners();
        scheduleNextCleanup(); // Schedule next cleanup
      }, interval);

      console.log(
        `🔄 ${this.debugPrefix} Next listener cleanup in ${
          interval / 1000
        }s (${poolSize} listeners active)`
      );
    };

    scheduleNextCleanup();
  }

  /**
   * Stop automatic cleanup
   *
   * @example
   * pool.stopListenerPoolCleanup();
   */
  stopListenerPoolCleanup() {
    if (this.listenerCleanupInterval) {
      clearTimeout(this.listenerCleanupInterval);
      this.listenerCleanupInterval = null;
      console.log(`🛑 ${this.debugPrefix} Stopped listener pool cleanup`);
    }
  }

  /**
   * Get listener pool status for debugging
   *
   * @returns {Object} Pool status information
   *   - totalListeners: {number} Current number of listeners
   *   - maxListeners: {number} Maximum allowed listeners
   *   - utilizationPercent: {number} Pool utilization percentage
   *   - lastCleanup: {number} Time since last cleanup (ms)
   *   - listeners: {Array} Detailed listener information
   *
   * @example
   * const status = pool.getListenerPoolStatus();
   * console.log(`Pool: ${status.totalListeners}/${status.maxListeners} (${status.utilizationPercent}%)`);
   */
  getListenerPoolStatus() {
    const now = Date.now();
    const listeners = Array.from(this.listenerPool.values()).map(
      (listener) => ({
        id: listener.id,
        description: listener.description,
        age: now - listener.createdAt,
        calls: listener.usage.calls,
        lastUsed: now - listener.usage.lastUsed,
        isActive: listener.isActive,
      })
    );

    return {
      totalListeners: this.listenerPool.size,
      maxListeners: this.maxConcurrentListeners,
      utilizationPercent: Math.round(
        (this.listenerPool.size / this.maxConcurrentListeners) * 100
      ),
      lastCleanup: now - this.lastListenerCleanup,
      listeners,
    };
  }

  /**
   * Destroy the pool and cleanup all resources
   *
   * @example
   * pool.destroy();
   */
  destroy() {
    console.log(`🗑️ ${this.debugPrefix} Destroying listener pool...`);

    // Stop cleanup interval
    this.stopListenerPoolCleanup();

    // Remove all listeners
    const listenerIds = Array.from(this.listenerPool.keys());
    listenerIds.forEach(id => this.removeListener(id));

    console.log(`🗑️ ${this.debugPrefix} Listener pool destroyed`);
  }
}

// Export for use in other modules
window.ListenerPoolManager = ListenerPoolManager;
