#!/usr/bin/env node

/**
 * MCP Server for Browser Tools - 2025-06-18 Specification Compliant
 *
 * A clean implementation following the latest MCP specification that:
 * - Uses JSON-RPC 2.0 over stdio transport
 * - NEVER writes to stdout except valid JSON-RPC messages
 * - Logs only to stderr for debugging
 * - Interfaces with MCP HTTP Bridge on port 3024
 *
 * Specification: https://modelcontextprotocol.io/specification/2025-06-18
 */

import readline from "readline";
import http from "http";

// Server information following 2025-06-18 spec
const serverInfo = {
  name: "Claude Code Browser Tools MCP",
  version: "2.0.0",
  protocolVersion: "2025-06-18",
};

// Tool definitions with proper schemas per 2025 spec
const tools = {
  browser_navigate: {
    title: "Navigate Browser",
    description: "Navigate the browser to a specified URL",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to navigate to",
          format: "uri",
        },
      },
      required: ["url"],
      additionalProperties: false,
    },
  },
  browser_screenshot: {
    title: "Capture Screenshot",
    description: "Take a screenshot of the current page or a specific element",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "Optional CSS selector to screenshot a specific element",
        },
        fullPage: {
          type: "boolean",
          description: "Capture full page screenshot",
          default: false,
        },
      },
      additionalProperties: false,
    },
  },
  browser_click: {
    title: "Click Element",
    description: "Click an element on the page using a CSS selector",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector of the element to click",
        },
      },
      required: ["selector"],
      additionalProperties: false,
    },
  },
  browser_type: {
    title: "Type Text",
    description: "Type text into an input field or editable element",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector of the input field",
        },
        text: {
          type: "string",
          description: "Text to type into the field",
        },
        clear: {
          type: "boolean",
          description: "Clear the field before typing",
          default: false,
        },
      },
      required: ["selector", "text"],
      additionalProperties: false,
    },
  },
  browser_evaluate: {
    title: "Execute JavaScript",
    description: "Execute JavaScript code in the browser context",
    inputSchema: {
      type: "object",
      properties: {
        script: {
          type: "string",
          description: "JavaScript code to execute",
        },
      },
      required: ["script"],
      additionalProperties: false,
    },
    annotations: {
      warning: "This tool executes arbitrary JavaScript. Use with caution.",
    },
  },
  browser_get_content: {
    title: "Get Page Content",
    description: "Get the HTML content of the page or a specific element",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description:
            "Optional CSS selector to get content from a specific element",
        },
        format: {
          type: "string",
          enum: ["html", "text"],
          description: "Format of the returned content",
          default: "html",
        },
      },
      additionalProperties: false,
    },
  },
  browser_audit: {
    title: "Run Lighthouse Audit",
    description: "Run a Lighthouse performance audit on the current page",
    inputSchema: {
      type: "object",
      properties: {
        categories: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "performance",
              "accessibility",
              "seo",
              "best-practices",
              "pwa",
            ],
          },
          description: "Audit categories to run",
          default: ["performance", "accessibility", "seo", "best-practices"],
        },
      },
      additionalProperties: false,
    },
  },
  browser_wait: {
    title: "Wait for Element",
    description: "Wait for an element to appear on the page",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector of the element to wait for",
        },
        timeout: {
          type: "number",
          description: "Maximum time to wait in milliseconds",
          default: 30000,
          minimum: 0,
          maximum: 60000,
        },
      },
      required: ["selector"],
      additionalProperties: false,
    },
  },
  browser_get_console: {
    title: "Get Console Logs",
    description: "Retrieve browser console logs",
    inputSchema: {
      type: "object",
      properties: {
        level: {
          type: "string",
          enum: ["all", "log", "info", "warn", "error"],
          description: "Filter logs by level",
          default: "all",
        },
      },
      additionalProperties: false,
    },
  },
};

// Debug logging to stderr only
function debugLog(message) {
  if (process.env.MCP_DEBUG) {
    process.stderr.write(
      `[browser-tools-mcp] ${new Date().toISOString()} - ${message}\n`,
    );
  }
}

// Send JSON-RPC response
function sendResponse(id, result, error = null) {
  const response = {
    jsonrpc: "2.0",
    id: id,
  };

  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }

  process.stdout.write(JSON.stringify(response) + "\n");
  debugLog(`Sent response for id ${id}: ${error ? "error" : "success"}`);
}

// Send JSON-RPC notification
function sendNotification(method, params) {
  const notification = {
    jsonrpc: "2.0",
    method: method,
    params: params,
  };

  process.stdout.write(JSON.stringify(notification) + "\n");
  debugLog(`Sent notification: ${method}`);
}

// Generate unique request ID for tracking
function generateRequestId() {
  return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Call browser-tools HTTP server with enhanced tracking
async function callBrowserTools(action, params, toolName) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  debugLog(`🚀 MCP Request ${requestId}: ${toolName} -> ${action}`, JSON.stringify(params));

  return new Promise((resolve, reject) => {
    const port = process.env.MCP_HTTP_BRIDGE_PORT || "3024";

    // Map actions to correct endpoints
    const endpointMap = {
      navigate: "/navigate",
      screenshot: "/capture-screenshot",
      click: "/click",
      type: "/type",
      evaluate: "/evaluate",
      getContent: "/get-content",
      audit: "/audit", // This might need to be implemented in HTTP bridge
      wait: "/wait",
      getConsole: "/console-logs",
    };

    const endpoint = endpointMap[action];
    if (!endpoint) {
      const errorMsg = `Unknown action: ${action}`;
      debugLog(`❌ Request ${requestId} failed: ${errorMsg}`);
      reject(new Error(errorMsg));
      return;
    }

    // Enhanced params with request tracking
    const enhancedParams = {
      ...params,
      requestId,
      timeout: params.timeout || 30000,
      source: "MCP Server"
    };

    const data = JSON.stringify(enhancedParams);

    debugLog(`🔄 Request ${requestId}: ${action} -> ${endpoint} on port ${port}`);

    const options = {
      hostname: "localhost",
      port: parseInt(port),
      path: endpoint,
      method:
        endpoint === "/console-logs" || endpoint === "/get-content"
          ? "GET"
          : "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: 30000,
    };

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        const duration = Date.now() - startTime;
        try {
          const result = JSON.parse(responseData);
          debugLog(
            `✅ Request ${requestId} completed in ${duration}ms: ${JSON.stringify(result).substring(0, 200)}`,
          );

          if (result.error) {
            debugLog(`❌ Request ${requestId} returned error: ${result.error}`);
            reject(new Error(result.error));
          } else {
            debugLog(`🎉 Request ${requestId} successful`);
            resolve({
              ...result,
              requestId,
              duration,
              timestamp: Date.now()
            });
          }
        } catch (e) {
          debugLog(`❌ Request ${requestId} parsing failed: ${e.message}`);
          reject(
            new Error(`Invalid response from browser-tools: ${e.message}`),
          );
        }
      });
    });

    req.on("error", (e) => {
      const duration = Date.now() - startTime;
      debugLog(`❌ Request ${requestId} connection error after ${duration}ms: ${e.message}`);
      reject(
        new Error(
          `Browser-tools server not available on port ${port}: ${e.message}`,
        ),
      );
    });

    req.on("timeout", () => {
      const duration = Date.now() - startTime;
      debugLog(`⏰ Request ${requestId} timeout after ${duration}ms`);
      req.destroy();
      reject(new Error(`Browser-tools request timeout after ${duration}ms`));
    });

    // Only write data for POST requests
    if (options.method === "POST") {
      req.write(data);
    }
    req.end();
  });
}

// Handle MCP protocol requests
async function handleRequest(request) {
  const { id, method, params } = request;

  debugLog(`Handling request: ${method} (id: ${id})`);

  try {
    switch (method) {
      case "initialize":
        // Capability negotiation per 2025-06-18 spec
        const { protocolVersion: clientVersion, capabilities: clientCaps } =
          params;

        // Check protocol compatibility
        if (clientVersion && !clientVersion.startsWith("2025")) {
          debugLog(
            `Protocol version mismatch: client ${clientVersion}, server ${serverInfo.protocolVersion}`,
          );
        }

        sendResponse(id, {
          protocolVersion: serverInfo.protocolVersion,
          capabilities: {
            tools: {},
            resources: {},
          },
          serverInfo: {
            name: serverInfo.name,
            version: serverInfo.version,
          },
        });
        break;

      case "initialized":
        // Client confirms initialization complete
        sendResponse(id, {});
        debugLog("Initialization complete");
        break;

      case "tools/list":
        // Return tool list with full schemas
        const toolList = Object.entries(tools).map(([name, tool]) => ({
          name: name,
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: tool.annotations,
        }));

        sendResponse(id, { tools: toolList });
        debugLog(`Listed ${toolList.length} tools`);
        break;

      case "tools/call":
        const { name: toolName, arguments: args } = params;

        debugLog(`Tool call: ${toolName}`);

        if (!tools[toolName]) {
          sendResponse(id, null, {
            code: -32602,
            message: `Unknown tool: ${toolName}`,
          });
          return;
        }

        // Map tool names to browser-tools actions
        const actionMap = {
          browser_navigate: "navigate",
          browser_screenshot: "screenshot",
          browser_click: "click",
          browser_type: "type",
          browser_evaluate: "evaluate",
          browser_get_content: "getContent",
          browser_audit: "audit",
          browser_wait: "wait",
          browser_get_console: "getConsole",
        };

        const action = actionMap[toolName];
        if (!action) {
          sendResponse(id, null, {
            code: -32603,
            message: `Tool ${toolName} not implemented`,
          });
          return;
        }

        try {
          const result = await callBrowserTools(action, args, name);

          // Format response per 2025-06-18 spec
          const response = {
            content: [],
          };

          // Handle different result types
          if (result.screenshot) {
            response.content.push({
              type: "image",
              data: result.screenshot,
              mimeType: "image/png",
            });
          } else if (result.html || result.text) {
            response.content.push({
              type: "text",
              text:
                result.html || result.text || JSON.stringify(result, null, 2),
            });
          } else if (result.error) {
            // Tool execution error
            response.content.push({
              type: "text",
              text: `Error: ${result.error}`,
            });
            response.isError = true;
          } else {
            // Generic result
            response.content.push({
              type: "text",
              text: JSON.stringify(result, null, 2),
            });
          }

          sendResponse(id, response);
        } catch (error) {
          // Tool execution error with isError flag
          debugLog(`Tool execution error: ${error.message}`);
          sendResponse(id, {
            content: [
              {
                type: "text",
                text: `Tool execution failed: ${error.message}`,
              },
            ],
            isError: true,
          });
        }
        break;

      case "shutdown":
        // Graceful shutdown
        sendResponse(id, {});
        debugLog("Shutdown requested");
        process.exit(0);
        break;

      default:
        sendResponse(id, null, {
          code: -32601,
          message: `Method not found: ${method}`,
        });
    }
  } catch (error) {
    debugLog(`Request handling error: ${error.message}`);
    sendResponse(id, null, {
      code: -32603,
      message: `Internal error: ${error.message}`,
    });
  }
}

// Setup stdin reader for JSON-RPC messages
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// Buffer for incomplete messages
let messageBuffer = "";

// Process incoming JSON-RPC messages
rl.on("line", (line) => {
  try {
    const message = JSON.parse(line);

    if (message.jsonrpc !== "2.0") {
      debugLog(`Invalid JSON-RPC version: ${message.jsonrpc}`);
      return;
    }

    // Handle request or notification
    if (message.method) {
      handleRequest(message);
    }
  } catch (e) {
    debugLog(`Failed to parse JSON-RPC message: ${e.message}`);
    // Per spec: ignore invalid JSON silently
  }
});

// Handle process termination gracefully
process.on("SIGTERM", () => {
  debugLog("Received SIGTERM, shutting down");
  process.exit(0);
});

process.on("SIGINT", () => {
  debugLog("Received SIGINT, shutting down");
  process.exit(0);
});

// Handle uncaught errors to prevent stdout contamination
process.on("uncaughtException", (error) => {
  debugLog(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  debugLog(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Ready
debugLog("Browser Tools MCP Server v2.0.0 started (2025-06-18 spec)");
debugLog(
  `Using MCP HTTP Bridge port: ${process.env.MCP_HTTP_BRIDGE_PORT || "3024"}`,
);
