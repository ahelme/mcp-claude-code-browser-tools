/**
 * WebSocket Communication Manager
 *
 * Establishes and manages WebSocket connection to HTTP bridge on port 3024.
 * Handles all real-time communication between extension and MCP server.
 *
 * 📄 **Protocol Contract**: chrome-extension/contracts/websocket.asyncapi.yaml
 * 🔗 **AsyncAPI Spec**: https://spec.asyncapi.com/v3.0.0/
 * 🌐 **Documentation**: http://localhost:3020/ws-docs
 *
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Heartbeat/ping-pong for connection validation (30s intervals per AsyncAPI contract)
 * - Message queuing during disconnection
 * - Connection state management
 *
 * @see {@link ../contracts/websocket.asyncapi.yaml} Complete protocol specification
 */

class WebSocketManager {
  constructor(host = "localhost", port = 3024) {
    this.host = host;
    this.port = port;
    this.url = `ws://${host}:${port}/extension-ws`;
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.heartbeatInterval = null;
    this.messageQueue = [];
    this.listeners = new Map();

    // Bind methods to preserve context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);

    console.log(`🔗 WebSocket Manager initialized for ${this.url}`);
  }

  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      console.log("⚠️ WebSocket already connecting/connected");
      return;
    }

    console.log(`🔌 Connecting to WebSocket: ${this.url}`);
    console.log(
      `📊 Connection attempt ${this.reconnectAttempts + 1}/${
        this.maxReconnectAttempts
      }`
    );

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = (event) => {
        console.log("✅ WebSocket connected successfully!");
        console.log(`🎯 Connected to: ${this.url}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000; // Reset delay

        // Start heartbeat
        this.startHeartbeat();

        // Send queued messages
        this.flushMessageQueue();

        // Send initial connection data
        this.sendInitialData();

        // Emit connection event
        this.emit("connected", event);
      };

      this.ws.onmessage = (event) => {
        console.log("📨 WebSocket message received:", event.data);

        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error);
          console.log("Raw message:", event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
        console.log(
          `📊 Close details: wasClean=${event.wasClean}, code=${event.code}, reason='${event.reason}'`
        );
        this.isConnected = false;
        this.stopHeartbeat();

        // Emit disconnection event
        this.emit("disconnected", event);

        // Attempt reconnection if not intentional
        if (event.code !== 1000) {
          // 1000 = normal closure
          console.log(
            `🔄 Non-normal closure detected, scheduling reconnect...`
          );
          this.scheduleReconnect();
        } else {
          console.log(`✅ Normal closure, not reconnecting`);
        }
      };

      this.ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        console.error(`🔧 WebSocket URL: ${this.url}`);
        console.error(
          `📊 Current state: ${this.ws ? this.ws.readyState : "null"}`
        );
        this.emit("error", error);
      };
    } catch (error) {
      console.error("❌ Error creating WebSocket:", error);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    console.log("🔌 Disconnecting WebSocket...");

    if (this.ws) {
      this.ws.close(1000, "Manual disconnect");
    }

    this.isConnected = false;
    this.stopHeartbeat();
    this.ws = null;
  }

  send(message) {
    if (
      !this.isConnected ||
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      console.log("📋 Queueing message (not connected):", message);
      this.messageQueue.push(message);
      return false;
    }

    try {
      const messageStr =
        typeof message === "string" ? message : JSON.stringify(message);
      console.log("📤 Sending WebSocket message:", messageStr);
      this.ws.send(messageStr);
      return true;
    } catch (error) {
      console.error("❌ Error sending WebSocket message:", error);
      this.messageQueue.push(message);
      return false;
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `❌ Max reconnection attempts reached (${this.maxReconnectAttempts})`
      );
      this.emit("maxReconnectAttemptsReached");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`
    );

    setTimeout(() => {
      console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}`);
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.maxReconnectDelay
    );
  }

  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat

    this.heartbeatInterval = setInterval(() => {
      if (
        this.isConnected &&
        this.ws &&
        this.ws.readyState === WebSocket.OPEN
      ) {
        this.send({ action: "ping", timestamp: Date.now() });
      }
    }, 30000); // Ping every 30 seconds

    console.log("💓 Heartbeat started");
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log("💓 Heartbeat stopped");
    }
  }

  flushMessageQueue() {
    if (this.messageQueue.length === 0) return;

    console.log(`📋 Flushing ${this.messageQueue.length} queued messages`);

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    messages.forEach((message) => {
      this.send(message);
    });
  }

  sendInitialData() {
    // Send current tab information
    if (chrome.devtools && chrome.devtools.inspectedWindow) {
      this.send({
        type: "tabId",
        tabId: chrome.devtools.inspectedWindow.tabId,
      });

      // Get current URL
      chrome.runtime.sendMessage(
        {
          type: "GET_CURRENT_URL",
          tabId: chrome.devtools.inspectedWindow.tabId,
        },
        (response) => {
          if (response && response.success) {
            this.send({
              type: "url",
              url: response.url,
              tabId: chrome.devtools.inspectedWindow.tabId,
            });
          }
        }
      );
    }
  }

  handleMessage(message) {
    console.log("🔍 Processing message:", message);

    switch (message.action) {
      case "pong":
        console.log("💓 Received heartbeat pong");
        break;

      case "ping":
        console.log("💓 Received ping, sending pong");
        this.send({ action: "pong", timestamp: Date.now() });
        break;

      default:
        // Emit message for other handlers
        this.emit("message", message);
    }
  }

  // Event system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event).forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Error in event listener for ${event}:`, error);
      }
    });
  }

  // Public getters
  get connectionState() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
      queuedMessages: this.messageQueue.length,
    };
  }

  updateServerSettings(host, port) {
    console.log(`🔧 Updating server settings: ${host}:${port}`);

    const newUrl = `ws://${host}:${port}/extension-ws`;

    if (newUrl !== this.url) {
      this.host = host;
      this.port = port;
      this.url = newUrl;

      // Reconnect with new settings
      this.disconnect();
      setTimeout(() => this.connect(), 1000);
    }
  }
}

// Export for use in panel.js
window.WebSocketManager = WebSocketManager;
