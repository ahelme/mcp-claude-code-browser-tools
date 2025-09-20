/**
 * 🦁 MANE Quality Framework
 *
 * Comprehensive quality gate system that ensures all agent implementations
 * meet the MANE standards for interface compliance, performance, and reliability.
 *
 * Built by: Foundation Architect (Agent A)
 * For: MANE (Modular Agentic Non-linear Engineering)
 */

import {
  IQualityGate,
  ITestSuite,
  IBrowserTool,
  IUIPanel,
  IToolRegistry,
  ILogger,
  IMetrics,
  ValidationResult,
} from './interfaces.js';

// ============================================================================
// Quality Gate Implementations
// ============================================================================

/**
 * Interface Compliance Quality Gate
 *
 * Ensures all tools and panels properly implement their required interfaces
 * and can be successfully registered and discovered.
 */
export class InterfaceComplianceGate implements IQualityGate {
  readonly name = 'Interface Compliance';
  readonly description = 'Validates that modules implement required interfaces correctly';

  constructor(
    private logger: ILogger,
    private registry: IToolRegistry
  ) {}

  async validate(target: any): Promise<{
    passed: boolean;
    score: number;
    details: Array<{
      check: string;
      passed: boolean;
      message: string;
    }>;
  }> {
    const checks: Array<{ check: string; passed: boolean; message: string }> = [];

    try {
      if (this.isBrowserTool(target)) {
        await this.validateBrowserTool(target, checks);
      } else if (this.isUIPanel(target)) {
        await this.validateUIPanel(target, checks);
      } else if (this.isToolRegistry(target)) {
        await this.validateToolRegistry(target, checks);
      } else {
        checks.push({
          check: 'Type Recognition',
          passed: false,
          message: 'Target is not a recognized MANE component type',
        });
      }

      const passedChecks = checks.filter(c => c.passed).length;
      const totalChecks = checks.length;
      const score = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
      const passed = score >= 90; // 90% pass rate required

      this.logger.info(`Interface compliance check completed`, {
        target: target.constructor?.name || 'Unknown',
        score,
        passed,
        passedChecks,
        totalChecks,
      });

      return { passed, score, details: checks };

    } catch (error) {
      this.logger.error('Interface compliance validation failed', error);
      checks.push({
        check: 'Validation Execution',
        passed: false,
        message: `Validation failed: ${error.message}`,
      });

      return { passed: false, score: 0, details: checks };
    }
  }

  private async validateBrowserTool(tool: IBrowserTool, checks: Array<any>): Promise<void> {
    // Check required properties
    checks.push({
      check: 'Tool Name',
      passed: typeof tool.name === 'string' && tool.name.length > 0,
      message: tool.name ? 'Tool has valid name' : 'Tool name missing or invalid',
    });

    checks.push({
      check: 'Tool Endpoint',
      passed: typeof tool.endpoint === 'string' && tool.endpoint.startsWith('/'),
      message: tool.endpoint ? 'Tool has valid endpoint' : 'Tool endpoint missing or invalid',
    });

    checks.push({
      check: 'Tool Description',
      passed: typeof tool.description === 'string' && tool.description.length > 0,
      message: tool.description ? 'Tool has description' : 'Tool description missing',
    });

    checks.push({
      check: 'Tool Schema',
      passed: typeof tool.schema === 'object' && tool.schema !== null,
      message: tool.schema ? 'Tool has valid schema' : 'Tool schema missing or invalid',
    });

    checks.push({
      check: 'Tool Capabilities',
      passed: typeof tool.capabilities === 'object' && tool.capabilities !== null,
      message: tool.capabilities ? 'Tool has capabilities defined' : 'Tool capabilities missing',
    });

    // Check required methods
    checks.push({
      check: 'Execute Method',
      passed: typeof tool.execute === 'function',
      message: 'Tool implements execute method',
    });

    checks.push({
      check: 'Validate Method',
      passed: typeof tool.validate === 'function',
      message: 'Tool implements validate method',
    });

    checks.push({
      check: 'GetStatus Method',
      passed: typeof tool.getStatus === 'function',
      message: 'Tool implements getStatus method',
    });

    // Test method functionality
    try {
      const status = await tool.getStatus();
      checks.push({
        check: 'Status Method Execution',
        passed: typeof status === 'object' && 'healthy' in status,
        message: 'getStatus method returns valid status object',
      });
    } catch (error) {
      checks.push({
        check: 'Status Method Execution',
        passed: false,
        message: `getStatus method failed: ${error.message}`,
      });
    }

    try {
      const validation = tool.validate({});
      checks.push({
        check: 'Validate Method Execution',
        passed: typeof validation === 'object' && 'valid' in validation,
        message: 'validate method returns valid validation result',
      });
    } catch (error) {
      checks.push({
        check: 'Validate Method Execution',
        passed: false,
        message: `validate method failed: ${error.message}`,
      });
    }

    // Test registry integration
    try {
      await this.registry.registerTool(tool);
      const discovered = this.registry.discoverTools().find(t => t.name === tool.name);
      checks.push({
        check: 'Registry Integration',
        passed: discovered !== undefined,
        message: discovered ? 'Tool can be registered and discovered' : 'Tool registration failed',
      });
    } catch (error) {
      checks.push({
        check: 'Registry Integration',
        passed: false,
        message: `Registry integration failed: ${error.message}`,
      });
    }
  }

  private async validateUIPanel(panel: IUIPanel, checks: Array<any>): Promise<void> {
    // Check required properties
    checks.push({
      check: 'Panel ID',
      passed: typeof panel.id === 'string' && panel.id.length > 0,
      message: panel.id ? 'Panel has valid ID' : 'Panel ID missing or invalid',
    });

    checks.push({
      check: 'Panel Selector',
      passed: typeof panel.selector === 'string' && panel.selector.length > 0,
      message: panel.selector ? 'Panel has valid selector' : 'Panel selector missing or invalid',
    });

    checks.push({
      check: 'Panel Title',
      passed: typeof panel.title === 'string' && panel.title.length > 0,
      message: panel.title ? 'Panel has valid title' : 'Panel title missing or invalid',
    });

    // Check required methods
    checks.push({
      check: 'Initialize Method',
      passed: typeof panel.initialize === 'function',
      message: 'Panel implements initialize method',
    });

    checks.push({
      check: 'Render Method',
      passed: typeof panel.render === 'function',
      message: 'Panel implements render method',
    });

    checks.push({
      check: 'HandleEvents Method',
      passed: typeof panel.handleEvents === 'function',
      message: 'Panel implements handleEvents method',
    });

    checks.push({
      check: 'UpdateState Method',
      passed: typeof panel.updateState === 'function',
      message: 'Panel implements updateState method',
    });

    checks.push({
      check: 'Destroy Method',
      passed: typeof panel.destroy === 'function',
      message: 'Panel implements destroy method',
    });
  }

  private async validateToolRegistry(registry: IToolRegistry, checks: Array<any>): Promise<void> {
    // Check required methods
    const requiredMethods = [
      'registerTool',
      'discoverTools',
      'routeRequest',
      'getHealth',
      'unregisterTool',
    ];

    for (const method of requiredMethods) {
      checks.push({
        check: `Registry ${method} Method`,
        passed: typeof (registry as any)[method] === 'function',
        message: `Registry implements ${method} method`,
      });
    }

    // Test basic functionality
    try {
      const health = await registry.getHealth();
      checks.push({
        check: 'Registry Health Check',
        passed: typeof health === 'object' && 'totalTools' in health,
        message: 'Registry health check returns valid data',
      });
    } catch (error) {
      checks.push({
        check: 'Registry Health Check',
        passed: false,
        message: `Registry health check failed: ${error.message}`,
      });
    }

    try {
      const tools = registry.discoverTools();
      checks.push({
        check: 'Registry Tool Discovery',
        passed: Array.isArray(tools),
        message: 'Registry tool discovery returns array',
      });
    } catch (error) {
      checks.push({
        check: 'Registry Tool Discovery',
        passed: false,
        message: `Registry tool discovery failed: ${error.message}`,
      });
    }
  }

  private isBrowserTool(target: any): target is IBrowserTool {
    return target && typeof target.execute === 'function' && typeof target.endpoint === 'string';
  }

  private isUIPanel(target: any): target is IUIPanel {
    return target && typeof target.render === 'function' && typeof target.selector === 'string';
  }

  private isToolRegistry(target: any): target is IToolRegistry {
    return target && typeof target.registerTool === 'function' && typeof target.discoverTools === 'function';
  }
}

/**
 * Performance Quality Gate
 *
 * Ensures components meet performance requirements for response time,
 * memory usage, and throughput.
 */
export class PerformanceQualityGate implements IQualityGate {
  readonly name = 'Performance';
  readonly description = 'Validates performance requirements for response time and resource usage';

  constructor(
    private logger: ILogger,
    private metrics: IMetrics
  ) {}

  async validate(target: any): Promise<{
    passed: boolean;
    score: number;
    details: Array<{
      check: string;
      passed: boolean;
      message: string;
    }>;
  }> {
    const checks: Array<{ check: string; passed: boolean; message: string }> = [];

    try {
      if (this.isBrowserTool(target)) {
        await this.validateToolPerformance(target, checks);
      } else if (this.isUIPanel(target)) {
        await this.validatePanelPerformance(target, checks);
      } else {
        checks.push({
          check: 'Performance Measurement',
          passed: false,
          message: 'Target type not supported for performance validation',
        });
      }

      const passedChecks = checks.filter(c => c.passed).length;
      const totalChecks = checks.length;
      const score = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
      const passed = score >= 80; // 80% pass rate for performance

      this.logger.info(`Performance validation completed`, {
        target: target.constructor?.name || 'Unknown',
        score,
        passed,
        passedChecks,
        totalChecks,
      });

      return { passed, score, details: checks };

    } catch (error) {
      this.logger.error('Performance validation failed', error);
      checks.push({
        check: 'Performance Validation',
        passed: false,
        message: `Performance validation failed: ${error.message}`,
      });

      return { passed: false, score: 0, details: checks };
    }
  }

  private async validateToolPerformance(tool: IBrowserTool, checks: Array<any>): Promise<void> {
    // Test response time
    const testParams = this.generateTestParams(tool.schema);
    const maxResponseTime = 5000; // 5 seconds max

    const startTime = Date.now();
    try {
      await tool.execute(testParams);
      const responseTime = Date.now() - startTime;

      checks.push({
        check: 'Response Time',
        passed: responseTime < maxResponseTime,
        message: `Tool responds in ${responseTime}ms (max: ${maxResponseTime}ms)`,
      });

      this.metrics.timing('quality_gate.tool.response_time', responseTime, {
        tool: tool.name,
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      checks.push({
        check: 'Response Time',
        passed: responseTime < maxResponseTime,
        message: `Tool execution failed but responded in ${responseTime}ms`,
      });
    }

    // Test concurrent execution capability
    try {
      const concurrentRequests = 5;
      const promises = Array(concurrentRequests).fill(null).map(() =>
        tool.execute(testParams)
      );

      const concurrentStartTime = Date.now();
      await Promise.allSettled(promises);
      const concurrentTime = Date.now() - concurrentStartTime;

      checks.push({
        check: 'Concurrent Execution',
        passed: concurrentTime < maxResponseTime * 2, // Allow 2x time for concurrent
        message: `Tool handles ${concurrentRequests} concurrent requests in ${concurrentTime}ms`,
      });

    } catch (error) {
      checks.push({
        check: 'Concurrent Execution',
        passed: false,
        message: `Concurrent execution test failed: ${error.message}`,
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

      checks.push({
        check: 'Memory Usage',
        passed: memoryIncrease < maxMemoryIncrease,
        message: `Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB (max: 50MB)`,
      });

    } catch (error) {
      checks.push({
        check: 'Memory Usage',
        passed: false,
        message: `Memory usage test failed: ${error.message}`,
      });
    }
  }

  private async validatePanelPerformance(panel: IUIPanel, checks: Array<any>): Promise<void> {
    // Test initialization time
    const maxInitTime = 2000; // 2 seconds max

    const initStartTime = Date.now();
    try {
      await panel.initialize();
      const initTime = Date.now() - initStartTime;

      checks.push({
        check: 'Initialization Time',
        passed: initTime < maxInitTime,
        message: `Panel initializes in ${initTime}ms (max: ${maxInitTime}ms)`,
      });

    } catch (error) {
      const initTime = Date.now() - initStartTime;
      checks.push({
        check: 'Initialization Time',
        passed: false,
        message: `Panel initialization failed in ${initTime}ms: ${error.message}`,
      });
    }

    // Test render time
    const maxRenderTime = 1000; // 1 second max

    const renderStartTime = Date.now();
    try {
      await panel.render();
      const renderTime = Date.now() - renderStartTime;

      checks.push({
        check: 'Render Time',
        passed: renderTime < maxRenderTime,
        message: `Panel renders in ${renderTime}ms (max: ${maxRenderTime}ms)`,
      });

    } catch (error) {
      const renderTime = Date.now() - renderStartTime;
      checks.push({
        check: 'Render Time',
        passed: false,
        message: `Panel render failed in ${renderTime}ms: ${error.message}`,
      });
    }

    // Test state update performance
    const maxUpdateTime = 500; // 500ms max

    const updateStartTime = Date.now();
    try {
      await panel.updateState({ testUpdate: true });
      const updateTime = Date.now() - updateStartTime;

      checks.push({
        check: 'State Update Time',
        passed: updateTime < maxUpdateTime,
        message: `Panel updates state in ${updateTime}ms (max: ${maxUpdateTime}ms)`,
      });

    } catch (error) {
      const updateTime = Date.now() - updateStartTime;
      checks.push({
        check: 'State Update Time',
        passed: false,
        message: `Panel state update failed in ${updateTime}ms: ${error.message}`,
      });
    }
  }

  private generateTestParams(schema: any): any {
    // Generate minimal valid parameters based on schema
    if (schema.type === 'object') {
      const params: any = {};

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

  private generateTestValue(schema: any): any {
    switch (schema.type) {
      case 'string':
        return 'test';
      case 'number':
        return 1;
      case 'boolean':
        return true;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }

  private isBrowserTool(target: any): target is IBrowserTool {
    return target && typeof target.execute === 'function';
  }

  private isUIPanel(target: any): target is IUIPanel {
    return target && typeof target.render === 'function';
  }
}

/**
 * Security Quality Gate
 *
 * Ensures components follow security best practices and don't introduce
 * vulnerabilities.
 */
export class SecurityQualityGate implements IQualityGate {
  readonly name = 'Security';
  readonly description = 'Validates security requirements and best practices';

  constructor(private logger: ILogger) {}

  async validate(target: any): Promise<{
    passed: boolean;
    score: number;
    details: Array<{
      check: string;
      passed: boolean;
      message: string;
    }>;
  }> {
    const checks: Array<{ check: string; passed: boolean; message: string }> = [];

    try {
      if (this.isBrowserTool(target)) {
        await this.validateToolSecurity(target, checks);
      } else if (this.isUIPanel(target)) {
        await this.validatePanelSecurity(target, checks);
      } else {
        checks.push({
          check: 'Security Validation',
          passed: false,
          message: 'Target type not supported for security validation',
        });
      }

      const passedChecks = checks.filter(c => c.passed).length;
      const totalChecks = checks.length;
      const score = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
      const passed = score >= 95; // 95% pass rate for security (high bar)

      this.logger.info(`Security validation completed`, {
        target: target.constructor?.name || 'Unknown',
        score,
        passed,
        passedChecks,
        totalChecks,
      });

      return { passed, score, details: checks };

    } catch (error) {
      this.logger.error('Security validation failed', error);
      checks.push({
        check: 'Security Validation',
        passed: false,
        message: `Security validation failed: ${error.message}`,
      });

      return { passed: false, score: 0, details: checks };
    }
  }

  private async validateToolSecurity(tool: IBrowserTool, checks: Array<any>): Promise<void> {
    // Check for parameter validation
    checks.push({
      check: 'Parameter Validation',
      passed: typeof tool.validate === 'function',
      message: 'Tool implements parameter validation',
    });

    // Test input sanitization
    const dangerousInputs = [
      '<script>alert("xss")</script>',
      '"; DROP TABLE users; --',
      '../../etc/passwd',
      'javascript:alert("xss")',
      '${7*7}',
      '{{7*7}}',
    ];

    let inputValidationPassed = true;
    let inputValidationMessage = 'Tool properly validates dangerous inputs';

    for (const input of dangerousInputs) {
      try {
        const validation = tool.validate({ maliciousInput: input });
        if (validation.valid) {
          inputValidationPassed = false;
          inputValidationMessage = `Tool accepts dangerous input: ${input}`;
          break;
        }
      } catch (error) {
        // Validation throwing error is acceptable for dangerous input
      }
    }

    checks.push({
      check: 'Input Sanitization',
      passed: inputValidationPassed,
      message: inputValidationMessage,
    });

    // Check for dangerous capabilities
    const capabilities = tool.capabilities;
    const hasDangerousCapabilities =
      capabilities && (capabilities as any).allowUnsafeOperations;

    checks.push({
      check: 'Safe Capabilities',
      passed: !hasDangerousCapabilities,
      message: hasDangerousCapabilities
        ? 'Tool has dangerous capabilities enabled'
        : 'Tool capabilities are safe',
    });

    // Check schema for security properties
    const schema = tool.schema;
    let schemaSecure = true;
    let schemaMessage = 'Schema follows security best practices';

    if (schema.additionalProperties !== false) {
      schemaSecure = false;
      schemaMessage = 'Schema allows additional properties (security risk)';
    }

    checks.push({
      check: 'Schema Security',
      passed: schemaSecure,
      message: schemaMessage,
    });
  }

  private async validatePanelSecurity(panel: IUIPanel, checks: Array<any>): Promise<void> {
    // Check for proper event handling
    checks.push({
      check: 'Event Handling',
      passed: typeof panel.handleEvents === 'function',
      message: 'Panel implements proper event handling',
    });

    // Check for state validation
    checks.push({
      check: 'State Validation',
      passed: typeof panel.updateState === 'function',
      message: 'Panel implements state validation',
    });

    // Test XSS prevention in rendering
    try {
      const maliciousState = {
        userInput: '<script>alert("xss")</script>',
        htmlContent: '<img src="x" onerror="alert(\'xss\')">',
      };

      await panel.updateState(maliciousState);
      const rendered = await panel.render();

      // Check if script tags are properly escaped
      const hasScriptTags = rendered.innerHTML?.includes('<script>') ||
                           rendered.outerHTML?.includes('<script>');

      checks.push({
        check: 'XSS Prevention',
        passed: !hasScriptTags,
        message: hasScriptTags
          ? 'Panel does not properly escape script tags'
          : 'Panel properly prevents XSS attacks',
      });

    } catch (error) {
      checks.push({
        check: 'XSS Prevention',
        passed: false,
        message: `XSS prevention test failed: ${error.message}`,
      });
    }
  }

  private isBrowserTool(target: any): target is IBrowserTool {
    return target && typeof target.execute === 'function';
  }

  private isUIPanel(target: any): target is IUIPanel {
    return target && typeof target.render === 'function';
  }
}

// ============================================================================
// Test Suite Implementation
// ============================================================================

/**
 * Comprehensive test suite for MANE components
 */
export class MANETestSuite implements ITestSuite {
  readonly name = 'MANE Component Test Suite';
  readonly description = 'Comprehensive testing for MANE browser tools and UI panels';

  private qualityGates: IQualityGate[] = [];

  constructor(
    private logger: ILogger,
    private metrics: IMetrics,
    private registry: IToolRegistry
  ) {
    this.setupQualityGates();
  }

  async run(): Promise<{
    passed: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: Array<{
      name: string;
      passed: boolean;
      error?: string;
      duration: number;
    }>;
  }> {
    this.logger.info('Starting MANE test suite execution');
    const results: Array<any> = [];
    let totalTests = 0;
    let passedTests = 0;

    // Test all registered tools
    const tools = this.registry.discoverTools();
    for (const tool of tools) {
      const toolResults = await this.testComponent(tool, `Tool: ${tool.name}`);
      results.push(...toolResults);
      totalTests += toolResults.length;
      passedTests += toolResults.filter(r => r.passed).length;
    }

    // Test the registry itself
    const registryResults = await this.testComponent(this.registry, 'Registry');
    results.push(...registryResults);
    totalTests += registryResults.length;
    passedTests += registryResults.filter(r => r.passed).length;

    const failedTests = totalTests - passedTests;
    const passed = failedTests === 0;

    this.logger.info('MANE test suite completed', {
      passed,
      totalTests,
      passedTests,
      failedTests,
    });

    this.metrics.gauge('test_suite.total_tests', totalTests);
    this.metrics.gauge('test_suite.passed_tests', passedTests);
    this.metrics.gauge('test_suite.failed_tests', failedTests);

    return {
      passed,
      totalTests,
      passedTests,
      failedTests,
      results,
    };
  }

  private async testComponent(component: any, componentName: string): Promise<Array<any>> {
    const results: Array<any> = [];

    for (const gate of this.qualityGates) {
      const startTime = Date.now();

      try {
        const gateResult = await gate.validate(component);
        const duration = Date.now() - startTime;

        results.push({
          name: `${componentName} - ${gate.name}`,
          passed: gateResult.passed,
          error: gateResult.passed ? undefined : `Score: ${gateResult.score}%, Failed checks: ${gateResult.details.filter(d => !d.passed).length}`,
          duration,
        });

        this.logger.debug(`Quality gate completed`, {
          component: componentName,
          gate: gate.name,
          passed: gateResult.passed,
          score: gateResult.score,
          duration,
        });

      } catch (error) {
        const duration = Date.now() - startTime;

        results.push({
          name: `${componentName} - ${gate.name}`,
          passed: false,
          error: error.message,
          duration,
        });

        this.logger.error(`Quality gate failed`, {
          component: componentName,
          gate: gate.name,
          error: error.message,
          duration,
        });
      }
    }

    return results;
  }

  private setupQualityGates(): void {
    this.qualityGates = [
      new InterfaceComplianceGate(this.logger, this.registry),
      new PerformanceQualityGate(this.logger, this.metrics),
      new SecurityQualityGate(this.logger),
    ];

    this.logger.info(`Configured ${this.qualityGates.length} quality gates`);
  }
}

// ============================================================================
// Quality Framework Factory
// ============================================================================

/**
 * Factory for creating complete quality framework
 */
export function createQualityFramework(
  logger: ILogger,
  metrics: IMetrics,
  registry: IToolRegistry
): {
  gates: IQualityGate[];
  testSuite: ITestSuite;
  runAllGates: (target: any) => Promise<boolean>;
} {
  const gates = [
    new InterfaceComplianceGate(logger, registry),
    new PerformanceQualityGate(logger, metrics),
    new SecurityQualityGate(logger),
  ];

  const testSuite = new MANETestSuite(logger, metrics, registry);

  const runAllGates = async (target: any): Promise<boolean> => {
    let allPassed = true;

    for (const gate of gates) {
      try {
        const result = await gate.validate(target);
        if (!result.passed) {
          allPassed = false;
          logger.warn(`Quality gate failed: ${gate.name}`, {
            target: target.constructor?.name || 'Unknown',
            score: result.score,
            failedChecks: result.details.filter(d => !d.passed).length,
          });
        }
      } catch (error) {
        allPassed = false;
        logger.error(`Quality gate error: ${gate.name}`, error);
      }
    }

    return allPassed;
  };

  return { gates, testSuite, runAllGates };
}

// Export all quality framework components
export {
  InterfaceComplianceGate,
  PerformanceQualityGate,
  SecurityQualityGate,
  MANETestSuite,
};