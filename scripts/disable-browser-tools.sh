#!/bin/bash

# Browser Tools MCP - Quick Disable Script
# Use this if browser-tools is causing Claude Code startup issues

echo "🛑 Browser Tools MCP - Quick Disable"
echo "====================================="
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

# Check if mcp.json exists
if [ ! -f ".claude/mcp.json" ]; then
    echo -e "${RED}Error: .claude/mcp.json not found${NC}"
    echo "Already disabled or not installed properly."
    exit 1
fi

# Create backup
BACKUP_FILE=".claude/mcp.json.backup.$(date +%Y%m%d_%H%M%S)"
cp .claude/mcp.json "$BACKUP_FILE"
echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"

# Create disabled config (empty MCP servers)
cat > .claude/mcp.json.disabled << 'EOF'
{
  "mcpServers": {
    "// browser-tools-disabled": {
      "comment": "Browser-tools temporarily disabled. To re-enable, run: ./scripts/enable-browser-tools.sh"
    }
  }
}
EOF

# Replace current config with disabled version
mv .claude/mcp.json.disabled .claude/mcp.json
echo -e "${GREEN}✓ Browser-tools MCP disabled${NC}"

# Kill any running browser-tools processes
pkill -f "browser-tools" 2>/dev/null
echo -e "${GREEN}✓ Stopped any running browser-tools processes${NC}"

echo ""
echo -e "${YELLOW}Browser-tools has been disabled!${NC}"
echo ""
echo "To re-enable, run:"
echo "  ./scripts/enable-browser-tools.sh"
echo ""
echo "Your previous configuration was backed up to:"
echo "  $BACKUP_FILE"
echo ""
echo -e "${GREEN}You can now start Claude Code normally.${NC}"