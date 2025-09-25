/**
 * Memory Management Utility Module
 *
 * Provides memory monitoring, log size management, and cleanup utilities
 * to prevent memory leaks and manage resource usage.
 */

import { MEMORY_CONFIG, LOGGING_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from './constants.js';

/**
 * Memory Manager Class
 * Handles memory monitoring and cleanup operations
 */
export class MemoryManager {
  constructor() {
    this.config = MEMORY_CONFIG;
    this.logConfig = LOGGING_CONFIG;
    this.memoryBaseline = null;
    this.monitoringInterval = null;
    this.warningThreshold = this.config.MEMORY_WARNING_THRESHOLD;

    this.establishBaseline();
    this.startMonitoring();
  }

  /**
   * Establish memory baseline for comparison
   */
  establishBaseline() {
    if (performance.memory) {
      this.memoryBaseline = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
      console.log('📊 Memory baseline established:', this.memoryBaseline);
    } else {
      console.warn('⚠️ Performance.memory API not available - memory monitoring limited');
    }
  }

  /**
   * Get current memory usage information
   * @returns {Object|null} Memory usage data or null if unavailable
   */
  getCurrentMemoryUsage() {
    if (!performance.memory) {
      return null;
    }

    const current = {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      timestamp: Date.now()
    };

    if (this.memoryBaseline) {
      current.growth = current.used - this.memoryBaseline.used;
      current.growthPercent = (current.growth / this.memoryBaseline.used) * 100;
    }

    return current;
  }

  /**
   * Check if memory usage is concerning
   * @returns {Object} Memory analysis result
   */
  analyzeMemoryUsage() {
    const current = this.getCurrentMemoryUsage();
    if (!current) {
      return { available: false, concerning: false };
    }

    const utilizationPercent = (current.used / current.limit) * 100;
    const growthConcerning = current.growthPercent && current.growthPercent > 50;
    const utilizationConcerning = utilizationPercent > (this.warningThreshold * 100);

    return {
      available: true,
      current,
      utilizationPercent,
      growthConcerning,
      utilizationConcerning,
      concerning: growthConcerning || utilizationConcerning,
      recommendedAction: this._getRecommendedAction(utilizationPercent, current.growthPercent || 0)
    };
  }

  /**
   * Start memory monitoring
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      const analysis = this.analyzeMemoryUsage();
      if (analysis.available && analysis.concerning) {
        console.warn('⚠️ Memory usage concerning:', analysis);
        this._handleMemoryWarning(analysis);
      }
    }, this.config.MEMORY_CHECK_INTERVAL);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Force garbage collection (if available)
   * @returns {boolean} True if garbage collection was triggered
   */
  forceGarbageCollection() {
    // Only available in Chrome DevTools or with special flags
    if (window.gc && typeof window.gc === 'function') {
      try {
        console.log('🗑️ Forcing garbage collection...');
        window.gc();
        return true;
      } catch (error) {
        console.warn('Failed to force garbage collection:', error);
        return false;
      }
    }

    // Alternative: Create pressure to trigger GC
    console.log('🗑️ Creating memory pressure to encourage garbage collection...');
    try {
      const pressure = new Array(1000).fill(null).map(() => new Array(1000));
      pressure.length = 0; // Clear reference
      return true;
    } catch (error) {
      console.warn('Failed to create memory pressure:', error);
      return false;
    }
  }

  /**
   * Get memory usage summary for reporting
   * @returns {Object} Memory usage summary
   */
  getMemorySummary() {
    const current = this.getCurrentMemoryUsage();
    if (!current) {
      return { available: false };
    }

    return {
      available: true,
      used: Math.round(current.used / 1024 / 1024), // MB
      total: Math.round(current.total / 1024 / 1024), // MB
      limit: Math.round(current.limit / 1024 / 1024), // MB
      utilization: Math.round((current.used / current.limit) * 100), // %
      growth: current.growth ? Math.round(current.growth / 1024 / 1024) : 0, // MB
      growthPercent: Math.round(current.growthPercent || 0), // %
      baseline: this.memoryBaseline ? Math.round(this.memoryBaseline.used / 1024 / 1024) : 0 // MB
    };
  }

  // Private methods

  /**
   * Handle memory warning by triggering cleanup
   * @private
   */
  _handleMemoryWarning(analysis) {
    console.warn(ERROR_MESSAGES.MEMORY.HIGH_USAGE.replace('{percent}',
      Math.round(analysis.utilizationPercent)));

    // Try to trigger cleanup in various components
    this._triggerGlobalCleanup();

    // Force garbage collection if available
    this.forceGarbageCollection();
  }

  /**
   * Trigger cleanup across all components
   * @private
   */
  _triggerGlobalCleanup() {
    console.log('🧹 Triggering global memory cleanup...');

    // Cleanup navigation handler if available
    if (window.navigationHandler && typeof window.navigationHandler.cleanupStaleListeners === 'function') {
      window.navigationHandler.cleanupStaleListeners();
    }

    // Cleanup interaction handler if available
    if (window.interactionHandler && typeof window.interactionHandler.cleanupOrphanedOperations === 'function') {
      window.interactionHandler.cleanupOrphanedOperations();
    }

    // Cleanup logs if log manager is available
    if (window.logManager && typeof window.logManager.cleanup === 'function') {
      window.logManager.cleanup();
    }

    // Cleanup WebSocket queues if available
    if (window.websocketManager && typeof window.websocketManager.clearQueue === 'function') {
      window.websocketManager.clearQueue();
    }
  }

  /**
   * Get recommended action based on memory usage
   * @private
   */
  _getRecommendedAction(utilizationPercent, growthPercent) {
    if (utilizationPercent > 90) {
      return 'critical_cleanup';
    } else if (utilizationPercent > 80 || growthPercent > 100) {
      return 'immediate_cleanup';
    } else if (utilizationPercent > 70 || growthPercent > 50) {
      return 'scheduled_cleanup';
    } else {
      return 'monitoring';
    }
  }
}

/**
 * Log Manager Class
 * Manages log entries with size limits and cleanup
 */
export class LogManager {
  constructor(container, maxEntries = MEMORY_CONFIG.MAX_LOG_ENTRIES) {
    this.container = container;
    this.maxEntries = maxEntries;
    this.cleanupThreshold = MEMORY_CONFIG.LOG_CLEANUP_THRESHOLD;
    this.entries = [];
    this.totalEntries = 0; // Track total over session
  }

  /**
   * Add a log entry with automatic cleanup
   * @param {string} level - Log level (info, warning, error)
   * @param {string} message - Log message
   * @param {string} source - Log source prefix
   */
  addEntry(level, message, source = '') {
    const entry = {
      id: ++this.totalEntries,
      level,
      message: this._truncateMessage(message),
      source,
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString()
    };

    this.entries.push(entry);

    // Add to DOM
    this._addEntryToDOM(entry);

    // Check if cleanup is needed
    if (this.entries.length >= this.cleanupThreshold) {
      this.cleanup();
    }
  }

  /**
   * Clean up old log entries
   * @param {number} keepCount - Number of recent entries to keep
   */
  cleanup(keepCount = this.maxEntries) {
    if (this.entries.length <= keepCount) {
      return 0; // No cleanup needed
    }

    const toRemove = this.entries.length - keepCount;
    const removedEntries = this.entries.splice(0, toRemove);

    // Remove from DOM
    removedEntries.forEach(entry => {
      const domElement = this.container.querySelector(`[data-log-id="${entry.id}"]`);
      if (domElement) {
        domElement.remove();
      }
    });

    console.log(SUCCESS_MESSAGES.CLEANUP.LOGS_TRUNCATED.replace('{count}', toRemove));
    return toRemove;
  }

  /**
   * Clear all log entries
   */
  clear() {
    this.entries.length = 0;
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Get log statistics
   * @returns {Object} Log statistics
   */
  getStats() {
    const levels = {};
    this.entries.forEach(entry => {
      levels[entry.level] = (levels[entry.level] || 0) + 1;
    });

    return {
      totalEntries: this.totalEntries,
      currentEntries: this.entries.length,
      maxEntries: this.maxEntries,
      utilizationPercent: Math.round((this.entries.length / this.maxEntries) * 100),
      levelBreakdown: levels
    };
  }

  // Private methods

  /**
   * Truncate message if too long
   * @private
   */
  _truncateMessage(message) {
    const maxLength = LOGGING_CONFIG.MAX_MESSAGE_LENGTH;
    if (message.length <= maxLength) {
      return message;
    }

    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Add entry to DOM
   * @private
   */
  _addEntryToDOM(entry) {
    if (!this.container) return;

    const logElement = document.createElement('div');
    logElement.className = `log-entry log-${entry.level}`;
    logElement.setAttribute('data-log-id', entry.id);

    const prefix = entry.source ? `${entry.source} ` : '';
    logElement.textContent = `[${entry.displayTime}] ${prefix}${entry.message}`;

    this.container.appendChild(logElement);

    // Auto-scroll to bottom
    this.container.scrollTop = this.container.scrollHeight;
  }
}

/**
 * DOM Batch Updater Class
 * Manages batch DOM updates using DocumentFragment for better performance
 */
export class DOMBatchUpdater {
  constructor() {
    this.pendingUpdates = new Map(); // Container -> operations array
    this.batchTimeout = null;
    this.config = { batchSize: 50, batchDelay: 16 }; // ~60fps
  }

  /**
   * Queue a DOM operation for batch processing
   * @param {Element} container - Target container
   * @param {Function} operation - DOM operation function
   * @param {string} type - Operation type for optimization
   */
  queueUpdate(container, operation, type = 'append') {
    if (!this.pendingUpdates.has(container)) {
      this.pendingUpdates.set(container, []);
    }

    this.pendingUpdates.get(container).push({ operation, type });

    // Schedule batch processing
    this._scheduleBatch();
  }

  /**
   * Add multiple log entries efficiently
   * @param {Element} container - Log container
   * @param {Array} entries - Log entries to add
   */
  addLogEntries(container, entries) {
    if (entries.length < 10) {
      // For small batches, use direct DOM manipulation
      entries.forEach(entry => this._createLogElement(container, entry));
      return;
    }

    // For large batches, use DocumentFragment
    const fragment = document.createDocumentFragment();

    entries.forEach(entry => {
      const element = this._createLogElement(null, entry);
      fragment.appendChild(element);
    });

    container.appendChild(fragment);
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Process all pending updates
   */
  flush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    this._processBatch();
  }

  // Private methods

  /**
   * Schedule batch processing
   * @private
   */
  _scheduleBatch() {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this._processBatch();
      this.batchTimeout = null;
    }, this.config.batchDelay);
  }

  /**
   * Process pending DOM updates in batches
   * @private
   */
  _processBatch() {
    for (const [container, operations] of this.pendingUpdates.entries()) {
      if (operations.length === 0) continue;

      // Group operations by type for optimization
      const groupedOps = {};
      operations.forEach(op => {
        if (!groupedOps[op.type]) groupedOps[op.type] = [];
        groupedOps[op.type].push(op);
      });

      // Process each group
      for (const [type, ops] of Object.entries(groupedOps)) {
        this._processOperationGroup(container, ops, type);
      }

      operations.length = 0; // Clear processed operations
    }
  }

  /**
   * Process a group of similar operations
   * @private
   */
  _processOperationGroup(container, operations, type) {
    if (type === 'append' && operations.length > 10) {
      // Use DocumentFragment for many append operations
      const fragment = document.createDocumentFragment();
      operations.forEach(op => op.operation(fragment));
      container.appendChild(fragment);
    } else {
      // Process operations directly
      operations.forEach(op => op.operation(container));
    }
  }

  /**
   * Create log element
   * @private
   */
  _createLogElement(container, entry) {
    const element = document.createElement('div');
    element.className = `log-entry log-${entry.level}`;
    element.textContent = `[${entry.displayTime}] ${entry.source} ${entry.message}`;

    if (container) {
      container.appendChild(element);
    }

    return element;
  }
}

// Create default instances
export const memoryManager = new MemoryManager();
export const domBatchUpdater = new DOMBatchUpdater();

// Export convenience functions
export const getCurrentMemoryUsage = () => memoryManager.getCurrentMemoryUsage();
export const analyzeMemoryUsage = () => memoryManager.analyzeMemoryUsage();
export const getMemorySummary = () => memoryManager.getMemorySummary();
export const forceGarbageCollection = () => memoryManager.forceGarbageCollection();

export default {
  MemoryManager,
  LogManager,
  DOMBatchUpdater,
  memoryManager,
  domBatchUpdater,
  getCurrentMemoryUsage,
  analyzeMemoryUsage,
  getMemorySummary,
  forceGarbageCollection
};