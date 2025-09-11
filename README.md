# Browser Tools MCP Setup (Project-Level)

PROJECT-SPECIFIC configuration for Browser Tools MCP server (not global). Configuration in `.claude/` directory.

## Configuration

- **Browser Tools MCP**: v1.2.1
- **Playwright MCP**: Latest
- **Port**: Auto-assigned (`./scripts/get-browser-tools-port.sh`)
- **Registry**: `~/.claude/browser-tools-ports/registry.json`

## Features

- Accessibility, Performance, SEO, Best Practices audits
- Screenshot capture, DOM analysis
- Console log, network monitoring
- NextJS-specific auditing
- 60-second headless sessions
- Graceful shutdown on Claude exit
- No orphaned processes

## Browser-Tools Architecture

**THREE components, ONE port:**

1. **MCP Server** (browser-tools-mcp) - Auto-started by Claude via `.claude/mcp.json`, communicates via stdio (no port)

2. **Aggregator Server** - Started with `./scripts/start-browser-tools.sh` on port 3040, bridges Chrome extension and MCP

3. **Chrome Extension** (BrowserToolsMCP) - Installed in Chrome, connects to Aggregator on port 3040

**Data flow:**
```
Claude Code <--(stdio)--> MCP Server <--(internal)--> Aggregator Server <--(port 3040)--> Chrome Extension
```

**Key points:**
- Only ONE port used (3040 for this project)
- TWO processes run: MCP server (auto) + Aggregator (manual)
- Port registry only manages the Aggregator port

## Available MCP Tools

**Browser-tools functions** (mcp__browser-tools__*):
- `navigate` - Go to URL
- `screenshot` - Capture page
- `click` - Click elements
- `type` - Enter text
- `evaluate` - Run JavaScript
- `getContent` - Get page HTML
- `audit` - Run Lighthouse audits

**Playwright functions** (mcp__playwright__*):
- Full Playwright API access
- Advanced automation
- Multi-browser support

## Port Registry

- **Location**: `~/.claude/browser-tools-ports/registry.json`
- **Auto-assigns** unique ports per project
- **Prevents** conflicts between projects
- **Check port**: `./scripts/get-browser-tools-port.sh`

## Setup

1. **Start server** (auto-uses assigned port):
   ```bash
   ./scripts/start-browser-tools.sh
   ```

2. **Check port**:
   ```bash
   ./scripts/get-browser-tools-port.sh
   ```

3. **Run tests**:
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

- Port registry manages assignments automatically
- Chrome extension required for manual testing  
- Use browser-tools MCP, not Puppeteer
- Check port: `./scripts/get-browser-tools-port.sh`

## Workflow

1. Use browser-tools MCP (not Puppeteer)
2. Screenshots: `./.screenshots/`
3. Test files: `./.tests/`
4. Session persistence: Memory Bank

## Troubleshooting

If connection fails:
1. Check port: `./scripts/get-browser-tools-port.sh`
2. Verify available: `lsof -i :YOUR_PORT`
3. Restart Chrome
4. One DevTools panel only
5. Extension enabled

## Documentation

- [QUICK-START.md](QUICK-START.md) - 30-second installation guide
- [PORT-REGISTRY.md](PORT-REGISTRY.md) - Port management system documentation
- [ERROR-RECOVERY.md](ERROR-RECOVERY.md) - **Emergency fixes if Claude won't start**
- [SETUP-OPTIONS.md](SETUP-OPTIONS.md) - Different configuration approaches
- [SHUTDOWN-HANDLING.md](SHUTDOWN-HANDLING.md) - How graceful shutdown works
- [BROWSER-TOOLS-MCP-README.md](BROWSER-TOOLS-MCP-README.md) - Claude operating instructions
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions

## 🚨 Quick Recovery

If Claude won't start:
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