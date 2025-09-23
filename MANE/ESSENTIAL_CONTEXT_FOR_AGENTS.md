# 🦁 Essential Context for MANE Agents
**Critical Information for All Browser Tools Agents**

---

## 🎯 **PRIMARY MISSION: Build Complete Chrome Extension from Scratch**

**IMPORTANT**: We are building a **brand new Chrome browser extension** from the ground up. We only have the UI design (`panel.html`) - everything else needs to be created!

### 🚀 **The Reality Check**

✅ **What We Actually Have:**
- **UI Design**: `chrome-extension-mvp/panel.html` - Beautiful responsive 4-panel layout (HTML/CSS only)
- **Backend Infrastructure**: MCP server + HTTP bridge working perfectly (port 3024)
- **Reference Implementation**: `chrome-extension-old/` - Shows communication patterns but broken

❌ **What We Need to Build from Scratch:**
- **Complete Chrome Extension**: manifest.json, service worker, content scripts
- **All 9 Browser Tools**: Every single tool needs to be implemented
- **Communication Layer**: WebSocket connection between extension and HTTP bridge
- **Security Systems**: Safe JavaScript execution, content sanitization
- **UI Integration**: Connect beautiful panel.html to working functionality

---

## 📁 **Critical Files & References**

### 🎨 **UI Design (DESIGN ONLY)**
- **`chrome-extension-mvp/panel.html`** - Our responsive UI design (HTML structure)
- **`chrome-extension-mvp/panel.css`** - Modern styling with aqua/magenta theme
- **Status**: 🎨 DESIGN COMPLETE - needs JavaScript functionality

### 🔧 **Reference Implementation (STUDY ONLY)**
- **`chrome-extension-old/`** - Original extension to study for patterns
- **Key files to understand**:
  - `chrome-extension-old/panel.js` - Communication patterns with HTTP bridge
  - `chrome-extension-old/background.js` - Service worker setup
  - `chrome-extension-old/manifest.json` - Extension configuration
  - `chrome-extension-old/content.js` - Content script patterns
- **Status**: ⚠️ REFERENCE ONLY - broken but shows working communication patterns

### 🖥️ **Backend Infrastructure (WORKING)**
- **`mcp-server/server.mjs`** - MCP server (Claude Code integration)
- **`mcp-server/http-bridge.mjs`** - HTTP bridge (port 3024)
- **Communication Flow**: Claude Code → MCP Server → HTTP Bridge → [YOUR EXTENSION]
- **Status**: ✅ WORKING - waiting for Chrome extension to connect

---

## 🚀 **MANE BATCH DEPLOYMENT PROTOCOL**

### **📋 BATCH 1: Foundation Infrastructure**
**Agent**: A (Foundation Architect)
**Status**: ✅ **COMPLETE**
**Duration**: ALREADY DEPLOYED

**Deliverables**:
- ✅ Core infrastructure, MCP server, HTTP bridge established
- ✅ Interface contracts defined, registry system operational
- ✅ Backend communication layer fully functional

**User Testing**: N/A (Backend infrastructure)
**Report**: Foundation complete - ready for Chrome extension development

---

### **🎨 BATCH 2: Chrome Extension Framework**
**Agent**: F (Framework Specialist)
**Priority**: 🔴 **CRITICAL NEXT - BLOCKS ALL OTHER BATCHES**
**Estimated Duration**: 2-3 hours

**Deliverables**:
- `chrome-extension-mvp/manifest.json` - Extension configuration (Manifest V3)
- `chrome-extension-mvp/background.js` - Service worker and extension lifecycle
- `chrome-extension-mvp/panel.js` - Connect beautiful UI to functionality
- `chrome-extension-mvp/websocket.js` - Communication with HTTP bridge (port 3024)
- Basic extension installation and connection framework

**Success Criteria**:
- Extension loads properly in Chrome Developer Tools
- Connects to HTTP bridge on port 3024
- UI panels display correctly with aqua/magenta theme
- Basic communication framework working (heartbeat/ping-pong)
- No console errors during extension loading

**User Testing Instructions**:
```
📋 BATCH 2 USER TESTING CHECKLIST:

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
```

**Batch 2 Report Template**:
```
🎨 BATCH 2 COMPLETION REPORT - Chrome Extension Framework

✅ COMPLETED DELIVERABLES:
- [ ] manifest.json created and valid
- [ ] background.js service worker functional
- [ ] panel.js UI integration working
- [ ] websocket.js communication established
- [ ] Extension loads without errors

📊 USER TESTING RESULTS:
- Extension Installation: [PASS/FAIL + details]
- UI Display: [PASS/FAIL + details]
- Backend Connection: [PASS/FAIL + details]
- Theme/Styling: [PASS/FAIL + details]

🚀 READY FOR BATCH 3: [YES/NO]
📝 NOTES: [Any issues or observations]

🎯 NEXT: Deploy Batch 3 (Core Tools) - Agents G, H, I can now work in parallel
```

---

### **🛠️ BATCH 3: Core Browser Tools**
**Agents**: G (Navigation), H (Screenshot), I (Interaction)
**Depends on**: Batch 2 (Framework) completion
**Estimated Duration**: 3-4 hours (parallel development)

**Deliverables**:
- **Agent G**: `chrome-extension-mvp/navigation.js` - URL navigation handler
- **Agent H**: `chrome-extension-mvp/screenshot.js` - Screenshot capture system
- **Agent I**: `chrome-extension-mvp/interactions.js` - Click, type, wait handlers

**Success Criteria**:
- All 5 core tools working: navigate, screenshot, click, type, wait
- Integration with Configuration Panel UI elements
- Proper error handling and user feedback
- Tools work reliably across different websites

**User Testing Instructions**:
```
📋 BATCH 3 USER TESTING CHECKLIST:

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
```

**Batch 3 Report Template**:
```
🛠️ BATCH 3 COMPLETION REPORT - Core Browser Tools

✅ COMPLETED DELIVERABLES:
- [ ] Navigation tool (browser_navigate) working
- [ ] Screenshot tool (browser_screenshot) working
- [ ] Click tool (browser_click) working
- [ ] Type tool (browser_type) working
- [ ] Wait tool (browser_wait) working

📊 USER TESTING RESULTS:
- Navigation Tests: [PASS/FAIL + details]
- Screenshot Tests: [PASS/FAIL + details]
- Interaction Tests: [PASS/FAIL + details]
- Integration Tests: [PASS/FAIL + details]

🎯 TOOLS STATUS: 5/9 browser tools operational

🚀 READY FOR BATCH 4: [YES/NO]
📝 NOTES: [Performance observations, issues found]

🎯 NEXT: Deploy Batch 4 (Advanced Tools) - Agents B, C, D, E can now work in parallel
```

---

### **⚡ BATCH 4: Advanced Browser Tools**
**Agents**: B (Evaluation), C (Audit), D (Console), E (Content)
**Depends on**: Batch 3 (Core Tools) completion
**Estimated Duration**: 4-5 hours (parallel development)

**Deliverables**:
- **Agent B**: `chrome-extension-mvp/evaluate.js` - Secure JavaScript execution
- **Agent C**: `chrome-extension-mvp/audit.js` - Lighthouse performance auditing
- **Agent D**: `chrome-extension-mvp/console.js` - Console monitoring system
- **Agent E**: `chrome-extension-mvp/content.js` - Content extraction engine

**Success Criteria**:
- All 9 browser tools working perfectly
- Advanced functionality: JS execution, performance audits, console logs, content extraction
- Security features implemented (sandboxing, XSS protection)
- Professional-grade error handling and user feedback

**User Testing Instructions**:
```
📋 BATCH 4 USER TESTING CHECKLIST:

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
```

**Batch 4 Report Template**:
```
⚡ BATCH 4 COMPLETION REPORT - Advanced Browser Tools

✅ COMPLETED DELIVERABLES:
- [ ] Evaluation tool (browser_evaluate) working securely
- [ ] Audit tool (browser_audit) working with JSON output
- [ ] Console tool (browser_get_console) working with filtering
- [ ] Content tool (browser_get_content) working with XSS protection

📊 USER TESTING RESULTS:
- JavaScript Evaluation: [PASS/FAIL + security notes]
- Performance Auditing: [PASS/FAIL + JSON validation]
- Console Monitoring: [PASS/FAIL + privacy compliance]
- Content Extraction: [PASS/FAIL + security validation]
- Complete Integration: [PASS/FAIL + workflow testing]

🎯 TOOLS STATUS: 9/9 browser tools operational

🏆 PROJECT STATUS: COMPLETE
📝 FINAL NOTES: [Performance, security, user experience observations]

🎉 RESULT: World's first complete MANE-built browser tools suite!
```

---

## 🦁 **MANE Agent Universe Assignments**

### 🏗️ **Agent A (Foundation Architect) - COMPLETE**
**Batch**: 1 (Foundation)
**Status**: ✅ **DEPLOYED AND COMPLETE**

### 🎨 **Agent F (Framework Specialist)**
**Batch**: 2 (Framework)
**Mission**: Create complete Chrome extension architecture from scratch
**Priority**: 🔴 **CRITICAL - ALL OTHER AGENTS DEPEND ON THIS**

### 🧭 **Agent G (Navigation Specialist)**
**Batch**: 3 (Core Tools)
**Mission**: Implement browser navigation functionality
**Tool**: `browser_navigate`

### 📸 **Agent H (Screenshot Specialist)**
**Batch**: 3 (Core Tools)
**Mission**: Implement screenshot capture functionality
**Tool**: `browser_screenshot`

### 🖱️ **Agent I (Interaction Specialist)**
**Batch**: 3 (Core Tools)
**Mission**: Implement click, type, and wait functionality
**Tools**: `browser_click`, `browser_type`, `browser_wait`

### 🧪 **Agent B (Evaluation Specialist)**
**Batch**: 4 (Advanced Tools)
**Mission**: Implement secure JavaScript execution
**Tool**: `browser_evaluate`

### 📊 **Agent C (Audit Specialist)**
**Batch**: 4 (Advanced Tools)
**Mission**: Implement Lighthouse performance/accessibility auditing
**Tool**: `browser_audit`

### 🎮 **Agent D (Console Detective)**
**Batch**: 4 (Advanced Tools)
**Mission**: Implement console log monitoring and retrieval
**Tool**: `browser_get_console`

### 📄 **Agent E (Content Extractor)**
**Batch**: 4 (Advanced Tools)
**Mission**: Implement HTML content extraction and DOM analysis
**Tool**: `browser_get_content`

---

## 🎨 **UI Integration Requirements**

### **Panel Structure (ALREADY DESIGNED)**
`chrome-extension-mvp/panel.html` has 4 responsive panels:
- **Configuration Panel** (65% width) - Server settings, connection status
- **Code & Content Panel** (25% width) - Code execution, content extraction
- **Console & Status Panel** (50% width) - Console logs, system status
- **Advanced Panel** (25% width) - Advanced features, audit results

### **Required Integration by Batch**
- **Batch 2 (Framework)**: Basic panel.js framework and WebSocket communication
- **Batch 3 (Core Tools)**: Navigation, screenshot, interaction controls
- **Batch 4 (Advanced Tools)**: Evaluation, audit, console, content integration

---

## 🔒 **Security Requirements**

### **Extension Security (Agent F - Critical)**
- 🛡️ Use Chrome Extension Manifest V3 standards
- 🔐 Implement proper content security policies
- 🚫 No eval() or unsafe JavaScript execution
- 📝 Minimal required permissions

### **JavaScript Execution (Agent B - Critical)**
- ⚠️ **Critical**: Implement security sandboxing
- Use `chrome.scripting.executeScript()` with proper isolation
- Validate and sanitize all JavaScript before execution
- Handle errors gracefully without exposing sensitive data

### **Content Extraction (Agent E)**
- 🛡️ **XSS Protection**: Sanitize extracted content
- Remove dangerous scripts and event handlers
- Safe DOM traversal without executing code

### **Console Monitoring (Agent D)**
- 📊 **Privacy**: Filter sensitive information from logs
- Remove authentication tokens, API keys, personal data
- Safe log categorization and transmission

---

## 🚨 **Critical Guidelines for All Agents**

### ✅ **DO:**
- Study `chrome-extension-old/` for communication patterns ONLY
- Use the existing HTTP bridge communication (port 3024)
- Integrate with our beautiful UI in `chrome-extension-mvp/panel.html`
- Follow Chrome Extension Manifest V3 standards
- Implement proper error handling and user feedback
- Test thoroughly with different websites and scenarios
- **Follow the batch protocol - wait for your batch dependencies**
- **🧪 CRITICAL: TEST IN REAL BROWSER** - Load extension and verify actual functionality
- **🔧 VERIFY ENDPOINTS** - Test actual HTTP bridge communication, not just code logic
- **📱 TEST USER WORKFLOWS** - Click buttons, enter data, verify UI responses
- **🛡️ VALIDATE SECURITY** - Ensure CSP policies, permissions, and sandboxing work
- **📊 PROVIDE DETAILED TESTING RESULTS** - Report what works, what fails, with specific steps

### ❌ **DON'T:**
- Copy broken functionality from the old extension
- Try to fix the old broken npm package
- Ignore batch dependencies (F→G,H,I→B,C,D,E)
- Create complex dependencies between tool agents
- Assume undocumented behavior - verify everything
- Skip security requirements (especially JavaScript execution)

### 🤔 **WHEN UNSURE:**
**ALWAYS come back to the user for clarification rather than making assumptions!**

If you encounter:
- Unclear requirements or specifications
- Complex security decisions
- Questions about batch dependencies
- UI/UX integration questions
- Communication protocol questions
- Chrome Extension development questions

**→ STOP and ask the user for guidance before proceeding!**

---

## 🧪 **MANDATORY REAL-WORLD TESTING PROTOCOL**

### 🚨 **CRITICAL: Every Agent Must Test in Real Browser**

**Based on Batch 2 learning: Agents must verify their work actually functions in Chrome!**

### 📋 **Testing Methodology for All Agents:**

#### **1. 🔧 Setup Verification**
```bash
# Ensure HTTP bridge is running
./mcp-server/start.sh
# Should see: "HTTP Bridge Server running on port 3024"

# Check extension files exist
ls chrome-extension-mvp/
# Should see: manifest.json, background.js, panel.js, etc.
```

#### **1.5. 🔄 Extension Development Workflow**
**For most changes (JS, CSS, HTML)**:
- Go to `chrome://extensions/`
- Click 🔄 reload button next to your extension
- Refresh DevTools (close/reopen Browser Tools tab)

**For manifest.json changes or when stuck**:
- Click "Remove" on extension
- Click "Load unpacked" → Select `chrome-extension-mvp/` folder
- Reopen DevTools Browser Tools tab

**💡 Pro tip**: Keep `chrome://extensions/` in pinned tab for quick access!

#### **2. 📱 Extension Installation Testing**
- Open Chrome → `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked" → Select `chrome-extension-mvp/` folder
- **VERIFY**: Extension appears in list without errors
- **CHECK**: No red error messages in extension details

#### **3. 🎯 Browser Tools Panel Testing**
- Navigate to any website (e.g., https://example.com)
- Open Developer Tools (F12)
- **VERIFY**: "Browser Tools" tab appears
- Click on "Browser Tools" tab
- **VERIFY**: Panel loads with 4-panel responsive layout
- **VERIFY**: Aqua/magenta theme displays correctly

#### **4. 🔌 Connection Testing**
- **VERIFY**: Extension auto-detects port 3024
- **VERIFY**: Green "Connected" status indicator appears
- **VERIFY**: No console errors in DevTools Console tab
- **TEST**: Manual disconnect/reconnect functionality

#### **5. 🛠️ Tool-Specific Testing**
**Each agent must test their specific tool:**
- **Agent G**: Test navigation to different URLs
- **Agent H**: Test screenshot capture (full page + elements)
- **Agent I**: Test click, type, wait operations
- **Agent B**: Test JavaScript evaluation with simple scripts
- **Agent C**: Test Lighthouse audit execution
- **Agent D**: Test console log monitoring
- **Agent E**: Test content extraction from various pages

#### **6. 📊 Error Testing**
- Test with invalid inputs
- Test with network disconnection
- Test with malformed data
- **VERIFY**: Graceful error handling and user feedback

### 🎯 **Reporting Template for All Agents:**

```
## 🧪 REAL-WORLD TESTING RESULTS

### ✅ SETUP VERIFICATION:
- [ ] HTTP bridge running on port 3024
- [ ] Extension files properly created
- [ ] No file system errors

### ✅ EXTENSION INSTALLATION:
- [ ] Extension loads without errors
- [ ] Browser Tools tab appears
- [ ] UI renders correctly
- [ ] Theme applied properly

### ✅ CONNECTION TESTING:
- [ ] Auto-connects to port 3024
- [ ] Green status indicator appears
- [ ] No console errors
- [ ] Manual reconnection works

### ✅ TOOL FUNCTIONALITY:
- [ ] [Tool-specific tests pass]
- [ ] Error handling works
- [ ] User feedback clear
- [ ] Performance acceptable

### ❌ ISSUES FOUND:
- Issue 1: [Description + steps to reproduce]
- Issue 2: [Description + steps to reproduce]

### 🔧 FIXES APPLIED:
- Fix 1: [What was changed + verification]
- Fix 2: [What was changed + verification]

### 🎯 FINAL STATUS: [WORKING/NEEDS_FIXES]
```

---

## 🎯 **Success Criteria**

- **Complete Chrome Extension**: Installable, working, beautiful UI
- **All 9 Browser Tools**: Every tool implemented and tested
- **Secure Architecture**: Safe JavaScript execution, content protection
- **Professional Quality**: Error handling, user feedback, performance
- **Zero External Dependencies**: Self-contained solution
- **Perfect Claude Code Integration**: Seamless MCP tool usage

---

## 🦁 **Ready for MANE Batch Deployment!**

**Follow the batch protocol for systematic, tested, reliable deployment:**

1. **Batch 2 (Framework)**: Agent F creates the foundation for all other agents
2. **Batch 3 (Core Tools)**: Agents G, H, I work in parallel to rebuild working tools
3. **Batch 4 (Advanced Tools)**: Agents B, C, D, E work in parallel for advanced functionality

**Remember: Each batch includes user testing and reporting before proceeding to the next!**

**When in doubt, ask the user! Perfect clarity leads to perfect execution.** 🦁✨

---

*Created for MANE parallel development with systematic batch deployment! 🌟*