# Browser Tools for Claude Code

## Project Overview

**Custom MCP Server Implementation** - We built our own browser-tools MCP server to fix critical protocol violations in the official npm package.

**Current Status**: Using `browser-tools-mcp-2025.js` - our clean, 100% MCP-compliant implementation.

## Features

- **Nine browser control tools** - Complete automation toolkit
- **Screenshot capture** - Full page or specific elements
- **Lighthouse audits** - Performance, SEO, accessibility testing
- **Console monitoring** - Capture logs, errors, warnings
- **Element interaction** - Click, type, wait for elements
- **Clean implementation** - 100% MCP protocol compliant

## Available MCP Servers

### 1. Browser-Tools MCP (Our Custom Implementation)
- **Location**: `scripts/browser-tools-mcp-2025.js`
- **Purpose**: Browser automation and testing
- **Port**: 3025 (HTTP bridge server connection)
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

# Start our custom HTTP bridge
./scripts/start-browser-tools.sh
```

This starts our custom HTTP bridge server on port 3025 that connects our MCP server to Chrome.

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

- `scripts/browser-tools-mcp-2025.js` - Our custom MCP server
- `scripts/http-bridge-server.js` - Our custom HTTP bridge
- `scripts/start-browser-tools.sh` - Start script
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
- Full 2025-03-26 spec support

## Quick Reference

1. **Start HTTP bridge**: `./scripts/start-browser-tools.sh`
2. **Chrome extension**: Required from https://browsertools.agentdesk.ai/
3. **Port**: Always 3025 (hardcoded)
4. **Debug mode**: Set `MCP_DEBUG=1` in environment

## Testing

Check if working:
```bash
# See configured server
cat .claude/mcp.json | grep browser-tools

# Test HTTP bridge
curl http://localhost:3025/health

# Debug MCP server
MCP_DEBUG=1 node scripts/browser-tools-mcp-2025.js
```

## Notes

- MCP server auto-starts with Claude Code
- HTTP bridge needs manual start (`./scripts/start-browser-tools.sh`)
- Chrome extension must be installed for browser control
- All debug output goes to stderr (never stdout)
- We built our own HTTP bridge - no dependency on the broken npm package!
