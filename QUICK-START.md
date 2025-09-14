# 🚀 Browser Tools MCP - Quick Start

## One-Command Installation (Project-Level)

```bash
curl -sSL https://raw.githubusercontent.com/ahelme/browser-tools-setup/main/install.sh | bash
```

**Important**: This creates a PROJECT-SPECIFIC browser-tools setup in `~/development/browser-tools-setup`, NOT a global Claude configuration.

The installer will:
- ✅ Clone this repository to `~/development/browser-tools-setup`
- ✅ Configure browser-tools MCP in the PROJECT's `.claude/mcp.json`
- ✅ Set up all scripts and permissions locally
- ✅ Create necessary directories in the project

## After Installation

1. **Restart Claude Code**
2. **Test it**: Ask Claude "Can you check if browser-tools MCP is available?"
3. **Use it**: Browser-tools starts automatically when Claude needs it!

## What You Get

- 🤖 **Automatic browser automation** in Claude
- 📸 **Screenshots** saved to `.screenshots/`
- 🧪 **Test files** in `.tests/`
- ⚡ **No manual server starting** needed
- 🛑 **Graceful shutdown** when Claude exits
- 🧹 **Automatic cleanup** - no orphaned processes
- 🔧 **Port 3025** for MCP method (Claude Code)
- 🔧 **Port 3026** for Direct method (API access)

## Example Commands for Claude

```
"Navigate to example.com and take a screenshot"
"Run an accessibility audit on this website"
"Check the console for errors"
"Test this form by filling it out"
```

## Manual Installation (Alternative)

```bash
git clone https://github.com/ahelme/browser-tools-setup.git
cd browser-tools-setup
chmod +x scripts/*.sh
cp .claude/mcp-auto-start.json .claude/mcp.json
# Update paths in .claude/mcp.json
# Restart Claude Code
```

## Files Included

- `install.sh` - One-command installer
- `scripts/browser-tools-mcp-wrapper.sh` - Auto-start wrapper
- `.claude/mcp-auto-start.json` - MCP configuration
- Example test page and comprehensive documentation

## Troubleshooting

### 🚨 Quick Recovery Commands

```bash
# If Claude won't start - DISABLE browser-tools
./scripts/disable-browser-tools.sh

# Re-enable after fixing
./scripts/enable-browser-tools.sh
```

### Common Issues

If browser-tools isn't available after installation:
1. Make sure Claude Code was restarted
2. Check port 3025 isn't already in use
3. Run `./scripts/start-mcp-browser-tools.sh` to test manually

See [ERROR-RECOVERY.md](ERROR-RECOVERY.md) for complete troubleshooting guide.

## Learn More

- [Full README](README.md) - Complete documentation
- [Setup Options](SETUP-OPTIONS.md) - Different configuration approaches
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions

---
**Ready in 30 seconds!** 🎉