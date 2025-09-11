#!/bin/bash

# Browser Tools MCP - One-Command Installer
# Usage: curl -sSL https://raw.githubusercontent.com/ahelme/browser-tools-setup/main/install.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/ahelme/browser-tools-setup.git"
INSTALL_DIR="$HOME/development/browser-tools-setup"
PORT=${BROWSER_TOOLS_PORT:-3026}

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Browser Tools MCP Installer${NC}"
echo -e "${BLUE}  (Project-Level Configuration)${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${YELLOW}This will install browser-tools MCP in:${NC}"
echo -e "${GREEN}$INSTALL_DIR${NC}"
echo -e "${YELLOW}This is a PROJECT-SPECIFIC setup, not global.${NC}"
echo ""

# Check for required tools
echo -e "${YELLOW}Checking requirements...${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All requirements met${NC}"

# Create development directory if it doesn't exist
mkdir -p "$(dirname "$INSTALL_DIR")"

# Clone or update repository
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Updating existing installation...${NC}"
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo -e "${GREEN}✓ Repository ready${NC}"

# Make scripts executable
echo -e "${YELLOW}Setting up scripts...${NC}"
chmod +x scripts/*.sh
echo -e "${GREEN}✓ Scripts configured${NC}"

# Create .claude directory if it doesn't exist
if [ ! -d ".claude" ]; then
    mkdir -p .claude
fi

# Check if user has an existing PROJECT .claude/mcp.json
if [ -f ".claude/mcp.json" ]; then
    echo -e "${YELLOW}Found existing PROJECT .claude/mcp.json${NC}"
    echo -e "${YELLOW}(This is in $INSTALL_DIR/.claude/)${NC}"
    echo -e "Do you want to:"
    echo "  1) Use automatic startup (recommended)"
    echo "  2) Keep current project configuration"
    echo -n "Choice (1 or 2): "
    read -r choice
    
    if [ "$choice" = "1" ]; then
        cp .claude/mcp.json .claude/mcp.json.backup.$(date +%Y%m%d_%H%M%S)
        cp .claude/mcp-auto-start.json .claude/mcp.json
        echo -e "${GREEN}✓ Configured for automatic startup${NC}"
    else
        echo -e "${YELLOW}Keeping existing configuration${NC}"
    fi
else
    # No existing config, use auto-start by default
    cp .claude/mcp-auto-start.json .claude/mcp.json
    echo -e "${GREEN}✓ Configured for automatic startup${NC}"
fi

# Update wrapper script with correct path
echo -e "${YELLOW}Updating paths...${NC}"
sed -i.bak "s|/Users/lennox/development/browser-tools-setup|$INSTALL_DIR|g" .claude/mcp.json
rm -f .claude/mcp.json.bak
echo -e "${GREEN}✓ Paths updated${NC}"

# Create directories for test files and screenshots
mkdir -p .screenshots .tests
echo -e "${GREEN}✓ Test directories created${NC}"

# Initialize Memory Bank
mkdir -p memory-bank
echo -e "${GREEN}✓ Memory Bank initialized${NC}"

# Display next steps
echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${BLUE}Location:${NC} $INSTALL_DIR"
echo -e "${BLUE}Port:${NC} $PORT"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Open Claude Code in this project directory:"
echo "   cd $INSTALL_DIR"
echo "   claude"
echo ""
echo "2. Test the setup by asking Claude:"
echo "   'Can you check if browser-tools MCP is available?'"
echo ""
echo "3. Browser-tools will start automatically when Claude launches in THIS project!"
echo ""
echo -e "${BLUE}Manual Testing (optional):${NC}"
echo "   cd $INSTALL_DIR"
echo "   ./scripts/start-browser-tools.sh"
echo ""
echo -e "${GREEN}Enjoy browser automation with Claude! 🚀${NC}"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "  - README.md - Overview and features"
echo "  - SETUP-OPTIONS.md - Different setup approaches"
echo "  - BROWSER-TOOLS-MCP-README.md - Claude operating instructions"
echo "  - TROUBLESHOOTING.md - Common issues and solutions"
echo ""