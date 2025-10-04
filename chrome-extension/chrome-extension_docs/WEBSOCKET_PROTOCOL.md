# WebSocket Message Protocol Documentation

## Overview
The Chrome extension communicates with the HTTP bridge server via WebSocket connection on port 3024. This document defines the message protocol for browser automation tools.

## Connection Flow
1. Extension connects to `ws://localhost:3024`
2. Extension sends initial handshake with tab information
3. Bidirectional message exchange begins
4. Keep-alive ping/pong mechanism maintains connection

## Message Format
All messages are JSON objects with the following structure:

```json
{
  "type": "message_type",
  "action": "action_name",
  "data": { ... },
  "requestId": "unique_identifier",
  "timestamp": 1234567890
}
```

## Message Types

### 1. Connection Management

#### Handshake (Extension → Server)
```json
{
  "type": "tabId",
  "tabId": 1234567890
}
```

#### URL Updates (Extension → Server)
```json
{
  "type": "url",
  "url": "https://example.com",
  "tabId": 1234567890
}
```

#### Keep-Alive (Bidirectional)
```json
{
  "action": "ping",
  "timestamp": 1234567890
}
```

```json
{
  "action": "pong",
  "timestamp": 1234567890
}
```

### 2. Navigation Operations

#### Navigation Request (Server → Extension)
```json
{
  "action": "navigate",
  "url": "https://example.com",
  "requestId": "nav_123456",
  "timeout": 10000
}
```

#### Navigation Response (Extension → Server)
```json
{
  "type": "navigationResult",
  "success": true,
  "url": "https://example.com",
  "finalUrl": "https://example.com/",
  "title": "Example Domain",
  "loadTime": 1234,
  "timestamp": 1234567890,
  "source": "NavigationHandler",
  "version": "1.1.0",
  "handledAt": 1234567890,
  "handledBy": "NavigationHandler v1.1.0"
}
```

#### Navigation Error Response
```json
{
  "type": "navigationResult",
  "success": false,
  "error": "Navigation timeout after 10000ms",
  "url": "https://example.com",
  "requestId": "nav_123456",
  "timestamp": 1234567890
}
```

### 3. Interaction Operations

#### Click Request (Server → Extension)
```json
{
  "action": "click",
  "selector": "#submit-button",
  "requestId": "click_123456"
}
```

#### Type Request (Server → Extension)
```json
{
  "action": "type",
  "selector": "input[name='username']",
  "text": "hello world",
  "clear": true,
  "requestId": "type_123456"
}
```

#### Wait Request (Server → Extension)
```json
{
  "action": "wait",
  "selector": ".loading-spinner",
  "timeout": 5000,
  "requestId": "wait_123456"
}
```

#### Interaction Response (Extension → Server)
```json
{
  "type": "interactionResult",
  "success": true,
  "result": "success",
  "message": "Element clicked successfully",
  "elementInfo": {
    "tagName": "BUTTON",
    "className": "btn btn-primary",
    "id": "submit-button",
    "text": "Submit Form"
  },
  "requestId": "click_123456",
  "timestamp": 1234567890
}
```

### 4. Content Operations

#### Screenshot Request (Server → Extension)
```json
{
  "action": "screenshot",
  "selector": "#main-content",
  "fullPage": false,
  "requestId": "screenshot_123456"
}
```

#### Content Request (Server → Extension)
```json
{
  "action": "getContent",
  "selector": "body",
  "format": "html",
  "requestId": "content_123456"
}
```

#### Console Logs Request (Server → Extension)
```json
{
  "action": "getConsole",
  "level": "error",
  "requestId": "console_123456"
}
```

## Error Handling

### Connection Errors
- **Connection Lost**: Extension automatically attempts reconnection
- **Invalid Message**: Server responds with error message
- **Timeout**: Operations timeout after specified duration

### Standard Error Response
```json
{
  "type": "error",
  "error": "Invalid selector provided",
  "code": "INVALID_SELECTOR",
  "requestId": "original_request_id",
  "timestamp": 1234567890
}
```

## Result Codes

### Navigation Results
- `success` - Navigation completed successfully
- `timeout` - Navigation exceeded timeout limit
- `invalid_url` - URL format is invalid
- `permission_denied` - Navigation blocked by browser
- `network_error` - Network connectivity issues

### Interaction Results
- `success` - Operation completed successfully
- `element_not_found` - CSS selector matched no elements
- `element_not_visible` - Element exists but not clickable
- `selector_invalid` - CSS selector syntax is invalid
- `timeout` - Operation exceeded timeout limit
- `permission_denied` - Browser security blocked operation

## Timeout Configuration
- **Default Navigation**: 10 seconds
- **Default Interactions**: 30 seconds
- **Default Wait Operations**: 30 seconds
- **Minimum Timeout**: 1000ms (1 second)
- **Maximum Timeout**: 60000ms (60 seconds)

## Security Considerations
- Only localhost connections accepted
- URL validation prevents dangerous protocols (file:, chrome:, data:)
- Content Security Policy enforced on all operations
- No eval() or innerHTML usage for security compliance

## Performance Optimizations
- Instant scroll behavior for programmatic interactions
- Connection pooling and keep-alive mechanisms
- Automatic cleanup of orphaned operations
- Memory leak prevention through proper listener cleanup

---

**Version**: 1.1.0
**Last Updated**: September 2025
**Compatible With**: Chrome Extension Manifest V3