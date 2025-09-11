# Browser Tools for Claude Code - Port Registry System

## Overview

Automatically manages port assignments for browser-tools MCP across projects, preventing conflicts.

## Quick Start

**Start browser-tools:**
```bash
./scripts/start-browser-tools.sh
```
The script automatically uses this project's assigned port from the registry.

**Check this project's port:**
```bash
./scripts/get-browser-tools-port.sh
```

## How It Works

- **Registry**: `~/.claude/browser-tools-ports/registry.json`
- **Assignment**: Each project directory gets a unique port
- **Persistence**: Assignments survive restarts
- **Conflict-free**: No manual configuration needed

## Registry Structure
```json
{
  "ports": {
    "PORT": "/path/to/project"
  },
  "nextAvailablePort": NUMBER,
  "lastUpdated": "TIMESTAMP"
}
```

## Troubleshooting

**Port in use?**
```bash
lsof -i :PORT_NUMBER
```

**Need a new port?**
1. Edit `~/.claude/browser-tools-ports/registry.json`
2. Remove your project's entry
3. Run start script for automatic reassignment

**Registry corrupted?**
```bash
rm ~/.claude/browser-tools-ports/registry.json
# Will be recreated automatically
```

## Benefits

- Zero configuration
- Multi-project support
- Automatic port allocation
- No conflicts between projects