#!/usr/bin/env node

/**
 * 🦁 MANE Foundation MCP Server (Modular Version)
 *
 * This is the refactored, modular version of the MANE Foundation MCP server.
 * Split into focused modules for better maintainability and testing.
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

// Import modular components
import { serverInfo, getServerHealth } from './modules/mcp-server-info.mjs';
import { tools, validateToolName } from './modules/mcp-tool-definitions.mjs';
import {
  handleRegistryStatus,
  handleRegisterTool,
  handleDiscoverTools,
  handleQualityGate
} from './modules/mcp-tool-handlers.mjs';

// Track server start time for health monitoring
global.startTime = Date.now();

// Create the MCP server
const server = new Server(serverInfo, {
  capabilities: {
    tools: {}
  }
});

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(tools)
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!validateToolName(name)) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }

  try {
    switch (name) {
      case "mane_registry_status":
        return await handleRegistryStatus(args);

      case "mane_register_tool":
        return await handleRegisterTool(args);

      case "mane_discover_tools":
        return await handleDiscoverTools(args);

      case "mane_quality_gate":
        return await handleQualityGate(args);

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool handler not implemented: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message}`
    );
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('🦁 MANE Foundation MCP Server shutting down...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('🦁 MANE Foundation MCP Server terminating...');
  await server.close();
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`🦁 MANE Foundation MCP Server v${serverInfo.version} started`);
  console.error(`📡 Protocol: ${serverInfo.protocolVersion}`);
  console.error(`🛠️  Available tools: ${Object.keys(tools).length}`);
}

// Handle startup errors
main().catch((error) => {
  console.error('Failed to start MANE Foundation MCP Server:', error);
  process.exit(1);
});