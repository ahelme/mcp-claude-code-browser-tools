# Dual Architecture: Browser Tools Components

This document clarifies the architecture with TWO separate middleware servers for different access methods.

## Component Names & File Prefixes

### MCP Method Files (Prefix: `mcp-`)
- `mcp-browser-tools-server.js` - MCP Server (stdio ↔ HTTP)
- `mcp-http-bridge.js` - HTTP Bridge for MCP (port 3024)

### Direct Method Files (Prefix: `direct-`)
- `direct-http-bridge.js` - HTTP Bridge for direct access (port 3026)

### Shared Components
- Chrome Extension (connects to either bridge)

## Architecture Diagrams

### Method 1: MCP Server Architecture (Claude Code)

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│   Claude Code   │────▶│ MCP Browser Tools   │────▶│  MCP HTTP Bridge    │────▶│ Chrome Extension│
│                 │◀────│ Server (stdio)      │◀────│   (Port: 3024)     │◀────│   (WebSocket)   │
│  JSON-RPC stdio │     │mcp-browser-tools-   │     │mcp-http-bridge.js  │     │    DOM/Screenshots│
│                 │     │    server.js        │     │ HTTP ←→ WebSocket   │     │                 │
└─────────────────┘     └─────────────────────┘     └─────────────────────┘     └─────────────────┘
      (Client)              (MCP Protocol)             (MCP HTTP Bridge)           (Browser Control)
```

**Flow**: Claude Code → MCP Server → MCP HTTP Bridge (3024) → Chrome Extension

### Method 2: Direct HTTP Architecture (Other Clients)

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│  External Tool  │────▶│ Direct HTTP Bridge  │────▶│ Chrome Extension│
│  (Node.js/curl) │◀────│   (Port: 3026)     │◀────│   (WebSocket)   │
│   HTTP Requests │     │direct-http-bridge.js│     │  DOM/Screenshots│
│                 │     │ HTTP ←→ WebSocket   │     │                 │
└─────────────────┘     └─────────────────────┘     └─────────────────┘
     (Client)            (Direct HTTP Bridge)         (Browser Control)
```

**Flow**: External Tool → Direct HTTP Bridge (3026) → Chrome Extension

## Port Allocation

| Component | Port | Method | File |
|-----------|------|--------|------|
| MCP HTTP Bridge | 3024 | MCP Server | `mcp-http-bridge.js` |
| Direct HTTP Bridge | 3026 | Direct Access | `direct-http-bridge.js` |
| MCP Browser Tools Server | stdio | MCP Server | `mcp-browser-tools-server.js` |

## Chrome Extension Configuration

The Chrome Extension can connect to EITHER bridge:
- **For MCP usage**: Set port 3024 in extension
- **For Direct usage**: Set port 3026 in extension

Extension will show:
- "Connected to MCP HTTP Bridge v1.2.0" (port 3024)
- "Connected to Direct HTTP Bridge v1.2.0" (port 3026)

## File Structure

```
scripts/
├── mcp-browser-tools-server.js    # MCP Server (stdio ↔ HTTP to port 3024)
├── mcp-http-bridge.js             # HTTP Bridge for MCP (port 3024)
├── direct-http-bridge.js          # HTTP Bridge for direct access (port 3026)
└── start-mcp-browser-tools.sh     # Start MCP method components
└── start-direct-browser-tools.sh  # Start direct method components
```

## Configuration Files

### MCP Configuration (.claude/mcp.json)
```json
{
  "browser-tools": {
    "type": "stdio",
    "command": "node",
    "args": ["scripts/mcp-browser-tools-server.js"],
    "env": {
      "MCP_HTTP_BRIDGE_PORT": "3024"
    }
  }
}
```

## Startup Scripts

### For MCP Method
```bash
./mcp-server/start.sh
# Starts: mcp-http-bridge.js on port 3024
# Claude Code auto-starts: mcp-browser-tools-server.js
```

### For Direct Method
```bash
./mcp-server/scripts/start-direct-browser-tools.sh
# Starts: direct-http-bridge.js on port 3026
```

## Testing

### Test MCP Method
```bash
# Test MCP HTTP Bridge
curl http://localhost:3024/health

# Test MCP Server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node scripts/mcp-browser-tools-server.js
```

### Test Direct Method
```bash
# Test Direct HTTP Bridge
curl http://localhost:3026/health

# Test direct navigation
curl -X POST http://localhost:3026/navigate -d '{"url":"https://example.com"}' -H "Content-Type: application/json"
```

This architecture eliminates port conflicts and makes it crystal clear which components work together!