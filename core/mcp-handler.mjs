/**
 * 🦁 MANE MCP Protocol Handler
 * 2025-06-18 MCP specification compliant handler
 *
 * This handler implements the Model Context Protocol (MCP) specification
 * and integrates with the tool registry for automatic tool discovery.
 *
 * Built by: Foundation Architect (Agent A)
 * For: MANE (Modular Agentic Non-linear Engineering)
 */

import {
  ErrorType
} from './interfaces.mjs';

/**
 * MCP JSON-RPC message types
 */
/**
 * @typedef {Object}MCPRequest {
  jsonrpc: '2.0';
  id | number;
  method;
  params?;
}

/**
 * @typedef {Object}MCPResponse {
  jsonrpc: '2.0';
  id | number;
  result?;
  errorMCPError;
}

/**
 * @typedef {Object}MCPNotification {
  jsonrpc: '2.0';
  method;
  params?;
}

/**
 * @typedef {Object}MCPError {
  code;
  message;
  data?;
}

/**
 * MCP error codes per specification
 */
const MCPErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR_START: -32099,
  SERVER_ERROR_END: -32000
};

/**
 * MCP Protocol Handler implementation
 *
 * Features:
 * - 2025-06-18 MCP specification compliance
 * - Automatic tool discovery via registry
 * - Comprehensive error handling
 * - Metrics collection
 * - Protocol validation
 */
export class MCPHandler {
protocolVersion = '2025-06-18';
serverName = 'MANE Browser Tools MCP';
serverVersion = '2.0.0';
initialized = false;

  constructor(
  registry,
  logger,
  metrics  ) {}

  /**
   * Handle MCP initialization
   */
  async initialize(params) {
    this.logger.info('Initializing MCP server', {
      clientVersion: params?.protocolVersion,
      clientCapabilities: params?.capabilities
    });

    // Validate client protocol version
    const clientVersion = params?.protocolVersion;
    if (clientVersion && !this.isCompatibleProtocolVersion(clientVersion)) {
      this.logger.warn(`Protocol version mismatch: client ${clientVersion}, server ${this.protocolVersion}`);
    }

    // Build server capabilities
    const capabilities = {
      tools: {},
      resources: {},
      prompts: {},
      logging: {
        level: 'info'
      }
    };

    const serverInfo = {
      name: this.serverName,
      version: this.serverVersion,
      protocolVersion: this.protocolVersion,
      capabilities
    };

    this.initialized = true;

    this.metrics.increment('mcp.initialized', {
      client_version: clientVersion || 'unknown',
      server_version: this.protocolVersion
    });

    this.logger.info('MCP server initialized successfully', serverInfo);

    return serverInfo;
  }

  /**
   * List available tools from registry
   */
  async listTools() {
    this.logger.debug('Listing available tools');

    if (!this.initialized) {
      throw this.createMCPError(
        MCPErrorCode.SERVER_ERROR_START,
        'Server not initialized',
        'Call initialize() first'
      );
    }

    try {
      // Discover all healthy tools
      const tools = this.registry.discoverTools({ healthy: true });

      this.metrics.gauge('mcp.tools.available', tools.length);

      this.logger.debug(`Listed ${tools.length} available tools`, {
        tools: tools.map(t => ({ name: t.name, endpoint: t.endpoint }))
      });

      return tools;
    } catch (error) {
      this.logger.error('Failed to list tools', error);
      throw this.createMCPError(
        MCPErrorCode.INTERNAL_ERROR,
        'Failed to retrieve tools',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Execute a tool by name
   */
  async executeTool(name, args) {
    const startTime = Date.now();

    this.logger.debug(`Executing tool: ${name}`, { args });

    if (!this.initialized) {
      throw this.createMCPError(
        MCPErrorCode.SERVER_ERROR_START,
        'Server not initialized',
        'Call initialize() first'
      );
    }

    try {
      // Find tool in registry
      const tool = this.registry.getTool(name);
      if (!tool) {
        throw this.createMCPError(
          MCPErrorCode.METHOD_NOT_FOUND,
          `Tool not found: ${name}`,
          { availableTools: this.registry.listTools().map(t => t.name) }
        );
      }

      // Validate tool parameters
      const validation = tool.validate(args);
      if (!validation.valid) {
        throw this.createMCPError(
          MCPErrorCode.INVALID_PARAMS,
          `Parameter validation failed: ${validation.errors?.join(', ')}`,
          { validation, schema: tool.schema }
        );
      }

      // Execute tool via registry (for routing and monitoring)
      const result = await this.registry.routeRequest(tool.endpoint, args);

      const duration = Date.now() - startTime;

      this.metrics.timing('mcp.tool.execution', duration, {
        tool: name,
        success: result.success.toString()
      });

      this.logger.debug(`Tool execution completed: ${name}`, {
        success: result.success,
        duration
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;

      this.metrics.increment('mcp.tool.error', {
        tool: name,
        error_type: error instanceof Error ? error.constructor.name : 'unknown'
      });

      this.logger.error(`Tool execution failed: ${name}`, {
        error: error instanceof Error ? error.message : String(error),
        duration
      });

      // Re-throw MCP errors as-is
      if (this.isMCPError(error)) {
        throw error;
      }

      // Convert other errors to MCP format
      throw this.createMCPError(
        MCPErrorCode.INTERNAL_ERROR,
        `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
        { tool: name, originalError: error }
      );
    }
  }

  /**
   * Handle graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down MCP server');

    this.initialized = false;

    this.metrics.increment('mcp.shutdown');

    this.logger.info('MCP server shutdown completed');
  }

  /**
   * Process MCP JSON-RPC request
   */
  async processRequest(request) {
    this.logger.debug(`Processing MCP request: ${request.method}`, {
      id: request.id,
      params: request.params
    });

    try {
      let result;

      switch (request.method) {
        case 'initialize':
          result = await this.initialize(request.params);
          break;

        case 'initialized':
          // Client confirms initialization complete
          result = {};
          break;

        case 'tools/list':
          const tools = await this.listTools();
          result = {
            tools: tools.map(tool => ({
              name: tool.name,
              title: tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: tool.description,
              inputSchema: tool.schema,
              annotations: this.buildToolAnnotations(tool)
            }))
          };
          break;

        case 'tools/call':
          const { name: toolName, arguments: toolArgs } = request.params;
          const toolResult = await this.executeTool(toolName, toolArgs);

          // Format response per 2025-06-18 spec
          result = {
            content: this.formatToolResult(toolResult),
            isError: !toolResult.success
          };
          break;

        case 'shutdown':
          await this.shutdown();
          result = {};
          break;

        default:
          throw this.createMCPError(
            MCPErrorCode.METHOD_NOT_FOUND,
            `Method not found: ${request.method}`,
            { method: request.method }
          );
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };

    } catch (error) {
      this.logger.error(`MCP request failed: ${request.method}`, error);

      return {
        jsonrpc: '2.0',
        id: request.id,
        error: this.isMCPError(error)
          ? error          : this.createMCPError(
              MCPErrorCode.INTERNAL_ERROR,
              `Request processing failed: ${error instanceof Error ? error.message : String(error)}`,
              error
            )
      };
    }
  }

  /**
   * Send notification to client
   */
  createNotification(method, params) {
    return {
      jsonrpc: '2.0',
      method,
      params
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Check if protocol versions are compatible
   */
isCompatibleProtocolVersion(clientVersion) {
    // For now, accept any 2025 version
    return clientVersion.startsWith('2025');
  }

  /**
   * Format tool result for MCP response
   */
formatToolResult(result) {
    const content = [];

    if (result.success) {
      if (result.data && typeof result.data === 'object' && 'screenshot' in result.data) {
        // Screenshot result
        content.push({
          type: 'image',
          data: result.data.screenshot,
          mimeType: 'image/png'
        });
      } else if (result.data && typeof result.data === 'object' && ('html' in result.data || 'text' in result.data)) {
        // Content result
        content.push({
          type: 'text',
          text: result.data.html || result.data.text || JSON.stringify(result.data, null, 2)
        });
      } else {
        // Generic result
        content.push({
          type: 'text',
          text: JSON.stringify(result.data || result, null, 2)
        });
      }
    } else {
      // Error result
      content.push({
        type: 'text',
        text: result.error || 'Unknown error occurred'
      });
    }

    return content;
  }

  /**
   * Build tool annotations for MCP response
   */
buildToolAnnotations(tool) {
    const annotations = {};

    if (tool.capabilities.requiresAuth) {
      annotations.security = 'Requires authentication';
    }

    if (!tool.capabilities.retryable) {
      annotations.warning = 'This operation is not retryable';
    }

    if (tool.name === 'browser_evaluate') {
      annotations.warning = 'This tool executes arbitrary JavaScript. Use with caution.';
    }

    return Object.keys(annotations).length > 0 ? annotations : undefined;
  }

  /**
   * Create MCP-compliant error
   */
createMCPError(code, message, data) {
    return {
      code,
      message,
      data
    };
  }

  /**
   * Check if error is already MCP-formatted
   */
isMCPError(error) {
    return error && typeof error === 'object' && 'code' in error && 'message' in error;
  }

  /**
   * Get server information
   */
  getServerInfo() {
    return {
      name: this.serverName,
      version: this.serverVersion,
      protocolVersion: this.protocolVersion,
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {
          level: 'info'
        }
      }
    };
  }

  /**
   * Check if server is initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

/**
 * Helper functions for MCP message handling
 */

/**
 * Validate JSON-RPC 2.0 request
 */
export function validateMCPRequest(request) {
  return (
    request &&
    typeof request === 'object' &&
    request.jsonrpc === '2.0' &&
    typeof request.method === 'string' &&
    (typeof request.id === 'string' || typeof request.id === 'number' || request.id === null)
  );
}

/**
 * Create JSON-RPC parse error
 */
export function createParseError(id = null) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: MCPErrorCode.PARSE_ERROR,
      message: 'Parse error'
    }
  };
}

/**
 * Create JSON-RPC invalid request error
 */
export function createInvalidRequestError(id = null) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: MCPErrorCode.INVALID_REQUEST,
      message: 'Invalid Request'
    }
  };
}