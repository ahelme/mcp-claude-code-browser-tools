#!/bin/bash

echo "🚀 Starting Direct Browser Tools (Method 2: Direct HTTP)"
echo "========================================================"
echo ""
echo "⚠️  This starts the Direct HTTP Bridge on port 3026"
echo "   For direct API access without MCP layer"
echo ""

# Check if port 3026 is in use
if lsof -i :3026 >/dev/null 2>&1; then
    echo "🔍 Found existing process on port 3026:"
    echo ""
    lsof -i :3026
    echo ""
    echo "❓ Would you like to kill this process before starting?"
    echo "   [y/N] (default: No, exit without starting new server)"
    echo ""
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "🔪 Killing existing processes..."
        pkill -f "direct-http-bridge"
        sleep 2
    else
        echo "ℹ️  Exiting without starting new server."
        echo "   To manually kill processes, use: pkill -f direct-http-bridge"
        exit 0
    fi
fi

echo "🚀 Starting Direct HTTP Bridge on port 3026..."
node scripts/direct-http-bridge.js &
DIRECT_BRIDGE_PID=$!

echo "✅ Direct HTTP Bridge started (PID: $DIRECT_BRIDGE_PID)"
echo ""
echo "📌 Next steps:"
echo "1. Install Chrome extension from: https://browsertools.agentdesk.ai/"
echo "2. Set extension port to: 3026"
echo "3. Use HTTP API directly:"
echo "   curl -X POST http://localhost:3026/navigate -d '{\"url\":\"https://example.com\"}' -H 'Content-Type: application/json'"
echo ""
echo "🔍 Check status:"
echo "   curl http://localhost:3026/health"
echo ""
echo "🛑 To stop: pkill -f direct-http-bridge"

# Wait for process to start
sleep 2

# Keep script running to show any immediate errors
wait $DIRECT_BRIDGE_PID