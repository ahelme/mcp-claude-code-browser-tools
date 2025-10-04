# Commit Message Correction

## Commit 60915b3 - WebSocket Connection Stability Fix

### ❌ Incorrect Information in Commit Message

The commit message states:
```
THE FIX (one line):
- Line 841: const ws = wsConnection || new WebSocket(wsUrl);
- Now reuses existing connection if available
```

### ✅ Actual Fix

**File**: `mcp-server/http-bridge.mjs`
**Line**: 660

**Changed:**
```javascript
if (wsConnection === ws)
```

**To:**
```javascript
if (wsConnection === ws && ws.readyState === WebSocket.CLOSED)
```

**What it does**: Prevents race condition where `wsConnection` gets cleared when a new connection has already been established. Now only clears if the connection is actually CLOSED.

---

*Note: The commit message incorrectly referenced a non-existent line 841. The http-bridge.mjs file only has ~700 lines.*
