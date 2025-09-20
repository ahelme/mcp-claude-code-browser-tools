/**
 * Background Service Worker for Browser Tools MCP Extension
 *
 * Features:
 * - Tab URL tracking and management
 * - Communication with DevTools panel
 * - Screenshot capture functionality
 * - Extension lifecycle management
 */

// Track URLs for each tab
const tabUrls = new Map();

// Extension lifecycle
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Browser Tools MCP Extension installed/updated", details);
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Browser Tools MCP Extension starting up");
});

// Message handling from DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  switch (message.type) {
    case "GET_CURRENT_URL":
      handleGetCurrentUrl(message, sendResponse);
      return true; // Required for async response

    case "UPDATE_SERVER_URL":
      handleUpdateServerUrl(message, sendResponse);
      return true;

    case "CAPTURE_SCREENSHOT":
      handleCaptureScreenshot(message, sendResponse);
      return true;

    case "PING":
      sendResponse({ success: true, timestamp: Date.now() });
      break;

    default:
      console.warn("Unknown message type:", message.type);
      sendResponse({ success: false, error: "Unknown message type" });
  }
});

// Tab management
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Track URL changes
  if (changeInfo.url) {
    console.log(`URL changed in tab ${tabId} to ${changeInfo.url}`);
    tabUrls.set(tabId, changeInfo.url);

    // Notify any listening DevTools panels
    notifyUrlChange(tabId, changeInfo.url, "tab_url_change");
  }

  // Page complete events
  if (changeInfo.status === "complete" && tab.url) {
    tabUrls.set(tabId, tab.url);
    notifyUrlChange(tabId, tab.url, "page_complete");
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;
  console.log(`Tab activated: ${tabId}`);

  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting tab info:", chrome.runtime.lastError);
      return;
    }

    if (tab && tab.url) {
      tabUrls.set(tabId, tab.url);
      notifyUrlChange(tabId, tab.url, "tab_activated");
    }
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabUrls.delete(tabId);
});

// Helper functions
async function handleGetCurrentUrl(message, sendResponse) {
  try {
    const tabId = message.tabId;
    console.log("Getting URL for tab", tabId);

    // Check cache first
    if (tabUrls.has(tabId)) {
      const cachedUrl = tabUrls.get(tabId);
      console.log("Found cached URL:", cachedUrl);
      sendResponse({ success: true, url: cachedUrl });
      return;
    }

    // Get from tab
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.url) {
        tabUrls.set(tabId, tab.url);
        console.log("Got URL from tab:", tab.url);
        sendResponse({ success: true, url: tab.url });
        return;
      }
    } catch (tabError) {
      console.error("Error getting specific tab:", tabError);
    }

    // Fallback to active tab
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs.length > 0 && tabs[0].url) {
        const activeUrl = tabs[0].url;
        console.log("Got URL from active tab:", activeUrl);
        tabUrls.set(tabId, activeUrl);
        sendResponse({ success: true, url: activeUrl });
        return;
      }
    } catch (queryError) {
      console.error("Error querying tabs:", queryError);
    }

    console.log("Could not find URL for tab", tabId);
    sendResponse({ success: false, error: "Could not find tab URL" });
  } catch (error) {
    console.error("Error getting tab URL:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateServerUrl(message, sendResponse) {
  try {
    const { tabId, url, source = "background_update" } = message;

    if (!url) {
      sendResponse({ success: false, error: "URL is required" });
      return;
    }

    console.log(`Updating server with URL for tab ${tabId}: ${url}`);

    // Update our cache
    tabUrls.set(tabId, url);

    // Get server settings from storage
    const result = await chrome.storage.local.get(["browserConnectorSettings"]);
    const settings = result.browserConnectorSettings || {
      serverHost: "localhost",
      serverPort: 3024, // Updated to use MCP port
    };

    // Send to HTTP bridge server
    try {
      const response = await fetch(`http://${settings.serverHost}:${settings.serverPort}/current-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          tabId,
          timestamp: Date.now(),
          source,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Successfully updated server with URL:", responseData);
        sendResponse({ success: true });
      } else {
        console.error(`Server returned error: ${response.status}`);
        sendResponse({ success: false, error: `Server error: ${response.status}` });
      }
    } catch (fetchError) {
      console.error("Error updating server with URL:", fetchError);
      sendResponse({ success: false, error: fetchError.message });
    }
  } catch (error) {
    console.error("Error in handleUpdateServerUrl:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCaptureScreenshot(message, sendResponse) {
  try {
    const tabId = message.tabId;

    // Get the tab
    const tab = await chrome.tabs.get(tabId);
    if (!tab) {
      sendResponse({ success: false, error: "Tab not found" });
      return;
    }

    // Get all windows to find the one containing our tab
    const windows = await chrome.windows.getAll({ populate: true });
    const targetWindow = windows.find(w => w.tabs.some(t => t.id === tabId));

    if (!targetWindow) {
      sendResponse({ success: false, error: "Could not find window containing the tab" });
      return;
    }

    // Capture screenshot
    const dataUrl = await chrome.tabs.captureVisibleTab(targetWindow.id, { format: "png" });

    // Get server settings
    const result = await chrome.storage.local.get(["browserConnectorSettings"]);
    const settings = result.browserConnectorSettings || {
      serverHost: "localhost",
      serverPort: 3024,
    };

    // Send to HTTP bridge
    const response = await fetch(`http://${settings.serverHost}:${settings.serverPort}/capture-screenshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: dataUrl,
        path: message.screenshotPath,
        tabId: tabId,
        title: tab.title,
      }),
    });

    const result_data = await response.json();

    if (result_data.success) {
      console.log("Screenshot saved successfully:", result_data.path);
      sendResponse({
        success: true,
        path: result_data.path,
        filename: result_data.filename,
        title: tab.title || "Current Tab",
      });
    } else {
      console.error("Screenshot server error:", result_data.error);
      sendResponse({ success: false, error: result_data.error });
    }
  } catch (error) {
    console.error("Error capturing screenshot:", error);
    sendResponse({ success: false, error: error.message });
  }
}

function notifyUrlChange(tabId, url, source) {
  // Notify DevTools panels about URL changes
  chrome.runtime.sendMessage({
    type: "URL_CHANGED",
    tabId,
    url,
    source,
    timestamp: Date.now(),
  }).catch(error => {
    // Ignore errors if no listeners (panel not open)
    console.debug("No listeners for URL change notification:", error.message);
  });
}