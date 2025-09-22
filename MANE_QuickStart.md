# 🦁 MANE QuickStart Guide
**Ultra-Concise MANE Methodology Execution**

## 🎯 **MANE Workflow: 4 Stages**

### **Stage 1: CREATE Agents** ✅ COMPLETED
```bash
# Agent definitions created in .claude/agents/
# XML configuration updated with all agents
# Foundation ready for deployment
```

### **Stage 2: RUN Agents** 🎯 CURRENT
```bash
# Deploy agents to execute their work in isolated universes
Task(subagent_type="mane-agent-b-framework", prompt="Execute Batch 2 UI Framework work")
Task(subagent_type="mane-agent-c-navigation", prompt="Execute Batch 3 Navigation work")
Task(subagent_type="mane-agent-d-screenshot", prompt="Execute Batch 3 Screenshot work")
# ... continue for each agent
```

### **Stage 3: INTEGRATE Agent Work**
```bash
# Use MANE Integration Expert to merge completed work
Task(subagent_type="mcp-integration-engineer", prompt="/mane-integrate batch=2")
Task(subagent_type="mcp-integration-engineer", prompt="/mane-integrate batch=3")
Task(subagent_type="mcp-integration-engineer", prompt="/mane-integrate batch=4")
```

### **Stage 4: VALIDATE Integration**
```bash
# Test integrated system and generate user testing checklists
# Quality gates validation
# User testing execution
```

## 📋 **Current Status**

**✅ COMPLETED:**
- Stage 1: All agents created and XML configured
- Foundation infrastructure (Agent A) operational
- Agent B universe created and ready

**🎯 NEXT ACTIONS:**
1. **RUN Agent B**: Execute Framework Specialist work
2. **RUN Batch 3**: Deploy Core Tools agents (C,D,E)
3. **RUN Batch 4**: Deploy Advanced Tools agents (F,G,H,I)
4. **INTEGRATE**: Use MANE Integration Expert for each batch

## 🚀 **Execution Commands**

**Run Agent B Framework (Batch 2):**
```bash
Task(subagent_type="mane-agent-b-framework",
     prompt="Execute your XML-specified Framework Specialist mission in your agent-b-framework universe")
```

**Run Batch 3 Core Tools (Parallel):**
```bash
# Run simultaneously in separate universes
Task(subagent_type="mane-agent-c-navigation", prompt="...")
Task(subagent_type="mane-agent-d-screenshot", prompt="...")
Task(subagent_type="mane-agent-e-interaction", prompt="...")
```

**Integrate Completed Batches:**
```bash
Task(subagent_type="mcp-integration-engineer",
     prompt="/mane-integrate batch=2 --strategy=registry-based --test-universes --create-backup")
```

## 🎨 **Agent Batch Organization**

**Batch 1: Foundation** ✅ COMPLETED
- 🏗️ Agent A: Foundation Architect (MERGED to MANE_CORE)

**Batch 2: Framework** 🎯 READY TO RUN
- 🎨 Agent B: Framework Specialist (UI Components & Responsive Design)

**Batch 3: Core Tools** 🎯 READY TO RUN
- 🧭 Agent C: Navigation Specialist (browser_navigate)
- 📸 Agent D: Screenshot Specialist (browser_screenshot)
- 🖱️ Agent E: Interaction Specialist (browser_click, browser_type, browser_wait)

**Batch 4: Advanced Tools** 🎯 READY TO RUN
- 🧪 Agent F: Evaluation Specialist (browser_evaluate) - BROKEN, Critical Fix
- 📊 Agent G: Audit Specialist (browser_audit) - BROKEN, JSON Parsing
- 🎮 Agent H: Console Detective (browser_get_console) - BROKEN, Timeouts
- 📄 Agent I: Content Extractor (browser_get_content) - BROKEN, Timeouts

## 💡 **Key MANE Principles**

1. **Isolated Development**: Each agent works in dedicated universe
2. **XML-Driven**: All specs in `browser-tools-mane-project.xml`
3. **Foundation-Based**: Agent A provides interfaces for all others
4. **Auto-Integration**: Registry system connects components automatically
5. **Quality Gates**: Automated validation at every step
6. **Parallel Safe**: Zero coordination required between agents

## 🔧 **Technical Context**

**Universes**: `/Users/lennox/development/mane-universes/browser-tools/`
**Source Branch**: `MANE_CORE` (with foundation + framework infrastructure)
**Agent Files**: `.claude/agents/mane-agent-*.md`
**XML Config**: `browser-tools-mane-project.xml`

## 🎯 **Success Criteria**

**Agent Execution Success:**
- Agent completes all XML-specified responsibilities
- Uses .mjs files and JSDoc (NEVER .ts files)
- Implements foundation interfaces
- Passes quality gates
- Creates working, tested code

**Integration Success:**
- Registry auto-discovery works
- All quality gates pass
- User testing checklist generated
- Debug guidance provided
- System functions end-to-end

---

**🦁 Ready to Execute MANE Revolution!**

**Next Command**: Run Agent B Framework Specialist! 🚀✨