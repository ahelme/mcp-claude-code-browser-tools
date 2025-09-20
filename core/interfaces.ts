/**
 * 🦁 MANE Foundation Interfaces
 * Core interface contracts for browser-tools project
 *
 * These interfaces enable autonomous AI agent development by providing
 * clear contracts that eliminate coordination overhead.
 *
 * Built by: Foundation Architect (Agent A)
 * For: MANE (Modular Agentic Non-linear Engineering)
 */

// ============================================================================
// CORE TOOL INTERFACES
// ============================================================================

/**
 * Base result type for all tool operations
 */
export interface IToolResult {
  readonly success: boolean;
  readonly data?: any;
  readonly error?: string;
  readonly metadata?: Record<string, any>;
  readonly timestamp: number;
}

/**
 * Validation result for input parameters
 */
export interface IValidationResult {
  readonly valid: boolean;
  readonly errors?: string[];
  readonly warnings?: string[];
}

/**
 * Tool capabilities metadata
 */
export interface IToolCapabilities {
  readonly async: boolean;
  readonly timeout: number;
  readonly retryable: boolean;
  readonly batchable: boolean;
  readonly requiresAuth: boolean;
}

/**
 * Core browser tool interface - implemented by all tools
 */
export interface IBrowserTool {
  readonly name: string;
  readonly endpoint: string;
  readonly description: string;
  readonly schema: JSONSchema;
  readonly capabilities: IToolCapabilities;

  /**
   * Execute the tool with given parameters
   */
  execute(params: unknown): Promise<IToolResult>;

  /**
   * Validate input parameters against schema
   */
  validate(params: unknown): IValidationResult;

  /**
   * Get tool metadata and health status
   */
  getStatus(): Promise<IToolStatus>;
}

/**
 * Tool health and status information
 */
export interface IToolStatus {
  readonly healthy: boolean;
  readonly lastUsed?: number;
  readonly executionCount: number;
  readonly averageExecutionTime: number;
  readonly errorRate: number;
}

/**
 * JSON Schema type definition
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: any;
}

// ============================================================================
// MCP INTEGRATION INTERFACES
// ============================================================================

/**
 * MCP Server capabilities
 */
export interface IMCPCapabilities {
  readonly tools: Record<string, any>;
  readonly resources: Record<string, any>;
  readonly prompts?: Record<string, any>;
  readonly logging?: Record<string, any>;
}

/**
 * MCP Server information
 */
export interface IMCPServerInfo {
  readonly name: string;
  readonly version: string;
  readonly protocolVersion: string;
  readonly capabilities: IMCPCapabilities;
}

/**
 * MCP Protocol handler interface
 */
export interface IMCPHandler {
  /**
   * Handle MCP initialization
   */
  initialize(params: any): Promise<IMCPServerInfo>;

  /**
   * List available tools
   */
  listTools(): Promise<IBrowserTool[]>;

  /**
   * Execute a tool by name
   */
  executeTool(name: string, args: any): Promise<IToolResult>;

  /**
   * Handle graceful shutdown
   */
  shutdown(): Promise<void>;
}

// ============================================================================
// REGISTRY INTERFACES
// ============================================================================

/**
 * Tool filter for discovery queries
 */
export interface IToolFilter {
  readonly category?: string;
  readonly capability?: string;
  readonly healthy?: boolean;
}

/**
 * Auto-discovery registry interface
 */
export interface IToolRegistry {
  /**
   * Register a tool implementation
   */
  registerTool(tool: IBrowserTool): Promise<void>;

  /**
   * Discover tools matching filter criteria
   */
  discoverTools(filter?: IToolFilter): IBrowserTool[];

  /**
   * Route request to appropriate tool
   */
  routeRequest(endpoint: string, params: unknown): Promise<IToolResult>;

  /**
   * Get registry health status
   */
  getHealth(): Promise<IRegistryHealth>;

  /**
   * Unregister a tool
   */
  unregisterTool(name: string): Promise<void>;
}

/**
 * Registry health information
 */
export interface IRegistryHealth {
  readonly totalTools: number;
  readonly healthyTools: number;
  readonly lastHealthCheck: number;
  readonly averageResponseTime: number;
}

// ============================================================================
// HTTP BRIDGE INTERFACES
// ============================================================================

/**
 * HTTP request context
 */
export interface IHttpRequest {
  readonly method: string;
  readonly path: string;
  readonly headers: Record<string, string>;
  readonly body?: any;
  readonly query?: Record<string, string>;
}

/**
 * HTTP response context
 */
export interface IHttpResponse {
  readonly statusCode: number;
  readonly headers: Record<string, string>;
  readonly body: any;
  readonly contentType: string;
}

/**
 * HTTP Bridge interface for MCP communication
 */
export interface IHttpBridge {
  /**
   * Start the HTTP server
   */
  start(port: number): Promise<void>;

  /**
   * Stop the HTTP server
   */
  stop(): Promise<void>;

  /**
   * Register a route handler
   */
  registerRoute(path: string, handler: IRouteHandler): void;

  /**
   * Get server status
   */
  getStatus(): IBridgeStatus;
}

/**
 * Route handler interface
 */
export interface IRouteHandler {
  handle(request: IHttpRequest): Promise<IHttpResponse>;
}

/**
 * Bridge status information
 */
export interface IBridgeStatus {
  readonly running: boolean;
  readonly port: number;
  readonly uptime: number;
  readonly requestCount: number;
  readonly errorCount: number;
}

// ============================================================================
// CHROME EXTENSION INTERFACES
// ============================================================================

/**
 * DevTools Protocol interface
 */
export interface IDevToolsProtocol {
  /**
   * Attach to a tab for debugging
   */
  attach(tabId: number): Promise<void>;

  /**
   * Detach from debugging session
   */
  detach(): Promise<void>;

  /**
   * Execute script in page context
   */
  evaluate(script: string): Promise<any>;

  /**
   * Get page content
   */
  getContent(): Promise<string>;

  /**
   * Capture screenshot
   */
  screenshot(options?: IScreenshotOptions): Promise<string>;
}

/**
 * Screenshot capture options
 */
export interface IScreenshotOptions {
  readonly format?: 'png' | 'jpeg';
  readonly quality?: number;
  readonly fullPage?: boolean;
  readonly selector?: string;
  readonly clip?: IClipRegion;
}

/**
 * Screenshot clipping region
 */
export interface IClipRegion {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// ============================================================================
// UI PANEL INTERFACES
// ============================================================================

/**
 * UI Panel base interface
 */
export interface IUIPanel {
  readonly id: string;
  readonly selector: string;
  readonly title: string;

  /**
   * Initialize the panel
   */
  initialize(): Promise<void>;

  /**
   * Render panel content
   */
  render(): Promise<HTMLElement>;

  /**
   * Handle panel events
   */
  handleEvents(): void;

  /**
   * Update panel state
   */
  updateState(state: any): Promise<void>;

  /**
   * Cleanup panel resources
   */
  destroy(): Promise<void>;
}

/**
 * Panel event handler
 */
export interface IPanelEventHandler {
  readonly event: string;
  readonly selector: string;
  readonly handler: (event: Event) => void | Promise<void>;
}

// ============================================================================
// ERROR HANDLING INTERFACES
// ============================================================================

/**
 * Standardized error types
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  EXECUTION = 'EXECUTION',
  TIMEOUT = 'TIMEOUT',
  CONNECTION = 'CONNECTION',
  AUTHENTICATION = 'AUTHENTICATION',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL = 'INTERNAL'
}

/**
 * Error context information
 */
export interface IErrorContext {
  readonly type: ErrorType;
  readonly message: string;
  readonly code?: string;
  readonly details?: Record<string, any>;
  readonly stack?: string;
  readonly timestamp: number;
  readonly recoverable: boolean;
}

/**
 * Error handler interface
 */
export interface IErrorHandler {
  handle(error: IErrorContext): Promise<IToolResult>;
  isRecoverable(error: IErrorContext): boolean;
  getRetryDelay(error: IErrorContext, attempt: number): number;
}

// ============================================================================
// LOGGING AND MONITORING INTERFACES
// ============================================================================

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Logger interface
 */
export interface ILogger {
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, context?: any): void;
}

/**
 * Metrics collection interface
 */
export interface IMetrics {
  increment(metric: string, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  timing(metric: string, duration: number, tags?: Record<string, string>): void;
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
}

/**
 * Monitoring interface
 */
export interface IMonitor {
  startRequest(operation: string): IRequestTracker;
  recordError(error: IErrorContext): void;
  getMetrics(): Promise<ISystemMetrics>;
}

/**
 * Request tracking
 */
export interface IRequestTracker {
  finish(result?: IToolResult): void;
  addTag(key: string, value: string): void;
  recordError(error: IErrorContext): void;
}

/**
 * System metrics
 */
export interface ISystemMetrics {
  readonly uptime: number;
  readonly requestCount: number;
  readonly errorCount: number;
  readonly averageResponseTime: number;
  readonly toolMetrics: Record<string, IToolMetrics>;
}

/**
 * Per-tool metrics
 */
export interface IToolMetrics {
  readonly name: string;
  readonly executionCount: number;
  readonly errorCount: number;
  readonly averageExecutionTime: number;
  readonly lastExecuted: number;
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

/**
 * Tool configuration
 */
export interface IToolConfig {
  readonly enabled: boolean;
  readonly timeout: number;
  readonly retries: number;
  readonly rateLimit?: number;
  readonly options?: Record<string, any>;
}

/**
 * System configuration
 */
export interface ISystemConfig {
  readonly debug: boolean;
  readonly logLevel: LogLevel;
  readonly port: number;
  readonly tools: Record<string, IToolConfig>;
  readonly monitoring: IMonitoringConfig;
}

/**
 * Monitoring configuration
 */
export interface IMonitoringConfig {
  readonly enabled: boolean;
  readonly metricsInterval: number;
  readonly healthCheckInterval: number;
  readonly retentionPeriod: number;
}

// ============================================================================
// ASYNC OPERATION INTERFACES
// ============================================================================

/**
 * Async operation context
 */
export interface IAsyncOperation<T> {
  readonly id: string;
  readonly status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  readonly progress?: number;
  readonly result?: T;
  readonly error?: IErrorContext;
  readonly startTime: number;
  readonly endTime?: number;
}

/**
 * Async operation manager
 */
export interface IAsyncManager {
  start<T>(operation: () => Promise<T>): Promise<IAsyncOperation<T>>;
  cancel(operationId: string): Promise<boolean>;
  getStatus(operationId: string): Promise<IAsyncOperation<any> | null>;
  listOperations(): Promise<IAsyncOperation<any>[]>;
}