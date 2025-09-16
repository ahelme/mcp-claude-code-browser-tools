# Browser Tools MCP Server - 2025-03-26 Specification Compliant

## Overview

A fully compliant MCP server implementation following the **2025-03-26 specification** that provides browser automation capabilities through the Model Context Protocol.

## Key Features

### ✅ Full 2025-03-26 Specification Compliance

- **Protocol Version**: `2025-03-26`
- **JSON-RPC 2.0**: Strict adherence to JSON-RPC message format
- **Stdio Transport**: Clean implementation with zero stdout pollution
- **Capability Negotiation**: Proper initialization handshake
- **Error Handling**: Two-level error mechanism with `isError` flag

### 📋 Complete Tool Implementation

Nine browser control tools with full schema validation:

1. **browser_navigate** - Navigate to URLs
2. **browser_screenshot** - Capture screenshots (full page or element)
3. **browser_click** - Click elements via CSS selectors
4. **browser_type** - Type text with optional field clearing
5. **browser_evaluate** - Execute JavaScript (with security warning)
6. **browser_get_content** - Get HTML/text content
7. **browser_audit** - Run Lighthouse audits
8. **browser_wait** - Wait for elements with timeout
9. **browser_get_console** - Retrieve console logs by level

### 🔒 Security & Best Practices

- **Input Validation**: All tools use JSON Schema validation
- **Security Annotations**: Warnings for dangerous operations
- **Error Isolation**: Tool errors don't crash the server
- **Debug Logging**: Optional stderr logging (MCP_DEBUG=1)
- **Graceful Shutdown**: Proper SIGTERM/SIGINT handling

## Technical Implementation

### Architecture

```
Claude Code <--[JSON-RPC/stdio]--> MCP Server <--[HTTP]--> Browser Tools Server <--[WebSocket]--> Chrome Extension
```

### Message Flow

1. **Initialization**
   - Client sends `initialize` with protocol version
   - Server responds with capabilities and tools support
   - Client confirms with `initialized`

2. **Tool Discovery**
   - Client calls `tools/list`
   - Server returns full tool schemas with titles and descriptions

3. **Tool Execution**
   - Client calls `tools/call` with tool name and arguments
   - Server validates input against schema
   - Server forwards to browser-tools HTTP server
   - Results returned in MCP content format

### Protocol Details

**Request Example**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "browser_navigate",
    "arguments": {
      "url": "https://example.com"
    }
  }
}
```

**Response Example**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "Navigation successful"
    }]
  }
}
```

**Error Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "Tool execution failed: Connection timeout"
    }],
    "isError": true
  }
}
```

## Configuration

### MCP Configuration (.claude/mcp.json)

```json
{
  "mcpServers": {
    "browser-tools": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/path/to/mcp-browser-tools-server.js"
      ],
      "env": {
        "BROWSER_TOOLS_PORT": "3024",
        "MCP_DEBUG": "1"
      }
    }
  }
}
```

### Environment Variables

- `BROWSER_TOOLS_PORT`: HTTP server port (default: 3024)
- `MCP_DEBUG`: Enable debug logging to stderr (1 to enable)

## Advantages Over Original Package

| Aspect | Original npm Package | Our 2025-Spec Server |
|--------|---------------------|---------------------|
| **Protocol Compliance** | Violates stdio with console.log | 100% compliant, zero stdout pollution |
| **Specification** | Outdated implementation | 2025-03-26 specification |
| **Error Handling** | Console errors break protocol | Proper isError flag in responses |
| **Tool Schemas** | Basic definitions | Full schemas with validation |
| **Security** | No warnings | Annotations for dangerous operations |
| **Debugging** | Pollutes stdout | Clean stderr logging with MCP_DEBUG |
| **Maintainability** | External dependency | Full control, easy to update |

## Testing

### Manual Testing

```bash
# Test initialization
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26"}}' | \
  node mcp-browser-tools-server.js

# Test tool listing
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | \
  node mcp-browser-tools-server.js

# Enable debug mode
MCP_DEBUG=1 node mcp-browser-tools-server.js
```

### Integration Testing

1. Start browser-tools HTTP server: `./scripts/start-browser-tools.sh`
2. Open Chrome with extension installed
3. Restart Claude Code
4. Test tools: `mcp__browser-tools__navigate`, etc.

## Specification References

- **MCP Specification**: https://modelcontextprotocol.io/specification/2025-03-26
- **Transport Details**: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports
- **Tool Schemas**: https://modelcontextprotocol.io/docs/concepts/tools
- **JSON-RPC 2.0**: https://www.jsonrpc.org/specification

## Implementation Notes

1. **Stdio Transport Rules**:
   - MUST NOT write to stdout except JSON-RPC messages
   - Messages delimited by newlines
   - UTF-8 encoding required

2. **Tool Response Format**:
   - Always return `content` array
   - Support multiple content types (text, image)
   - Use `isError: true` for tool execution failures

3. **Capability Negotiation**:
   - Check client protocol version
   - Respond with server capabilities
   - Enable feature discovery

## Future Enhancements

- [ ] Add resource support for browser state
- [ ] Implement prompt templates for common tasks
- [ ] Add batch operation support
- [ ] Implement rate limiting
- [ ] Add telemetry and metrics

## Summary

This implementation provides a robust, specification-compliant MCP server for browser automation that:
- Fixes all stdio protocol violations
- Follows the latest 2025-03-26 specification
- Provides comprehensive tool support
- Ensures security and reliability
- Maintains full compatibility with browser-tools ecosystem

The clean implementation eliminates dependency on the broken npm package while providing superior functionality and maintainability.