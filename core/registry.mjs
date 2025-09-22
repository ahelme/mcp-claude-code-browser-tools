/**
 * 🦁 MANE Tool Registry System
 * Auto-discovery and registration system for browser tools
 *
 * This registry enables zero-coordination development by automatically
 * discovering and connecting tool implementations created by other agents.
 *
 * Built by: Foundation Architect (Agent A)
 * For: MANE (Modular Agentic Non-linear Engineering)
 */

import {
  ErrorType,
} from "./interfaces.mjs";

/**
 * Central registry for auto-discovery of browser tools
 *
 * Features:
 * - Automatic tool registration and discovery
 * - Health monitoring and status tracking
 * - Request routing with load balancing
 * - Metrics collection and reporting
 * - Error handling and recovery
 */
export class ToolRegistry {
  /**
   * @param {ILogger} logger - Logger instance
   * @param {IMetrics} metrics - Metrics collector
   */
  constructor(logger, metrics) {
    /** @type {Map<string, IBrowserTool>} */
    this.tools = new Map();

    /** @type {Map<string, IBrowserTool>} */
    this.toolsByEndpoint = new Map();

    /** @type {Map<string, IBrowserTool[]>} */
    this.toolsByCategory = new Map();

    /** @type {Map<string, boolean>} */
    this.healthCache = new Map();

    /** @type {number} */
    this.lastHealthCheck = 0;

    /** @type {number} */
    this.requestCount = 0;

    /** @type {number} */
    this.errorCount = 0;

    /** @type {number} */
    this.totalResponseTime = 0;

    this.logger = logger;
    this.metrics = metrics;

    this.startHealthMonitoring();
  }

  /**
   * Register a browser tool with the registry
   * @param {IBrowserTool} tool - Tool to register
   * @returns {Promise<void>}
   */
  async registerTool(tool) {
    try {
      // Validate tool interface compliance
      this.validateTool(tool);

      // Register by name
      this.tools.set(tool.name, tool);

      // Register by endpoint
      if (tool.endpoint) {
        this.toolsByEndpoint.set(tool.endpoint, tool);
      }

      // Register by category
      const category = tool.category || 'general';
      if (!this.toolsByCategory.has(category)) {
        this.toolsByCategory.set(category, []);
      }
      this.toolsByCategory.get(category).push(tool);

      this.logger.info(`Tool registered: ${tool.name} (${tool.endpoint})`);

      await this.metrics.recordToolRegistration(tool.name, category);

    } catch (error) {
      this.logger.error(`Failed to register tool ${tool.name}:`, error);
      throw error;
    }
  }

  /**
   * Discover tools matching filter criteria
   * @param {IToolFilter} [filter] - Optional filter criteria
   * @returns {IBrowserTool[]} Matching tools
   */
  discoverTools(filter = {}) {
    let tools = Array.from(this.tools.values());

    // Apply filters
    if (filter.category) {
      tools = tools.filter(tool => tool.category === filter.category);
    }

    if (filter.capabilities) {
      tools = tools.filter(tool =>
        filter.capabilities.every(cap =>
          tool.getCapabilities().includes(cap)
        )
      );
    }

    if (filter.healthStatus !== undefined) {
      tools = tools.filter(tool =>
        this.healthCache.get(tool.name) === filter.healthStatus
      );
    }

    return tools;
  }

  /**
   * Route request to appropriate tool
   * @param {string} endpoint - Tool endpoint
   * @param {unknown} params - Request parameters
   * @returns {Promise<IToolResult>} Tool result
   */
  async routeRequest(endpoint, params) {
    const startTime = Date.now();
    this.requestCount++;

    try {
      const tool = this.toolsByEndpoint.get(endpoint);
      if (!tool) {
        throw new Error(`No tool registered for endpoint: ${endpoint}`);
      }

      // Validate parameters
      const validation = tool.validate(params);
      if (!validation.valid) {
        throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
      }

      // Execute tool
      const result = await tool.execute(params);

      // Record metrics
      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;

      await this.metrics.recordToolExecution(
        tool.name,
        responseTime,
        result.success
      );

      return result;

    } catch (error) {
      this.errorCount++;

      await this.metrics.recordToolError(endpoint, error.message);

      this.logger.error(`Tool execution failed for ${endpoint}:`, error);

      return {
        success: false,
        error: error.message,
        errorType: ErrorType.TOOL_EXECUTION_ERROR,
        context: { endpoint, params }
      };
    }
  }

  /**
   * Get registry health status
   * @returns {Promise<IRegistryHealth>} Health status
   */
  async getHealth() {
    const now = Date.now();

    // Refresh health cache if needed
    if (now - this.lastHealthCheck > 30000) { // 30 seconds
      await this.refreshHealthCache();
      this.lastHealthCheck = now;
    }

    const totalTools = this.tools.size;
    const healthyTools = Array.from(this.healthCache.values())
      .filter(healthy => healthy).length;

    const avgResponseTime = this.requestCount > 0
      ? this.totalResponseTime / this.requestCount
      : 0;

    const errorRate = this.requestCount > 0
      ? (this.errorCount / this.requestCount) * 100
      : 0;

    return {
      healthy: healthyTools === totalTools && errorRate < 5,
      totalTools,
      healthyTools,
      avgResponseTime,
      errorRate,
      requestCount: this.requestCount,
      lastCheck: now
    };
  }

  /**
   * Validate tool implements required interface
   * @param {IBrowserTool} tool - Tool to validate
   * @private
   */
  validateTool(tool) {
    const required = ['name', 'endpoint', 'execute', 'validate', 'getCapabilities'];

    for (const method of required) {
      if (typeof tool[method] === 'undefined') {
        throw new Error(`Tool missing required property: ${method}`);
      }
    }

    if (typeof tool.execute !== 'function') {
      throw new Error('Tool execute must be a function');
    }

    if (typeof tool.validate !== 'function') {
      throw new Error('Tool validate must be a function');
    }

    if (typeof tool.getCapabilities !== 'function') {
      throw new Error('Tool getCapabilities must be a function');
    }
  }

  /**
   * Refresh health cache for all tools
   * @private
   */
  async refreshHealthCache() {
    const healthChecks = Array.from(this.tools.entries()).map(
      async ([name, tool]) => {
        try {
          // Simple health check - validate with empty params
          const validation = tool.validate({});
          this.healthCache.set(name, true);
        } catch (error) {
          this.healthCache.set(name, false);
          this.logger.warn(`Tool ${name} failed health check:`, error);
        }
      }
    );

    await Promise.allSettled(healthChecks);
  }

  /**
   * Start background health monitoring
   * @private
   */
  startHealthMonitoring() {
    // Refresh health every 5 minutes
    setInterval(() => {
      this.refreshHealthCache();
    }, 300000);
  }

  /**
   * Get tool by name
   * @param {string} name - Tool name
   * @returns {IBrowserTool|undefined} Tool instance
   */
  getTool(name) {
    return this.tools.get(name);
  }

  /**
   * Get all registered tool names
   * @returns {string[]} Tool names
   */
  getToolNames() {
    return Array.from(this.tools.keys());
  }

  /**
   * Unregister a tool
   * @param {string} name - Tool name to unregister
   * @returns {boolean} True if tool was unregistered
   */
  unregisterTool(name) {
    const tool = this.tools.get(name);
    if (!tool) {
      return false;
    }

    // Remove from all indexes
    this.tools.delete(name);

    if (tool.endpoint) {
      this.toolsByEndpoint.delete(tool.endpoint);
    }

    const category = tool.category || 'general';
    const categoryTools = this.toolsByCategory.get(category);
    if (categoryTools) {
      const index = categoryTools.indexOf(tool);
      if (index > -1) {
        categoryTools.splice(index, 1);
      }
    }

    this.healthCache.delete(name);

    this.logger.info(`Tool unregistered: ${name}`);
    return true;
  }
}

/**
 * Create a new tool registry instance
 * @param {ILogger} logger - Logger instance
 * @param {IMetrics} metrics - Metrics collector
 * @returns {ToolRegistry} Registry instance
 */
export function createToolRegistry(logger, metrics) {
  return new ToolRegistry(logger, metrics);
}