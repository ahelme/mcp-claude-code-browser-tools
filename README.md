# Browser Tools for Claude Code

## 🚀 **AgileAI Browser Tools - Revolutionary AI Collaborative Development**

The world's first browser tools project built using **AgileAI** - a revolutionary Agile methodology for human-AI collaborative development!

### **🎯 What is AgileAI?**
AgileAI combines XML-driven architecture, specialized AI agents, break-point methodology, and complete user control to create transparent, quality-assured collaborative development.

### **🛠️ Project Overview**
A powerful set of 9 browser automation tools built collaboratively with specialized AI agents:
- Complete re-write using AgileAI methodology
- 100% June 2025 MCP specification compliant
- Chrome extension with modern Manifest V3 architecture

### **🚀 Quick Start with AgileAI**
Ready to experience revolutionary AI collaboration? See **[AgileAI_KickStart.md](product-management/product-management_docs/AgileAI_KickStart.md)** for 5-minute setup!

## PROJECT STATUS: AgileAI Ready!
- **REVOLUTIONARY**: World's first Agile methodology for human-AI collaborative development
- **8 Claude Identity Agents**: Ready for interactive collaboration (GitHub Issues #40-47)
- **Next Priority**: Agent B - Framework Specialist for Chrome extension architecture
- **Implementation**: 100% June 2025 MCP-compliant with AgileAI break-point methodology
- **MCP Method**: `mcp-server/server.mjs` + `mcp-server/http-bridge.mjs` (port 3024)

### 🦁 AGILEAI FOUNDATION INFRASTRUCTURE COMPLETE ✅
**World's first complete AI collaborative development platform!**
- 🦁 **AgileAI Methodology**: Revolutionary Agile methodology for human-AI collaborative development
- ✅ **Foundation Merged**: Complete infrastructure with contracts, base classes, registry system
- 🏗️ **Core Architecture**: TypeScript interfaces, quality gates, monitoring system
- 🤖 **Agent Universes**: 9 agents in 4 logical batches for systematic development
- 📋 **Contract-Driven**: OpenAPI specifications and comprehensive quality requirements
- 🎯 **Complete Documentation**: [AgileAI KickStart Guide](product-management/product-management_docs/AgileAI_KickStart.md) | [Agent Specifications](product-management/product-management_docs/)

### 🏗️ **AGILEAI FOUNDATION & BATCH SYSTEM**
**Current Status - Foundation Complete, Ready for Batch 2:**
- **✅ Batch 1**: Agent A (Foundation) - COMPLETED & MERGED
  - Contracts: OpenAPI 3.0 specification, quality gates
  - Core: Base classes, interfaces, registry system
  - Infrastructure: Service worker, monitoring, MCP handler
- **🎯 Batch 2**: Agent B (Framework) - NEXT TO DEPLOY
  - UI Framework & Component System
- **🎯 Batch 3**: Agents C,D,E (Core Tools) - Working in OLD extension, NEW implementation needed
  - browser_navigate, browser_screenshot, browser_click, browser_type, browser_wait
- **🎯 Batch 4**: Agents F,G,H,I (Advanced Tools) - Broken in OLD extension, NEW implementation needed
  - browser_evaluate, browser_audit, browser_get_console, browser_get_content

### ⚡ **AGILEAI BRANCH STRATEGY**
- **`main`**: Default stable branch
- **Agent branches**: Each agent works in dedicated development reality
- **Foundation**: Infrastructure merged and operational

### 🔄 IMPLEMENTATION STATUS (All tools need NEW implementation):

**Working in OLD AgentDesk Chrome Ext. Need to be Implemnted in OUR new Chrome Ext:**
  1. browser_navigate - Successfully navigates to URLs (NEW implementation needed)
  2. browser_screenshot - Captures screenshots perfectly (NEW implementation needed)
  3. browser_click - Clicks elements successfully (NEW implementation needed)
  4. browser_type - Types text into input fields (NEW implementation needed)
  5. browser_wait - Waits for elements to appear (NEW implementation needed)
  
**Broken in OLD AgentDesk Chrome Ext. & Need to be Implemnted in OUR new Chrome Ext:**
  6. browser_evaluate - Timeout error when executing JavaScript (NEW implementation needed)
  7. browser_get_content - Request timeout (NEW implementation needed)
  8. browser_audit - Returns HTML instead of JSON (NEW implementation needed)
  9. browser_get_console - Request timeout (NEW implementation needed)

**🎯 Our Goal**: Build ALL 9 tools from scratch using our foundation infrastructure (.mjs modules)

## 🛡️ Code Quality Standards
**Enterprise-grade standards for all AgileAI agents:**
- See gh issues 30-34

### Features

#### **Runs Headless**:
  - Facilitates multi-tasking: user can operate computer without interfering with autonomous browser-testing by AI agent
  - Uses fewer resources
  - Faster navigation

#### **Console Monitoring**:
  - Accurate pick up of errors by AI agents 
  - Agents better at checking results of changes (user does not find app "broken" as often, while agent declares 100% fixed)
  - AI agents faster at reading console errors than screenshots 
  
#### **Take Screenshots for UI Analysis**: 
  - Autonomous AI agent screenshots as per Puppeteer, but faster
  - One-click screenshots through Chrome extension
  
#### **Lighthouse Audits**:
   - Accessibility
   - SEO
   - Performance 

#### **UI-based Configuration via AgentDesk's 'Browser Tools' Chrome extension**:
  - Leverage AgentDesk's original Chrome Extension "Browser Tools"
    - Set Port Number or let Extension scan ports
    - Update screenshots directory 
    - Configure log/query/string length and wipe logs
    - Include Request/Response headers
    - Toggle Auto-Paste to Cursor

### **Why Did We Re-Write Browser Tools MCP Server?** 

We built our own browser tools MCP server to address critical protocol violations in the original npm package maintained by agentdeskai, which used the older > June 2025 MCP specification and no longer functioned.


### **Our Solution**
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
```

4. **Start the HTTP Bridge Server (port 3024) in NEW Terminal Tab/Window**
starts on **Port 3024

```bash
# Start MCP HTTP bridge (for Claude Code) - PREFERRED METHOD
./mcp-server/start.sh

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

## 📚 API Documentation

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

**Features:**
- ✅ **Dual Protocol Support** - REST (OpenAPI 3.0.3) + WebSocket (AsyncAPI 3.0.0)
- ✅ **Interactive testing** - test REST API directly from browser
- ✅ **Protocol visualization** - AsyncAPI Studio integration for WebSocket protocol
- ✅ **AI-agent friendly** - auto-discoverable endpoints and standard formats
- ✅ **Contract-driven** - single source of truth prevents documentation drift
- ✅ **Always accurate** - reflects actual implementation

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
Guide to usage of available tools: TOOLS_GUIDE.md

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
