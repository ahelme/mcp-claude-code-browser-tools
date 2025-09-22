/**
 * 🦁 MANE Performance Quality Gate
 *
 * Ensures components meet performance requirements for response time,
 * memory usage, and throughput.
 *
 * **CONVERTED TO .mjs**: Native Node.js ES modules for immediate compatibility
 */

/**
 * Performance Quality Gate
 *
 * Validates that MANE components meet performance requirements for
 * response time, memory usage, and concurrent execution capability.
 * Critical for ensuring agent tools perform adequately in production.
 *
 * **Performance Criteria:**
 * - Browser tools: < 5s response time, < 50MB memory increase
 * - UI panels: < 2s initialization, < 1s render, < 500ms state updates
 * - Concurrent execution: Handle 5+ simultaneous requests
 * - Memory management: No significant leaks detected
 *
 * **Agent Usage:**
 * - Agent B-I: Validate tools before production deployment
 * - Agent A.2: Performance optimization validation
 * - Continuous monitoring: Regular performance regression testing
 *
 * **Pass Criteria:** 80% of performance tests must pass
 *
 * @implements {IQualityGate}
 */
export class PerformanceQualityGate {
  /** Quality gate identifier used in MANE workflows */
  name = "performance";

  /** Human-readable description for logging and reports */
  description =
    "Validates performance requirements for response time and resource usage";

  /** Minimum pass rate required (0.80 = 80% of tests must pass) */
  requiredPassRate = 0.8;

  /**
   * Creates new performance quality gate
   *
   * @param {ILogger} logger - Logging service for performance tracking
   * @param {IMetrics} metrics - Metrics collection for performance monitoring and alerting
   */
  constructor(logger, metrics) {
    this.logger = logger;
    this.metrics = metrics;
  }

  /**
   * Execute performance validation
   * @param {unknown} target - Component to validate
   * @returns {Promise<ValidationResult>} Validation result with performance metrics
   */
  async execute(target) {
    this.logger.info(
      `Running performance validation for: ${this.getTargetName(target)}`,
    );

    const startTime = Date.now();
    const results = [];

    try {
      if (this.isBrowserTool(target)) {
        results.push(...(await this.validateToolPerformance(target)));
      } else if (this.isUIPanel(target)) {
        results.push(...(await this.validatePanelPerformance(target)));
      } else {
        return {
          valid: false,
          score: 0,
          errors: [`Unknown target type: ${typeof target}`],
          details: { target: this.getTargetName(target) },
        };
      }

      const passedTests = results.filter((r) => r.passed).length;
      const totalTests = results.length;
      const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      const passed = passedTests / totalTests >= this.requiredPassRate;

      const duration = Date.now() - startTime;
      this.metrics.timing("quality_gate.performance.duration", duration);
      this.metrics.gauge("quality_gate.performance.score", score);

      return {
        valid: passed,
        score: Math.round(score),
        errors: results.filter((r) => !r.passed).map((r) => r.message),
        details: {
          target: this.getTargetName(target),
          totalTests,
          passedTests,
          requiredPassRate: this.requiredPassRate,
          results,
        },
      };
    } catch (error) {
      this.logger.error("Performance validation failed", error);
      return {
        valid: false,
        score: 0,
        errors: [
          `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }

  /**
   * Validate browser tool performance
   * @param {IBrowserTool} tool - Tool to validate
   * @returns {Promise<Array>} Performance test results
   */
  async validateToolPerformance(tool) {
    const results = [];

    // Test response time
    const testParams = this.generateTestParams(tool.schema);
    const maxResponseTime = 5000; // 5 seconds max

    const startTime = Date.now();
    try {
      await tool.execute(testParams);
      const responseTime = Date.now() - startTime;

      results.push({
        test: "response-time",
        passed: responseTime < maxResponseTime,
        message:
          responseTime < maxResponseTime
            ? `✓ Tool responds in ${responseTime}ms`
            : `✗ Tool response time ${responseTime}ms exceeds limit (${maxResponseTime}ms)`,
        category: "response-time",
        value: responseTime,
        threshold: maxResponseTime,
      });

      this.metrics.timing("quality_gate.tool.response_time", responseTime, {
        tool: tool.name,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      results.push({
        test: "response-time",
        passed: responseTime < maxResponseTime,
        message:
          responseTime < maxResponseTime
            ? `✓ Tool failed but responded in ${responseTime}ms`
            : `✗ Tool failed and exceeded response time: ${responseTime}ms`,
        category: "response-time",
        value: responseTime,
        threshold: maxResponseTime,
      });
    }

    // Test concurrent execution capability
    try {
      const concurrentRequests = 5;
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => tool.execute(testParams));

      const concurrentStartTime = Date.now();
      await Promise.allSettled(promises);
      const concurrentTime = Date.now() - concurrentStartTime;
      const concurrentThreshold = maxResponseTime * 2; // Allow 2x time for concurrent

      results.push({
        test: "concurrent-execution",
        passed: concurrentTime < concurrentThreshold,
        message:
          concurrentTime < concurrentThreshold
            ? `✓ Handles ${concurrentRequests} concurrent requests in ${concurrentTime}ms`
            : `✗ Concurrent execution too slow: ${concurrentTime}ms (max: ${concurrentThreshold}ms)`,
        category: "concurrency",
        value: concurrentTime,
        threshold: concurrentThreshold,
      });
    } catch (error) {
      results.push({
        test: "concurrent-execution",
        passed: false,
        message: `✗ Concurrent execution test failed: ${error instanceof Error ? error.message : String(error)}`,
        category: "concurrency",
      });
    }

    // Test memory usage (basic check)
    const initialMemory = process.memoryUsage().heapUsed;
    try {
      // Execute multiple times to test memory leaks
      for (let i = 0; i < 10; i++) {
        await tool.execute(testParams);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const maxMemoryIncrease = 50 * 1024 * 1024; // 50MB max increase

      results.push({
        test: "memory-usage",
        passed: memoryIncrease < maxMemoryIncrease,
        message:
          memoryIncrease < maxMemoryIncrease
            ? `✓ Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`
            : `✗ Excessive memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB (max: 50MB)`,
        category: "memory",
        value: Math.round(memoryIncrease / 1024 / 1024),
        threshold: 50,
      });
    } catch (error) {
      results.push({
        test: "memory-usage",
        passed: false,
        message: `✗ Memory usage test failed: ${error instanceof Error ? error.message : String(error)}`,
        category: "memory",
      });
    }

    return results;
  }

  /**
   * Validate UI panel performance
   * @param {IUIPanel} panel - Panel to validate
   * @returns {Promise<Array>} Performance test results
   */
  async validatePanelPerformance(panel) {
    const results = [];

    // Test initialization time
    const maxInitTime = 2000; // 2 seconds max

    const initStartTime = Date.now();
    try {
      await panel.initialize();
      const initTime = Date.now() - initStartTime;

      results.push({
        test: "initialization-time",
        passed: initTime < maxInitTime,
        message:
          initTime < maxInitTime
            ? `✓ Panel initializes in ${initTime}ms`
            : `✗ Panel initialization too slow: ${initTime}ms (max: ${maxInitTime}ms)`,
        category: "initialization",
        value: initTime,
        threshold: maxInitTime,
      });
    } catch (error) {
      const initTime = Date.now() - initStartTime;
      results.push({
        test: "initialization-time",
        passed: false,
        message: `✗ Panel initialization failed in ${initTime}ms: ${error instanceof Error ? error.message : String(error)}`,
        category: "initialization",
        value: initTime,
        threshold: maxInitTime,
      });
    }

    // Test render time
    const maxRenderTime = 1000; // 1 second max

    const renderStartTime = Date.now();
    try {
      await panel.render();
      const renderTime = Date.now() - renderStartTime;

      results.push({
        test: "render-time",
        passed: renderTime < maxRenderTime,
        message:
          renderTime < maxRenderTime
            ? `✓ Panel renders in ${renderTime}ms`
            : `✗ Panel render too slow: ${renderTime}ms (max: ${maxRenderTime}ms)`,
        category: "rendering",
        value: renderTime,
        threshold: maxRenderTime,
      });
    } catch (error) {
      const renderTime = Date.now() - renderStartTime;
      results.push({
        test: "render-time",
        passed: false,
        message: `✗ Panel render failed in ${renderTime}ms: ${error instanceof Error ? error.message : String(error)}`,
        category: "rendering",
        value: renderTime,
        threshold: maxRenderTime,
      });
    }

    // Test state update performance
    const maxUpdateTime = 500; // 500ms max

    const updateStartTime = Date.now();
    try {
      await panel.updateState({ testUpdate: true });
      const updateTime = Date.now() - updateStartTime;

      results.push({
        test: "state-update-time",
        passed: updateTime < maxUpdateTime,
        message:
          updateTime < maxUpdateTime
            ? `✓ Panel updates state in ${updateTime}ms`
            : `✗ Panel state update too slow: ${updateTime}ms (max: ${maxUpdateTime}ms)`,
        category: "state-updates",
        value: updateTime,
        threshold: maxUpdateTime,
      });
    } catch (error) {
      const updateTime = Date.now() - updateStartTime;
      results.push({
        test: "state-update-time",
        passed: false,
        message: `✗ Panel state update failed in ${updateTime}ms: ${error instanceof Error ? error.message : String(error)}`,
        category: "state-updates",
        value: updateTime,
        threshold: maxUpdateTime,
      });
    }

    return results;
  }

  /**
   * Generate test parameters from schema
   * @param {any} schema - Parameter schema
   * @returns {any} Generated test parameters
   */
  generateTestParams(schema) {
    // Generate minimal valid parameters based on schema
    if (schema.type === "object") {
      const params = {};

      if (schema.required) {
        for (const prop of schema.required) {
          if (schema.properties && schema.properties[prop]) {
            const propSchema = schema.properties[prop];
            params[prop] = this.generateTestValue(propSchema);
          }
        }
      }

      return params;
    }

    return {};
  }

  /**
   * Generate test value for schema type
   * @param {any} schema - Property schema
   * @returns {any} Generated test value
   */
  generateTestValue(schema) {
    switch (schema.type) {
      case "string":
        return "test";
      case "number":
        return 1;
      case "boolean":
        return true;
      case "array":
        return [];
      case "object":
        return {};
      default:
        return null;
    }
  }

  /**
   * Type guard for browser tools
   * @param {unknown} target - Object to check
   * @returns {boolean} True if target implements IBrowserTool
   */
  isBrowserTool(target) {
    return (
      target !== null &&
      typeof target === "object" &&
      "execute" in target &&
      typeof target.execute === "function"
    );
  }

  /**
   * Type guard for UI panels
   * @param {unknown} target - Object to check
   * @returns {boolean} True if target implements IUIPanel
   */
  isUIPanel(target) {
    return (
      target !== null &&
      typeof target === "object" &&
      "render" in target &&
      typeof target.render === "function"
    );
  }

  /**
   * Get human-readable target name
   * @param {unknown} target - Target object
   * @returns {string} Target name or "unknown"
   */
  getTargetName(target) {
    if (target && typeof target === "object" && "name" in target) {
      return String(target.name);
    }
    if (target && typeof target === "object" && "id" in target) {
      return String(target.id);
    }
    return "unknown";
  }
}