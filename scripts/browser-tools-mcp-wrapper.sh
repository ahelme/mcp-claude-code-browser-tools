#!/bin/bash

# Browser Tools MCP Wrapper Script
# This script starts both browser-tools-server and browser-tools-mcp
# Designed to be called from .claude/mcp.json for automatic startup

echo "[Browser Tools MCP Wrapper] Starting..." >&2

# Configuration
PORT=${PORT:-3026}
SERVER_START_DELAY=2

# Function to cleanup on exit
cleanup() {
    echo "[Browser Tools MCP Wrapper] Shutting down..." >&2
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM EXIT

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