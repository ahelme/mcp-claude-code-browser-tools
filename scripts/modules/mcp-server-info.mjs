/**
 * 🦁 MANE Foundation MCP Server Information
 * Server metadata and configuration
 */

export const serverInfo = {
  name: "MANE Foundation MCP Server",
  version: "2.0.0",
  protocolVersion: "2025-06-18",
  description: "Foundation infrastructure tools for MANE development",
  capabilities: [
    "registry-management",
    "quality-gates",
    "service-worker-lifecycle",
    "interface-validation",
    "health-monitoring"
  ]
};

export const getServerHealth = () => {
  return {
    status: "healthy",
    uptime: Date.now() - (global.startTime || Date.now()),
    timestamp: new Date().toISOString(),
    version: serverInfo.version
  };
};