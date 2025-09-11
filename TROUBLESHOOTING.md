# Browser Tools MCP Troubleshooting Guide

## Current Issues & Solutions

### Issue 1: Port Conflict
**Problem**: Browser-tools MCP server running in ~/development/madi-test is using port 3025
**Status**: Resolved ✅
**Solution**: Configured this instance to use port 3026 in all scripts and documentation

### Issue 2: MCP Server Connection
**Problem**: Need to verify MCP server can connect properly
**Status**: Pending testing
**Next Steps**:
1. Ensure browser-tools server is started with `./scripts/start-browser-tools.sh`
2. Check if Chrome extension is installed and enabled
3. Verify DevTools panel shows BrowserToolsMCP

### Issue 3: Scripts Reference PostFlow
**Problem**: Scripts in `/scripts/` contained PostFlow-specific references
**Status**: Resolved ✅
**Solution**: 
- Updated all scripts to be generic browser-tools testing examples
- Removed all PostFlow-specific references
- Added comprehensive example test cases for browser automation
- Created test-ui-with-browser-tools.js with 10 test categories

## Configuration Notes

### MCP Configuration
- Location: `.claude/mcp.json`
- Browser-tools version: Updated to 1.2.1
- Playwright MCP: Latest version via npx

### Port Configuration
- Configured port: 3026 (to avoid conflict with ~/development/madi-test on 3025)
- Alternative ports: 3027-3035 (if needed)
- Check port usage: `lsof -i :3026`
- Change port: Edit PORT variable in `scripts/start-browser-tools.sh`

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