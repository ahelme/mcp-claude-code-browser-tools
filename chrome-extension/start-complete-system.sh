#!/bin/bash

# Browser Tools Complete System Startup Script
# This script starts both the MCP HTTP bridge and documentation server
#
# Port Layout:
# 3024 - MCP HTTP Bridge (main functionality)
# 3020 - Documentation Server (protocol docs)
# 3025+ - Multi-project instances

set -e

# Configuration
DEFAULT_PORT=3024
DOCS_PORT=3020
PORT=${BROWSER_TOOLS_PORT:-${MCP_HTTP_BRIDGE_PORT:-$DEFAULT_PORT}}
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 Starting Browser Tools Complete System..."
echo "📍 Project root: $PROJECT_ROOT"
echo "🔌 MCP server port: $PORT"
echo "📚 Documentation port: $DOCS_PORT"
echo ""

# Check for port conflicts
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port $PORT is already in use!"
    echo "   Try a different port: BROWSER_TOOLS_PORT=3025 $0"
    echo "   Or kill existing: lsof -ti:$PORT | xargs kill"
    exit 1
fi

if lsof -Pi :$DOCS_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Documentation port $DOCS_PORT is already in use!"
    echo "   Kill existing: lsof -ti:$DOCS_PORT | xargs kill"
    exit 1
fi

# Start documentation server in background
echo "📚 Starting documentation server on port $DOCS_PORT..."
cd "$PROJECT_ROOT/chrome-extension"
node docs-server.mjs &
DOCS_PID=$!

# Brief pause to let docs server start
sleep 2

# Start MCP bridge from project root in background
echo "🔥 Starting MCP HTTP bridge on port $PORT..."
cd "$PROJECT_ROOT"
node mcp-server/http-bridge.mjs &
BRIDGE_PID=$!

# Brief pause to let bridge start
sleep 2

echo ""
echo "✅ Browser Tools Complete System Started!"
echo ""
echo "🌐 Available services:"
echo "   📚 Documentation Portal: http://localhost:$DOCS_PORT/docs"
echo "   🔗 REST API docs: http://localhost:$DOCS_PORT/rest-docs"
echo "   🔌 WebSocket docs: http://localhost:$DOCS_PORT/ws-docs"
echo "   🤖 MCP Bridge: http://localhost:$PORT/health"
echo ""
echo "📌 Next steps:"
echo "1. Install Chrome extension from: https://browsertools.agentdesk.ai/"
echo "2. Set extension port to $PORT in extension settings"
echo "3. Use browser tools in Claude Code"
echo ""
echo "🔍 Check status:"
echo "   curl http://localhost:$PORT/health"
echo "   curl http://localhost:$DOCS_PORT/health"
echo ""
echo "🛑 To stop all services:"
echo "   pkill -f 'docs-server\\|mcp-http-bridge'"
echo ""

# Wait for both processes
wait $DOCS_PID $BRIDGE_PID