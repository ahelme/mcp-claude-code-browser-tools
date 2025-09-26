#!/bin/bash

# Start MANE API Documentation Server
#
# This serves interactive Swagger UI docs at http://localhost:3025/docs
# AI agents can auto-discover the API spec at /openapi.yaml

echo "🚀 Starting MANE API Documentation Server..."
echo ""
echo "📚 Interactive docs will be available at:"
echo "   http://localhost:3020/docs"
echo ""
echo "📄 Raw OpenAPI spec available at:"
echo "   http://localhost:3020/openapi.yaml"
echo ""
echo "🤖 AI-discoverable endpoints:"
echo "   http://localhost:3020/health"
echo "   http://localhost:3020/openapi.json"
echo ""
echo "🛑 To stop: pkill -f docs-server"
echo ""

node docs-server.mjs