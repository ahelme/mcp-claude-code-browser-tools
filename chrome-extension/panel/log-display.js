/**
 * Log Display Manager - Panel Module
 *
 * Manages log display, entry creation, and log clearing functionality.
 * Extracted from panel.js to create focused, maintainable module.
 *
 * @module panel/log-display
 * @version 1.0.0
 * @since 2025-10-02
 */

/**
 * Log display manager for user feedback and debugging
 *
 * Features:
 * - Timestamped log entries with level-based styling
 * - Auto-scroll to latest entries
 * - Log clearing with confirmation message
 * - Support for info, error, warning, and success levels
 * - Global accessibility for other modules
 *
 * @class LogDisplayManager
 *
 * @example
 * const logManager = new LogDisplayManager(logsDisplayElement);
 * logManager.addEntry('info', 'Server connected');
 * logManager.addEntry('error', 'Connection failed');
 * logManager.clear();
 */
class LogDisplayManager {
  /**
   * Create a new log display manager
   *
   * @param {HTMLElement} logsDisplayElement - DOM element for log display
   */
  constructor(logsDisplayElement) {
    this.logsDisplay = logsDisplayElement;
    this.maxEntries = 100; // Prevent memory bloat
    this.entryCount = 0;

    console.log('📝 LogDisplayManager initialized');
  }

  /**
   * Add a log entry to the display
   *
   * Creates a timestamped log entry with appropriate styling based on level.
   * Auto-scrolls to show latest entry and manages entry count to prevent memory issues.
   *
   * @param {string} level - Log level: 'info', 'error', 'warning', 'success'
   * @param {string} message - Log message to display
   *
   * @example
   * logManager.addEntry('info', 'Screenshot captured');
   * logManager.addEntry('error', 'Failed to connect to server');
   * logManager.addEntry('warning', 'Connection timeout, retrying...');
   * logManager.addEntry('success', 'Navigation completed');
   *
   * @since 1.0.0
   */
  addEntry(level, message) {
    if (!this.logsDisplay) {
      console.warn('⚠️ LogDisplayManager: logsDisplay element not set');
      console.log(`[${level.toUpperCase()}] ${message}`);
      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    const logClass = this.getLogClass(level);

    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${logClass}`;
    logEntry.textContent = `[${timestamp}] ${message}`;

    this.logsDisplay.appendChild(logEntry);
    this.entryCount++;

    // Auto-scroll to bottom to show latest entry
    this.logsDisplay.scrollTop = this.logsDisplay.scrollHeight;

    // Limit entries to prevent memory issues
    if (this.entryCount > this.maxEntries) {
      this.removeOldestEntry();
    }

    console.log(`📝 Log entry [${level}]: ${message}`);
  }

  /**
   * Get CSS class for log level
   *
   * @private
   * @param {string} level - Log level
   * @returns {string} CSS class name
   */
  getLogClass(level) {
    const levelMap = {
      error: 'log-error',
      warning: 'log-warning',
      success: 'log-success',
      info: 'log-info',
    };

    return levelMap[level] || 'log-info';
  }

  /**
   * Remove oldest log entry to manage memory
   *
   * @private
   */
  removeOldestEntry() {
    if (this.logsDisplay && this.logsDisplay.firstChild) {
      this.logsDisplay.removeChild(this.logsDisplay.firstChild);
      this.entryCount--;
    }
  }

  /**
   * Clear all log entries
   *
   * Removes all log entries and displays a "Logs cleared" message.
   * Uses CSP-compliant DOM manipulation.
   *
   * @example
   * logManager.clear();
   *
   * @since 1.0.0
   */
  clear() {
    if (!this.logsDisplay) {
      console.warn('⚠️ LogDisplayManager: logsDisplay element not set');
      return;
    }

    // CSP-compliant DOM manipulation
    this.logsDisplay.textContent = '';
    this.entryCount = 0;

    const clearedDiv = document.createElement('div');
    clearedDiv.className = 'log-entry log-info';
    clearedDiv.textContent = 'Logs cleared...';
    this.logsDisplay.appendChild(clearedDiv);

    this.addEntry('info', 'Logs cleared');

    console.log('🗑️ Logs cleared');
  }

  /**
   * Add multiple log entries at once
   *
   * @param {Array<Object>} entries - Array of {level, message} objects
   *
   * @example
   * logManager.addMultiple([
   *   { level: 'info', message: 'Starting operation' },
   *   { level: 'success', message: 'Operation completed' }
   * ]);
   *
   * @since 1.0.0
   */
  addMultiple(entries) {
    for (const entry of entries) {
      this.addEntry(entry.level, entry.message);
    }
  }

  /**
   * Set maximum number of log entries
   *
   * @param {number} max - Maximum number of entries to keep
   *
   * @example
   * logManager.setMaxEntries(200);
   *
   * @since 1.0.0
   */
  setMaxEntries(max) {
    this.maxEntries = max;
    console.log(`📝 Max log entries set to ${max}`);
  }

  /**
   * Get current log entries as array
   *
   * @returns {Array<Object>} Array of {timestamp, level, message} objects
   *
   * @example
   * const logs = logManager.getEntries();
   * console.log('Current logs:', logs);
   *
   * @since 1.0.0
   */
  getEntries() {
    if (!this.logsDisplay) return [];

    const entries = [];
    const logElements = this.logsDisplay.querySelectorAll('.log-entry');

    logElements.forEach((element) => {
      const text = element.textContent;
      const match = text.match(/^\[(.+?)\] (.+)$/);

      if (match) {
        entries.push({
          timestamp: match[1],
          message: match[2],
          level: element.classList.contains('log-error')
            ? 'error'
            : element.classList.contains('log-warning')
            ? 'warning'
            : element.classList.contains('log-success')
            ? 'success'
            : 'info',
        });
      }
    });

    return entries;
  }

  /**
   * Export logs as text
   *
   * @returns {string} Logs formatted as plain text
   *
   * @example
   * const logsText = logManager.exportAsText();
   * navigator.clipboard.writeText(logsText);
   *
   * @since 1.0.0
   */
  exportAsText() {
    const entries = this.getEntries();
    return entries.map((e) => `[${e.timestamp}] [${e.level.toUpperCase()}] ${e.message}`).join('\n');
  }

  /**
   * Filter log entries by level
   *
   * @param {string} level - Log level to show ('all', 'info', 'error', 'warning', 'success')
   *
   * @example
   * logManager.filterByLevel('error'); // Show only errors
   * logManager.filterByLevel('all');   // Show all entries
   *
   * @since 1.0.0
   */
  filterByLevel(level) {
    if (!this.logsDisplay) return;

    const logElements = this.logsDisplay.querySelectorAll('.log-entry');

    logElements.forEach((element) => {
      if (level === 'all') {
        element.style.display = '';
      } else {
        const hasLevel = element.classList.contains(`log-${level}`);
        element.style.display = hasLevel ? '' : 'none';
      }
    });

    console.log(`📝 Filtering logs by level: ${level}`);
  }

  /**
   * Get entry count
   *
   * @returns {number} Current number of log entries
   *
   * @example
   * const count = logManager.getEntryCount();
   * console.log(`${count} log entries`);
   *
   * @since 1.0.0
   */
  getEntryCount() {
    return this.entryCount;
  }

  /**
   * Check if logs are empty
   *
   * @returns {boolean} True if no log entries
   *
   * @example
   * if (logManager.isEmpty()) {
   *   console.log('No logs to display');
   * }
   *
   * @since 1.0.0
   */
  isEmpty() {
    return this.entryCount === 0;
  }

  /**
   * Update the logs display element
   *
   * @param {HTMLElement} element - New logs display element
   *
   * @example
   * logManager.setLogsDisplay(document.getElementById('logs-display'));
   *
   * @since 1.0.0
   */
  setLogsDisplay(element) {
    this.logsDisplay = element;
    console.log('📝 Logs display element updated');
  }
}

// Export for use in other modules
window.LogDisplayManager = LogDisplayManager;
