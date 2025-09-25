# Browser Navigation Tools - API Documentation

## Overview
Complete API reference for the Browser Navigation Tools Chrome extension with performance optimizations (v1.1.0).

---

## Core Classes

### NavigationHandler

Main class handling browser navigation requests with advanced performance optimizations.

#### Constructor
```javascript
const handler = new NavigationHandler();
```

**Initializes**:
- Retry strategy with exponential backoff (5s cap)
- Dynamic memory cleanup system
- Listener pool management (max 5 concurrent)
- WebSocket communication handlers

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `isNavigating` | boolean | Current navigation state |
| `navigationTimeout` | number | Timeout in milliseconds (1000-60000) |
| `maxRetries` | number | Maximum retry attempts (default: 2) |
| `maxConcurrentListeners` | number | Listener pool limit (default: 5) |
| `listenerPool` | Map | Active listener management pool |
| `retryAttempts` | number | Current retry count |

#### Core Methods

##### handleNavigationRequest(message, sendResponse)
Process navigation requests from WebSocket/MCP server.

**Parameters**:
```javascript
message = {
  url: string,              // Target URL
  requestId: string,        // Unique request identifier
  timeout?: number          // Custom timeout (1000-60000ms)
}

sendResponse = function     // Callback for response
```

**Example**:
```javascript
handler.handleNavigationRequest({
  url: "https://example.com",
  requestId: "nav_001",
  timeout: 15000
}, (response) => {
  console.log('Navigation result:', response);
});
```

**Response Format**:
```javascript
{
  success: boolean,
  url?: string,             // Original URL
  finalUrl?: string,        // Final URL after redirects
  title?: string,           // Page title
  loadTime?: number,        // Navigation time in ms
  error?: string,           // Error message if failed
  timestamp: number,        // Response timestamp
  source: "NavigationHandler",
  version: "1.1.0",
  requestId: string
}
```

##### validateUrl(url)
Validate URL format and security compliance.

**Parameters**:
- `url` (string): URL to validate

**Returns**:
```javascript
{
  isValid: boolean,
  url?: string,             // Normalized URL if valid
  error?: string            // Error description if invalid
}
```

**Security Rules**:
- ✅ Allowed: `http:`, `https:`, `devtools:` (in Chrome context)
- ❌ Blocked: `file:`, `chrome:`, `data:`, `javascript:`, etc.

**Example**:
```javascript
const result = handler.validateUrl("javascript:alert(1)");
// Returns: { isValid: false, error: "Protocol javascript: not supported" }

const valid = handler.validateUrl("https://example.com");
// Returns: { isValid: true, url: "https://example.com" }
```

##### normalizeUrl(url)
Normalize URL for consistent handling.

**Parameters**:
- `url` (string): URL to normalize

**Returns**:
- `string`: Normalized URL

**Normalization Rules**:
- Add `https://` if no protocol specified
- Remove trailing slashes (except root)
- Convert to lowercase hostname
- Preserve query parameters and hash

**Example**:
```javascript
handler.normalizeUrl("example.com/path/");
// Returns: "https://example.com/path"

handler.normalizeUrl("HTTPS://EXAMPLE.COM/");
// Returns: "https://example.com"
```

##### getNavigationState()
Get current navigation and listener pool state.

**Returns**:
```javascript
{
  isNavigating: boolean,
  hasActiveController: boolean,
  activeListenerCount: number,
  listenerPoolStatus: {
    totalListeners: number,
    maxListeners: number,
    utilizationPercent: number,
    lastCleanup: number,     // ms since last cleanup
    listeners: Array<{
      id: string,
      description: string,
      age: number,           // ms since creation
      calls: number,         // usage count
      lastUsed: number,      // ms since last call
      isActive: boolean
    }>
  }
}
```

**Example**:
```javascript
const state = handler.getNavigationState();
console.log(`Active listeners: ${state.activeListenerCount}/${state.listenerPoolStatus.maxListeners}`);
console.log(`Pool utilization: ${state.listenerPoolStatus.utilizationPercent}%`);
```

#### Listener Pool Management

##### createManagedListener(listenerFunction, description)
Create a managed listener with automatic cleanup and usage tracking.

**Parameters**:
- `listenerFunction` (Function): Listener callback
- `description` (string): Debug description

**Returns**:
```javascript
{
  id: string,               // Unique listener ID
  listener: Function,       // Wrapped listener function
  remove: () => boolean,    // Remove listener method
  isActive: () => boolean   // Check if still active
}
```

**Features**:
- Usage tracking (call count, last used time)
- Automatic stale listener cleanup
- Pool size enforcement
- Memory leak prevention

**Example**:
```javascript
const managedListener = handler.createManagedListener(
  (tabId, changeInfo, tab) => {
    console.log('Tab updated:', tabId);
  },
  'custom-tab-monitor'
);

// Use the wrapped listener
chrome.tabs.onUpdated.addListener(managedListener.listener);

// Clean up when done
managedListener.remove();
```

##### removeListener(listenerId)
Remove a specific listener from the pool.

**Parameters**:
- `listenerId` (string): Listener ID from `createManagedListener`

**Returns**:
- `boolean`: Success status

##### cleanupStaleListeners()
Force cleanup of stale listeners.

**Cleanup Criteria**:
- Age > 5 minutes AND inactive > 1 minute
- Never used AND age > 2 minutes

**Example**:
```javascript
// Manual cleanup
handler.cleanupStaleListeners();

// Check cleanup effectiveness
const beforeSize = handler.listenerPool.size;
handler.cleanupStaleListeners();
const afterSize = handler.listenerPool.size;
console.log(`Cleaned up ${beforeSize - afterSize} listeners`);
```

##### getListenerPoolStatus()
Get detailed listener pool analytics.

**Returns**: See `listenerPoolStatus` in `getNavigationState()`

#### Retry & Recovery Methods

##### navigateToUrlWithRetry(url)
Navigate with automatic retry logic.

**Parameters**:
- `url` (string): Normalized URL

**Returns**: Promise resolving to navigation result

**Retry Strategy**:
- Max attempts: 2 retries (3 total)
- Exponential backoff: 2^attempt * 1000ms
- Delay cap: 5000ms maximum
- Only retry on network/timeout errors

**Example**:
```javascript
try {
  const result = await handler.navigateToUrlWithRetry("https://unreliable-site.com");
  console.log('Navigation succeeded:', result);
} catch (error) {
  console.log('Navigation failed after retries:', error.message);
}
```

##### cancelNavigation()
Cancel ongoing navigation with proper cleanup.

**Actions**:
- Abort current navigation controller
- Remove active listeners
- Reset navigation state
- Update UI status

**Example**:
```javascript
// Cancel stuck navigation
handler.cancelNavigation();

// Verify cleanup
const state = handler.getNavigationState();
console.log('Navigation active:', state.isNavigating); // Should be false
```

##### destroy()
Completely destroy handler and cleanup all resources.

**Cleanup Actions**:
- Cancel active navigations
- Remove all listeners from pool
- Clear cleanup intervals
- Reset internal state

**Example**:
```javascript
// Clean shutdown
handler.destroy();

// Create fresh instance
window.navigationHandler = new NavigationHandler();
```

---

## Performance Optimization Features

### Dynamic Memory Cleanup

**Algorithm**: Load-based cleanup intervals
```javascript
const poolSize = handler.listenerPool.size;
let cleanupInterval;

if (poolSize === 0) {
  cleanupInterval = 120000;      // 2 minutes when idle
} else if (poolSize < 3) {
  cleanupInterval = 60000;       // 1 minute for light load
} else if (poolSize < 5) {
  cleanupInterval = 30000;       // 30 seconds for moderate load
} else {
  cleanupInterval = 10000;       // 10 seconds for heavy load
}
```

**Benefits**:
- Reduces unnecessary cleanup cycles when idle
- Increases cleanup frequency under load
- Prevents memory accumulation during stress

### Retry Strategy with Delay Capping

**Implementation**:
```javascript
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  if (attempt > 0) {
    const baseDelay = 1000;
    const exponentialDelay = Math.pow(2, attempt) * baseDelay;
    const cappedDelay = Math.min(exponentialDelay, 5000);
    await sleep(cappedDelay);
  }

  // Attempt navigation...
}
```

**Delay Schedule**:
- Attempt 1: 0ms (immediate)
- Attempt 2: 2000ms delay
- Attempt 3: 4000ms delay (capped at 5000ms)

### Listener Pool Management

**Pool Lifecycle**:
1. **Creation**: Assign unique ID, track metadata
2. **Usage**: Monitor call count and timing
3. **Cleanup**: Remove based on age and inactivity
4. **Limits**: Enforce maximum concurrent listeners

**Metadata Tracking**:
```javascript
const listenerData = {
  id: `listener_${++idCounter}_${Date.now()}`,
  function: originalFunction,
  description: userDescription,
  createdAt: Date.now(),
  isActive: true,
  usage: {
    calls: 0,
    lastUsed: Date.now()
  }
};
```

---

## WebSocket Message Protocol

### Navigation Request
```json
{
  "action": "navigate",
  "url": "https://example.com",
  "requestId": "nav_123",
  "timeout": 10000
}
```

### Navigation Response
```json
{
  "type": "navigationResult",
  "success": true,
  "url": "https://example.com",
  "finalUrl": "https://example.com/",
  "title": "Example Domain",
  "loadTime": 1234,
  "timestamp": 1758804884049,
  "source": "NavigationHandler",
  "version": "1.1.0",
  "handledAt": 1758804884049,
  "handledBy": "NavigationHandler v1.1.0",
  "requestId": "nav_123"
}
```

### Error Response
```json
{
  "type": "navigationResult",
  "success": false,
  "error": "Protocol file: not allowed for security reasons",
  "timestamp": 1758804537735,
  "source": "NavigationHandler",
  "version": "1.1.0",
  "requestId": "nav_123"
}
```

---

## Test Suites API

### PerformanceStressTester

Comprehensive performance validation suite.

```javascript
const tester = new PerformanceStressTester();

// Run all tests
const results = await tester.runAllTests();

// Access performance metrics
console.log('Memory usage:', results.performanceMetrics.memoryUsage);
console.log('Listener counts:', results.performanceMetrics.listenerCounts);
console.log('Cleanup cycles:', results.performanceMetrics.cleanupCycles);
```

**Test Categories**:
- Concurrent navigation handling
- Memory leak detection
- Performance benchmarking
- Listener pool stress testing
- Retry strategy validation
- Dynamic cleanup efficiency
- Resource cleanup verification
- Edge case scenarios

### URLValidationTester

URL security and format validation tests.

```javascript
const urlTester = new URLValidationTester();
const results = await urlTester.runAllTests();

// Check security validation
const securityTests = results.filter(r =>
  r.testName.includes('Security')
);
```

**Test Categories**:
- Basic valid URL formats
- Invalid URL rejection
- Security protocol blocking
- Protocol handling and normalization
- Hostname validation
- Edge cases and boundary conditions
- URL normalization consistency

### IntegrationTestRunner

Coordinated test execution and reporting.

```javascript
const runner = new IntegrationTestRunner();

// Run all available test suites
const results = await runner.runAllTestSuites();

// Get summary
const summary = runner.getResultsSummary();
console.log(`Overall status: ${summary.status}`);
console.log(`Pass rate: ${summary.overallPassRate}%`);

// Export for analysis
const exportData = runner.exportResults('json');
```

**Features**:
- Automatic test suite discovery
- Unified reporting across suites
- Performance metrics aggregation
- Achievement analysis
- Export capabilities

---

## Error Codes & Messages

### Navigation Errors

| Error | Code | Description | Recovery |
|-------|------|-------------|----------|
| `Navigation already in progress` | BUSY | Multiple concurrent navigation | Wait or cancel current |
| `URL is required for navigation` | INVALID_INPUT | Missing URL parameter | Provide valid URL |
| `Navigation timeout after Xms` | TIMEOUT | Operation exceeded timeout | Retry with longer timeout |
| `No active tab found` | NO_TAB | Chrome DevTools tab unavailable | Reopen DevTools |

### URL Validation Errors

| Error | Code | Description | Fix |
|-------|------|-------------|-----|
| `Protocol X not allowed for security reasons` | BLOCKED_PROTOCOL | Dangerous protocol blocked | Use http/https |
| `Data URLs not allowed for security reasons` | BLOCKED_DATA | Data URLs blocked | Use regular URLs |
| `Invalid URL format: X` | MALFORMED | URL parsing failed | Check URL syntax |
| `Invalid hostname` | INVALID_HOST | Hostname validation failed | Provide valid hostname |

### Performance Errors

| Error | Code | Description | Action |
|-------|------|-------------|--------|
| `Listener pool approaching maximum capacity` | POOL_LIMIT | Near listener limit | Cleanup will auto-trigger |
| `Memory usage exceeding baseline by X%` | MEMORY_LEAK | Potential memory leak | Force cleanup |
| `Cleanup cycle failed: X` | CLEANUP_ERROR | Cleanup process error | Manual intervention |

---

## Configuration Options

### Default Settings
```javascript
const defaultConfig = {
  // Navigation
  navigationTimeout: 10000,        // 10 seconds
  maxRetries: 2,                   // 2 retry attempts

  // Listener Pool
  maxConcurrentListeners: 5,       // Pool size limit
  listenerMaxAge: 300000,          // 5 minutes max age
  listenerInactivityTimeout: 60000,// 1 minute inactivity

  // Cleanup
  cleanupIntervals: {
    idle: 120000,                  // 2 minutes
    light: 60000,                  // 1 minute
    moderate: 30000,               // 30 seconds
    heavy: 10000                   // 10 seconds
  },

  // Retry Strategy
  retryBaseDelay: 1000,            // 1 second base
  retryMaxDelay: 5000,             // 5 second cap
  retryableErrorPatterns: [
    "timeout", "network", "connection",
    "unreachable", "temporary"
  ]
};
```

### Customization
```javascript
// Custom timeout for specific operations
handler.navigationTimeout = 30000; // 30 seconds

// Adjust retry behavior
handler.maxRetries = 3;            // More attempts

// Modify pool limits
handler.maxConcurrentListeners = 10; // Larger pool

// Force cleanup frequency
handler.cleanupStaleListeners();   // Manual trigger
```

---

## Integration Examples

### MCP Server Integration
```python
# Python MCP server example
async def navigate_browser(url: str, timeout: int = 10000):
    """Navigate browser via Chrome extension."""

    message = {
        "action": "navigate",
        "url": url,
        "requestId": f"mcp_{int(time.time())}",
        "timeout": timeout
    }

    # Send via WebSocket to Chrome extension
    await websocket.send(json.dumps(message))

    # Wait for response
    response = await websocket.recv()
    return json.loads(response)
```

### Direct Extension Usage
```javascript
// Access global handler
const handler = window.navigationHandler;

// Custom navigation with monitoring
async function monitoredNavigation(url) {
  const startState = handler.getNavigationState();

  console.log('Pre-navigation state:', startState);

  return new Promise((resolve, reject) => {
    handler.handleNavigationRequest({
      url: url,
      requestId: `monitored_${Date.now()}`,
      timeout: 15000
    }, (response) => {
      const endState = handler.getNavigationState();

      console.log('Post-navigation state:', endState);
      console.log('Listener pool utilization:',
        endState.listenerPoolStatus.utilizationPercent + '%');

      if (response.success) {
        resolve(response);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

// Usage
try {
  const result = await monitoredNavigation('https://example.com');
  console.log('Navigation completed:', result.finalUrl);
} catch (error) {
  console.error('Navigation failed:', error.message);
}
```

### Performance Monitoring
```javascript
// Continuous performance monitoring
class NavigationMonitor {
  constructor(handler) {
    this.handler = handler;
    this.metrics = [];
    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      const state = this.handler.getNavigationState();
      const memory = performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      } : null;

      this.metrics.push({
        timestamp: Date.now(),
        activeListeners: state.activeListenerCount,
        poolUtilization: state.listenerPoolStatus.utilizationPercent,
        memory: memory,
        isNavigating: state.isNavigating
      });

      // Keep last 100 data points
      if (this.metrics.length > 100) {
        this.metrics.shift();
      }

    }, 5000); // Every 5 seconds
  }

  getReport() {
    return {
      averageListeners: this.metrics.reduce((sum, m) =>
        sum + m.activeListeners, 0) / this.metrics.length,

      peakUtilization: Math.max(...this.metrics.map(m =>
        m.poolUtilization)),

      navigationTime: this.metrics.filter(m =>
        m.isNavigating).length * 5 // seconds
    };
  }
}

// Start monitoring
const monitor = new NavigationMonitor(window.navigationHandler);

// Get performance report
setTimeout(() => {
  console.log('Performance report:', monitor.getReport());
}, 60000);
```

---

## Version History

### v1.1.0 (September 2025)
- ✅ Advanced retry strategy with delay capping
- ✅ Dynamic memory cleanup based on load
- ✅ Listener pool management system
- ✅ Comprehensive performance monitoring
- ✅ Enhanced error handling and recovery
- ✅ DevTools URL support in Chrome extension context

### v1.0.0 (Base Implementation)
- Basic navigation functionality
- URL validation and security
- WebSocket communication
- Error handling

---

**API Version**: 1.1.0
**Last Updated**: September 2025
**Compatibility**: Chrome Extension Manifest V3