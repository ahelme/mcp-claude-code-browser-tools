/**
 * Browser Get Console Tool
 *
 * Captures and monitors browser console logs, errors, and warnings.
 * Provides real-time log streaming and filtering.
 */

class BrowserGetConsoleTool {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Maximum logs to retain
    this.isMonitoring = false;
    this.originalConsole = {};
  }

  /**
   * Start monitoring console output
   * @param {Object} options - Monitoring options
   * @returns {Object} Monitoring status
   */
  startMonitoring(options = {}) {
    const {
      captureLog = true,
      captureInfo = true,
      captureWarn = true,
      captureError = true,
      captureDebug = false
    } = options;

    if (this.isMonitoring) {
      return {
        success: false,
        error: 'Already monitoring console'
      };
    }

    try {
      // Store original console methods
      this.originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug
      };

      // Intercept console methods
      if (captureLog) {
        console.log = (...args) => {
          this.captureLog('log', args);
          this.originalConsole.log.apply(console, args);
        };
      }

      if (captureInfo) {
        console.info = (...args) => {
          this.captureLog('info', args);
          this.originalConsole.info.apply(console, args);
        };
      }

      if (captureWarn) {
        console.warn = (...args) => {
          this.captureLog('warn', args);
          this.originalConsole.warn.apply(console, args);
        };
      }

      if (captureError) {
        console.error = (...args) => {
          this.captureLog('error', args);
          this.originalConsole.error.apply(console, args);
        };
      }

      if (captureDebug) {
        console.debug = (...args) => {
          this.captureLog('debug', args);
          this.originalConsole.debug.apply(console, args);
        };
      }

      // Also capture window errors
      window.addEventListener('error', (event) => {
        this.captureLog('error', [{
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack
        }]);
      });

      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.captureLog('error', [{
          message: 'Unhandled Promise Rejection',
          reason: event.reason
        }]);
      });

      this.isMonitoring = true;

      return {
        success: true,
        message: 'Console monitoring started',
        capturing: { log: captureLog, info: captureInfo, warn: captureWarn, error: captureError, debug: captureDebug }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop monitoring console output
   * @returns {Object} Stop status
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return {
        success: false,
        error: 'Not currently monitoring'
      };
    }

    try {
      // Restore original console methods
      console.log = this.originalConsole.log;
      console.info = this.originalConsole.info;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;
      console.debug = this.originalConsole.debug;

      this.isMonitoring = false;

      return {
        success: true,
        message: 'Console monitoring stopped',
        capturedLogs: this.logs.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Capture log entry
   * @private
   */
  captureLog(level, args) {
    const entry = {
      level,
      message: args.map(arg => this.serializeArgument(arg)).join(' '),
      args: args.map(arg => this.serializeArgument(arg)),
      timestamp: Date.now(),
      url: window.location.href
    };

    this.logs.push(entry);

    // Trim logs if over limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Serialize console argument
   * @private
   */
  serializeArgument(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';

    const type = typeof arg;

    switch (type) {
      case 'string':
      case 'number':
      case 'boolean':
        return arg;

      case 'function':
        return `[Function: ${arg.name || 'anonymous'}]`;

      case 'object':
        if (arg instanceof Error) {
          return {
            type: 'Error',
            message: arg.message,
            stack: arg.stack
          };
        }

        if (arg instanceof Element) {
          return {
            type: 'Element',
            tagName: arg.tagName.toLowerCase(),
            id: arg.id || undefined,
            className: arg.className || undefined
          };
        }

        if (Array.isArray(arg)) {
          return arg.map(item => this.serializeArgument(item));
        }

        // Try to stringify object
        try {
          return JSON.parse(JSON.stringify(arg));
        } catch (e) {
          return String(arg);
        }

      default:
        return String(arg);
    }
  }

  /**
   * Get console logs
   * @param {Object} options - Filter options
   * @returns {Object} Console logs
   */
  getLogs(options = {}) {
    const {
      level = null,  // Filter by level: 'log', 'info', 'warn', 'error', 'debug'
      limit = null,  // Limit number of results
      since = null,  // Timestamp - only return logs after this time
      search = null  // Search term in message
    } = options;

    try {
      let filtered = [...this.logs];

      // Filter by level
      if (level) {
        const levels = Array.isArray(level) ? level : [level];
        filtered = filtered.filter(log => levels.includes(log.level));
      }

      // Filter by timestamp
      if (since) {
        filtered = filtered.filter(log => log.timestamp >= since);
      }

      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(log =>
          log.message.toLowerCase().includes(searchLower)
        );
      }

      // Limit results
      if (limit) {
        filtered = filtered.slice(-limit);
      }

      return {
        success: true,
        logs: filtered,
        count: filtered.length,
        totalCaptured: this.logs.length,
        isMonitoring: this.isMonitoring,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get only error logs
   * @returns {Object} Error logs
   */
  getErrors() {
    return this.getLogs({ level: 'error' });
  }

  /**
   * Get only warning logs
   * @returns {Object} Warning logs
   */
  getWarnings() {
    return this.getLogs({ level: 'warn' });
  }

  /**
   * Get recent logs
   * @param {number} count - Number of logs to return
   * @returns {Object} Recent logs
   */
  getRecent(count = 50) {
    return this.getLogs({ limit: count });
  }

  /**
   * Search logs
   * @param {string} term - Search term
   * @returns {Object} Matching logs
   */
  search(term) {
    return this.getLogs({ search: term });
  }

  /**
   * Clear all captured logs
   * @returns {Object} Clear status
   */
  clearLogs() {
    const previousCount = this.logs.length;
    this.logs = [];

    return {
      success: true,
      message: 'Logs cleared',
      clearedCount: previousCount
    };
  }

  /**
   * Get console statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        log: 0,
        info: 0,
        warn: 0,
        error: 0,
        debug: 0
      },
      isMonitoring: this.isMonitoring,
      maxLogs: this.maxLogs
    };

    this.logs.forEach(log => {
      if (stats.byLevel[log.level] !== undefined) {
        stats.byLevel[log.level]++;
      }
    });

    return {
      success: true,
      stats,
      timestamp: Date.now()
    };
  }

  /**
   * Export logs as JSON
   * @returns {Object} Export result
   */
  exportLogs() {
    try {
      const data = {
        exportedAt: Date.now(),
        url: window.location.href,
        totalLogs: this.logs.length,
        logs: this.logs
      };

      const json = JSON.stringify(data, null, 2);

      return {
        success: true,
        json,
        size: json.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Make available globally
window.BrowserGetConsoleTool = BrowserGetConsoleTool;
