#!/usr/bin/env node

/**
 * Minimal MCP Server using Official SDK - June 2025 Standards
 *
 * Uses the official @modelcontextprotocol/sdk for proper 2025-06-18 compliance
 * This is a minimal test server to verify Claude Code can start our MCP servers
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create MCP server with proper metadata
const server = new McpServer({
  name: "minimal-test-server",
  version: "1.0.0"
});

// Add one simple test tool to verify functionality
server.registerTool("test_tool", {
  title: "Test Tool",
  description: "A minimal test tool to verify MCP server functionality",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Test message to echo back"
      }
    },
    required: ["message"],
    additionalProperties: false
  }
}, async ({ message }) => {
  return {
    content: [{
      type: "text",
      text: `✅ Minimal MCP Server Test Success! Echo: ${message}`
    }]
  };
});

// Optional: Add a simple resource for testing
server.registerResource("test://resource", {
  title: "Test Resource",
  description: "A minimal test resource"
}, async () => {
  return {
    contents: [{
      type: "text",
      text: "This is a test resource from the minimal MCP server"
    }]
  };
});

// Debug logging function
function debugLog(message) {
  if (process.env.MCP_DEBUG) {
    process.stderr.write(`[minimal-mcp] ${new Date().toISOString()} - ${message}\n`);
  }
}

debugLog("Minimal MCP Server starting...");
debugLog("Using official @modelcontextprotocol/sdk v1.18.0");
debugLog("Protocol version: 2025-06-18 (via SDK)");

// Set up transport and connect
async function main() {
  try {
    const transport = new StdioServerTransport();

    debugLog("Connecting to stdio transport...");
    await server.connect(transport);

    debugLog("✅ Minimal MCP Server connected successfully!");
    debugLog("Registered tools: test_tool");
    debugLog("Registered resources: test://resource");

  } catch (error) {
    debugLog(`❌ Error starting server: ${error.message}`);
    process.stderr.write(`Fatal error: ${error.message}\n`);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  debugLog("Shutting down gracefully (SIGINT)");
  process.exit(0);
});

process.on('SIGTERM', () => {
  debugLog("Shutting down gracefully (SIGTERM)");
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  debugLog(`Uncaught exception: ${error.message}`);
  process.stderr.write(`Uncaught exception: ${error.message}\n`);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  debugLog(`Failed to start server: ${error.message}`);
  process.stderr.write(`Failed to start server: ${error.message}\n`);
  process.exit(1);
});