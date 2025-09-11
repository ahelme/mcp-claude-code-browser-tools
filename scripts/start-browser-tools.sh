#!/bin/bash

# Browser Tools for Claude Code - Server Activation Script
# This script starts the browser-tools server for browser automation testing

echo "🚀 Starting Browser Tools MCP Server..."
echo "================================================"
echo ""

# Get assigned port for this project from registry
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=$("$SCRIPT_DIR/get-browser-tools-port.sh" | tail -n 1)

echo "📍 Configuration:"
echo "   Port: $PORT (assigned to this project)"
echo ""

# Function to check if a process is running on a port
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Check if our port is available
if check_port $PORT; then
    echo "⚠️  Port $PORT is already in use!"
    echo "   Please stop the existing process or edit this script to use a different port."
    exit 1
else
    echo "✅ Port $PORT is available"
fi

echo ""
echo "Starting Browser Tools Server on port $PORT..."
echo "============================================="
echo ""
echo "📝 Instructions:"
echo "1. Make sure the Chrome extension is installed"
echo "2. Open Chrome and navigate to your test URL:"
echo "   - http://localhost:3000 (your local dev server)"
echo "   - https://example.com"
echo "   - https://the-internet.herokuapp.com/"
echo "3. Open Chrome DevTools (F12)"
echo "4. Find the BrowserToolsMCP panel in DevTools"
echo "5. The server will connect to the extension on port $PORT"
echo ""
echo "Starting server..."
echo "------------------"

# Start the browser-tools server with specified port
PORT=$PORT npx @agentdeskai/browser-tools-server@latest

# Note: This will keep running until you press Ctrl+C