/**
 * 🦁 MANE Foundation MCP Tool Definitions
 * Tool schemas and configurations
 */

export const tools = {
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
          description: "Filter criteria for tools",
          properties: {
            category: { type: "string" },
            healthy: { type: "boolean" },
            capability: { type: "string" }
          },
          additionalProperties: false
        }
      },
      additionalProperties: false
    }
  },

  mane_register_tool: {
    name: "mane_register_tool",
    description: "Register a new tool with the MANE registry",
    inputSchema: {
      type: "object",
      properties: {
        toolConfig: {
          type: "object",
          description: "Tool configuration object",
          properties: {
            name: { type: "string", description: "Unique tool name" },
            endpoint: { type: "string", description: "Tool HTTP endpoint" },
            description: { type: "string", description: "Tool description" },
            schema: { type: "object", description: "Tool parameter schema" },
            capabilities: { type: "object", description: "Tool capabilities" }
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
    description: "Discover available tools in the MANE registry with filtering options",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "object",
          description: "Filter criteria for discovery",
          properties: {
            category: { type: "string" },
            capability: { type: "string" },
            namePattern: { type: "string", description: "Regex pattern for tool names" },
            healthy: { type: "boolean" }
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

  mane_quality_gate: {
    name: "mane_quality_gate",
    description: "Run quality gate validation on a tool or component",
    inputSchema: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description: "Target tool or component name to validate"
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
          description: "Use strict validation mode",
          default: false
        }
      },
      required: ["target"],
      additionalProperties: false
    }
  }
};

export const getToolNames = () => Object.keys(tools);

export const getTool = (name) => tools[name];

export const validateToolName = (name) => {
  return Object.prototype.hasOwnProperty.call(tools, name);
};