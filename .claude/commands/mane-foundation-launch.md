---
name: mane-foundation-launch
description: Launch MANE Foundation with dynamic discovery and user verification
---

# 🦁 MANE Foundation Launch

Launch the **Foundation Architect** with **dynamic discovery** and **user verification** checkpoints.

## Phase 1: Dynamic System Discovery

**I will programmatically discover and report all system components before proceeding.**

### System Discovery Commands

```bash
echo "🔍 DISCOVERING MANE SYSTEM CONFIGURATION..."

# 1. Discover project structure
echo "📁 Scanning project structure..."
PROJECT_COMPONENTS=("contracts" "scripts" ".claude" "MANE" "Makefile")
MISSING_COMPONENTS=()

for component in "${PROJECT_COMPONENTS[@]}"; do
    if [ -e "$component" ]; then
        if [ -d "$component" ]; then
            ITEM_COUNT=$(ls "$component" | wc -l)
            echo "  ✅ $component/ ($ITEM_COUNT items)"
        else
            FILE_SIZE=$(wc -l < "$component" 2>/dev/null || echo "binary")
            echo "  ✅ $component ($FILE_SIZE lines)"
        fi
    else
        echo "  ❌ Missing: $component"
        MISSING_COMPONENTS+=("$component")
    fi
done

# 2. Discover contract files dynamically
echo "📋 Scanning contract files..."
CONTRACTS_DIR="contracts"
if [ -d "$CONTRACTS_DIR" ]; then
    CONTRACT_FILES=($(ls $CONTRACTS_DIR/*.yaml $CONTRACTS_DIR/*.json $CONTRACTS_DIR/*.md 2>/dev/null))
    TOTAL_CONTRACTS=${#CONTRACT_FILES[@]}
    echo "📄 Found $TOTAL_CONTRACTS contract files:"

    for contract in "${CONTRACT_FILES[@]}"; do
        FILE_NAME=$(basename "$contract")
        FILE_SIZE=$(wc -l < "$contract")
        echo "  - $FILE_NAME ($FILE_SIZE lines)"

        # Basic validation
        case "$FILE_NAME" in
            *.yaml|*.yml)
                if node -e "require('js-yaml').load(require('fs').readFileSync('$contract', 'utf8'))" 2>/dev/null; then
                    echo "    ✅ Valid YAML"
                else
                    echo "    ❌ Invalid YAML"
                fi
                ;;
            *.json)
                if jq . "$contract" >/dev/null 2>&1; then
                    echo "    ✅ Valid JSON"
                else
                    echo "    ❌ Invalid JSON"
                fi
                ;;
        esac
    done
else
    echo "❌ CRITICAL: Contracts directory not found"
fi

# 3. Discover foundation agent specification
echo "🤖 Scanning for foundation agent..."
FOUNDATION_SPECS=($(ls .claude/agents/*foundation* .claude/agents/*architect* 2>/dev/null))
FOUNDATION_SPEC_COUNT=${#FOUNDATION_SPECS[@]}

if [ $FOUNDATION_SPEC_COUNT -gt 0 ]; then
    echo "🏗️ Found $FOUNDATION_SPEC_COUNT foundation specifications:"

    for spec in "${FOUNDATION_SPECS[@]}"; do
        SPEC_NAME=$(basename "$spec" .md)
        SPEC_LINES=$(wc -l < "$spec")
        SPEC_DESCRIPTION=$(grep "description:" "$spec" | head -1 | cut -d':' -f2- | xargs)

        echo "  - $SPEC_NAME ($SPEC_LINES lines)"
        echo "    Description: $SPEC_DESCRIPTION"

        # Extract target universe from spec
        TARGET_UNIVERSE=$(grep -o "agent-[a-z]-[a-z-]*" "$spec" | head -1)
        if [ -n "$TARGET_UNIVERSE" ]; then
            echo "    Target Universe: $TARGET_UNIVERSE"
        fi
    done
else
    echo "❌ CRITICAL: No foundation agent specification found"
fi

# 4. Discover git worktree structure
echo "🌌 Scanning git worktree structure..."
if command -v git >/dev/null 2>&1; then
    WORKTREE_OUTPUT=$(git worktree list --porcelain 2>/dev/null)

    if [ $? -eq 0 ]; then
        MANE_WORKTREES=($(echo "$WORKTREE_OUTPUT" | grep "worktree.*mane-universes" | cut -d' ' -f2-))
        WORKTREE_COUNT=${#MANE_WORKTREES[@]}

        echo "🌟 Found $WORKTREE_COUNT MANE universe worktrees:"

        for worktree in "${MANE_WORKTREES[@]}"; do
            UNIVERSE_NAME=$(basename "$worktree")
            if [ -d "$worktree" ]; then
                cd "$worktree"
                BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
                CHANGES=$(git status --porcelain | wc -l)
                echo "  - $UNIVERSE_NAME (branch: $BRANCH, changes: $CHANGES)"
                cd - > /dev/null
            fi
        done
    else
        echo "⚠️ Cannot access git worktree information"
    fi
else
    echo "❌ CRITICAL: Git not available"
fi

# 5. Check build and validation tools
echo "🛠️ Scanning build tools..."
BUILD_TOOLS=("make" "node" "npm")
AVAILABLE_TOOLS=()
MISSING_TOOLS=()

for tool in "${BUILD_TOOLS[@]}"; do
    if command -v "$tool" >/dev/null 2>&1; then
        VERSION=$($tool --version 2>/dev/null | head -1)
        echo "  ✅ $tool: $VERSION"
        AVAILABLE_TOOLS+=("$tool")
    else
        echo "  ❌ Missing: $tool"
        MISSING_TOOLS+=("$tool")
    fi
done

# Test Makefile targets if available
if [ -f "Makefile" ] && command -v make >/dev/null 2>&1; then
    echo "📋 Available Makefile targets:"
    MAKEFILE_TARGETS=$(make -qp 2>/dev/null | awk -F':' '/^[a-zA-Z0-9][^$#\/\t=]*:([^=]|$)/ {split($1,A,/ /); for(i in A)print A[i]}' | sort -u)
    echo "  Targets: $(echo $MAKEFILE_TARGETS | tr '\n' ' ')"
fi

echo "🔍 DISCOVERY COMPLETE - GENERATING SUMMARY..."
```

## Phase 2: Discovery Report & User Verification

**I will present findings and ask for your verification before proceeding.**

### Discovery Summary Format

```
🦁 MANE FOUNDATION READINESS DISCOVERY REPORT
=============================================

PROJECT STRUCTURE: [X/Y components found]
📁 Core Components:
[Dynamically discovered components with status]

CONTRACT FOUNDATION: [X files found]
📋 Contract Files:
[Dynamically discovered contracts with validation]

FOUNDATION AGENT: [X specifications found]
🤖 Foundation Specifications:
[Dynamically discovered foundation agent specs]

GIT WORKTREES: [X universes found]
🌌 Universe Structure:
[Dynamically discovered worktrees with status]

BUILD TOOLS: [X/Y available]
🛠️ Development Environment:
[Dynamically discovered tools and versions]

CRITICAL ISSUES: [X found]
❌ Blocking Problems:
[Any critical issues that prevent foundation launch]

WARNINGS: [X found]
⚠️ Non-Critical Issues:
[Issues that should be addressed but don't block launch]

FOUNDATION READINESS: [READY/NEEDS SETUP/CANNOT PROCEED]
```

### User Verification Checkpoint

```
🛑 USER VERIFICATION CHECKPOINT
==============================

Please review the discovery report above and confirm:

FOUNDATION STATUS VERIFICATION:
1. Does the project structure look correct?
2. Are the contract files complete and valid?
3. Is the foundation agent specification properly defined?
4. Are the git worktrees set up correctly?
5. Do you want to proceed with any missing components?

✅ PROCEED OPTIONS:
1. "Launch foundation" - Proceed with foundation setup as-is
2. "Fix issues first" - Address discovered problems before launch
3. "Setup missing components" - Create missing pieces automatically
4. "Manual review" - Show detailed commands for manual inspection

❌ STOP OPTIONS:
5. "Cancel launch" - Stop and investigate issues manually
6. "Show recovery commands" - Display commands to fix specific issues

VERIFICATION QUESTION:
Based on the discovery report, how would you like to proceed with foundation launch?
```

## Phase 3: Dynamic Foundation Launch

**Only after your verification and approval:**

### Foundation Setup Logic

```bash
# Function to set up foundation dynamically
setup_foundation() {
    echo "🏗️ SETTING UP FOUNDATION ARCHITECTURE..."

    # Discover foundation universe
    FOUNDATION_UNIVERSE=$(ls -d ../mane-universes/*foundation* 2>/dev/null | head -1)

    if [ -z "$FOUNDATION_UNIVERSE" ]; then
        echo "❌ Foundation universe not found"
        return 1
    fi

    UNIVERSE_NAME=$(basename "$FOUNDATION_UNIVERSE")
    echo "🌟 Using foundation universe: $UNIVERSE_NAME"

    # Navigate to foundation universe
    cd "$FOUNDATION_UNIVERSE"

    # Create foundation structure dynamically
    FOUNDATION_DIRS=("core" "tests" "docs" "scripts")
    for dir in "${FOUNDATION_DIRS[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            echo "  📁 Created: $dir/"
        else
            echo "  ✅ Exists: $dir/"
        fi
    done

    # Discover and apply foundation specification
    FOUNDATION_SPEC=$(ls ../../browser-tools-setup/.claude/agents/*foundation* 2>/dev/null | head -1)
    if [ -n "$FOUNDATION_SPEC" ]; then
        echo "📋 Using specification: $(basename "$FOUNDATION_SPEC")"

        # Extract mission from specification
        MISSION=$(grep -A 10 "## Core Mission" "$FOUNDATION_SPEC" || echo "Establish foundation infrastructure")
        echo "🎯 Mission: $MISSION"
    fi

    echo "🚀 Foundation workspace prepared"
    cd - > /dev/null
}

# Function to validate foundation components
validate_foundation() {
    local FOUNDATION_UNIVERSE="$1"

    echo "🔍 VALIDATING FOUNDATION COMPONENTS..."

    cd "$FOUNDATION_UNIVERSE"

    # Dynamic component discovery
    EXPECTED_COMPONENTS=("core" "tests" "docs")
    FOUND_COMPONENTS=()
    MISSING_COMPONENTS=()

    for component in "${EXPECTED_COMPONENTS[@]}"; do
        if [ -d "$component" ] || [ -f "$component"* ]; then
            FOUND_COMPONENTS+=("$component")
            echo "  ✅ Found: $component"
        else
            MISSING_COMPONENTS+=("$component")
            echo "  ❌ Missing: $component"
        fi
    done

    echo "📊 Validation: ${#FOUND_COMPONENTS[@]}/${#EXPECTED_COMPONENTS[@]} components found"

    cd - > /dev/null
}
```

### Task Generation

```bash
# Function to generate foundation task dynamically
generate_foundation_task() {
    local FOUNDATION_SPEC="$1"
    local TARGET_UNIVERSE="$2"

    echo "🔧 GENERATING FOUNDATION TASK..."

    # Extract key information from specification
    AGENT_NAME=$(grep "name:" "$FOUNDATION_SPEC" | head -1 | cut -d':' -f2- | xargs)
    AGENT_DESCRIPTION=$(grep "description:" "$FOUNDATION_SPEC" | head -1 | cut -d':' -f2- | xargs)

    echo "Task Configuration:"
    echo "  Agent: $AGENT_NAME"
    echo "  Description: $AGENT_DESCRIPTION"
    echo "  Universe: $TARGET_UNIVERSE"
    echo "  Mission: Establish core infrastructure for MANE system"
}
```

### Progress Monitoring

```bash
# Dynamic foundation progress tracking
monitor_foundation() {
    echo "📊 MONITORING FOUNDATION PROGRESS..."

    FOUNDATION_UNIVERSE=$(ls -d ../mane-universes/*foundation* 2>/dev/null | head -1)

    if [ -n "$FOUNDATION_UNIVERSE" ]; then
        cd "$FOUNDATION_UNIVERSE"

        # Check for new files
        NEW_FILES=$(git status --porcelain | grep "^??" | wc -l)
        MODIFIED_FILES=$(git status --porcelain | grep "^ M" | wc -l)

        echo "📈 Foundation activity: $NEW_FILES new files, $MODIFIED_FILES modified"

        # Show recent activity
        if [ $NEW_FILES -gt 0 ] || [ $MODIFIED_FILES -gt 0 ]; then
            echo "🔄 Recent changes:"
            git status --porcelain | head -5
        fi

        cd - > /dev/null
    fi
}
```

## Recovery Commands

### Dynamic Recovery Options

```bash
# Create missing components based on discovery
create_missing_contracts() {
    echo "🔧 Creating missing contract files..."
    mkdir -p contracts

    # Basic contract templates
    [ ! -f "contracts/http.yaml" ] && echo "openapi: 3.0.3" > contracts/http.yaml
    [ ! -f "contracts/config.schema.json" ] && echo "{}" > contracts/config.schema.json
    [ ! -f "contracts/QUALITY_GATE.md" ] && echo "# Quality Gates" > contracts/QUALITY_GATE.md
}

# Create missing worktrees based on discovery
create_missing_universes() {
    echo "🌌 Creating missing universe worktrees..."

    # Discover required universes from specifications
    REQUIRED_UNIVERSES=($(grep -h -o "agent-[a-z]-[a-z-]*" .claude/agents/*.md 2>/dev/null | sort -u))

    for universe in "${REQUIRED_UNIVERSES[@]}"; do
        if [ ! -d "../mane-universes/$universe" ]; then
            git branch "$universe" 2>/dev/null || true
            git worktree add "../mane-universes/$universe" "$universe"
            echo "  ✅ Created: $universe"
        fi
    done
}
```

**Dynamic, verified, intelligent foundation launch - the cornerstone of MANE! 🦁🏗️**