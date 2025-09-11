#!/bin/bash

# PostFlow Browser Tools MCP Server Activation Script
# This script starts the browser-tools server for UI testing

echo "🚀 Starting Browser Tools MCP Server for PostFlow..."
echo "================================================"
echo ""

# Function to check if a process is running on a port
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Check if PostFlow is running
if check_port 3000; then
    echo "✅ PostFlow frontend is running on port 3000"
else
    echo "⚠️  PostFlow frontend is not running on port 3000"
    echo "   Please start it with: cd client && npm start"
fi

if check_port 3001; then
    echo "✅ PostFlow backend is running on port 3001"
else
    echo "⚠️  PostFlow backend is not running on port 3001"
    echo "   Please start it with: npm start"
fi

echo ""
echo "Starting Browser Tools Server..."
echo "================================"
echo ""
echo "📝 Instructions:"
echo "1. Make sure the Chrome extension is installed"
echo "2. Open Chrome and navigate to http://localhost:3000"
echo "3. Open Chrome DevTools (F12)"
echo "4. Find the BrowserToolsMCP panel in DevTools"
echo "5. The server below will connect to the extension"
echo ""
echo "Starting server..."
echo "------------------"

# Start the browser-tools server
npx @agentdeskai/browser-tools-server@latest

# Note: This will keep running until you press Ctrl+C