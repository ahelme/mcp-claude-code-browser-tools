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

### 3. Auto-Discovery
Modules self-register. **No manual wiring required.**

### 4. Zero Coordination
Agents work in parallel branches. **No meetings, no blocking.**

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
- **GitHub Issues** → Agent work tickets
- **Automated Worktrees** → Isolated development
- **Pull Requests** → Code review & integration
- **Perfect for**: Distributed AI agent teams

### **MANE-Worktree** 🌳 - *Local Development*
```bash
git worktree add ../agent-a-core agent-a-core
git worktree add ../agent-b-evaluate agent-b-evaluate
```
- **Local Worktrees** → Instant isolation
- **Parallel Execution** → Multiple agents simultaneously
- **Perfect for**: High-speed local development

### **MANE-Hybrid** 🔄 - *Best of Both*
- Local worktrees for speed + GitHub for management

## Getting Started

1. **Choose deployment model** (GitHub, Worktree, or Hybrid)
2. **Define interfaces first** (Foundation Agent)
3. **Create registry system** (Auto-discovery)
4. **Assign vertical slices** (One agent per module)
5. **Develop in parallel** (Independent branches/worktrees)
6. **Auto-integrate** (Registry connects everything)

---

**Built with MANE** 🦁 - *The future of AI-collaborative development*