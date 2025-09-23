/**
 * 🦁 MANE Foundation Interfaces
 * Core interface contracts for browser-tools project
 *
 * These interfaces enable autonomous AI agent development by providing
 * clear contracts that eliminate coordination overhead.
 *
 * Built by: Foundation Architect (Agent A)
 * For: MANE (Modular Agentic Non-linear Engineering)
 *
 * **CONVERTED TO .mjs**: Native Node.js ES modules for immediate compatibility
 */

// ============================================================================
// CORE TOOL INTERFACES
// ============================================================================

/**
 * Base result type for all tool operations
 * @typedef {Object} IToolResult
 * @property {boolean} success - Operation success status
 * @property {any} [data] - Operation result data
 * @property {string} [error] - Error message if failed
 * @property {Record<string, any>} [metadata] - Additional metadata
 * @property {number} timestamp - Operation timestamp
 */

/**
 * Validation result for input parameters
 * @typedef {Object} IValidationResult
 * @property {boolean} valid - Validation success status
 * @property {string[]} [errors] - Validation error messages
 * @property {string[]} [warnings] - Validation warnings
 */

/**
 * Tool capabilities metadata
 * @typedef {Object} IToolCapabilities
 * @property {boolean} async - Supports async execution
 * @property {number} timeout - Maximum execution timeout
 * @property {boolean} retryable - Can be retried on failure
 * @property {boolean} batchable - Supports batch operations
 * @property {boolean} requiresAuth - Requires authentication
 */

/**
 * Core browser tool interface - implemented by all tools
 * @typedef {Object} IBrowserTool
 * @property {string} name - Tool identifier
 * @property {string} endpoint - API endpoint
 * @property {string} description - Tool description
 * @property {JSONSchema} schema - Parameter schema
 * @property {IToolCapabilities} capabilities - Tool capabilities
 * @property {function(unknown): Promise<IToolResult>} execute - Execute the tool
 * @property {function(unknown): IValidationResult} validate - Validate parameters
 * @property {function(): Promise<IToolStatus>} getStatus - Get tool status
 */

/**
 * Tool health and status information
 * @typedef {Object} IToolStatus
 * @property {boolean} healthy - Health status
 * @property {number} [lastUsed] - Last execution timestamp
 * @property {number} executionCount - Total executions
 * @property {number} averageExecutionTime - Average execution time
 * @property {number} errorRate - Error rate percentage
 */

/**
 * JSON Schema type definition
 * @typedef {Object} JSONSchema
 * @property {string} type - Schema type
 * @property {Record<string, any>} [properties] - Object properties
 * @property {string[]} [required] - Required properties
 * @property {boolean} [additionalProperties] - Allow additional properties
 */

// ============================================================================
// MCP INTEGRATION INTERFACES
// ============================================================================

/**
 * MCP Server capabilities
 * @typedef {Object} IMCPCapabilities
 * @property {Record<string, any>} tools - Available tools
 * @property {Record<string, any>} resources - Available resources
 * @property {Record<string, any>} [prompts] - Available prompts
 * @property {Record<string, any>} [logging] - Logging capabilities
 */

/**
 * MCP Server information
 * @typedef {Object} IMCPServerInfo
 * @property {string} name - Server name
 * @property {string} version - Server version
 * @property {string} protocolVersion - MCP protocol version
 * @property {IMCPCapabilities} capabilities - Server capabilities
 */

/**
 * MCP Protocol handler interface
 * @typedef {Object} IMCPHandler
 * @property {function(any): Promise<IMCPServerInfo>} initialize - Handle MCP initialization
 * @property {function(): Promise<IBrowserTool[]>} listTools - List available tools
 * @property {function(string, any): Promise<IToolResult>} executeTool - Execute a tool
 * @property {function(): Promise<void>} shutdown - Handle shutdown
 */

// ============================================================================
// REGISTRY INTERFACES
// ============================================================================

/**
 * Tool filter for discovery queries
 * @typedef {Object} IToolFilter
 * @property {string} [category] - Tool category filter
 * @property {string} [capability] - Capability filter
 * @property {boolean} [healthy] - Health status filter
 */

/**
 * Auto-discovery registry interface
 * @typedef {Object} IToolRegistry
 * @property {function(IBrowserTool): Promise<void>} registerTool - Register a tool
 * @property {function(IToolFilter): IBrowserTool[]} discoverTools - Discover tools
 * @property {function(string, unknown): Promise<IToolResult>} routeRequest - Route requests
 * @property {function(): Promise<IRegistryHealth>} getHealth - Get registry health
 * @property {function(string): Promise<void>} unregisterTool - Unregister tool
 */

/**
 * Registry health information
 * @typedef {Object} IRegistryHealth
 * @property {number} totalTools - Total registered tools
 * @property {number} healthyTools - Healthy tools count
 * @property {number} lastHealthCheck - Last health check timestamp
 * @property {number} averageResponseTime - Average response time
 */

// ============================================================================
// HTTP BRIDGE INTERFACES
// ============================================================================

/**
 * HTTP request context
 * @typedef {Object} IHttpRequest
 * @property {string} method - HTTP method
 * @property {string} path - Request path
 * @property {Record<string, string>} headers - Request headers
 * @property {any} [body] - Request body
 * @property {Record<string, string>} [query] - Query parameters
 */

/**
 * HTTP response context
 * @typedef {Object} IHttpResponse
 * @property {number} statusCode - HTTP status code
 * @property {Record<string, string>} headers - Response headers
 * @property {any} body - Response body
 * @property {string} contentType - Content type
 */

/**
 * HTTP Bridge interface for MCP communication
 * @typedef {Object} IHttpBridge
 * @property {function(number): Promise<void>} start - Start HTTP server
 * @property {function(): Promise<void>} stop - Stop HTTP server
 * @property {function(string, IRouteHandler): void} registerRoute - Register route
 * @property {function(): IBridgeStatus} getStatus - Get server status
 */

/**
 * Route handler interface
 * @typedef {Object} IRouteHandler
 * @property {function(IHttpRequest): Promise<IHttpResponse>} handle - Handle request
 */

/**
 * Bridge status information
 * @typedef {Object} IBridgeStatus
 * @property {boolean} running - Server running status
 * @property {number} port - Server port
 * @property {number} uptime - Server uptime
 * @property {number} requestCount - Total requests
 * @property {number} errorCount - Total errors
 */

// ============================================================================
// CHROME EXTENSION INTERFACES
// ============================================================================

/**
 * DevTools Protocol interface
 * @typedef {Object} IDevToolsProtocol
 * @property {function(number): Promise<void>} attach - Attach to tab
 * @property {function(): Promise<void>} detach - Detach from session
 * @property {function(string): Promise<any>} evaluate - Execute script
 * @property {function(): Promise<string>} getContent - Get page content
 * @property {function(IScreenshotOptions): Promise<string>} screenshot - Capture screenshot
 */

/**
 * Screenshot capture options
 * @typedef {Object} IScreenshotOptions
 * @property {'png'|'jpeg'} [format] - Image format
 * @property {number} [quality] - Image quality
 * @property {boolean} [fullPage] - Full page capture
 * @property {string} [selector] - Element selector
 * @property {IClipRegion} [clip] - Clipping region
 */

/**
 * Screenshot clipping region
 * @typedef {Object} IClipRegion
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} width - Width
 * @property {number} height - Height
 */

// ============================================================================
// UI PANEL INTERFACES
// ============================================================================

/**
 * UI Panel base interface
 * @typedef {Object} IUIPanel
 * @property {string} id - Panel identifier
 * @property {string} selector - CSS selector
 * @property {string} title - Panel title
 * @property {function(): Promise<void>} initialize - Initialize panel
 * @property {function(): Promise<HTMLElement>} render - Render panel
 * @property {function(): void} handleEvents - Handle events
 * @property {function(any): Promise<void>} updateState - Update state
 * @property {function(): Promise<void>} destroy - Cleanup resources
 */

/**
 * Panel event handler
 * @typedef {Object} IPanelEventHandler
 * @property {string} event - Event name
 * @property {string} selector - Element selector
 * @property {function(Event): void|Promise<void>} handler - Event handler
 */

// ============================================================================
// ERROR HANDLING INTERFACES
// ============================================================================

/**
 * Standardized error types
 * @typedef {'VALIDATION'|'EXECUTION'|'TIMEOUT'|'CONNECTION'|'AUTHENTICATION'|'RATE_LIMIT'|'INTERNAL'} ErrorType
 */
export const ErrorType = {
  VALIDATION: 'VALIDATION',
  EXECUTION: 'EXECUTION',
  TIMEOUT: 'TIMEOUT',
  CONNECTION: 'CONNECTION',
  AUTHENTICATION: 'AUTHENTICATION',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL: 'INTERNAL'
};

/**
 * Error context information
 * @typedef {Object} IErrorContext
 * @property {ErrorType} type - Error type
 * @property {string} message - Error message
 * @property {string} [code] - Error code
 * @property {Record<string, any>} [details] - Error details
 * @property {string} [stack] - Stack trace
 * @property {number} timestamp - Error timestamp
 * @property {boolean} recoverable - Is recoverable
 */

/**
 * Error handler interface
 * @typedef {Object} IErrorHandler
 * @property {function(IErrorContext): Promise<IToolResult>} handle - Handle error
 * @property {function(IErrorContext): boolean} isRecoverable - Check if recoverable
 * @property {function(IErrorContext, number): number} getRetryDelay - Get retry delay
 */

// ============================================================================
// LOGGING AND MONITORING INTERFACES
// ============================================================================

/**
 * Log levels
 * @typedef {'debug'|'info'|'warn'|'error'} LogLevel
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Logger interface
 * @typedef {Object} ILogger
 * @property {function(string, any): void} debug - Debug log
 * @property {function(string, any): void} info - Info log
 * @property {function(string, any): void} warn - Warning log
 * @property {function(string, any): void} error - Error log
 */

/**
 * Metrics collection interface
 * @typedef {Object} IMetrics
 * @property {function(string, Record<string, string>): void} increment - Increment counter
 * @property {function(string, number, Record<string, string>): void} gauge - Set gauge value
 * @property {function(string, number, Record<string, string>): void} timing - Record timing
 * @property {function(string, number, Record<string, string>): void} histogram - Record histogram
 */

/**
 * Monitoring interface
 * @typedef {Object} IMonitor
 * @property {function(string): IRequestTracker} startRequest - Start request tracking
 * @property {function(IErrorContext): void} recordError - Record error
 * @property {function(): Promise<ISystemMetrics>} getMetrics - Get system metrics
 */

/**
 * Request tracking
 * @typedef {Object} IRequestTracker
 * @property {function(IToolResult): void} finish - Finish tracking
 * @property {function(string, string): void} addTag - Add tag
 * @property {function(IErrorContext): void} recordError - Record error
 */

/**
 * System metrics
 * @typedef {Object} ISystemMetrics
 * @property {number} uptime - System uptime
 * @property {number} requestCount - Total requests
 * @property {number} errorCount - Total errors
 * @property {number} averageResponseTime - Average response time
 * @property {Record<string, IToolMetrics>} toolMetrics - Per-tool metrics
 */

/**
 * Per-tool metrics
 * @typedef {Object} IToolMetrics
 * @property {string} name - Tool name
 * @property {number} executionCount - Execution count
 * @property {number} errorCount - Error count
 * @property {number} averageExecutionTime - Average execution time
 * @property {number} lastExecuted - Last execution timestamp
 */

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

/**
 * Tool configuration
 * @typedef {Object} IToolConfig
 * @property {boolean} enabled - Tool enabled status
 * @property {number} timeout - Execution timeout
 * @property {number} retries - Retry attempts
 * @property {number} [rateLimit] - Rate limit
 * @property {Record<string, any>} [options] - Additional options
 */

/**
 * System configuration
 * @typedef {Object} ISystemConfig
 * @property {boolean} debug - Debug mode
 * @property {LogLevel} logLevel - Log level
 * @property {number} port - Server port
 * @property {Record<string, IToolConfig>} tools - Tool configurations
 * @property {IMonitoringConfig} monitoring - Monitoring configuration
 */

/**
 * Monitoring configuration
 * @typedef {Object} IMonitoringConfig
 * @property {boolean} enabled - Monitoring enabled
 * @property {number} metricsInterval - Metrics collection interval
 * @property {number} healthCheckInterval - Health check interval
 * @property {number} retentionPeriod - Data retention period
 */

// ============================================================================
// ASYNC OPERATION INTERFACES
// ============================================================================

/**
 * Async operation context
 * @typedef {Object} IAsyncOperation
 * @property {string} id - Operation identifier
 * @property {'pending'|'running'|'completed'|'failed'|'cancelled'} status - Operation status
 * @property {number} [progress] - Operation progress
 * @property {any} [result] - Operation result
 * @property {IErrorContext} [error] - Operation error
 * @property {number} startTime - Start timestamp
 * @property {number} [endTime] - End timestamp
 */

/**
 * Async operation manager
 * @typedef {Object} IAsyncManager
 * @property {function(function(): Promise<any>): Promise<IAsyncOperation>} start - Start operation
 * @property {function(string): Promise<boolean>} cancel - Cancel operation
 * @property {function(string): Promise<IAsyncOperation|null>} getStatus - Get operation status
 * @property {function(): Promise<IAsyncOperation[]>} listOperations - List all operations
 */

// ============================================================================
// QUALITY GATE INTERFACES (Added for .mjs conversion completeness)
// ============================================================================

/**
 * Quality gate validation result
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Validation passed
 * @property {number} score - Validation score (0-100)
 * @property {string[]} errors - Validation errors
 * @property {any} [details] - Additional details
 */

/**
 * Quality gate interface
 * @typedef {Object} IQualityGate
 * @property {string} name - Gate identifier
 * @property {string} description - Gate description
 * @property {function(unknown): Promise<ValidationResult>} execute - Execute validation
 */

// Export all interface types for JSDoc usage
export {
  // These exports enable import of constants in other modules
  // All typedef interfaces are available via JSDoc comments
};