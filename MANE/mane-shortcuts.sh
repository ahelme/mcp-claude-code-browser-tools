#!/bin/bash
# 🦁 MANE XML Revolution - Ultimate Shortcuts 🦁
# Easy commands for the world's first XML-driven AI collaborative development system!

# Set colors for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🦁 MANE XML Revolution Shortcuts Loaded! 🦁${NC}"

# Core MANE XML Commands
alias mane-status='echo -e "${CYAN}📊 MANE Project Status:${NC}" && node MANE/mane-xml-cli.js status'
alias mane-validate='echo -e "${GREEN}✅ Validating XML Configuration:${NC}" && node MANE/mane-xml-cli.js validate browser-tools-mane-project.xml'
alias mane-batch3='echo -e "${YELLOW}📦 Batch 3 Analysis (Core Tools):${NC}" && node MANE/mane-xml-cli.js batch 3 --commands --test-checklist'
alias mane-batch4='echo -e "${RED}📦 Batch 4 Analysis (Advanced Tools):${NC}" && node MANE/mane-xml-cli.js batch 4 --commands --test-checklist'

# Agent Analysis Commands
alias mane-nav='echo -e "${BLUE}🧭 Navigation Agent Analysis:${NC}" && node MANE/mane-xml-cli.js agent agent-g-navigation'
alias mane-screenshot='echo -e "${PURPLE}📸 Screenshot Agent Analysis:${NC}" && node MANE/mane-xml-cli.js agent agent-h-screenshot'
alias mane-interact='echo -e "${CYAN}🖱️ Interaction Agent Analysis:${NC}" && node MANE/mane-xml-cli.js agent agent-i-interaction'
alias mane-eval='echo -e "${RED}🧪 Evaluation Agent Analysis:${NC}" && node MANE/mane-xml-cli.js agent agent-b-evaluate'
alias mane-audit='echo -e "${YELLOW}📊 Audit Agent Analysis:${NC}" && node MANE/mane-xml-cli.js agent agent-c-audit'
alias mane-console='echo -e "${GREEN}🎮 Console Agent Analysis:${NC}" && node MANE/mane-xml-cli.js agent agent-d-console'
alias mane-content='echo -e "${BLUE}📄 Content Agent Analysis:${NC}" && node MANE/mane-xml-cli.js agent agent-e-content'

# Git Workflow Commands
alias mane-commit-xml='echo -e "${GREEN}🦁 Committing XML Revolution Work:${NC}" && git add browser-tools-mane-project.xml MANE/ .claude/ *MANE* *XML* && git commit -m "🦁✨ XML Revolution: Complete XML-driven MANE system with enhanced agent metadata"'
alias mane-commit-tools='echo -e "${CYAN}🔧 Committing Core Tools Implementation:${NC}" && git add chrome-extension-mvp/ && git commit -m "🔧 Core Tools: Navigation, Screenshot, Interaction implementations with WebSocket optimization"'
alias mane-commit-all='echo -e "${PURPLE}🚀 Committing All MANE Work:${NC}" && git add . && git commit -m "🦁🚀 MANE XML Revolution Complete: World'\''s first XML-driven AI collaborative development system"'

# Quick Navigation
alias mane-dir='cd /Users/lennox/development/browser-tools-setup'
alias mane-universes='cd /Users/lennox/development/mane-universes/browser-tools'
alias mane-xml='cat browser-tools-mane-project.xml | head -50'

# Integration Commands (when ready)
alias mane-integrate3='echo -e "${YELLOW}⚡ Integrating Batch 3 (Core Tools):${NC}" && echo "Integration command: /mane-integrate batch=3 --strategy=parallel-core-tools --create-backup --test-universes"'
alias mane-integrate4='echo -e "${RED}⚡ Integrating Batch 4 (Advanced Tools):${NC}" && echo "Integration command: /mane-integrate batch=4 --strategy=parallel-advanced-tools --create-backup --test-universes"'

# Help Command
alias mane-help='echo -e "${WHITE}🦁 MANE XML Revolution Commands:${NC}
${CYAN}Status & Analysis:${NC}
  mane-status      - Overall project status
  mane-validate    - Validate XML configuration
  mane-batch3      - Analyze Batch 3 (Core Tools)
  mane-batch4      - Analyze Batch 4 (Advanced Tools)

${BLUE}Agent Analysis:${NC}
  mane-nav         - Navigation Agent (🧭)
  mane-screenshot  - Screenshot Agent (📸)
  mane-interact    - Interaction Agent (🖱️)
  mane-eval        - Evaluation Agent (🧪)
  mane-audit       - Audit Agent (📊)
  mane-console     - Console Agent (🎮)
  mane-content     - Content Agent (📄)

${GREEN}Git Workflow:${NC}
  mane-commit-xml  - Commit XML Revolution work
  mane-commit-tools- Commit Core Tools implementation
  mane-commit-all  - Commit everything

${PURPLE}Navigation:${NC}
  mane-dir         - Go to project directory
  mane-universes   - Go to MANE universes
  mane-xml         - Preview XML configuration

${YELLOW}Integration (when ready):${NC}
  mane-integrate3  - Integrate Batch 3
  mane-integrate4  - Integrate Batch 4"'

echo -e "${GREEN}✨ Type 'mane-help' to see all available commands! ✨${NC}"