/**
 * 🦁 MANE Interface Compliance Quality Gate
 *
 * Ensures all tools and panels properly implement their required interfaces
 * and can be successfully registered and discovered.
 */

import {
  IQualityGate,
  IBrowserTool,
  IUIPanel,
  IToolRegistry,
  ILogger,
  IMetrics,
  ValidationResult,
} from "../interfaces.js";

/**
 * Interface Compliance Quality Gate
 *
 * Validates that MANE components properly implement their required interfaces.
 * This gate ensures parallel agent development is possible by verifying that
 * all components follow consistent interface contracts.
 *
 * @implements {IQualityGate}
 *
 * **Validation Scope:**
 * - Browser tool interface compliance (IBrowserTool)
 * - UI panel interface compliance (IUIPanel)
 * - Registry integration capability
 * - Method signature validation
 * - Property requirement verification
 *
 * **Agent Usage:**
 * - Agent B-I: Use before deploying specialized tools
 * - Agent A.2: Use during foundation enhancement
 * - Integration workflows: Use before universe merging
 *
 * **Pass Criteria:** 90% of interface checks must pass
 */
export class InterfaceComplianceGate implements IQualityGate {
  /** Quality gate identifier used in MANE workflows */
  name = "interface-compliance";

  /** Human-readable description for logging and reports */
  description =
    "Validates interface implementation compliance for browser tools and UI panels";

  /** Minimum pass rate required (0.90 = 90% of tests must pass) */
  requiredPassRate = 0.9;

  /**
   * Creates new interface compliance gate
   *
   * @param registry - Tool registry for integration testing
   * @param logger - Logging service for validation tracking
   * @param metrics - Metrics collection for performance monitoring
   */
  constructor(
    private registry: IToolRegistry,
    private logger: ILogger,
    private metrics: IMetrics,
  ) {}

  /**
   * Executes interface compliance validation on a target component
   *
   * **Validation Process:**
   * 1. Identifies target type (Browser Tool, UI Panel, or unknown)
   * 2. Runs type-specific validation tests
   * 3. Calculates pass rate and score
   * 4. Reports metrics and detailed results
   *
   * **For Agent Developers:**
   * - Browser tools must implement IBrowserTool interface
   * - UI panels must implement IUIPanel interface
   * - Components must pass 90% of interface tests
   * - Registry integration is validated for discoverability
   *
   * @param target - Component to validate (tool, panel, or other)
   * @returns Promise resolving to validation result with score and errors
   *
   * @example
   * ```typescript
   * const gate = new InterfaceComplianceGate(registry, logger, metrics);
   * const result = await gate.execute(myBrowserTool);
   * if (result.valid) {
   *   console.log(`✓ Tool passed with score: ${result.score}%`);
   * }
   * ```
   */
  async execute(target: unknown): Promise<ValidationResult> {
    this.logger.info(
      `Running interface compliance validation for: ${this.getTargetName(target)}`,
    );

    const startTime = Date.now();
    const results: any[] = [];

    try {
      if (this.isBrowserTool(target)) {
        results.push(...(await this.validateBrowserTool(target)));
      } else if (this.isUIPanel(target)) {
        results.push(...(await this.validateUIPanel(target)));
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
      this.metrics.timing(
        "quality_gate.interface_compliance.duration",
        duration,
      );
      this.metrics.gauge("quality_gate.interface_compliance.score", score);

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
      this.logger.error("Interface compliance validation failed", error);
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
   * Validates browser tool interface compliance
   *
   * **Tests Performed:**
   * - Required properties: name, endpoint, description, schema, capabilities
   * - Required methods: execute(), validate(), getStatus()
   * - Method functionality: status returns, validation works
   * - Registry integration: registration and discovery
   *
   * **Agent Usage:**
   * Use this to validate tools before deployment in Agent B-I workflows
   *
   * @param tool - Browser tool implementing IBrowserTool
   * @returns Array of test results with pass/fail status
   *
   * @private
   */
  private async validateBrowserTool(tool: IBrowserTool): Promise<any[]> {
    const results = [];

    // Test required properties
    const requiredProps = [
      "name",
      "endpoint",
      "description",
      "schema",
      "capabilities",
    ];
    for (const prop of requiredProps) {
      results.push({
        test: `has-property-${prop}`,
        passed: prop in tool,
        message: prop in tool ? `✓ Has ${prop}` : `✗ Missing ${prop}`,
        category: "required-properties",
      });
    }

    // Test required methods
    const requiredMethods = ["execute", "validate", "getStatus"];
    for (const method of requiredMethods) {
      const hasMethod = typeof tool[method] === "function";
      results.push({
        test: `has-method-${method}`,
        passed: hasMethod,
        message: hasMethod ? `✓ Has ${method}()` : `✗ Missing ${method}()`,
        category: "required-methods",
      });
    }

    // Test method functionality
    try {
      const status = await tool.getStatus();
      results.push({
        test: "getStatus-functionality",
        passed: typeof status === "object" && "healthy" in status,
        message:
          typeof status === "object" && "healthy" in status
            ? "✓ getStatus() returns valid status object"
            : "✗ getStatus() does not return valid status object",
        category: "method-functionality",
      });
    } catch (error) {
      results.push({
        test: "getStatus-functionality",
        passed: false,
        message: `✗ getStatus() throws error: ${error instanceof Error ? error.message : String(error)}`,
        category: "method-functionality",
      });
    }

    try {
      const validationResult = await tool.validate({});
      results.push({
        test: "validate-functionality",
        passed:
          typeof validationResult === "object" && "valid" in validationResult,
        message:
          typeof validationResult === "object" && "valid" in validationResult
            ? "✓ validate() returns validation result"
            : "✗ validate() does not return validation result",
        category: "method-functionality",
      });
    } catch (error) {
      results.push({
        test: "validate-functionality",
        passed: false,
        message: `✗ validate() throws error: ${error instanceof Error ? error.message : String(error)}`,
        category: "method-functionality",
      });
    }

    // Test registry integration
    try {
      await this.registry.registerTool(tool);
      results.push({
        test: "registry-registration",
        passed: true,
        message: "✓ Tool can be registered with registry",
        category: "registry-integration",
      });

      const discoveredTools = this.registry.discoverTools({
        category: tool.name.split("_")[0],
      });
      const isDiscoverable = discoveredTools.some((t) => t.name === tool.name);
      results.push({
        test: "registry-discovery",
        passed: isDiscoverable,
        message: isDiscoverable
          ? "✓ Tool can be discovered through registry"
          : "✗ Tool cannot be discovered",
        category: "registry-integration",
      });
    } catch (error) {
      results.push({
        test: "registry-registration",
        passed: false,
        message: `✗ Registry registration failed: ${error instanceof Error ? error.message : String(error)}`,
        category: "registry-integration",
      });
    }

    return results;
  }

  /**
   * Validates UI panel interface compliance
   *
   * **Tests Performed:**
   * - Required properties: id, selector, title
   * - Required methods: initialize(), render(), handleEvents(), updateState(), destroy()
   * - Method functionality: initialization and rendering work correctly
   *
   * **Agent Usage:**
   * Use this for Agent F (UI panels) and Agent G (screenshot) components
   *
   * @param panel - UI panel implementing IUIPanel
   * @returns Array of test results with pass/fail status
   *
   * @private
   */
  private async validateUIPanel(panel: IUIPanel): Promise<any[]> {
    const results = [];

    // Test required properties
    const requiredProps = ["id", "selector", "title"];
    for (const prop of requiredProps) {
      results.push({
        test: `has-property-${prop}`,
        passed: prop in panel,
        message: prop in panel ? `✓ Has ${prop}` : `✗ Missing ${prop}`,
        category: "required-properties",
      });
    }

    // Test required methods
    const requiredMethods = [
      "initialize",
      "render",
      "handleEvents",
      "updateState",
      "destroy",
    ];
    for (const method of requiredMethods) {
      const hasMethod = typeof panel[method] === "function";
      results.push({
        test: `has-method-${method}`,
        passed: hasMethod,
        message: hasMethod ? `✓ Has ${method}()` : `✗ Missing ${method}()`,
        category: "required-methods",
      });
    }

    // Test method functionality
    try {
      await panel.initialize();
      results.push({
        test: "initialize-functionality",
        passed: true,
        message: "✓ initialize() executes without error",
        category: "method-functionality",
      });
    } catch (error) {
      results.push({
        test: "initialize-functionality",
        passed: false,
        message: `✗ initialize() throws error: ${error instanceof Error ? error.message : String(error)}`,
        category: "method-functionality",
      });
    }

    try {
      const element = await panel.render();
      const isValidElement = element && typeof element === "object";
      results.push({
        test: "render-functionality",
        passed: isValidElement,
        message: isValidElement
          ? "✓ render() returns HTML element"
          : "✗ render() does not return valid element",
        category: "method-functionality",
      });
    } catch (error) {
      results.push({
        test: "render-functionality",
        passed: false,
        message: `✗ render() throws error: ${error instanceof Error ? error.message : String(error)}`,
        category: "method-functionality",
      });
    }

    return results;
  }

  private isBrowserTool(target: unknown): target is IBrowserTool {
    return (
      target !== null &&
      typeof target === "object" &&
      "execute" in target &&
      "validate" in target &&
      "getStatus" in target
    );
  }

  private isUIPanel(target: unknown): target is IUIPanel {
    return (
      target !== null &&
      typeof target === "object" &&
      "render" in target &&
      "initialize" in target
    );
  }

  private getTargetName(target: unknown): string {
    if (target && typeof target === "object" && "name" in target) {
      return String(target.name);
    }
    if (target && typeof target === "object" && "id" in target) {
      return String(target.id);
    }
    return "unknown";
  }
}
