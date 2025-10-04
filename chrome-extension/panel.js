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
let settingsManager = null;
let logDisplayManager = null;
let connectionManager = null;
let wsManager = null;
let isConnected = false;
let navigationHandler = null;
let visualMessagePanel = null;

// Directory picker state (not serializable, must be requested each session)
// Removed customDirectoryHandle - using lastScreenshotHandle instead (File System Access API)

// DOM elements (will be initialized when DOM loads)
let elements = {};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Browser Tools Panel initializing...");

  initializeDOM();
  await initializeSettings();
  initializeLogDisplay();
  initializeWebSocket();
  initializeConnectionManager();
  initializeNavigationHandler();
  initializeVisualMessagePanel();
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

    // Visual Message Panel
    visualMessageInput: document.getElementById("visual-message-input"),
    sendMessageBtn: document.getElementById("send-message-btn"),
    visualScreenshotList: document.getElementById("visual-screenshot-list"),
    screenshotSelectedCount: document.getElementById(
      "screenshot-selected-count"
    ),
    visualConversationDisplay: document.getElementById(
      "visual-conversation-display"
    ),
    elementPickerBtn: document.getElementById("element-picker-btn"),
  };

  console.log("📋 DOM elements cached:", Object.keys(elements).length);
}

async function initializeSettings() {
  settingsManager = new SettingsManager();
  await settingsManager.load();
  settingsManager.updateUIFromSettings(elements);
}

function initializeLogDisplay() {
  logDisplayManager = new LogDisplayManager(elements.logsDisplay);
}

function initializeConnectionManager() {
  connectionManager = new ConnectionManager(wsManager, elements, addLogEntry);
}

// Settings methods delegated to SettingsManager
// (loadSettings, saveSettings, updateUIFromSettings)

// Log methods delegated to LogDisplayManager
// (addLogEntry, clearLogs)

// Connection methods delegated to ConnectionManager
// (testConnection, discoverServer, updateConnectionStatus, updateScanStatus)

function initializeWebSocket() {
  wsManager = new WebSocketManager(
    settingsManager.get("serverHost"),
    settingsManager.get("serverPort")
  );

  // Connection events (delegated to ConnectionManager after initialization)
  wsManager.on("connected", () => {
    console.log("✅ WebSocket connected!");
    isConnected = true;
    const host = settingsManager.get("serverHost");
    const port = settingsManager.get("serverPort");

    if (connectionManager) {
      connectionManager.updateConnectionStatus(
        true,
        "Connected to HTTP Bridge"
      );
      connectionManager.updateScanStatus(
        "connected",
        `Connected to ${host}:${port}`
      );
    }

    // Add log entry for auto-connect (logDisplayManager is always available)
    if (logDisplayManager) {
      logDisplayManager.addEntry(
        "info",
        `✅ Auto-connected to ${host}:${port}`
      );
    }
  });

  wsManager.on("disconnected", () => {
    console.log("⚠️ WebSocket disconnected");
    isConnected = false;
    if (connectionManager) {
      connectionManager.updateConnectionStatus(
        false,
        "Disconnected from server"
      );
      connectionManager.updateScanStatus("failed", "Disconnected");
    }
  });

  wsManager.on("error", (error) => {
    console.error("❌ WebSocket error:", error);
    if (connectionManager) {
      connectionManager.updateConnectionStatus(
        false,
        `Connection error: ${error.message}`
      );
    }
  });

  wsManager.on("maxReconnectAttemptsReached", () => {
    console.error("❌ Max reconnection attempts reached");
    if (connectionManager) {
      connectionManager.updateConnectionStatus(
        false,
        "Connection failed - max retries reached"
      );
      connectionManager.updateScanStatus("failed", "Connection failed");
    }
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

function initializeVisualMessagePanel() {
  if (window.VisualMessagePanel) {
    visualMessagePanel = new window.VisualMessagePanel();

    // Prepare DOM elements for the panel
    const visualElements = {
      messageInput: elements.visualMessageInput,
      sendMessageBtn: elements.sendMessageBtn,
      screenshotList: elements.visualScreenshotList,
      selectedCount: elements.screenshotSelectedCount,
      conversationDisplay: elements.visualConversationDisplay,
      elementPickerBtn: elements.elementPickerBtn,
    };

    // Initialize with send message callback
    visualMessagePanel.initialize(visualElements, async (messageData) => {
      // Send visual message via WebSocket
      if (wsManager && isConnected) {
        await wsManager.send({
          action: "visual-message",
          data: messageData,
        });
      } else {
        throw new Error("Not connected to server");
      }
    });

    console.log("💬 Visual Message Panel initialized");
  } else {
    console.warn(
      "⚠️ VisualMessagePanel class not available - visual messaging disabled"
    );
  }
}

function setupEventListeners() {
  // Configuration panel events
  elements.serverHost.addEventListener("change", (e) => {
    console.log(
      `🔔 serverHost "change" event fired - old: "${settingsManager.get(
        "serverHost"
      )}", new: "${e.target.value}"`
    );
    settingsManager.set("serverHost", e.target.value, true);
    updateWebSocketConnection();
  });

  elements.serverPort.addEventListener("change", (e) => {
    console.log(
      `🔔 serverPort "change" event fired - old: ${settingsManager.get(
        "serverPort"
      )}, new: ${parseInt(e.target.value, 10)}`
    );
    settingsManager.set("serverPort", parseInt(e.target.value, 10), true);
    updateWebSocketConnection();
  });

  elements.testConnection.addEventListener("click", testConnection);
  elements.discoverServer.addEventListener("click", () =>
    discoverServer(false)
  );

  // Note: screenshotPathDisplay is read-only, no event listener needed

  elements.addToClipboardCb.addEventListener("change", (e) => {
    settingsManager.set("addToClipboard", e.target.checked, true);
  });

  elements.autoPasteCb.addEventListener("change", (e) => {
    settingsManager.set("autoPaste", e.target.checked, true);
  });

  // Code & Content panel events
  elements.screenshotBtn.addEventListener("click", captureScreenshot);
  // saveAsBtn removed from UI - no longer needed
  elements.evaluateBtn.addEventListener("click", evaluateJavaScript);
  elements.auditBtn.addEventListener("click", runAudit);
  elements.getContentBtn.addEventListener("click", getPageContent);

  // Console & Status panel events
  elements.getConsoleBtn.addEventListener("click", getConsoleLogs);
  elements.clearLogsBtn.addEventListener("click", clearLogs);

  // Advanced panel events
  elements.logLimit.addEventListener("change", (e) => {
    settingsManager.set("logLimit", parseInt(e.target.value, 10), true);
  });

  elements.queryLimit.addEventListener("change", (e) => {
    settingsManager.set("queryLimit", parseInt(e.target.value, 10), true);
  });

  elements.showRequestHeaders.addEventListener("change", (e) => {
    settingsManager.set("showRequestHeaders", e.target.checked, true);
  });

  elements.showResponseHeaders.addEventListener("change", (e) => {
    settingsManager.set("showResponseHeaders", e.target.checked, true);
  });

  console.log("🎯 Event listeners setup complete");
}

function updateWebSocketConnection() {
  connectionManager.updateWebSocketConnection(
    settingsManager.get("serverHost"),
    settingsManager.get("serverPort")
  );
}

function updateConnectionStatus(connected, message) {
  connectionManager.updateConnectionStatus(connected, message);
}

function updateScanStatus(state, message) {
  connectionManager.updateScanStatus(state, message);
}

async function testConnection() {
  return connectionManager.testConnection(
    settingsManager.get("serverHost"),
    settingsManager.get("serverPort")
  );
}

async function discoverServer(quietMode = false) {
  return connectionManager.discoverServer(
    quietMode,
    (host, port) =>
      settingsManager.setMany({ serverHost: host, serverPort: port }, true),
    (host, port) => {
      elements.serverHost.value = host;
      elements.serverPort.value = port;
    }
  );
}

// All connection functions delegated to ConnectionManager:
// - testConnection()
// - discoverServer()
// - testWebSocketConnection() (private method)
// - runConnectionDiagnostics()
// - updateConnectionStatus()
// - updateScanStatus()

// Tool functions (placeholders for now - will be implemented by other agents)
async function captureScreenshot() {
  console.log("🎬 captureScreenshot function called");
  console.log("🎬 Settings:", settingsManager.getAll());

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

    console.log("🎬 Screenshot result:", result);

    if (result.success) {
      console.log(
        "[Screenshot] Saved to:",
        result.path || "~/Downloads/screenshots/"
      );

      // Copy to clipboard if requested - handled by background.js
      const addToClipboard = settingsManager.get("addToClipboard");
      console.log("🔍 CLIPBOARD CHECK:", {
        addToClipboard,
        hasData: !!result.data,
        dataLength: result.data?.length,
      });

      if (addToClipboard && result.data) {
        console.log("[21:30:55] 🔍 Sending COPY_TO_CLIPBOARD message");
        console.log("[21:30:55] 📦 Data length:", result.data?.length);
        console.log("[21:30:55] 📁 Filename:", result.filename);
        console.log("[21:30:55] 🆔 Download ID:", result.downloadId);

        chrome.runtime.sendMessage(
          {
            type: "COPY_TO_CLIPBOARD",
            data: result.data,
            filename: result.filename, // Pass the actual smart filename
            downloadId: result.downloadId, // Pass downloadId to get full path
          },
          (response) => {
            console.log("[21:30:55] 📨 Received response:", response);

            if (response && response.success) {
              console.log("[Screenshot] Copied to clipboard");
              addLogEntry("info", "Screenshot copied to clipboard");
            } else {
              console.error(
                "[Screenshot] Clipboard copy failed:",
                response?.error
              );
              addLogEntry(
                "error",
                `Clipboard copy failed: ${response?.error || "Unknown error"}`
              );
            }
          }
        );
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
    "Folder selection coming soon - screenshots currently save to Chrome Downloads Folder"
  );

  // TODO: Implement custom folder selection using Chrome Downloads API shelf
  // This will allow users to change the default Downloads/screenshots location
}

// Clipboard functionality handled by background.js (service worker context has proper permissions)

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
  logDisplayManager.clear();
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

    case "visual-message-response":
      // Response from Claude via visual messaging
      if (visualMessagePanel) {
        visualMessagePanel.receiveClaudeResponse({
          text: message.data?.text || message.data?.message || "No response",
          screenshots: message.data?.screenshots || [],
          timestamp: message.timestamp || Date.now(),
        });
        addLogEntry(
          "info",
          `📥 Received Claude response for request ${requestId}`
        );
      } else {
        console.warn("⚠️ Visual message panel not available");
      }
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
  logDisplayManager.addEntry(level, message);
}

// Make addLogEntry globally accessible for navigation handler and other modules
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
  console.log(`   Host: ${settingsManager.get("serverHost")}`);
  console.log(`   Port: ${settingsManager.get("serverPort")}`);
  console.log(
    `   Expected URL: ws://${settingsManager.get(
      "serverHost"
    )}:${settingsManager.get("serverPort")}/extension-ws`
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
  fetch(
    `http://${settingsManager.get("serverHost")}:${settingsManager.get(
      "serverPort"
    )}/health`
  )
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
