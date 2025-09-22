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
  LogLevel,
  ErrorType
} from './interfaces.mjs';

/**
 * Log entry structure
 */
/**
 * @typedef {Object} LogEntry
 * @property {number} timestamp - Timestamp
 * @property {LogLevel} level - Log level
 * @property {string} message - Message
 * @property {any} [context] - Context data
 * @property {string} [source] - Source identifier
 */

/**
 * Metric entry structure
 */
/**
 * @typedef {Object} MetricEntry
 * @property {number} timestamp - Timestamp
 * @property {string} name - Metric name
 * @property {number} value - Metric value
 * @property {'counter'|'gauge'|'timing'|'histogram'} type - Metric type
 * @property {Record<string, string>} [tags] - Metric tags
 */

/**
 * Request tracking context
 */
/**
 * @typedef {Object} RequestContext
 * @property {string} operation - Operation name
 * @property {number} startTime - Start time
 * @property {Record<string, string>} tags - Tags
 * @property {Array} errors - Error contexts
 */

/**
 * Console Logger implementation
 *
 * Features:
 * - Structured logging with context
 * - Log level filtering
 * - Timestamp formatting
 * - Error tracking
 */
export class ConsoleLogger {
logEntries = [];
maxEntries = 1000;

  constructor(
  minLevel = LogLevel.INFO,
  source
  ) {}

  debug(message, context) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message, context) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message, context) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message, context) {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Core logging method
   */
log(level, message, context) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = {
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
shouldLog(level) {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentIndex = levels.indexOf(this.minLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  /**
   * Output log entry to console
   */
outputToConsole(entry) {
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
  getRecentLogs(count = 100) {
    return this.logEntries.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level) {
    return this.logEntries.filter(entry => entry.level === level);
  }

  /**
   * Clear log entries
   */
  clearLogs() {
    this.logEntries = [];
  }

  /**
   * Set log level
   */
  setLogLevel(level) {
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
export class InMemoryMetrics {
metrics = [];
maxEntries = 10000;

  increment(metric, tags) {
    this.addMetric(metric, 1, 'counter', tags);
  }

  gauge(metric, value, tags) {
    this.addMetric(metric, value, 'gauge', tags);
  }

  timing(metric, duration, tags) {
    this.addMetric(metric, duration, 'timing', tags);
  }

  histogram(metric, value, tags) {
    this.addMetric(metric, value, 'histogram', tags);
  }

  /**
   * Add metric entry
   */
addMetric(name, value, type, tags) {
    const entry = {
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
  getAllMetrics() {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name) {
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type) {
    return this.metrics.filter(metric => metric.type === type);
  }

  /**
   * Get aggregated counter value
   */
  getCounterValue(name, tags) {
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
  getGaugeValue(name, tags) {
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
  getTimingStats(name, tags) {
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
matchesTags(metricTags, filterTags) {
    if (!filterTags) return true;
    if (!metricTags) return false;

    return Object.entries(filterTags).every(([key, value]) => metricTags[key] === value);
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Get metrics summary
   */
  getSummary() {
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
export class SystemMonitor {
activeRequests = new Map();
completedRequests = [];
maxCompletedRequests = 1000;

  constructor(
  logger,
  metrics
  ) {}

  /**
   * Start tracking a request
   */
  startRequest(operation) {
    const requestId = this.generateRequestId();
    const context = {
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
  recordError(error) {
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
  async getMetrics() {
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
    const toolMetrics = {};

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
  completeRequest(requestId, result) {
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
  addRequestTag(requestId, key, value) {
    const context = this.activeRequests.get(requestId);
    if (context) {
      context.tags[key] = value;
    }
  }

  /**
   * Record error for request (called by RequestTracker)
   */
  recordRequestError(requestId, error) {
    const context = this.activeRequests.get(requestId);
    if (context) {
      context.errors.push(error);
    }
    this.recordError(error);
  }

  /**
   * Get active requests count
   */
  getActiveRequestsCount() {
    return this.activeRequests.size;
  }

  /**
   * Get request statistics
   */
  getRequestStats() {
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

generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

calculateDuration(request) {
    return Date.now() - request.startTime;
  }

getStartTime() {
    // In a real implementation, you'd track this properly
    return Date.now() - 3600000; // Assume 1 hour uptime for now
  }
}

/**
 * Request Tracker implementation
 */
class RequestTracker {
  constructor(
  requestId,
  context,
  monitor  ) {}

  finish(result) {
    this.monitor.completeRequest(this.requestId, result);
  }

  addTag(key, value) {
    this.monitor.addRequestTag(this.requestId, key, value);
  }

  recordError(error) {
    this.monitor.recordRequestError(this.requestId, error);
  }
}

/**
 * Factory function to create monitoring infrastructure
 */
export function createMonitoringInfrastructure(
  logLevel = LogLevel.INFO,
  source
) {
  const logger = new ConsoleLogger(logLevel, source);
  const metrics = new InMemoryMetrics();
  const monitor = new SystemMonitor(logger, metrics);

  return { logger, metrics, monitor };
}

/**
 * Helper to create error context
 */
export function createErrorContext(
  type,
  message,
  details,
  recoverable = true
) {
  return {
    type,
    message,
    details,
    timestamp: Date.now(),
    recoverable
  };
}