/**
 * Connection Manager - Panel Module
 *
 * Manages WebSocket connections, server discovery, and connection testing.
 * Extracted from panel.js to create focused, maintainable module.
 *
 * @module panel/connection-manager
 * @version 1.0.0
 * @since 2025-10-02
 */

/**
 * Connection manager for WebSocket and HTTP server communication
 *
 * Features:
 * - WebSocket connection lifecycle management
 * - Server discovery with port scanning
 * - Connection testing and diagnostics
 * - Status updates and UI synchronization
 * - Automatic reconnection handling
 *
 * @class ConnectionManager
 *
 * @example
 * const connManager = new ConnectionManager(wsManager, elements);
 * await connManager.testConnection();
 * await connManager.discoverServer();
 */
class ConnectionManager {
  /**
   * Create a new connection manager
   *
   * @param {WebSocketManager} wsManager - WebSocket manager instance
   * @param {Object} uiElements - UI elements for status updates
   * @param {Function} logCallback - Callback for log entries
   */
  constructor(wsManager, uiElements, logCallback) {
    this.wsManager = wsManager;
    this.elements = uiElements;
    this.addLogEntry = logCallback;

    this.isDiscoveryInProgress = false;
    this.discoveryController = null;

    console.log("🔌 ConnectionManager initialized");
  }

  /**
   * Update connection status in UI
   *
   * @param {boolean} connected - Connection state
   * @param {string} message - Status message
   *
   * @example
   * connManager.updateConnectionStatus(true, 'Connected to server');
   *
   * @since 1.0.0
   */
  updateConnectionStatus(connected, message) {
    if (!this.elements.statusIndicator || !this.elements.statusText) {
      console.warn("⚠️ ConnectionManager: Status elements not available");
      return;
    }

    this.elements.statusIndicator.className = connected
      ? "status-indicator status-connected"
      : "status-indicator status-disconnected";
    this.elements.statusText.textContent = message;

    console.log(
      `🔌 Connection status: ${
        connected ? "Connected" : "Disconnected"
      } - ${message}`
    );
  }

  /**
   * Update scan status in UI
   *
   * @param {string} state - Scan state: 'scanning', 'connected', 'failed', 'idle'
   * @param {string} message - Status message
   *
   * @example
   * connManager.updateScanStatus('scanning', 'Discovering server...');
   *
   * @since 1.0.0
   */
  updateScanStatus(state, message) {
    if (!this.elements.scanIndicator || !this.elements.scanText) {
      console.warn("⚠️ ConnectionManager: Scan status elements not available");
      return;
    }

    const stateClasses = {
      scanning: "scanning",
      connected: "connected",
      failed: "failed",
      idle: "ready-state",
    };

    const stateClass = stateClasses[state] || "ready-state";

    this.elements.scanIndicator.className = `scan-indicator ${stateClass}`;
    this.elements.scanText.textContent = message;

    console.log(`🔍 Scan status: ${state} - ${message}`);
  }

  /**
   * Test connection to HTTP and WebSocket servers
   *
   * Tests both HTTP health endpoint and WebSocket connection.
   * Updates UI with connection status and provides detailed feedback.
   *
   * @param {string} serverHost - Server host
   * @param {string} serverPort - Server port
   * @returns {Promise<Object>} Test result with success status
   *
   * @example
   * const result = await connManager.testConnection('localhost', 3024);
   * if (result.success) {
   *   console.log('Connection successful!');
   * }
   *
   * @since 1.0.0
   */
  async testConnection(serverHost, serverPort) {
    this.updateScanStatus("scanning", "Testing connection...");

    if (this.addLogEntry) {
      this.addLogEntry(
        "info",
        `🔍 Testing connection to ${serverHost}:${serverPort}...`
      );
    }

    try {
      // Test HTTP health endpoint first
      console.log(
        `🔍 Testing HTTP connection to ${serverHost}:${serverPort}...`
      );
      const response = await fetch(
        `http://${serverHost}:${serverPort}/health`,
        {
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ HTTP server healthy:`, data);

        // Now test WebSocket connection
        console.log(`🔌 Testing WebSocket connection...`);
        const wsTest = await this.testWebSocketConnection(
          serverHost,
          serverPort
        );

        if (wsTest) {
          console.log(`✅ WebSocket connection test successful`);
          this.updateScanStatus(
            "connected",
            `Connected to ${serverHost}:${serverPort}`
          );
          this.updateConnectionStatus(
            true,
            `HTTP & WebSocket connected at ${serverHost}:${serverPort}`
          );

          if (this.addLogEntry) {
            this.addLogEntry(
              "info",
              `✅ Successfully connected to ${serverHost}:${serverPort}`
            );
          }

          return { success: true, data };
        } else {
          console.log(`❌ WebSocket connection test failed`);
          this.updateScanStatus("failed", "HTTP OK, WebSocket failed");
          this.updateConnectionStatus(
            false,
            `HTTP server found but WebSocket connection failed at ${serverHost}:${serverPort}`
          );
          return { success: false, error: "WebSocket connection failed" };
        }
      } else {
        this.updateScanStatus("failed", `Server error: ${response.status}`);
        this.updateConnectionStatus(
          false,
          `Server returned error: ${response.status}`
        );
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      const errorMsg =
        error.name === "AbortError"
          ? `Connection timeout after 5000ms`
          : `${error.name}: ${error.message}`;
      console.error(`❌ Connection test failed:`, errorMsg);
      this.updateScanStatus("failed", `Connection failed: ${errorMsg}`);
      this.updateConnectionStatus(false, `Connection failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Discover MCP server on localhost
   *
   * Scans common ports to find running MCP server.
   * Provides feedback during discovery and updates settings on success.
   *
   * @param {boolean} [quietMode=false] - Suppress UI updates during discovery
   * @param {Function} updateSettingsCallback - Callback to update settings
   * @param {Function} updateUICallback - Callback to update UI elements
   * @returns {Promise<Object>} Discovery result with host/port if found
   *
   * @example
   * const result = await connManager.discoverServer(
   *   false,
   *   (host, port) => settingsManager.setMany({serverHost: host, serverPort: port}, true),
   *   (host, port) => { hostInput.value = host; portInput.value = port; }
   * );
   *
   * @since 1.0.0
   */
  async discoverServer(
    quietMode = false,
    updateSettingsCallback,
    updateUICallback
  ) {
    if (this.isDiscoveryInProgress) {
      console.log("🔍 Discovery already in progress");
      return { success: false, error: "Discovery already in progress" };
    }

    this.isDiscoveryInProgress = true;
    this.discoveryController = new AbortController();

    if (!quietMode) {
      this.updateScanStatus("scanning", "Discovering server on localhost...");
      if (this.addLogEntry) {
        this.addLogEntry(
          "info",
          "🔍 Starting server discovery on localhost..."
        );
      }
    }

    // Common MCP server ports to scan
    const portsToScan = [3024, 3000, 3001, 8080, 8000, 5000];
    const host = "localhost";

    try {
      for (const port of portsToScan) {
        if (this.discoveryController.signal.aborted) {
          console.log("🛑 Discovery cancelled by user");
          if (!quietMode) {
            this.updateScanStatus("idle", "Discovery cancelled");
          }
          return { success: false, error: "Discovery cancelled" };
        }

        console.log(`🔍 Checking port ${port}...`);
        if (!quietMode) {
          this.updateScanStatus("scanning", `Checking port ${port}...`);
        }

        try {
          // Quick HTTP health check
          const response = await fetch(`http://${host}:${port}/health`, {
            signal: AbortSignal.timeout(2000),
          });

          if (response.ok) {
            console.log(`✅ HTTP server found at ${host}:${port}`);

            // Test WebSocket connection
            const wsConnectTest = await this.testWebSocketConnection(
              host,
              port
            );

            if (wsConnectTest) {
              console.log(
                `✅ WebSocket connection successful at ${host}:${port}`
              );

              // Update settings via callback
              if (updateSettingsCallback) {
                updateSettingsCallback(host, port);
              }

              // Update UI via callback
              if (updateUICallback) {
                updateUICallback(host, port);
              }

              // Update WebSocket connection
              if (this.wsManager) {
                this.wsManager.updateServerSettings(host, port);
              }

              this.updateScanStatus(
                "connected",
                `Connected to ${host}:${port}`
              );
              this.isDiscoveryInProgress = false;

              if (this.addLogEntry) {
                this.addLogEntry(
                  "info",
                  `✅ Server discovered at ${host}:${port}`
                );
              }

              return { success: true, host, port };
            } else {
              console.log(
                `⚠️ HTTP found but WebSocket failed at ${host}:${port}`
              );
            }
          }
        } catch (error) {
          // Port not available or connection failed - continue scanning
          console.log(`❌ Port ${port} check failed:`, error.message);
        }
      }

      // No server found
      console.log("❌ No MCP server found on scanned ports");
      this.updateScanStatus("failed", "No server found on common ports");

      if (this.addLogEntry) {
        this.addLogEntry(
          "error",
          "❌ No MCP server found. Please start the server and try again."
        );
      }

      this.isDiscoveryInProgress = false;
      return { success: false, error: "No server found" };
    } catch (error) {
      console.error("❌ Discovery error:", error);
      this.updateScanStatus("failed", "Discovery error");
      this.isDiscoveryInProgress = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel ongoing server discovery
   *
   * @example
   * connManager.cancelDiscovery();
   *
   * @since 1.0.0
   */
  cancelDiscovery() {
    if (this.discoveryController) {
      this.discoveryController.abort();
      console.log("🛑 Discovery cancelled");
    }
  }

  /**
   * Test WebSocket connection
   *
   * @private
   * @param {string} host - Server host
   * @param {number} port - Server port
   * @returns {Promise<boolean>} True if connection successful
   */
  testWebSocketConnection(host, port) {
    return new Promise((resolve) => {
      const wsUrl = `ws://${host}:${port}/extension-ws`;
      console.log(`🔌 Testing WebSocket connection to ${wsUrl}...`);

      const testWs = new WebSocket(wsUrl);
      const timeout = setTimeout(() => {
        testWs.close();
        resolve(false);
      }, 3000);

      testWs.onopen = () => {
        clearTimeout(timeout);
        console.log(`✅ WebSocket test connection opened`);
        testWs.close();
        resolve(true);
      };

      testWs.onerror = (error) => {
        clearTimeout(timeout);
        console.log(`❌ WebSocket test connection error:`, error);
        resolve(false);
      };

      testWs.onclose = () => {
        console.log(`🔌 WebSocket test connection closed`);
      };
    });
  }

  /**
   * Run connection diagnostics
   *
   * Provides detailed diagnostic information about current connection state.
   *
   * @param {Object} settings - Current settings
   *
   * @example
   * connManager.runDiagnostics({ serverHost: 'localhost', serverPort: 3024 });
   *
   * @since 1.0.0
   */
  runDiagnostics(settings) {
    console.log("\n🔬 RUNNING CONNECTION DIAGNOSTICS");
    console.log("=".repeat(50));

    // 1. Check current settings
    console.log("📋 Current Settings:");
    console.log(`   Host: ${settings.serverHost}`);
    console.log(`   Port: ${settings.serverPort}`);
    console.log(
      `   Expected URL: ws://${settings.serverHost}:${settings.serverPort}/extension-ws`
    );

    // 2. Check WebSocket Manager state
    if (this.wsManager) {
      const state = this.wsManager.connectionState;
      console.log("🔌 WebSocket Manager State:");
      console.log(`   Connected: ${state.isConnected}`);
      console.log(`   Reconnect attempts: ${state.reconnectAttempts}`);
      console.log(
        `   Ready state: ${state.readyState} (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)`
      );
      console.log(`   Queued messages: ${state.queuedMessages}`);
    } else {
      console.log("❌ WebSocket Manager not initialized");
    }

    // 3. Test HTTP endpoint
    fetch(`http://${settings.serverHost}:${settings.serverPort}/health`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      })
      .then((data) => {
        console.log("✅ HTTP Health Check: OK");
        console.log("   Response:", data);
      })
      .catch((error) => {
        console.log("❌ HTTP Health Check: FAILED");
        console.log("   Error:", error.message);
      });

    console.log("=".repeat(50));
    console.log("💡 Check the output above for connection issues\n");
  }

  /**
   * Update WebSocket connection settings
   *
   * @param {string} host - New server host
   * @param {number} port - New server port
   *
   * @example
   * connManager.updateWebSocketConnection('localhost', 3025);
   *
   * @since 1.0.0
   */
  updateWebSocketConnection(host, port) {
    if (this.wsManager) {
      this.wsManager.updateServerSettings(host, port);
      console.log(`🔌 WebSocket settings updated: ${host}:${port}`);
    }
  }

  /**
   * Check if discovery is in progress
   *
   * @returns {boolean} True if discovery is running
   *
   * @since 1.0.0
   */
  isDiscovering() {
    return this.isDiscoveryInProgress;
  }
}

// Export for use in other modules
window.ConnectionManager = ConnectionManager;
