/**
 * 🦁 MANE Foundation MCP Server Information
 *
 * Provides server metadata, configuration, and health monitoring
 * for the MANE Foundation MCP server. This module is essential
 * for server identification and monitoring.
 *
 * **Agent Usage:**
 * - Agent A: Foundation infrastructure management
 * - Agent A.2: Server health monitoring during enhancement
 * - Integration workflows: Server capability discovery
 * - Monitoring systems: Health check endpoints
 *
 * **Module Responsibilities:**
 * - Server identification and versioning
 * - Capability advertisement
 * - Health status reporting
 * - Uptime tracking
 */

/**
 * Core server information for MANE Foundation MCP Server
 *
 * **Important:** Update version when making breaking changes
 * **Protocol Version:** Must match MCP specification (2025-06-18)
 *
 * @constant
 */
export const serverInfo = {
  /** Human-readable server name for identification */
  name: "MANE Foundation MCP Server",

  /** Semantic version - increment for releases */
  version: "2.0.0",

  /** MCP protocol version - must match spec */
  protocolVersion: "2025-06-18",

  /** Server description for capability discovery */
  description: "Foundation infrastructure tools for MANE development",

  /** Advertised capabilities for agent coordination */
  capabilities: [
    "registry-management",      // Tool registration and discovery
    "quality-gates",           // Validation pipeline execution
    "service-worker-lifecycle", // Service worker management
    "interface-validation",     // Interface compliance checking
    "health-monitoring"        // Server health reporting
  ]
};

/**
 * Gets current server health status with uptime metrics
 *
 * **Health Indicators:**
 * - Status: Always "healthy" (expand for failure states)
 * - Uptime: Milliseconds since global.startTime
 * - Timestamp: ISO format for log correlation
 * - Version: For deployment tracking
 *
 * **Agent Usage:**
 * Call this for health checks before running quality gates
 * or during server initialization validation.
 *
 * @returns {Object} Health status object with metrics
 *
 * @example
 * ```javascript
 * const health = getServerHealth();
 * if (health.status === 'healthy') {
 *   console.log(`Server up for ${health.uptime}ms`);
 * }
 * ```
 */
export const getServerHealth = () => {
  return {
    /** Current health status - expand for error states */
    status: "healthy",

    /** Uptime in milliseconds since server start */
    uptime: Date.now() - (global.startTime || Date.now()),

    /** ISO timestamp for log correlation */
    timestamp: new Date().toISOString(),

    /** Current server version for deployment tracking */
    version: serverInfo.version
  };
};