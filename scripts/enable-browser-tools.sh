#!/bin/bash

# Browser Tools MCP - Re-enable Script
# Use this to re-enable browser-tools after disabling

echo "✅ Browser Tools MCP - Re-enable"
echo "================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Look for most recent backup
LATEST_BACKUP=$(ls -t .claude/mcp.json.backup.* 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${YELLOW}No backup found. Using auto-start configuration...${NC}"
    if [ -f ".claude/mcp-auto-start.json" ]; then
        cp .claude/mcp-auto-start.json .claude/mcp.json
        echo -e "${GREEN}✓ Restored auto-start configuration${NC}"
    else
        echo -e "${RED}Error: No backup or auto-start config found${NC}"
        echo "Please reinstall using:"
        echo "  curl -sSL https://raw.githubusercontent.com/ahelme/browser-tools-setup/main/install.sh | bash"
        exit 1
    fi
else
    echo -e "${YELLOW}Found backup: $LATEST_BACKUP${NC}"
    cp "$LATEST_BACKUP" .claude/mcp.json
    echo -e "${GREEN}✓ Restored from backup${NC}"
fi

echo ""
echo -e "${GREEN}Browser-tools MCP has been re-enabled!${NC}"
echo ""
echo "Next steps:"
echo "1. Restart Claude Code in this project"
echo "2. Browser-tools will start automatically"
echo ""
echo "If you have issues, you can disable again with:"
echo "  ./scripts/disable-browser-tools.sh"