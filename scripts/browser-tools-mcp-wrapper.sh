#!/bin/bash

# Browser Tools MCP Wrapper Script
# This script starts both browser-tools-server and browser-tools-mcp
# Designed to be called from .claude/mcp.json for automatic startup
# Handles graceful shutdown when Claude Code exits

echo "[Browser Tools MCP Wrapper] Starting..." >&2

# Configuration
PORT=${PORT:-3026}
SERVER_START_DELAY=2

# Function to cleanup on exit
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

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM EXIT SIGHUP

# Start browser-tools-server in background
echo "[Browser Tools MCP Wrapper] Starting browser-tools-server on port $PORT..." >&2
PORT=$PORT npx @agentdeskai/browser-tools-server@latest &
SERVER_PID=$!

# Wait for server to start
echo "[Browser Tools MCP Wrapper] Waiting for server to initialize..." >&2
sleep $SERVER_START_DELAY

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "[Browser Tools MCP Wrapper] Error: browser-tools-server failed to start" >&2
    exit 1
fi

echo "[Browser Tools MCP Wrapper] Server started successfully on port $PORT" >&2

# Start browser-tools-mcp (this will run in foreground and handle MCP protocol)
echo "[Browser Tools MCP Wrapper] Starting browser-tools-mcp..." >&2
exec npx @agentdeskai/browser-tools-mcp@1.2.1