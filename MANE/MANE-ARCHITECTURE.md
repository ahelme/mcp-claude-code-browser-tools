# 🦁 MANE Architecture
**Modular Agentic Non-linear Engineering**

## What is MANE?

**MANE** is a revolutionary software architecture that enables **multiple AI agents to develop code simultaneously** with zero coordination overhead.

### Core Principles
🧩 **Modular** - Clean plugin architecture with zero file overlap
🤖 **Agentic** - AI agents as autonomous builders
⚡ **Non-linear** - Parallel development, no dependency chains
⚙️ **Engineering** - Systematic contracts and interfaces

## How MANE Works

### 1. Vertical Slice Ownership
Each agent owns a **complete vertical slice**:
- **Frontend UI** (specific panel/component)
- **Backend Logic** (specific tool/feature)
- **API Interface** (specific endpoints)
- **Unit Tests** (their module only)

### 2. Interface Contracts
Agents develop against **standardized interfaces** - never direct dependencies.
- **Single Source of Truth**: `contracts/` package with versioned OpenAPI specs
- **Contract Validation**: Automated checks prevent drift and breaking changes
- **Schema Enforcement**: Config contracts ensure environment consistency

### 3. Auto-Discovery
Modules self-register. **No manual wiring required.**
- **Registry System**: Central component discovery and wiring
- **Plugin Architecture**: Drop-in module replacement
- **Zero Manual Configuration**: Interfaces define connections

### 4. Zero Coordination
Agents work in parallel branches. **No meetings, no blocking.**
- **Universe Isolation**: Each agent has dedicated development reality
- **Quality Gates**: Automated promotion criteria prevent integration issues
- **Contract Canon**: Shared interface definitions eliminate miscommunication

## Benefits

### For AI Agents
- **Autonomous development** - work independently
- **Clear boundaries** - no stepping on each other
- **Immediate feedback** - test in isolation

### For Human Teams
- **Massive parallelization** - 10+ agents building simultaneously
- **Reduced complexity** - each piece is simple
- **Faster delivery** - no coordination bottlenecks

### For Projects
- **Scalable architecture** - add agents = add features
- **Maintainable code** - clean modular design
- **Reliable integration** - interface contracts prevent breaking changes

## MANE Quality System

### Contract Canon & Validation
**Single source of truth prevents drift and ensures compatibility.**

```
contracts/
├── http.yaml          # OpenAPI: Complete API specification
├── config.schema.json # Environment variables schema
├── events.md          # Async event contracts
└── QUALITY_GATE.md    # Promotion criteria
```

### Quality Gates Pipeline
**Automated checks ensure every agent meets standards before integration.**

- ✅ **Contract Compliance**: OpenAPI validation, no breaking changes
- ✅ **Environment Consistency**: Config schema validation across universes
- ✅ **Code Quality**: Linting, type checking, security scans
- ✅ **Test Coverage**: Unit tests >80%, integration tests, e2e validation
- ✅ **Performance SLOs**: P95 latency <2s, error rate <2%

### Promotion Pathway
**Clear choreography prevents integration conflicts.**

1. **Agent Development**: Work in isolated universe/worktree
2. **Quality Gate Check**: `make quality-gate` validates all criteria
3. **Integration PR**: Promote to `universe-integration` branch
4. **Conflict Resolution**: Integration branch resolves multi-agent changes
5. **Production Merge**: Only after all gates pass

### Universe Doctor
**Real-time health monitoring of all agent universes.**

```bash
make universe-doctor      # Check all universe health
make doctor-watch        # Real-time monitoring
```

**Health Indicators:**
- 🔄 **Synced**: Up to date with main branch
- ✅ **Ready**: Changes ready for integration
- ⚠️ **Stale**: Behind main, needs rebase
- ❌ **Failing**: Quality gates not met
- 🚫 **Missing**: Universe not created

## MANE vs Traditional Development

| Traditional | MANE |
|-------------|------|
| Sequential phases | Parallel development |
| Team coordination | Agent autonomy |
| Tight coupling | Interface contracts |
| Manual integration | Auto-discovery |
| Merge conflicts | Zero file overlap |

## When to Use MANE

✅ **Perfect for:**
- Multi-feature applications
- AI agent teams
- Plugin architectures
- Microservice patterns

❌ **Not ideal for:**
- Single-feature apps
- Tightly coupled systems
- Legacy codebases

## MANE Deployment Models

### **MANE-GitHub** 🐙 - *Distributed Teams*
- **GitHub Issues** → Agent work tickets with SLO tracking
- **Automated Worktrees** → Isolated development with quality gates
- **Pull Requests** → Contract-validated code review & integration
- **GitHub Actions** → Automated quality gate pipeline
- **Perfect for**: Distributed AI agent teams with contract enforcement

### **MANE-Worktree** 🌳 - *Local Development*
```bash
# Create agent universes
git worktree add ../mane-universes/agent-a-foundation agent-a-foundation
git worktree add ../mane-universes/agent-b-evaluate agent-b-evaluate

# Validate and monitor
make universe-doctor      # Check health
make quality-gate        # Validate before integration
```
- **Local Worktrees** → Instant isolation with real-time health monitoring
- **Parallel Execution** → Multiple agents simultaneously with quality validation
- **Contract Validation** → Local contract checking prevents integration issues
- **Perfect for**: High-speed local development with production-grade quality

### **MANE-Hybrid** 🔄 - *Best of Both*
- **Local Development**: Worktrees + quality gates for speed
- **Global Coordination**: GitHub + contract validation for reliability
- **Universe Doctor**: Real-time monitoring across all deployment models

## Getting Started

### Quick Start (15 minutes)

1. **Setup Contract Foundation**
   ```bash
   # Initialize contracts package
   mkdir contracts/
   # Create OpenAPI spec, config schema, quality gates
   make contract-check env-validate
   ```

2. **Choose Deployment Model** (GitHub, Worktree, or Hybrid)
   ```bash
   # For MANE-Worktree (local development)
   git branch agent-a-foundation
   git worktree add ../mane-universes/agent-a-foundation agent-a-foundation
   ```

3. **Define Interface Contracts** (Foundation Agent)
   - Create `contracts/http.yaml` with API specifications
   - Define `contracts/config.schema.json` for environment variables
   - Set up quality gates in `contracts/QUALITY_GATE.md`

4. **Create Registry System** (Auto-discovery)
   - Implement interface-based plugin architecture
   - Add automatic module discovery and registration

5. **Assign Vertical Slices** (One agent per module)
   - Each agent owns: UI + API + Logic + Tests
   - No file overlap between agents

6. **Develop in Parallel** (Independent universes)
   ```bash
   # Monitor health of all universes
   make universe-doctor

   # Validate quality before integration
   make quality-gate
   ```

7. **Promote via Quality Gates**
   - Contract validation ensures compatibility
   - Automated testing prevents regressions
   - Universe integration resolves conflicts

### Contract-First Development Workflow

```bash
# Daily workflow for agents
make contract-check     # Validate API compliance
make env-validate      # Check environment consistency
make quality-gate      # Full quality pipeline
make universe-doctor   # Monitor universe health
```

---

**Built with MANE** 🦁 - *The future of AI-collaborative development*