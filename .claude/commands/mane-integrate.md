# 🦁 MANE Integration Command
**XML-Powered Universal Command for Intelligent Integration of Parallel MANE Agent Work**

---allowed-tools: [github, task, read, write, edit, bash, glob, grep]

## Command Description

The `/mane-integrate` command orchestrates the intelligent integration of parallel agent work across MANE universes using **XML-driven configuration**. It reads project configuration from `browser-tools-mane-project.xml` (or any MANE XML file) to understand the project structure, batch mappings, agent universes, and integration strategies, then executes intelligent integration while preserving the benefits of isolated development and ensuring zero-conflict, high-quality system integration.

## Command Syntax

```bash
/mane-integrate [mode] [options]
```

## Arguments

### Mode Arguments (Mutually Exclusive)

- **batch**: Batch number to integrate (1, 2, 3, 4, or "all")
  - Example: `batch=3` - Integrate Batch 3 agents (G,H,I - Core Tools)
  - Example: `batch=4` - Integrate Batch 4 agents (B,C,D,E - Advanced Tools)
  - Example: `batch=all` - Integrate all completed batches

### **Standard MANE Batch Mappings**:
- **Batch 1**: Agent A (Foundation) → `agent-a-foundation`
- **Batch 2**: Agent F (Framework) → `agent-f-framework`/`agent-f-ui-panels`
- **Batch 3**: Agents G,H,I (Core Tools) → `agent-g-navigation`, `agent-h-screenshot`, `agent-i-interaction`
- **Batch 4**: Agents B,C,D,E (Advanced Tools) → `agent-b-evaluate`, `agent-c-audit`, `agent-d-console`, `agent-e-content`

- **agents**: Comma-separated list of specific agents to integrate
  - Example: `agents=G,H,I` - Integrate agents G, H, and I
  - Example: `agents=foundation` - Integrate foundation components only

- **universe**: Specific universe name to integrate
  - Example: `universe=agent-g-screenshot` - Integrate specific universe
  - Example: `universe=all` - Integrate all universes

### Option Arguments

#### Strategy Options
- **--strategy**: Integration strategy to use
  - `registry-based` (default) - Use auto-discovery registry
  - `smart-merge` - AI-driven conflict resolution
  - `cherry-pick` - Selective feature integration
  - `validation-first` - Test universes individually first

#### Target Options
- **--target**: Target integration location
  - `integration` (default) - Target integration universe
  - `main` - Target main branch
  - `current` - Target current working directory

#### Testing Options
- **--test-universes**: Test each universe individually before integration
- **--test-only**: Run tests without actual integration
- **--skip-tests**: Skip testing (not recommended)
- **--test-strategy**: Testing approach (parallel, sequential, critical-path)

#### Analysis & Reporting Options
- **--analyze-only**: Discovery and analysis only, no integration
- **--dry-run**: Show what would be integrated without doing it
- **--verbose**: Detailed progress and analysis output
- **--report-format**: Report format (json, markdown, html)
- **--report-file**: Save integration report to specified file
- **--generate-user-tasks**: Generate user testing task list (default: true)

#### Safety & Rollback Options
- **--rollback**: Rollback to previous integration state
- **--rollback**: Rollback to specific integration state (with hash)
- **--create-backup**: Create backup before integration
- **--force**: Override safety checks (use with caution)

#### Quality & Validation Options
- **--quality-gates**: Quality validation level (none, basic, standard, comprehensive)
- **--performance-check**: Run performance validation
- **--security-scan**: Run security compliance validation
- **--coverage-requirement**: Minimum test coverage requirement (default: 80%)

## Usage Examples

### Standard Integration
```bash
# Integrate Batch 3 with comprehensive validation
/mane-integrate batch=3

# Integrate specific agents with testing
/mane-integrate agents=G,H,I --test-universes --create-backup
```

### Analysis & Planning
```bash
# Analyze what would be integrated without doing it
/mane-integrate batch=3 --dry-run --verbose

# Generate analysis report only
/mane-integrate --analyze-only --report-file=integration-analysis.md
```

### Testing & Validation
```bash
# Test-only integration to validate approach
/mane-integrate agents=G,H,I --test-only --strategy=validation-first

# High-security integration with all validation
/mane-integrate batch=3 --security-scan --performance-check --quality-gates=comprehensive
```

### Emergency Operations
```bash
# Rollback to previous working state
/mane-integrate --rollback

# Force integration overriding safety checks
/mane-integrate batch=3 --force
```

### Custom Integration Strategies
```bash
# Cherry-pick specific features
/mane-integrate agents=G,H --strategy=cherry-pick

# Smart merge with conflict resolution
/mane-integrate batch=3 --strategy=smart-merge --verbose
```

## XML-Powered Command Implementation

The command performs the following XML-driven operations:

### Phase 0: XML Configuration Loading
1. **Locate MANE XML Project File** - Find `browser-tools-mane-project.xml` or specified XML file
2. **Load XML Configuration** - Parse complete project configuration using MANE XML Processor
3. **Extract Essential Context** - Read project overview, technical architecture, and development context from XML
4. **Load Agent Universe Specifications** - Get complete agent definitions, capabilities, and target tools from XML
5. **Load Integration Configuration** - Extract batch mappings, integration strategies, and quality gates from XML

### Phase 1: XML-Driven Discovery & Analysis
1. **Map Batch to Universes** - Use XML batch mappings to identify target agent universes
2. **Locate Agent Universes** - Find actual universe directories using XML-specified paths
3. **Catalog Agent Changes** - Analyze modifications in each universe since last integration
4. **Validate XML Configuration** - Ensure agent implementations match XML specifications
5. **Assess Integration Readiness** - Evaluate agent work quality against XML-defined criteria

### Phase 2: Integration Planning
1. **Select optimal strategy** based on analysis
2. **Generate integration plan** with risk assessment
3. **Validate prerequisites** for chosen strategy
4. **Estimate timeline** and resource requirements

### Phase 3: Integration Execution
1. **Create backup** (if requested)
2. **Execute integration strategy** with conflict resolution
3. **Coordinate registry** and auto-discovery
4. **Validate integration** against quality gates

### Phase 4: Testing & Validation
1. **Run comprehensive tests** on integrated system
2. **Validate performance** and security compliance
3. **Generate quality metrics** and compliance reports
4. **Document integration** results and changes

### Phase 5: User Deliverables
1. **Generate integration report** with detailed analysis
2. **Create user testing checklist** with specific tasks
3. **Provide debug guidance** for potential issues
4. **Offer recommendations** for future improvements

## Expected Output

After successful execution, the command produces:

### Integration Report
```markdown
# 🦁 MANE Integration Report
**Integration ID**: [Unique identifier]
**Date**: [Integration timestamp]
**Strategy**: [Integration strategy used]
**Agents Integrated**: [List of agents]

## Integration Summary
- ✅ [Number] agents successfully integrated
- ✅ [Number] tools now available
- ✅ [Number] quality gates passed
- ⚠️ [Number] issues requiring attention

## Changes Integrated
### Agent G (Navigation Specialist)
- ✅ browser_navigate tool
- ✅ Navigation UI components
- ✅ Error handling and validation

### Agent H (Screenshot Specialist)
- ✅ browser_screenshot tool
- ✅ Smart naming system
- ⚠️ Timeout optimization needed

[Detailed breakdown continues...]
```

### User Testing Checklist
```markdown
# 🧪 USER TESTING CHECKLIST
**Integration**: Batch 3 (Core Tools)
**Expected Duration**: 15-20 minutes

## Core Functionality Tests
- [ ] **Test Navigation**: `mcp__mcp-claude-code-browser-tools__browser_navigate`
  - **Command**: Navigate to https://example.com
  - **Expected**: Page loads successfully, no errors
  - **Debug if fails**: Check HTTP bridge logs, verify extension connection

- [ ] **Test Screenshot**: `mcp__mcp-claude-code-browser-tools__browser_screenshot`
  - **Command**: Capture full page screenshot
  - **Expected**: Screenshot saved with smart filename
  - **Debug if fails**: Check .screenshots/ directory, verify WebSocket connection

[Detailed testing tasks continue...]

## Debug Guidelines
### 🔧 Common Issues & Solutions
[Comprehensive troubleshooting guide...]
```

## Error Handling

The command includes comprehensive error handling:

### Pre-Integration Errors
- **Missing universes**: Clear guidance on setting up MANE structure
- **Quality gate failures**: Detailed analysis of what needs fixing
- **Dependency conflicts**: Smart resolution suggestions

### Integration Errors
- **Merge conflicts**: AI-powered conflict resolution with user review
- **Test failures**: Detailed failure analysis and remediation steps
- **Performance issues**: Optimization recommendations

### Post-Integration Errors
- **Validation failures**: Rollback with detailed failure analysis
- **Quality regressions**: Performance impact analysis and mitigation
- **Documentation gaps**: Auto-generation of missing documentation

## Safety Features

### Automatic Safeguards
- **Backup creation** before any destructive operations
- **Quality gate validation** before finalizing integration
- **Rollback capability** if integration fails
- **Conflict detection** with resolution guidance

### User Confirmations
- **High-risk operations** require explicit confirmation
- **Destructive changes** show preview with user approval
- **Quality gate failures** prompt for user decision
- **Rollback operations** confirm intended state

## Compatibility

### Universal Design
- **Project-agnostic**: Works with any MANE-compliant project
- **Language-agnostic**: Supports any programming language
- **Platform-agnostic**: Works across different operating systems
- **Framework-agnostic**: Adapts to different project frameworks

### MANE Deployment Models
- **MANE-Worktrees**: Local parallel development
- **MANE-GitHub**: Distributed team coordination
- **MANE-Hybrid**: Combined local and distributed development
- **MANE-Cloud**: Containerized agent orchestration

---

**🦁 Built with MANE - The future of AI collaborative development**

*Command Version: 1.0*
*Compatible with: All MANE projects*
*Last Updated: September 20, 2025*