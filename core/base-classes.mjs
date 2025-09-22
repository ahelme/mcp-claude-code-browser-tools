/**
 * 🦁 MANE Base Classes
 * Foundational base classes for browser tools and UI components
 *
 * Provides standardized patterns and interfaces that all agents can extend
 * to create consistent, interoperable components.
 *
 * Built by: Foundation Architect (Agent A)
 * For: MANE (Modular Agentic Non-linear Engineering)
 */

import {
  ErrorType
} from "./interfaces.mjs";

/**
 * Base class for all browser tools
 * Provides common functionality and enforces interface compliance
 */
export class BaseBrowserTool {
  /**
   * @param {string} name - Tool name
   * @param {string} endpoint - Tool endpoint
   * @param {ILogger} logger - Logger instance
   * @param {IMetrics} metrics - Metrics collector
   */
  constructor(name, endpoint, logger, metrics) {
    /** @type {string} */
    this.name = name;

    /** @type {string} */
    this.endpoint = endpoint;

    /** @type {string} */
    this.category = 'general';

    /** @type {string[]} */
    this.capabilities = [];

    /** @type {Object} */
    this.schema = {
      type: 'object',
      properties: {},
      required: []
    };

    this.logger = logger;
    this.metrics = metrics;
  }

  /**
   * Execute the tool with given parameters
   * Must be implemented by subclasses
   * @param {unknown} params - Tool parameters
   * @returns {Promise<IToolResult>} Execution result
   */
  async execute(params) {
    throw new Error(`Tool ${this.name} must implement execute method`);
  }

  /**
   * Validate parameters against tool schema
   * @param {unknown} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validate(params) {
    try {
      // Basic validation - subclasses should override for specific validation
      if (typeof params !== 'object' || params === null) {
        return {
          valid: false,
          errors: ['Parameters must be an object']
        };
      }

      // Check required fields
      const missing = [];
      for (const field of this.schema.required || []) {
        if (!(field in params)) {
          missing.push(field);
        }
      }

      if (missing.length > 0) {
        return {
          valid: false,
          errors: [`Missing required fields: ${missing.join(', ')}`]
        };
      }

      return { valid: true, errors: [] };

    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`]
      };
    }
  }

  /**
   * Get tool capabilities
   * @returns {string[]} Array of capability strings
   */
  getCapabilities() {
    return [...this.capabilities];
  }

  /**
   * Get tool status and health information
   * @returns {Promise<Object>} Status information
   */
  async getStatus() {
    return {
      healthy: true,
      name: this.name,
      endpoint: this.endpoint,
      category: this.category,
      lastCheck: Date.now()
    };
  }

  /**
   * Handle execution errors with consistent formatting
   * @param {Error} error - Error that occurred
   * @param {unknown} context - Execution context
   * @returns {IToolResult} Formatted error result
   * @protected
   */
  handleError(error, context = {}) {
    this.logger.error(`Tool ${this.name} execution failed:`, error);

    return {
      success: false,
      error: error.message,
      errorType: ErrorType.TOOL_EXECUTION_ERROR,
      context: {
        tool: this.name,
        endpoint: this.endpoint,
        ...context
      },
      timestamp: Date.now()
    };
  }

  /**
   * Record metrics for tool execution
   * @param {string} operation - Operation name
   * @param {number} duration - Execution duration in ms
   * @param {boolean} success - Whether operation succeeded
   * @protected
   */
  async recordMetrics(operation, duration, success) {
    await this.metrics.recordToolExecution(
      this.name,
      duration,
      success,
      { operation }
    );
  }

  /**
   * Log tool operation with consistent formatting
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [metadata] - Additional metadata
   * @protected
   */
  log(level, message, metadata = {}) {
    this.logger[level](`[${this.name}] ${message}`, {
      tool: this.name,
      endpoint: this.endpoint,
      ...metadata
    });
  }
}

/**
 * Base class for UI panels and components
 * Provides common UI functionality and event handling
 */
export class BaseUIPanel {
  /**
   * @param {string} id - Panel ID
   * @param {string} title - Panel title
   * @param {ILogger} logger - Logger instance
   */
  constructor(id, title, logger) {
    /** @type {string} */
    this.id = id;

    /** @type {string} */
    this.title = title;

    /** @type {boolean} */
    this.visible = false;

    /** @type {Map<string, Function>} */
    this.eventHandlers = new Map();

    /** @type {HTMLElement|null} */
    this.element = null;

    this.logger = logger;
  }

  /**
   * Render the panel
   * Must be implemented by subclasses
   * @param {HTMLElement} container - Container element
   * @returns {Promise<void>}
   */
  async render(container) {
    throw new Error(`Panel ${this.id} must implement render method`);
  }

  /**
   * Show the panel
   */
  show() {
    if (this.element) {
      this.element.style.display = 'block';
      this.visible = true;
      this.emit('show');
    }
  }

  /**
   * Hide the panel
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
      this.visible = false;
      this.emit('hide');
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler to remove
   */
  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {unknown} [data] - Event data
   * @protected
   */
  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.logger.error(`Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Clean up panel resources
   */
  destroy() {
    this.eventHandlers.clear();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }

  /**
   * Update panel content
   * @param {Object} data - Data to update with
   */
  update(data) {
    // Default implementation - subclasses should override
    this.emit('update', data);
  }
}

/**
 * Base class for monitoring components
 * Provides health checking and status reporting functionality
 */
export class BaseMonitor {
  /**
   * @param {string} name - Monitor name
   * @param {number} interval - Check interval in ms
   * @param {ILogger} logger - Logger instance
   */
  constructor(name, interval, logger) {
    /** @type {string} */
    this.name = name;

    /** @type {number} */
    this.interval = interval;

    /** @type {boolean} */
    this.running = false;

    /** @type {number|null} */
    this.timerId = null;

    /** @type {Map<string, any>} */
    this.status = new Map();

    this.logger = logger;
  }

  /**
   * Start monitoring
   */
  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.timerId = setInterval(() => {
      this.check().catch(error => {
        this.logger.error(`Monitor ${this.name} check failed:`, error);
      });
    }, this.interval);

    this.logger.info(`Monitor ${this.name} started (interval: ${this.interval}ms)`);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.running) {
      return;
    }

    this.running = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    this.logger.info(`Monitor ${this.name} stopped`);
  }

  /**
   * Perform health check
   * Must be implemented by subclasses
   * @returns {Promise<Object>} Check result
   */
  async check() {
    throw new Error(`Monitor ${this.name} must implement check method`);
  }

  /**
   * Get current status
   * @returns {Object} Current status
   */
  getStatus() {
    return Object.fromEntries(this.status.entries());
  }

  /**
   * Update status value
   * @param {string} key - Status key
   * @param {any} value - Status value
   * @protected
   */
  setStatus(key, value) {
    this.status.set(key, value);
    this.status.set('lastUpdate', Date.now());
  }
}

/**
 * Factory function to create browser tool instances
 * @param {string} type - Tool type
 * @param {Object} config - Tool configuration
 * @param {ILogger} logger - Logger instance
 * @param {IMetrics} metrics - Metrics collector
 * @returns {BaseBrowserTool} Tool instance
 */
export function createBrowserTool(type, config, logger, metrics) {
  // Basic factory implementation - can be extended
  return new BaseBrowserTool(
    config.name || type,
    config.endpoint || `/${type}`,
    logger,
    metrics
  );
}

/**
 * Factory function to create UI panel instances
 * @param {string} type - Panel type
 * @param {Object} config - Panel configuration
 * @param {ILogger} logger - Logger instance
 * @returns {BaseUIPanel} Panel instance
 */
export function createUIPanel(type, config, logger) {
  return new BaseUIPanel(
    config.id || type,
    config.title || type,
    logger
  );
}

/**
 * Factory function to create monitor instances
 * @param {string} type - Monitor type
 * @param {Object} config - Monitor configuration
 * @param {ILogger} logger - Logger instance
 * @returns {BaseMonitor} Monitor instance
 */
export function createMonitor(type, config, logger) {
  return new BaseMonitor(
    config.name || type,
    config.interval || 60000,
    logger
  );
}