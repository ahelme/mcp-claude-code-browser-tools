/**
 * 🦁 MANE Monitoring Infrastructure
 * Logging, metrics, and monitoring system
 *
 * This module provides comprehensive observability for the MANE system,
 * enabling debugging, performance analysis, and health monitoring.
 *
 * Built by: Foundation Architect (Agent A)
 * For: MANE (Modular Agentic Non-linear Engineering)
 */

import {
  ILogger,
  IMetrics,
  IMonitor,
  IRequestTracker,
  ISystemMetrics,
  IToolMetrics,
  IErrorContext,
  LogLevel,
  ErrorType
} from './interfaces.js';

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: any;
  source?: string;
}

/**
 * Metric entry structure
 */
interface MetricEntry {
  timestamp: number;
  name: string;
  value: number;
  type: 'counter' | 'gauge' | 'timing' | 'histogram';
  tags?: Record<string, string>;
}

/**
 * Request tracking context
 */
interface RequestContext {
  operation: string;
  startTime: number;
  tags: Record<string, string>;
  errors: IErrorContext[];
}

/**
 * Console Logger implementation
 *
 * Features:
 * - Structured logging with context
 * - Log level filtering
 * - Timestamp formatting
 * - Error tracking
 */
export class ConsoleLogger implements ILogger {
  private logEntries: LogEntry[] = [];
  private maxEntries = 1000;

  constructor(
    private minLevel: LogLevel = LogLevel.INFO,
    private source?: string
  ) {}

  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      source: this.source
    };

    // Add to in-memory storage
    this.logEntries.push(entry);
    if (this.logEntries.length > this.maxEntries) {
      this.logEntries.shift();
    }

    // Output to console
    this.outputToConsole(entry);
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentIndex = levels.indexOf(this.minLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const source = entry.source ? `[${entry.source}]` : '';
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

    const logMessage = `${timestamp} ${entry.level.toUpperCase()} ${source} ${entry.message}${contextStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
    }
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count = 100): LogEntry[] {
    return this.logEntries.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logEntries.filter(entry => entry.level === level);
  }

  /**
   * Clear log entries
   */
  clearLogs(): void {
    this.logEntries = [];
  }

  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

/**
 * In-Memory Metrics implementation
 *
 * Features:
 * - Counter, gauge, timing, and histogram metrics
 * - Tag-based metric organization
 * - Metric aggregation and reporting
 * - Memory-efficient storage
 */
export class InMemoryMetrics implements IMetrics {
  private metrics: MetricEntry[] = [];
  private maxEntries = 10000;

  increment(metric: string, tags?: Record<string, string>): void {
    this.addMetric(metric, 1, 'counter', tags);
  }

  gauge(metric: string, value: number, tags?: Record<string, string>): void {
    this.addMetric(metric, value, 'gauge', tags);
  }

  timing(metric: string, duration: number, tags?: Record<string, string>): void {
    this.addMetric(metric, duration, 'timing', tags);
  }

  histogram(metric: string, value: number, tags?: Record<string, string>): void {
    this.addMetric(metric, value, 'histogram', tags);
  }

  /**
   * Add metric entry
   */
  private addMetric(name: string, value: number, type: MetricEntry['type'], tags?: Record<string, string>): void {
    const entry: MetricEntry = {
      timestamp: Date.now(),
      name,
      value,
      type,
      tags
    };

    this.metrics.push(entry);

    // Maintain size limit
    if (this.metrics.length > this.maxEntries) {
      this.metrics.shift();
    }
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): MetricEntry[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): MetricEntry[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type: MetricEntry['type']): MetricEntry[] {
    return this.metrics.filter(metric => metric.type === type);
  }

  /**
   * Get aggregated counter value
   */
  getCounterValue(name: string, tags?: Record<string, string>): number {
    return this.metrics
      .filter(metric =>
        metric.name === name &&
        metric.type === 'counter' &&
        this.matchesTags(metric.tags, tags)
      )
      .reduce((sum, metric) => sum + metric.value, 0);
  }

  /**
   * Get latest gauge value
   */
  getGaugeValue(name: string, tags?: Record<string, string>): number | undefined {
    const gauges = this.metrics
      .filter(metric =>
        metric.name === name &&
        metric.type === 'gauge' &&
        this.matchesTags(metric.tags, tags)
      )
      .sort((a, b) => b.timestamp - a.timestamp);

    return gauges.length > 0 ? gauges[0].value : undefined;
  }

  /**
   * Get timing statistics
   */
  getTimingStats(name: string, tags?: Record<string, string>): {
    count: number;
    min: number;
    max: number;
    avg: number;
    sum: number;
  } | undefined {
    const timings = this.metrics
      .filter(metric =>
        metric.name === name &&
        metric.type === 'timing' &&
        this.matchesTags(metric.tags, tags)
      )
      .map(metric => metric.value);

    if (timings.length === 0) {
      return undefined;
    }

    return {
      count: timings.length,
      min: Math.min(...timings),
      max: Math.max(...timings),
      avg: timings.reduce((sum, val) => sum + val, 0) / timings.length,
      sum: timings.reduce((sum, val) => sum + val, 0)
    };
  }

  /**
   * Check if metric tags match filter
   */
  private matchesTags(metricTags?: Record<string, string>, filterTags?: Record<string, string>): boolean {
    if (!filterTags) return true;
    if (!metricTags) return false;

    return Object.entries(filterTags).every(([key, value]) => metricTags[key] === value);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalMetrics: number;
    metricNames: string[];
    recentActivity: number;
  } {
    const recentThreshold = Date.now() - 60000; // Last minute
    const recentActivity = this.metrics.filter(metric => metric.timestamp > recentThreshold).length;

    return {
      totalMetrics: this.metrics.length,
      metricNames: Array.from(new Set(this.metrics.map(metric => metric.name))),
      recentActivity
    };
  }
}

/**
 * System Monitor implementation
 *
 * Features:
 * - Request tracking with context
 * - Error monitoring and reporting
 * - System metrics collection
 * - Performance analysis
 */
export class SystemMonitor implements IMonitor {
  private activeRequests = new Map<string, RequestContext>();
  private completedRequests: RequestContext[] = [];
  private maxCompletedRequests = 1000;

  constructor(
    private logger: ILogger,
    private metrics: IMetrics
  ) {}

  /**
   * Start tracking a request
   */
  startRequest(operation: string): IRequestTracker {
    const requestId = this.generateRequestId();
    const context: RequestContext = {
      operation,
      startTime: Date.now(),
      tags: {},
      errors: []
    };

    this.activeRequests.set(requestId, context);

    this.metrics.increment('monitor.request.started', {
      operation
    });

    return new RequestTracker(requestId, context, this);
  }

  /**
   * Record error occurrence
   */
  recordError(error: IErrorContext): void {
    this.logger.error('System error recorded', {
      type: error.type,
      message: error.message,
      recoverable: error.recoverable
    });

    this.metrics.increment('monitor.error.recorded', {
      error_type: error.type,
      recoverable: error.recoverable.toString()
    });
  }

  /**
   * Get comprehensive system metrics
   */
  async getMetrics(): Promise<ISystemMetrics> {
    const now = Date.now();
    const uptime = now - this.getStartTime();

    // Calculate request metrics
    const allRequests = [...this.completedRequests];
    const requestCount = allRequests.length;
    const errorCount = allRequests.reduce((count, req) => count + req.errors.length, 0);

    const responseTimes = allRequests.map(req => this.calculateDuration(req));
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    // Build tool metrics
    const toolMetrics: Record<string, IToolMetrics> = {};

    for (const request of allRequests) {
      const toolName = request.tags.tool || request.operation;
      if (!toolMetrics[toolName]) {
        toolMetrics[toolName] = {
          name: toolName,
          executionCount: 0,
          errorCount: 0,
          averageExecutionTime: 0,
          lastExecuted: 0
        };
      }

      const tool = toolMetrics[toolName];
      tool.executionCount++;
      tool.errorCount += request.errors.length;
      tool.lastExecuted = Math.max(tool.lastExecuted, request.startTime);

      const duration = this.calculateDuration(request);
      tool.averageExecutionTime = (tool.averageExecutionTime * (tool.executionCount - 1) + duration) / tool.executionCount;
    }

    return {
      uptime,
      requestCount,
      errorCount,
      averageResponseTime,
      toolMetrics
    };
  }

  /**
   * Complete a request (called by RequestTracker)
   */
  completeRequest(requestId: string, result?: any): void {
    const context = this.activeRequests.get(requestId);
    if (!context) {
      return;
    }

    this.activeRequests.delete(requestId);
    this.completedRequests.push(context);

    // Maintain size limit
    if (this.completedRequests.length > this.maxCompletedRequests) {
      this.completedRequests.shift();
    }

    const duration = Date.now() - context.startTime;

    this.metrics.timing('monitor.request.duration', duration, {
      operation: context.operation,
      ...context.tags
    });

    this.metrics.increment('monitor.request.completed', {
      operation: context.operation,
      success: (result?.success !== false).toString(),
      ...context.tags
    });
  }

  /**
   * Add tag to request (called by RequestTracker)
   */
  addRequestTag(requestId: string, key: string, value: string): void {
    const context = this.activeRequests.get(requestId);
    if (context) {
      context.tags[key] = value;
    }
  }

  /**
   * Record error for request (called by RequestTracker)
   */
  recordRequestError(requestId: string, error: IErrorContext): void {
    const context = this.activeRequests.get(requestId);
    if (context) {
      context.errors.push(error);
    }
    this.recordError(error);
  }

  /**
   * Get active requests count
   */
  getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }

  /**
   * Get request statistics
   */
  getRequestStats(): {
    active: number;
    completed: number;
    avgDuration: number;
    errorRate: number;
  } {
    const completed = this.completedRequests.length;
    const totalErrors = this.completedRequests.reduce((count, req) => count + req.errors.length, 0);
    const durations = this.completedRequests.map(req => this.calculateDuration(req));
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, dur) => sum + dur, 0) / durations.length
      : 0;

    return {
      active: this.activeRequests.size,
      completed,
      avgDuration,
      errorRate: completed > 0 ? totalErrors / completed : 0
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateDuration(request: RequestContext): number {
    return Date.now() - request.startTime;
  }

  private getStartTime(): number {
    // In a real implementation, you'd track this properly
    return Date.now() - 3600000; // Assume 1 hour uptime for now
  }
}

/**
 * Request Tracker implementation
 */
class RequestTracker implements IRequestTracker {
  constructor(
    private requestId: string,
    private context: RequestContext,
    private monitor: SystemMonitor
  ) {}

  finish(result?: any): void {
    this.monitor.completeRequest(this.requestId, result);
  }

  addTag(key: string, value: string): void {
    this.monitor.addRequestTag(this.requestId, key, value);
  }

  recordError(error: IErrorContext): void {
    this.monitor.recordRequestError(this.requestId, error);
  }
}

/**
 * Factory function to create monitoring infrastructure
 */
export function createMonitoringInfrastructure(
  logLevel: LogLevel = LogLevel.INFO,
  source?: string
): {
  logger: ILogger;
  metrics: IMetrics;
  monitor: IMonitor;
} {
  const logger = new ConsoleLogger(logLevel, source);
  const metrics = new InMemoryMetrics();
  const monitor = new SystemMonitor(logger, metrics);

  return { logger, metrics, monitor };
}

/**
 * Helper to create error context
 */
export function createErrorContext(
  type: ErrorType,
  message: string,
  details?: any,
  recoverable = true
): IErrorContext {
  return {
    type,
    message,
    details,
    timestamp: Date.now(),
    recoverable
  };
}