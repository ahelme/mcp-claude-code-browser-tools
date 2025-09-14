# Browser Tools for Claude Code

**Complete Custom Implementation** - Both MCP server and HTTP bridge built from scratch, 100% protocol-compliant.

## What Is This?

We created our own complete solution - both MCP server (`browser-tools-mcp-2025.js`) and HTTP bridge (`http-bridge-server.js`) - because the official npm package violates the MCP stdio protocol. Our implementation:
- ✅ 100% MCP 2025-03-26 specification compliant
- ✅ Zero console output (no stdio pollution)
- ✅ Custom HTTP bridge for Chrome extension communication
- ✅ Nine browser automation tools available in Claude Code

## Features

- **Nine browser control tools** - Complete automation toolkit
- **Screenshot capture** - Full page or specific elements
- **Lighthouse audits** - Performance, SEO, accessibility testing
- **Console monitoring** - Capture logs, errors, warnings
- **Element interaction** - Click, type, wait for elements
- **Clean implementation** - 100% MCP protocol compliant
- **Minimal dependencies** - Just 3 npm packages (express, cors, ws)

## Quick Start

### 1. Install Chrome Extension

Download and install the BrowserToolsMCP extension from: https://browsertools.agentdesk.ai/

### 2. Install Dependencies & Start HTTP Bridge

```bash
# First time only - install dependencies
npm install

# Start our custom HTTP bridge server
./scripts/start-browser-tools.sh
```

This starts our custom HTTP bridge on port 3025 for Chrome extension communication.

### 3. Use in Claude Code

The MCP server is already configured in `.claude/mcp.json` and auto-starts with Claude Code.

### 4. Connect Chrome Extension

After the three steps above:

1. **Open Chrome Dev Tools** in the browser tab where you want to use browser tools
2. **Navigate to the BrowserToolsMCP panel** in Dev Tools
3. **Set Server Port**: Type "3025" into Browser Tools chrome extension under "Server Connection Settings > Server Port" & hit return
4. **Verify connection status** - should show "Connected" instead of "Searching..."

#### Troubleshooting Connection Issues

If the extension shows "Not connected to server. Searching..." try these steps:

1. **Quit Chrome completely** - Not just the window but all of Chrome itself
2. **Restart the local node server** (HTTP bridge server)
3. **Ensure only ONE instance** of Chrome Dev Tools panel is open
4. **Refresh the browser tab** and reopen Dev Tools

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

### MCP Server Settings

Your Claude Code project should include **browser-tools** configured in `.claude/mcp.json`:

**Note**: `MCP_DEBUG` is optional - only include it if you want debug logging to stderr.

```json
{
  "mcpServers": {
    "browser-tools": {
      "type": "stdio",
      "command": "node",
      "args": [
        "scripts/browser-tools-mcp-2025.js"
      ],
      "env": {
        "BROWSER_TOOLS_PORT": "3025",
        "MCP_DEBUG": "1"
      }
    }
  }
}
```

### MCP Server Description

- **browser-tools**: Our custom implementation providing 9 browser automation tools
- **BROWSER_TOOLS_PORT**: Port 3025 (required) - connects to HTTP bridge server
- **MCP_DEBUG**: Optional debug logging to stderr (set to "1" to enable)

### Configuration Guidelines

1. **File Location**: Place `mcp.json` in `.claude/` directory in your project root
2. **Server Types**: All servers use `"type": "stdio"` for JSON-RPC communication
3. **Environment Variables**: Configure ports and debug modes in the `env` section
4. **Path Requirements**: Use absolute paths for local scripts (e.g., our browser-tools-mcp-2025.js)
5. **NPX Dependencies**: External packages can be run with `npx -y` for auto-installation

### Customizing Settings

To modify MCP server configurations:

1. Edit `.claude/mcp.json`
2. Restart Claude Code to apply changes
3. Test server connectivity with debug mode: `MCP_DEBUG=1`

**Note**: Keep `.claude/` directory in `.gitignore` to avoid committing local configurations.

## Project Structure

```
browser-tools-setup/
├── scripts/
│   ├── browser-tools-mcp-2025.js    # Our custom MCP server
│   ├── http-bridge-server.js        # Our custom HTTP bridge
│   └── start-browser-tools.sh       # Start script
├── .claude/
│   └── mcp.json                     # MCP configuration
├── package.json                     # Project dependencies
├── .screenshots/                    # Screenshot output
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

## 🛠️ Using Audit Tools

### ✅ Before You Start
Ensure you have:
- An active tab in your browser
- The BrowserTools extension enabled

### ▶️ Running Audits

**Headless Browser Automation:**
Puppeteer automates a headless Chrome instance to load the page and collect audit data, ensuring accurate results even for SPAs or content loaded via JavaScript.

The headless browser instance remains active for 60 seconds after the last audit call to efficiently handle consecutive audit requests.

**Structured Results:**
Each audit returns results in a structured JSON format, including overall scores and detailed issue lists. This makes it easy for MCP-compatible clients to interpret the findings and present actionable insights.

The MCP server provides tools to run audits on the current page. Here are example queries you can use to trigger them:

#### Accessibility Audit (runAccessibilityAudit)
Ensures the page meets accessibility standards like WCAG.

**Example Queries:**
- "Are there any accessibility issues on this page?"
- "Run an accessibility audit."
- "Check if this page meets WCAG standards."

#### Performance Audit (runPerformanceAudit)
Identifies performance bottlenecks and loading issues.

**Example Queries:**
- "Why is this page loading so slowly?"
- "Check the performance of this page."
- "Run a performance audit."

#### SEO Audit (runSEOAudit)
Evaluates how well the page is optimized for search engines.

**Example Queries:**
- "How can I improve SEO for this page?"
- "Run an SEO audit."
- "Check SEO on this page."

#### Best Practices Audit (runBestPracticesAudit)
Checks for general best practices in web development.

**Example Queries:**
- "Run a best practices audit."
- "Check best practices on this page."
- "Are there any best practices issues on this page?"

#### Audit Mode (runAuditMode)
Runs all audits in a particular sequence. Will run a NextJS audit if the framework is detected.

**Example Queries:**
- "Run audit mode."
- "Enter audit mode."

#### NextJS Audits (runNextJSAudit)
Checks for best practices and SEO improvements for NextJS applications

**Example Queries:**
- "Run a NextJS audit."
- "Run a NextJS audit, I'm using app router."
- "Run a NextJS audit, I'm using page router."

#### Debugger Mode (runDebuggerMode)
Runs all debugging tools in a particular sequence

**Example Queries:**
- "Enter debugger mode."

## Architecture

There are three core components all used to capture and analyze browser data:

**Chrome Extension:** A browser extension that captures screenshots, console logs, network activity and DOM elements.
**Node Server:** An intermediary server that facilitates communication between the Chrome extension and any instance of an MCP server.
**MCP Server:** A Model Context Protocol server that provides standardized tools for AI clients to interact with the browser.

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│  MCP Client │ ──► │  MCP Server  │ ──► │  Node Server  │ ──► │   Chrome    │
│  (e.g.      │ ◄── │  (Protocol   │ ◄── │ (Middleware)  │ ◄── │  Extension  │
│ ClaudeCode  │     │   Handler)   │     │               │     │             │
└─────────────┘     └──────────────┘     └───────────────┘     └─────────────┘
```

Model Context Protocol (MCP) is a capability supported by Anthropic AI models that allow you to create custom tools for any compatible client. MCP clients like Claude Desktop, Cursor, Cline or Zed can run an MCP server which "teaches" these clients about a new tool that they can use.

These tools can call out to external APIs but in our case, all logs are stored locally on your machine and NEVER sent out to any third-party service or API. BrowserTools MCP runs a local instance of a NodeJS API server which communicates with the BrowserTools Chrome Extension.

All consumers of the BrowserTools MCP Server interface with the same NodeJS API and Chrome extension.

### Chrome Extension
- Monitors XHR requests/responses and console logs
- Tracks selected DOM elements
- Sends all logs and current element to the BrowserTools Connector
- Connects to Websocket server to capture/send screenshots
- Allows user to configure token/truncation limits + screenshot folder path

### Node Server
- Acts as middleware between the Chrome extension and MCP server
- Receives logs and currently selected element from Chrome extension
- Processes requests from MCP server to capture logs, screenshot or current element
- Sends Websocket command to the Chrome extension for capturing a screenshot
- Intelligently truncates strings and # of duplicate objects in logs to avoid token limits
- Removes cookies and sensitive headers to avoid sending to LLMs in MCP clients

### MCP Server
- Implements the Model Context Protocol
- Provides standardized tools for AI clients
- Compatible with various MCP clients (Cursor, Cline, Zed, Claude Desktop, etc.)

## Usage

Once installed and configured, the system allows any compatible MCP client to:
- Monitor browser console output
- Capture network traffic
- Take screenshots
- Analyze selected elements
- Wipe logs stored in our MCP server
- Run accessibility, performance, SEO, and best practices audits

## Compatibility

- Works with Claude Code 
- May work with other MCP-compatible clients e.g. Cursor IDE integration

## Documentation

- [MCP-2025-SPEC-SOLUTION.md](MCP-2025-SPEC-SOLUTION.md) - Full technical details
- [CLEAN-MCP-SOLUTION.md](CLEAN-MCP-SOLUTION.md) - Initial implementation notes

## Important Notes

- HTTP bridge server ALWAYS uses port 3025 (hardcoded)
- Chrome extension required for browser control
- Our MCP server auto-starts with Claude Code
- Debug output goes to stderr only (MCP_DEBUG=1)
- We built our own HTTP bridge - no dependency on the broken npm package!

## Resources

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-03-26)
- [Browser Tools GitHub](https://github.com/AgentDeskAI/browser-tools-mcp)
- [Chrome Extension](https://browsertools.agentdesk.ai/)
