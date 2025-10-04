#!/bin/bash

# Start MANE API Documentation Server
#
# This serves complete protocol docs at http://localhost:3020/docs
# AI agents can auto-discover the API spec at /openapi.yaml

echo "🚀 Starting Browser Tools Complete API Documentation Server..."
echo ""
echo "📚 Documentation Portal:"
echo "   http://localhost:3020/docs - Combined REST & WebSocket docs"
echo ""
echo "🔗 Protocol Documentation:"
echo "   http://localhost:3020/rest-docs - REST API (OpenAPI/Swagger)"
echo "   http://localhost:3020/ws-docs - WebSocket Protocol (AsyncAPI)"
echo ""
echo "📄 Raw Protocol Contracts:"
echo "   http://localhost:3020/openapi.yaml - REST API spec"
echo "   http://localhost:3020/asyncapi.yaml - WebSocket protocol spec"
echo ""
echo "🤖 AI-discoverable endpoints:"
echo "   http://localhost:3020/health - Complete protocol metadata"
echo "   http://localhost:3020/openapi.json - REST API JSON"
echo "   http://localhost:3020/asyncapi.json - WebSocket protocol JSON"
echo ""
echo "🛑 To stop: pkill -f docs-server"
echo ""

node docs-server.mjs