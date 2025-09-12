#!/bin/bash

# Browser Tools HTTP Bridge Server
# This HTTP server bridges our custom MCP server to the Chrome extension
# It uses the npm package's HTTP server component (which works fine)

echo "🚀 Starting Browser Tools HTTP Bridge Server..."
echo "================================================"
echo ""
echo "⚠️  IMPORTANT: This server always uses port 3025 (hardcoded)"
echo ""

# Function to check if a process is running on a port
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to find browser-tools processes
find_browser_tools_processes() {
    # Find browser-tools-server processes
    SERVER_PIDS=$(ps aux | grep -E "browser-tools-server|@agentdeskai/browser-tools-server" | grep -v grep | awk '{print $2}')
    
    # Find browser-tools-mcp processes
    MCP_PIDS=$(ps aux | grep -E "browser-tools-mcp|@agentdeskai/browser-tools-mcp" | grep -v grep | awk '{print $2}')
    
    # Check what's on port 3025
    PORT_PID=$(lsof -ti :3025 2>/dev/null)
    
    if [ ! -z "$SERVER_PIDS" ] || [ ! -z "$MCP_PIDS" ] || [ ! -z "$PORT_PID" ]; then
        echo "🔍 Found existing browser-tools processes:"
        echo ""
        
        if [ ! -z "$SERVER_PIDS" ]; then
            echo "   📡 browser-tools-server processes (PIDs: $(echo $SERVER_PIDS | tr '\n' ' '))"
            ps aux | grep -E "browser-tools-server|@agentdeskai/browser-tools-server" | grep -v grep | sed 's/^/      /'
            echo ""
        fi
        
        if [ ! -z "$MCP_PIDS" ]; then
            echo "   🔌 browser-tools-mcp processes (PIDs: $(echo $MCP_PIDS | tr '\n' ' '))"
            ps aux | grep -E "browser-tools-mcp|@agentdeskai/browser-tools-mcp" | grep -v grep | sed 's/^/      /'
            echo ""
        fi
        
        if [ ! -z "$PORT_PID" ] && [ "$PORT_PID" != "$SERVER_PIDS" ]; then
            echo "   🚪 Process using port 3025 (PID: $PORT_PID):"
            lsof -i :3025 | grep -v "^COMMAND" | sed 's/^/      /'
            echo ""
        fi
        
        echo "❓ Would you like to kill these processes before starting a new one?"
        echo "   [y/N] (default: No, exit without starting new server)"
        read -r KILL_RESPONSE
        
        if [[ "$KILL_RESPONSE" =~ ^[Yy]$ ]]; then
            echo ""
            echo "🔪 Killing existing processes..."
            
            # Kill all found processes
            if [ ! -z "$SERVER_PIDS" ]; then
                echo "   Killing browser-tools-server processes..."
                echo $SERVER_PIDS | xargs kill -9 2>/dev/null
            fi
            
            if [ ! -z "$MCP_PIDS" ]; then
                echo "   Killing browser-tools-mcp processes..."
                echo $MCP_PIDS | xargs kill -9 2>/dev/null
            fi
            
            if [ ! -z "$PORT_PID" ]; then
                echo "   Killing process on port 3025..."
                kill -9 $PORT_PID 2>/dev/null
            fi
            
            # Wait a moment for processes to die
            sleep 2
            
            echo "✅ Processes killed"
            echo ""
        else
            echo ""
            echo "ℹ️  Exiting without starting new server."
            echo "   To manually kill processes, use:"
            echo "   pkill -f browser-tools"
            echo "   or"
            echo "   kill -9 <PID>"
            exit 0
        fi
    else
        echo "✅ No existing browser-tools processes found"
    fi
}

# Check for existing browser-tools processes
find_browser_tools_processes

# Check if port 3025 is now available
if check_port 3025; then
    echo "❌ Port 3025 is still in use after cleanup!"
    echo "   Please manually check:"
    echo "   lsof -i :3025"
    exit 1
else
    echo "✅ Port 3025 is available"
fi

echo ""
echo "Starting HTTP Bridge Server..."
echo "==============================="
echo ""
echo "📝 How it works:"
echo "1. Our custom MCP server (browser-tools-mcp-2025.js) auto-starts with Claude Code"
echo "2. This HTTP bridge server runs on port 3025"
echo "3. Chrome extension connects to this HTTP bridge"
echo "4. Claude Code ← [MCP] ← [HTTP Bridge] ← [Chrome Extension]"
echo ""
echo "📌 Chrome Extension Setup:"
echo "1. Install from: https://browsertools.agentdesk.ai/"
echo "2. Extension will auto-connect to localhost:3025"
echo "3. You'll see connection status in the extension icon"
echo ""
echo "Starting HTTP bridge (port 3025)..."
echo "------------------------------------"

# Start the HTTP bridge server (using the working HTTP component from npm package)
# Note: We only use the HTTP server part, NOT the MCP part (which is broken)
npx -y @agentdeskai/browser-tools-server@1.2.1

# Note: This will keep running until you press Ctrl+C