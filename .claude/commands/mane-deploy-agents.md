---
name: mane-deploy-agents
description: Deploy MANE agents in parallel with dynamic discovery and user verification
---

# 🚀 MANE Parallel Agent Deployment

Deploy MANE agents with **dynamic discovery** and **user verification** checkpoints.

## Phase 1: Dynamic Agent Discovery

**I will programmatically discover and report all available agents before proceeding.**

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

## Phase 3: Dynamic Deployment Execution

**Only after your verification and approval:**

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