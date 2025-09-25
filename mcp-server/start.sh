#!/bin/bash

echo "🚀 Starting MCP Browser Tools (Using MCP Server)"
echo "=================================================="
echo ""
echo "⚠️  This starts the MCP HTTP Bridge on configured port (default port 3024)"
echo "   Claude Code will auto-start the MCP Server when you use browser tools (check local .mcp.json for config)"
echo ""

# Check if port 3024 is in use
if lsof -i :3024 >/dev/null 2>&1; then
    echo "🔍 Found existing process on port 3024:"
    echo ""
    lsof -i :3024
    echo ""
    echo "❓ Would you like to kill this process before starting?"
    echo "   [y/N] (default: No, exit without starting new server)"
    echo ""
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "🔪 Killing existing processes..."
        pkill -f "mcp-http-bridge"
        sleep 2
    else
        echo "ℹ️  Exiting without starting new server."
        echo "   To manually kill processes, use: pkill -f mcp-http-bridge"
        exit 0
    fi
fi

echo "🚀 Starting MCP HTTP Bridge on configured port..."
node mcp-server/http-bridge.mjs &
MCP_BRIDGE_PID=$!

echo "✅ MCP HTTP Bridge started (PID: $MCP_BRIDGE_PID)"
echo ""
echo "📌 Next steps:"
echo "1. Install Chrome extension from: https://github.com/ahelme/mcp-claude-code-browser-tools/tree/main/chrome-extension"
echo "2. Set extension port to e.g. 3024"
echo "3. Use browser tools in Claude Code - MCP server will auto-start (check local .mcp.json for config)"
echo ""
echo "🔍 Check status:"
echo "   curl http://localhost:3024/health"
echo ""
echo "🛑 To stop: pkill -f mcp-http-bridge"

# Wait for process to start
sleep 2

# Keep script running to show any immediate errors
wait $MCP_BRIDGE_PID
