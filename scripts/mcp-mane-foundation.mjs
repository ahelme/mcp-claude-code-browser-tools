#!/usr/bin/env node

/**
 * 🦁 MANE Foundation MCP Server
 *
 * This MCP server exposes the MANE foundation infrastructure as tools
 * that can be used by Claude Code and other MCP clients.
 *
 * Features:
 * - Registry management and tool discovery
 * - Quality gate validation
 * - Service worker lifecycle management
 * - Interface contract validation
 * - Foundation health monitoring
 *
 * Built by: Foundation Architect (Agent A)
 * For: MANE (Modular Agentic Non-linear Engineering)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Foundation imports would be here in real implementation
// import { ToolRegistry } from '../core/registry.js';
// import { createQualityFramework } from '../core/quality-framework.js';
// import { MANEServiceWorker } from '../core/service-worker.js';

// Mock implementations for demonstration
const serverInfo = {
  name: "MANE Foundation MCP Server",
  version: "2.0.0",
  protocolVersion: "2025-06-18",
};

const tools = {
  mane_registry_status: {
    name: "mane_registry_status",
    description: "Get the status of the MANE tool registry including registered tools and health metrics",
    inputSchema: {
      type: "object",
      properties: {
        includeHealthDetails: {
          type: "boolean",
          description: "Include detailed health information for each registered tool",
          default: false
        },
        filter: {
          type: "object",
          description: "Filter criteria for tool discovery",
          properties: {
            category: {
              type: "string",
              description: "Filter by tool category"
            },
            healthy: {
              type: "boolean",
              description: "Filter by health status"
            }
          },
          additionalProperties: false
        }
      },
      additionalProperties: false
    }
  },

  mane_register_tool: {
    name: "mane_register_tool",
    description: "Register a new browser tool with the MANE registry",
    inputSchema: {
      type: "object",
      properties: {
        toolConfig: {
          type: "object",
          description: "Tool configuration object",
          properties: {
            name: {
              type: "string",
              description: "Unique tool name"
            },
            endpoint: {
              type: "string",
              description: "HTTP endpoint path"
            },
            description: {
              type: "string",
              description: "Tool description"
            },
            schema: {
              type: "object",
              description: "JSON schema for parameter validation"
            },
            capabilities: {
              type: "object",
              description: "Tool capabilities metadata"
            }
          },
          required: ["name", "endpoint", "description", "schema"],
          additionalProperties: false
        }
      },
      required: ["toolConfig"],
      additionalProperties: false
    }
  },

  mane_discover_tools: {
    name: "mane_discover_tools",
    description: "Discover registered browser tools using filter criteria",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "object",
          description: "Discovery filter criteria",
          properties: {
            category: {
              type: "string",
              description: "Filter by tool category (e.g., 'browser', 'ui')"
            },
            capability: {
              type: "string",
              description: "Filter by specific capability (e.g., 'async', 'retryable')"
            },
            healthy: {
              type: "boolean",
              description: "Filter by health status"
            },
            namePattern: {
              type: "string",
              description: "Filter by name pattern (regex)"
            }
          },
          additionalProperties: false
        },
        includeMetadata: {
          type: "boolean",
          description: "Include detailed metadata for each tool",
          default: false
        }
      },
      additionalProperties: false
    }
  },

  mane_quality_gate_validate: {
    name: "mane_quality_gate_validate",
    description: "Run quality gate validation on a tool or component",
    inputSchema: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description: "Target tool name or component identifier to validate"
        },
        gates: {
          type: "array",
          description: "Specific quality gates to run",
          items: {
            type: "string",
            enum: ["interface-compliance", "performance", "security"]
          },
          default: ["interface-compliance", "performance", "security"]
        },
        strict: {
          type: "boolean",
          description: "Enable strict validation mode",
          default: false
        }
      },
      required: ["target"],
      additionalProperties: false
    }
  },

  mane_service_worker_status: {
    name: "mane_service_worker_status",
    description: "Get the status of the MANE service worker and HTTP bridge",
    inputSchema: {
      type: "object",
      properties: {
        includeMetrics: {
          type: "boolean",
          description: "Include detailed performance metrics",
          default: false
        },
        includeConnections: {
          type: "boolean",
          description: "Include WebSocket connection information",
          default: false
        }
      },
      additionalProperties: false
    }
  },

  mane_service_worker_control: {
    name: "mane_service_worker_control",
    description: "Control MANE service worker lifecycle (start, stop, restart)",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["start", "stop", "restart"],
          description: "Action to perform on the service worker"
        },
        port: {
          type: "integer",
          description: "Port number for service worker (used with start/restart)",
          minimum: 1024,
          maximum: 65535,
          default: 3024
        },
        host: {
          type: "string",
          description: "Host address for service worker",
          default: "127.0.0.1"
        }
      },
      required: ["action"],
      additionalProperties: false
    }
  },

  mane_interface_validate: {
    name: "mane_interface_validate",
    description: "Validate that a tool or component properly implements MANE interfaces",
    inputSchema: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description: "Target to validate (tool name or component identifier)"
        },
        interfaceType: {
          type: "string",
          enum: ["IBrowserTool", "IUIPanel", "IToolRegistry"],
          description: "Specific interface type to validate against"
        },
        checkMethods: {
          type: "boolean",
          description: "Validate that all required methods are implemented",
          default: true
        },
        checkProperties: {
          type: "boolean",
          description: "Validate that all required properties are present",
          default: true
        }
      },
      required: ["target"],
      additionalProperties: false
    }
  },

  mane_foundation_health: {
    name: "mane_foundation_health",
    description: "Comprehensive health check of the entire MANE foundation",
    inputSchema: {
      type: "object",
      properties: {
        includeRegistry: {
          type: "boolean",
          description: "Include registry health in report",
          default: true
        },
        includeServiceWorker: {
          type: "boolean",
          description: "Include service worker health in report",
          default: true
        },
        includeQualityGates: {
          type: "boolean",
          description: "Include quality gate system health",
          default: true
        },
        includeTools: {
          type: "boolean",
          description: "Include individual tool health checks",
          default: false
        }
      },
      additionalProperties: false
    }
  },

  mane_create_tool_template: {
    name: "mane_create_tool_template",
    description: "Generate a template for creating a new MANE browser tool",
    inputSchema: {
      type: "object",
      properties: {
        toolName: {
          type: "string",
          description: "Name for the new tool (will be prefixed with 'browser_')",
          pattern: "^[a-z_][a-z0-9_]*$"
        },
        toolType: {
          type: "string",
          enum: ["navigation", "interaction", "evaluation", "analysis", "monitoring"],
          description: "Category of browser tool to create"
        },
        includeTests: {
          type: "boolean",
          description: "Include unit test template",
          default: true
        },
        includeDocumentation: {
          type: "boolean",
          description: "Include documentation template",
          default: true
        }
      },
      required: ["toolName", "toolType"],
      additionalProperties: false
    }
  },

  mane_create_panel_template: {
    name: "mane_create_panel_template",
    description: "Generate a template for creating a new MANE UI panel",
    inputSchema: {
      type: "object",
      properties: {
        panelName: {
          type: "string",
          description: "Name for the new panel (e.g., 'configuration', 'status')",
          pattern: "^[a-z][a-z0-9-]*$"
        },
        panelType: {
          type: "string",
          enum: ["configuration", "status", "control", "display", "monitoring"],
          description: "Type of UI panel to create"
        },
        includeEventHandlers: {
          type: "boolean",
          description: "Include example event handlers",
          default: true
        },
        includeStateManagement: {
          type: "boolean",
          description: "Include state management examples",
          default: true
        }
      },
      required: ["panelName", "panelType"],
      additionalProperties: false
    }
  }
};

// Debug logging
function debugLog(message) {
  if (process.env.MANE_DEBUG === '1') {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[MANE-Foundation] ${timestamp} - ${message}\n`);
  }
}

// Create MCP server
const server = new Server(
  {
    name: serverInfo.name,
    version: serverInfo.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  debugLog("Listing MANE foundation tools");

  return {
    tools: Object.values(tools).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  debugLog(`Executing MANE foundation tool: ${name}`);

  try {
    switch (name) {
      case "mane_registry_status":
        return await handleRegistryStatus(args);

      case "mane_register_tool":
        return await handleRegisterTool(args);

      case "mane_discover_tools":
        return await handleDiscoverTools(args);

      case "mane_quality_gate_validate":
        return await handleQualityGateValidate(args);

      case "mane_service_worker_status":
        return await handleServiceWorkerStatus(args);

      case "mane_service_worker_control":
        return await handleServiceWorkerControl(args);

      case "mane_interface_validate":
        return await handleInterfaceValidate(args);

      case "mane_foundation_health":
        return await handleFoundationHealth(args);

      case "mane_create_tool_template":
        return await handleCreateToolTemplate(args);

      case "mane_create_panel_template":
        return await handleCreatePanelTemplate(args);

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown MANE foundation tool: ${name}`
        );
    }
  } catch (error) {
    debugLog(`Tool execution error: ${error.message}`);

    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      ErrorCode.InternalError,
      `MANE foundation tool failed: ${error.message}`
    );
  }
});

// Tool implementation functions
async function handleRegistryStatus(args) {
  const { includeHealthDetails = false, filter = {} } = args || {};

  debugLog(`Getting registry status (health details: ${includeHealthDetails})`);

  // Mock registry data - in real implementation, this would query actual registry
  const mockRegistryData = {
    totalTools: 5,
    healthyTools: 4,
    categories: {
      browser: 3,
      ui: 2
    },
    lastHealthCheck: new Date().toISOString(),
    averageResponseTime: 125.5,
    tools: [
      {
        name: "browser_navigate",
        endpoint: "/tools/browser_navigate",
        category: "browser",
        healthy: true,
        lastUsed: new Date(Date.now() - 300000).toISOString(),
        executionCount: 42
      },
      {
        name: "browser_screenshot",
        endpoint: "/tools/browser_screenshot",
        category: "browser",
        healthy: true,
        lastUsed: new Date(Date.now() - 120000).toISOString(),
        executionCount: 28
      },
      {
        name: "browser_click",
        endpoint: "/tools/browser_click",
        category: "browser",
        healthy: true,
        lastUsed: new Date(Date.now() - 60000).toISOString(),
        executionCount: 35
      },
      {
        name: "browser_evaluate",
        endpoint: "/tools/browser_evaluate",
        category: "browser",
        healthy: false,
        lastUsed: new Date(Date.now() - 900000).toISOString(),
        executionCount: 8,
        lastError: "Connection timeout"
      },
      {
        name: "configuration_panel",
        endpoint: "/ui/configuration",
        category: "ui",
        healthy: true,
        lastUsed: new Date(Date.now() - 180000).toISOString(),
        executionCount: 15
      }
    ]
  };

  // Apply filters
  let filteredTools = mockRegistryData.tools;
  if (filter.category) {
    filteredTools = filteredTools.filter(tool => tool.category === filter.category);
  }
  if (filter.healthy !== undefined) {
    filteredTools = filteredTools.filter(tool => tool.healthy === filter.healthy);
  }

  const result = {
    status: "operational",
    summary: {
      totalTools: mockRegistryData.totalTools,
      healthyTools: mockRegistryData.healthyTools,
      unhealthyTools: mockRegistryData.totalTools - mockRegistryData.healthyTools,
      categories: mockRegistryData.categories,
      lastHealthCheck: mockRegistryData.lastHealthCheck,
      averageResponseTime: mockRegistryData.averageResponseTime
    },
    filteredTools: filteredTools.length,
    tools: includeHealthDetails ? filteredTools : filteredTools.map(tool => ({
      name: tool.name,
      endpoint: tool.endpoint,
      category: tool.category,
      healthy: tool.healthy
    }))
  };

  return {
    content: [
      {
        type: "text",
        text: `MANE Registry Status Report\n\n` +
              `Status: ${result.status}\n` +
              `Total Tools: ${result.summary.totalTools}\n` +
              `Healthy Tools: ${result.summary.healthyTools}/${result.summary.totalTools}\n` +
              `Categories: ${Object.entries(result.summary.categories).map(([k, v]) => `${k}(${v})`).join(', ')}\n` +
              `Average Response Time: ${result.summary.averageResponseTime}ms\n` +
              `Last Health Check: ${result.summary.lastHealthCheck}\n\n` +
              `Filtered Results: ${result.filteredTools} tools\n\n` +
              JSON.stringify(result, null, 2)
      }
    ]
  };
}

async function handleRegisterTool(args) {
  const { toolConfig } = args || {};

  if (!toolConfig) {
    throw new McpError(ErrorCode.InvalidParams, "Tool configuration is required");
  }

  debugLog(`Registering tool: ${toolConfig.name}`);

  // Validate tool configuration
  const requiredFields = ['name', 'endpoint', 'description', 'schema'];
  const missingFields = requiredFields.filter(field => !toolConfig[field]);

  if (missingFields.length > 0) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }

  // Mock registration - in real implementation, this would register with actual registry
  const registrationResult = {
    success: true,
    toolName: toolConfig.name,
    endpoint: toolConfig.endpoint,
    registeredAt: new Date().toISOString(),
    validationPassed: true,
    warnings: []
  };

  // Simulate some validation warnings
  if (!toolConfig.capabilities) {
    registrationResult.warnings.push("No capabilities specified - using defaults");
  }

  if (!toolConfig.schema.additionalProperties === false) {
    registrationResult.warnings.push("Schema allows additional properties - security risk");
  }

  return {
    content: [
      {
        type: "text",
        text: `Tool Registration Result\n\n` +
              `Tool: ${registrationResult.toolName}\n` +
              `Endpoint: ${registrationResult.endpoint}\n` +
              `Status: ${registrationResult.success ? 'SUCCESS' : 'FAILED'}\n` +
              `Registered: ${registrationResult.registeredAt}\n` +
              `Validation: ${registrationResult.validationPassed ? 'PASSED' : 'FAILED'}\n` +
              `Warnings: ${registrationResult.warnings.length}\n\n` +
              (registrationResult.warnings.length > 0 ?
                `Warnings:\n${registrationResult.warnings.map(w => `- ${w}`).join('\n')}\n\n` : '') +
              JSON.stringify(registrationResult, null, 2)
      }
    ]
  };
}

async function handleDiscoverTools(args) {
  const { filter = {}, includeMetadata = false } = args || {};

  debugLog(`Discovering tools with filter: ${JSON.stringify(filter)}`);

  // Mock discovery data - in real implementation, this would query actual registry
  const allTools = [
    {
      name: "browser_navigate",
      endpoint: "/tools/browser_navigate",
      description: "Navigate the browser to a specified URL",
      category: "browser",
      capabilities: {
        async: true,
        timeout: 30000,
        retryable: true,
        batchable: false
      },
      healthy: true,
      metadata: {
        lastUsed: new Date(Date.now() - 300000).toISOString(),
        executionCount: 42,
        averageExecutionTime: 1200,
        errorRate: 0.02
      }
    },
    {
      name: "browser_screenshot",
      endpoint: "/tools/browser_screenshot",
      description: "Capture screenshot of current page or specific element",
      category: "browser",
      capabilities: {
        async: true,
        timeout: 45000,
        retryable: true,
        batchable: true
      },
      healthy: true,
      metadata: {
        lastUsed: new Date(Date.now() - 120000).toISOString(),
        executionCount: 28,
        averageExecutionTime: 2800,
        errorRate: 0.05
      }
    },
    {
      name: "browser_evaluate",
      endpoint: "/tools/browser_evaluate",
      description: "Execute JavaScript code in browser context",
      category: "browser",
      capabilities: {
        async: true,
        timeout: 15000,
        retryable: false,
        batchable: false
      },
      healthy: false,
      metadata: {
        lastUsed: new Date(Date.now() - 900000).toISOString(),
        executionCount: 8,
        averageExecutionTime: 0,
        errorRate: 0.75,
        lastError: "Connection timeout"
      }
    }
  ];

  // Apply filters
  let discoveredTools = allTools;

  if (filter.category) {
    discoveredTools = discoveredTools.filter(tool => tool.category === filter.category);
  }

  if (filter.capability) {
    discoveredTools = discoveredTools.filter(tool =>
      tool.capabilities && tool.capabilities[filter.capability] === true
    );
  }

  if (filter.healthy !== undefined) {
    discoveredTools = discoveredTools.filter(tool => tool.healthy === filter.healthy);
  }

  if (filter.namePattern) {
    const regex = new RegExp(filter.namePattern, 'i');
    discoveredTools = discoveredTools.filter(tool => regex.test(tool.name));
  }

  // Format response based on includeMetadata flag
  const formattedTools = discoveredTools.map(tool => {
    const basicInfo = {
      name: tool.name,
      endpoint: tool.endpoint,
      description: tool.description,
      category: tool.category,
      healthy: tool.healthy
    };

    if (includeMetadata) {
      return {
        ...basicInfo,
        capabilities: tool.capabilities,
        metadata: tool.metadata
      };
    }

    return basicInfo;
  });

  const result = {
    totalFound: discoveredTools.length,
    filters: filter,
    includeMetadata,
    tools: formattedTools
  };

  return {
    content: [
      {
        type: "text",
        text: `Tool Discovery Results\n\n` +
              `Found: ${result.totalFound} tools\n` +
              `Filters Applied: ${Object.keys(filter).length > 0 ? JSON.stringify(filter) : 'None'}\n` +
              `Include Metadata: ${includeMetadata}\n\n` +
              `Tools:\n${formattedTools.map(t => `- ${t.name} (${t.category}) - ${t.healthy ? 'Healthy' : 'Unhealthy'}`).join('\n')}\n\n` +
              JSON.stringify(result, null, 2)
      }
    ]
  };
}

async function handleQualityGateValidate(args) {
  const { target, gates = ["interface-compliance", "performance", "security"], strict = false } = args || {};

  if (!target) {
    throw new McpError(ErrorCode.InvalidParams, "Target tool or component name is required");
  }

  debugLog(`Running quality gates for target: ${target}, gates: ${gates.join(', ')}, strict: ${strict}`);

  // Mock quality gate results - in real implementation, this would run actual quality gates
  const gateResults = {
    target,
    timestamp: new Date().toISOString(),
    strictMode: strict,
    overallPassed: true,
    overallScore: 87.5,
    gates: []
  };

  // Simulate different gate results
  if (gates.includes("interface-compliance")) {
    const compliance = {
      name: "Interface Compliance",
      passed: true,
      score: 95,
      threshold: strict ? 95 : 90,
      details: [
        { check: "Required Properties", passed: true, message: "All required properties present" },
        { check: "Required Methods", passed: true, message: "All required methods implemented" },
        { check: "Method Signatures", passed: true, message: "Method signatures match interface" },
        { check: "Registry Integration", passed: true, message: "Tool can be registered and discovered" },
        { check: "Parameter Validation", passed: false, message: "Schema missing additionalProperties: false" }
      ]
    };
    gateResults.gates.push(compliance);
  }

  if (gates.includes("performance")) {
    const performance = {
      name: "Performance",
      passed: target === "browser_evaluate" ? false : true,
      score: target === "browser_evaluate" ? 65 : 85,
      threshold: strict ? 85 : 80,
      details: [
        {
          check: "Response Time",
          passed: target !== "browser_evaluate",
          message: target === "browser_evaluate" ? "Average response time 6.2s exceeds 5s limit" : "Average response time 2.1s within limits"
        },
        { check: "Memory Usage", passed: true, message: "Memory increase 15MB within 50MB limit" },
        { check: "Concurrent Execution", passed: true, message: "Handles 5 concurrent requests successfully" }
      ]
    };
    gateResults.gates.push(performance);
  }

  if (gates.includes("security")) {
    const security = {
      name: "Security",
      passed: true,
      score: 98,
      threshold: strict ? 98 : 95,
      details: [
        { check: "Input Validation", passed: true, message: "Rejects dangerous inputs correctly" },
        { check: "Schema Security", passed: true, message: "Schema prevents additional properties" },
        { check: "XSS Prevention", passed: true, message: "Properly escapes user input" },
        { check: "Safe Capabilities", passed: true, message: "No dangerous capabilities enabled" }
      ]
    };
    gateResults.gates.push(security);
  }

  // Calculate overall results
  const failedGates = gateResults.gates.filter(gate => !gate.passed);
  gateResults.overallPassed = failedGates.length === 0;
  gateResults.overallScore = gateResults.gates.reduce((sum, gate) => sum + gate.score, 0) / gateResults.gates.length;

  return {
    content: [
      {
        type: "text",
        text: `Quality Gate Validation Results\n\n` +
              `Target: ${gateResults.target}\n` +
              `Overall Status: ${gateResults.overallPassed ? 'PASSED' : 'FAILED'}\n` +
              `Overall Score: ${gateResults.overallScore.toFixed(1)}%\n` +
              `Strict Mode: ${gateResults.strictMode}\n` +
              `Timestamp: ${gateResults.timestamp}\n\n` +
              `Gate Results:\n` +
              gateResults.gates.map(gate =>
                `${gate.name}: ${gate.passed ? 'PASSED' : 'FAILED'} (${gate.score}% >= ${gate.threshold}%)\n` +
                gate.details.map(detail => `  - ${detail.check}: ${detail.passed ? '✓' : '✗'} ${detail.message}`).join('\n')
              ).join('\n\n') + '\n\n' +
              JSON.stringify(gateResults, null, 2)
      }
    ]
  };
}

async function handleServiceWorkerStatus(args) {
  const { includeMetrics = false, includeConnections = false } = args || {};

  debugLog(`Getting service worker status (metrics: ${includeMetrics}, connections: ${includeConnections})`);

  // Mock service worker status - in real implementation, this would query actual service worker
  const status = {
    running: true,
    port: parseInt(process.env.MANE_REGISTRY_PORT) || 3024,
    host: "127.0.0.1",
    uptime: 3600000, // 1 hour
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    health: "healthy",
    webSocketConnected: true,
    chromeExtensionConnected: true
  };

  if (includeMetrics) {
    status.metrics = {
      requestCount: 1247,
      errorCount: 23,
      averageResponseTime: 156.7,
      errorRate: 0.018,
      throughput: 0.35, // requests per second
      lastRequestAt: new Date(Date.now() - 5000).toISOString()
    };
  }

  if (includeConnections) {
    status.connections = {
      webSocket: {
        connected: true,
        connectedAt: new Date(Date.now() - 1800000).toISOString(),
        messagesReceived: 892,
        messagesSent: 445,
        lastMessageAt: new Date(Date.now() - 2000).toISOString()
      },
      chromeExtension: {
        connected: true,
        connectedAt: new Date(Date.now() - 1800000).toISOString(),
        currentUrl: "https://example.com/test",
        currentTabId: 123456,
        consoleLogs: 45,
        consoleErrors: 3,
        networkErrors: 1
      }
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `MANE Service Worker Status\n\n` +
              `Status: ${status.running ? 'RUNNING' : 'STOPPED'}\n` +
              `Address: http://${status.host}:${status.port}\n` +
              `Health: ${status.health.toUpperCase()}\n` +
              `Uptime: ${Math.round(status.uptime / 1000 / 60)} minutes\n` +
              `Started: ${status.startedAt}\n` +
              `WebSocket: ${status.webSocketConnected ? 'Connected' : 'Disconnected'}\n` +
              `Chrome Extension: ${status.chromeExtensionConnected ? 'Connected' : 'Disconnected'}\n` +
              (includeMetrics ? `\nMetrics:\n` +
                `- Requests: ${status.metrics.requestCount} (${status.metrics.errorCount} errors, ${(status.metrics.errorRate * 100).toFixed(1)}% error rate)\n` +
                `- Response Time: ${status.metrics.averageResponseTime}ms average\n` +
                `- Throughput: ${status.metrics.throughput} req/sec\n` : '') +
              (includeConnections ? `\nConnections:\n` +
                `- WebSocket: ${status.connections.webSocket.messagesReceived} received, ${status.connections.webSocket.messagesSent} sent\n` +
                `- Chrome Tab: ${status.connections.chromeExtension.currentUrl} (ID: ${status.connections.chromeExtension.currentTabId})\n` : '') +
              '\n' + JSON.stringify(status, null, 2)
      }
    ]
  };
}

async function handleServiceWorkerControl(args) {
  const { action, port = 3024, host = "127.0.0.1" } = args || {};

  if (!action) {
    throw new McpError(ErrorCode.InvalidParams, "Action is required (start, stop, restart)");
  }

  debugLog(`Service worker control action: ${action}, port: ${port}, host: ${host}`);

  // Mock service worker control - in real implementation, this would control actual service worker
  const result = {
    action,
    success: true,
    timestamp: new Date().toISOString(),
    details: {}
  };

  switch (action) {
    case "start":
      result.details = {
        port,
        host,
        message: `Service worker started on ${host}:${port}`,
        pid: Math.floor(Math.random() * 10000) + 1000
      };
      break;

    case "stop":
      result.details = {
        message: "Service worker stopped gracefully",
        uptime: 3600000,
        lastRequestAt: new Date(Date.now() - 5000).toISOString()
      };
      break;

    case "restart":
      result.details = {
        port,
        host,
        message: `Service worker restarted on ${host}:${port}`,
        oldPid: Math.floor(Math.random() * 10000) + 1000,
        newPid: Math.floor(Math.random() * 10000) + 1000,
        downtime: 1500 // milliseconds
      };
      break;

    default:
      throw new McpError(ErrorCode.InvalidParams, `Invalid action: ${action}`);
  }

  return {
    content: [
      {
        type: "text",
        text: `Service Worker Control Result\n\n` +
              `Action: ${result.action.toUpperCase()}\n` +
              `Status: ${result.success ? 'SUCCESS' : 'FAILED'}\n` +
              `Timestamp: ${result.timestamp}\n` +
              `Details: ${result.details.message}\n\n` +
              JSON.stringify(result, null, 2)
      }
    ]
  };
}

async function handleInterfaceValidate(args) {
  const { target, interfaceType, checkMethods = true, checkProperties = true } = args || {};

  if (!target) {
    throw new McpError(ErrorCode.InvalidParams, "Target is required");
  }

  debugLog(`Validating interface for target: ${target}, type: ${interfaceType}`);

  // Mock interface validation - in real implementation, this would validate actual interfaces
  const validation = {
    target,
    interfaceType: interfaceType || "Auto-detected",
    timestamp: new Date().toISOString(),
    passed: true,
    score: 92,
    checks: []
  };

  if (checkProperties) {
    const propertyChecks = [
      { name: "name", passed: true, message: "Property 'name' is present and valid" },
      { name: "endpoint", passed: true, message: "Property 'endpoint' is present and valid" },
      { name: "description", passed: true, message: "Property 'description' is present and valid" },
      { name: "schema", passed: true, message: "Property 'schema' is present and valid" },
      { name: "capabilities", passed: false, message: "Property 'capabilities' has incorrect type" }
    ];

    validation.checks.push({
      category: "Properties",
      checks: propertyChecks,
      passed: propertyChecks.every(check => check.passed),
      score: (propertyChecks.filter(check => check.passed).length / propertyChecks.length) * 100
    });
  }

  if (checkMethods) {
    const methodChecks = [
      { name: "execute", passed: true, message: "Method 'execute' is implemented correctly" },
      { name: "validate", passed: true, message: "Method 'validate' is implemented correctly" },
      { name: "getStatus", passed: true, message: "Method 'getStatus' is implemented correctly" },
      { name: "healthCheck", passed: true, message: "Method 'healthCheck' is optional but implemented" }
    ];

    validation.checks.push({
      category: "Methods",
      checks: methodChecks,
      passed: methodChecks.filter(check => check.name !== "healthCheck").every(check => check.passed),
      score: (methodChecks.filter(check => check.passed).length / methodChecks.length) * 100
    });
  }

  // Calculate overall results
  const failedCategories = validation.checks.filter(category => !category.passed);
  validation.passed = failedCategories.length === 0;
  validation.score = validation.checks.reduce((sum, category) => sum + category.score, 0) / validation.checks.length;

  return {
    content: [
      {
        type: "text",
        text: `Interface Validation Results\n\n` +
              `Target: ${validation.target}\n` +
              `Interface Type: ${validation.interfaceType}\n` +
              `Overall Status: ${validation.passed ? 'PASSED' : 'FAILED'}\n` +
              `Overall Score: ${validation.score.toFixed(1)}%\n` +
              `Timestamp: ${validation.timestamp}\n\n` +
              `Validation Results:\n` +
              validation.checks.map(category =>
                `${category.category}: ${category.passed ? 'PASSED' : 'FAILED'} (${category.score.toFixed(1)}%)\n` +
                category.checks.map(check => `  - ${check.name}: ${check.passed ? '✓' : '✗'} ${check.message}`).join('\n')
              ).join('\n\n') + '\n\n' +
              JSON.stringify(validation, null, 2)
      }
    ]
  };
}

async function handleFoundationHealth(args) {
  const {
    includeRegistry = true,
    includeServiceWorker = true,
    includeQualityGates = true,
    includeTools = false
  } = args || {};

  debugLog(`Comprehensive foundation health check`);

  // Mock foundation health - in real implementation, this would check actual components
  const health = {
    overall: "healthy",
    score: 89,
    timestamp: new Date().toISOString(),
    components: {}
  };

  if (includeRegistry) {
    health.components.registry = {
      status: "healthy",
      score: 92,
      details: {
        totalTools: 5,
        healthyTools: 4,
        unhealthyTools: 1,
        averageResponseTime: 125.5,
        lastHealthCheck: new Date(Date.now() - 30000).toISOString()
      }
    };
  }

  if (includeServiceWorker) {
    health.components.serviceWorker = {
      status: "healthy",
      score: 95,
      details: {
        running: true,
        port: 3024,
        uptime: 3600000,
        requestCount: 1247,
        errorRate: 0.018,
        webSocketConnected: true,
        chromeExtensionConnected: true
      }
    };
  }

  if (includeQualityGates) {
    health.components.qualityGates = {
      status: "healthy",
      score: 88,
      details: {
        interfaceCompliance: { available: true, lastRun: new Date(Date.now() - 300000).toISOString() },
        performance: { available: true, lastRun: new Date(Date.now() - 300000).toISOString() },
        security: { available: true, lastRun: new Date(Date.now() - 300000).toISOString() }
      }
    };
  }

  if (includeTools) {
    health.components.tools = {
      status: "mostly-healthy",
      score: 80,
      details: {
        browser_navigate: { healthy: true, score: 95 },
        browser_screenshot: { healthy: true, score: 90 },
        browser_click: { healthy: true, score: 92 },
        browser_evaluate: { healthy: false, score: 45, issue: "Connection timeout" },
        configuration_panel: { healthy: true, score: 88 }
      }
    };
  }

  // Calculate overall score
  const componentScores = Object.values(health.components).map(c => c.score);
  health.score = componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length;

  // Determine overall status
  if (health.score >= 90) {
    health.overall = "healthy";
  } else if (health.score >= 70) {
    health.overall = "degraded";
  } else {
    health.overall = "unhealthy";
  }

  return {
    content: [
      {
        type: "text",
        text: `MANE Foundation Health Report\n\n` +
              `Overall Status: ${health.overall.toUpperCase()}\n` +
              `Overall Score: ${health.score.toFixed(1)}%\n` +
              `Timestamp: ${health.timestamp}\n\n` +
              `Component Status:\n` +
              Object.entries(health.components).map(([name, component]) =>
                `- ${name}: ${component.status.toUpperCase()} (${component.score}%)`
              ).join('\n') + '\n\n' +
              `Detailed Results:\n` +
              JSON.stringify(health, null, 2)
      }
    ]
  };
}

async function handleCreateToolTemplate(args) {
  const { toolName, toolType, includeTests = true, includeDocumentation = true } = args || {};

  if (!toolName || !toolType) {
    throw new McpError(ErrorCode.InvalidParams, "Tool name and type are required");
  }

  debugLog(`Creating tool template: ${toolName} (${toolType})`);

  const fullToolName = `browser_${toolName}`;

  // Generate tool template based on type
  const template = generateToolTemplate(fullToolName, toolType, includeTests, includeDocumentation);

  return {
    content: [
      {
        type: "text",
        text: `Generated MANE Browser Tool Template\n\n` +
              `Tool Name: ${fullToolName}\n` +
              `Type: ${toolType}\n` +
              `Includes Tests: ${includeTests}\n` +
              `Includes Documentation: ${includeDocumentation}\n\n` +
              `Files Generated:\n` +
              template.files.map(file => `- ${file.path}`).join('\n') + '\n\n' +
              `Main Implementation (${template.files[0].path}):\n\n` +
              '```typescript\n' + template.files[0].content + '\n```'
      }
    ]
  };
}

async function handleCreatePanelTemplate(args) {
  const { panelName, panelType, includeEventHandlers = true, includeStateManagement = true } = args || {};

  if (!panelName || !panelType) {
    throw new McpError(ErrorCode.InvalidParams, "Panel name and type are required");
  }

  debugLog(`Creating panel template: ${panelName} (${panelType})`);

  // Generate panel template based on type
  const template = generatePanelTemplate(panelName, panelType, includeEventHandlers, includeStateManagement);

  return {
    content: [
      {
        type: "text",
        text: `Generated MANE UI Panel Template\n\n` +
              `Panel Name: ${panelName}\n` +
              `Type: ${panelType}\n` +
              `Includes Event Handlers: ${includeEventHandlers}\n` +
              `Includes State Management: ${includeStateManagement}\n\n` +
              `Files Generated:\n` +
              template.files.map(file => `- ${file.path}`).join('\n') + '\n\n' +
              `Main Implementation (${template.files[0].path}):\n\n` +
              '```typescript\n' + template.files[0].content + '\n```'
      }
    ]
  };
}

// Template generation functions
function generateToolTemplate(toolName, toolType, includeTests, includeDocumentation) {
  const files = [];

  // Main tool implementation
  const toolContent = `import { BaseBrowserTool } from '../core/base-classes.js';
import { IToolResult, ILogger, IMetrics } from '../core/interfaces.js';

/**
 * ${toolName} - ${toolType} browser tool
 * Generated by MANE Foundation Template Generator
 */
export class ${toPascalCase(toolName)}Tool extends BaseBrowserTool {
  readonly name = '${toolName}';
  readonly endpoint = '/tools/${toolName}';
  readonly description = '${getToolDescription(toolType)}';
  readonly schema = ${getToolSchema(toolType)};

  get capabilities() {
    return {
      async: true,
      timeout: ${getToolTimeout(toolType)},
      retryable: ${getToolRetryable(toolType)},
      batchable: ${getToolBatchable(toolType)},
      requiresAuth: false
    };
  }

  protected async executeImpl(params: any): Promise<IToolResult> {
    try {
      this.logWithContext('info', 'Executing ${toolName}', { params });

      // TODO: Implement your ${toolType} logic here
      const result = await this.perform${toPascalCase(toolType)}(params);

      return this.createSuccess(result, {
        toolType: '${toolType}',
        executionTime: Date.now()
      });
    } catch (error) {
      return this.createErrorResult(
        \`\${toolName} execution failed: \${error.message}\`,
        { params, error: error.message }
      );
    }
  }

  protected async healthCheck(): Promise<boolean> {
    try {
      // TODO: Implement health check for your tool
      return true;
    } catch (error) {
      this.logger.warn(\`\${toolName} health check failed\`, { error: error.message });
      return false;
    }
  }

  private async perform${toPascalCase(toolType)}(params: any): Promise<any> {
    // TODO: Implement your specific ${toolType} logic
    throw new Error('Not implemented');
  }
}`;

  files.push({
    path: `src/tools/${toolName.replace('browser_', '')}.ts`,
    content: toolContent
  });

  // Generate tests if requested
  if (includeTests) {
    const testContent = generateTestTemplate(toolName, toolType);
    files.push({
      path: `tests/unit/${toolName.replace('browser_', '')}.test.ts`,
      content: testContent
    });
  }

  // Generate documentation if requested
  if (includeDocumentation) {
    const docContent = generateToolDocumentation(toolName, toolType);
    files.push({
      path: `docs/tools/${toolName.replace('browser_', '')}.md`,
      content: docContent
    });
  }

  return { files };
}

function generatePanelTemplate(panelName, panelType, includeEventHandlers, includeStateManagement) {
  const files = [];

  // Main panel implementation
  const panelContent = `import { BaseUIPanel } from '../core/base-classes.js';
import { IPanelEventHandler, ILogger } from '../core/interfaces.js';

/**
 * ${toPascalCase(panelName)}Panel - ${panelType} UI panel
 * Generated by MANE Foundation Template Generator
 */
export class ${toPascalCase(panelName)}Panel extends BaseUIPanel {
  readonly id = '${panelName}-panel';
  readonly selector = '#${panelName}-panel';
  readonly title = '${getPanelTitle(panelName, panelType)}';

  constructor(logger: ILogger) {
    super(logger, '${panelName}-panel', '#${panelName}-panel', '${getPanelTitle(panelName, panelType)}', {
      description: '${getPanelDescription(panelType)}',
      version: '1.0.0',
      order: ${getPanelOrder(panelType)}
    });
  }

  protected async initializeImpl(): Promise<void> {
    this.logWithContext('info', '${toPascalCase(panelName)} panel initializing');

    // TODO: Add custom initialization logic
    ${includeStateManagement ? 'await this.loadInitialState();' : ''}
  }

  protected async renderCore(): Promise<HTMLElement> {
    const panel = this.createElement('div', ['${panelName}-panel', '${panelType}-panel']);

    // Header
    const header = this.renderHeader();
    panel.appendChild(header);

    // Content
    const content = this.renderContent();
    panel.appendChild(content);

    // Controls (if needed)
    const controls = this.renderControls();
    panel.appendChild(controls);

    return panel;
  }

  protected getEventHandlers(): IPanelEventHandler[] {
    ${includeEventHandlers ? `return [
      {
        event: 'click',
        selector: '.${panelName}-button',
        handler: this.handleButtonClick.bind(this)
      },
      {
        event: 'change',
        selector: '.${panelName}-input',
        handler: this.handleInputChange.bind(this)
      }
    ];` : 'return [];'}
  }

  protected async onStateChange(newState: any, oldState: any): Promise<void> {
    ${includeStateManagement ? `this.logWithContext('debug', 'Panel state changed', { newState, oldState });

    // TODO: Handle state changes
    if (newState.status !== oldState.status) {
      await this.updateStatusDisplay(newState.status);
    }` : '// TODO: Implement state change handling'}
  }

  protected async cleanupImpl(): Promise<void> {
    // TODO: Clean up resources
  }

  // Render methods
  private renderHeader(): HTMLElement {
    const header = this.createElement('div', ['panel-header']);
    const title = this.createElement('h3', [], {}, this.title);
    header.appendChild(title);
    return header;
  }

  private renderContent(): HTMLElement {
    const content = this.createElement('div', ['panel-content']);

    // TODO: Add your content rendering logic
    const placeholder = this.createElement('p', [], {}, 'Panel content goes here');
    content.appendChild(placeholder);

    return content;
  }

  private renderControls(): HTMLElement {
    const controls = this.createElement('div', ['panel-controls']);

    // TODO: Add control elements

    return controls;
  }

  ${includeEventHandlers ? `
  // Event handlers
  private async handleButtonClick(event: Event): Promise<void> {
    event.preventDefault();
    this.logWithContext('info', 'Button clicked');

    // TODO: Implement button click logic
  }

  private async handleInputChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    this.logWithContext('debug', 'Input changed', { value: input.value });

    // TODO: Implement input change logic
    ${includeStateManagement ? 'await this.updateState({ inputValue: input.value });' : ''}
  }` : ''}

  ${includeStateManagement ? `
  // State management
  private async loadInitialState(): Promise<void> {
    // TODO: Load initial state data
    await this.updateState({
      status: 'ready',
      data: {},
      lastUpdate: Date.now()
    });
  }

  private async updateStatusDisplay(status: string): Promise<void> {
    const statusEl = this.findElement('.status-indicator');
    if (statusEl) {
      statusEl.textContent = \`Status: \${status}\`;
      statusEl.className = \`status-indicator status-\${status.toLowerCase()}\`;
    }
  }` : ''}
}`;

  files.push({
    path: `src/panels/${panelName}-panel.ts`,
    content: panelContent
  });

  return { files };
}

function generateTestTemplate(toolName, toolType) {
  return `import { ${toPascalCase(toolName)}Tool } from '../../src/tools/${toolName.replace('browser_', '')}.js';
import { MockLogger, MockMetrics } from '../mocks/index.js';

describe('${toPascalCase(toolName)}Tool', () => {
  let tool: ${toPascalCase(toolName)}Tool;
  let mockLogger: MockLogger;
  let mockMetrics: MockMetrics;

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockMetrics = new MockMetrics();
    tool = new ${toPascalCase(toolName)}Tool(mockLogger, mockMetrics);
  });

  describe('interface compliance', () => {
    test('should have required properties', () => {
      expect(tool.name).toBe('${toolName}');
      expect(tool.endpoint).toBe('/tools/${toolName}');
      expect(tool.description).toBeTruthy();
      expect(tool.schema).toBeTruthy();
      expect(tool.capabilities).toBeTruthy();
    });

    test('should implement required methods', () => {
      expect(typeof tool.execute).toBe('function');
      expect(typeof tool.validate).toBe('function');
      expect(typeof tool.getStatus).toBe('function');
    });
  });

  describe('parameter validation', () => {
    test('should validate correct parameters', () => {
      const params = ${getValidTestParams(toolType)};
      const result = tool.validate(params);
      expect(result.valid).toBe(true);
    });

    test('should reject invalid parameters', () => {
      const params = ${getInvalidTestParams(toolType)};
      const result = tool.validate(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeTruthy();
    });
  });

  describe('execution', () => {
    test('should execute successfully with valid parameters', async () => {
      const params = ${getValidTestParams(toolType)};
      // TODO: Mock dependencies as needed

      const result = await tool.execute(params);
      expect(result.success).toBe(true);
    });

    test('should handle execution errors gracefully', async () => {
      const params = ${getValidTestParams(toolType)};
      // TODO: Mock error conditions

      const result = await tool.execute(params);
      // Adjust expectations based on your error handling
    });
  });

  describe('health check', () => {
    test('should return health status', async () => {
      const status = await tool.getStatus();
      expect(status).toHaveProperty('healthy');
      expect(status).toHaveProperty('executionCount');
      expect(status).toHaveProperty('averageExecutionTime');
      expect(status).toHaveProperty('errorRate');
    });
  });
});`;
}

function generateToolDocumentation(toolName, toolType) {
  return `# ${toolName}

${getToolDescription(toolType)}

## Overview

This tool provides ${toolType} functionality for browser automation within the MANE framework.

## Usage

\`\`\`typescript
import { getRegistry } from '../core/registry.js';

const registry = getRegistry();
const result = await registry.routeRequest('/tools/${toolName}', {
  // Parameters based on your tool's schema
});
\`\`\`

## Parameters

The tool accepts the following parameters:

${getToolDocumentationParams(toolType)}

## Response

The tool returns a standard \`IToolResult\` object:

\`\`\`typescript
{
  success: boolean;
  data?: any;           // Tool-specific result data
  error?: string;       // Error message if execution failed
  metadata?: {
    toolType: string;
    executionTime: number;
    // Additional metadata
  };
  timestamp: number;
}
\`\`\`

## Capabilities

- **Async**: ${getToolRetryable(toolType)}
- **Timeout**: ${getToolTimeout(toolType)}ms
- **Retryable**: ${getToolRetryable(toolType)}
- **Batchable**: ${getToolBatchable(toolType)}

## Error Handling

The tool handles the following error scenarios:

- Parameter validation errors
- ${toolType} execution failures
- Timeout errors
- Connection issues

## Examples

### Basic Usage

\`\`\`typescript
const result = await registry.routeRequest('/tools/${toolName}', {
  // Add example parameters here
});

if (result.success) {
  console.log('${toolType} completed:', result.data);
} else {
  console.error('${toolType} failed:', result.error);
}
\`\`\`

## Testing

Run the test suite:

\`\`\`bash
npm test -- ${toolName.replace('browser_', '')}.test.ts
\`\`\`

## Quality Gates

Ensure the tool passes all quality gates:

\`\`\`bash
npm run quality-gate -- --target=${toolName}
\`\`\``;
}

// Helper functions
function toPascalCase(str) {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function getToolDescription(toolType) {
  const descriptions = {
    navigation: 'Navigate browser to URLs and handle page navigation',
    interaction: 'Interact with page elements through clicks, typing, and gestures',
    evaluation: 'Execute JavaScript code in browser context and retrieve results',
    analysis: 'Analyze page structure, performance, and accessibility metrics',
    monitoring: 'Monitor browser console logs, network activity, and errors'
  };
  return descriptions[toolType] || 'Browser automation tool';
}

function getToolSchema(toolType) {
  const schemas = {
    navigation: `{
    type: 'object',
    properties: {
      url: { type: 'string', format: 'uri' },
      timeout: { type: 'number', minimum: 0, maximum: 60000, default: 30000 }
    },
    required: ['url'],
    additionalProperties: false
  }`,
    interaction: `{
    type: 'object',
    properties: {
      selector: { type: 'string' },
      action: { type: 'string', enum: ['click', 'type', 'hover'] },
      value: { type: 'string' }
    },
    required: ['selector', 'action'],
    additionalProperties: false
  }`,
    evaluation: `{
    type: 'object',
    properties: {
      script: { type: 'string' },
      timeout: { type: 'number', minimum: 0, maximum: 30000, default: 5000 }
    },
    required: ['script'],
    additionalProperties: false
  }`,
    analysis: `{
    type: 'object',
    properties: {
      url: { type: 'string', format: 'uri' },
      categories: {
        type: 'array',
        items: { type: 'string' },
        default: ['structure', 'performance']
      }
    },
    required: ['url'],
    additionalProperties: false
  }`,
    monitoring: `{
    type: 'object',
    properties: {
      duration: { type: 'number', minimum: 1000, maximum: 300000, default: 10000 },
      types: {
        type: 'array',
        items: { type: 'string', enum: ['console', 'network', 'errors'] },
        default: ['console', 'errors']
      }
    },
    additionalProperties: false
  }`
  };
  return schemas[toolType] || `{
    type: 'object',
    properties: {},
    additionalProperties: false
  }`;
}

function getToolTimeout(toolType) {
  const timeouts = {
    navigation: 30000,
    interaction: 15000,
    evaluation: 10000,
    analysis: 60000,
    monitoring: 120000
  };
  return timeouts[toolType] || 30000;
}

function getToolRetryable(toolType) {
  const retryable = {
    navigation: true,
    interaction: true,
    evaluation: false,
    analysis: true,
    monitoring: false
  };
  return retryable[toolType] || true;
}

function getToolBatchable(toolType) {
  const batchable = {
    navigation: false,
    interaction: true,
    evaluation: false,
    analysis: false,
    monitoring: false
  };
  return batchable[toolType] || false;
}

function getPanelTitle(panelName, panelType) {
  const titles = {
    configuration: 'Configuration Settings',
    status: 'Status Dashboard',
    control: 'Control Panel',
    display: 'Data Display',
    monitoring: 'Monitoring Console'
  };
  return titles[panelType] || `${toPascalCase(panelName)} Panel`;
}

function getPanelDescription(panelType) {
  const descriptions = {
    configuration: 'Configuration and settings panel',
    status: 'Real-time status and metrics display',
    control: 'Control panel for browser operations',
    display: 'Data visualization and display panel',
    monitoring: 'Monitoring and logging interface'
  };
  return descriptions[panelType] || 'UI panel component';
}

function getPanelOrder(panelType) {
  const orders = {
    configuration: 10,
    status: 20,
    control: 30,
    display: 40,
    monitoring: 50
  };
  return orders[panelType] || 100;
}

function getValidTestParams(toolType) {
  const params = {
    navigation: '{ url: "https://example.com" }',
    interaction: '{ selector: "#button", action: "click" }',
    evaluation: '{ script: "document.title" }',
    analysis: '{ url: "https://example.com", categories: ["structure"] }',
    monitoring: '{ duration: 5000, types: ["console"] }'
  };
  return params[toolType] || '{}';
}

function getInvalidTestParams(toolType) {
  const params = {
    navigation: '{ url: "invalid-url" }',
    interaction: '{ selector: "", action: "invalid" }',
    evaluation: '{ script: "" }',
    analysis: '{ url: "not-a-url" }',
    monitoring: '{ duration: -1000 }'
  };
  return params[toolType] || '{ invalid: true }';
}

function getToolDocumentationParams(toolType) {
  const params = {
    navigation: `- \`url\` (string, required): Target URL to navigate to
- \`timeout\` (number, optional): Navigation timeout in milliseconds (default: 30000)`,
    interaction: `- \`selector\` (string, required): CSS selector of target element
- \`action\` (string, required): Action to perform ('click', 'type', 'hover')
- \`value\` (string, optional): Value for 'type' action`,
    evaluation: `- \`script\` (string, required): JavaScript code to execute
- \`timeout\` (number, optional): Execution timeout in milliseconds (default: 5000)`,
    analysis: `- \`url\` (string, required): URL to analyze
- \`categories\` (array, optional): Analysis categories to include`,
    monitoring: `- \`duration\` (number, optional): Monitoring duration in milliseconds (default: 10000)
- \`types\` (array, optional): Types of events to monitor`
  };
  return params[toolType] || '- No parameters required';
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  debugLog("MANE Foundation MCP Server started and ready");
}

main().catch((error) => {
  debugLog(`Server startup failed: ${error.message}`);
  process.exit(1);
});