# Browser Tools for Claude Code

## Project Overview

**Custom MCP Server Implementation** - We built our own browser-tools MCP server to fix critical protocol violations in the official npm package.

**Current Status**: Using dual architecture with clean, 100% MCP-compliant implementation:
- **MCP Method**: `mcp-browser-tools-server.js` + `mcp-http-bridge.js` (port 3025)
- **Direct Method**: `direct-http-bridge.js` (port 3026)

## Features

- **Nine browser control tools** - Complete automation toolkit
- **Screenshot capture** - Full page or specific elements
- **Lighthouse audits** - Performance, SEO, accessibility testing
- **Console monitoring** - Capture logs, errors, warnings
- **Element interaction** - Click, type, wait for elements
- **Clean implementation** - 100% MCP protocol compliant

## Available MCP Servers

### 1. Browser-Tools MCP (Our Custom Implementation)
- **MCP Server**: `scripts/mcp-browser-tools-server.js`
- **HTTP Bridge**: `scripts/mcp-http-bridge.js`
- **Purpose**: Browser automation and testing
- **Port**: 3025 (MCP HTTP bridge connection)
- **Features**:
  - Nine browser control tools
  - Screenshot capture
  - Lighthouse audits
  - Console monitoring
  - Element interaction

### 2. Memory Bank MCP
- **Purpose**: Persistent memory across sessions
- **Features**: Progress tracking, decision logging, context management

### 3. Sequential Thinking MCP
- **Purpose**: Step-by-step problem solving

## How to Use Browser Tools

### Starting the HTTP Bridge Server

```bash
# First time only - install dependencies
npm install

# Start MCP HTTP bridge (for Claude Code)
./scripts/start-mcp-browser-tools.sh
# This starts the MCP HTTP bridge on port 3025

# Alternative: Direct HTTP method (for other tools)
./scripts/start-direct-browser-tools.sh
# This starts the direct HTTP bridge on port 3026
```

**IMPORTANT**: Use port 3025 for MCP method with Claude Code!

### Available Browser Tools in Claude Code

All tools are prefixed with `mcp__browser-tools__`:

- `navigate` - Go to URL
- `screenshot` - Capture page/element
- `click` - Click elements
- `type` - Enter text
- `evaluate` - Run JavaScript
- `get_content` - Get HTML
- `audit` - Run Lighthouse
- `wait` - Wait for elements
- `get_console` - Get console logs

### Example Usage

```javascript
// Navigate to a page
mcp__browser-tools__navigate({ url: "https://example.com" })

// Take screenshot
mcp__browser-tools__screenshot({ fullPage: true })

// Click button
mcp__browser-tools__click({ selector: "#submit-button" })
```

## Important Files

### MCP Method (Port 3025)
- `scripts/mcp-browser-tools-server.js` - MCP server
- `scripts/mcp-http-bridge.js` - MCP HTTP bridge
- `scripts/start-mcp-browser-tools.sh` - Start script for MCP

### Direct Method (Port 3026)
- `scripts/direct-http-bridge.js` - Direct HTTP bridge
- `scripts/start-direct-browser-tools.sh` - Start script for direct

### Configuration
- `.claude/mcp.json` - MCP configuration
- `.screenshots/` - Screenshot outputs

## Why Custom Implementation?

The official npm package we used previously (`@agentdeskai/browser-tools-mcp`) violates MCP protocol:
- Writes debug output to stdout (breaks JSON-RPC)
- Has 30+ console statements polluting communication

Our solution:
- 100% protocol compliant
- Clean stdio implementation
- Proper error handling
- Full 2025-06-18 spec support

## Quick Reference

1. **Start MCP HTTP bridge**: `./scripts/start-mcp-browser-tools.sh`
2. **Chrome extension**: Required from https://browsertools.agentdesk.ai/
3. **Port for MCP**: 3025 (for Claude Code)
4. **Port for Direct**: 3026 (for other tools)
5. **Debug mode**: Set `MCP_DEBUG=1` in environment

## Testing

Check if working:
```bash
# See configured server
cat .claude/mcp.json | grep browser-tools

# Test MCP HTTP bridge (port 3025)
curl http://localhost:3025/health

# Test Direct HTTP bridge (port 3026)
curl http://localhost:3026/health

# Debug MCP server
MCP_DEBUG=1 node scripts/mcp-browser-tools-server.js
```

## MCP Protocol Compliance (September 2025)

**✅ VERIFIED: Full 2025-06-18 Protocol Compliance**
- Our MCP server uses: `"2025-06-18"` ✅
- Current MCP protocol: `"2025-06-18"` ✅
- **Status**: ✅ COMPLIANT - Verified against official specification
- **Implementation**: `scripts/mcp-browser-tools-server.js`
- **Validation**: All initialize handshake, capabilities, and tool definitions match spec

**✅ Compliance Checklist:**
- Protocol version: "2025-06-18" ✅
- Initialize response format ✅
- ServerInfo structure ✅
- Tool definitions with proper inputSchema ✅
- JSON-RPC 2.0 error handling ✅

## Notes

- MCP server auto-starts with Claude Code
- HTTP bridge needs manual start:
  - For Claude Code: `./scripts/start-mcp-browser-tools.sh` (port 3025)
  - For other tools: `./scripts/start-direct-browser-tools.sh` (port 3026)
- Chrome extension must be installed and connected to the same port as your bridge
- All debug output goes to stderr (never stdout)
- We built our own HTTP bridge - no dependency on the broken npm package!
