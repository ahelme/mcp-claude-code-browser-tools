# Browser Tools for Claude Code

## 🚀 Project Overview

Get Browser Tools MCP working by refining installation/configuration see:
https://github.com/AgentDeskAI/browser-tools-mcp/

**Current Status**: Browser-tools server running successfully on port 3040 via intelligent port registry system.

## 📍 Port Registry System

**Automatic Port Management**: This project uses an intelligent port registry at `~/.claude/browser-tools-ports/registry.json`
- **This project's port**: 3040 (check with `./scripts/get-browser-tools-port.sh`)
- **No conflicts**: Each project gets its own unique port automatically
- **Zero config**: Start script auto-detects and uses assigned port

## 🛠️ Available MCP Servers

### All MCP Servers in This Project

#### 1. Memory Bank MCP (`memory-bank-mcp`)
- **Purpose**: Persistent memory and context management across sessions
- **Features**:
  - Track project progress and decisions
  - Maintain active context of ongoing work
  - Store system patterns and architectural decisions
  - Log important decisions with rationale
  - Switch between different work modes (architect, code, debug, test)
- **Key Commands**:
  - Read/write memory bank files
  - Track progress updates
  - Log decisions
  - Update active context

#### 2. Sequential Thinking MCP (`sequential-thinking`)
- **Purpose**: Step-by-step problem solving and analysis
- **Features**:
  - Break down complex problems into manageable steps
  - Revise and branch thinking patterns
  - Generate and verify hypotheses
  - Maintain context across multiple thinking steps
- **Usage**: Great for debugging complex issues or planning implementations

#### 3. Browser-Tools MCP
- **Purpose**: Browser monitoring and interaction with audit capabilities
- **Location**: Configured in `.claude/mcp.json`
- **Port**: 3040 (managed by port registry)
- **No API key required** - works locally without authentication
- **Features**:
  - Accessibility, Performance, SEO, and Best Practices audits
  - Screenshot capture and DOM analysis
  - Console log and network activity monitoring
  - NextJS-specific auditing capabilities
  - 60-second active headless browser sessions

### 📋 IMPORTANT: UI Development Workflow

**ALWAYS use browser-tools MCP (NOT Puppeteer) when:**
- Making UI changes or updates
- Testing responsive design
- Verifying visual consistency
- Checking accessibility compliance
- Testing user interactions
- Debugging CSS/styling issues
- Validating ShadCN component integration

**How to use browser-tools MCP:**
1. The browser-tools MCP server should already be configured in `.claude/mcp.json`
2. Use the mcp__browser-tools__* functions directly (e.g., mcp__browser-tools__navigate, mcp__browser-tools__screenshot)
3. Do NOT use Puppeteer - use browser-tools MCP instead for all browser automation
4. Browser-tools provides better integration with Claude Code and includes audit capabilities

### 🚀 Quick Start: Browser-Tools Testing

**Ready-to-use testing scripts are available in `/scripts/`:**

1. **Start Browser-Tools Server:**
   ```bash
   ./scripts/start-browser-tools.sh
   ```
   This script automatically uses port 3040 from the registry (or assigns a new port if needed).

2. **Check Assigned Port:**
   ```bash
   ./scripts/get-browser-tools-port.sh
   ```
   Returns this project's assigned port (currently 3040).

3. **View Test Plan:**
   ```bash
   node ./scripts/test-ui-with-browser-tools.js
   ```
   Shows comprehensive UI test checklist for browser testing.

4. **Full Documentation:**
   - `scripts/README.md` - Testing instructions
   - `PORT-REGISTRY.md` - Port management system details
   - `README.md` - Complete project overview

### 📁 IMPORTANT: Test File & Screenshot Directories

**ALWAYS use these directories for test files and screenshots:**
- **Test Files**: `./.tests/`
- **Screenshots**: `./.screenshots/`

When capturing screenshots or creating test files, save them to these standard locations for consistency and organization.

**Manual Testing Process:**
1. Run `./scripts/start-browser-tools.sh` to start browser-tools server on port 3040
2. Open Chrome with BrowserToolsMCP extension installed
3. Navigate to your test URL
4. Open DevTools (F12) and find BrowserToolsMCP panel
5. Server auto-connects on port 3040
6. Use the panel to capture screenshots, run audits, monitor console

**Note**: React Developer Tools are installed in Chrome - while not directly accessible through MCP, the browser tools can capture console output and DOM state that reflects React component behavior.