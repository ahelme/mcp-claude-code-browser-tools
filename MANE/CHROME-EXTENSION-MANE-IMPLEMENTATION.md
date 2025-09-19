# Chrome Extension MANE Implementation
**Modular Agentic Non-linear Engineering for Browser Tools**

## 🏗️ File Structure - Zero Overlap

```
chrome-extension-mvp/
├── core/                         // 🤖 Agent A - Foundation
│   ├── service-worker.js        //     HTTP server framework
│   ├── debugger-manager.js      //     DevTools Protocol interface
│   ├── interfaces.js            //     Type definitions & contracts
│   └── registry.js              //     Auto-discovery system
├── tools/                        // 🤖 Agents B-E - Independent tools
│   ├── evaluate.js              //     Agent B - JS evaluation
│   ├── get-content.js           //     Agent C - Content retrieval
│   ├── audit.js                 //     Agent D - Lighthouse audits
│   └── get-console.js           //     Agent E - Console logs
├── ui-panels/                    // 🤖 Agents F-I - UI components
│   ├── configuration.js         //     Agent F - Config panel logic
│   ├── code-content.js          //     Agent G - Code & content panel
│   ├── console-status.js        //     Agent H - Console & status
│   └── advanced.js              //     Agent I - Advanced settings
├── features/                     // 🤖 Agents J-K - Specialized features
│   ├── screenshot.js            //     Agent J - Screenshot system
│   └── area-screenshot.js       //     Agent K - Area screenshots
└── tests/                        // 🧪 Each agent tests their own module
    ├── tool-tests/
    ├── ui-tests/
    └── feature-tests/
```

## 🔌 Interface Contracts

### Tool Interface
```javascript
class BaseTool {
  static endpoint = '';           // e.g., '/tools/browser_evaluate'
  static schema = {};             // Parameter validation schema

  async execute(params) {         // Main functionality
    throw new Error('Must implement execute()');
  }

  validate(params) {              // Input validation
    return { valid: true };
  }
}

// Agent B implements this
class EvaluateTool extends BaseTool {
  static endpoint = '/tools/browser_evaluate';
  async execute({script}) {
    // Agent B's implementation
  }
}
```

### UI Panel Interface
```javascript
class BasePanel {
  static selector = '';           // e.g., '#configuration-panel'

  initialize() {                  // Setup event handlers
    throw new Error('Must implement initialize()');
  }

  getEventHandlers() {            // Button clicks, form changes
    return {};
  }
}

// Agent F implements this
class ConfigurationPanel extends BasePanel {
  static selector = '#configuration-panel';
  initialize() {
    // Agent F's implementation
  }
}
```

## 🔄 Auto-Discovery Registry

```javascript
// core/registry.js - Agent A creates this
class Registry {
  static tools = new Map();
  static panels = new Map();

  static registerTool(toolClass) {
    this.tools.set(toolClass.endpoint, toolClass);
  }

  static registerPanel(panelClass) {
    this.panels.set(panelClass.selector, panelClass);
  }
}

// Each agent auto-registers (no coordination needed!)
Registry.registerTool(EvaluateTool);    // Agent B
Registry.registerPanel(ConfigurationPanel); // Agent F
```

## 📋 Agent Assignment Strategy

| Agent | Responsibility | Files | Dependencies |
|-------|---------------|-------|--------------|
| **Agent A** | Core Infrastructure | `core/*` | None - builds foundation |
| **Agent B** | JS Evaluation Tool | `tools/evaluate.js` | Core interfaces only |
| **Agent C** | Content Tool | `tools/get-content.js` | Core interfaces only |
| **Agent D** | Audit Tool | `tools/audit.js` | Core interfaces only |
| **Agent E** | Console Tool | `tools/get-console.js` | Core interfaces only |
| **Agent F** | Config UI Panel | `ui-panels/configuration.js` | Core interfaces only |
| **Agent G** | Code UI Panel | `ui-panels/code-content.js` | Core interfaces only |
| **Agent H** | Console UI Panel | `ui-panels/console-status.js` | Core interfaces only |
| **Agent I** | Advanced UI Panel | `ui-panels/advanced.js` | Core interfaces only |
| **Agent J** | Screenshot Feature | `features/screenshot.js` | Core interfaces only |
| **Agent K** | Area Screenshots | `features/area-screenshot.js` | Core + Agent J |

## 🚀 Development Workflow

### Phase 1: Foundation (Agent A)
- Creates interfaces and framework
- Other agents can start mocking immediately

### Phase 2: Parallel Development (Agents B-K)
- All agents work simultaneously
- Each agent gets own Git branch
- No coordination needed - just implement the interface!

### Phase 3: Integration
- Registry automatically discovers all modules
- Integration tests verify interface compliance
- No manual wiring needed!

## 🎯 Success Metrics

✅ **Zero file conflicts** - Each agent owns distinct files
✅ **Parallel development** - All agents work simultaneously
✅ **Auto-integration** - Registry connects everything
✅ **Independent testing** - Each module tests in isolation
✅ **Clean interfaces** - No tight coupling between agents

---

**Total Agents: 11** | **Development Time: 3-5 days** | **Built with MANE** 🦁