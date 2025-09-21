/**
 * 🦁 MANE XML Processor
 * Revolutionary XML-based configuration system for AI collaborative development
 *
 * Features:
 * - Load and validate MANE XML project configurations
 * - Extract batch-to-universe mappings for integration
 * - Generate integration commands dynamically
 * - Validate agent specifications and requirements
 * - Process essential context for agent onboarding
 */

const fs = require("fs").promises;
const xml2js = require("xml2js");
const { DOMParser } = require("xmldom");

class MANEXMLProcessor {
  constructor() {
    this.project = null;
    this.xmlData = null;
    this.validator = new XMLValidator();

    console.log("🦁 MANE XML Processor initialized");
  }

  /**
   * Load and validate MANE XML project configuration
   * @param {string} xmlPath - Path to the MANE XML file
   * @returns {Promise<Object>} Parsed and validated project configuration
   */
  async loadProject(xmlPath) {
    try {
      console.log(`📋 Loading MANE project from: ${xmlPath}`);

      const xmlContent = await fs.readFile(xmlPath, "utf-8");

      // Validate XML structure
      const validation = this.validator.validateStructure(xmlContent);
      if (!validation.isValid) {
        throw new Error(
          `Invalid MANE XML structure: ${validation.errors.join(", ")}`,
        );
      }

      // Parse XML to JavaScript object
      this.xmlData = xmlContent;
      this.project = await this.parseXML(xmlContent);

      console.log(
        `✅ MANE project loaded successfully: ${this.project.metadata.name}`,
      );
      console.log(
        `📊 Project status: ${this.project.metadata.methodology} with ${this.getAgentCount()} agents`,
      );

      return this.project;
    } catch (error) {
      console.error("❌ Failed to load MANE project:", error.message);
      throw error;
    }
  }

  /**
   * Parse XML content to JavaScript object
   * @param {string} xmlContent - Raw XML content
   * @returns {Promise<Object>} Parsed project object
   */
  async parseXML(xmlContent) {
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true,
    });

    try {
      const result = await parser.parseStringPromise(xmlContent);
      return this.normalizeProject(result["mane-project"]);
    } catch (error) {
      throw new Error(`XML parsing failed: ${error.message}`);
    }
  }

  /**
   * Normalize parsed XML structure for easier access
   * @param {Object} rawProject - Raw parsed XML project
   * @returns {Object} Normalized project structure
   */
  normalizeProject(rawProject) {
    // Ensure arrays are always arrays
    const normalize = (obj, arrayFields) => {
      arrayFields.forEach((field) => {
        if (obj[field] && !Array.isArray(obj[field])) {
          obj[field] = [obj[field]];
        }
      });
      return obj;
    };

    // Normalize agent universes
    if (
      rawProject["agent-universes"] &&
      rawProject["agent-universes"]["agent-universe"]
    ) {
      rawProject["agent-universes"]["agent-universe"] = Array.isArray(
        rawProject["agent-universes"]["agent-universe"],
      )
        ? rawProject["agent-universes"]["agent-universe"]
        : [rawProject["agent-universes"]["agent-universe"]];
    }

    // Normalize feature batches
    if (rawProject["feature-batches"] && rawProject["feature-batches"].batch) {
      rawProject["feature-batches"].batch = Array.isArray(
        rawProject["feature-batches"].batch,
      )
        ? rawProject["feature-batches"].batch
        : [rawProject["feature-batches"].batch];
    }

    return rawProject;
  }

  /**
   * Extract batch mapping for integration
   * @param {string|number} batchId - Batch ID to retrieve mapping for
   * @returns {Object} Batch mapping configuration
   */
  getBatchMapping(batchId) {
    if (!this.project) {
      throw new Error("No MANE project loaded. Call loadProject() first.");
    }

    const batchIdStr = batchId.toString();

    // Find batch in feature-batches
    const batch = this.project["feature-batches"].batch.find(
      (b) => b.id === `batch-${batchIdStr}`,
    );
    if (!batch) {
      throw new Error(`Batch ${batchIdStr} not found in project configuration`);
    }

    // Find corresponding batch mapping in integration config
    const integrationConfig = this.project["integration-config"];
    const batchMapping = integrationConfig["batch-mappings"][
      "batch-mapping"
    ].find((mapping) => mapping.batch === batchIdStr);

    if (!batchMapping) {
      throw new Error(
        `Batch mapping for batch ${batchIdStr} not found in integration configuration`,
      );
    }

    // Extract universe paths
    const universes = Array.isArray(batchMapping.universes.universe)
      ? batchMapping.universes.universe
      : [batchMapping.universes.universe];

    // Extract agent references
    const agentRefs = Array.isArray(batch.agents["agent-ref"])
      ? batch.agents["agent-ref"]
      : [batch.agents["agent-ref"]];

    return {
      batchId: batchIdStr,
      name: batch.name,
      description: batch.metadata.description,
      status: batch.metadata.status,
      priority: batch.metadata.priority,
      agents: agentRefs,
      universes: universes,
      strategy: batchMapping.strategy,
      integrationOrder: batchMapping["integration-order"],
      validationStrategy: batchMapping["validation-strategy"],
      dependencies: this.extractDependencies(batch),
      features: this.extractFeatures(batch),
      qualityGates: this.extractQualityGates(batchIdStr),
    };
  }

  /**
   * Extract agent universe configuration
   * @param {string} agentId - Agent universe ID
   * @returns {Object} Agent universe configuration
   */
  getAgentUniverse(agentId) {
    if (!this.project) {
      throw new Error("No MANE project loaded. Call loadProject() first.");
    }

    const agent = this.project["agent-universes"]["agent-universe"].find(
      (a) => a.id === agentId,
    );

    if (!agent) {
      throw new Error(`Agent universe ${agentId} not found`);
    }

    return {
      id: agent.id,
      batch: agent.batch,
      name: agent.metadata.name,
      emoji: agent.metadata.emoji,
      specialization: agent.metadata.specialization,
      priority: agent.metadata.priority,
      status: agent.metadata.status,
      capabilities: this.extractCapabilities(agent),
      targetTools: this.extractTargetTools(agent),
      workspace: agent.workspace,
      responsibilities: this.extractResponsibilities(agent),
      deliverables: this.extractDeliverables(agent),
    };
  }

  /**
   * Generate integration commands based on XML configuration
   * @param {string|number} batchId - Batch ID for integration
   * @param {Object} options - Integration options
   * @returns {Object} Generated integration commands
   */
  generateIntegrationCommands(batchId, options = {}) {
    const mapping = this.getBatchMapping(batchId);
    const {
      dryRun = false,
      verbose = false,
      createBackup = true,
      testFirst = true,
      strategy = mapping.strategy,
    } = options;

    const baseFlags = [
      dryRun ? "--dry-run" : null,
      verbose ? "--verbose" : null,
      createBackup ? "--create-backup" : null,
      testFirst ? "--test-universes" : null,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      discovery: `mane-discover --batch=${batchId} ${verbose ? "--verbose" : ""}`,
      validate: `mane-validate --batch=${batchId} --strategy=${strategy} ${verbose ? "--verbose" : ""}`,
      integrate: `mane-integrate batch=${batchId} --strategy=${strategy} ${baseFlags}`,
      test: `mane-test --batch=${batchId} --comprehensive ${verbose ? "--verbose" : ""}`,
      rollback: "mane-integrate --rollback",
      status: `mane-status --batch=${batchId}`,
    };
  }

  /**
   * Extract essential context for agent onboarding
   * @returns {Object} Essential context information
   */
  getEssentialContext() {
    if (!this.project) {
      throw new Error("No MANE project loaded. Call loadProject() first.");
    }

    const context = this.project["essential-context"];

    return {
      projectOverview: {
        purpose: context["project-overview"].purpose,
        goals: this.extractGoals(context["project-overview"].goals),
        constraints: this.extractConstraints(
          context["project-overview"].constraints,
        ),
        successMetrics: this.extractSuccessMetrics(context["project-overview"]),
      },
      technicalArchitecture: {
        communicationFlow: this.extractCommunicationFlow(
          context["technical-architecture"],
        ),
        keyFiles: this.extractKeyFiles(context["technical-architecture"]),
        keyContracts: this.extractKeyContracts(
          context["technical-architecture"],
        ),
        qualityGates: this.extractQualityGates(),
      },
      developmentContext: {
        currentStatus: this.extractCurrentStatus(
          context["development-context"],
        ),
        knownIssues: this.extractKnownIssues(context["development-context"]),
        architecturalDecisions: this.extractArchitecturalDecisions(
          context["development-context"],
        ),
      },
    };
  }

  /**
   * Generate user testing checklist from XML configuration
   * @param {string|number} batchId - Batch ID for testing
   * @returns {Object} User testing checklist
   */
  generateUserTestingChecklist(batchId) {
    const mapping = this.getBatchMapping(batchId);
    const agents = mapping.agents.map((agentRef) =>
      this.getAgentUniverse(agentRef),
    );

    const checklist = {
      batchId: mapping.batchId,
      batchName: mapping.name,
      description: mapping.description,
      estimatedDuration: this.calculateTestingDuration(agents),
      prerequisites: this.extractTestingPrerequisites(),
      testCategories: [],
    };

    // Generate tests for each agent's tools
    agents.forEach((agent) => {
      if (agent.targetTools) {
        const toolTests = this.generateToolTests(agent);
        checklist.testCategories.push({
          agentName: agent.name,
          agentEmoji: agent.emoji,
          tests: toolTests,
        });
      }
    });

    return checklist;
  }

  /**
   * Validate project configuration
   * @returns {Object} Validation results
   */
  validateProject() {
    if (!this.project) {
      throw new Error("No MANE project loaded. Call loadProject() first.");
    }

    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    // Validate required sections
    const requiredSections = [
      "metadata",
      "essential-context",
      "agent-universes",
      "feature-batches",
      "integration-config",
    ];
    requiredSections.forEach((section) => {
      if (!this.project[section]) {
        validation.errors.push(`Missing required section: ${section}`);
        validation.isValid = false;
      }
    });

    // Validate agent universe references
    const agentRefs = this.getAllAgentReferences();
    const agentUniverses = this.getAllAgentUniverses();

    agentRefs.forEach((ref) => {
      if (!agentUniverses.includes(ref)) {
        validation.errors.push(
          `Agent reference '${ref}' not found in agent-universes`,
        );
        validation.isValid = false;
      }
    });

    // Validate batch dependencies
    this.validateBatchDependencies(validation);

    // Validate integration mappings
    this.validateIntegrationMappings(validation);

    return validation;
  }

  // Helper methods for extraction and processing

  extractDependencies(batch) {
    if (
      !batch.metadata.prerequisites ||
      !batch.metadata.prerequisites.prerequisite
    )
      return [];
    const prereqs = batch.metadata.prerequisites.prerequisite;
    return Array.isArray(prereqs) ? prereqs : [prereqs];
  }

  extractFeatures(batch) {
    if (!batch.features || !batch.features.feature) return [];
    const features = batch.features.feature;
    return Array.isArray(features) ? features : [features];
  }

  extractCapabilities(agent) {
    if (!agent.capabilities || !agent.capabilities.capability) return [];
    const capabilities = agent.capabilities.capability;
    return Array.isArray(capabilities) ? capabilities : [capabilities];
  }

  extractTargetTools(agent) {
    if (!agent["target-tools"] || !agent["target-tools"].tool) return [];
    const tools = agent["target-tools"].tool;
    return Array.isArray(tools) ? tools : [tools];
  }

  extractResponsibilities(agent) {
    if (!agent.responsibilities || !agent.responsibilities.responsibility)
      return [];
    const responsibilities = agent.responsibilities.responsibility;
    return Array.isArray(responsibilities)
      ? responsibilities
      : [responsibilities];
  }

  extractDeliverables(agent) {
    if (!agent.deliverables || !agent.deliverables.deliverable) return [];
    const deliverables = agent.deliverables.deliverable;
    return Array.isArray(deliverables) ? deliverables : [deliverables];
  }

  extractQualityGates(batchId = null) {
    const gates = this.project["integration-config"]["quality-gates"].gate;
    const gateArray = Array.isArray(gates) ? gates : [gates];

    if (!batchId) return gateArray;

    return gateArray.filter((gate) => {
      if (gate["applies-to"] === "all-batches") return true;
      if (gate["applies-to"].batch) {
        const applicableBatches = Array.isArray(gate["applies-to"].batch)
          ? gate["applies-to"].batch
          : [gate["applies-to"].batch];
        return applicableBatches.includes(batchId);
      }
      return false;
    });
  }

  extractGoals(goals) {
    if (!goals || !goals.goal) return [];
    const goalArray = Array.isArray(goals.goal) ? goals.goal : [goals.goal];
    return goalArray.map((goal) => ({
      id: goal.id,
      priority: goal.priority,
      description: goal._,
    }));
  }

  extractConstraints(constraints) {
    if (!constraints || !constraints.constraint) return [];
    const constraintArray = Array.isArray(constraints.constraint)
      ? constraints.constraint
      : [constraints.constraint];
    return constraintArray.map((constraint) => ({
      type: constraint.type,
      description: constraint._,
    }));
  }

  extractSuccessMetrics(overview) {
    if (!overview["success-metrics"] || !overview["success-metrics"].metric)
      return [];
    const metrics = overview["success-metrics"].metric;
    return Array.isArray(metrics) ? metrics : [metrics];
  }

  extractCommunicationFlow(architecture) {
    if (
      !architecture["communication-flow"] ||
      !architecture["communication-flow"].step
    )
      return [];
    const steps = architecture["communication-flow"].step;
    return Array.isArray(steps) ? steps : [steps];
  }

  extractKeyFiles(architecture) {
    if (!architecture["key-files"] || !architecture["key-files"].file)
      return [];
    const files = architecture["key-files"].file;
    return Array.isArray(files) ? files : [files];
  }

  extractKeyContracts(architecture) {
    if (
      !architecture["key-contracts"] ||
      !architecture["key-contracts"].contract
    )
      return [];
    const contracts = architecture["key-contracts"].contract;
    return Array.isArray(contracts) ? contracts : [contracts];
  }

  extractCurrentStatus(devContext) {
    return devContext["current-status"];
  }

  extractKnownIssues(devContext) {
    if (!devContext["known-issues"] || !devContext["known-issues"].issue)
      return [];
    const issues = devContext["known-issues"].issue;
    return Array.isArray(issues) ? issues : [issues];
  }

  extractArchitecturalDecisions(devContext) {
    if (
      !devContext["architectural-decisions"] ||
      !devContext["architectural-decisions"].decision
    )
      return [];
    const decisions = devContext["architectural-decisions"].decision;
    return Array.isArray(decisions) ? decisions : [decisions];
  }

  extractTestingPrerequisites() {
    return [
      "HTTP Bridge running on port 3024",
      "Chrome Extension active in DevTools",
      "Browser Tools tab visible and connected",
      "Test environment configured",
    ];
  }

  generateToolTests(agent) {
    const tests = [];

    if (agent.targetTools) {
      agent.targetTools.forEach((tool) => {
        tests.push({
          toolName: tool.name,
          mcpToolName: tool["mcp-tool-name"],
          description: tool.description,
          status: tool.status,
          testStatus: tool["test-status"],
          knownIssues: tool["known-issues"] ? tool["known-issues"].issue : [],
          testCommands: this.generateTestCommands(tool),
          debugGuidance: this.generateDebugGuidance(tool),
        });
      });
    }

    return tests;
  }

  generateTestCommands(tool) {
    const commands = {
      [tool.name]: {
        description: `Test ${tool.name} functionality`,
        command:
          tool["mcp-tool-name"] ||
          `mcp__mcp-claude-code-browser-tools__${tool.name}`,
        expectedResult: this.getExpectedResult(tool.name),
        debugSteps: this.getDebugSteps(tool.name),
      },
    };

    return commands;
  }

  generateDebugGuidance(tool) {
    const commonGuidance = [
      "Check Chrome DevTools console for JavaScript errors",
      "Verify WebSocket connection status in Browser Tools tab",
      "Confirm HTTP bridge is running on correct port",
      "Test with simple, known-working elements first",
    ];

    const toolSpecificGuidance = {
      browser_navigate: [
        "Verify URL format and accessibility",
        "Check for protocol restrictions (https/http only)",
        "Test with simple domains like example.com first",
      ],
      browser_screenshot: [
        "Check .screenshots/ directory exists and is writable",
        "Verify WebSocket timeout settings",
        "Test with smaller page content first",
      ],
      browser_click: [
        "Verify CSS selector accuracy and uniqueness",
        "Test with visible, clickable elements",
        "Check element is not covered by other elements",
      ],
      browser_type: [
        "Ensure input field is focusable and editable",
        "Test clear option separately from text entry",
        "Verify input field selector specificity",
      ],
      browser_wait: [
        "Adjust timeout values for slower elements",
        "Test with existing elements first",
        "Verify selector matches expected element",
      ],
    };

    return [...commonGuidance, ...(toolSpecificGuidance[tool.name] || [])];
  }

  getExpectedResult(toolName) {
    const expectedResults = {
      browser_navigate:
        "Page loads successfully, navigation status shows 'connected'",
      browser_screenshot:
        "Screenshot saved with smart filename in .screenshots/ directory",
      browser_click: "Element clicked successfully, no error messages",
      browser_type: "Text entered successfully into input field",
      browser_wait: "Element detected within timeout period",
      browser_evaluate: "JavaScript executed successfully with returned result",
      browser_audit: "Lighthouse audit completed with JSON results",
      browser_get_console: "Console logs retrieved successfully",
      browser_get_content: "Page content extracted in specified format",
    };

    return (
      expectedResults[toolName] || "Tool executed successfully without errors"
    );
  }

  getDebugSteps(toolName) {
    const debugSteps = {
      browser_navigate: [
        "Check network connectivity to target URL",
        "Verify Chrome tab permissions and focus",
        "Test with different URL formats",
      ],
      browser_screenshot: [
        "Check file system permissions for .screenshots/ directory",
        "Monitor WebSocket messages for timeout issues",
        "Test screenshot capture in different browser states",
      ],
      browser_evaluate: [
        "Test with simple JavaScript expressions first",
        "Check for security restrictions in execution context",
        "Monitor execution timeout and memory usage",
      ],
    };

    return (
      debugSteps[toolName] || [
        "Enable debug logging with MCP_DEBUG=1",
        "Check tool-specific error messages",
        "Test with minimal input parameters",
      ]
    );
  }

  calculateTestingDuration(agents) {
    const baseTimePerAgent = 5; // minutes
    const complexityMultiplier = {
      "agent-a-foundation": 1.5,
      "agent-f-framework": 1.2,
      "agent-g-navigation": 1.0,
      "agent-h-screenshot": 1.3,
      "agent-i-interaction": 1.4,
      "agent-b-evaluate": 2.0,
      "agent-c-audit": 1.8,
      "agent-d-console": 1.6,
      "agent-e-content": 1.5,
    };

    const totalTime = agents.reduce((time, agent) => {
      const multiplier = complexityMultiplier[agent.id] || 1.0;
      return time + baseTimePerAgent * multiplier;
    }, 0);

    return `${Math.ceil(totalTime)}-${Math.ceil(totalTime * 1.3)} minutes`;
  }

  getAllAgentReferences() {
    const refs = [];
    this.project["feature-batches"].batch.forEach((batch) => {
      if (batch.agents && batch.agents["agent-ref"]) {
        const agentRefs = Array.isArray(batch.agents["agent-ref"])
          ? batch.agents["agent-ref"]
          : [batch.agents["agent-ref"]];
        refs.push(...agentRefs);
      }
    });
    return refs;
  }

  getAllAgentUniverses() {
    return this.project["agent-universes"]["agent-universe"].map(
      (agent) => agent.id,
    );
  }

  validateBatchDependencies(validation) {
    const batches = this.project["feature-batches"].batch;
    const batchIds = batches.map((b) => b.id);

    batches.forEach((batch) => {
      if (batch.metadata.prerequisites) {
        const deps = this.extractDependencies(batch);
        deps.forEach((dep) => {
          if (!batchIds.includes(dep)) {
            validation.errors.push(
              `Batch ${batch.id} has invalid dependency: ${dep}`,
            );
            validation.isValid = false;
          }
        });
      }
    });
  }

  validateIntegrationMappings(validation) {
    const batches = this.project["feature-batches"].batch.map((b) => b.id);
    const mappings =
      this.project["integration-config"]["batch-mappings"]["batch-mapping"];
    const mappingArray = Array.isArray(mappings) ? mappings : [mappings];

    mappingArray.forEach((mapping) => {
      const batchId = `batch-${mapping.batch}`;
      if (!batches.includes(batchId)) {
        validation.errors.push(
          `Integration mapping for non-existent batch: ${mapping.batch}`,
        );
        validation.isValid = false;
      }
    });
  }

  getAgentCount() {
    return this.project["agent-universes"]["agent-universe"].length;
  }

  getBatchCount() {
    return this.project["feature-batches"].batch.length;
  }

  getProjectStatus() {
    const batches = this.project["feature-batches"].batch;
    const completed = batches.filter(
      (b) => b.metadata.status === "completed",
    ).length;
    const total = batches.length;
    const percentage = Math.round((completed / total) * 100);

    return {
      totalBatches: total,
      completedBatches: completed,
      completionPercentage: percentage,
      currentPhase: this.getCurrentPhase(),
      nextMilestone: this.getNextMilestone(),
    };
  }

  getCurrentPhase() {
    const batches = this.project["feature-batches"].batch;
    const inProgress = batches.find((b) => b.metadata.status === "in-progress");
    return inProgress ? inProgress.name : "Planning";
  }

  getNextMilestone() {
    const batches = this.project["feature-batches"].batch;
    const pending = batches.find((b) => b.metadata.status === "pending");
    return pending ? pending.name : "Project Complete";
  }
}

/**
 * XML Validator for MANE project files
 */
class XMLValidator {
  constructor() {
    this.requiredElements = [
      "mane-project",
      "metadata",
      "essential-context",
      "agent-universes",
      "feature-batches",
      "integration-config",
    ];
  }

  validateStructure(xmlContent) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, "text/xml");

      // Check for parsing errors
      const parserErrors = doc.getElementsByTagName("parsererror");
      if (parserErrors.length > 0) {
        validation.isValid = false;
        validation.errors.push("XML parsing error: Invalid XML syntax");
        return validation;
      }

      // Validate required elements
      this.requiredElements.forEach((element) => {
        const elements = doc.getElementsByTagName(element);
        if (elements.length === 0) {
          validation.errors.push(`Missing required element: ${element}`);
          validation.isValid = false;
        }
      });

      // Validate namespace
      const root = doc.documentElement;
      if (
        root.getAttribute("xmlns") !== "https://mane-methodology.dev/schema/v1"
      ) {
        validation.warnings.push("Missing or incorrect namespace declaration");
      }

      // Validate version
      if (!root.getAttribute("version")) {
        validation.warnings.push("Missing version attribute on root element");
      }
    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`XML validation error: ${error.message}`);
    }

    return validation;
  }
}

module.exports = { MANEXMLProcessor, XMLValidator };

console.log("🦁 MANE XML Processor loaded successfully");
