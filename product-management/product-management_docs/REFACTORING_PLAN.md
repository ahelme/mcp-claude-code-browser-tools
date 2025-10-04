# Chrome Extension Refactoring Plan

**Purpose**: Systematic plan to refactor panel.js and screenshot.js into modular, maintainable code

**Based on**: [ARCHITECTURAL_MAP.md](./ARCHITECTURAL_MAP.md)
**Date**: 2025-10-02
**Approach**: Incremental, test-after-each-step, minimal risk

---

## Strategy Overview

### Core Principles

1. **Build modular pieces one by one** (as requested by user)
2. **Leave basics in panel.js** - it remains the orchestrator
3. **Keep contracts in mind** - follow MANE/AgileAI patterns where applicable
4. **Test after each module** - verify functionality before proceeding
5. **Maintain backward compatibility** - no breaking changes

### Risk Mitigation

- Work in a separate branch
- Keep backups of original files
- Test each module independently
- Integrate one module at a time
- Roll back if issues detected

---

## Phase 1: Extract Shared Utilities (LOW RISK)

**Goal**: Eliminate code duplication across screenshot.js, navigation.js, interactions.js

### 1.1 Create Listener Pool Utility

**File**: `chrome-extension/shared/listener-pool.js`

**Extract from**:
- screenshot.js (lines 1096-1326)
- navigation.js (lines 741-979)

**Interface**:
```javascript
export class ListenerPoolManager {
  constructor(config = {}) {
    this.maxConcurrentListeners = config.max || 5;
    this.listenerPool = new Map();
    this.listenerIdCounter = 0;
    // ... setup
  }

  createManagedListener(listenerFn, description) {
    // Returns: { id, listener, remove, isActive }
  }

  removeListener(listenerId) {
    // Returns: boolean (success)
  }

  cleanupStaleListeners() {
    // Returns: number (cleaned count)
  }

  startListenerPoolCleanup() {
    // Dynamic interval management
  }

  getListenerPoolStatus() {
    // Returns: { totalListeners, utilizationPercent, listeners[] }
  }

  destroy() {
    // Cleanup all resources
  }
}
```

**Usage in screenshot.js** (after refactor):
```javascript
import { ListenerPoolManager } from './shared/listener-pool.js';

class ScreenshotManager {
  constructor() {
    this.listenerPool = new ListenerPoolManager({
      max: 5,
      maxAge: 300000,
      minInactiveTime: 60000
    });
  }

  captureViaWebSocket(params) {
    const managedListener = this.listenerPool.createManagedListener(
      (message) => { /* handler */ },
      'screenshot-websocket'
    );

    window.wsManager.on('message', managedListener.listener);
    // ... cleanup with managedListener.remove()
  }
}
```

**Testing**:
1. Create listener-pool.js with tests
2. Update screenshot.js to use it
3. Test screenshot capture (panel button + WebSocket)
4. Update navigation.js to use it
5. Test navigation (URL input + MCP)
6. Verify no memory leaks (check listener cleanup)

---

### 1.2 Create Retry Logic Utility

**File**: `chrome-extension/shared/retry-logic.js`

**Extract from**:
- screenshot.js: captureWithRetry()
- navigation.js: navigateToUrlWithRetry()

**Interface**:
```javascript
export class RetryExecutor {
  constructor(config = {}) {
    this.maxRetries = config.maxRetries || 2;
    this.baseDelay = config.baseDelay || 1000;
    this.maxDelay = config.maxDelay || 5000;
    this.retryablePatterns = config.retryablePatterns || [
      'timeout', 'network', 'connection', 'ERR_'
    ];
  }

  async executeWithRetry(operation, errorChecker) {
    // operation: async function
    // errorChecker: (error) => boolean (is retryable?)
    // Returns: result or throws
  }

  isRetryableError(error) {
    // Check against patterns
  }
}
```

**Usage**:
```javascript
import { RetryExecutor } from './shared/retry-logic.js';

class ScreenshotManager {
  constructor() {
    this.retryExecutor = new RetryExecutor({
      maxRetries: 2,
      retryablePatterns: ['timeout', 'capture failed']
    });
  }

  async captureScreenshot(options) {
    return this.retryExecutor.executeWithRetry(
      () => this.actualCapture(options),
      (error) => this.isRetryable(error)
    );
  }
}
```

**Testing**:
1. Create retry-logic.js with unit tests
2. Test retry behavior (success after 1 retry)
3. Test non-retryable errors (immediate failure)
4. Test max retries reached
5. Update screenshot.js and navigation.js
6. Verify retry logic works in both modules

---

### 1.3 Create Thread-Safe State Wrapper

**File**: `chrome-extension/shared/thread-safe-state.js`

**Extract from**:
- bug-fixes.js: ThreadSafeNavigationConfig
- Generalize for any state

**Interface**:
```javascript
export class ThreadSafeState {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._locks = new Map();
  }

  setStateSafe(key, value, condition = null) {
    // condition: (currentValue) => boolean
    // Only set if condition passes
    // Returns: boolean (success)
  }

  getStateSafe(key) {
    // Atomic read
  }

  updateStateSafe(key, updater) {
    // updater: (currentValue) => newValue
    // Atomic update
  }

  lockOperation(operationId, operation, timeout) {
    // Execute with exclusive lock
  }
}
```

**Usage**:
```javascript
import { ThreadSafeState } from './shared/thread-safe-state.js';

class ScreenshotManager {
  constructor() {
    this.state = new ThreadSafeState({
      isCapturing: false,
      timeout: 30000
    });
  }

  async captureScreenshot(options) {
    // Check state safely
    if (this.state.getStateSafe('isCapturing')) {
      throw new Error('Already capturing');
    }

    // Set state with lock
    this.state.setStateSafe('isCapturing', true);

    try {
      // ... capture logic
    } finally {
      this.state.setStateSafe('isCapturing', false);
    }
  }
}
```

**Testing**:
1. Create thread-safe-state.js
2. Test concurrent access (Promise.all)
3. Test lock behavior
4. Test condition-based setting
5. Update modules to use it
6. Verify race conditions eliminated

---

## Phase 2: Extract Screenshot Module Components (MEDIUM RISK)

**Goal**: Break screenshot.js (44K, 1407 lines) into logical modules

### 2.1 Extract Filename Generator

**File**: `chrome-extension/screenshot/filename-generator.js`

**Extract from**: screenshot.js lines 702-834

**Responsibilities**:
- Smart filename generation
- Page name trimming (4 chars)
- Session code generation (10 chars)
- Date formatting (YY_MM_DD)
- Sequence numbering (0001, 0002, etc.)

**Interface**:
```javascript
export class FilenameGenerator {
  constructor() {
    this.sessionCode = this.generateSessionCode();
    this.sequenceCounters = new Map();
  }

  async generateFilename(options = {}) {
    // options: { selector, fullPage, format }
    // Returns: string (filename)
  }

  trimPageName(title) {
    // 4-char page name
  }

  getNextSequence(baseName) {
    // Increment and return padded number
  }
}
```

**Testing**:
1. Create filename-generator.js
2. Test filename format
3. Test sequence numbering
4. Test different page titles
5. Update screenshot.js to use it

---

### 2.2 Extract Screenshot Capture Logic

**File**: `chrome-extension/screenshot/screenshot-capture.js`

**Extract from**: screenshot.js captureViaBackground() and captureViaWebSocket()

**Responsibilities**:
- Chrome tabs API integration
- WebSocket communication
- Performance monitoring
- Result formatting

**Interface**:
```javascript
export class ScreenshotCapture {
  constructor(config = {}) {
    this.timeout = config.timeout || 30000;
  }

  async captureViaBackground(params) {
    // Chrome runtime message approach
    // Returns: { success, filename, data, loadTime }
  }

  async captureViaWebSocket(params) {
    // WebSocket approach
    // Returns: { success, filename, data, loadTime }
  }
}
```

**Testing**:
1. Create screenshot-capture.js
2. Test background capture method
3. Test WebSocket capture method
4. Test timeout handling
5. Update screenshot.js to use it

---

### 2.3 Extract Screenshot UI Manager

**File**: `chrome-extension/screenshot/screenshot-ui.js`

**Extract from**: screenshot.js updateUI(), updateScreenshotPreview()

**Responsibilities**:
- Button state updates
- Preview display
- Log integration
- Status messages

**Interface**:
```javascript
export class ScreenshotUI {
  constructor(elements) {
    this.button = elements.button;
    this.previewDiv = elements.previewDiv;
    this.logManager = elements.logManager;
  }

  updateButton(state, message) {
    // state: 'capturing' | 'success' | 'error' | 'ready'
  }

  updatePreview(filename) {
    // Show next predicted filename
  }

  showDiskStatus(status) {
    // Show save/clipboard status
  }
}
```

**Testing**:
1. Create screenshot-ui.js
2. Test button state changes
3. Test preview updates
4. Update screenshot.js to use it

---

### 2.4 Refactored ScreenshotManager

**File**: `chrome-extension/screenshot/screenshot-manager.js`

**New structure** (using extracted modules):
```javascript
import { ListenerPoolManager } from '../shared/listener-pool.js';
import { RetryExecutor } from '../shared/retry-logic.js';
import { ThreadSafeState } from '../shared/thread-safe-state.js';
import { FilenameGenerator } from './filename-generator.js';
import { ScreenshotCapture } from './screenshot-capture.js';
import { ScreenshotUI } from './screenshot-ui.js';

export class ScreenshotManager {
  constructor(config = {}) {
    this.state = new ThreadSafeState({ isCapturing: false });
    this.listenerPool = new ListenerPoolManager();
    this.retryExecutor = new RetryExecutor();
    this.filenameGen = new FilenameGenerator();
    this.capture = new ScreenshotCapture();
    this.ui = new ScreenshotUI(config.elements);
  }

  async captureScreenshot(options = {}) {
    // Orchestrate:
    // 1. Check state
    // 2. Generate filename
    // 3. Capture (with retry)
    // 4. Update UI
    // 5. Return result
  }

  // Minimal methods here - most logic delegated
}
```

**File size reduction**: 44K → ~15K (main), ~10K (filename), ~10K (capture), ~5K (UI)

**Testing**:
1. Test orchestration flow
2. Test panel button capture
3. Test WebSocket capture
4. Test clipboard integration
5. Test error cases
6. Verify memory cleanup

---

## Phase 3: Extract Panel.js Components (HIGH RISK)

**Goal**: Break panel.js (29K) into logical modules while keeping orchestration

### 3.1 Extract Settings Manager

**File**: `chrome-extension/panel/settings-manager.js`

**Extract from**: panel.js settings handling

**Responsibilities**:
- Load from chrome.storage.local
- Save to chrome.storage.local
- Validation
- Default values
- Change notifications

**Interface**:
```javascript
export class SettingsManager {
  constructor() {
    this.settings = null;
    this.listeners = new Map();
  }

  async load() {
    // Load from chrome.storage.local
    // Apply defaults
    // Returns: settings object
  }

  async save(settings) {
    // Validate
    // Save to chrome.storage.local
    // Notify listeners
  }

  get(key) {
    // Get setting value
  }

  set(key, value) {
    // Set and auto-save
  }

  onChange(key, callback) {
    // Register change listener
  }
}
```

**Testing**:
1. Create settings-manager.js
2. Test load/save
3. Test validation
4. Test change notifications
5. Update panel.js to use it

---

### 3.2 Extract Log Display Manager

**File**: `chrome-extension/panel/log-display.js`

**Extract from**: panel.js addLogEntry() and related

**Responsibilities**:
- Add log entries
- Filter logs
- Clear logs
- DOM manipulation
- Auto-scroll

**Interface**:
```javascript
export class LogDisplayManager {
  constructor(container) {
    this.container = container;
    this.logManager = new LogManager(container);
  }

  addEntry(level, message, source) {
    // Add log entry
    // Auto-scroll
  }

  clear() {
    // Clear all logs
  }

  filter(level) {
    // Filter by log level
  }

  export() {
    // Export logs to file
  }
}
```

**Testing**:
1. Create log-display.js
2. Test add/clear/filter
3. Test auto-scroll
4. Test max entries
5. Update panel.js to use it

---

### 3.3 Extract UI Controller

**File**: `chrome-extension/panel/ui-controller.js`

**Extract from**: panel.js DOM references and event handlers

**Responsibilities**:
- DOM element references
- Event handler attachment
- UI state management
- Button state coordination

**Interface**:
```javascript
export class UIController {
  constructor(elements) {
    this.elements = elements;
    this.handlers = new Map();
  }

  attachEventHandlers(handlers) {
    // handlers: { 'screenshot-btn': { click: fn }, ... }
  }

  updateButtonState(buttonId, state) {
    // Update button state
  }

  showStatus(message, type) {
    // Show status message
  }

  getFormData(formId) {
    // Get form data
  }
}
```

**Testing**:
1. Create ui-controller.js
2. Test event attachment
3. Test state updates
4. Update panel.js to use it

---

### 3.4 Extract Connection Manager

**File**: `chrome-extension/panel/connection-manager.js`

**Extract from**: panel.js WebSocket and HTTP bridge integration

**Responsibilities**:
- WebSocket lifecycle
- Connection status
- Reconnection logic
- Message routing

**Interface**:
```javascript
export class ConnectionManager {
  constructor(config) {
    this.wsManager = new WebSocketManager(config.host, config.port);
    this.statusCallbacks = [];
  }

  async connect() {
    // Initialize WebSocket
    // Setup listeners
  }

  disconnect() {
    // Clean disconnect
  }

  onStatusChange(callback) {
    // Register status listener
  }

  send(message) {
    // Send via WebSocket
  }
}
```

**Testing**:
1. Create connection-manager.js
2. Test connect/disconnect
3. Test status updates
4. Test message sending
5. Update panel.js to use it

---

### 3.5 Refactored panel.js

**New structure** (orchestrator only):
```javascript
import { SettingsManager } from './panel/settings-manager.js';
import { LogDisplayManager } from './panel/log-display.js';
import { UIController } from './panel/ui-controller.js';
import { ConnectionManager } from './panel/connection-manager.js';

// Keep global managers (for backward compatibility)
window.screenshotManager = new ScreenshotManager({ /* ... */ });
window.navigationHandler = new NavigationHandler();
window.interactionHandler = new InteractionHandler();

// Initialize panel components
const settings = new SettingsManager();
const logDisplay = new LogDisplayManager(document.getElementById('logs-display'));
const ui = new UIController({
  screenshotBtn: document.getElementById('screenshot-btn'),
  // ... other elements
});
const connection = new ConnectionManager(await settings.load());

// Wire up handlers (minimal orchestration)
ui.attachEventHandlers({
  'screenshot-btn': {
    click: async () => {
      const result = await window.screenshotManager.captureScreenshot({
        addToClipboard: settings.get('addToClipboard')
      });
      if (result.success) {
        logDisplay.addEntry('info', `Screenshot saved: ${result.filename}`);
      }
    }
  },
  // ... other handlers
});

// WebSocket message routing
window.wsManager.on('message', (message) => {
  switch (message.type) {
    case 'screenshot-request':
      window.screenshotManager.handleWebSocketRequest(message);
      break;
    // ... other cases
  }
});

// Connection status updates
connection.onStatusChange((status) => {
  ui.showStatus(`Connection: ${status}`, status === 'connected' ? 'success' : 'error');
});

// Initialize
await connection.connect();
```

**File size reduction**: 29K → ~10K (orchestration), ~5K (settings), ~5K (logs), ~5K (ui), ~4K (connection)

---

## Phase 4: Module System Migration (OPTIONAL - FUTURE)

**Goal**: Convert to ES6 modules for better dependency management

### 4.1 Update manifest.json

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; ..."
  },
  "web_accessible_resources": [{
    "resources": ["*.js"],
    "matches": ["<all_urls>"]
  }]
}
```

### 4.2 Update panel.html

```html
<!-- Remove all <script> tags -->
<!-- Add single module entry point -->
<script type="module" src="panel-entry.js"></script>
```

### 4.3 Create Entry Point

**File**: `chrome-extension/panel-entry.js`

```javascript
import './shared/listener-pool.js';
import './shared/retry-logic.js';
import './shared/thread-safe-state.js';
import './screenshot/screenshot-manager.js';
import './navigation/navigation-manager.js';
import './interactions/interaction-manager.js';
import './panel/panel-orchestrator.js';

// Initialize
import('./panel/panel-orchestrator.js').then(module => {
  module.initialize();
});
```

**Note**: This phase is optional and highest risk. Should only be done after Phases 1-3 are stable.

---

## Implementation Order

### Week 1: Shared Utilities
- Day 1: listener-pool.js + tests
- Day 2: retry-logic.js + tests
- Day 3: thread-safe-state.js + tests
- Day 4: Update screenshot.js, navigation.js
- Day 5: Integration testing + fixes

### Week 2: Screenshot Module
- Day 1: filename-generator.js + tests
- Day 2: screenshot-capture.js + tests
- Day 3: screenshot-ui.js + tests
- Day 4: Integrate into screenshot-manager.js
- Day 5: Full screenshot testing + fixes

### Week 3: Panel Components
- Day 1: settings-manager.js + tests
- Day 2: log-display.js + tests
- Day 3: ui-controller.js + tests
- Day 4: connection-manager.js + tests
- Day 5: Integration testing

### Week 4: Integration & Polish
- Day 1: Refactor panel.js orchestrator
- Day 2: Full integration testing
- Day 3: Performance testing
- Day 4: Memory leak testing
- Day 5: Documentation + cleanup

---

## Testing Strategy

### Unit Testing (Each Module)
```javascript
// Example: listener-pool.test.js
describe('ListenerPoolManager', () => {
  test('creates managed listener', () => {
    const pool = new ListenerPoolManager();
    const listener = pool.createManagedListener(() => {}, 'test');

    expect(listener.id).toBeDefined();
    expect(listener.listener).toBeInstanceOf(Function);
    expect(listener.remove).toBeInstanceOf(Function);
  });

  test('cleans up stale listeners', async () => {
    const pool = new ListenerPoolManager();
    // Create old listener
    // Wait
    const cleaned = pool.cleanupStaleListeners();
    expect(cleaned).toBeGreaterThan(0);
  });
});
```

### Integration Testing (After Each Phase)
1. **Screenshot Flow**:
   - Panel button click → capture → save → clipboard
   - WebSocket request → capture → response

2. **Navigation Flow**:
   - URL input → validate → navigate → complete

3. **Memory Testing**:
   - Run 100 operations
   - Check memory growth
   - Verify cleanup

4. **Error Cases**:
   - Network errors
   - Timeout errors
   - Invalid inputs

### Regression Testing
- Before/after comparison of all features
- Performance benchmarks
- Memory usage tracking

---

## Rollback Plan

### If Issues Detected

1. **Stop immediately**
2. **Document the issue**
3. **Revert to last stable state**:
   ```bash
   git checkout <last-stable-commit>
   ```
4. **Analyze what went wrong**
5. **Fix in isolation**
6. **Re-attempt with lessons learned**

### Safety Checkpoints

After each major change:
1. Tag the commit
2. Run full test suite
3. Manual testing of core features
4. Memory leak check
5. User approval before proceeding

---

## Success Criteria

### Code Quality
- [ ] File sizes reduced by 50%+
- [ ] Code duplication eliminated
- [ ] Clear module boundaries
- [ ] Consistent patterns

### Functionality
- [ ] All features working as before
- [ ] No regressions
- [ ] Clipboard integration works
- [ ] Memory leaks eliminated

### Maintainability
- [ ] Easy to locate code
- [ ] Clear dependencies
- [ ] Simple to test
- [ ] Well documented

### Performance
- [ ] No performance degradation
- [ ] Memory usage stable
- [ ] Cleanup working properly

---

## File Structure (After Refactoring)

```
chrome-extension/
├── shared/
│   ├── listener-pool.js        (NEW - extracted)
│   ├── retry-logic.js          (NEW - extracted)
│   └── thread-safe-state.js    (NEW - extracted)
│
├── screenshot/
│   ├── filename-generator.js   (NEW - extracted)
│   ├── screenshot-capture.js   (NEW - extracted)
│   ├── screenshot-ui.js        (NEW - extracted)
│   └── screenshot-manager.js   (REFACTORED - smaller)
│
├── panel/
│   ├── settings-manager.js     (NEW - extracted)
│   ├── log-display.js          (NEW - extracted)
│   ├── ui-controller.js        (NEW - extracted)
│   └── connection-manager.js   (NEW - extracted)
│
├── navigation.js               (UPDATED - uses shared)
├── interactions.js             (UPDATED - uses shared)
├── websocket.js                (UNCHANGED)
├── constants.js                (UNCHANGED)
├── url-validator.js            (UNCHANGED)
├── memory-manager.js           (UNCHANGED)
├── bug-fixes.js                (PARTIALLY EXTRACTED)
├── panel.js                    (REFACTORED - orchestrator only)
└── panel.html                  (UPDATED - new script refs)
```

---

## Next Actions (Immediate)

1. **Get user approval** on this refactoring plan
2. **Create feature branch**: `refactor/modular-architecture`
3. **Backup original files**: `*.backup` copies
4. **Start Phase 1, Step 1**: Create `shared/listener-pool.js`
5. **Test and iterate**

---

**End of Refactoring Plan**

*Ready to begin implementation upon user approval.*
