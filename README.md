# Browser Tools MCP Setup (Project-Level)

A PROJECT-SPECIFIC configuration for Browser Tools MCP (Model Context Protocol) server for browser automation and testing.

**Important**: This sets up browser-tools MCP for THIS PROJECT ONLY, not globally. The configuration lives in this project's `.claude/` directory.

## Overview

This repository contains configuration and scripts for setting up Browser Tools MCP, which provides AI-powered browser automation capabilities through Anthropic's Model Context Protocol.

## Current Configuration

- **Browser Tools MCP**: v1.2.1 (latest version)
- **Playwright MCP**: Latest version
- **Port**: 3026 (configured to avoid conflict with port 3025 used by ~/development/madi-test)

## Features

Browser Tools MCP provides:
- Accessibility, Performance, SEO, and Best Practices audits
- Screenshot capture and DOM analysis
- Console log and network activity monitoring
- NextJS-specific auditing capabilities
- 60-second active headless browser sessions
- **Automatic graceful shutdown when Claude Code exits**
- **No orphaned processes or port conflicts**

## Setup Instructions

1. **Install Dependencies**
   The MCP servers are configured to use npx, so no manual installation is needed.

2. **Start Browser Tools Server**
   ```bash
   ./scripts/start-browser-tools.sh
   ```

3. **Testing**
   ```bash
   node ./scripts/test-ui-with-browser-tools.js
   ```

## Project Structure

```
browser-tools-setup/
├── .claude/
│   ├── mcp.json          # MCP server configuration
│   ├── commands/         # Custom Claude commands
│   └── settings.local.json
├── scripts/
│   ├── README.md         # Testing documentation
│   ├── start-browser-tools.sh
│   └── test-ui-with-browser-tools.js
├── .screenshots/         # Screenshot output directory
├── .tests/              # Test files directory
└── memory-bank/         # Memory Bank for session persistence
```

## Important Notes

- Browser Tools MCP may conflict if running in multiple directories
- The server runs on port 3025 by default
- Chrome extension required for manual testing
- Use browser-tools MCP instead of Puppeteer for all browser automation

## Development Workflow

1. Always use browser-tools MCP (NOT Puppeteer) for UI development
2. Save screenshots to `./.screenshots/`
3. Save test files to `./.tests/`
4. Use Memory Bank for session persistence

## Troubleshooting

If browser-tools doesn't connect:
1. Check if another instance is running on port 3025
2. Close all Chrome windows and restart
3. Ensure only one DevTools panel is open
4. Verify the Chrome extension is enabled

## Documentation

- [QUICK-START.md](QUICK-START.md) - 30-second installation guide
- [ERROR-RECOVERY.md](ERROR-RECOVERY.md) - **Emergency fixes if Claude won't start**
- [SETUP-OPTIONS.md](SETUP-OPTIONS.md) - Different configuration approaches
- [SHUTDOWN-HANDLING.md](SHUTDOWN-HANDLING.md) - How graceful shutdown works
- [BROWSER-TOOLS-MCP-README.md](BROWSER-TOOLS-MCP-README.md) - Claude operating instructions
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions

## 🚨 Quick Recovery

If browser-tools causes Claude startup issues:
```bash
# Disable immediately
./scripts/disable-browser-tools.sh

# Re-enable when ready
./scripts/enable-browser-tools.sh
```

## Resources

- [Browser Tools MCP GitHub](https://github.com/AgentDeskAI/browser-tools-mcp)
- [Browser Tools Documentation](https://browsertools.agentdesk.ai/)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)