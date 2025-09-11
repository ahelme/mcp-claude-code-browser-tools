# 🛑 Graceful Shutdown Handling

## Overview

The browser-tools MCP wrapper script includes sophisticated shutdown handling to ensure clean process termination when Claude Code exits. No orphaned processes are left running!

## How It Works

### Signal Handling

The wrapper script (`scripts/browser-tools-mcp-wrapper.sh`) traps multiple signals:

```bash
trap cleanup SIGINT SIGTERM EXIT SIGHUP
```

| Signal | When It Occurs | Description |
|--------|---------------|-------------|
| `SIGINT` | Ctrl+C pressed | User interruption |
| `SIGTERM` | Process termination | System request to stop |
| `EXIT` | Script exits | Normal or abnormal exit |
| `SIGHUP` | Terminal closed | Claude Code window closed |

### Shutdown Sequence

When Claude Code exits or the wrapper receives a shutdown signal:

1. **Signal Reception**
   ```bash
   echo "[Browser Tools MCP Wrapper] Received shutdown signal, cleaning up..."
   ```

2. **Graceful Termination Attempt**
   - Sends `SIGTERM` to browser-tools-server
   - Waits up to 5 seconds for graceful shutdown
   - Checks every second if process has stopped

3. **Force Termination (if needed)**
   - If server still running after 5 seconds
   - Sends `SIGKILL` to force stop
   - Ensures no hanging processes

4. **Cleanup Orphaned Processes**
   ```bash
   pkill -f "browser-tools-server"
   ```
   - Catches any processes that might have been orphaned
   - Ensures complete cleanup

## The Cleanup Function

```bash
cleanup() {
    echo "[Browser Tools MCP Wrapper] Received shutdown signal, cleaning up..." >&2
    
    # Kill browser-tools-server if running
    if [ ! -z "$SERVER_PID" ] && kill -0 $SERVER_PID 2>/dev/null; then
        echo "[Browser Tools MCP Wrapper] Stopping browser-tools-server (PID: $SERVER_PID)..." >&2
        kill -TERM $SERVER_PID 2>/dev/null
        
        # Give it time to shut down gracefully
        for i in {1..5}; do
            if ! kill -0 $SERVER_PID 2>/dev/null; then
                echo "[Browser Tools MCP Wrapper] Server stopped gracefully" >&2
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if kill -0 $SERVER_PID 2>/dev/null; then
            echo "[Browser Tools MCP Wrapper] Force stopping server..." >&2
            kill -KILL $SERVER_PID 2>/dev/null
        fi
    fi
    
    # Kill any orphaned browser-tools processes
    pkill -f "browser-tools-server" 2>/dev/null
    
    echo "[Browser Tools MCP Wrapper] Cleanup complete" >&2
    exit 0
}
```

## Process Lifecycle

```
Claude Code Starts
    ↓
Wrapper Script Starts
    ↓
browser-tools-server starts (background)
    ↓
browser-tools-mcp starts (foreground)
    ↓
[Claude session active]
    ↓
Claude Code Exits
    ↓
Wrapper receives signal
    ↓
Cleanup function runs
    ↓
Graceful shutdown (5s timeout)
    ↓
Force kill if needed
    ↓
All processes terminated
```

## Benefits

1. **No Manual Cleanup** - Everything stops automatically
2. **No Orphaned Processes** - Complete cleanup guaranteed
3. **Graceful First** - Gives processes time to clean up
4. **Force Fallback** - Ensures termination if graceful fails
5. **Port Released** - Port 3026 immediately available after exit

## Testing Shutdown

You can test the shutdown handling:

1. **Normal Exit**: Close Claude Code normally
2. **Interrupt**: Press Ctrl+C in terminal
3. **Force Close**: Kill Claude Code process

In all cases, the wrapper should clean up properly.

## Monitoring

To verify cleanup worked:

```bash
# Check if any browser-tools processes remain
ps aux | grep browser-tools

# Check if port 3026 is free
lsof -i :3026
```

Both commands should return no results after Claude Code exits.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Process still running | Run `pkill -f browser-tools` manually |
| Port still in use | Wait a few seconds, system may need time to release |
| Cleanup not working | Check wrapper script has execute permissions |

## Technical Details

### Why Multiple Signals?

- **SIGINT**: Catches Ctrl+C during development
- **SIGTERM**: Standard termination request from system
- **EXIT**: Catches all exit scenarios, even errors
- **SIGHUP**: Terminal/window closure detection

### Why Graceful Then Force?

1. **Data Integrity**: Graceful shutdown allows processes to save state
2. **Clean Sockets**: Proper socket closure prevents "address in use" errors
3. **Resource Cleanup**: Temp files and memory properly released
4. **Fallback Safety**: Force kill ensures no hanging processes

### Process Detection

The script uses `kill -0` to check if a process exists:
- Returns 0 if process exists
- Returns 1 if process doesn't exist
- Doesn't actually send a signal

This is the safest way to check process existence without affecting it.

## Integration with Claude Code

When Claude Code starts in the project directory:
1. Reads `.claude/mcp.json`
2. Launches wrapper script
3. Wrapper starts both servers
4. MCP connection established

When Claude Code exits:
1. Sends termination signal to MCP processes
2. Wrapper receives signal via trap
3. Cleanup function executes
4. All processes terminated cleanly

The beauty is that this happens automatically - users don't need to think about it!