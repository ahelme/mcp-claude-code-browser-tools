# Chrome Extension Architectural Map

**Purpose**: Comprehensive map of code architecture and logic flow for refactoring planning

**Last Updated**: 2025-10-02
**Status**: Complete architectural analysis
**Next Step**: Create refactoring plan

---

## 1. Extension Structure Overview

### Entry Points

```
Chrome Extension Lifecycle:
1. manifest.json         → Defines extension capabilities
2. devtools.html         → Loads when DevTools opens
3. devtools.js           → Creates "Browser Tools" panel
4. panel.html            → Panel UI loads
5. panel.js              → Main initialization starts
6. background.js         → Service worker (separate context)
```

### Context Separation

**3 Separate JavaScript Contexts:**
1. **DevTools Panel** (panel.js, panel.html)
   - UI interactions, user inputs
   - Feature modules load here

2. **Service Worker** (background.js)
   - Message routing hub
   - Chrome APIs (tabs, downloads, etc.)
   - No DOM access

3. **Content Scripts** (not currently used)
   - Would run in page context
   - Currently disabled

---

## 2. Core Architecture Pattern

### Current State: Monolithic with Feature Modules

```
panel.js (29K) ← MONOLITHIC MAIN FILE
├── UI initialization
├── Event handlers (inline)
├── Settings management
├── Log display
├── HTTP bridge communication
└── Tool orchestration

Feature Modules (loaded via <script> in panel.html):
├── screenshot.js (44K)     → ScreenshotManager class
├── navigation.js (32K)     → NavigationHandler class
├── interactions.js (24K)   → InteractionHandler class
├── websocket.js (9K)       → WebSocketManager class
└── Utilities:
    ├── constants.js        → Configuration constants
    ├── url-validator.js    → URLValidator class
    ├── memory-manager.js   → MemoryManager, LogManager classes
    └── bug-fixes.js        → Thread-safe patches
```

**Problem**: panel.js contains too much mixed logic

---

## 3. Message Flow Architecture

### 3.1 WebSocket Communication (Panel → HTTP Bridge)

```
panel.js initialization
└──> WebSocketManager.connect()
     └──> ws://localhost:3024/extension-ws
          ├── Heartbeat (30s intervals)
          ├── Message queue
          └── Auto-reconnect

Messages:
- Heartbeat: ping/pong
- Initial data: tabId, URL
- Tool requests: screenshot, navigate, etc.
```

**WebSocket Configuration:**
- Reconnect: 5s delay, max 5 attempts
- Heartbeat: 30s ping interval
- Queue: max 100 messages

### 3.2 Chrome Extension Messaging (Panel ↔ Background)

```
Panel (devtools context)
  ├─ chrome.runtime.sendMessage() ──> Background (service worker)
  │  Types:
  │  ├── CAPTURE_SCREENSHOT
  │  ├── COPY_TO_CLIPBOARD
  │  ├── GET_PAGE_INFO
  │  ├── GET_CURRENT_URL
  │  └── Navigation updates
  │
  └─ chrome.runtime.onMessage ←──── Background responses
     Types:
     ├── SCREENSHOT_RESPONSE
     └── Various status updates
```

**Background Message Router:**
```javascript
// background.js message routing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'CAPTURE_SCREENSHOT':
      return handleCaptureScreenshot(message, sendResponse);
    case 'COPY_TO_CLIPBOARD':
      return handleCopyToClipboard(message, sendResponse);
    case 'GET_PAGE_INFO':
      return handleGetPageInfo(message, sendResponse);
    // ... more handlers
  }
});
```

### 3.3 HTTP Bridge Integration

```
MCP Server (stdio)
  └─> HTTP Bridge (port 3024)
      ├── REST endpoints:
      │   ├── POST /copy-file-to-clipboard
      │   ├── POST /show-in-finder
      │   └── GET /health
      └─> WebSocket (ws://localhost:3024/extension-ws)
          └──> Chrome Extension Panel
```

---

## 4. Feature Flow Analysis

### 4.1 Screenshot Capture Flow

**Trigger Sources:**
1. Panel button click
2. WebSocket message from MCP

**Flow Diagram:**
```
USER CLICKS "Take screenshot 📸"
  └─> panel.js: captureScreenshot()
      └─> screenshot.js: ScreenshotManager.captureScreenshot()
          ├── Validate not already capturing
          ├── Generate smart filename
          ├── Choose capture method:
          │   ├── Panel source → captureViaBackground()
          │   └── MCP source → captureViaWebSocket()
          │
          ├── captureViaBackground():
          │   └─> chrome.runtime.sendMessage({
          │        type: 'CAPTURE_SCREENSHOT',
          │        tabId, selector, fullPage, filename
          │       })
          │       └─> background.js: handleCaptureScreenshot()
          │           ├── chrome.tabs.captureVisibleTab()
          │           ├── Save via chrome.downloads.download()
          │           ├── Optional: Copy to clipboard (MCP endpoints)
          │           └─> Response back to panel
          │
          └── Update UI:
              ├── Button state
              ├── Log entry
              └── Preview next filename
```

**Key Components:**
- **ScreenshotManager** (screenshot.js:27-1373)
  - State: `isCapturing`, retry logic, listener pool
  - Methods: `captureScreenshot()`, `generateSmartFilename()`, `updateUI()`
  - Filename format: `Goog_xPqj3jTa2c_25_10_02_0001.png`
    - 4-char page name
    - 10-char session code
    - YY_MM_DD date
    - 4-digit sequence

- **background.js Handler** (background.js:726-857)
  - Chrome tabs API integration
  - Download management
  - Clipboard integration (NEW)

### 4.2 Clipboard Copy Flow (NEW - Issue #64)

```
Screenshot saved to Downloads
  └─> If "Copy to Clipboard" checked:
      └─> chrome.runtime.sendMessage({
           type: 'COPY_TO_CLIPBOARD',
           filePath, filename, downloadId
          })
          └─> background.js: handleCopyToClipboard()
              ├── Try: MCP /copy-file-to-clipboard
              │   ├── macOS: osascript (native clipboard)
              │   ├── Windows: powershell
              │   └── Linux: xclip/wl-copy
              │
              ├── Fallback: MCP /show-in-finder
              │   ├── macOS: open -R
              │   ├── Windows: explorer /select
              │   └── Linux: xdg-open
              │
              └── Final fallback: Show file path in UI
```

**MCP Endpoints** (mcp-server/http-bridge.mjs):
- `/copy-file-to-clipboard` (lines 396-466)
- `/show-in-finder` (lines 468-541)

### 4.3 Navigation Flow

**Trigger**: WebSocket message from MCP

```
MCP Server request
  └─> WebSocket message {type: 'navigate', url: '...'}
      └─> websocket.js: handleMessage()
          └─> navigation.js: NavigationHandler.handleNavigationRequest()
              ├── Validate URL (url-validator.js)
              ├── Normalize URL
              ├── Check not already navigating
              ├── Set thread-safe state (bug-fixes.js)
              │
              └─> navigateToUrl():
                  ├── chrome.tabs.update(tabId, {url})
                  ├── Listener pool: chrome.tabs.onUpdated
                  ├── Wait for status='complete'
                  ├── Timeout handling (10s default)
                  ├── Retry logic (max 2 attempts)
                  └─> Response via WebSocket
```

**Key Components:**
- **NavigationHandler** (navigation.js:21-1003)
  - URL validation with security checks
  - Thread-safe state management
  - Listener pool cleanup (prevents leaks)
  - Retry with exponential backoff

- **URLValidator** (url-validator.js:14-324)
  - Protocol blocking (file:, chrome:, data:, etc.)
  - Hostname validation
  - Suspicious pattern detection

### 4.4 Interaction Flow (Click/Type/Wait)

**Trigger**: WebSocket message from MCP

```
MCP request {action: 'click', selector: '#button'}
  └─> websocket.js: handleMessage()
      └─> interactions.js: InteractionHandler
          ├── handleClick(params)
          ├── handleType(params)
          └── handleWait(params)
              │
              └─> executeInCurrentTab(script):
                  ├── Sanitize script (XSS prevention)
                  ├── Validate selectors
                  ├── CSP-safe execution:
                  │   ├── Try: CSPSafeScriptExecutor (bug-fixes.js)
                  │   ├── Fallback methods (3 levels)
                  │   └── Error if all fail
                  │
                  └─> chrome.scripting.executeScript()
                      └─> Runs in page context
```

**Security Layers:**
1. Script sanitization (interactions.js:100-228)
   - Dangerous pattern detection (eval, innerHTML, etc.)
   - Input escaping (selectors, text)
   - Length validation

2. CSP-Safe Execution (bug-fixes.js:111-332)
   - Multiple fallback methods
   - Method caching for performance
   - Timeout protection

---

## 5. State Management

### 5.1 Global State (window object)

```javascript
// Panel context globals
window.wsManager            // WebSocketManager instance
window.screenshotManager    // ScreenshotManager instance
window.navigationHandler    // NavigationHandler instance
window.interactionHandler   // InteractionHandler instance
window.memoryManager        // MemoryManager instance
window.settings             // Extension settings object
window.addLogEntry          // Log function
```

**Problem**: Too many global variables, no central state

### 5.2 Settings State

**Stored in chrome.storage.local:**
```javascript
{
  browserConnectorSettings: {
    serverHost: 'localhost',
    serverPort: 3024,
    autoConnect: true,
    addToClipboard: false,  // NEW - clipboard feature
    // ... more settings
  }
}
```

**Managed by**: panel.js settings handlers (lines 400+)

### 5.3 Feature Module State

Each module manages its own state:

**ScreenshotManager:**
- `isCapturing`: boolean
- `currentCaptureController`: AbortController
- `screenshotHistory`: Map
- `listenerPool`: Map (cleanup management)
- `sessionCode`: string (10-char random)

**NavigationHandler:**
- `isNavigating`: boolean
- `currentNavigationController`: AbortController
- `listenerPool`: Map
- `threadSafeConfig`: ThreadSafeNavigationConfig

**InteractionHandler:**
- `activeWaits`: Map (element wait operations)
- `scriptExecutor`: CSPSafeScriptExecutor
- `cleanupInterval`: timer

**WebSocketManager:**
- `isConnected`: boolean
- `messageQueue`: Array (max 100)
- `listeners`: Map (event system)
- `reconnectAttempts`: number

---

## 6. Memory Management & Cleanup

### 6.1 Listener Pool Pattern

**Used by**: Screenshot, Navigation, Interaction modules

```javascript
// Pattern used in screenshot.js, navigation.js
class ModuleManager {
  constructor() {
    this.listenerPool = new Map();
    this.listenerIdCounter = 0;
    this.maxConcurrentListeners = 5;
  }

  createManagedListener(listenerFn, description) {
    const id = `listener_${++this.listenerIdCounter}_${Date.now()}`;
    const listenerData = {
      id, function: listenerFn, description,
      createdAt: Date.now(),
      usage: { calls: 0, lastUsed: Date.now() }
    };

    this.listenerPool.set(id, listenerData);
    return {
      id,
      listener: wrappedFn,
      remove: () => this.removeListener(id)
    };
  }

  cleanupStaleListeners() {
    // Remove listeners:
    // - Older than 5min AND inactive >1min
    // - Never called AND >2min old
  }
}
```

**Dynamic Cleanup Intervals:**
- 0 listeners: 2min interval
- 1-2 listeners: 1min interval
- 3-4 listeners: 30s interval
- 5+ listeners: 10s interval

### 6.2 Memory Monitoring

**MemoryManager** (memory-manager.js:14-230):
```javascript
- Baseline establishment
- 30s monitoring interval
- Triggers cleanup at 80% utilization
- Growth tracking (warns at 50% growth)
- Force GC if available (window.gc)
```

**Cleanup Cascade:**
```
Memory warning detected
  └─> memoryManager._triggerGlobalCleanup()
      ├── navigationHandler.cleanupStaleListeners()
      ├── interactionHandler.cleanupOrphanedOperations()
      ├── logManager.cleanup()
      ├── websocketManager.clearQueue()
      └── forceGarbageCollection()
```

### 6.3 Log Management

**LogManager** (memory-manager.js:236-359):
- Max 500 entries
- Cleanup at 400 entries
- DOM batching via DocumentFragment (10+ entries)
- Message truncation (1000 chars)

---

## 7. Error Handling & Resilience

### 7.1 Retry Logic Pattern

**Used by**: Screenshot, Navigation, Interaction

```javascript
async functionWithRetry(params) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(Math.pow(2, attempt) * 1000, 5000);
        await new Promise(r => setTimeout(r, delay));
      }

      const result = await actualOperation(params);
      if (result.success) return result;

      // Check if retryable
      if (!isRetryable(result.error) || attempt === maxRetries) {
        return result;
      }
    } catch (error) {
      if (!isRetryableError(error)) throw error;
    }
  }
}
```

**Retry Criteria:**
- Timeout errors
- Network errors (ERR_*, connection, etc.)
- Temporary failures

**Non-retryable:**
- Extension context invalidated
- Invalid selectors
- Permission denied

### 7.2 Thread Safety (Bug Fixes)

**ThreadSafeNavigationConfig** (bug-fixes.js:16-105):
```javascript
// Prevents race conditions in concurrent access
- setTimeoutSafe(timeout)     // Atomic timeout setting
- setNavigationStateSafe(bool) // Atomic state change
- Prevents timeout changes during navigation
- Config lock mechanism
```

**RaceConditionPreventer** (bug-fixes.js:337-454):
```javascript
// Exclusive operation execution
executeExclusive(operationId, operation, timeout) {
  // Check if already running
  // Set lock
  // Execute with timeout
  // Clean up lock
}
```

### 7.3 CSP-Safe Script Execution

**CSPSafeScriptExecutor** (bug-fixes.js:111-332):
```javascript
Fallback cascade:
1. chrome.tabs.executeScript (deprecated but works)
2. chrome.scripting.executeScript (Manifest V3)
3. Message passing to content script

Features:
- Method caching (performance)
- Automatic fallback
- Retry logic (2 attempts)
- Timeout protection (10s)
```

---

## 8. Configuration & Constants

### 8.1 Constants Module Structure

**constants.js** exports:
```javascript
NAVIGATION_TIMEOUTS: { MIN: 1000, MAX: 60000, DEFAULT: 10000 }
RETRY_CONFIG: { MAX_RETRIES: 2, BASE_DELAY: 1000, ... }
LISTENER_POOL_CONFIG: { MAX_CONCURRENT: 5, MAX_AGE: 300000, ... }
MEMORY_CONFIG: { MAX_LOG_ENTRIES: 500, ... }
DOM_CONFIG: { BATCH_UPDATE_SIZE: 50, ... }
WEBSOCKET_CONFIG: { RECONNECT_DELAY: 5000, ... }
URL_VALIDATION_CONFIG: { ALLOWED_PROTOCOLS, BLOCKED_PROTOCOLS, ... }
PERFORMANCE_THRESHOLDS: { ... }
CLEANUP_CONFIG: { ... }
ERROR_MESSAGES: { NAVIGATION: {...}, URL_VALIDATION: {...}, ... }
SUCCESS_MESSAGES: { ... }
```

**Problem**: Good centralization, but constants.js is 200 lines

### 8.2 Manifest Configuration

**manifest.json:**
```json
{
  "manifest_version": 3,
  "permissions": [
    "activeTab", "debugger", "storage", "tabs",
    "tabCapture", "windows", "scripting",
    "downloads", "clipboardWrite"
  ],
  "host_permissions": ["<all_urls>"],
  "background": { "service_worker": "background.js" },
  "content_security_policy": {
    "extension_pages": "... connect-src ws://localhost:* ..."
  }
}
```

---

## 9. UI Architecture

### 9.1 panel.html Structure

```html
<body>
  <div class="container">
    <!-- Connection Status -->
    <div class="status-section">...</div>

    <!-- Settings -->
    <div class="settings-section">...</div>

    <!-- Actions -->
    <div class="actions-section">
      <button id="screenshot-btn">📸</button>
      <input id="add-to-clipboard-cb" />
    </div>

    <!-- Logs Display -->
    <div id="logs-display"></div>
  </div>

  <!-- Script Loading Order (CRITICAL) -->
  <script src="constants.js"></script>
  <script src="url-validator.js"></script>
  <script src="memory-manager.js"></script>
  <script src="bug-fixes.js"></script>
  <script src="websocket.js"></script>
  <script src="screenshot.js"></script>
  <script src="navigation.js"></script>
  <script src="interactions.js"></script>
  <script src="panel.js"></script>  <!-- LAST -->
</body>
```

**Loading Dependencies:**
1. Constants → All modules depend on this
2. Utilities → url-validator, memory-manager, bug-fixes
3. Core modules → websocket, screenshot, navigation, interactions
4. Main orchestrator → panel.js (uses all above)

### 9.2 panel.js Responsibilities (TOO MANY)

**Current monolithic structure:**
```javascript
panel.js (29K lines) contains:

1. DOM References (lines 1-50)
   - Query all UI elements
   - Store in variables

2. Settings Management (lines 50-200)
   - Load from chrome.storage
   - Save to chrome.storage
   - UI synchronization

3. WebSocket Integration (lines 200-350)
   - Initialize wsManager
   - Connection status handling
   - Message routing

4. UI Event Handlers (lines 350-600)
   - Button clicks
   - Checkbox changes
   - Input field changes
   - Settings toggles

5. Log Display (lines 600-800)
   - addLogEntry() function
   - DOM manipulation
   - Scroll management
   - Log filtering

6. Screenshot Integration (lines 800-900)
   - captureScreenshot() wrapper
   - UI state updates

7. Settings Panel (lines 900-1200)
   - Form handling
   - Validation
   - Persistence

8. Initialization (lines 1200-end)
   - Module setup
   - Event listener attachment
   - Initial state
```

---

## 10. Code Duplication & Patterns

### 10.1 Listener Pool Pattern (Duplicated)

**Appears in 3 files** with identical logic:
- screenshot.js (lines 1096-1326)
- navigation.js (lines 741-979)
- interactions.js (would need similar pattern)

**Common code:**
```javascript
// Same in all 3 files:
createManagedListener(listenerFn, description)
removeListener(listenerId)
cleanupStaleListeners()
startListenerPoolCleanup()
getListenerPoolStatus()
```

**Refactor opportunity**: Extract to shared utility

### 10.2 Retry Logic Pattern (Duplicated)

**Appears in**:
- screenshot.js: captureWithRetry()
- navigation.js: navigateToUrlWithRetry()
- interactions.js: (implicit in wait logic)

**Common pattern**:
```javascript
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  if (attempt > 0) {
    const delay = Math.min(Math.pow(2, attempt) * 1000, 5000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  // Try operation
  // Check if retryable
}
```

**Refactor opportunity**: Generic retry utility function

### 10.3 Thread-Safe State Management (Duplicated)

**Pattern in**:
- screenshot.js: threadSafeConfig for capture state
- navigation.js: threadSafeConfig for navigation state
- bug-fixes.js: ThreadSafeNavigationConfig class

**Refactor opportunity**: Generic thread-safe state wrapper

---

## 11. Problems Identified

### Critical Issues

1. **Monolithic panel.js** (29K lines)
   - Mixed responsibilities
   - Hard to test
   - Hard to maintain

2. **Code Duplication**
   - Listener pool management (3 files)
   - Retry logic (3 files)
   - Thread-safe patterns (3 files)

3. **Global State Pollution**
   - 7+ window.* globals
   - No central state management
   - Difficult to track dependencies

4. **Tight Coupling**
   - panel.js directly manipulates all modules
   - Modules reference window.* globals
   - Hard to isolate features

5. **No Module Boundaries**
   - Everything loaded via script tags
   - No import/export
   - Dependencies implicit in load order

### Performance Issues

1. **Memory Leaks Potential**
   - Listener cleanup depends on manual calls
   - No guarantee of cleanup on errors
   - Multiple cleanup timers running

2. **DOM Performance**
   - Direct DOM manipulation in loops
   - Batch updates only for logs
   - No virtual DOM or efficient updates

3. **Message Queue Buildup**
   - WebSocket queue max 100, then what?
   - No priority system
   - No queue monitoring UI

### Maintainability Issues

1. **Debugging Difficulty**
   - Logs mixed across all modules
   - No structured logging
   - Hard to trace message flow

2. **Testing Impossibility**
   - Global dependencies
   - No dependency injection
   - Side effects everywhere

3. **Documentation Gaps**
   - No JSDoc in panel.js
   - Inconsistent commenting
   - No architecture docs (until now)

---

## 12. Refactoring Opportunities

### High Priority

1. **Extract UI Controller from panel.js**
   - Separate UI manipulation
   - Event handling
   - DOM references

2. **Extract Settings Manager**
   - Centralize chrome.storage
   - Validation logic
   - UI synchronization

3. **Extract Shared Utilities**
   - Listener pool management
   - Retry logic
   - Thread-safe wrappers

4. **Create State Manager**
   - Centralized state
   - Event-driven updates
   - Reduce globals

### Medium Priority

5. **Modularize panel.js**
   - Break into logical files
   - Use ES6 modules
   - Clear dependencies

6. **Improve Error Boundaries**
   - Centralized error handling
   - User-friendly messages
   - Error recovery strategies

7. **Add Logging Framework**
   - Structured logging
   - Log levels
   - Module-specific logs

### Low Priority

8. **Performance Optimization**
   - Virtual scrolling for logs
   - Debounced UI updates
   - Lazy module loading

9. **Type Safety**
   - JSDoc or TypeScript
   - Interface definitions
   - Runtime validation

---

## 13. Dependencies Graph

### Module Dependencies

```
panel.js depends on:
  ├── WebSocketManager (websocket.js)
  ├── ScreenshotManager (screenshot.js)
  ├── NavigationHandler (navigation.js)
  ├── InteractionHandler (interactions.js)
  ├── MemoryManager (memory-manager.js)
  ├── URLValidator (url-validator.js)
  ├── Constants (constants.js)
  └── ThreadSafeConfig (bug-fixes.js)

screenshot.js depends on:
  ├── Constants (RETRY_CONFIG, etc.)
  ├── WebSocketManager (window.wsManager)
  └── LogManager (window.addLogEntry)

navigation.js depends on:
  ├── Constants (NAVIGATION_TIMEOUTS, etc.)
  ├── URLValidator (validateUrl, normalizeUrl)
  ├── ThreadSafeConfig (bug-fixes.js)
  └── LogManager (window.addLogEntry)

interactions.js depends on:
  ├── CSPSafeScriptExecutor (bug-fixes.js)
  └── Constants (cleanup config)

websocket.js depends on:
  ├── Constants (WEBSOCKET_CONFIG)
  └── (minimal dependencies)

utilities depend on:
  └── Constants only
```

### Loading Order Requirements

```
Critical path:
1. constants.js      (no dependencies)
2. url-validator.js  (depends on constants)
3. memory-manager.js (depends on constants)
4. bug-fixes.js      (depends on constants)
5. websocket.js      (depends on constants)
6. screenshot.js     (depends on constants, websocket)
7. navigation.js     (depends on constants, url-validator, bug-fixes)
8. interactions.js   (depends on bug-fixes)
9. panel.js          (depends on ALL above)
```

---

## 14. Next Steps for Refactoring

### Phase 1: Extract Shared Utilities (Low Risk)
1. Create `shared/listener-pool.js`
2. Create `shared/retry-logic.js`
3. Create `shared/thread-safe-state.js`
4. Update screenshot.js, navigation.js to use shared utilities

### Phase 2: Modularize panel.js (Medium Risk)
1. Extract `ui/settings-manager.js`
2. Extract `ui/ui-controller.js`
3. Extract `ui/log-display.js`
4. Keep minimal panel.js as orchestrator

### Phase 3: State Management (High Risk)
1. Create `core/state-manager.js`
2. Migrate from window.* globals
3. Event-driven state updates
4. Module isolation

### Phase 4: Modern Module System (Highest Risk)
1. Convert to ES6 modules
2. Update manifest.json
3. Webpack/bundler setup
4. Tree shaking optimization

---

## Appendix: File Size Analysis

```
Largest files (refactoring priority):
1. screenshot.js    → 44K (1407 lines) - HIGHEST PRIORITY
2. panel.js         → 29K (estimated)  - HIGHEST PRIORITY
3. navigation.js    → 32K (1014 lines) - HIGH PRIORITY
4. interactions.js  → 24K (804 lines)  - MEDIUM PRIORITY
5. memory-manager.js→ 14K (517 lines)  - LOW PRIORITY
6. url-validator.js → 12K (447 lines)  - LOW PRIORITY
7. bug-fixes.js     → 13K (468 lines)  - LOW PRIORITY
8. websocket.js     → 9K  (338 lines)  - LOW PRIORITY
9. constants.js     → 6.6K (200 lines) - LOW PRIORITY
```

**Total Extension Code**: ~185K (excluding utilities)

---

**End of Architectural Map**

*This document provides the foundation for creating a detailed refactoring plan.*
