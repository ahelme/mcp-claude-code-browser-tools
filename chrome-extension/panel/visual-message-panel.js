/**
 * Visual Message Panel - Two-Way AI Communication
 *
 * Enables users to send messages to Claude with screenshot attachments
 * directly from the DevTools panel. THE killer feature!
 *
 * Features:
 * - Message input with send button
 * - Recent screenshot attachment list
 * - Conversation thread display (user + Claude messages)
 * - Real-time message delivery
 */

class VisualMessagePanel {
  constructor() {
    this.elements = {};
    this.screenshots = [];
    this.conversation = [];
    this.isInitialized = false;
    this.elementPicker = null;
  }

  /**
   * Initialize the visual message panel
   * @param {Object} domElements - DOM element references
   * @param {Function} sendMessageCallback - Callback to send messages via WebSocket
   */
  initialize(domElements, sendMessageCallback) {
    console.log("🎨 Initializing Visual Message Panel...");

    this.elements = domElements;
    this.sendMessageCallback = sendMessageCallback;

    // Initialize element picker if available
    if (window.ElementPicker) {
      this.elementPicker = new window.ElementPicker();
      console.log("🎯 Element picker initialized");
    }

    this.setupEventListeners();
    this.loadRecentScreenshots();
    this.isInitialized = true;

    console.log("✅ Visual Message Panel initialized");
  }

  /**
   * Setup event listeners for UI interactions
   */
  setupEventListeners() {
    // Send message button
    if (this.elements.sendMessageBtn) {
      this.elements.sendMessageBtn.addEventListener("click", () => {
        this.handleSendMessage();
      });
    }

    // Enter key to send (Cmd+Enter for send)
    if (this.elements.messageInput) {
      this.elements.messageInput.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    // Screenshot checkboxes - delegate to parent container
    if (this.elements.screenshotList) {
      this.elements.screenshotList.addEventListener("change", (e) => {
        if (
          e.target.type === "checkbox" &&
          e.target.classList.contains("screenshot-checkbox")
        ) {
          this.updateSelectedCount();
        }
      });
    }

    // Element picker button
    if (this.elements.elementPickerBtn) {
      this.elements.elementPickerBtn.addEventListener("click", () => {
        this.startElementPicker();
      });
    }
  }

  /**
   * Start element picker in the active tab
   */
  async startElementPicker() {
    try {
      // Get active tab via chrome.tabs API (works in DevTools context)
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tabs || tabs.length === 0) {
        console.error("❌ No active tab found");
        alert("No active tab found. Please navigate to a webpage first.");
        return;
      }

      const tab = tabs[0];

      // Check if tab is a valid web page (not chrome://, devtools://, etc.)
      if (
        !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("devtools://")
      ) {
        console.error(
          "❌ Cannot inject content script into this tab:",
          tab.url
        );
        alert(
          "Element picker cannot run on this page. Please navigate to a regular webpage."
        );
        return;
      }

      try {
        // Try to send message to content script
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: "START_ELEMENT_PICKER",
          tabId: tab.id,
        });

        if (response && response.success) {
          console.log("✅ Element picker started");
          this.updatePickerButtonState(true);
        } else {
          throw new Error(response?.error || "Failed to start picker");
        }
      } catch (sendError) {
        // Content script might not be loaded yet - try to inject it
        console.log(
          "⚠️ Content script not responding, attempting injection..."
        );

        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content-element-picker.js"],
          });

          // Wait a moment for script to initialize
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Try again
          const retryResponse = await chrome.tabs.sendMessage(tab.id, {
            type: "START_ELEMENT_PICKER",
            tabId: tab.id,
          });

          if (retryResponse && retryResponse.success) {
            console.log("✅ Element picker started after injection");
            this.updatePickerButtonState(true);
          } else {
            throw new Error("Failed after injection retry");
          }
        } catch (injectError) {
          console.error("❌ Failed to inject content script:", injectError);
          alert(
            "Failed to start element picker. Please reload the page and try again."
          );
        }
      }
    } catch (error) {
      console.error("❌ Element picker error:", error);
      alert(`Element picker error: ${error.message}`);
    }
  }

  /**
   * Update element picker button state
   */
  updatePickerButtonState(isActive) {
    if (!this.elements.elementPickerBtn) return;

    if (isActive) {
      this.elements.elementPickerBtn.textContent = "⏹️ Stop Picker";
      this.elements.elementPickerBtn.classList.remove("aqua");
      this.elements.elementPickerBtn.classList.add("danger");
    } else {
      this.elements.elementPickerBtn.textContent = "🎯 Pick Element";
      this.elements.elementPickerBtn.classList.remove("danger");
      this.elements.elementPickerBtn.classList.add("aqua");
    }
  }

  /**
   * Load recent screenshots from directory
   * TODO: Integrate with existing screenshot system
   */
  async loadRecentScreenshots() {
    // Placeholder - will integrate with actual screenshot capture
    this.screenshots = [
      {
        filename: "nav-menu_5s.png",
        timestamp: Date.now() - 5000,
        path: "/screenshots/nav-menu_5s.png",
      },
      {
        filename: "button-primary_10s.png",
        timestamp: Date.now() - 10000,
        path: "/screenshots/button-primary_10s.png",
      },
      {
        filename: "footer_15s.png",
        timestamp: Date.now() - 15000,
        path: "/screenshots/footer_15s.png",
      },
    ];

    this.renderScreenshotList();
  }

  /**
   * Render the screenshot attachment list
   */
  renderScreenshotList() {
    if (!this.elements.screenshotList) return;

    const html = this.screenshots
      .map((screenshot, index) => {
        const timeAgo = Math.floor((Date.now() - screenshot.timestamp) / 1000);
        return `
        <label class="screenshot-item">
          <input
            type="checkbox"
            class="screenshot-checkbox"
            data-index="${index}"
            data-filename="${screenshot.filename}"
          />
          <span class="screenshot-filename">${screenshot.filename}</span>
          <span class="screenshot-time">(${timeAgo}s ago)</span>
        </label>
      `;
      })
      .join("");

    this.elements.screenshotList.innerHTML =
      html || '<div class="no-screenshots">No recent screenshots</div>';
    this.updateSelectedCount();
  }

  /**
   * Update the selected screenshot count display
   */
  updateSelectedCount() {
    const checkboxes =
      this.elements.screenshotList?.querySelectorAll(
        ".screenshot-checkbox:checked"
      ) || [];
    const count = checkboxes.length;

    if (this.elements.selectedCount) {
      this.elements.selectedCount.textContent =
        count > 0 ? `${count} selected` : "0 selected";
    }
  }

  /**
   * Get selected screenshots
   * @returns {Array} Selected screenshot objects
   */
  getSelectedScreenshots() {
    if (!this.elements.screenshotList) return [];

    const checkboxes = this.elements.screenshotList.querySelectorAll(
      ".screenshot-checkbox:checked"
    );
    return Array.from(checkboxes).map((cb) => {
      const index = parseInt(cb.dataset.index);
      return this.screenshots[index];
    });
  }

  /**
   * Handle send message button click
   */
  async handleSendMessage() {
    const message = this.elements.messageInput?.value.trim();

    if (!message) {
      console.warn("⚠️ Cannot send empty message");
      return;
    }

    const selectedScreenshots = this.getSelectedScreenshots();

    console.log(
      `📤 Sending message: "${message}" with ${selectedScreenshots.length} screenshot(s)`
    );

    // Add message to conversation immediately (optimistic UI)
    this.addMessageToConversation({
      type: "user",
      text: message,
      screenshots: selectedScreenshots,
      timestamp: Date.now(),
      status: "sending",
    });

    // Clear input
    this.elements.messageInput.value = "";

    // Uncheck all screenshots
    const checkboxes =
      this.elements.screenshotList?.querySelectorAll(".screenshot-checkbox") ||
      [];
    checkboxes.forEach((cb) => (cb.checked = false));
    this.updateSelectedCount();

    // Send via WebSocket
    if (this.sendMessageCallback) {
      try {
        await this.sendMessageCallback({
          message,
          screenshots: selectedScreenshots.map((s) => ({
            filename: s.filename,
            path: s.path,
          })),
        });

        // Update status to sent
        this.updateLastMessageStatus("sent");
      } catch (error) {
        console.error("❌ Failed to send message:", error);
        this.updateLastMessageStatus("error");
      }
    } else {
      console.warn("⚠️ No send callback configured");
      this.updateLastMessageStatus("error");
    }
  }

  /**
   * Add message to conversation thread
   * @param {Object} message - Message object with type, text, screenshots, timestamp
   */
  addMessageToConversation(message) {
    this.conversation.push(message);
    this.renderConversation();
  }

  /**
   * Update the status of the last message in conversation
   * @param {string} status - 'sending', 'sent', 'error'
   */
  updateLastMessageStatus(status) {
    if (this.conversation.length === 0) return;

    const lastMessage = this.conversation[this.conversation.length - 1];
    lastMessage.status = status;
    this.renderConversation();
  }

  /**
   * Render the conversation thread
   */
  renderConversation() {
    if (!this.elements.conversationDisplay) return;

    const html = this.conversation
      .map((msg) => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const statusIcon =
          msg.status === "sending"
            ? "⏳"
            : msg.status === "sent"
            ? "✓"
            : msg.status === "error"
            ? "❌"
            : "";

        const screenshotBadge =
          msg.screenshots?.length > 0
            ? `<span class="screenshot-badge">📎 ${msg.screenshots.length}</span>`
            : "";

        return `
        <div class="message ${msg.type}">
          <div class="message-header">
            <span class="message-sender">${
              msg.type === "user" ? "You" : "Claude"
            }</span>
            <span class="message-time">${time} ${statusIcon}</span>
          </div>
          <div class="message-text">${this.escapeHtml(msg.text)}</div>
          ${screenshotBadge}
        </div>
      `;
      })
      .join("");

    this.elements.conversationDisplay.innerHTML =
      html ||
      '<div class="no-messages">No messages yet. Start a conversation!</div>';

    // Auto-scroll to bottom
    this.elements.conversationDisplay.scrollTop =
      this.elements.conversationDisplay.scrollHeight;
  }

  /**
   * Receive response from Claude
   * @param {Object} response - Response object with text, screenshots, metadata
   */
  receiveClaudeResponse(response) {
    console.log("📥 Received response from Claude:", response);

    this.addMessageToConversation({
      type: "claude",
      text: response.text || response.message || "No response text",
      screenshots: response.screenshots || [],
      timestamp: Date.now(),
      status: "received",
    });
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Add a new screenshot to the list (called by screenshot capture)
   * @param {Object} screenshot - Screenshot object
   */
  addScreenshot(screenshot) {
    this.screenshots.unshift(screenshot); // Add to beginning

    // Keep only last 10 screenshots
    if (this.screenshots.length > 10) {
      this.screenshots = this.screenshots.slice(0, 10);
    }

    this.renderScreenshotList();
  }

  /**
   * Clear all messages in conversation
   */
  clearConversation() {
    this.conversation = [];
    this.renderConversation();
  }
}

// Make available globally
window.VisualMessagePanel = VisualMessagePanel;
