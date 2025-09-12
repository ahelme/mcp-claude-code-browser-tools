#!/usr/bin/env node

/**
 * Clean MCP Server for Browser Tools
 * 
 * This is a custom implementation that properly follows the MCP stdio protocol
 * and interfaces with the browser-tools HTTP server on port 3025.
 * 
 * NO console.log or console.error statements - only JSON-RPC to stdout
 */

const readline = require('readline');
const http = require('http');

// MCP Server state
let serverInfo = {
    name: "browser-tools-clean",
    version: "1.0.0",
    protocolVersion: "2024-11-05"
};

// Available tools
const tools = {
    "browser_navigate": {
        description: "Navigate browser to a URL",
        inputSchema: {
            type: "object",
            properties: {
                url: { type: "string", description: "URL to navigate to" }
            },
            required: ["url"]
        }
    },
    "browser_screenshot": {
        description: "Take a screenshot of the current page",
        inputSchema: {
            type: "object",
            properties: {
                selector: { type: "string", description: "Optional CSS selector to screenshot" }
            }
        }
    },
    "browser_click": {
        description: "Click an element on the page",
        inputSchema: {
            type: "object",
            properties: {
                selector: { type: "string", description: "CSS selector of element to click" }
            },
            required: ["selector"]
        }
    },
    "browser_type": {
        description: "Type text into an input field",
        inputSchema: {
            type: "object",
            properties: {
                selector: { type: "string", description: "CSS selector of input field" },
                text: { type: "string", description: "Text to type" }
            },
            required: ["selector", "text"]
        }
    },
    "browser_evaluate": {
        description: "Execute JavaScript in the browser",
        inputSchema: {
            type: "object",
            properties: {
                script: { type: "string", description: "JavaScript code to execute" }
            },
            required: ["script"]
        }
    },
    "browser_get_content": {
        description: "Get the HTML content of the page",
        inputSchema: {
            type: "object",
            properties: {
                selector: { type: "string", description: "Optional CSS selector to get content from" }
            }
        }
    },
    "browser_audit": {
        description: "Run Lighthouse audit on the current page",
        inputSchema: {
            type: "object",
            properties: {
                categories: {
                    type: "array",
                    items: { type: "string" },
                    description: "Audit categories to run"
                }
            }
        }
    }
};

// Send JSON-RPC response
function sendResponse(id, result, error = null) {
    const response = {
        jsonrpc: "2.0",
        id: id
    };
    
    if (error) {
        response.error = error;
    } else {
        response.result = result;
    }
    
    process.stdout.write(JSON.stringify(response) + '\n');
}

// Send JSON-RPC notification
function sendNotification(method, params) {
    const notification = {
        jsonrpc: "2.0",
        method: method,
        params: params
    };
    
    process.stdout.write(JSON.stringify(notification) + '\n');
}

// Make HTTP request to browser-tools server
async function callBrowserTools(action, params) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            action: action,
            params: params
        });
        
        const options = {
            hostname: 'localhost',
            port: 3025,
            path: '/api',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    if (result.error) {
                        reject(new Error(result.error));
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    reject(new Error('Invalid response from browser-tools server'));
                }
            });
        });
        
        req.on('error', (e) => {
            reject(new Error(`Browser-tools server connection failed: ${e.message}`));
        });
        
        req.write(data);
        req.end();
    });
}

// Handle MCP requests
async function handleRequest(request) {
    const { id, method, params } = request;
    
    try {
        switch (method) {
            case 'initialize':
                sendResponse(id, {
                    protocolVersion: serverInfo.protocolVersion,
                    capabilities: {
                        tools: {}
                    },
                    serverInfo: serverInfo
                });
                break;
                
            case 'initialized':
                // Client confirms initialization
                sendResponse(id, {});
                break;
                
            case 'tools/list':
                const toolList = Object.entries(tools).map(([name, tool]) => ({
                    name: name,
                    description: tool.description,
                    inputSchema: tool.inputSchema
                }));
                sendResponse(id, { tools: toolList });
                break;
                
            case 'tools/call':
                const { name: toolName, arguments: args } = params;
                
                if (!tools[toolName]) {
                    sendResponse(id, null, {
                        code: -32602,
                        message: `Unknown tool: ${toolName}`
                    });
                    return;
                }
                
                // Map tool names to browser-tools actions
                const actionMap = {
                    'browser_navigate': 'navigate',
                    'browser_screenshot': 'screenshot',
                    'browser_click': 'click',
                    'browser_type': 'type',
                    'browser_evaluate': 'evaluate',
                    'browser_get_content': 'getContent',
                    'browser_audit': 'audit'
                };
                
                const action = actionMap[toolName];
                if (!action) {
                    sendResponse(id, null, {
                        code: -32603,
                        message: `Tool ${toolName} not implemented`
                    });
                    return;
                }
                
                try {
                    const result = await callBrowserTools(action, args);
                    sendResponse(id, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(result, null, 2)
                            }
                        ]
                    });
                } catch (error) {
                    sendResponse(id, null, {
                        code: -32603,
                        message: error.message
                    });
                }
                break;
                
            default:
                sendResponse(id, null, {
                    code: -32601,
                    message: `Method not found: ${method}`
                });
        }
    } catch (error) {
        sendResponse(id, null, {
            code: -32603,
            message: error.message
        });
    }
}

// Setup stdin reader
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

// Process incoming JSON-RPC messages
rl.on('line', (line) => {
    try {
        const request = JSON.parse(line);
        if (request.jsonrpc === "2.0") {
            handleRequest(request);
        }
    } catch (e) {
        // Invalid JSON - ignore silently (no console output!)
    }
});

// Handle process termination
process.on('SIGTERM', () => {
    process.exit(0);
});

process.on('SIGINT', () => {
    process.exit(0);
});

// Start immediately - no console output!
// The server is ready as soon as it starts