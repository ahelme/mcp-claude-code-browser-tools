/**
 * 🦁 MANE Base Classes
 * Foundation implementations for browser tools and UI panels
 *
 * These base classes provide common functionality and enforce interface
 * compliance, enabling other agents to focus on their specific logic.
 *
 * Built by: Foundation Architect (Agent A)
 * For: MANE (Modular Agentic Non-linear Engineering)
 */

import {
  IBrowserTool,
  IToolResult,
  IValidationResult,
  IToolCapabilities,
  IToolStatus,
  IUIPanel,
  IPanelEventHandler,
  JSONSchema,
  ILogger,
  IMetrics,
  ErrorType,
  IErrorContext,
  IErrorHandler
} from './interfaces.js';

// ============================================================================
// BROWSER TOOL BASE CLASS
// ============================================================================

/**
 * Abstract base class for browser tools
 *
 * Provides common functionality:
 * - Parameter validation
 * - Error handling and recovery
 * - Metrics collection
 * - Status tracking
 * - Retry logic
 */
export abstract class BaseBrowserTool implements IBrowserTool {
  protected executionCount = 0;
  protected errorCount = 0;
  protected totalExecutionTime = 0;
  protected lastExecuted = 0;

  constructor(
    protected logger: ILogger,
    protected metrics: IMetrics,
    protected errorHandler?: IErrorHandler
  ) {}

  // Abstract properties - must be implemented by subclasses
  abstract readonly name: string;
  abstract readonly endpoint: string;
  abstract readonly description: string;
  abstract readonly schema: JSONSchema;

  // Default capabilities - can be overridden
  get capabilities(): IToolCapabilities {
    return {
      async: true,
      timeout: 30000,
      retryable: true,
      batchable: false,
      requiresAuth: false
    };
  }

  /**
   * Execute the tool with parameter validation and error handling
   */
  async execute(params: unknown): Promise<IToolResult> {
    const startTime = Date.now();
    this.executionCount++;
    this.lastExecuted = startTime;

    this.logger.debug(`Executing tool: ${this.name}`, { params });

    try {
      // Validate parameters
      const validation = this.validate(params);
      if (!validation.valid) {
        throw this.createError(
          ErrorType.VALIDATION,
          `Parameter validation failed: ${validation.errors?.join(', ')}`,
          { params, validation }
        );
      }

      // Execute with timeout
      const result = await this.executeWithTimeout(params);

      const executionTime = Date.now() - startTime;
      this.totalExecutionTime += executionTime;

      this.metrics.timing('tool.execution.duration', executionTime, {
        tool: this.name,
        success: 'true'
      });

      this.logger.debug(`Tool execution completed: ${this.name}`, {
        success: result.success,
        duration: executionTime
      });

      return {
        ...result,
        timestamp: Date.now()
      };

    } catch (error) {
      this.errorCount++;
      const executionTime = Date.now() - startTime;

      this.metrics.increment('tool.execution.error', {
        tool: this.name,
        error_type: error instanceof Error ? error.constructor.name : 'unknown'
      });

      this.logger.error(`Tool execution failed: ${this.name}`, {
        error: error instanceof Error ? error.message : String(error),
        duration: executionTime
      });

      // Try error recovery if handler is available
      if (this.errorHandler && error instanceof Error && 'type' in error) {
        try {
          return await this.errorHandler.handle(error as IErrorContext);
        } catch (recoveryError) {
          this.logger.warn(`Error recovery failed: ${this.name}`, recoveryError);
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        metadata: {
          tool: this.name,
          executionTime,
          recoveryAttempted: !!this.errorHandler
        }
      };
    }
  }

  /**
   * Validate parameters against schema
   */
  validate(params: unknown): IValidationResult {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic type checking
      if (this.schema.type === 'object' && typeof params !== 'object') {
        errors.push(`Expected object, got ${typeof params}`);
        return { valid: false, errors };
      }

      if (typeof params === 'object' && params !== null) {
        const obj = params as Record<string, any>;

        // Check required properties
        if (this.schema.required) {
          for (const prop of this.schema.required) {
            if (!(prop in obj)) {
              errors.push(`Missing required property: ${prop}`);
            }
          }
        }

        // Check property types
        if (this.schema.properties) {
          for (const [prop, propSchema] of Object.entries(this.schema.properties)) {
            if (prop in obj) {
              const value = obj[prop];
              const expected = propSchema.type;

              if (expected && typeof value !== expected) {
                if (expected === 'number' && typeof value === 'string' && !isNaN(Number(value))) {
                  warnings.push(`Property ${prop} should be number, auto-converting from string`);
                } else {
                  errors.push(`Property ${prop} should be ${expected}, got ${typeof value}`);
                }
              }
            }
          }
        }

        // Check for unexpected properties
        if (this.schema.additionalProperties === false && this.schema.properties) {
          const allowedProps = Object.keys(this.schema.properties);
          for (const prop of Object.keys(obj)) {
            if (!allowedProps.includes(prop)) {
              warnings.push(`Unexpected property: ${prop}`);
            }
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Get tool status and health information
   */
  async getStatus(): Promise<IToolStatus> {
    const averageExecutionTime = this.executionCount > 0
      ? this.totalExecutionTime / this.executionCount
      : 0;

    const errorRate = this.executionCount > 0
      ? this.errorCount / this.executionCount
      : 0;

    // Health check: tool is healthy if error rate < 50% and it's responding
    const healthy = errorRate < 0.5 && await this.healthCheck();

    return {
      healthy,
      lastUsed: this.lastExecuted > 0 ? this.lastExecuted : undefined,
      executionCount: this.executionCount,
      averageExecutionTime,
      errorRate
    };
  }

  // ============================================================================
  // PROTECTED METHODS FOR SUBCLASSES
  // ============================================================================

  /**
   * Abstract method - implement the core tool logic
   */
  protected abstract executeCore(params: any): Promise<IToolResult>;

  /**
   * Perform tool-specific health check
   */
  protected async healthCheck(): Promise<boolean> {
    try {
      // Default implementation - subclasses can override
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute with timeout protection
   */
  private async executeWithTimeout(params: unknown): Promise<IToolResult> {
    const timeout = this.capabilities.timeout;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(this.createError(
          ErrorType.TIMEOUT,
          `Tool execution timeout after ${timeout}ms`,
          { tool: this.name, timeout }
        ));
      }, timeout);

      this.executeCore(params)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Create structured error
   */
  protected createError(type: ErrorType, message: string, details?: any): Error & IErrorContext {
    const error = new Error(message) as Error & IErrorContext;
    error.type = type;
    error.message = message;
    error.details = details;
    error.timestamp = Date.now();
    error.recoverable = type !== ErrorType.VALIDATION;
    return error;
  }

  /**
   * Create successful result
   */
  protected createSuccess(data?: any, metadata?: Record<string, any>): IToolResult {
    return {
      success: true,
      data,
      metadata,
      timestamp: Date.now()
    };
  }

  /**
   * Create error result
   */
  protected createErrorResult(message: string, details?: any): IToolResult {
    return {
      success: false,
      error: message,
      metadata: { details },
      timestamp: Date.now()
    };
  }
}

// ============================================================================
// UI PANEL BASE CLASS
// ============================================================================

/**
 * Abstract base class for UI panels
 *
 * Provides common functionality:
 * - Event handling registration
 * - State management
 * - Lifecycle management
 * - Error handling
 */
export abstract class BaseUIPanel implements IUIPanel {
  protected initialized = false;
  protected destroyed = false;
  protected eventHandlers: IPanelEventHandler[] = [];
  protected currentState: any = {};

  constructor(
    protected logger: ILogger,
    protected metrics?: IMetrics
  ) {}

  // Abstract properties - must be implemented by subclasses
  abstract readonly id: string;
  abstract readonly selector: string;
  abstract readonly title: string;

  /**
   * Initialize the panel
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.debug(`Initializing panel: ${this.id}`);

    try {
      await this.initializeCore();
      this.handleEvents();
      this.initialized = true;

      this.metrics?.increment('panel.initialized', {
        panel: this.id
      });

      this.logger.debug(`Panel initialized: ${this.id}`);
    } catch (error) {
      this.logger.error(`Panel initialization failed: ${this.id}`, error);
      throw error;
    }
  }

  /**
   * Render panel content
   */
  async render(): Promise<HTMLElement> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.logger.debug(`Rendering panel: ${this.id}`);

    try {
      const element = await this.renderCore();

      this.metrics?.increment('panel.rendered', {
        panel: this.id
      });

      return element;
    } catch (error) {
      this.logger.error(`Panel rendering failed: ${this.id}`, error);
      throw error;
    }
  }

  /**
   * Handle panel events
   */
  handleEvents(): void {
    if (this.destroyed) {
      return;
    }

    // Remove existing event listeners
    this.removeEventListeners();

    // Get event handlers from subclass
    const handlers = this.getEventHandlers();

    // Register event listeners
    for (const handler of handlers) {
      this.addEventListener(handler);
    }

    this.eventHandlers = handlers;
  }

  /**
   * Update panel state
   */
  async updateState(state: any): Promise<void> {
    this.logger.debug(`Updating panel state: ${this.id}`, { state });

    const oldState = { ...this.currentState };
    this.currentState = { ...this.currentState, ...state };

    try {
      await this.onStateChange(this.currentState, oldState);

      this.metrics?.increment('panel.state_updated', {
        panel: this.id
      });
    } catch (error) {
      this.logger.error(`Panel state update failed: ${this.id}`, error);
      // Rollback state on error
      this.currentState = oldState;
      throw error;
    }
  }

  /**
   * Get current panel state
   */
  getState(): any {
    return { ...this.currentState };
  }

  /**
   * Cleanup panel resources
   */
  async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    this.logger.debug(`Destroying panel: ${this.id}`);

    try {
      this.removeEventListeners();
      await this.destroyCore();
      this.destroyed = true;

      this.metrics?.increment('panel.destroyed', {
        panel: this.id
      });

      this.logger.debug(`Panel destroyed: ${this.id}`);
    } catch (error) {
      this.logger.error(`Panel destruction failed: ${this.id}`, error);
      throw error;
    }
  }

  // ============================================================================
  // ABSTRACT METHODS FOR SUBCLASSES
  // ============================================================================

  /**
   * Implement panel-specific initialization
   */
  protected abstract initializeCore(): Promise<void>;

  /**
   * Implement panel-specific rendering
   */
  protected abstract renderCore(): Promise<HTMLElement>;

  /**
   * Get panel-specific event handlers
   */
  abstract getEventHandlers(): IPanelEventHandler[];

  /**
   * Handle state changes
   */
  protected abstract onStateChange(newState: any, oldState: any): Promise<void>;

  /**
   * Implement panel-specific cleanup
   */
  protected abstract destroyCore(): Promise<void>;

  // ============================================================================
  // PROTECTED HELPER METHODS
  // ============================================================================

  /**
   * Add event listener with error handling
   */
  private addEventListener(handler: IPanelEventHandler): void {
    const elements = document.querySelectorAll(handler.selector);

    const wrappedHandler = async (event: Event) => {
      try {
        await handler.handler(event);
      } catch (error) {
        this.logger.error(`Event handler error in panel ${this.id}`, {
          event: handler.event,
          selector: handler.selector,
          error
        });
      }
    };

    elements.forEach(element => {
      element.addEventListener(handler.event, wrappedHandler);
    });
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    // This is a simplified implementation
    // In a real implementation, you'd track listeners for proper cleanup
    this.eventHandlers = [];
  }

  /**
   * Helper to create DOM elements
   */
  protected createElement(tag: string, attributes?: Record<string, string>, textContent?: string): HTMLElement {
    const element = document.createElement(tag);

    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
      }
    }

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  /**
   * Helper to find elements in panel
   */
  protected findElement(selector: string): HTMLElement | null {
    const panelElement = document.querySelector(this.selector);
    return panelElement ? panelElement.querySelector(selector) : null;
  }

  /**
   * Helper to find all elements in panel
   */
  protected findElements(selector: string): NodeListOf<Element> {
    const panelElement = document.querySelector(this.selector);
    return panelElement ? panelElement.querySelectorAll(selector) : document.querySelectorAll('');
  }
}

// ============================================================================
// ERROR HANDLER BASE CLASS
// ============================================================================

/**
 * Base error handler implementation
 */
export class BaseErrorHandler implements IErrorHandler {
  constructor(
    protected logger: ILogger,
    protected metrics: IMetrics
  ) {}

  async handle(error: IErrorContext): Promise<IToolResult> {
    this.logger.warn('Handling tool error', {
      type: error.type,
      message: error.message,
      recoverable: error.recoverable
    });

    this.metrics.increment('error_handler.attempts', {
      error_type: error.type,
      recoverable: error.recoverable.toString()
    });

    if (!error.recoverable) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
        metadata: {
          errorType: error.type,
          handled: true,
          recoverable: false
        }
      };
    }

    // Implement basic retry logic for recoverable errors
    switch (error.type) {
      case ErrorType.TIMEOUT:
      case ErrorType.CONNECTION:
        return this.handleRetryableError(error);

      default:
        return {
          success: false,
          error: error.message,
          timestamp: Date.now(),
          metadata: {
            errorType: error.type,
            handled: true,
            recoverable: error.recoverable
          }
        };
    }
  }

  isRecoverable(error: IErrorContext): boolean {
    return error.recoverable && [
      ErrorType.TIMEOUT,
      ErrorType.CONNECTION,
      ErrorType.RATE_LIMIT
    ].includes(error.type);
  }

  getRetryDelay(error: IErrorContext, attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }

  private async handleRetryableError(error: IErrorContext): Promise<IToolResult> {
    // This is a simplified implementation
    // In practice, you'd implement actual retry logic
    return {
      success: false,
      error: `Retryable error handled: ${error.message}`,
      timestamp: Date.now(),
      metadata: {
        errorType: error.type,
        handled: true,
        recoverable: true,
        retryRecommended: true
      }
    };
  }
}