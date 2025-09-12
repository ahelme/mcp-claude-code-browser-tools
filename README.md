# Browser Tools for Claude Code

**Custom MCP Server Implementation** - A 100% protocol-compliant browser automation server.

## What Is This?

We created our own MCP server implementation (`browser-tools-mcp-2025.js`) because the official npm package violates the MCP stdio protocol. Our server:
- ✅ 100% MCP 2025-03-26 specification compliant
- ✅ Zero console output (no stdio pollution)
- ✅ Direct integration with Chrome extension via HTTP server
- ✅ Nine browser automation tools available in Claude Code

## Features

- **Nine browser control tools** - Complete automation toolkit
- **Screenshot capture** - Full page or specific elements
- **Lighthouse audits** - Performance, SEO, accessibility testing
- **Console monitoring** - Capture logs, errors, warnings
- **Element interaction** - Click, type, wait for elements
- **Clean implementation** - 100% MCP protocol compliant

## Quick Start

### 1. Install Chrome Extension

Download and install the BrowserToolsMCP extension from: https://browsertools.agentdesk.ai/

### 2. Start the HTTP Bridge Server

Our custom MCP server still needs the HTTP bridge to communicate with the Chrome extension:

```bash
./scripts/start-browser-tools.sh
```

This starts the HTTP server on port 3025 that bridges our MCP server to the Chrome extension.

### 3. Use in Claude Code

The MCP server is already configured in `.claude/mcp.json` and auto-starts with Claude Code.

Available tools:
- `mcp__browser-tools__navigate` - Navigate to URL
- `mcp__browser-tools__screenshot` - Capture screenshots
- `mcp__browser-tools__click` - Click elements
- `mcp__browser-tools__type` - Type text
- `mcp__browser-tools__evaluate` - Execute JavaScript
- `mcp__browser-tools__get_content` - Get page HTML
- `mcp__browser-tools__audit` - Run Lighthouse audits
- `mcp__browser-tools__wait` - Wait for elements
- `mcp__browser-tools__get_console` - Get console logs

## Architecture

```
Claude Code <--[JSON-RPC/stdio]--> Our MCP Server <--[HTTP:3025]--> HTTP Bridge <--[WebSocket]--> Chrome Extension
```

## Why Custom Implementation?

The official `@agentdeskai/browser-tools-mcp` npm package (v1.2.0-1.2.1) has critical bugs:
- 12 console.log statements that pollute stdout
- 18 console.error statements that break JSON-RPC
- Violates MCP stdio protocol requirements

Our solution (`browser-tools-mcp-2025.js`):
- Clean implementation from scratch
- Follows 2025-03-26 MCP specification exactly
- All debugging goes to stderr (when MCP_DEBUG=1)
- Tool errors handled properly with `isError` flag

## Configuration

The MCP server configuration in `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "browser-tools": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/Users/lennox/development/browser-tools-setup/scripts/browser-tools-mcp-2025.js"
      ],
      "env": {
        "BROWSER_TOOLS_PORT": "3025",
        "MCP_DEBUG": "1"
      }
    }
  }
}
```

## Project Structure

```
browser-tools-setup/
├── scripts/
│   ├── browser-tools-mcp-2025.js    # Our clean MCP server (MAIN)
│   └── start-browser-tools.sh       # Start HTTP bridge server
├── .claude/
│   └── mcp.json                     # MCP configuration
├── .screenshots/                    # Screenshot output
├── .tests/                         # Test files
└── memory-bank/                    # Session persistence
```

## Testing

1. Check MCP server is configured:
   ```bash
   cat .claude/mcp.json | grep browser-tools-mcp-2025
   ```

2. Start HTTP bridge server:
   ```bash
   ./scripts/start-browser-tools.sh
   ```

3. Test with debug output:
   ```bash
   MCP_DEBUG=1 node scripts/browser-tools-mcp-2025.js
   ```

## Documentation

- [MCP-2025-SPEC-SOLUTION.md](MCP-2025-SPEC-SOLUTION.md) - Full technical details
- [CLEAN-MCP-SOLUTION.md](CLEAN-MCP-SOLUTION.md) - Initial implementation notes

## Important Notes

- HTTP bridge server ALWAYS uses port 3025 (hardcoded)
- Chrome extension required for browser control
- Our MCP server auto-starts with Claude Code
- Debug output goes to stderr only (MCP_DEBUG=1)
- The HTTP bridge uses `@agentdeskai/browser-tools-server@1.2.1` (only for HTTP, not MCP)

## Resources

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-03-26)
- [Browser Tools GitHub](https://github.com/AgentDeskAI/browser-tools-mcp)
- [Chrome Extension](https://browsertools.agentdesk.ai/)