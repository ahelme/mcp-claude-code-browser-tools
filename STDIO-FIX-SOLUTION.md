# Browser Tools MCP - STDIO Protocol Fix

## Problem Identified

The browser-tools-mcp package (v1.2.0-1.2.1) violates MCP stdio protocol requirements by writing debug output to stdout. According to MCP best practices (2025), **stdout must ONLY contain JSON-RPC messages**.

### Issues Found:
- 12 `console.log` statements writing to stdout
- 18 `console.error` statements writing to stdout  
- Server discovery process outputs debug info during startup
- Audit operations log status messages to stdout

This corrupts the stdio communication channel between Claude Code and the MCP server, preventing browser-tools functions from being available.

## Root Cause

The package uses an outdated approach incompatible with MCP stdio protocol:
- Uses `console.log()` for debug output (writes to stdout)
- Uses `console.error()` for error messages (also stdout in some contexts)
- No distinction between protocol messages and debug output

## Solution Applied

Created comprehensive fix script that:
1. Finds all browser-tools-mcp installations in npm cache
2. Replaces `console.log()` with `process.stderr.write()`
3. Replaces `console.error()` with `process.stderr.write("[ERROR] " + ...)`
4. Preserves template literals and complex expressions
5. Creates backups before modification

### Fix Script Location
`scripts/fix-browser-tools-comprehensive.js`

### Fixed Files
- `/Users/lennox/.npm/_npx/662acb47f9505fc3/node_modules/@agentdeskai/browser-tools-mcp/dist/mcp-server.js`
- Plus 2 other cached versions

## MCP Best Practices (2025)

Per latest MCP documentation:
- **NEVER write to stdout** in stdio-based servers
- Use `process.stderr.write()` for all debug output
- Only JSON-RPC protocol messages should go to stdout
- Implement proper error handling without console output

## Verification Steps

1. Run fix script: `node scripts/fix-browser-tools-comprehensive.js`
2. Restart Claude Code
3. Check for `mcp__browser-tools__*` functions availability
4. Test with actual browser operations

## Long-term Solution

The browser-tools-mcp package needs updating to:
- Use proper logging library that writes to stderr
- Remove all console.* statements
- Follow MCP stdio protocol specifications
- Consider using MCP SDK's built-in logging

## Status

✅ Fix applied to all cached installations
⏳ Awaiting Claude Code restart for testing
📝 Issue should be reported upstream to @agentdeskai/browser-tools-mcp