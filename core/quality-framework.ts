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
  IToolRegistry,
  ILogger,
  IMetrics,
} from './interfaces.js';

// Import modular quality gates
import { InterfaceComplianceGate } from './gates/interface-compliance.js';
import { PerformanceQualityGate } from './gates/performance-quality.js';
import { SecurityQualityGate } from './gates/security-quality.js';

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
        const gateResult = await gate.execute(component);
        const duration = Date.now() - startTime;

        results.push({
          name: `${componentName} - ${gate.name}`,
          passed: gateResult.valid,
          error: gateResult.valid ? undefined : `Score: ${gateResult.score}%, Failed checks: ${gateResult.errors.length}`,
          duration,
        });

        this.logger.debug(`Quality gate completed`, {
          component: componentName,
          gate: gate.name,
          passed: gateResult.valid,
          score: gateResult.score,
          duration,
        });

      } catch (error) {
        const duration = Date.now() - startTime;

        results.push({
          name: `${componentName} - ${gate.name}`,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
          duration,
        });

        this.logger.error(`Quality gate failed`, {
          component: componentName,
          gate: gate.name,
          error: error instanceof Error ? error.message : String(error),
          duration,
        });
      }
    }

    return results;
  }

  private setupQualityGates(): void {
    this.qualityGates = [
      new InterfaceComplianceGate(this.registry, this.logger, this.metrics),
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
    new InterfaceComplianceGate(registry, logger, metrics),
    new PerformanceQualityGate(logger, metrics),
    new SecurityQualityGate(logger),
  ];

  const testSuite = new MANETestSuite(logger, metrics, registry);

  const runAllGates = async (target: any): Promise<boolean> => {
    let allPassed = true;

    for (const gate of gates) {
      try {
        const result = await gate.execute(target);
        if (!result.valid) {
          allPassed = false;
          logger.warn(`Quality gate failed: ${gate.name}`, {
            target: target.constructor?.name || 'Unknown',
            score: result.score,
            failedChecks: result.errors.length,
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