# Browser Tools for Claude Code


## Project Overview
A powerful set of tools for you and your AI agent to visually test and debug front-end development, navigate and analyse UI and audit performance, SEO and accessibility.

Consists of three parts:
1. MCP server
2. http bridge
3. Chrome extension

This project is a complete re-write of:
1. AgentDesk's sophisticated Browser Tools MCP server: updated to June 2025 MCP spec
2. AgentDesk's Chrome Extension: improve UI and address mcp tools no longer working


## Features

### **Runs Headless**:
  - Facilitates multi-tasking: user can operate computer without interfering with autonomous browser-testing by AI agent
  - Uses fewer resources
  - Faster navigation

### **Console Monitoring**:
  - Accurate pick up of errors by AI agents 
  - Agents better at checking results of changes (user does not find app "broken" as often, while agent declares 100% fixed)
  - AI agents faster at reading console errors than screenshots 
  
### **Take Screenshots for UI Analysis**: 
  - Autonomous AI agent screenshots as per Puppeteer, but faster
  - One-click screenshots through Chrome extension
  
### **Lighthouse Audits**:
   - Accessibility
   - SEO
   - Performance 

### **UI-based Configuration via AgentDesk's 'Browser Tools' Chrome extension**:
  - Leverage AgentDesk's original Chrome Extension "Browser Tools"
    - Set Port Number or let Extension scan ports
    - Update screenshots directory 
    - Configure log/query/string length and wipe logs
    - Include Request/Response headers
    - Toggle Auto-Paste to Cursor

## Why Re-Write Browser Tools MCP Server?

Built custom browser tools MCP server to address critical protocol violations in original npm package (agentdeskai), which used older MCP specification and no longer functioned.

### Our Solution
- 100% 2025-06-18 MCP protocol compliant
- Clean stdio implementation
- Proper error handling


## QuickStart Guide

1. **Exit Claude Code**
(or do not start it yet)

```bash
/exit
```
2. **Configure Claude Code MCP tools in .mcp.json**: e.g. inside project directory `.mcp.json`

  ( **TOGGLE DEBUG MODE either ON: "1" or OFF: "0"** )
   
```
{
  "mcpServers": {
    "mcp-claude-code-browser-tools": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/Users/lennox/development/browser-tools-setup/mcp-server/server.mjs"
      ],
      "env": {
        "BROWSER_TOOLS_PORT": "3024",
        "MCP_DEBUG": "1"
      }
    }
  }
}
```

3. **Install and Prepare Claude Code Browser Tools (first time only)**

```bash
# Install the MCP server and scripts
==TO-BE-DETERMINED==

# First time only - install dependencies
npm install

# Make script executable (
chmod +x mcp-server/start.sh
chmod +x start_all.sh
```

4. **Start the HTTP Bridge Server (port 3024) in NEW Terminal Tab/Window**
starts on **Port 3024

```bash
# Start MCP HTTP bridge 
./mcp-server/start.sh

# Or: Start bridge and docs server
./start_all.sh   

# Or Start Development Mode with Docs Watching
npm run dev                      

# CRITICAL - Working Directory Matters:
# ✅ Use script: ./mcp-server/start.sh (handles working directory correctly)
# ✅ Or direct: node mcp-server/http-bridge.mjs (from project root)
# ❌ Never: cd mcp-server && node http-bridge.mjs (wrong working directory)
```

5. **Download/install Browser Tools Chrome extension**
from https://github.com/ahelme/mcp-claude-code-browser-tools/tree/main/chrome-extension

6. **Activate Chrome Extension**: 
Open Developer Tools (F12) & select Browser Tools tab 

**NOTE: Browser Tools tab MUST BE ACTIVE**


7. **Re/Start Claude Code in FIRST terminal window/tab**: `$ claude`

8. **Configure Browser Tools Chrome Extension Port to 3024** 
Set via UI form field "Server Connection Settings > Server Port to **3024**"

This will connect extension to Claude Code Browser Tools MCP Server (via http bridge).


## Start Services (http bridge, docs server)

Unified Development Experience

```
# Simple startup commands
./start_all.sh                    # Start everything
npm start                         # Alias for start_all.sh
npm run dev                       # Development mode with doc watching
```

## Architecture

```
Main Method (MCP): Claude Code <--[stdio]--> MCP Server <--[HTTP:3024]--> MCP Bridge <--[WebSocket]--> Chrome Extension
Backup Method (Direct): External Tool <--[HTTP:3026]--> Direct Bridge <--[WebSocket]--> Chrome Extension
```
### Chrome Extension
- Monitors XHR requests/responses and console logs
- Tracks selected DOM elements
- Sends all logs and current element to the BrowserTools Connector
- Connects to Websocket server to capture/send screenshots
- Allows user to configure token/truncation limits + screenshot folder path

### Node Server HTTP Bridge
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

**See [mcp-server/mcp-server_docs/CODE-ARCHITECTURE.md](mcp-server/mcp-server_docs/CODE-ARCHITECTURE.md) for more details.**

**IMPORTANT**: Port 3024 is reserved for MCP server method.

## Project Code Structure

```
browser-tools-setup/
├── MANE/                    # Complete MANE methodology (12 docs)
├── contracts/               # Foundation contracts (MERGED)
│   ├── http.yaml            # OpenAPI 3.0 specification
│   ├── config.schema.json   # Configuration schema
│   ├── Event contracts      # Event contracts
│   └── QUALITY_GATE.md      # Quality gate requirements
├── chrome-extension/        # Chrome extension files
│   ├── interfaces.mjs       # Interface definitions
│   ├── base-classes.mjs     # Base classes
│   ├── registry.mjs         # Auto-discovery registry
│   ### CORE EXTENSION FILES
│   ├── background.js        # Service worker - message routing
│   ├── panel.js             # Panel orchestrator - delegates to modules
│   ├── panel.html           # UI html structure
│   ├── devtools.js          # DevTools initialization
│   ├── manifest.json        # Extension configuration
│   ### FEATURE MODULES
│   ├── screenshot.js        # Screenshot orchestrator - delegates to modules
│   ├── navigation.js        # Navigation features
│   ├── interactions.js      # Click/type/wait
│   ├── websocket.js         # WebSocket management
│   ### PANEL MODULES (Extracted from panel.js)
│   ├── panel/
│   │   ├── settings-manager.js     # Settings persistence via Chrome storage
│   │   ├── log-display.js          # Memory-managed log display
│   │   └── connection-manager.js   # WebSocket connection & server discovery
│   ### SCREENSHOT MODULES (Extracted from screenshot.js)
│   ├── screenshot/
│   │   ├── filename-generator.js   # Smart filename generation
│   │   ├── screenshot-capture.js   # Dual-pathway capture engine
│   │   └── screenshot-ui.js        # UI feedback & visual state
│   ### UTILITIES
│   ├── constants.js         # Configuration constants
│   ├── url-validator.js     # URL validation
│   ├── memory-manager.js    # History management
│   ├── bug-fixes.js         # Patches
│   └── *.mjs                # Additional modules
│   ### CHROME EXT. DOCUMENTATION
│   └── chrome-extension_docs/
│       ├── WEBSOCKET_PROTOCOL.md          # WebSocket protocol spec
│       ├── INTERFACE-CONTRACTS.md         # Interface contracts
│       ├── BEST_PRACTICES.md              # Development guidelines
│       ├── SCREENSHOT_TESTING_GUIDE.md    # Testing guide
│       └── TROUBLESHOOTING_GUIDE.md       # Debugging guide
├── mcp-server/              # MCP server implementation
│   ├── server.mjs           # Main MCP server
│   ├── http-bridge.mjs      # HTTP bridge (3024)
│   ├── start.sh             # Start script
│   └── mcp-server_docs/     # Server documentation
├── product-management/      # Product management tools
│   └── mcp-servers/         # Product management MCP servers
│       └── memory-bank/     # Session persistence
├── .claude/agents/          # Agent definitions
├── .mcp.json                # Project MCP configuration
└── CLAUDE.md                # Project instructions
```

##  DOCUMENTATION 

See CLAUDE.md for markdown documentation structure.


### 📚 API Documentation

**Complete Protocol Documentation** is available for developers and AI agents:

```bash
# Start comprehensive documentation server
./chrome-extension/start-docs.sh
```

**Available Endpoints:**
- 📚 **Documentation Portal**: http://localhost:3020/docs - Combined REST & WebSocket docs
- 🔗 **REST API docs**: http://localhost:3020/rest-docs - OpenAPI/Swagger UI
- 🔌 **WebSocket docs**: http://localhost:3020/ws-docs - AsyncAPI protocol docs
- 📄 **OpenAPI spec**: http://localhost:3020/openapi.yaml - REST API contract
- 📡 **AsyncAPI spec**: http://localhost:3020/asyncapi.yaml - WebSocket protocol contract
- 🤖 **AI-discoverable**: http://localhost:3020/health - Complete protocol metadata
- 🔍 **JSON formats**: http://localhost:3020/openapi.json | http://localhost:3020/asyncapi.json

**Port Layout:**
- **3020** - API Documentation Server
- **3024** - MCP HTTP Bridge (main functionality)
- **3025+** - Multi-project instances

## Testing and Debugging 

Check if working:
```bash
# See configured server
cat .claude/mcp.json | grep browser-tools

# Test MCP HTTP bridge (port 3024)
curl http://localhost:3024/health

# Debug MCP server
MCP_DEBUG=1 node mcp-server/server.mjs
```

### **Configure MCP Server to Debug Mode**: 
Set `MCP_DEBUG=1` in .mcp.json (see above).

## Alternative Direct HTTP Method (backup option if MCP server fails)
Option to run direct http connection via **Port 3026**

```bash

# Starts the direct MCP HTTP bridge on port 3026
./mcp-server/mcp-server/start-direct-browser-tools.sh

# Test Direct HTTP bridge (port 3026)
curl http://localhost:3026/health

```


## 🚀 Multi-Project Usage

**Run browser tools across multiple projects simultaneously without port conflicts!**

The MCP server uses environment variables to allow custom port configuration, making it easy to run multiple instances.

### Method 1: Per-Project .mcp.json Configuration

Each project can specify its own port in `.mcp.json`:

```json
{
  "mcpServers": {
    "mcp-claude-code-browser-tools": {
      "type": "stdio",
      "command": "node",
      "args": ["path/to/mcp-server/server.mjs"],
      "env": {
        "BROWSER_TOOLS_PORT": "3025",  // Custom port for this project
        "MCP_DEBUG": "1"
      }
    }
  }
}
```

### Method 2: Environment Variable Override

Start with custom ports using environment variables:

```bash
# Project A (default port)
cd /path/to/project-a
./mcp-server/start.sh
# → Runs on port 3024

# Project B (custom port)
cd /path/to/project-b
BROWSER_TOOLS_PORT=3025 ./mcp-server/start.sh
# → Runs on port 3025

# Project C (another custom port)
cd /path/to/project-c
BROWSER_TOOLS_PORT=3026 ./mcp-server/start.sh
# → Runs on port 3026
```

### Chrome Extension Setup for Multiple Projects

1. **Install Browser Tools extension** once from https://browsertools.agentdesk.ai/
2. **Switch between projects** by changing the port in extension settings:
   - Project A: Set port to `3024`
   - Project B: Set port to `3025`
   - Project C: Set port to `3026`
3. **Or use multiple Chrome profiles** - each with different port settings

### Quick Multi-Project Example

```bash
# Terminal 1 - Project A (React app)
cd ~/projects/my-react-app
./mcp-server/start.sh  # port 3024
claude  # Start Claude Code

# Terminal 2 - Project B (Vue app)
cd ~/projects/my-vue-app
BROWSER_TOOLS_PORT=3025 ./mcp-server/start.sh  # port 3025
claude  # Start Claude Code

# Terminal 3 - Project C (Angular app)
cd ~/projects/my-angular-app
BROWSER_TOOLS_PORT=3026 ./mcp-server/start.sh  # port 3026
claude  # Start Claude Code
```

Now you can work on multiple projects simultaneously! 🎉

### Port Range Recommendations

- **3024**: Default (Project A)
- **3025-3030**: Additional projects
- **3031+**: Available for other tools

## Tools and Examples 

### Individual Tools (NOT ALL WORKING YET)

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

## Tools Guide
Guide to usage of available tools: /mcp-server/mcp-server_docs/TOOLS_GUIDE.md

## Important Files

### MCP Method (Port 3024)
- `mcp-server/server.mjs` - MCP server
- `mcp-server/http-bridge.mjs` - MCP HTTP bridge
- `mcp-server/start.sh` - Start script for MCP

### BACKUP: Direct Method (Port 3026)
- `mcp-server/mcp-server/direct-http-bridge.js` - Direct HTTP bridge
- `mcp-server/mcp-server/start-direct-browser-tools.sh` - Start script for direct

### Configuration, Files & Directories
- `~/.claude/mcp.json` - ==(DANGEROUS TO MODIFY)== User-level MCP configuration (Claude Code) 
- `.mcp.json` - Project-level MCP configuration (local config and team collaboration)
- `.screenshots/` - Screenshot outputs

## 🔧 Environment Variables

The MCP server supports several environment variables for customization:

### Core Configuration

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `BROWSER_TOOLS_PORT` | `3024` | HTTP bridge port for MCP server | `3025` |
| `MCP_HTTP_BRIDGE_PORT` | `3024` | Alternative name for same setting | `3026` |
| `MCP_DEBUG` | `0` | Enable detailed debug logging | `1` |

## MCP Configuration Guidelines

1. **File Location**: Place `.mcp.json` in codebase root using latest MCP specification
2. **Server Types**: All use `"type": "stdio"` for JSON-RPC communication
3. **Environment Variables**: Configure ports and debug in `env` section
4. **Paths**: Use absolute paths for local scripts
5. **NPX Dependencies**: External packages use `npx -y` for auto-installation

## Testing and Debugging

```bash
# Check configuration
cat .mcp.json | grep browser-tools

# Test HTTP bridge
curl http://localhost:3024/health

# Debug MCP server
MCP_DEBUG=1 node mcp-server/server.mjs
```


### Port Conflict Issues

**Problem**: "Error: listen EADDRINUSE: address already in use :::3024"

**Solutions:**

```bash
# 1. Check what's using the port
lsof -i :3024

# 2. Kill existing process
pkill -f "mcp-http-bridge"

# 3. Or use a different port
BROWSER_TOOLS_PORT=3025 ./mcp-server/start.sh
```

### Multi-Project Port Conflicts

**Problem**: Running multiple projects simultaneously

**Solution**: Use different ports per project

```bash
# Check active browser tools processes
ps aux | grep mcp-http-bridge

# See which ports are in use
lsof -i :3024-3030

# Start each project with unique port
cd project-a && BROWSER_TOOLS_PORT=3024 ./mcp-server/start.sh
cd project-b && BROWSER_TOOLS_PORT=3025 ./mcp-server/start.sh
```

## Configuration

### MCP Server Settings

To modify MCP server configurations:

1. Edit `.mcp.json` in codebase root
2. Restart Claude Code to apply changes
3. Test server connectivity with debug mode: `MCP_DEBUG=1`

```json
{
  "mcpServers": {
    "claude-code-browser-tools": {
      "type": "stdio",
      "command": "node",
      "args": [
        "mcp-server/claude-code-browser-tools.js"
      ],
      "env": {
        "BROWSER_TOOLS_PORT": "3024",
        "MCP_DEBUG": "1"
      }
    }
  }
}
```

### Configuration Tips & Guidelines

1. **File Location**: Place `.mcp.json` in codebase root directory configured using latest specification
2. **Server Types**: All servers use `"type": "stdio"` for JSON-RPC communication
3. **Environment Variables**: Configure ports and debug modes in the `env` section
4. **Path Requirements**: Use absolute paths for local scripts (e.g., our browser-tools-mcp-2025.js)
5. **NPX Dependencies**: External packages can be run with `npx -y` for auto-installation


## Compatibility

- Works with Claude Code 
- May work with other MCP-compatible clients e.g. Cursor IDE integration

## Documentation

- [TOOLS-GUIDE.md](mcp-server/mcp-server_docs/TOOLS-GUIDE.md) - Guide to use of available tools
- [CODE-ARCHITECTURE.md](mcp-server/mcp-server_docs/CODE-ARCHITECTURE.md) - Full technical details

## Important Notes

- MCP HTTP bridge uses port 3024 (for Claude Code)
- Direct HTTP bridge uses port 3026 (for API access)
- Chrome extension required for browser control
- MCP servers that are configured in .mcp.json auto-start with Claude Code
- Debug output goes to stderr only (MCP_DEBUG=1)

## Resources

- [Original Chrome Extension by AgentDesk](https://browsertools.agentdesk.ai/)
- [Original Browser Tools MCP by AgentDesk](https://github.com/AgentDeskAI/browser-tools-mcp)
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-06-18)
