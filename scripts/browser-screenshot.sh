#!/bin/bash
# Direct browser screenshot via HTTP API
# Usage: ./browser-screenshot.sh [selector] [fullPage]

SELECTOR="$1"
FULLPAGE="${2:-false}"

PAYLOAD="{"
if [ -n "$SELECTOR" ]; then
    PAYLOAD="$PAYLOAD\"selector\":\"$SELECTOR\","
fi
PAYLOAD="$PAYLOAD\"fullPage\":$FULLPAGE}"

curl -X POST http://localhost:3024/capture-screenshot \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    2>/dev/null | jq .