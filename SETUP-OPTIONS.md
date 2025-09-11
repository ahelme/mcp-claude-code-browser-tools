# Browser Tools MCP - Setup Options

## 🎯 The Goal
Get browser-tools MCP working automatically when Claude Code starts, without manual intervention.

## 🏗️ Architecture Overview

Browser-tools requires TWO components:
1. **browser-tools-server** - The browser automation server (HTTP server on port 3026)
2. **browser-tools-mcp** - The MCP protocol interface that Claude uses

## 📋 Setup Options

### Option 1: Automatic Start with Wrapper Script (RECOMMENDED)

**How it works**: A wrapper script starts both components when Claude launches.

**Setup Steps**:
1. Use the wrapper script at `scripts/browser-tools-mcp-wrapper.sh`
2. Replace `.claude/mcp.json` with the auto-start version:
   ```bash
   cp .claude/mcp-auto-start.json .claude/mcp.json
   ```
3. Restart Claude Code
4. Both servers start automatically!

**Pros**:
- ✅ Fully automatic - no manual steps
- ✅ Both components start in correct order
- ✅ Handles cleanup on exit
- ✅ Claude can use browser-tools immediately

**Cons**:
- ⚠️ Uses absolute path (needs updating if project moves)
- ⚠️ Slightly more complex setup

### Option 2: Manual Server Start

**How it works**: Start browser-tools-server manually, Claude connects to it.

**Setup Steps**:
1. Keep current `.claude/mcp.json` as is
2. Before starting Claude Code, run:
   ```bash
   ./scripts/start-browser-tools.sh
   ```
3. Start Claude Code
4. Browser-tools MCP connects to running server

**Pros**:
- ✅ Simple configuration
- ✅ Server persists across Claude restarts
- ✅ Can monitor server output directly

**Cons**:
- ⚠️ Requires manual step each time
- ⚠️ Easy to forget to start server

### Option 3: Claude Starts Server On-Demand

**How it works**: Claude starts the server when needed using Bash.

**Setup Steps**:
1. Keep current `.claude/mcp.json`
2. Start Claude Code normally
3. When browser automation is needed, Claude runs:
   ```bash
   PORT=3026 npx @agentdeskai/browser-tools-server@latest
   ```
   
**Pros**:
- ✅ No configuration changes needed
- ✅ Server only runs when needed

**Cons**:
- ❌ MCP functions won't work (MCP needs server at Claude startup)
- ❌ Can't use `mcp__browser-tools__` functions
- ❌ Limited to what Bash can do

## 🚀 Quick Setup (Recommended)

To enable automatic startup:

```bash
# 1. Make sure wrapper is executable
chmod +x scripts/browser-tools-mcp-wrapper.sh

# 2. Backup current config
cp .claude/mcp.json .claude/mcp.json.backup

# 3. Use auto-start config
cp .claude/mcp-auto-start.json .claude/mcp.json

# 4. Restart Claude Code
# The servers will start automatically!
```

## 🔧 Configuration Details

### Wrapper Script (`scripts/browser-tools-mcp-wrapper.sh`)
- Starts browser-tools-server on port 3026
- Waits for server initialization
- Starts browser-tools-mcp
- Handles cleanup on exit

### Auto-Start Config (`.claude/mcp-auto-start.json`)
```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "/path/to/wrapper.sh",
      "env": {
        "PORT": "3026"
      }
    }
  }
}
```

### Port Configuration
- Default: 3025 (often conflicts)
- This project: 3026 (avoids conflicts)
- Can be changed via PORT environment variable

## 🎭 Testing Your Setup

After setup, test with Claude:
1. Ask Claude to run `ListMcpResourcesTool`
2. Look for "browser-tools" in the server list
3. If present, the setup worked!

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Browser-tools not in MCP list | Restart Claude Code |
| Port already in use | Change PORT in scripts/configs |
| Permission denied | Run `chmod +x scripts/*.sh` |
| Path not found | Update absolute path in mcp.json |

## 💡 Which Option Should You Choose?

- **For "just works" experience**: Option 1 (Auto-start wrapper)
- **For development/debugging**: Option 2 (Manual start)
- **For quick testing**: Option 3 (Claude starts on-demand)

Most users should use **Option 1** for the best experience!