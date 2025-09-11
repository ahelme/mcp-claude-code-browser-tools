#!/bin/bash

# Get the assigned port for browser-tools in this project
# Creates and manages port assignments in ~/.claude/browser-tools-ports/

REGISTRY_DIR="$HOME/.claude/browser-tools-ports"
REGISTRY_FILE="$REGISTRY_DIR/registry.json"
PROJECT_DIR=$(pwd)

# Create registry directory if it doesn't exist
mkdir -p "$REGISTRY_DIR"

# Initialize registry file if it doesn't exist
if [ ! -f "$REGISTRY_FILE" ]; then
    echo '{
  "ports": {},
  "nextAvailablePort": 3025,
  "lastUpdated": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
}' > "$REGISTRY_FILE"
fi

# Function to check if port is in use
is_port_in_use() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to find next available port
find_next_available_port() {
    local port=$1
    while is_port_in_use $port; do
        port=$((port + 1))
    done
    echo $port
}

# Check if this project already has an assigned port
ASSIGNED_PORT=$(python3 -c "
import json
import sys

with open('$REGISTRY_FILE', 'r') as f:
    data = json.load(f)
    
for port, path in data['ports'].items():
    if path == '$PROJECT_DIR':
        print(port)
        sys.exit(0)
        
print('')
")

if [ -n "$ASSIGNED_PORT" ]; then
    echo "✅ Project already has assigned port: $ASSIGNED_PORT"
    
    # Check if the port is actually available
    if is_port_in_use $ASSIGNED_PORT; then
        echo "⚠️  Warning: Port $ASSIGNED_PORT is in use by another process"
        echo "   You may need to stop that process or reassign the port"
    fi
    
    echo $ASSIGNED_PORT
    exit 0
fi

# Assign a new port for this project
echo "🔍 Finding available port for project: $PROJECT_DIR"

# Get next available port from registry
NEXT_PORT=$(python3 -c "
import json

with open('$REGISTRY_FILE', 'r') as f:
    data = json.load(f)
    print(data.get('nextAvailablePort', 3025))
")

# Find an actually available port starting from NEXT_PORT
NEW_PORT=$(find_next_available_port $NEXT_PORT)

# Update registry with new assignment
python3 -c "
import json
from datetime import datetime

with open('$REGISTRY_FILE', 'r') as f:
    data = json.load(f)

data['ports'][str($NEW_PORT)] = '$PROJECT_DIR'
data['nextAvailablePort'] = $NEW_PORT + 1
data['lastUpdated'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

with open('$REGISTRY_FILE', 'w') as f:
    json.dump(data, f, indent=2)
"

echo "✅ Assigned port $NEW_PORT to project: $PROJECT_DIR"
echo $NEW_PORT