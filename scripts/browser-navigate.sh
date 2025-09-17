#!/bin/bash
# Direct browser navigation via HTTP API
# Usage: ./browser-navigate.sh "https://example.com"

URL="$1"
if [ -z "$URL" ]; then
    echo "Usage: $0 <url>"
    exit 1
fi

curl -X POST http://localhost:3024/navigate \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$URL\"}" \
    2>/dev/null | jq .