/**
 * 🦁 MANE Foundation Core
 * Main entry point for the foundation infrastructure
 *
 * This module exports all the core interfaces, classes, and utilities
 * that other MANE agents need to build browser tools.
 *
 * Built by: Foundation Architect (Agent A)
 * For: MANE (Modular Agentic Non-linear Engineering)
 */

// ============================================================================
// INTERFACE EXPORTS
// ============================================================================

export * from './interfaces.js';

// ============================================================================
// CORE SYSTEM EXPORTS
// ============================================================================

export {
  ToolRegistry,
  getRegistry,
  registerTool,
  discoverToolsByCategory,
  routeRequest
} from './registry.js';

export {
  BaseBrowserTool,
  BaseUIPanel,
  BaseErrorHandler
} from './base-classes.js';

export {
  HttpBridge,
  StaticHandler,
  ProxyHandler,
  jsonResponse,
  errorResponse
} from './service-worker.js';

export {
  MCPHandler,
  validateMCPRequest,
  createParseError,
  createInvalidRequestError
} from './mcp-handler.js';

export {
  ConsoleLogger,
  InMemoryMetrics,
  SystemMonitor,
  createMonitoringInfrastructure,
  createErrorContext
} from './monitoring.js';

// ============================================================================
// FOUNDATION BUILDER
// ============================================================================

import { ILogger, IMetrics, IMonitor, LogLevel } from './interfaces.js';
import { ToolRegistry } from './registry.js';
import { HttpBridge } from './service-worker.js';
import { MCPHandler } from './mcp-handler.js';
import { createMonitoringInfrastructure } from './monitoring.js';

/**
 * Foundation configuration options
 */
export interface FoundationConfig {
  logLevel?: LogLevel;
  serverName?: string;
  serverVersion?: string;
  httpPort?: number;
  enableMetrics?: boolean;
  enableMonitoring?: boolean;
}

/**
 * Complete foundation infrastructure instance
 */
export interface FoundationInfrastructure {
  registry: ToolRegistry;
  httpBridge: HttpBridge;
  mcpHandler: MCPHandler;
  logger: ILogger;
  metrics: IMetrics;
  monitor: IMonitor;
}

/**
 * Foundation Builder class
 *
 * Provides a simple API to build and configure the complete
 * MANE foundation infrastructure with sensible defaults.
 *
 * Usage:
 * ```typescript
 * const foundation = await FoundationBuilder
 *   .create()
 *   .withLogging(LogLevel.DEBUG)
 *   .withHttp(3024)
 *   .build();
 *
 * await foundation.start();
 * ```
 */
export class FoundationBuilder {
  private config: FoundationConfig = {
    logLevel: LogLevel.INFO,
    serverName: 'MANE Browser Tools',
    serverVersion: '2.0.0',
    httpPort: 3024,
    enableMetrics: true,
    enableMonitoring: true
  };

  /**
   * Create a new foundation builder
   */
  static create(): FoundationBuilder {
    return new FoundationBuilder();
  }

  /**
   * Configure logging
   */
  withLogging(level: LogLevel): FoundationBuilder {
    this.config.logLevel = level;
    return this;
  }

  /**
   * Configure HTTP server
   */
  withHttp(port: number): FoundationBuilder {
    this.config.httpPort = port;
    return this;
  }

  /**
   * Configure server identity
   */
  withServer(name: string, version: string): FoundationBuilder {
    this.config.serverName = name;
    this.config.serverVersion = version;
    return this;
  }

  /**
   * Enable/disable metrics collection
   */
  withMetrics(enabled: boolean): FoundationBuilder {
    this.config.enableMetrics = enabled;
    return this;
  }

  /**
   * Enable/disable monitoring
   */
  withMonitoring(enabled: boolean): FoundationBuilder {
    this.config.enableMonitoring = enabled;
    return this;
  }

  /**
   * Build the foundation infrastructure
   */
  build(): MANEFoundation {
    const { logger, metrics, monitor } = createMonitoringInfrastructure(
      this.config.logLevel,
      this.config.serverName
    );

    const registry = new ToolRegistry(logger, metrics);
    const httpBridge = new HttpBridge(logger, metrics);
    const mcpHandler = new MCPHandler(registry, logger, metrics);

    const infrastructure: FoundationInfrastructure = {
      registry,
      httpBridge,
      mcpHandler,
      logger,
      metrics,
      monitor
    };

    return new MANEFoundation(infrastructure, this.config);
  }
}

/**
 * Complete MANE Foundation system
 *
 * Provides high-level management of the foundation infrastructure
 * with lifecycle management and health monitoring.
 */
export class MANEFoundation {
  private started = false;

  constructor(
    private infrastructure: FoundationInfrastructure,
    private config: FoundationConfig
  ) {}

  /**
   * Start the foundation infrastructure
   */
  async start(): Promise<void> {
    if (this.started) {
      throw new Error('Foundation is already started');
    }

    this.infrastructure.logger.info('Starting MANE Foundation', {
      serverName: this.config.serverName,
      serverVersion: this.config.serverVersion,
      httpPort: this.config.httpPort
    });

    try {
      // Start HTTP bridge
      if (this.config.httpPort) {
        await this.infrastructure.httpBridge.start(this.config.httpPort);
      }

      // Setup MCP handler routes
      this.setupMCPRoutes();

      this.started = true;

      this.infrastructure.logger.info('MANE Foundation started successfully');
      this.infrastructure.metrics.increment('foundation.started');

    } catch (error) {
      this.infrastructure.logger.error('Failed to start MANE Foundation', error);
      throw error;
    }
  }

  /**
   * Stop the foundation infrastructure
   */
  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    this.infrastructure.logger.info('Stopping MANE Foundation');

    try {
      // Shutdown MCP handler
      await this.infrastructure.mcpHandler.shutdown();

      // Stop HTTP bridge
      await this.infrastructure.httpBridge.stop();

      this.started = false;

      this.infrastructure.logger.info('MANE Foundation stopped successfully');
      this.infrastructure.metrics.increment('foundation.stopped');

    } catch (error) {
      this.infrastructure.logger.error('Error stopping MANE Foundation', error);
      throw error;
    }
  }

  /**
   * Get foundation infrastructure components
   */
  getInfrastructure(): FoundationInfrastructure {
    return this.infrastructure;
  }

  /**
   * Check if foundation is running
   */
  isStarted(): boolean {
    return this.started;
  }

  /**
   * Get foundation health status
   */
  async getHealth(): Promise<{
    healthy: boolean;
    uptime: number;
    components: Record<string, boolean>;
    registry: any;
    httpBridge: any;
  }> {
    const registryHealth = await this.infrastructure.registry.getHealth();
    const bridgeStatus = this.infrastructure.httpBridge.getStatus();

    const components = {
      registry: registryHealth.healthyTools > 0,
      httpBridge: bridgeStatus.running,
      mcpHandler: this.infrastructure.mcpHandler.isInitialized()
    };

    const healthy = Object.values(components).every(status => status);

    return {
      healthy,
      uptime: bridgeStatus.uptime,
      components,
      registry: registryHealth,
      httpBridge: bridgeStatus
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Setup MCP handler routes on HTTP bridge
   */
  private setupMCPRoutes(): void {
    const { httpBridge, mcpHandler, logger } = this.infrastructure;

    // MCP tools route
    httpBridge.registerRoute('/tools', {
      async handle(request) {
        try {
          const tools = await mcpHandler.listTools();
          return {
            statusCode: 200,
            headers: {},
            contentType: 'application/json',
            body: { tools }
          };
        } catch (error) {
          logger.error('Failed to list tools', error);
          return {
            statusCode: 500,
            headers: {},
            contentType: 'application/json',
            body: {
              error: 'Failed to list tools',
              message: error instanceof Error ? error.message : String(error)
            }
          };
        }
      }
    });

    // MCP tool execution route
    httpBridge.registerRoute('/tools/execute', {
      async handle(request) {
        try {
          const { tool, params } = request.body;

          if (!tool) {
            return {
              statusCode: 400,
              headers: {},
              contentType: 'application/json',
              body: { error: 'Tool name is required' }
            };
          }

          const result = await mcpHandler.executeTool(tool, params);
          return {
            statusCode: 200,
            headers: {},
            contentType: 'application/json',
            body: result
          };
        } catch (error) {
          logger.error('Tool execution failed', error);
          return {
            statusCode: 500,
            headers: {},
            contentType: 'application/json',
            body: {
              error: 'Tool execution failed',
              message: error instanceof Error ? error.message : String(error)
            }
          };
        }
      }
    });

    logger.debug('MCP routes registered on HTTP bridge');
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Quick start function for simple use cases
 *
 * Usage:
 * ```typescript
 * const foundation = await startFoundation({
 *   httpPort: 3024,
 *   logLevel: LogLevel.DEBUG
 * });
 * ```
 */
export async function startFoundation(config?: FoundationConfig): Promise<MANEFoundation> {
  const builder = FoundationBuilder.create();

  if (config?.logLevel) {
    builder.withLogging(config.logLevel);
  }

  if (config?.httpPort) {
    builder.withHttp(config.httpPort);
  }

  if (config?.serverName && config?.serverVersion) {
    builder.withServer(config.serverName, config.serverVersion);
  }

  if (config?.enableMetrics !== undefined) {
    builder.withMetrics(config.enableMetrics);
  }

  if (config?.enableMonitoring !== undefined) {
    builder.withMonitoring(config.enableMonitoring);
  }

  const foundation = builder.build();
  await foundation.start();

  return foundation;
}

/**
 * Version information
 */
export const VERSION = {
  foundation: '2.0.0',
  mcp: '2025-06-18',
  mane: '1.0.0'
};

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Required<FoundationConfig> = {
  logLevel: LogLevel.INFO,
  serverName: 'MANE Browser Tools',
  serverVersion: '2.0.0',
  httpPort: 3024,
  enableMetrics: true,
  enableMonitoring: true
};

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Check if an object implements IBrowserTool
 */
export function isBrowserTool(obj: any): obj is import('./interfaces.js').IBrowserTool {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    typeof obj.endpoint === 'string' &&
    typeof obj.execute === 'function' &&
    typeof obj.validate === 'function' &&
    typeof obj.getStatus === 'function';
}

/**
 * Check if an object implements IUIPanel
 */
export function isUIPanel(obj: any): obj is import('./interfaces.js').IUIPanel {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.selector === 'string' &&
    typeof obj.initialize === 'function' &&
    typeof obj.render === 'function';
}