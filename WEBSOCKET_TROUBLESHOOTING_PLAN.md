# WebSocket Communication Troubleshooting Plan

**Created**: September 14, 2025
**Objective**: Fix bidirectional WebSocket communication between HTTP bridge and Chrome extension
**Core Issue**: Commands TO extension work, responses FROM extension fail

---

## 🔍 Problem Analysis

### Current State
- ✅ **WebSocket Connection**: Established successfully
- ✅ **Commands TO Extension**: Navigation works (proves outbound messaging)
- ❌ **Responses FROM Extension**: Timeouts on all read operations
- ❌ **Bidirectional Flow**: Extension receives but doesn't respond properly

### Evidence Pattern
| Operation | Command Sent | Response Received | Status |
|-----------|--------------|-------------------|---------|
| Navigate | ✅ Success | ✅ Success | Working |
| Screenshot | ✅ Sent | ❌ Timeout | Broken |
| JavaScript | ✅ Sent | ❌ Timeout | Broken |
| Get Content | ✅ Sent | ❌ Timeout | Broken |
| Current URL | ✅ Sent | ❌ Empty | Broken |

---

## 🎯 Systematic Investigation Plan

### Phase 1: WebSocket Message Flow Analysis
**Objective**: Understand what messages are actually flowing

#### Step 1.1: Add Comprehensive Logging
- [ ] Log all incoming WebSocket messages from extension
- [ ] Log all outgoing WebSocket messages to extension
- [ ] Log message IDs and correlation
- [ ] Log WebSocket connection events (open, close, error)

#### Step 1.2: Message Format Analysis
- [ ] Compare our message format with official server
- [ ] Verify JSON structure matches extension expectations
- [ ] Check request ID handling and correlation
- [ ] Validate message timing and sequence

#### Step 1.3: Extension Response Monitoring
- [ ] Monitor Chrome extension console for errors
- [ ] Check if extension is actually processing our requests
- [ ] Verify extension is attempting to send responses
- [ ] Look for JavaScript errors in extension context

### Phase 2: Timeout and Timing Analysis
**Objective**: Determine if issue is timing-related

#### Step 2.1: Extended Timeout Testing
- [ ] Increase timeouts from 5s to 30s
- [ ] Test with minimal operations first
- [ ] Monitor for any delayed responses
- [ ] Check if extension needs "warm-up" time

#### Step 2.2: Request Throttling
- [ ] Test with single request at a time
- [ ] Add delays between requests
- [ ] Check for request queue overflows
- [ ] Monitor extension processing capacity

### Phase 3: Protocol Compliance Verification
**Objective**: Ensure we match official server behavior exactly

#### Step 3.1: Official Server Comparison
- [ ] Install official browser-tools-mcp server temporarily
- [ ] Capture WebSocket traffic from official implementation
- [ ] Compare message formats side-by-side
- [ ] Identify any missing fields or different structures

#### Step 3.2: Extension API Requirements
- [ ] Review Chrome extension source if available
- [ ] Check for specific message fields extension expects
- [ ] Verify response format requirements
- [ ] Look for undocumented protocol requirements

### Phase 4: Progressive Testing Approach
**Objective**: Build working functionality incrementally

#### Step 4.1: Minimal Working Operation
- [ ] Start with simplest possible request
- [ ] Test basic ping/pong functionality
- [ ] Verify bidirectional flow with minimal data
- [ ] Build complexity gradually

#### Step 4.2: Specific Command Testing
- [ ] Test each command type individually
- [ ] Isolate which operations work vs fail
- [ ] Check for command-specific issues
- [ ] Document working vs broken patterns

---

## 🔧 Technical Investigation Areas

### WebSocket Event Handling
```javascript
// Current implementation to analyze:
wss.on('connection', (ws) => {
    // Check message handlers
    ws.on('message', (data) => {
        // Response processing logic
    });
});
```

### Message Correlation System
```javascript
// Request-response matching to verify:
const pendingRequests = new Map();
const requestId = Date.now().toString();
// Response correlation logic
```

### Timeout Mechanisms
```javascript
// Current timeout handling:
setTimeout(() => {
    // Timeout logic to analyze
}, 5000);
```

---

## 📊 Data Collection Plan

### Metrics to Track
- [ ] WebSocket message count (sent vs received)
- [ ] Average response times for each operation
- [ ] Success/failure rates by operation type
- [ ] Error patterns and frequency
- [ ] Extension console error logs

### Debug Output Format
```
[TIMESTAMP] [DIRECTION] [TYPE] [REQUEST_ID] [MESSAGE]
[18:20:30] [OUT] [SCREENSHOT] [req_123] {"action":"capture","params":{...}}
[18:20:35] [IN] [TIMEOUT] [req_123] No response after 5000ms
```

---

## 🚨 Common Issues to Check

### Message Format Issues
- [ ] JSON structure differences
- [ ] Missing required fields
- [ ] Incorrect data types
- [ ] Encoding problems

### WebSocket State Issues
- [ ] Connection drops after first message
- [ ] Multiple connections interfering
- [ ] Extension WebSocket not ready
- [ ] Server WebSocket event listeners missing

### Extension Integration Issues
- [ ] Extension permissions insufficient
- [ ] Content script not loaded properly
- [ ] Extension background script errors
- [ ] Tab focus/visibility requirements

### Server Implementation Issues
- [ ] Event listener order problems
- [ ] Async/await handling errors
- [ ] Memory leaks in request tracking
- [ ] Race conditions in response handling

---

## ✅ Success Criteria

### Immediate Goals
- [ ] Receive at least one response from extension
- [ ] Get current URL working
- [ ] Basic JavaScript evaluation working
- [ ] Screenshot capture functional

### Complete Success
- [ ] All 9 browser tools operational
- [ ] Consistent response times < 2s
- [ ] Zero timeout errors
- [ ] Reliable bidirectional communication

---

## 🎯 Implementation Priority

### Critical Path (Do First)
1. **Add WebSocket Logging** - Must see message flow
2. **Test with Extended Timeouts** - Rule out timing issues
3. **Simple Response Test** - Get ANY response working
4. **Message Format Comparison** - Match official server

### Secondary Tasks
5. Progressive feature testing
6. Error handling improvements
7. Performance optimization
8. MCP integration fixes

---

**Next Action**: Begin Phase 1.1 - Add comprehensive WebSocket logging to understand current message flow.