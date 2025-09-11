# Browser Tools MCP Troubleshooting Guide

## Current Issues & Solutions

### Issue 1: Port Conflict
**Problem**: Browser-tools MCP server running in another directory is using port 3025
**Status**: Identified
**Solution Options**:
1. Stop the other browser-tools instance
2. Configure this instance to use a different port
3. Use port auto-discovery feature (ports 3026-3035)

### Issue 2: MCP Server Connection
**Problem**: Need to verify MCP server can connect properly
**Status**: Pending testing
**Next Steps**:
1. Ensure browser-tools server is started with `./scripts/start-browser-tools.sh`
2. Check if Chrome extension is installed and enabled
3. Verify DevTools panel shows BrowserToolsMCP

### Issue 3: Scripts Reference PostFlow
**Problem**: Current scripts in `/scripts/` are from PostFlow project
**Status**: Needs updating
**Action Required**: 
- Update scripts to be generic browser-tools testing examples
- Remove PostFlow-specific references
- Add example test cases for common browser automation tasks

## Configuration Notes

### MCP Configuration
- Location: `.claude/mcp.json`
- Browser-tools version: Updated to 1.2.1
- Playwright MCP: Latest version via npx

### Port Configuration
- Default port: 3025
- Alternative ports: 3026-3035 (auto-discovery)
- Check port usage: `lsof -i :3025`

## Testing Checklist

- [ ] Browser-tools server starts successfully
- [ ] Chrome extension connects to server
- [ ] MCP functions are accessible in Claude Code
- [ ] Screenshots can be captured
- [ ] DOM analysis works
- [ ] Console logs are captured
- [ ] Network activity monitoring works
- [ ] Accessibility audits run properly
- [ ] Performance metrics are collected

## Known Limitations

1. Only one browser-tools instance can run per port
2. Chrome extension required for manual testing
3. 60-second timeout for browser sessions
4. MCP servers use npx (no local installation)

## Resources for Help

- [GitHub Issues](https://github.com/AgentDeskAI/browser-tools-mcp/issues)
- [Documentation](https://browsertools.agentdesk.ai/)
- [MCP Protocol Docs](https://modelcontextprotocol.io/)