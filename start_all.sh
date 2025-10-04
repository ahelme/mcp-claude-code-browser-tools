#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Browser Tools MCP Stack...${NC}"

# Start HTTP Bridge (port 3024)
echo -e "${YELLOW}🔧 Starting HTTP Bridge on port 3024...${NC}"
./mcp-server/start.sh &
HTTP_BRIDGE_PID=$!
echo -e "${GREEN}✅ HTTP Bridge started (PID: $HTTP_BRIDGE_PID)${NC}"

# Wait for HTTP bridge to be ready
sleep 2

# Start Documentation Server (port 3020)
echo -e "${YELLOW}📖 Starting Documentation Server on port 3020...${NC}"
./start-docs.sh &
DOCS_SERVER_PID=$!
echo -e "${GREEN}✅ Documentation Server started (PID: $DOCS_SERVER_PID)${NC}"

# Wait for services to initialize
sleep 2

# Health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check HTTP Bridge
if curl -s http://localhost:3024/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ HTTP Bridge healthy (port 3024)${NC}"
else
    echo -e "${RED}❌ HTTP Bridge not responding (port 3024)${NC}"
fi

# Check Documentation Server
if curl -s http://localhost:3020/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Documentation Server healthy (port 3020)${NC}"
else
    echo -e "${RED}❌ Documentation Server not responding (port 3020)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo ""
echo -e "${BLUE}📚 Available Services:${NC}"
echo -e "   ${BLUE}🔧 HTTP Bridge:${NC}        http://localhost:3024/health"
echo -e "   ${BLUE}📚 Documentation Portal:${NC} http://localhost:3020/docs"
echo -e "   ${BLUE}🔗 REST API docs:${NC}       http://localhost:3020/rest-docs"
echo -e "   ${BLUE}🔌 WebSocket docs:${NC}      http://localhost:3020/ws-docs"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "   1. Open Chrome DevTools → Browser Tools tab"
echo -e "   2. Configure server port to 3024"
echo -e "   3. Click 'Test Connection' or 'Discover Server'"
echo ""
echo -e "${YELLOW}⏹️  To stop: Press Ctrl+C${NC}"

# Keep script running and handle cleanup
trap "echo -e '\\n${YELLOW}🛑 Stopping services...${NC}'; kill $HTTP_BRIDGE_PID $DOCS_SERVER_PID 2>/dev/null; echo -e '${GREEN}✅ Services stopped${NC}'; exit 0" INT

wait
