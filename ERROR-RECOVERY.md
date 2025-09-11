# 🚨 Error Recovery Guide

## Quick Fixes for Common Issues

### ⚡ Emergency Disable (If Claude Won't Start)

```bash
# Quick disable browser-tools
./scripts/disable-browser-tools.sh
```

This immediately:
- Disables browser-tools MCP
- Stops all browser-tools processes
- Backs up your configuration
- Lets Claude Code start normally

### 🔄 Re-enable After Fixing

```bash
# Re-enable browser-tools
./scripts/enable-browser-tools.sh
```

## Common Startup Errors

### Error: "MCP server failed to start"

**Symptoms**: Claude Code shows error about MCP server

**Quick Fix**:
```bash
# Disable browser-tools temporarily
./scripts/disable-browser-tools.sh

# Start Claude Code normally
claude

# Debug the issue, then re-enable
./scripts/enable-browser-tools.sh
```

### Error: "Port 3026 already in use"

**Symptoms**: Server can't start, port conflict

**Quick Fix**:
```bash
# Kill all browser-tools processes
pkill -f browser-tools

# Check what's using the port
lsof -i :3026

# If something else is using it, kill that process
kill -9 <PID>
```

### Error: "Permission denied"

**Symptoms**: Scripts won't run, permission errors

**Quick Fix**:
```bash
# Fix script permissions
chmod +x scripts/*.sh

# Try again
./scripts/start-browser-tools.sh
```

### Error: "Command not found: npx"

**Symptoms**: Browser-tools can't start, npx missing

**Quick Fix**:
```bash
# Install Node.js and npm
# On macOS:
brew install node

# On Linux:
sudo apt install nodejs npm

# Verify installation
npx --version
```

## Recovery Commands

### 1. Complete Reset

```bash
# Remove all browser-tools configuration
rm -rf .claude/mcp.json
rm -rf .claude/mcp.json.backup.*

# Reinstall from scratch
curl -sSL https://raw.githubusercontent.com/ahelme/browser-tools-setup/main/install.sh | bash
```

### 2. Manual Cleanup

```bash
# Stop all browser-tools processes
pkill -f browser-tools

# Clear port 3026
lsof -ti:3026 | xargs kill -9 2>/dev/null

# Remove temporary files
rm -rf ~/.npm/_npx/*/node_modules/@agentdeskai/browser-tools-*
```

### 3. Check Status

```bash
# See if browser-tools is running
ps aux | grep browser-tools

# Check if port is in use
lsof -i :3026

# View current configuration
cat .claude/mcp.json
```

## Diagnostic Information

When reporting issues, run this diagnostic:

```bash
# Create diagnostic report
echo "=== Browser Tools Diagnostic ===" > diagnostic.txt
echo "Date: $(date)" >> diagnostic.txt
echo "Directory: $(pwd)" >> diagnostic.txt
echo "" >> diagnostic.txt
echo "=== MCP Config ===" >> diagnostic.txt
cat .claude/mcp.json >> diagnostic.txt 2>&1
echo "" >> diagnostic.txt
echo "=== Running Processes ===" >> diagnostic.txt
ps aux | grep browser-tools >> diagnostic.txt 2>&1
echo "" >> diagnostic.txt
echo "=== Port Status ===" >> diagnostic.txt
lsof -i :3026 >> diagnostic.txt 2>&1
echo "" >> diagnostic.txt
echo "=== Node Version ===" >> diagnostic.txt
node --version >> diagnostic.txt 2>&1
npx --version >> diagnostic.txt 2>&1
echo "" >> diagnostic.txt
echo "=== Error Logs ===" >> diagnostic.txt
tail -n 50 ~/.npm/_logs/*.log >> diagnostic.txt 2>&1

echo "Diagnostic saved to: diagnostic.txt"
```

## Prevention Tips

### Before Starting Claude Code

1. **Check port availability**:
   ```bash
   lsof -i :3026
   ```

2. **Ensure clean state**:
   ```bash
   pkill -f browser-tools
   ```

### If Issues Persist

1. **Use manual mode** (Option 2 from SETUP-OPTIONS.md):
   - Disable auto-start
   - Run server manually
   - More control over the process

2. **Change port**:
   ```bash
   # Edit the wrapper script
   nano scripts/browser-tools-mcp-wrapper.sh
   # Change PORT=3026 to another port like 3027
   ```

## Error Messages Explained

| Error | Meaning | Solution |
|-------|---------|----------|
| "EADDRINUSE" | Port already in use | Kill process using port |
| "EACCES" | Permission denied | Fix file permissions |
| "ENOENT" | File not found | Reinstall browser-tools |
| "SIGTERM" | Process terminated | Normal shutdown, not an error |
| "npm ERR!" | NPM package issue | Clear npm cache |

## Get Help

If none of these solutions work:

1. **Create diagnostic report** (see above)
2. **Check existing issues**: https://github.com/ahelme/browser-tools-setup/issues
3. **Report new issue** with diagnostic.txt contents

## Quick Reference Card

```bash
# EMERGENCY COMMANDS (memorize these!)

# Disable browser-tools (if Claude won't start)
./scripts/disable-browser-tools.sh

# Re-enable browser-tools
./scripts/enable-browser-tools.sh

# Kill all browser-tools
pkill -f browser-tools

# Free up port 3026
lsof -ti:3026 | xargs kill -9

# Complete reinstall
curl -sSL https://raw.githubusercontent.com/ahelme/browser-tools-setup/main/install.sh | bash
```

Save this somewhere safe! 🚑