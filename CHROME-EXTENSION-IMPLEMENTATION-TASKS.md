# Chrome Extension Implementation Tasks

**Project**: Browser Tools for Claude Code - MVP Chrome Extension
**Created**: September 17, 2025
**Status**: UI Complete ✅ - JavaScript Implementation Required
**Objective**: Transform the responsive UI into a fully functional Chrome extension

---

## 🎯 PHASE 1: Core JavaScript Infrastructure (Days 1-3)

### 1.1 Service Worker Foundation
**Priority**: Critical
**Estimated Time**: 4-6 hours

**Tasks**:
- [ ] Create `chrome-extension-mvp/service-worker.js` as main background script
- [ ] Implement HTTP server on configurable port (default: 3024)
- [ ] Add request routing for 4 missing tool endpoints:
  - `/tools/browser_evaluate` - JavaScript execution
  - `/tools/browser_get_content` - HTML/text content retrieval
  - `/tools/browser_audit` - Lighthouse audits
  - `/tools/browser_get_console` - Console log capture
- [ ] Implement Chrome DevTools Protocol integration
- [ ] Add WebSocket communication for real-time updates

**Dependencies**: None
**Success Criteria**: Service worker starts HTTP server and responds to health checks

### 1.2 DevTools Protocol Manager
**Priority**: Critical
**Estimated Time**: 3-4 hours

**Tasks**:
- [ ] Create debugger attachment/detachment logic
- [ ] Implement tab management for current active tab
- [ ] Add error handling for debugger connection failures
- [ ] Create base classes for tool execution
- [ ] Implement timeout handling for all operations

**Dependencies**: Service worker foundation
**Success Criteria**: DevTools Protocol successfully attaches to active tab

### 1.3 Manifest V3 Configuration
**Priority**: Critical
**Estimated Time**: 1-2 hours

**Tasks**:
- [ ] Create `chrome-extension-mvp/manifest.json` with Manifest V3 structure
- [ ] Configure required permissions: `activeTab`, `debugger`, `storage`, `tabs`
- [ ] Set up proper service worker registration
- [ ] Configure devtools page integration
- [ ] Add host permissions for `<all_urls>`

**Dependencies**: None
**Success Criteria**: Extension loads in Chrome without errors

---

## 🔧 PHASE 2: Tool Implementation (Days 4-8)

### 2.1 JavaScript Evaluation Tool
**Priority**: High
**Estimated Time**: 4-5 hours

**Tasks**:
- [ ] Implement `handleEvaluate()` function in service worker
- [ ] Use `chrome.debugger.sendCommand` with `Runtime.evaluate`
- [ ] Add parameter validation for script input
- [ ] Implement error handling for evaluation failures
- [ ] Add timeout configuration (default: 30 seconds)
- [ ] Support both return by value and object preview modes

**API Specification**:
```javascript
// POST /tools/browser_evaluate
{
  "script": "document.title",
  "returnByValue": true,
  "timeout": 30000
}
// Response: { "success": true, "result": "Page Title" }
```

**Dependencies**: DevTools Protocol Manager
**Success Criteria**: Can execute `document.title` and return page title

### 2.2 Content Retrieval Tool
**Priority**: High
**Estimated Time**: 4-5 hours

**Tasks**:
- [ ] Implement `handleGetContent()` function
- [ ] Support full page HTML retrieval
- [ ] Support text-only content extraction
- [ ] Support CSS selector-based content retrieval
- [ ] Add format parameter: `html` vs `text`
- [ ] Implement efficient DOM querying via DevTools Protocol

**API Specification**:
```javascript
// POST /tools/browser_get_content
{
  "selector": "#main-content", // optional
  "format": "html" // or "text"
}
// Response: { "content": "<div>...</div>" }
```

**Dependencies**: DevTools Protocol Manager
**Success Criteria**: Can retrieve full page HTML and specific element content

### 2.3 Console Log Capture Tool
**Priority**: High
**Estimated Time**: 3-4 hours

**Tasks**:
- [ ] Implement `handleGetConsole()` function
- [ ] Create console log buffer with configurable size (default: 1000 entries)
- [ ] Listen to `Runtime.consoleAPICalled` events via DevTools Protocol
- [ ] Support log level filtering: `all`, `error`, `warn`, `info`, `log`
- [ ] Add timestamp to each log entry
- [ ] Implement log buffer clearing functionality

**API Specification**:
```javascript
// POST /tools/browser_get_console
{
  "level": "all", // or "error", "warn", "info"
  "limit": 50
}
// Response: { "logs": [{"level": "info", "message": "...", "timestamp": 1694...}] }
```

**Dependencies**: DevTools Protocol Manager
**Success Criteria**: Can capture and retrieve console logs with proper filtering

### 2.4 Lighthouse Audit Tool
**Priority**: Medium
**Estimated Time**: 6-8 hours

**Tasks**:
- [ ] Research Chrome extension Lighthouse integration options
- [ ] Implement `handleAudit()` function
- [ ] Support audit categories: `performance`, `accessibility`, `seo`, `best-practices`
- [ ] Return structured JSON results (not HTML reports)
- [ ] Add proper error handling for audit failures
- [ ] Consider external Lighthouse library integration

**API Specification**:
```javascript
// POST /tools/browser_audit
{
  "categories": ["performance", "accessibility"]
}
// Response: { "lhr": { /* Lighthouse JSON result */ } }
```

**Dependencies**: DevTools Protocol Manager
**Success Criteria**: Can run basic performance audit and return JSON results

---

## 🎨 PHASE 3: UI Integration (Days 9-11)

### 3.1 Panel JavaScript Logic
**Priority**: High
**Estimated Time**: 4-5 hours

**Tasks**:
- [ ] Create `chrome-extension-mvp/panel.js` to match existing `panel.html`
- [ ] Implement connection status management
- [ ] Add real-time connection indicator updates
- [ ] Implement all button click handlers
- [ ] Add form validation for inputs
- [ ] Create settings persistence using `chrome.storage`

**UI Components to Implement**:
- Server host/port configuration
- Connect button functionality
- Port discovery (scan 3000-4000)
- Screenshot path configuration
- Auto-paste checkbox
- JavaScript evaluation input/button
- Content format dropdown
- Audit button
- Console log level filtering
- Verbose mode toggle

**Dependencies**: Service worker with HTTP endpoints
**Success Criteria**: All UI controls functional and connected to backend

### 3.2 Real-Time Status Updates
**Priority**: Medium
**Estimated Time**: 2-3 hours

**Tasks**:
- [ ] Implement WebSocket connection for real-time updates
- [ ] Add connection status indicators (connected/disconnected/loading)
- [ ] Update console log display in real-time
- [ ] Add visual feedback for tool execution (loading states)
- [ ] Implement error notification system

**Dependencies**: Panel JavaScript logic
**Success Criteria**: UI shows real-time connection status and log updates

### 3.3 Settings Management
**Priority**: Medium
**Estimated Time**: 2-3 hours

**Tasks**:
- [ ] Implement settings persistence using `chrome.storage.local`
- [ ] Save/restore server host and port settings
- [ ] Persist screenshot directory path
- [ ] Remember auto-paste preference
- [ ] Store advanced settings (headers, limits)
- [ ] Add settings validation and defaults

**Dependencies**: Panel JavaScript logic
**Success Criteria**: Settings persist across browser restarts

---

## 🧪 PHASE 4: Testing & Integration (Days 12-14)

### 4.1 Individual Tool Testing
**Priority**: Critical
**Estimated Time**: 4-5 hours

**Tasks**:
- [ ] Test `browser_evaluate` with various JavaScript expressions
- [ ] Test `browser_get_content` with different selectors and formats
- [ ] Test `browser_audit` with different categories
- [ ] Test `browser_get_console` with log filtering
- [ ] Verify error handling for each tool
- [ ] Test timeout scenarios

**Test Cases**:
```javascript
// browser_evaluate tests
["document.title", "2 + 2", "document.querySelector('#nonexistent')", "throw new Error('test')"]

// browser_get_content tests
[{selector: null, format: "html"}, {selector: "body", format: "text"}, {selector: "#invalid", format: "html"}]

// browser_audit tests
[["performance"], ["accessibility", "seo"], ["invalid-category"]]

// browser_get_console tests
[{level: "all"}, {level: "error"}, {level: "warn", limit: 10}]
```

**Dependencies**: All tool implementations
**Success Criteria**: All 4 tools pass comprehensive test suite

### 4.2 MCP Server Compatibility Testing
**Priority**: Critical
**Estimated Time**: 3-4 hours

**Tasks**:
- [ ] Test integration with existing MCP server on port 3024
- [ ] Verify Claude Code can access all 9 browser tools (5 existing + 4 new)
- [ ] Test multi-project setup with different ports
- [ ] Verify no conflicts with existing tools
- [ ] Test parameter validation matches MCP server expectations

**Dependencies**: Individual tool testing complete
**Success Criteria**: All 9 tools working via Claude Code MCP integration

### 4.3 Error Handling & Edge Cases
**Priority**: High
**Estimated Time**: 3-4 hours

**Tasks**:
- [ ] Test behavior when DevTools Protocol fails to attach
- [ ] Test extension behavior when tab is closed during operation
- [ ] Test timeout handling for long-running operations
- [ ] Test memory management with large console logs
- [ ] Test port conflicts and automatic port discovery
- [ ] Add graceful degradation for missing permissions

**Dependencies**: MCP compatibility testing
**Success Criteria**: Extension handles all error conditions gracefully

---

## 🚀 PHASE 5: Advanced Features & Polish (Days 15-18)

### 5.1 Area Screenshot Functionality
**Priority**: Medium
**Estimated Time**: 4-6 hours

**Tasks**:
- [ ] Implement CSS selector-based area screenshots
- [ ] Add coordinate-based area capture (x, y, width, height)
- [ ] Extend UI with area screenshot controls
- [ ] Add element-based screenshot via DOM node selection
- [ ] Implement screenshot preview/crop functionality

**Implementation Methods**:

#### Method 1: CSS Selector-Based Screenshots
```javascript
async function captureElementScreenshot(selector) {
  // Find element using DevTools Protocol
  const document = await chrome.debugger.sendCommand(tabId, 'DOM.getDocument');
  const node = await chrome.debugger.sendCommand(tabId, 'DOM.querySelector', {
    nodeId: document.root.nodeId,
    selector: selector
  });

  // Get element bounding box
  const boxModel = await chrome.debugger.sendCommand(tabId, 'DOM.getBoxModel', {
    nodeId: node.nodeId
  });

  // Capture screenshot with clip
  return await chrome.debugger.sendCommand(tabId, 'Page.captureScreenshot', {
    clip: {
      x: boxModel.model.content[0],
      y: boxModel.model.content[1],
      width: boxModel.model.content[4] - boxModel.model.content[0],
      height: boxModel.model.content[5] - boxModel.model.content[1],
      scale: 1
    },
    format: 'png'
  });
}
```

#### Method 2: Coordinate-Based Screenshots
```javascript
async function captureAreaScreenshot(x, y, width, height) {
  return await chrome.debugger.sendCommand(tabId, 'Page.captureScreenshot', {
    clip: { x, y, width, height, scale: 1 },
    format: 'png'
  });
}
```

#### UI Enhancements
- [ ] Add "Area Screenshot" button alongside full page screenshot
- [ ] Extend selector input to support area capture mode
- [ ] Add coordinate input fields (x, y, width, height)
- [ ] Visual feedback for selected areas
- [ ] Different filename format for area screenshots: `page-title_area_2025-09-17_0001.png`

**API Specification**:
```javascript
// POST /tools/browser_screenshot_area
{
  "selector": "#main-content",  // CSS selector method
  "coordinates": {              // Coordinate method (alternative)
    "x": 100, "y": 200,
    "width": 800, "height": 600
  },
  "filename": "custom-name"     // Optional custom filename
}
```

**Dependencies**: Basic screenshot functionality working
**Success Criteria**: Can capture specific page areas via selector or coordinates

### 5.2 Performance Optimization
**Priority**: Medium
**Estimated Time**: 2-3 hours

**Tasks**:
- [ ] Optimize console log buffer memory usage
- [ ] Implement request queuing to prevent concurrent DevTools operations
- [ ] Add request deduplication for rapid-fire calls
- [ ] Optimize UI rendering performance
- [ ] Minimize extension resource usage

**Dependencies**: All core functionality complete
**Success Criteria**: Extension runs smoothly under heavy usage

### 5.2 User Experience Enhancements
**Priority**: Medium
**Estimated Time**: 2-3 hours

**Tasks**:
- [ ] Add loading animations for long operations
- [ ] Implement better error messages with actionable suggestions
- [ ] Add keyboard shortcuts for common actions
- [ ] Improve visual feedback for button states
- [ ] Add tooltips for advanced settings

**Dependencies**: Performance optimization
**Success Criteria**: Professional, polished user experience

---

## 📸 SCREENSHOT NAMING SYSTEM

### Smart Filename Generation
**Format**: `page-title_YYYY-MM-DD_####.png`
**Example**: `page-title_2025-09-17_0001.png`

### Implementation Details

#### JavaScript Function for Dynamic Filename Generation
```javascript
function generateScreenshotName() {
  const title = document.title
    .replace(/[^a-zA-Z0-9]/g, '-')  // Replace special chars with dashes
    .replace(/-+/g, '-')            // Collapse multiple dashes into one
    .replace(/^-|-$/g, '')          // Remove leading/trailing dashes
    .substring(0, 30);              // Limit title length to 30 chars

  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const counter = getNextCounter(); // 4-digit counter: 0001-9999

  return `${title}_${date}_${counter}.png`;
}

function getNextCounter() {
  // Check existing screenshots in directory
  // Find highest number for today's date
  // Return next sequential number (0001-9999)
  // Reset to 0001 each day
}

function updateScreenshotPreview() {
  const previewElement = document.getElementById('screenshot-name');
  const nextFilename = generateScreenshotName();
  previewElement.textContent = `Next: ${nextFilename}`;
}
```

#### UI Integration
- **Preview Element**: `#screenshot-name` - Shows next filename before capture
- **Real-time Updates**: Preview updates when page title changes
- **Daily Reset**: Counter resets to 0001 each day
- **Conflict Handling**: Auto-increment if filename exists

#### Filename Components
1. **Page Title**:
   - Source: `document.title`
   - Sanitization: Replace special characters with dashes
   - Length limit: 30 characters maximum

2. **Date**:
   - Format: `YYYY-MM-DD` (ISO date format)
   - Updates automatically each day

3. **Sequential Counter**:
   - Format: 4-digit padded numbers (`0001`, `0002`, etc.)
   - Range: `0001` to `9999` (up to 9,999 screenshots per day)
   - Resets to `0001` each new day

4. **File Extension**:
   - Always `.png` for consistency and quality

#### Example Filenames
```
Google_Search_2025-09-17_0001.png
GitHub_Repository_2025-09-17_0002.png
Stack_Overflow_Question_2025-09-17_0003.png
localhost_3000_Development_2025-09-17_0004.png
```

#### Storage Location
- **Default**: Browser downloads folder
- **Custom**: User-configurable via screenshot path setting
- **Organization**: Automatically organized by date if desired

#### Error Handling
- **Invalid Characters**: Automatically sanitized
- **Long Titles**: Truncated to 30 characters
- **Duplicate Names**: Auto-increment counter
- **Permission Issues**: Fallback to downloads folder

### 5.3 Documentation & Deployment
**Priority**: Medium
**Estimated Time**: 2-3 hours

**Tasks**:
- [ ] Update README with installation instructions
- [ ] Create user guide for extension setup
- [ ] Document API endpoints and parameters
- [ ] Create troubleshooting guide
- [ ] Prepare Chrome Web Store listing materials (if publishing)

**Dependencies**: All functionality complete
**Success Criteria**: Complete documentation for users and developers

---

## 📋 IMPLEMENTATION CHECKLIST

### Pre-Implementation Setup
- [ ] Copy working files from `chrome-extension-old/` as reference
- [ ] Set up development environment with Chrome extension developer mode
- [ ] Configure debugging tools and logging

### Critical Path Dependencies
1. **Service Worker** → **DevTools Protocol** → **Tool Implementations**
2. **Tool Implementations** → **UI Integration** → **Testing**
3. **Testing** → **MCP Integration** → **Polish**

### Quality Gates
- [ ] **Phase 1 Complete**: Extension loads and service worker starts
- [ ] **Phase 2 Complete**: All 4 missing tools functional via HTTP API
- [ ] **Phase 3 Complete**: UI fully connected to backend functionality
- [ ] **Phase 4 Complete**: All 9 tools working via Claude Code MCP
- [ ] **Phase 5 Complete**: Production-ready extension with documentation

---

## 🎯 SUCCESS METRICS

### Functional Requirements
- ✅ **9/9 Browser Tools Working**: All tools accessible via `mcp__browser-tools__*`
- ✅ **UI/Backend Integration**: All UI controls functional and connected
- ✅ **Error Handling**: Graceful handling of all failure scenarios
- ✅ **Performance**: Operations complete within 30-second timeouts
- ✅ **Cross-Platform**: Works on macOS, Windows, Linux Chrome installations

### Technical Requirements
- ✅ **Manifest V3 Compliance**: Uses modern Chrome extension architecture
- ✅ **MCP Server Compatibility**: No changes required to existing server
- ✅ **Port Configuration**: Supports multiple projects via environment variables
- ✅ **Memory Efficiency**: Minimal resource usage and proper cleanup
- ✅ **Security**: Proper permission usage and secure communication

### User Experience Requirements
- ✅ **Intuitive Interface**: No technical knowledge required for basic usage
- ✅ **Real-Time Feedback**: Immediate visual feedback for all operations
- ✅ **Persistent Settings**: Configuration survives browser restarts
- ✅ **Error Recovery**: Clear error messages with suggested solutions
- ✅ **Professional Polish**: Production-quality fit and finish

---

## 📅 ESTIMATED TIMELINE

**Total Estimated Time**: 18 days (90-100 hours)

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1: Infrastructure | 3 days | Service worker, DevTools integration, Manifest V3 |
| Phase 2: Tool Implementation | 5 days | 4 missing tools fully functional |
| Phase 3: UI Integration | 3 days | Complete UI/backend integration |
| Phase 4: Testing | 3 days | Comprehensive testing and MCP compatibility |
| Phase 5: Advanced Features | 4 days | Area screenshots, performance optimization, documentation |

**Risk Factors**:
- **Lighthouse Integration Complexity**: May require additional research/time
- **DevTools Protocol Edge Cases**: Unexpected browser behaviors
- **MCP Server Compatibility**: Potential parameter format mismatches

**Mitigation Strategies**:
- Start with simplest tool implementations first
- Maintain backward compatibility with existing MCP server
- Implement comprehensive error logging for debugging
- Create fallback implementations for complex features

---

## 🎉 FINAL DELIVERABLE

**Complete Chrome Extension MVP** with:
- ✅ **Modern responsive UI** (already complete)
- ✅ **Full JavaScript functionality** (to be implemented)
- ✅ **All 9 browser tools working** via Claude Code MCP integration
- ✅ **Professional user experience** with proper error handling
- ✅ **Comprehensive documentation** for setup and usage

**Ready for production use with Claude Code browser automation workflows!** 🚀