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
- Thread-safe navigation configuration
- Dynamic listener pool management (max 5 concurrent)
- Memory monitoring with cleanup automation

#### Public Methods

##### handleNavigationRequest(message, sendResponse)
Primary method for processing navigation requests from the MCP server.

**Parameters**:
- `message` (Object): Navigation request containing URL and options
  - `url` (string): Target URL to navigate to
  - `timeout` (number, optional): Navigation timeout (1000-60000ms, default: 10000ms)
  - `waitForNetworkIdle` (boolean, optional): Wait for network idle before completing
  - `retries` (number, optional): Retry attempts (0-2, default: 2)

**Returns**: Promise resolving to navigation result

**Example**:
```javascript
await handler.handleNavigationRequest({
  url: "https://example.com",
  timeout: 15000,
  waitForNetworkIdle: true,
  retries: 1
}, sendResponse);
```

##### validateUrl(url)
Enhanced URL validation with security checks and normalization.

**Parameters**:
- `url` (string): URL to validate

**Returns**:
- `{ isValid: boolean, normalized?: string, error?: string }`

**Security Features**:
- Protocol validation (http/https only)
- Malformed URL detection
- XSS prevention
- Port validation

**Example**:
```javascript
const result = handler.validateUrl("http://example.com:3000");
// Returns: { isValid: true, normalized: "http://example.com:3000/" }
```

##### normalizeUrl(url)
Smart URL normalization with localhost handling.

**Parameters**:
- `url` (string): URL to normalize

**Returns**: Normalized URL string

**Features**:
- Automatic protocol detection
- Localhost special handling
- Port validation
- Trailing slash normalization

##### cleanup()
Enhanced cleanup with memory monitoring and leak prevention.

**Features**:
- Clears all active navigation listeners
- Resets internal state safely
- Prevents memory leaks
- Thread-safe operation

**Example**:
```javascript
handler.cleanup(); // Safe cleanup of all resources
```

---

### InteractionHandler

Handles browser interactions (click, type, wait) with CSP-safe execution.

#### Constructor
```javascript
const interactions = new InteractionHandler();
```

**Initializes**:
- CSP-safe script executor with fallbacks
- Dynamic cleanup timer (60s idle → 5s heavy load)
- Active wait operation tracking
- Orphaned operation prevention

#### Public Methods

##### handleClick(selector, options)
Enhanced click handling with better element targeting.

**Parameters**:
- `selector` (string): CSS selector for target element
- `options` (Object, optional):
  - `timeout` (number): Wait timeout for element (default: 5000ms)
  - `waitForVisible` (boolean): Ensure element is visible (default: true)
  - `scrollIntoView` (boolean): Scroll to element (default: true)

**Returns**: Promise resolving to click result

**Example**:
```javascript
await interactions.handleClick("#submit-button", {
  timeout: 10000,
  waitForVisible: true,
  scrollIntoView: true
});
```

##### handleType(selector, text, options)
Enhanced typing with better error handling.

**Parameters**:
- `selector` (string): CSS selector for input element
- `text` (string): Text to type
- `options` (Object, optional):
  - `timeout` (number): Wait timeout for element
  - `clearFirst` (boolean): Clear existing text (default: true)
  - `typeDelay` (number): Delay between keystrokes (default: 10ms)

**Example**:
```javascript
await interactions.handleType("#email-input", "user@example.com", {
  clearFirst: true,
  typeDelay: 50
});
```

##### handleWait(selector, options)
Advanced wait conditions with multiple strategies.

**Parameters**:
- `selector` (string): CSS selector or wait condition
- `options` (Object, optional):
  - `timeout` (number): Maximum wait time (default: 10000ms)
  - `visible` (boolean): Wait for visibility (default: true)
  - `enabled` (boolean): Wait for enabled state
  - `text` (string): Wait for specific text content
  - `count` (number): Wait for specific element count

**Example**:
```javascript
await interactions.handleWait(".loading-spinner", {
  visible: false,
  timeout: 30000
});
```

---

## Performance Features

### Retry Strategy
- Exponential backoff with smart delay calculation
- Maximum 2 retry attempts for transient failures
- 5-second delay cap to prevent excessive waiting
- Intelligent retry decision based on error type

### Memory Management
- Dynamic cleanup intervals (60s → 5s under load)
- Automatic orphaned operation detection
- Listener pool management (max 5 concurrent)
- Memory leak prevention with monitoring

### Thread-Safe Operations
- Race condition prevention in navigation state
- Atomic timeout configuration updates
- Safe listener registration/removal
- Concurrent operation coordination

### CSP Compliance
- Multiple fallback execution methods
- Safe script injection techniques
- Content Security Policy compliance
- Error handling for restricted environments

---

## Error Handling

### Navigation Errors
```javascript
{
  success: false,
  error: "Navigation timeout after 10000ms",
  errorCode: "TIMEOUT",
  url: "https://example.com",
  timestamp: "2025-09-26T03:19:45.123Z"
}
```

### Interaction Errors
```javascript
{
  success: false,
  error: "Element not found: #missing-button",
  errorCode: "ELEMENT_NOT_FOUND",
  selector: "#missing-button",
  timestamp: "2025-09-26T03:19:45.123Z"
}
```

### Common Error Codes
- `TIMEOUT` - Operation exceeded timeout limit
- `ELEMENT_NOT_FOUND` - Target element not found in DOM
- `INVALID_URL` - URL validation failed
- `NAVIGATION_FAILED` - Browser navigation failed
- `CSP_VIOLATION` - Content Security Policy blocked operation
- `NETWORK_ERROR` - Network connectivity issue

---

## Configuration

### Timeout Settings
```javascript
const TIMEOUTS = {
  MIN: 1000,              // Minimum timeout (1 second)
  MAX: 60000,             // Maximum timeout (60 seconds)
  DEFAULT: 10000,         // Default navigation timeout
  STATUS_CLEAR_DELAY: 3000 // Status message clear delay
};
```

### Retry Configuration
```javascript
const RETRY_CONFIG = {
  MAX_RETRIES: 2,         // Maximum retry attempts
  BASE_DELAY: 1000,       // Base delay for exponential backoff
  MAX_DELAY: 5000,        // Maximum delay cap
  BACKOFF_MULTIPLIER: 2   // Exponential backoff multiplier
};
```

### Memory Management
```javascript
const MEMORY_CONFIG = {
  CLEANUP_INTERVAL_IDLE: 60000,    // 60s cleanup when idle
  CLEANUP_INTERVAL_ACTIVE: 5000,   // 5s cleanup when active
  MAX_CONCURRENT_LISTENERS: 5,     // Max listener pool size
  MEMORY_THRESHOLD_MB: 50          // Memory warning threshold
};
```

---

## Usage Examples

### Basic Navigation
```javascript
// Simple navigation with default settings
await navigate("https://example.com");

// Navigation with custom timeout
await navigate("https://example.com", { timeout: 15000 });

// Navigation with network idle wait
await navigate("https://example.com", {
  waitForNetworkIdle: true,
  timeout: 20000
});
```

### Element Interactions
```javascript
// Click button and wait for page change
await click("#submit-button");
await waitFor("#success-message");

// Type in form field with custom delay
await type("#username", "testuser", { typeDelay: 100 });

// Wait for element to disappear
await waitFor(".loading-spinner", { visible: false });
```

### Advanced Scenarios
```javascript
// Navigation with retry and custom error handling
try {
  await navigate("https://unstable-site.com", {
    timeout: 10000,
    retries: 2
  });
} catch (error) {
  if (error.errorCode === 'TIMEOUT') {
    console.log('Site took too long to load');
  }
}

// Complex interaction sequence
await navigate("https://form-site.com");
await click("#cookie-accept");
await type("#email", "user@example.com");
await click("#subscribe");
await waitFor("#confirmation", { timeout: 15000 });
```

---

## Best Practices

### Performance Optimization
1. Use appropriate timeouts (don't set unnecessarily high)
2. Enable network idle waiting for dynamic content
3. Limit concurrent operations to prevent resource exhaustion
4. Clean up resources when done with navigation handlers

### Error Handling
1. Always wrap navigation/interaction calls in try-catch
2. Check error codes for specific handling logic
3. Implement retry logic for transient failures
4. Log errors with sufficient context for debugging

### Memory Management
1. Create handler instances only when needed
2. Call cleanup() when finished with handlers
3. Monitor memory usage in long-running scenarios
4. Avoid creating excessive concurrent operations

### Security
1. Validate all URLs before navigation
2. Use CSP-compliant script execution methods
3. Avoid executing untrusted JavaScript code
4. Handle sensitive data appropriately in interactions

---

## Troubleshooting

### Common Issues

**Navigation Timeout**
- Check network connectivity
- Increase timeout for slow-loading sites
- Verify URL accessibility
- Consider network idle waiting

**Element Not Found**
- Verify CSS selector accuracy
- Wait for dynamic content to load
- Check for frame/iframe context
- Use more specific selectors

**CSP Violations**
- Script execution may be blocked
- Use alternative interaction methods
- Check Content Security Policy headers
- Enable CSP-safe execution mode

**Memory Leaks**
- Call cleanup() on handlers
- Limit concurrent operations
- Monitor memory usage patterns
- Enable automatic cleanup timers

---

Generated: 2025-09-26 | Version: 1.1.0 | Performance Optimized