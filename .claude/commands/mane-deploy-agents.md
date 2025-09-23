---
name: mane-deploy-agents
description: Deploy MANE agents using systematic batch protocol with user testing
arguments:
  - name: batch
    description: "Batch number to deploy (1=Foundation✅, 2=Framework, 3=Core Tools, 4=Advanced Tools)"
    required: false
    type: string
---

# 🚀 MANE Batch Agent Deployment

Deploy MANE agents using **systematic batch protocol** with user testing and verification checkpoints.

## 📋 Usage Examples

```bash
/mane-deploy-agents batch=2          # Deploy Batch 2 (Framework Specialist)
/mane-deploy-agents batch=3          # Deploy Batch 3 (Core Tools - parallel)
/mane-deploy-agents batch=4          # Deploy Batch 4 (Advanced Tools - parallel)
/mane-deploy-agents                  # Discovery mode - show status and recommendations
```

## 🦁 MANE Batch Protocol Reference

**All agents must read ESSENTIAL_CONTEXT_FOR_AGENTS.md for complete context and requirements.**

### 📊 Batch Status Overview

- **🏗️ BATCH 1 (Foundation)**: ✅ COMPLETE - Agent A (Foundation Architect)
- **🎨 BATCH 2 (Framework)**: 🔴 CRITICAL NEXT - Agent F (Framework Specialist)
- **🛠️ BATCH 3 (Core Tools)**: 🟡 DEPENDS ON BATCH 2 - Agents G,H,I (Navigation, Screenshot, Interaction)
- **⚡ BATCH 4 (Advanced Tools)**: 🟢 DEPENDS ON BATCH 3 - Agents B,C,D,E (Evaluation, Audit, Console, Content)

### 🎯 Batch Deployment Logic

```bash
# Handle batch argument
if [ "$BATCH_ARG" = "2" ]; then
    echo "🎨 DEPLOYING BATCH 2: Framework Specialist"
    BATCH_AGENTS=("agent-f-framework")
    BATCH_DESCRIPTION="Chrome Extension Framework"
    BATCH_CRITICAL=true
elif [ "$BATCH_ARG" = "3" ]; then
    echo "🛠️ DEPLOYING BATCH 3: Core Tools (Parallel)"
    BATCH_AGENTS=("agent-g-navigation" "agent-h-screenshot" "agent-i-interaction")
    BATCH_DESCRIPTION="Navigation, Screenshot, Interaction Tools"
    BATCH_REQUIRES="batch-2-complete"
elif [ "$BATCH_ARG" = "4" ]; then
    echo "⚡ DEPLOYING BATCH 4: Advanced Tools (Parallel)"
    BATCH_AGENTS=("agent-b-evaluate" "agent-c-audit" "agent-d-console" "agent-e-content")
    BATCH_DESCRIPTION="Evaluation, Audit, Console, Content Tools"
    BATCH_REQUIRES="batch-3-complete"
else
    echo "🔍 DISCOVERY MODE: Analyzing current status and providing recommendations"
    DISCOVERY_MODE=true
fi
```

## Phase 1: Batch-Aware Discovery & Status

**I will discover current status and provide batch-specific recommendations.**

### Agent Discovery Commands

```bash
echo "🔍 DISCOVERING MANE AGENT CONFIGURATION..."

# 1. Discover agent specifications
echo "🤖 Scanning for agent specifications..."
AGENT_SPECS_DIR=".claude/agents"
if [ -d "$AGENT_SPECS_DIR" ]; then
    AGENT_SPECS=($(ls $AGENT_SPECS_DIR/mane-*.md 2>/dev/null))
    TOTAL_SPECS=${#AGENT_SPECS[@]}
    echo "📋 Found $TOTAL_SPECS agent specifications:"

    for spec in "${AGENT_SPECS[@]}"; do
        AGENT_NAME=$(basename "$spec" .md)
        AGENT_DESCRIPTION=$(grep "description:" "$spec" | head -1 | cut -d':' -f2- | xargs)
        echo "  - $AGENT_NAME: $AGENT_DESCRIPTION"
    done
else
    echo "❌ CRITICAL: Agent specifications directory not found"
fi

# 2. Discover universe worktrees
echo "🌌 Scanning for agent universes..."
UNIVERSES_DIR="../mane-universes"
if [ -d "$UNIVERSES_DIR" ]; then
    UNIVERSES=($(ls -d $UNIVERSES_DIR/agent-* 2>/dev/null))
    TOTAL_UNIVERSES=${#UNIVERSES[@]}
    echo "🌟 Found $TOTAL_UNIVERSES agent universes:"

    for universe in "${UNIVERSES[@]}"; do
        UNIVERSE_NAME=$(basename "$universe")
        if [ -d "$universe" ]; then
            cd "$universe"
            STATUS=$(git status --porcelain | wc -l)
            BRANCH=$(git branch --show-current)
            echo "  - $UNIVERSE_NAME (branch: $BRANCH, changes: $STATUS)"
            cd - > /dev/null
        fi
    done
else
    echo "❌ CRITICAL: Agent universes directory not found"
fi

# 3. Match specs to universes
echo "🔗 Matching specifications to universes..."
DEPLOYABLE_AGENTS=()
SPEC_UNIVERSE_PAIRS=()

for spec in "${AGENT_SPECS[@]}"; do
    SPEC_NAME=$(basename "$spec" .md)
    # Extract agent identifier (e.g., mane-foundation-architect -> agent-a-foundation)
    AGENT_ID=$(grep -o "agent-[a-z]-[a-z-]*" "$spec" | head -1)

    if [ -n "$AGENT_ID" ] && [ -d "$UNIVERSES_DIR/$AGENT_ID" ]; then
        DEPLOYABLE_AGENTS+=("$AGENT_ID")
        SPEC_UNIVERSE_PAIRS+=("$SPEC_NAME -> $AGENT_ID")
        echo "  ✅ $SPEC_NAME -> $AGENT_ID (READY)"
    else
        echo "  ❌ $SPEC_NAME -> NO MATCHING UNIVERSE"
    fi
done

# 4. Check foundation status
echo "🏗️ Checking foundation status..."
FOUNDATION_UNIVERSE="$UNIVERSES_DIR/agent-a-foundation"
if [ -d "$FOUNDATION_UNIVERSE" ]; then
    cd "$FOUNDATION_UNIVERSE"

    FOUNDATION_COMPONENTS=("core" "contracts" "docs")
    FOUNDATION_READY=true

    for component in "${FOUNDATION_COMPONENTS[@]}"; do
        if [ -d "$component" ] || [ -f "$component"* ]; then
            echo "  ✅ Foundation component: $component"
        else
            echo "  ⚠️ Missing foundation: $component"
            FOUNDATION_READY=false
        fi
    done

    cd - > /dev/null
else
    echo "  ❌ Foundation universe not found"
    FOUNDATION_READY=false
fi

echo "🔍 DISCOVERY COMPLETE - GENERATING SUMMARY..."
```

## Phase 2: Discovery Report & User Verification

**I will present findings and ask for your verification before proceeding.**

### Discovery Summary Format

```
🦁 MANE AGENT DEPLOYMENT DISCOVERY REPORT
=========================================

AGENT SPECIFICATIONS FOUND: X
🤖 Available Agents:
[Dynamically discovered list with descriptions]

AGENT UNIVERSES FOUND: X
🌌 Universe Status:
[Dynamically discovered list with git status]

DEPLOYABLE AGENTS: X
🚀 Ready for Deployment:
[Matched spec->universe pairs]

FOUNDATION STATUS: [READY/INCOMPLETE/MISSING]
🏗️ Foundation Components:
[Dynamic foundation status check]

DEPLOYMENT CANDIDATES:
[List of agents ready for parallel deployment, excluding foundation]

❓ VERIFICATION REQUIRED:
1. Do these agent assignments look correct?
2. Are there any agents you want to exclude from deployment?
3. Should I proceed with all deployable agents or deploy in batches?
4. Any specific order or priority for deployment?
```

### User Verification Checkpoint

```
🛑 USER VERIFICATION CHECKPOINT
==============================

Please review the discovery report above and confirm:

✅ PROCEED OPTIONS:
1. "Deploy all agents" - Launch all discovered deployable agents in parallel
2. "Deploy these agents: [list]" - Deploy only specified agents
3. "Deploy in batches" - Staged deployment with verification between batches
4. "Deploy foundation first" - If foundation is not ready, set it up first

❌ STOP OPTIONS:
5. "Fix issues first" - Address discovered problems before deployment
6. "Cancel deployment" - Stop and investigate issues manually

VERIFICATION QUESTION:
Based on the discovery report, how would you like to proceed?
```

## Phase 3: Batch-Specific Deployment Execution

**Deploys specific batch with proper dependency checking and user testing protocol.**

### Batch Dependency Validation

```bash
# Check batch dependencies before deployment
validate_batch_dependencies() {
    local BATCH_NUM="$1"

    case "$BATCH_NUM" in
        "2")
            # Batch 2 requires Batch 1 (Foundation) complete
            if [ ! -f "../mane-universes/agent-a-foundation/.batch-1-complete" ]; then
                echo "❌ DEPENDENCY ERROR: Batch 1 (Foundation) must be complete before Batch 2"
                return 1
            fi
            echo "✅ Batch 1 dependency satisfied"
            ;;
        "3")
            # Batch 3 requires Batch 2 (Framework) complete
            if [ ! -f "../mane-universes/agent-f-framework/.batch-2-complete" ]; then
                echo "❌ DEPENDENCY ERROR: Batch 2 (Framework) must be complete before Batch 3"
                return 1
            fi
            echo "✅ Batch 2 dependency satisfied"
            ;;
        "4")
            # Batch 4 requires Batch 3 (Core Tools) complete
            if [ ! -f "../mane-universes/agent-g-navigation/.batch-3-complete" ] || \
               [ ! -f "../mane-universes/agent-h-screenshot/.batch-3-complete" ] || \
               [ ! -f "../mane-universes/agent-i-interaction/.batch-3-complete" ]; then
                echo "❌ DEPENDENCY ERROR: Batch 3 (Core Tools) must be complete before Batch 4"
                return 1
            fi
            echo "✅ Batch 3 dependency satisfied"
            ;;
    esac

    return 0
}
```

### Batch-Specific Task Generation

```bash
# Generate Task commands for specific batch
generate_batch_tasks() {
    local BATCH_NUM="$1"

    echo "🔧 GENERATING BATCH $BATCH_NUM TASK COMMANDS:"

    case "$BATCH_NUM" in
        "2")
            echo "Task(subagent_type='mcp-expert', description='Deploy Framework Specialist', prompt='You are Agent F (Framework Specialist). Read ESSENTIAL_CONTEXT_FOR_AGENTS.md for complete context. Your mission: Create complete Chrome extension architecture from scratch in chrome-extension-mvp/. Build manifest.json, background.js, panel.js, websocket.js. Establish communication with HTTP bridge on port 3024. Enable extension installation and basic connectivity. You are the critical path - all other agents depend on your framework!')"
            ;;
        "3")
            echo "Task(subagent_type='mcp-expert', description='Deploy Navigation Specialist', prompt='You are Agent G (Navigation Specialist). Read ESSENTIAL_CONTEXT_FOR_AGENTS.md for complete context. Your mission: Implement browser_navigate functionality using the framework created by Agent F. Build navigation.js handler, integrate with Configuration Panel UI, handle errors gracefully.')"
            echo "Task(subagent_type='mcp-expert', description='Deploy Screenshot Specialist', prompt='You are Agent H (Screenshot Specialist). Read ESSENTIAL_CONTEXT_FOR_AGENTS.md for complete context. Your mission: Implement browser_screenshot functionality using Agent F framework. Build screenshot.js handler, support full page and element capture, integrate smart naming system.')"
            echo "Task(subagent_type='mcp-expert', description='Deploy Interaction Specialist', prompt='You are Agent I (Interaction Specialist). Read ESSENTIAL_CONTEXT_FOR_AGENTS.md for complete context. Your mission: Implement browser_click, browser_type, browser_wait functionality using Agent F framework. Build interactions.js handler for all three tools.')"
            ;;
        "4")
            echo "Task(subagent_type='mcp-expert', description='Deploy Evaluation Specialist', prompt='You are Agent B (Evaluation Specialist). Read ESSENTIAL_CONTEXT_FOR_AGENTS.md for complete context. Your mission: Implement secure browser_evaluate JavaScript execution using Agent F framework. Build evaluate.js with security sandboxing, error handling, integration with Code & Content panel.')"
            echo "Task(subagent_type='mcp-expert', description='Deploy Audit Specialist', prompt='You are Agent C (Audit Specialist). Read ESSENTIAL_CONTEXT_FOR_AGENTS.md for complete context. Your mission: Implement browser_audit Lighthouse integration using Agent F framework. Build audit.js for performance/accessibility analysis, ensure JSON responses, integrate with Advanced panel.')"
            echo "Task(subagent_type='mcp-expert', description='Deploy Console Detective', prompt='You are Agent D (Console Detective). Read ESSENTIAL_CONTEXT_FOR_AGENTS.md for complete context. Your mission: Implement browser_get_console monitoring using Agent F framework. Build console.js for real-time log capture, categorization, privacy filtering, integrate with Console & Status panel.')"
            echo "Task(subagent_type='mcp-expert', description='Deploy Content Extractor', prompt='You are Agent E (Content Extractor). Read ESSENTIAL_CONTEXT_FOR_AGENTS.md for complete context. Your mission: Implement browser_get_content extraction using Agent F framework. Build content.js for DOM analysis, XSS protection, safe content delivery, integrate with Code & Content panel.')"
            ;;
    esac
}
```

### User Testing Protocol Integration

```bash
# Generate user testing instructions for completed batch
generate_user_testing_instructions() {
    local BATCH_NUM="$1"

    echo "📋 BATCH $BATCH_NUM USER TESTING INSTRUCTIONS:"
    echo "================================================"

    case "$BATCH_NUM" in
        "2")
            cat << 'EOF'
1. Install Extension:
   - Open Chrome → Extensions → Developer Mode
   - Click "Load unpacked" → Select chrome-extension-mvp folder
   - Verify extension appears in extensions list

2. Activate Extension:
   - Open any website (e.g., https://example.com)
   - Open Developer Tools (F12)
   - Look for "Browser Tools" tab
   - Click on "Browser Tools" tab

3. Test Connection:
   - Ensure HTTP bridge is running: ./mcp-server/start.sh
   - Extension should show "Connected" status
   - Check Configuration Panel shows port 3024 connection
   - Look for successful WebSocket connection messages

4. UI Verification:
   - All 4 panels visible and properly sized
   - Aqua/magenta theme applied correctly
   - Responsive layout works when resizing DevTools
   - No broken styling or layout issues

EXPECTED RESULT: Working extension with beautiful UI, connected to backend
EOF
            ;;
        "3")
            cat << 'EOF'
1. Navigation Testing (Agent G):
   - Test: mcp__mcp-claude-code-browser-tools__browser_navigate
   - Navigate to: https://example.com, https://google.com, invalid URLs
   - Verify: Page loads correctly, error handling for invalid URLs

2. Screenshot Testing (Agent H):
   - Test: mcp__mcp-claude-code-browser-tools__browser_screenshot
   - Capture: Full page, specific elements, different page sizes
   - Verify: Screenshots saved correctly with smart naming

3. Interaction Testing (Agent I):
   - Test: mcp__mcp-claude-code-browser-tools__browser_click
   - Test: mcp__mcp-claude-code-browser-tools__browser_type
   - Test: mcp__mcp-claude-code-browser-tools__browser_wait
   - Verify: Form interactions, button clicks, wait conditions

4. Cross-Tool Integration:
   - Navigate → Screenshot → Click → Type workflow
   - Test on complex websites (e.g., forms, interactive elements)
   - Verify all tools work together seamlessly

EXPECTED RESULT: 5/9 browser tools working perfectly with Claude Code
EOF
            ;;
        "4")
            cat << 'EOF'
1. JavaScript Evaluation Testing (Agent B):
   - Test: mcp__mcp-claude-code-browser-tools__browser_evaluate
   - Execute: Simple JS (document.title), complex operations, error scenarios
   - Verify: Secure execution, proper results, error handling

2. Audit Testing (Agent C):
   - Test: mcp__mcp-claude-code-browser-tools__browser_audit
   - Audit: Various websites for performance, accessibility, SEO
   - Verify: JSON responses (not HTML!), meaningful recommendations

3. Console Monitoring (Agent D):
   - Test: mcp__mcp-claude-code-browser-tools__browser_get_console
   - Monitor: Pages with console logs, errors, warnings
   - Verify: Real-time capture, categorization, privacy filtering

4. Content Extraction (Agent E):
   - Test: mcp__mcp-claude-code-browser-tools__browser_get_content
   - Extract: Text content, HTML structure, specific elements
   - Verify: Clean extraction, XSS protection, formatting

5. Complete Integration Testing:
   - Test all 9 tools in sequence
   - Complex workflows: Navigate → Evaluate → Audit → Extract → Screenshot
   - Security testing: Malicious JS, XSS attempts, privacy scenarios

EXPECTED RESULT: Complete 9/9 browser tools suite working flawlessly
EOF
            ;;
    esac
}
```

### Batch Processing Logic

```bash
# Function to deploy agents dynamically
deploy_agents() {
    local AGENTS_TO_DEPLOY=("$@")
    local DEPLOYMENT_COUNT=${#AGENTS_TO_DEPLOY[@]}

    echo "🚀 PREPARING PARALLEL DEPLOYMENT OF $DEPLOYMENT_COUNT AGENTS"

    # Validate each agent before deployment
    for agent in "${AGENTS_TO_DEPLOY[@]}"; do
        echo "🔍 Pre-deployment validation: $agent"

        # Check universe health
        cd "../mane-universes/$agent"
        if git status --porcelain | grep -q .; then
            echo "  ⚠️ $agent has uncommitted changes"
        else
            echo "  ✅ $agent universe clean"
        fi

        # Check agent specification
        SPEC_FILE="../../browser-tools-setup/.claude/agents/mane-*$agent*.md"
        if ls $SPEC_FILE 1> /dev/null 2>&1; then
            echo "  ✅ $agent specification found"
        else
            echo "  ❌ $agent specification missing"
        fi

        cd - > /dev/null
    done

    echo "📋 PRE-DEPLOYMENT VALIDATION COMPLETE"
    echo "🎯 AGENTS READY FOR DEPLOYMENT: ${AGENTS_TO_DEPLOY[*]}"
}

# Function to generate Task commands dynamically
generate_task_commands() {
    local AGENTS=("$@")

    echo "🔧 GENERATING TASK COMMANDS FOR PARALLEL EXECUTION:"

    for agent in "${AGENTS[@]}"; do
        # Extract agent type from universe name
        AGENT_TYPE=$(echo "$agent" | sed 's/agent-[a-z]-//')

        echo "Task(subagent_type=mcp-expert, description='Launch $agent', prompt='[Agent-specific mission]')"
    done
}
```

### Progress Monitoring

```bash
# Dynamic progress tracking
monitor_deployment() {
    echo "📊 MONITORING DEPLOYMENT PROGRESS..."

    # Check universe doctor status
    make universe-doctor

    # Check each deployed agent
    for agent in "${DEPLOYED_AGENTS[@]}"; do
        cd "../mane-universes/$agent"

        CHANGES=$(git status --porcelain | wc -l)
        COMMITS=$(git log --oneline | head -5)

        echo "📈 $agent: $CHANGES changes, recent activity:"
        echo "$COMMITS" | head -2

        cd - > /dev/null
    done
}
```

## Deployment Safeguards

### Dynamic Error Handling

- **Agent Discovery**: Automatically adapt to any number of agents
- **Specification Matching**: Verify each agent has proper spec-universe pairing
- **Foundation Dependency**: Check foundation readiness before agent deployment
- **User Confirmation**: Explicit verification before any deployment action
- **Rollback Capability**: Each agent can be reset independently
- **Progress Isolation**: Failed agents don't affect successful ones

### Quality Gates

```bash
# Dynamic quality validation
validate_deployment() {
    local SUCCESS_COUNT=0
    local TOTAL_AGENTS=${#DEPLOYED_AGENTS[@]}

    for agent in "${DEPLOYED_AGENTS[@]}"; do
        cd "../mane-universes/$agent"

        # Run agent-specific quality checks
        if make quality-gate 2>/dev/null; then
            echo "✅ $agent passed quality gates"
            ((SUCCESS_COUNT++))
        else
            echo "❌ $agent failed quality gates"
        fi

        cd - > /dev/null
    done

    echo "📊 DEPLOYMENT RESULTS: $SUCCESS_COUNT/$TOTAL_AGENTS agents successful"
}
```

**Dynamic, verified, safe parallel deployment - exactly what MANE was designed for! 🦁⚡**