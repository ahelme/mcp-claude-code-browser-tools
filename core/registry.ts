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
  IBrowserTool,
  IToolRegistry,
  IToolFilter,
  IToolResult,
  IRegistryHealth,
  ILogger,
  IMetrics,
  ErrorType,
  IErrorContext,
} from "./interfaces.js";

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
export class ToolRegistry implements IToolRegistry {
  private tools = new Map<string, IBrowserTool>();
  private toolsByEndpoint = new Map<string, IBrowserTool>();
  private toolsByCategory = new Map<string, IBrowserTool[]>();
  private healthCache = new Map<string, boolean>();
  private lastHealthCheck = 0;
  private requestCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;

  constructor(
    private logger: ILogger,
    private metrics: IMetrics,
  ) {
    this.startHealthMonitoring();
  }

  /**
   * Register a tool implementation
   * Called automatically by tool modules during initialization
   */
  async registerTool(tool: IBrowserTool): Promise<void> {
    try {
      this.logger.info(`Registering tool: ${tool.name}`, {
        endpoint: tool.endpoint,
        capabilities: tool.capabilities,
      });

      // Validate tool interface compliance
      this.validateTool(tool);

      // Register by name and endpoint
      this.tools.set(tool.name, tool);
      this.toolsByEndpoint.set(tool.endpoint, tool);

      // Register by category if specified
      const category = this.extractCategory(tool);
      if (category) {
        if (!this.toolsByCategory.has(category)) {
          this.toolsByCategory.set(category, []);
        }
        this.toolsByCategory.get(category)!.push(tool);
      }

      // Initialize health status
      const status = await tool.getStatus();
      this.healthCache.set(tool.name, status.healthy);

      this.metrics.increment("registry.tool.registered", {
        tool: tool.name,
        category: category || "unknown",
      });

      this.logger.info(`Successfully registered tool: ${tool.name}`);
    } catch (error) {
      this.logger.error(`Failed to register tool: ${tool.name}`, error);
      throw error;
    }
  }

  /**
   * Discover tools matching filter criteria
   * Enables agents to find tools they need without manual coordination
   */
  discoverTools(filter?: IToolFilter): IBrowserTool[] {
    this.logger.debug("Discovering tools", { filter });

    let tools = Array.from(this.tools.values());

    if (filter) {
      // Filter by category
      if (filter.category) {
        const categoryTools = this.toolsByCategory.get(filter.category) || [];
        tools = tools.filter((tool) => categoryTools.includes(tool));
      }

      // Filter by capability
      if (filter.capability) {
        tools = tools.filter((tool) =>
          this.hasCapability(tool, filter.capability!),
        );
      }

      // Filter by health status
      if (filter.healthy !== undefined) {
        tools = tools.filter(
          (tool) => this.healthCache.get(tool.name) === filter.healthy,
        );
      }
    }

    this.metrics.gauge("registry.tools.discovered", tools.length, {
      category: filter?.category || "all",
      healthy_only: filter?.healthy?.toString() || "all",
    });

    return tools;
  }

  /**
   * Route request to appropriate tool by endpoint with security validation
   * Provides unified access point for all tool execution
   */
  async routeRequest(endpoint: string, params: unknown): Promise<IToolResult> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      // Validate endpoint parameter
      if (!this.isValidEndpoint(endpoint)) {
        throw this.createError(
          ErrorType.VALIDATION,
          `Invalid endpoint format: ${endpoint}`,
          { endpoint },
        );
      }

      // Sanitize and validate parameters
      const sanitizedParams = this.sanitizeParams(params);

      this.logger.debug(`Routing request to: ${endpoint}`, {
        params: this.redactSensitiveParams(sanitizedParams),
      });

      const tool = this.toolsByEndpoint.get(endpoint);
      if (!tool) {
        throw this.createError(
          ErrorType.VALIDATION,
          `No tool registered for endpoint: ${endpoint}`,
          {
            endpoint,
            availableEndpoints: Array.from(this.toolsByEndpoint.keys()),
          },
        );
      }

      // Check tool health
      const isHealthy = this.healthCache.get(tool.name);
      if (isHealthy === false) {
        throw this.createError(
          ErrorType.EXECUTION,
          `Tool ${tool.name} is currently unhealthy`,
          { tool: tool.name, endpoint },
        );
      }

      // Validate parameters against tool schema
      const validationResult = await tool.validate(sanitizedParams);
      if (!validationResult.valid) {
        throw this.createError(
          ErrorType.VALIDATION,
          `Parameter validation failed: ${validationResult.errors?.join(", ")}`,
          { tool: tool.name, endpoint, errors: validationResult.errors },
        );
      }

      // Execute the tool with sanitized parameters
      const result = await tool.execute(sanitizedParams);

      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;

      this.metrics.timing("registry.request.duration", responseTime, {
        tool: tool.name,
        endpoint,
        success: result.success.toString(),
      });

      this.logger.debug(`Request completed: ${endpoint}`, {
        success: result.success,
        duration: responseTime,
      });

      return result;
    } catch (error) {
      this.errorCount++;
      const responseTime = Date.now() - startTime;

      this.metrics.increment("registry.request.error", {
        endpoint,
        error_type: error instanceof Error ? error.constructor.name : "unknown",
      });

      this.logger.error(`Request failed: ${endpoint}`, {
        error: error instanceof Error ? error.message : String(error),
        duration: responseTime,
      });

      if (error instanceof Error && "type" in error) {
        throw error; // Re-throw structured errors
      }

      throw this.createError(
        ErrorType.EXECUTION,
        `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
        { endpoint, originalError: error },
      );
    }
  }

  /**
   * Get comprehensive registry health status
   */
  async getHealth(): Promise<IRegistryHealth> {
    // Update health cache if stale
    const now = Date.now();
    if (now - this.lastHealthCheck > 30000) {
      // 30 seconds
      await this.updateHealthStatus();
    }

    const totalTools = this.tools.size;
    const healthyTools = Array.from(this.healthCache.values()).filter(
      (healthy) => healthy,
    ).length;

    const averageResponseTime =
      this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;

    return {
      totalTools,
      healthyTools,
      lastHealthCheck: this.lastHealthCheck,
      averageResponseTime,
    };
  }

  /**
   * Unregister a tool
   */
  async unregisterTool(name: string): Promise<void> {
    this.logger.info(`Unregistering tool: ${name}`);

    const tool = this.tools.get(name);
    if (!tool) {
      throw this.createError(ErrorType.VALIDATION, `Tool not found: ${name}`, {
        name,
      });
    }

    // Remove from all registries
    this.tools.delete(name);
    this.toolsByEndpoint.delete(tool.endpoint);
    this.healthCache.delete(name);

    // Remove from category registry
    const category = this.extractCategory(tool);
    if (category) {
      const categoryTools = this.toolsByCategory.get(category);
      if (categoryTools) {
        const index = categoryTools.indexOf(tool);
        if (index > -1) {
          categoryTools.splice(index, 1);
        }
        if (categoryTools.length === 0) {
          this.toolsByCategory.delete(category);
        }
      }
    }

    this.metrics.increment("registry.tool.unregistered", {
      tool: name,
      category: category || "unknown",
    });

    this.logger.info(`Successfully unregistered tool: ${name}`);
  }

  /**
   * Get tool by name
   */
  getTool(name: string): IBrowserTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get tool by endpoint
   */
  getToolByEndpoint(endpoint: string): IBrowserTool | undefined {
    return this.toolsByEndpoint.get(endpoint);
  }

  /**
   * List all registered tools
   */
  listTools(): IBrowserTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): IBrowserTool[] {
    return this.toolsByCategory.get(category) || [];
  }

  /**
   * Get registry statistics
   */
  getStatistics() {
    return {
      totalTools: this.tools.size,
      totalEndpoints: this.toolsByEndpoint.size,
      categories: this.toolsByCategory.size,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate:
        this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      averageResponseTime:
        this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Validate endpoint format and security
   */
  private isValidEndpoint(endpoint: string): boolean {
    if (typeof endpoint !== "string") return false;

    // Basic format validation
    if (!endpoint.startsWith("/")) return false;
    if (endpoint.length > 1000) return false; // Prevent DoS

    // Security: reject dangerous patterns
    const dangerousPatterns = [
      /\.\./, // Path traversal
      /\/\//, // Double slashes
      /<script/i, // Script injection
      /javascript:/i, // JavaScript protocol
      /[\x00-\x1f]/, // Control characters
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(endpoint));
  }

  /**
   * Sanitize parameters to prevent injection attacks
   */
  private sanitizeParams(params: unknown): unknown {
    if (params === null || params === undefined) {
      return {};
    }

    if (typeof params === "string") {
      return this.sanitizeString(params);
    }

    if (typeof params === "number" || typeof params === "boolean") {
      return params;
    }

    if (Array.isArray(params)) {
      return params.map((item) => this.sanitizeParams(item));
    }

    if (typeof params === "object") {
      const sanitized: any = {};
      const dangerousKeys = ["__proto__", "constructor", "prototype"];

      for (const [key, value] of Object.entries(params)) {
        if (dangerousKeys.includes(key)) {
          continue; // Skip dangerous keys
        }

        const sanitizedKey = this.sanitizeString(key);
        if (sanitizedKey) {
          sanitized[sanitizedKey] = this.sanitizeParams(value);
        }
      }
      return sanitized;
    }

    return String(params);
  }

  /**
   * Sanitize string values
   */
  private sanitizeString(input: string): string {
    if (typeof input !== "string") {
      return String(input);
    }

    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // Remove dangerous patterns
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=/gi, "");
    sanitized = sanitized.replace(
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      "",
    );

    // Limit length
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000);
    }

    return sanitized;
  }

  /**
   * Redact sensitive parameters from logs
   */
  private redactSensitiveParams(params: any): any {
    if (!params || typeof params !== "object") {
      return params;
    }

    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "credential",
    ];
    const redacted = { ...params };

    for (const key of Object.keys(redacted)) {
      if (
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
      ) {
        redacted[key] = "[REDACTED]";
      }
    }

    return redacted;
  }

  /**
   * Validate tool interface compliance
   */
  private validateTool(tool: IBrowserTool): void {
    const required = [
      "name",
      "endpoint",
      "description",
      "schema",
      "capabilities",
      "execute",
      "validate",
      "getStatus",
    ];

    for (const prop of required) {
      if (!(prop in tool)) {
        throw this.createError(
          ErrorType.VALIDATION,
          `Tool missing required property: ${prop}`,
          { tool: tool.name || "unknown", missing: prop },
        );
      }
    }

    if (typeof tool.execute !== "function") {
      throw this.createError(
        ErrorType.VALIDATION,
        "Tool execute method must be a function",
        { tool: tool.name },
      );
    }

    if (typeof tool.validate !== "function") {
      throw this.createError(
        ErrorType.VALIDATION,
        "Tool validate method must be a function",
        { tool: tool.name },
      );
    }

    if (typeof tool.getStatus !== "function") {
      throw this.createError(
        ErrorType.VALIDATION,
        "Tool getStatus method must be a function",
        { tool: tool.name },
      );
    }
  }

  /**
   * Extract category from tool name or metadata
   */
  private extractCategory(tool: IBrowserTool): string | null {
    // Extract category from tool name (e.g., "browser_evaluate" -> "browser")
    const nameParts = tool.name.split("_");
    if (nameParts.length > 1) {
      return nameParts[0];
    }

    // Extract from endpoint (e.g., "/tools/browser_evaluate" -> "browser")
    const endpointParts = tool.endpoint.split("/");
    if (endpointParts.length > 2) {
      const toolPart = endpointParts[endpointParts.length - 1];
      const toolParts = toolPart.split("_");
      if (toolParts.length > 1) {
        return toolParts[0];
      }
    }

    return null;
  }

  /**
   * Check if tool has specific capability
   */
  private hasCapability(tool: IBrowserTool, capability: string): boolean {
    const capabilities = tool.capabilities as any;
    return capability in capabilities && capabilities[capability] === true;
  }

  /**
   * Update health status for all tools
   */
  private async updateHealthStatus(): Promise<void> {
    this.logger.debug("Updating tool health status");

    const healthPromises = Array.from(this.tools.entries()).map(
      async ([name, tool]) => {
        try {
          const status = await tool.getStatus();
          this.healthCache.set(name, status.healthy);
          return { name, healthy: status.healthy };
        } catch (error) {
          this.logger.warn(`Health check failed for tool: ${name}`, error);
          this.healthCache.set(name, false);
          return { name, healthy: false };
        }
      },
    );

    await Promise.all(healthPromises);
    this.lastHealthCheck = Date.now();

    const healthyCount = Array.from(this.healthCache.values()).filter(
      (healthy) => healthy,
    ).length;

    this.metrics.gauge("registry.tools.healthy", healthyCount);
    this.metrics.gauge("registry.tools.total", this.tools.size);
  }

  /**
   * Start background health monitoring
   */
  private startHealthMonitoring(): void {
    // Check health every 60 seconds
    setInterval(async () => {
      try {
        await this.updateHealthStatus();
      } catch (error) {
        this.logger.error("Health monitoring failed", error);
      }
    }, 60000);
  }

  /**
   * Create structured error
   */
  private createError(
    type: ErrorType,
    message: string,
    details?: any,
  ): Error & { type: ErrorType } {
    const error = new Error(message) as Error & { type: ErrorType };
    error.type = type;
    (error as any).details = details;
    (error as any).timestamp = Date.now();
    return error;
  }
}

/**
 * Singleton registry instance
 * Other agents can import and use this directly
 */
let registryInstance: ToolRegistry | null = null;

/**
 * Get or create the global registry instance
 */
export function getRegistry(
  logger?: ILogger,
  metrics?: IMetrics,
): ToolRegistry {
  if (!registryInstance) {
    if (!logger || !metrics) {
      throw new Error(
        "Logger and metrics required for first registry initialization",
      );
    }
    registryInstance = new ToolRegistry(logger, metrics);
  }
  return registryInstance;
}

/**
 * Helper function for tools to auto-register themselves
 * Usage: registerTool(MyToolImplementation)
 */
export async function registerTool(tool: IBrowserTool): Promise<void> {
  const registry = getRegistry();
  await registry.registerTool(tool);
}

/**
 * Helper function to discover tools by category
 * Usage: const browserTools = discoverToolsByCategory('browser')
 */
export function discoverToolsByCategory(category: string): IBrowserTool[] {
  const registry = getRegistry();
  return registry.getToolsByCategory(category);
}

/**
 * Helper function to route requests
 * Usage: const result = await routeRequest('/tools/browser_evaluate', { script: 'console.log("test")' })
 */
export async function routeRequest(
  endpoint: string,
  params: unknown,
): Promise<IToolResult> {
  const registry = getRegistry();
  return registry.routeRequest(endpoint, params);
}
