# 🦁 MANE Technical Decisions

**Documenting key technical decisions for the Browser Tools MANE project**

---

## 📋 Decision Log

### **Decision 001: TypeScript to .mjs Migration**
**Date:** 2025-09-22
**Status:** ✅ IMPLEMENTED
**Commit:** `fd01933`

#### **Context**
The project had TypeScript files (`core/interfaces.ts`, `core/gates/*.ts`) with import path issues:
- `.ts` files importing with `.js` extensions (TypeScript convention)
- No build configuration to compile TypeScript to JavaScript
- Test files unable to import TypeScript modules directly
- Mixed `.ts` and `.mjs` codebase causing inconsistency

#### **Problem Statement**
- **Import Errors:** `ERR_MODULE_NOT_FOUND` when importing `.ts` files
- **Build Complexity:** No TypeScript compilation pipeline configured
- **Agent Confusion:** Mixed file formats creating development inconsistency
- **Testing Issues:** Tests couldn't import TypeScript modules without compilation

#### **Options Considered**

**Option A: Fix TypeScript Setup**
```
✅ Pros:
- Maintain compile-time type safety
- Better IDE support and tooling
- Industry standard for large codebases

❌ Cons:
- Requires build configuration (tsconfig.json, build scripts)
- Compilation step before running/testing
- More complex deployment pipeline
- Inconsistent with working .mjs scripts
```

**Option B: Convert to .mjs (CHOSEN)**
```
✅ Pros:
- Immediate compatibility - no build step
- Consistent with working MCP server pattern
- Native Node.js ES module support
- Direct imports in tests and development
- Faster iteration and agent deployment
- Matches existing scripts/ directory pattern

❌ Cons:
- Loss of compile-time type checking
- Manual JSDoc maintenance required
- Potential runtime errors without validation
```

#### **Decision**
**Chosen:** Option B - Convert to .mjs with JSDoc types

**Rationale:**
1. **Agent Readiness Priority:** MANE project prioritizes fast agent deployment over perfect type safety
2. **Proven Pattern:** All working parts (MCP server, scripts) already use .mjs successfully
3. **Zero Build Complexity:** Native Node.js support eliminates compilation overhead
4. **Consistency:** Uniform .mjs approach across entire codebase
5. **Immediate Problem Resolution:** Fixes import issues instantly

#### **Implementation Details**

**Files Converted:**
- `core/interfaces.ts` → `core/interfaces.mjs` (541 lines with complete JSDoc conversion)
- `core/gates/interface-compliance.ts` → `core/gates/interface-compliance.mjs`
- `core/gates/performance-quality.ts` → `core/gates/performance-quality.mjs`
- `core/gates/security-quality.ts` → `core/gates/security-quality.mjs`

**JSDoc Type Preservation:**
```javascript
/**
 * Core browser tool interface - implemented by all tools
 * @typedef {Object} IBrowserTool
 * @property {string} name - Tool identifier
 * @property {string} endpoint - API endpoint
 * @property {string} description - Tool description
 * @property {JSONSchema} schema - Parameter schema
 * @property {IToolCapabilities} capabilities - Tool capabilities
 * @property {function(unknown): Promise<IToolResult>} execute - Execute the tool
 * @property {function(unknown): IValidationResult} validate - Validate parameters
 * @property {function(): Promise<IToolStatus>} getStatus - Get tool status
 */
```

**Import Pattern Update:**
```javascript
// Before (broken)
import { IBrowserTool } from "../interfaces.js"; // .ts file with .js extension

// After (working)
import { ErrorType } from "../interfaces.mjs"; // .mjs file with .mjs extension
```

**Constants Export:**
```javascript
export const ErrorType = {
  VALIDATION: 'VALIDATION',
  EXECUTION: 'EXECUTION',
  TIMEOUT: 'TIMEOUT',
  CONNECTION: 'CONNECTION',
  AUTHENTICATION: 'AUTHENTICATION',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL: 'INTERNAL'
};
```

#### **Agent Instructions Added**
To prevent agent confusion, added crystal clear XML development standards:

```xml
<development-standards>
  <file-formats>
    <javascript-modules>
      <required-format>.mjs</required-format>
      <reason>Native Node.js ES modules - immediate compatibility</reason>
      <import-extension>.mjs</import-extension>

      <!-- ❌ FORBIDDEN FILE TYPES ❌ -->
      <forbidden-formats>
        <format>.ts</format>
        <reason>Causes import issues, requires build step</reason>
        <replacement>Use .mjs with JSDoc types instead</replacement>
      </forbidden-formats>
    </javascript-modules>
  </file-formats>

  <agent-requirements>
    <rule priority="critical">ALWAYS create .mjs files, NEVER .ts files</rule>
    <rule priority="critical">ALWAYS import with .mjs extensions</rule>
    <rule priority="high">Use JSDoc for type information</rule>
    <rule priority="medium">Follow existing .mjs patterns in scripts/</rule>
  </agent-requirements>
</development-standards>
```

#### **Results**

**✅ Success Metrics:**
- **Tests:** 39/39 passing with direct .mjs imports (100% success rate)
- **Quality Gates:** All operational (Interface/Performance/Security compliance maintained)
- **Import Issues:** Completely resolved - no build step required
- **Agent Clarity:** XML instructions eliminate file format confusion
- **Consistency:** Uniform .mjs approach across entire codebase

**🚀 MANE Impact:**
- **Foundation Complete:** Agent A ready with .mjs conversion
- **Batch 2 Ready:** Framework Agent can deploy immediately
- **Parallel Development Enabled:** Clear file format expectations for all agents

#### **Risks & Mitigations**

**Risk 1: Runtime Type Safety**
```
Risk: Loss of compile-time type checking
Mitigation: Add runtime validation for critical paths (Issue #24)

Example:
async execute(target) {
  if (!target || typeof target !== 'object') {
    throw new TypeError('Target must be an object');
  }
  // Continue with validation...
}
```

**Risk 2: JSDoc Maintenance**
```
Risk: JSDoc comments may drift from implementation
Mitigation: Add eslint-plugin-jsdoc to quality gates (Issue #24)

Tools: eslint-plugin-jsdoc, @typescript-eslint/parser
```

**Risk 3: Agent Non-Compliance**
```
Risk: Agents might still create .ts files
Mitigation: XML development standards with clear FORBIDDEN rules
```

#### **Lessons Learned**

1. **Context Matters:** For an agent-focused project prioritizing rapid deployment, .mjs provides better value than TypeScript's compile-time safety
2. **Consistency Wins:** Uniform file format approach reduces cognitive overhead
3. **XML Instructions Work:** Clear, visual XML instructions (🚨❌✅) prevent agent confusion
4. **JSDoc Sufficiency:** Well-written JSDoc provides adequate type information for most use cases
5. **Runtime Validation:** Can compensate for lost compile-time checks in critical paths

#### **Follow-up Actions**
- [ ] Implement runtime validation for critical paths (Issue #24)
- [ ] Add JSDoc linting to quality gates (Issue #24)
- [ ] Monitor agent compliance with .mjs requirements
- [ ] Deploy MANE Batch 2 Framework Agent using .mjs foundation

---

## 📝 Decision Template

For future technical decisions, use this template:

```markdown
### **Decision XXX: [Title]**
**Date:** YYYY-MM-DD
**Status:** PROPOSED | IMPLEMENTED | SUPERSEDED
**Commit:** [hash if implemented]

#### **Context**
[Describe the situation and constraints]

#### **Problem Statement**
[Clear problem definition]

#### **Options Considered**
[List alternatives with pros/cons]

#### **Decision**
[What was chosen and why]

#### **Implementation Details**
[How it was implemented]

#### **Results**
[Outcomes and metrics]

#### **Risks & Mitigations**
[Known risks and how they're addressed]

#### **Lessons Learned**
[Key insights for future decisions]
```

---

**🦁 Built with MANE** - *Systematic technical decision documentation for AI-collaborative development*