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

export * from './interfaces.mjs';

// ============================================================================
// CORE SYSTEM EXPORTS
// ============================================================================

export {
  ToolRegistry,
  getRegistry,
  registerTool,
  discoverToolsByCategory,
  routeRequest
} from './registry.mjs';

export {
  BaseBrowserTool,
  BaseUIPanel,
  BaseErrorHandler
} from './base-classes.mjs';

export {
  HttpBridge,
  StaticHandler,
  ProxyHandler,
  jsonResponse,
  errorResponse
} from './service-worker.mjs';

export {
  MCPHandler,
  validateMCPRequest,
  createParseError,
  createInvalidRequestError
} from './mcp-handler.mjs';

export {
  ConsoleLogger,
  InMemoryMetrics,
  SystemMonitor,
  createMonitoringInfrastructure,
  createErrorContext
} from './monitoring.mjs';

// ============================================================================
// FOUNDATION BUILDER
// ============================================================================

import { ILogger, IMetrics, IMonitor, LogLevel } from './interfaces.mjs';
import { ToolRegistry } from './registry.mjs';
import { HttpBridge } from './service-worker.mjs';
import { MCPHandler } from './mcp-handler.mjs';
import { createMonitoringInfrastructure } from './monitoring.mjs';

/**
 * Foundation configuration options
 */
/**
 * @typedef {Object} FoundationConfig
 * @property {LogLevel} [logLevel] - Log level
 * @property {string} [serverName] - Server name
 * @property {string} [serverVersion] - Server version
 * @property {number} [httpPort] - HTTP port
 * @property {boolean} [enableMetrics] - Enable metrics
 * @property {boolean} [enableMonitoring] - Enable monitoring
 */

/**
 * Complete foundation infrastructure instance
 */
/**
 * @typedef {Object} FoundationInfrastructure
 * @property {ToolRegistry} registry - Tool registry
 * @property {Object} httpBridge - HTTP bridge
 * @property {Object} mcpHandler - MCP handler
 * @property {Object} logger - Logger instance
 * @property {Object} metrics - Metrics collector
 * @property {Object} monitor - Monitor instance
 */

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
  config = {
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
  static create() {
    return new FoundationBuilder();
  }

  /**
   * Configure logging
   */
  withLogging(level) {
    this.config.logLevel = level;
    return this;
  }

  /**
   * Configure HTTP server
   */
  withHttp(port) {
    this.config.httpPort = port;
    return this;
  }

  /**
   * Configure server identity
   */
  withServer(name, version) {
    this.config.serverName = name;
    this.config.serverVersion = version;
    return this;
  }

  /**
   * Enable/disable metrics collection
   */
  withMetrics(enabled) {
    this.config.enableMetrics = enabled;
    return this;
  }

  /**
   * Enable/disable monitoring
   */
  withMonitoring(enabled) {
    this.config.enableMonitoring = enabled;
    return this;
  }

  /**
   * Build the foundation infrastructure
   */
  build() {
    const { logger, metrics, monitor } = createMonitoringInfrastructure(
      this.config.logLevel,
      this.config.serverName
    );

    const registry = new ToolRegistry(logger, metrics);
    const httpBridge = new HttpBridge(logger, metrics);
    const mcpHandler = new MCPHandler(registry, logger, metrics);

    const infrastructure = {
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
  started = false;

  constructor(infrastructure, config) {
    this.infrastructure = infrastructure;
    this.config = config;
  }

  /**
   * Start the foundation infrastructure
   */
  async start() {
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
  async stop() {
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
  getInfrastructure() {
    return this.infrastructure;
  }

  /**
   * Check if foundation is running
   */
  isStarted() {
    return this.started;
  }

  /**
   * Get foundation health status
   */
  async getHealth() {
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
  setupMCPRoutes() {
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
export async function startFoundation(config) {
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
export const DEFAULT_CONFIG = {
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
export function isBrowserTool(obj) {
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
export function isUIPanel(obj) {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.selector === 'string' &&
    typeof obj.initialize === 'function' &&
    typeof obj.render === 'function';
}