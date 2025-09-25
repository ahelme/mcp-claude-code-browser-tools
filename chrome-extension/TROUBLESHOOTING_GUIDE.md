# Browser Navigation Tools - Troubleshooting Guide

## Overview
This troubleshooting guide covers performance optimization features, common issues, and debugging techniques for the Browser Navigation Tools Chrome extension.

## Performance Features (v1.1.0)

### 🚀 Advanced Retry Strategy
- **Feature**: Exponential backoff with 5-second maximum delay cap
- **Purpose**: Prevents infinitely long wait times during network issues
- **Configuration**: 2 retry attempts max, 1s base delay, 5s cap

### 🧹 Dynamic Memory Cleanup
- **Feature**: Load-based cleanup intervals
- **Intervals**: 60s (idle) → 30s (light) → 15s (moderate) → 5s (heavy)
- **Purpose**: Optimizes resource usage based on actual operation load

### 🎯 Listener Pool Management
- **Feature**: Maximum 5 concurrent listeners with automatic cleanup
- **Purpose**: Prevents memory leaks during rapid navigation requests
- **Cleanup**: Removes stale listeners (>5min old OR >1min inactive)

---

## Common Issues & Solutions

### Navigation Issues

#### 🔴 Issue: "Navigation already in progress"
**Symptoms**: Navigation requests rejected with this error message

**Causes**:
- Multiple rapid navigation attempts
- Previous navigation not properly cleaned up
- Browser state inconsistency

**Solutions**:
```javascript
// Check navigation state
const handler = window.navigationHandler;
const state = handler.getNavigationState();
console.log('Navigation state:', state);

// Force cancel if stuck
if (state.isNavigating) {
  handler.cancelNavigation();
}
```

**Prevention**:
- Wait for navigation completion before new requests
- Use the listener pool management system
- Check `getNavigationState()` before navigation

#### 🔴 Issue: "URL validation failed" for valid URLs
**Symptoms**: Legitimate URLs are rejected

**Common Cases**:
```javascript
// ❌ These will be rejected for security
"file:///local/file.html"
"javascript:alert(1)"
"data:text/html,<script>"
"chrome://settings"

// ✅ These are allowed
"https://example.com"
"http://localhost:3000"
"devtools://..." (in Chrome extension context)
```

**Solutions**:
- Use HTTPS URLs when possible
- Check URL format: `handler.validateUrl(yourUrl)`
- Verify protocol is http/https

#### 🔴 Issue: Navigation timeouts
**Symptoms**: Navigation fails with timeout errors after 10+ seconds

**Debugging Steps**:
1. Check network connectivity
2. Verify URL accessibility
3. Monitor retry attempts
4. Check Chrome DevTools console

**Solutions**:
```javascript
// Custom timeout (1-60 seconds)
const message = {
  url: "https://slow-site.com",
  timeout: 30000,  // 30 seconds
  requestId: "custom_timeout"
};

// Check retry behavior
handler.retryAttempts; // Current retry count
handler.maxRetries;    // Maximum retries (2)
```

### Memory & Performance Issues

#### 🔴 Issue: Extension becomes slow after many operations
**Symptoms**: UI lag, delayed responses, high memory usage

**Diagnosis**:
```javascript
// Check listener pool status
const state = handler.getNavigationState();
console.log('Listener pool:', state.listenerPoolStatus);

// Monitor memory if available
if (performance.memory) {
  console.log('Memory usage:', {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
  });
}
```

**Solutions**:
```javascript
// Force cleanup
handler.cleanupStaleListeners();

// Check cleanup frequency (should be dynamic)
const poolStatus = handler.getListenerPoolStatus();
console.log('Pool utilization:', poolStatus.utilizationPercent + '%');

// Reset if necessary
handler.destroy();
window.navigationHandler = new NavigationHandler();
```

#### 🔴 Issue: Memory leaks during stress testing
**Symptoms**: Memory grows continuously, browser becomes unresponsive

**Prevention**:
- Listener pool automatically caps at 5 concurrent
- Dynamic cleanup intervals adjust to load
- Stale listener removal every 1-5 minutes

**Manual Cleanup**:
```javascript
// Emergency cleanup
const handler = window.navigationHandler;

// Remove all listeners
handler.cancelAllWaits(); // For InteractionHandler
handler.cleanupStaleListeners(); // For NavigationHandler

// Check pool size
console.log('Active listeners:', handler.listenerPool.size);

// Force garbage collection (Chrome DevTools only)
// Performance tab → Collect garbage
```

### WebSocket Communication Issues

#### 🔴 Issue: "Chrome extension disconnected"
**Symptoms**: Intermittent connection losses in HTTP bridge logs

**Common Causes**:
- Chrome DevTools closed/reopened
- Tab navigation away from extension
- Network connectivity issues
- Extension reload

**Solutions**:
1. **Reconnection**: Automatic - wait 30 seconds
2. **Manual**: Close/reopen Chrome DevTools
3. **Verification**: Check Browser Tools tab is active
4. **Port**: Ensure correct port (3024) in extension settings

#### 🔴 Issue: Navigation commands not reaching extension
**Symptoms**: MCP commands succeed but navigation doesn't occur

**Debugging Checklist**:
```bash
# 1. Check HTTP bridge is running
curl http://localhost:3024/health

# 2. Check WebSocket connection in bridge logs
# Look for: "Chrome extension connected!"

# 3. Check extension console for errors
# Chrome DevTools → Console → Check for navigation.js errors

# 4. Test navigation manually
window.navigationHandler.handleNavigationRequest({
  url: "https://example.com",
  requestId: "manual_test"
}, console.log);
```

### Performance Optimization Issues

#### 🔴 Issue: Cleanup intervals too aggressive/slow
**Symptoms**: Resources cleaned up too quickly or accumulate

**Current Behavior**:
- 0 listeners: 120s cleanup interval
- 1-2 listeners: 60s cleanup interval
- 3-4 listeners: 30s cleanup interval
- 5+ listeners: 10s cleanup interval

**Tuning** (if needed):
```javascript
// Modify cleanup thresholds
handler.maxConcurrentListeners = 10; // Increase limit
handler.startListenerPoolCleanup(); // Restart with new settings
```

#### 🔴 Issue: Retry delays too long
**Symptoms**: Navigation retries take too long even with cap

**Current Behavior**:
- Attempt 1: 0ms delay
- Attempt 2: 2s delay
- Attempt 3: 4s delay
- All capped at 5s maximum

**Verification**:
```javascript
// Check retry settings
handler.maxRetries; // Should be 2
handler.retryAttempts; // Current attempt

// Watch retry behavior in console
// Look for: "⏳ Waiting {delay}ms before retry..."
```

---

## Debugging Tools & Techniques

### State Inspection
```javascript
// Navigation state
const navState = handler.getNavigationState();
console.log('Navigation:', navState);

// Listener pool details
const poolStatus = navState.listenerPoolStatus;
console.log('Pool:', poolStatus);

// Individual listeners
poolStatus.listeners.forEach(listener => {
  console.log(`Listener ${listener.id}:`, {
    age: Math.round(listener.age / 1000) + 's',
    calls: listener.calls,
    lastUsed: Math.round(listener.lastUsed / 1000) + 's ago'
  });
});
```

### Performance Monitoring
```javascript
// Memory tracking
function trackMemory() {
  if (!performance.memory) return 'Not available';

  return {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
  };
}

// Navigation timing
function measureNavigation(url) {
  const startTime = performance.now();

  handler.handleNavigationRequest({
    url: url,
    requestId: `timing_${Date.now()}`
  }, (response) => {
    const endTime = performance.now();
    console.log('Navigation timing:', {
      url: url,
      success: response.success,
      totalTime: Math.round(endTime - startTime) + 'ms',
      loadTime: response.loadTime + 'ms'
    });
  });
}
```

### Test Suite Execution
```javascript
// Run all tests
const runner = new IntegrationTestRunner();
await runner.runAllTestSuites();

// Run specific test suite
const stressTester = new PerformanceStressTester();
await stressTester.runAllTests();

// Check URL validation
const urlTester = new URLValidationTester();
await urlTester.runAllTests();

// Export results for analysis
runner.exportResults('json');
```

---

## Performance Benchmarks

### Expected Performance Metrics

**Listener Operations**:
- Creation: <5ms average
- Removal: <5ms average
- Cleanup cycle: <50ms average
- Status check: <2ms average

**Memory Usage**:
- Growth: <50% during stress tests
- Cleanup: Effective within 5 minutes
- Leaks: None detected in 20+ operation cycles

**Navigation Performance**:
- Basic: <2s for fast sites
- With retry: <15s maximum (with 5s delays)
- Concurrent: 5 operations managed efficiently

**Resource Limits**:
- Max concurrent listeners: 5
- Cleanup frequency: 10s (heavy load) to 120s (idle)
- Stale listener age: 5 minutes max

### Stress Test Targets
```javascript
// These should pass reliably
const stressTargets = {
  concurrentNavigations: 8,      // Beyond listener limit
  memoryLeakIterations: 20,      // Create/cleanup cycles
  listenerPoolStress: 100,       // Rapid creation/removal
  retryStrategyLoad: 3,          // Failed URL retries
  cleanupEfficiency: 4           // Load scenarios
};
```

---

## Integration with MCP Server

### HTTP Bridge Health Check
```bash
curl -s http://localhost:3024/health | jq
```

### Navigation via MCP
```python
# Python example using MCP client
result = await mcp_client.call_tool(
  "mcp__mcp-claude-code-browser-tools__browser_navigate",
  {"url": "https://example.com"}
)
```

### Debug Logs
```bash
# Enable debug mode
export MCP_DEBUG=1
./mcp-server/start.sh

# Watch for navigation messages
tail -f mcp-server/logs/bridge.log | grep navigation
```

---

## Emergency Recovery

### Complete Reset
```javascript
// Stop all operations
handler.cancelNavigation();
handler.destroy();

// Recreate handler
window.navigationHandler = new NavigationHandler();

// Verify clean state
console.log('Reset state:', handler.getNavigationState());
```

### Extension Reload
1. Chrome → Extensions → Browser Tools → Reload
2. Reopen Chrome DevTools
3. Activate Browser Tools tab
4. Verify connection in bridge logs

### Bridge Restart
```bash
# Kill bridge
pkill -f "http-bridge.mjs"

# Restart
./mcp-server/start.sh

# Verify
curl http://localhost:3024/health
```

---

## Reporting Issues

### Information to Include
1. **Navigation state**: `handler.getNavigationState()`
2. **Console errors**: Chrome DevTools → Console
3. **Bridge logs**: HTTP bridge terminal output
4. **Test results**: Run integration tests
5. **System info**: Chrome version, OS, memory available
6. **Reproduction steps**: Exact sequence of actions

### Debug Data Collection
```javascript
// Comprehensive debug info
const debugInfo = {
  timestamp: new Date().toISOString(),
  navigationState: handler.getNavigationState(),
  memory: performance.memory ? {
    used: performance.memory.usedJSHeapSize,
    total: performance.memory.totalJSHeapSize
  } : 'Not available',
  userAgent: navigator.userAgent,
  chromeVersion: navigator.appVersion,
  extensionContext: {
    chrome: !!window.chrome,
    devtools: !!(window.chrome && window.chrome.devtools)
  }
};

console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
```

---

**Last Updated**: September 2025
**Version**: 1.1.0
**Performance Features**: ✅ Retry Strategy, ✅ Dynamic Cleanup, ✅ Listener Pool