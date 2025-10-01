/**
 * Browser Tools MCP Panel - Main Application Logic
 *
 * Connects the beautiful responsive UI (panel.html) to WebSocket functionality.
 * Manages all user interactions, server connections, and tool operations.
 *
 * Features:
 * - WebSocket connection management
 * - Server discovery and connection testing
 * - Settings persistence
 * - UI state management
 * - Real-time status updates
 */

// Application state
let settings = {
  logLimit: 50,
  queryLimit: 30000,
  stringSizeLimit: 500,
  showRequestHeaders: false,
  showResponseHeaders: false,
  maxLogSize: 20000,
  screenshotPath: "",
  serverHost: "localhost",
  serverPort: 3024, // Updated to MCP port
  autoPaste: false,
  addToClipboard: false,
};

let wsManager = null;
let isConnected = false;
let isDiscoveryInProgress = false;
let discoveryController = null;
let navigationHandler = null;

// Directory picker state (not serializable, must be requested each session)
// Removed customDirectoryHandle - using lastScreenshotHandle instead (File System Access API)

// DOM elements (will be initialized when DOM loads)
let elements = {};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Browser Tools Panel initializing...");

  initializeDOM();
  loadSettings();
  initializeWebSocket();
  initializeNavigationHandler();
  setupEventListeners();

  console.log("✅ Browser Tools Panel initialized");
});

function initializeDOM() {
  // Cache all DOM elements
  elements = {
    // Configuration panel
    serverHost: document.getElementById("server-host"),
    serverPort: document.getElementById("server-port"),
    testConnection: document.getElementById("test-connection"),
    discoverServer: document.getElementById("discover-server"),
    scanStatus: document.getElementById("scan-status"),
    scanIndicator: document.getElementById("scan-indicator"),
    scanText: document.getElementById("scan-text"),
    screenshotPathDisplay: document.getElementById("screenshot-path-display"),
    addToClipboardCb: document.getElementById("add-to-clipboard-cb"),
    autoPasteCb: document.getElementById("auto-paste-cb"),

    // Code & Content panel
    auditBtn: document.getElementById("audit-btn"),
    jsInput: document.getElementById("js-input"),
    evaluateBtn: document.getElementById("evaluate-btn"),
    contentFormat: document.getElementById("content-format"),
    getContentBtn: document.getElementById("get-content-btn"),
    selectorInput: document.getElementById("selector-input"),
    selectBtn: document.getElementById("select-btn"),
    screenshotBtn: document.getElementById("screenshot-btn"),
    saveAsBtn: document.getElementById("save-as-btn"),

    // Console & Status panel
    statusIndicator: document.getElementById("status-indicator"),
    statusText: document.getElementById("status-text"),
    verboseCb: document.getElementById("verbose-cb"),
    logLevel: document.getElementById("log-level"),
    getConsoleBtn: document.getElementById("get-console-btn"),
    clearLogsBtn: document.getElementById("clear-logs-btn"),
    logsDisplay: document.getElementById("logs-display"),

    // Advanced panel
    logLimit: document.getElementById("log-limit"),
    queryLimit: document.getElementById("query-limit"),
    showRequestHeaders: document.getElementById("show-request-headers"),
    showResponseHeaders: document.getElementById("show-response-headers"),
  };

  console.log("📋 DOM elements cached:", Object.keys(elements).length);
}

function loadSettings() {
  chrome.storage.local.get(["browserConnectorSettings"], (result) => {
    if (result.browserConnectorSettings) {
      settings = { ...settings, ...result.browserConnectorSettings };
      console.log("⚙️ Settings loaded:", settings);
    }

    updateUIFromSettings();
  });
}

function saveSettings() {
  chrome.storage.local.set({ browserConnectorSettings: settings }, () => {
    console.log("💾 Settings saved");
  });
}

function updateUIFromSettings() {
  // Update all UI elements from settings
  elements.serverHost.value = settings.serverHost;
  elements.serverPort.value = settings.serverPort;
  // Screenshot path is now display-only, showing default Downloads/screenshots/
  elements.addToClipboardCb.checked = settings.addToClipboard;
  elements.autoPasteCb.checked = settings.autoPaste;
  elements.logLimit.value = settings.logLimit;
  elements.queryLimit.value = settings.queryLimit;
  elements.showRequestHeaders.checked = settings.showRequestHeaders;
  elements.showResponseHeaders.checked = settings.showResponseHeaders;
  elements.verboseCb.checked = false; // Always start with verbose off

  // Initialize screenshot location display
  if (elements.screenshotPathDisplay) {
    elements.screenshotPathDisplay.innerHTML = `📥&nbsp;&nbsp;~/Downloads/screenshots/`;
  }

  console.log("🎨 UI updated from settings");
}

function initializeWebSocket() {
  wsManager = new WebSocketManager(settings.serverHost, settings.serverPort);

  // Connection events
  wsManager.on("connected", () => {
    console.log("✅ WebSocket connected!");
    isConnected = true;
    updateConnectionStatus(true, "Connected to HTTP Bridge");
    updateScanStatus("connected", "Connected to server");
  });

  wsManager.on("disconnected", () => {
    console.log("⚠️ WebSocket disconnected");
    isConnected = false;
    updateConnectionStatus(false, "Disconnected from server");
    updateScanStatus("failed", "Disconnected");
  });

  wsManager.on("error", (error) => {
    console.error("❌ WebSocket error:", error);
    updateConnectionStatus(false, `Connection error: ${error.message}`);
  });

  wsManager.on("maxReconnectAttemptsReached", () => {
    console.error("❌ Max reconnection attempts reached");
    updateConnectionStatus(false, "Connection failed - max retries reached");
    updateScanStatus("failed", "Connection failed");
  });

  wsManager.on("message", (message) => {
    handleWebSocketMessage(message);
  });

  // Start connection
  wsManager.connect();
}

function initializeNavigationHandler() {
  if (window.NavigationHandler) {
    navigationHandler = new window.NavigationHandler();
    console.log("🧭 Navigation handler initialized");
  } else {
    console.warn(
      "⚠️ NavigationHandler class not available - navigation functionality disabled"
    );
  }
}

function setupEventListeners() {
  // Configuration panel events
  elements.serverHost.addEventListener("change", (e) => {
    settings.serverHost = e.target.value;
    saveSettings();
    updateWebSocketConnection();
  });

  elements.serverPort.addEventListener("change", (e) => {
    settings.serverPort = parseInt(e.target.value, 10);
    saveSettings();
    updateWebSocketConnection();
  });

  elements.testConnection.addEventListener("click", testConnection);
  elements.discoverServer.addEventListener("click", () =>
    discoverServer(false)
  );

  // Note: screenshotPathDisplay is read-only, no event listener needed

  elements.addToClipboardCb.addEventListener("change", (e) => {
    settings.addToClipboard = e.target.checked;
    saveSettings();
  });

  elements.autoPasteCb.addEventListener("change", (e) => {
    settings.autoPaste = e.target.checked;
    saveSettings();
  });

  // Code & Content panel events
  elements.screenshotBtn.addEventListener("click", captureScreenshot);
  elements.saveAsBtn.addEventListener("click", changeScreenshotFolder);
  elements.evaluateBtn.addEventListener("click", evaluateJavaScript);
  elements.auditBtn.addEventListener("click", runAudit);
  elements.getContentBtn.addEventListener("click", getPageContent);

  // Console & Status panel events
  elements.getConsoleBtn.addEventListener("click", getConsoleLogs);
  elements.clearLogsBtn.addEventListener("click", clearLogs);

  // Advanced panel events
  elements.logLimit.addEventListener("change", (e) => {
    settings.logLimit = parseInt(e.target.value, 10);
    saveSettings();
  });

  elements.queryLimit.addEventListener("change", (e) => {
    settings.queryLimit = parseInt(e.target.value, 10);
    saveSettings();
  });

  elements.showRequestHeaders.addEventListener("change", (e) => {
    settings.showRequestHeaders = e.target.checked;
    saveSettings();
  });

  elements.showResponseHeaders.addEventListener("change", (e) => {
    settings.showResponseHeaders = e.target.checked;
    saveSettings();
  });

  console.log("🎯 Event listeners setup complete");
}

function updateWebSocketConnection() {
  if (wsManager) {
    wsManager.updateServerSettings(settings.serverHost, settings.serverPort);
  }
}

function updateConnectionStatus(connected, message) {
  elements.statusIndicator.className = connected
    ? "status-indicator status-connected"
    : "status-indicator status-disconnected";
  elements.statusText.textContent = message;

  console.log(
    `🔌 Connection status: ${
      connected ? "Connected" : "Disconnected"
    } - ${message}`
  );
}

function updateScanStatus(state, message) {
  const validStates = ["ready-state", "scanning", "connected", "failed"];
  const stateClass = validStates.includes(state) ? state : "ready-state";

  elements.scanIndicator.className = `scan-indicator ${stateClass}`;
  elements.scanText.textContent = message;

  console.log(`🔍 Scan status: ${state} - ${message}`);
}

async function testConnection() {
  updateScanStatus("scanning", "Testing connection...");

  try {
    // Test HTTP health endpoint first
    console.log(
      `🔍 Testing HTTP connection to ${settings.serverHost}:${settings.serverPort}...`
    );
    const response = await fetch(
      `http://${settings.serverHost}:${settings.serverPort}/health`,
      {
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ HTTP server healthy:`, data);

      // Now test WebSocket connection
      console.log(`🔌 Testing WebSocket connection...`);
      const wsTest = await testWebSocketConnection(
        settings.serverHost,
        settings.serverPort
      );

      if (wsTest) {
        console.log(`✅ WebSocket connection test successful`);
        updateScanStatus(
          "connected",
          `Connected to ${data.status || "server"}`
        );
        updateConnectionStatus(
          true,
          `HTTP & WebSocket connected at ${settings.serverHost}:${settings.serverPort}`
        );

        // Force WebSocket reconnection to ensure proper connection
        if (wsManager) {
          wsManager.disconnect();
          setTimeout(() => wsManager.connect(), 500);
        }
      } else {
        console.log(`❌ WebSocket connection test failed`);
        updateScanStatus("failed", "HTTP OK, WebSocket failed");
        updateConnectionStatus(
          false,
          `HTTP server found but WebSocket connection failed at ${settings.serverHost}:${settings.serverPort}`
        );
      }
    } else {
      updateScanStatus("failed", `Server error: ${response.status}`);
      updateConnectionStatus(
        false,
        `Server returned error: ${response.status}`
      );
    }
  } catch (error) {
    const errorMsg =
      error.name === "AbortError"
        ? `Connection timeout after 5000ms`
        : `${error.name}: ${error.message}`;
    console.error(`❌ Connection test failed:`, errorMsg);
    updateScanStatus("failed", `Connection failed: ${errorMsg}`);
    updateConnectionStatus(false, `Connection failed: ${errorMsg}`);
  }
}

async function discoverServer(quietMode = false) {
  if (isDiscoveryInProgress) {
    console.log("🔍 Discovery already in progress");
    return;
  }

  isDiscoveryInProgress = true;
  discoveryController = new AbortController();

  if (!quietMode) {
    updateScanStatus("scanning", "Scanning for server...");
  }

  const hosts = ["localhost", "127.0.0.1"];
  const ports = [3024, 3025, 3026, 3027, 3028, 3029, 3030]; // Prioritize MCP port

  try {
    for (const host of hosts) {
      for (const port of ports) {
        if (!isDiscoveryInProgress) break;

        try {
          console.log(`🔍 Trying HTTP ${host}:${port}...`);

          if (!quietMode) {
            updateScanStatus("scanning", `Checking ${host}:${port}...`);
          }

          // First check HTTP health endpoint
          const response = await fetch(`http://${host}:${port}/health`, {
            signal: AbortSignal.timeout(1000),
          });

          if (response.ok) {
            console.log(`✅ HTTP server found at ${host}:${port}`);

            // Now test WebSocket connection
            console.log(
              `🔌 Testing WebSocket connection to ${host}:${port}...`
            );
            const wsConnectTest = await testWebSocketConnection(host, port);

            if (wsConnectTest) {
              console.log(
                `✅ WebSocket connection successful at ${host}:${port}`
              );

              // Update settings
              settings.serverHost = host;
              settings.serverPort = port;
              elements.serverHost.value = host;
              elements.serverPort.value = port;
              saveSettings();

              // Update WebSocket
              updateWebSocketConnection();

              updateScanStatus("connected", `Connected to ${host}:${port}`);
              isDiscoveryInProgress = false;
              return true;
            } else {
              console.log(
                `⚠️ HTTP found but WebSocket failed at ${host}:${port}`
              );
            }
          }
        } catch (error) {
          // Continue to next port/host
          console.debug(`❌ ${host}:${port} failed:`, error.message);
        }
      }
    }

    updateScanStatus("failed", "No server found");
    console.log("❌ Server discovery failed - no server found");
    return false;
  } catch (error) {
    updateScanStatus("failed", `Discovery error: ${error.message}`);
    console.error("❌ Server discovery error:", error);
    return false;
  } finally {
    isDiscoveryInProgress = false;
    discoveryController = null;
  }
}

// Test WebSocket connection to verify server is reachable
function testWebSocketConnection(host, port) {
  return new Promise((resolve) => {
    const testWs = new WebSocket(`ws://${host}:${port}/extension-ws`);

    const timeout = setTimeout(() => {
      console.log(`⏱️ WebSocket test timeout for ${host}:${port}`);
      testWs.close();
      resolve(false);
    }, 2000);

    testWs.onopen = () => {
      console.log(`✅ WebSocket test connection opened for ${host}:${port}`);
      clearTimeout(timeout);
      testWs.close();
      resolve(true);
    };

    testWs.onerror = (error) => {
      console.log(`❌ WebSocket test error for ${host}:${port}:`, error);
      clearTimeout(timeout);
      resolve(false);
    };

    testWs.onclose = () => {
      console.log(`🔌 WebSocket test connection closed for ${host}:${port}`);
    };
  });
}

// Tool functions (placeholders for now - will be implemented by other agents)
async function captureScreenshot() {
  if (!window.screenshotManager) {
    addLogEntry("error", "Screenshot manager not available");
    return;
  }

  elements.screenshotBtn.textContent = "Capturing...";

  try {
    // Use screenshot manager - automatically saves to ~/Downloads/screenshots/
    const result = await window.screenshotManager.captureScreenshot({
      fullPage: false,
      source: "panel",
    });

    if (result.success) {
      console.log(
        "[Screenshot] Saved to:",
        result.path || "~/Downloads/screenshots/"
      );

      // Copy to clipboard if requested
      if (settings.addToClipboard) {
        await copyScreenshotToClipboard(result.data);
      }

      elements.screenshotBtn.textContent = "✅ Captured!";
    } else {
      console.error("[Screenshot] Capture failed:", result.error);
      addLogEntry(
        "error",
        `Screenshot failed: ${result.error || "Unknown error"}`
      );
      elements.screenshotBtn.textContent = "❌ Failed";
    }
  } catch (error) {
    console.error("[Screenshot] Error:", error);
    addLogEntry("error", `Screenshot error: ${error.message}`);
    elements.screenshotBtn.textContent = "❌ Failed";
  }

  setTimeout(() => {
    elements.screenshotBtn.textContent = "Take screenshot 📸";
  }, 2000);
}

// Screenshot save functionality - uses Chrome Downloads API via background.js
// Screenshots automatically save to ~/Downloads/screenshots/ folder

async function changeScreenshotFolder() {
  console.log("[Screenshot] Opening folder selection dialog...");

  addLogEntry(
    "info",
    "Folder selection feature coming soon - screenshots currently save to ~/Downloads/screenshots/"
  );

  // TODO: Implement custom folder selection using Chrome Downloads API shelf
  // This will allow users to change the default Downloads/screenshots location
}

async function copyScreenshotToClipboard(dataUrl) {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Copy to clipboard using modern Clipboard API
    const clipboardItem = new ClipboardItem({
      [blob.type]: blob,
    });

    await navigator.clipboard.write([clipboardItem]);
    addLogEntry("info", "Screenshot copied to clipboard");
    console.log("✅ Screenshot copied to clipboard");
  } catch (error) {
    console.error("❌ Failed to copy to clipboard:", error);
    addLogEntry("error", `Failed to copy to clipboard: ${error.message}`);
  }
}

// Removed old functions - replaced with File System Access API approach

function evaluateJavaScript() {
  const script = elements.jsInput.value.trim();
  if (!script) {
    addLogEntry("error", "Enter JavaScript code to evaluate");
    return;
  }

  if (!isConnected) {
    addLogEntry("error", "Not connected to server");
    return;
  }

  addLogEntry("info", `Evaluating: ${script}`);

  // TODO: This will be implemented by Agent B (Evaluation Specialist)
  // For now, just show a placeholder
  addLogEntry(
    "info",
    "JavaScript evaluation tool will be implemented by Agent B"
  );
}

function runAudit() {
  if (!isConnected) {
    addLogEntry("error", "Not connected to server");
    return;
  }

  addLogEntry("info", "Running Lighthouse audit...");

  // TODO: This will be implemented by Agent C (Audit Specialist)
  addLogEntry("info", "Audit tool will be implemented by Agent C");
}

function getPageContent() {
  if (!isConnected) {
    addLogEntry("error", "Not connected to server");
    return;
  }

  const format = elements.contentFormat.value;
  addLogEntry("info", `Getting page content (${format})...`);

  // TODO: This will be implemented by Agent E (Content Extractor)
  addLogEntry("info", "Content extraction tool will be implemented by Agent E");
}

function getConsoleLogs() {
  if (!isConnected) {
    addLogEntry("error", "Not connected to server");
    return;
  }

  addLogEntry("info", "Getting console logs...");

  // TODO: This will be implemented by Agent D (Console Detective)
  addLogEntry("info", "Console monitoring tool will be implemented by Agent D");
}

function clearLogs() {
  // CSP-compliant DOM manipulation
  elements.logsDisplay.textContent = "";
  const clearedDiv = document.createElement("div");
  clearedDiv.className = "log-entry log-info";
  clearedDiv.textContent = "Logs cleared...";
  elements.logsDisplay.appendChild(clearedDiv);
  addLogEntry("info", "Logs cleared");
}

function handleWebSocketMessage(message) {
  console.log("📨 Handling WebSocket message:", message);

  // Enhanced message validation
  if (!message || typeof message !== "object") {
    const error = "Invalid message format received";
    console.error("❌", error);
    addLogEntry("error", error);
    return;
  }

  const messageType = message.type || message.action;
  const requestId = message.requestId || `unknown_${Date.now()}`;

  addLogEntry("info", `Processing ${messageType} request (ID: ${requestId})`);

  // Handle different message types and actions
  switch (messageType) {
    case "navigate":
      // Navigation request from MCP server
      if (navigationHandler) {
        navigationHandler.handleNavigationRequest(message, (response) => {
          // Enhanced response handling with error recovery
          try {
            if (wsManager && wsManager.isConnected) {
              const enhancedResponse = {
                type: "navigationResult",
                ...response,
                handledAt: Date.now(),
                handledBy: "NavigationHandler v1.1.0",
              };

              wsManager.send(enhancedResponse);
              addLogEntry(
                "info",
                `Navigation response sent for request ${requestId}: ${
                  response.success ? "SUCCESS" : "FAILED"
                }`
              );
            } else {
              throw new Error("WebSocket not available for response");
            }
          } catch (error) {
            console.error("❌ Failed to send navigation response:", error);
            addLogEntry(
              "error",
              `Failed to send response for request ${requestId}: ${error.message}`
            );

            // Try to recover WebSocket connection
            if (wsManager && !wsManager.isConnected) {
              addLogEntry("info", "Attempting to reconnect WebSocket...");
              wsManager.connect();
            }
          }
        });
      } else {
        const errorMsg = "Navigation handler not available";
        console.error("❌", errorMsg);
        addLogEntry("error", errorMsg);

        // Send error response if possible
        if (wsManager && wsManager.isConnected) {
          wsManager.send({
            type: "navigationResult",
            success: false,
            error: errorMsg,
            requestId,
            timestamp: Date.now(),
          });
        }
      }
      break;

    case "click":
      // Click request from MCP server
      handleInteractionRequest("BROWSER_CLICK", message, "clickResult");
      break;

    case "type":
      // Type request from MCP server
      handleInteractionRequest("BROWSER_TYPE", message, "typeResult");
      break;

    case "wait":
      // Wait request from MCP server
      handleInteractionRequest("BROWSER_WAIT", message, "waitResult");
      break;

    case "screenshot":
    case "take-screenshot":
      // Screenshot request from MCP server - delegate to screenshot manager
      if (window.screenshotManager) {
        window.screenshotManager.handleWebSocketMessage(message);
      } else {
        addLogEntry("error", "Screenshot manager not available");
      }
      break;

    case "screenshot-data":
      addLogEntry("info", "Screenshot data received");
      break;

    case "evaluateResult":
      addLogEntry("info", `JS Result: ${JSON.stringify(message.result)}`);
      break;

    case "pageContent":
      addLogEntry("info", "Page content received");
      break;

    case "consoleLog":
      addLogEntry("info", `Console: ${message.data.message}`);
      break;

    default:
      const unknownType = messageType || "undefined";
      const warningMsg = `Unknown message type/action: ${unknownType}`;
      console.warn("🤔", warningMsg);
      addLogEntry("error", warningMsg);

      // Send error response for unknown message types if possible
      if (wsManager && wsManager.isConnected && requestId !== "undefined") {
        wsManager.send({
          type: "unknownMessageError",
          success: false,
          error: `Unsupported message type: ${unknownType}`,
          requestId,
          timestamp: Date.now(),
          originalMessage: {
            type: message.type,
            action: message.action,
          },
        });
      }
  }
}

function addLogEntry(level, message) {
  const timestamp = new Date().toLocaleTimeString();
  const logClass = level === "error" ? "log-error" : "log-info";

  const logEntry = document.createElement("div");
  logEntry.className = `log-entry ${logClass}`;
  logEntry.textContent = `[${timestamp}] ${message}`;

  elements.logsDisplay.appendChild(logEntry);
  elements.logsDisplay.scrollTop = elements.logsDisplay.scrollHeight;

  console.log(`📝 Log entry [${level}]: ${message}`);
}

// Make addLogEntry globally accessible for navigation handler
window.addLogEntry = addLogEntry;

// Handle interaction requests from MCP server via WebSocket
function handleInteractionRequest(messageType, message, responseType) {
  console.log(`🖱️ Handling ${messageType} request:`, message);

  addLogEntry("info", `${messageType} request: ${message.selector || "N/A"}`);

  // Send request to background script
  chrome.runtime.sendMessage(
    {
      type: messageType,
      tabId: chrome.devtools.inspectedWindow.tabId,
      ...message,
    },
    (response) => {
      console.log(`🖱️ ${messageType} response:`, response);

      if (response && response.success) {
        addLogEntry("info", `${messageType} completed successfully`);

        // Send success response back via WebSocket
        if (wsManager) {
          wsManager.send({
            type: responseType,
            success: true,
            result: response,
            requestId: message.requestId || Date.now(),
          });
        }
      } else {
        const errorMessage = response?.error || "Unknown error";
        addLogEntry("error", `${messageType} failed: ${errorMessage}`);

        // Send error response back via WebSocket
        if (wsManager) {
          wsManager.send({
            type: responseType,
            success: false,
            error: errorMessage,
            requestId: message.requestId || Date.now(),
          });
        }
      }
    }
  );
}

// Diagnostic function to help troubleshoot connection issues
function runConnectionDiagnostics() {
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
  if (wsManager) {
    const state = wsManager.connectionState;
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
      console.log("✅ HTTP Health Check: PASSED");
      console.log(`   Server status: ${data.status}`);
      console.log(`   Connected: ${data.connected}`);
      console.log(`   Current URL: ${data.currentUrl}`);
    })
    .catch((error) => {
      console.log("❌ HTTP Health Check: FAILED");
      console.log(`   Error: ${error.message}`);
    });

  console.log("=".repeat(50));
  addLogEntry(
    "info",
    "Connection diagnostics completed - check console for details"
  );
}

// Add diagnostic button to UI (if in development mode)
if (chrome.runtime.getManifest().name.includes("Development")) {
  setTimeout(() => {
    const diagnosticBtn = document.createElement("button");
    diagnosticBtn.textContent = "🔬 Run Diagnostics";
    diagnosticBtn.onclick = runConnectionDiagnostics;
    diagnosticBtn.style.margin = "10px";
    diagnosticBtn.style.padding = "5px 10px";
    document.body.appendChild(diagnosticBtn);
  }, 1000);
}

// Disable auto-connection for now to allow extension to load
console.log("🔍 Auto-discovery disabled - manual connection required");
// setTimeout(() => {
//   if (!isConnected) {
//     console.log("🔍 Auto-discovering server...");
//     discoverServer(true);
//   }
// }, 2000);

console.log("🎯 Panel script loaded successfully");
