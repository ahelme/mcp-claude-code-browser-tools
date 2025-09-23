# 🔗 MANE + Existing MCP Server Integration

**CRITICAL CONTEXT: MANE agents must integrate with our existing working MCP server!**

## 🎯 **Current MCP Server Status**

### ✅ **WORKING MCP Tools (5/9)** - Keep these!
1. **browser_navigate** - Successfully navigates to URLs
2. **browser_screenshot** - Captures screenshots perfectly
3. **browser_click** - Clicks elements successfully
4. **browser_type** - Types text into input fields
5. **browser_wait** - Waits for elements to appear

### ❌ **BROKEN Tools (4/9)** - MANE agents fix these!
6. **browser_evaluate** - Timeout error (Agent B fixes)
7. **browser_get_content** - Request timeout (Agent C fixes)
8. **browser_audit** - Returns HTML not JSON (Agent D fixes)
9. **browser_get_console** - Request timeout (Agent E fixes)

## 🏗️ **MCP Server Architecture (KEEP)**

### **Working Components:**
- `mcp-server/server.mjs` - MCP server ✅
- `mcp-server/http-bridge.mjs` - HTTP bridge (port 3024) ✅
- **5 working tools** via old Chrome extension ✅

### **Integration Point:**
- **Old Chrome Extension** (`chrome-extension-old/`) ✅ works for 5 tools
- **New MANE Extension** (`chrome-extension-mvp/`) 🚧 must work for ALL 9 tools

## 🤖 **MANE Agent Integration Strategy**

### **Agent A (Core Infrastructure)**
**CRITICAL**: Must integrate with existing MCP server endpoints!

```javascript
// core/service-worker.js - Agent A creates this
// Must handle SAME endpoints as existing MCP server expects:
const ENDPOINTS = {
  '/tools/browser_navigate': 'Already working - don\'t break!',
  '/tools/browser_screenshot': 'Already working - don\'t break!',
  '/tools/browser_click': 'Already working - don\'t break!',
  '/tools/browser_type': 'Already working - don\'t break!',
  '/tools/browser_wait': 'Already working - don\'t break!',
  '/tools/browser_evaluate': 'BROKEN - Agent B fixes',
  '/tools/browser_get_content': 'BROKEN - Agent C fixes',
  '/tools/browser_audit': 'BROKEN - Agent D fixes',
  '/tools/browser_get_console': 'BROKEN - Agent E fixes'
};
```

### **Agents B-E (Fix Broken Tools)**
**MISSION**: Make 4 broken tools work with SAME MCP server!

- **Agent B**: Fix `browser_evaluate` timeout → working JS execution
- **Agent C**: Fix `browser_get_content` timeout → working content retrieval
- **Agent D**: Fix `browser_audit` HTML→JSON → working Lighthouse
- **Agent E**: Fix `browser_get_console` timeout → working console logs

### **No Server Changes Needed!**
✅ **MCP server** (`mcp-claude-code-browser-tools.mjs`) stays same
✅ **HTTP bridge** (`mcp-http-bridge.mjs`) stays same
✅ **Port 3024** stays same
✅ **Tool endpoints** stay same

## 🎯 **Success Criteria Updated**

### **MANE Extension MUST:**
1. **Keep 5 working tools working** (don't break existing!)
2. **Fix 4 broken tools** (complete the missing functionality)
3. **Same MCP integration** (port 3024, same endpoints)
4. **Replace old extension** (chrome-extension-old → chrome-extension-mvp)

### **Testing Strategy:**
```bash
# Test with existing MCP server
node mcp-server/server.mjs

# HTTP bridge on port 3024
node mcp-server/http-bridge.mjs

# New MANE extension connects to SAME endpoints
# Should get ALL 9 tools working!
```

## 📋 **Agent Instructions Updated**

### **Agent A - Core Infrastructure**
- **Build HTTP server** that handles SAME endpoints as old extension
- **Don't change MCP server** - just make extension work better
- **Port 3024 compatibility** - must work with existing bridge

### **Agents B-E - Tool Fixers**
- **Don't create new tools** - fix existing broken ones
- **Same endpoint names** - `/tools/browser_evaluate` etc.
- **Same parameter format** - keep MCP server compatibility

### **Agents F-J - UI/Features**
- **Connect to fixed tools** - use same MCP endpoints
- **Enhanced UI** - but same underlying functionality

## 🚀 **The Goal**

**Transform**: 5/9 tools working (old extension)
**Into**: 9/9 tools working (MANE extension)
**With**: Same MCP server, same endpoints, BETTER implementation!

---

**MANE builds ON TOP of our existing success!** 🦁