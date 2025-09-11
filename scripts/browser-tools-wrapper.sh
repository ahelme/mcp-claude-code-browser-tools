#!/bin/bash

# Browser Tools MCP Wrapper Script
# This script starts both the Aggregator Server and the MCP Server
# It ensures the Aggregator is running before starting the MCP

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Get assigned port for this project
PORT=$("$SCRIPT_DIR/get-browser-tools-port.sh" 2>/dev/null | tail -n 1)

# Check if port was retrieved successfully
if [ -z "$PORT" ]; then
    echo "Error: Could not retrieve port assignment" >&2
    PORT=3040  # Fallback to default
fi

# Function to check if Aggregator is already running
is_aggregator_running() {
    lsof -i :$PORT >/dev/null 2>&1
}

# Start Aggregator Server in background if not already running
if ! is_aggregator_running; then
    echo "Starting Browser Tools Aggregator on port $PORT..." >&2
    
    # Start the aggregator in background and redirect output to log file
    LOG_FILE="$PROJECT_DIR/.aggregator.log"
    PORT=$PORT npx @agentdeskai/browser-tools-server@latest > "$LOG_FILE" 2>&1 &
    AGGREGATOR_PID=$!
    
    # Wait a moment for the server to start
    sleep 2
    
    # Check if it started successfully
    if is_aggregator_running; then
        echo "✅ Aggregator Server started successfully on port $PORT (PID: $AGGREGATOR_PID)" >&2
    else
        echo "⚠️ Warning: Aggregator Server may not have started correctly" >&2
    fi
else
    echo "ℹ️ Aggregator Server already running on port $PORT" >&2
fi

# Now start the MCP server (this is what Claude actually calls)
exec npx -y @agentdeskai/browser-tools-mcp@1.2.1 "$@"