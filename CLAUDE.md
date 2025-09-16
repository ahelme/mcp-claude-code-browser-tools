# Browser Tools for Claude Code

## Project Overview
A powerful set of tools for your AI agent to visually test and debug front-end development, navigate and analyse UI and audit performance, SEO and accessibility.

Complete re-write of AgentDesk's sophisticated Browser Tools MCP server to optimise browser-testing and front-end development with AI agents - now updated to June 2025 MCP specification. 

The re-write still relies on AgentDesk's Chrome Extension available (here)[https://browsertools.agentdesk.ai/]

## IN-DEVELOPMENT: Current Status - Partially Working
- FIVE out of NINE tools currently working (see below)
- 100% June 2025 MCP-compliant implementation
- **MCP Method**: `mcp-claude-code-browser-tools.mjs` + `mcp-http-bridge.mjs` (port 3024)

### ✅ WORKING (5 tools):

  1. browser_navigate - Successfully navigates to URLs
  2. browser_screenshot - Captures screenshots perfectly
  3. browser_click - Clicks elements successfully
  4. browser_type - Types text into input fields
  5. browser_wait - Waits for elements to appear
  
###  ❌ NOT WORKING (4 tools):

  6. browser_evaluate - Timeout error when executing JavaScript
  7. browser_get_content - Request timeout
  8. browser_audit - Returns HTML instead of JSON (parsing error)
  9. browser_get_console - Request timeout

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
        "/Users/lennox/development/browser-tools-setup/scripts/mcp-claude-code-browser-tools.mjs"
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
chmod +x scripts/start-mcp-browser-tools.sh
```

4. **Start the HTTP Bridge Server (port 3024) in NEW Terminal Tab/Window**
starts on **Port 3024

```bash
# Start MCP HTTP bridge (for Claude Code)
./scripts/start-mcp-browser-tools.sh
```

5. **Download/install Browser Tools Chrome extension** 
from https://browsertools.agentdesk.ai/

6. **Activate Chrome Extension**: 
Open Developer Tools (F12) & select Browser Tools tab 

**NOTE: Browser Tools tab MUST BE ACTIVE**


7. **Re/Start Claude Code in FIRST terminal window/tab**: `$ claude`

8. **Configure Browser Tools Chrome Extension Port to 3024** 
Set via UI form field "Server Connection Settings > Server Port to **3024**"

This will connect extension to Claude Code Browser Tools MCP Server (via http bridge).

## MCP Server Configuration Tips & Guidelines

1. **File Location**: Place `.mcp.json` in codebase root directory configured using latest MCP specification
2. **Server Types**: All servers use `"type": "stdio"` for JSON-RPC communication
3. **Environment Variables**: Configure ports and debug modes in the `env` section
4. **Path Requirements**: Try absolute paths for local scripts (e.g., our mcp-claude-code-browser-tools.js)
5. **NPX Dependencies**: External packages can be run with `npx -y` for auto-installation

## Testing and Debugging 

Check if working:
```bash
# See configured server
cat .mcp.json | grep browser-tools

# Test MCP HTTP bridge (port 3024)
curl http://localhost:3024/health

# Debug MCP server
MCP_DEBUG=1 node scripts/mcp-claude-code-browser-tools.mjs
```

### **Configure MCP Server to Debug Mode**: 
Set `MCP_DEBUG=1` in .mcp.json (see above).

## Alternative Direct HTTP Method (backup option if MCP server fails)
Option to run direct http connection via **Port 3026**

```bash

# Starts the direct MCP HTTP bridge on port 3026
./scripts/start-direct-browser-tools.sh

# Test Direct HTTP bridge (port 3026)
curl http://localhost:3026/health

```

**IMPORTANT**: Port 3024 is reserved for MCP server method.

## Project Structure

```
browser-tools-setup/
├── scripts/
│   ├── mcp-claude-code-browser-tools.mjs   # MCP server
│   ├── mcp-http-bridge.mjs            # MCP HTTP bridge (port 3024)
│   ├── direct-http-bridge.js         # Direct HTTP bridge (port 3026)
│   ├── start-mcp-browser-tools.sh    # Start MCP method
│   └── start-direct-browser-tools.sh # Start direct method
├── .mcp.json                         # Claude Code Project/Local MCP configuration             
├── .screenshots/                     # Screenshot output
├── README.md                         # Docs for public consumption
├── CLAUDE.md                         # Local/project Claude Code instructions and info
├── *.md                              # Further documentation
├── .claude/                          # Claude Code local settings 
├── .tests/                           # Keep ALL test files in here
├── .archives/                        # Outdated files 
├── .backups/                         # Backup copies of current files
├── .git/                             # Git config
├── node-modules/                     # Dependencies - DO NOT add to git tracking
├── package.json                      # Project dependencies
└── memory-bank/                      # Session memory persistence (memory-bank MCP server)
```

## Tools and Examples 

### Individual Tools in Browser Tools MCP (NOT ALL WORKING YET)

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

### MCP Method (Port 3024)
- `scripts/mcp-claude-code-browser-tools.mjs` - MCP server
- `scripts/mcp-http-bridge.mjs` - MCP HTTP bridge
- `scripts/start-mcp-browser-tools.sh` - Start script for MCP

### BACKUP: Direct Method (Port 3026)
- `scripts/direct-http-bridge.js` - Direct HTTP bridge
- `scripts/start-direct-browser-tools.sh` - Start script for direct

### Configuration
- `.claude/mcp.json` - ==(NEVER MODIFY)== Primary MCP configuration (Claude Code) 
- `.mcp.json` - Project-level MCP configuration (team collaboration)
- `.screenshots/` - Screenshot outputs

**IMPORTANT**: Only edit project-level configs. ==NEVER modify user-level ~/.claude.json==.

**BREAKTHROUGH FIX (Sept 14, 2025):**
- Updated browser-tools path ( `mcp-claude-code-browser-tools.js`)
- Updated .gitignore to track MCP configs for versioning
- All servers now respond correctly to JSON-RPC initialize messages

## MCP Protocol Compliance (September 2025)

**✅ VERIFIED: Full 2025-06-18 Protocol Compliance**
- Our MCP server uses: `"2025-06-18"` ✅
- Current MCP protocol: `"2025-06-18"` ✅
- **Status**: ✅ COMPLIANT - Verified against official specification
- **Implementation**: `scripts/mcp-claude-code-browser-tools.mjs`
- **Validation**: All initialize handshake, capabilities, and tool definitions match spec

**✅ Compliance Checklist:**
- Protocol version: "2025-06-18" ✅
- Initialize response format ✅
- ServerInfo structure ✅
- Tool definitions with proper inputSchema ✅
- JSON-RPC 2.0 error handling ✅

## Available MCP Servers in 'browser-tools-setup' project/directory:

### 1. Browser-Tools MCP (Our Custom Implementation) - 5/9 Tools Currently Working
- **MCP Server**: `scripts/mcp-claude-code-browser-tools.mjs`
- **Purpose**: Browser automation and testing
- **Status**: PARTIALLY FIXED - Path mismatch resolved (Sept 14, 2025)
- **Configuration**: Project level: `.claude/mcp.json`
- (see above for Features and which tools are working - which are NOT working)

### 2. Memory Bank MCP 
- **Purpose**: Persistent memory across sessions
- **Features**: Progress tracking, decision logging, context management
- **Status**: ✅ Connected and functioning

### 3. Sequential Thinking MCP
- **Purpose**: Step-by-step problem solving
- **Status**: ✅ Connected and functioning

## MCPS NOT CURRENTLY CONFIGURED 

### Minimal Test MCP - REMOVED FROM MCP CONFIG - disabled until needed for testing
- **MCP Server**: `scripts/minimal_mcp_server_new_protocol_released_June_2025_for_browser_tools.js`
- **Purpose**: MCP protocol testing and validation
- **Status**: Responds correctly to initialize messages

### Playwright MCP 🔄 READY
- **Purpose**: Alternative browser automation
- **Status**: Ready for on-demand installation via npx -y

## Notes

- MCP servers configured at project or user level auto-start with Claude Code
- HTTP bridge needs manual start:
  - For Claude Code: `./scripts/start-mcp-browser-tools.sh` (port 3024)
  - For other tools: `./scripts/start-direct-browser-tools.sh` (port 3026)
- Chrome extension must be installed and connected to the same port as your bridge
- All debug output goes to stderr (never stdout)
- We built our own HTTP bridge - no dependency on the broken npm package!
