#!/bin/bash

# Browser Tools Server - Standalone HTTP Server for browser-tools-mcp
# IMPORTANT: This is NOT an MCP server - it's a separate HTTP server that browser-tools-mcp connects to

echo "🚀 Starting Browser Tools Server (HTTP Server for browser-tools-mcp)..."
echo "======================================================================="
echo ""
echo "⚠️  IMPORTANT: The server ignores port flags and always uses port 3025"
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
echo "Starting Browser Tools Server..."
echo "================================="
echo ""
echo "📝 How browser-tools works:"
echo "1. This HTTP server runs on port 3025 (always)"
echo "2. browser-tools-mcp (MCP server) connects to this HTTP server"
echo "3. Chrome extension connects to this HTTP server"
echo "4. Claude Code ← MCP ← HTTP Server ← Chrome Extension"
echo ""
echo "📌 For manual testing with Chrome:"
echo "1. Install the Chrome extension (BrowserToolsMCP)"
echo "2. Open Chrome and navigate to your test URL"
echo "3. Open Chrome DevTools (F12)"
echo "4. Find the BrowserToolsMCP panel in DevTools"
echo "5. The extension will connect to this server on port 3025"
echo ""
echo "Starting server (will use port 3025)..."
echo "----------------------------------------"

# Start the browser-tools server (it will use port 3025 by default)
npx -y @agentdeskai/browser-tools-server@1.2.1

# Note: This will keep running until you press Ctrl+C