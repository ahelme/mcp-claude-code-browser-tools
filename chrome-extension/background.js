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

// Helper function: Convert data URL to Blob (CSP-safe, no fetch required)
async function dataURLtoBlob(dataURL) {
  return new Promise((resolve, reject) => {
    try {
      // Parse data URL: data:image/png;base64,iVBORw0...
      const parts = dataURL.split(",");
      if (parts.length !== 2) {
        reject(new Error("Invalid data URL format"));
        return;
      }

      const mimeMatch = parts[0].match(/:(.*?);/);
      if (!mimeMatch) {
        reject(new Error("Could not extract MIME type from data URL"));
        return;
      }

      const mime = mimeMatch[1];
      const base64Data = parts[1];

      // Decode base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob
      const blob = new Blob([bytes], { type: mime });
      resolve(blob);
    } catch (error) {
      reject(new Error(`Failed to convert data URL to blob: ${error.message}`));
    }
  });
}

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

    case "GET_PAGE_INFO":
      handleGetPageInfo(message, sendResponse);
      return true;

    case "BROWSER_CLICK":
      handleBrowserClick(message, sendResponse);
      return true;

    case "BROWSER_TYPE":
      handleBrowserType(message, sendResponse);
      return true;

    case "BROWSER_WAIT":
      handleBrowserWait(message, sendResponse);
      return true;

    case "COPY_TO_CLIPBOARD":
      handleCopyToClipboard(message, sendResponse);
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
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
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
      const response = await fetch(
        `http://${settings.serverHost}:${settings.serverPort}/current-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            tabId,
            timestamp: Date.now(),
            source,
          }),
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log("Successfully updated server with URL:", responseData);
        sendResponse({ success: true });
      } else {
        console.error(`Server returned error: ${response.status}`);
        sendResponse({
          success: false,
          error: `Server error: ${response.status}`,
        });
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
    const {
      tabId,
      selector,
      fullPage = false,
      filename,
      format = "png",
      quality = 90,
    } = message;

    // Get the tab
    const tab = await chrome.tabs.get(tabId);
    if (!tab) {
      sendResponse({ success: false, error: "Tab not found" });
      return;
    }

    // Get all windows to find the one containing our tab
    const windows = await chrome.windows.getAll({ populate: true });
    const targetWindow = windows.find((w) =>
      w.tabs.some((t) => t.id === tabId)
    );

    if (!targetWindow) {
      sendResponse({
        success: false,
        error: "Could not find window containing the tab",
      });
      return;
    }

    let screenshotData;

    if (selector) {
      // Element-specific screenshot - needs special handling
      screenshotData = await captureElementScreenshot(
        tabId,
        selector,
        format,
        quality
      );
    } else {
      // Full page or visible area screenshot
      const captureOptions = {
        format: format === "jpeg" ? "jpeg" : "png",
      };

      if (format === "jpeg" && quality) {
        captureOptions.quality = Math.max(0, Math.min(100, quality));
      }

      screenshotData = await chrome.tabs.captureVisibleTab(
        targetWindow.id,
        captureOptions
      );
    }

    if (!screenshotData) {
      sendResponse({ success: false, error: "Failed to capture screenshot" });
      return;
    }

    // Check if we should send to HTTP bridge (MCP flow) or return directly (UI flow)
    if (message.sendToHttpBridge) {
      // MCP flow: Send to HTTP bridge for server-side processing
      const result = await chrome.storage.local.get([
        "browserConnectorSettings",
      ]);
      const settings = result.browserConnectorSettings || {
        serverHost: "localhost",
        serverPort: 3024,
      };

      const response = await fetch(
        `http://${settings.serverHost}:${settings.serverPort}/capture-screenshot`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: screenshotData,
            filename: filename,
            selector: selector,
            fullPage: fullPage,
            format: format,
            quality: quality,
            tabId: tabId,
            title: tab.title,
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      const result_data = await response.json();

      if (result_data.success) {
        console.log("Screenshot saved successfully:", result_data.path);
        sendResponse({
          success: true,
          path: result_data.path,
          filename: result_data.filename,
          title: tab.title || "Current Tab",
          format: format,
          quality: quality,
        });
      } else {
        console.error("Screenshot server error:", result_data.error);
        sendResponse({ success: false, error: result_data.error });
      }
    } else {
      // UI flow: Save screenshot to disk using Chrome Downloads API
      console.log(
        "Screenshot captured via UI flow - saving to disk:",
        filename
      );

      try {
        // Use Chrome Downloads API directly with data URL (no blob conversion needed in service worker)
        const downloadId = await chrome.downloads.download({
          url: screenshotData, // Data URLs work directly in chrome.downloads.download
          filename: `screenshots/${filename}`, // Save in screenshots subfolder
          saveAs: false, // Use default Downloads location without prompting
        });

        console.log(
          `✅ Screenshot saved to Downloads/screenshots/${filename} (downloadId: ${downloadId})`
        );

        sendResponse({
          success: true,
          data: screenshotData,
          filename: filename,
          path: `~/Downloads/screenshots/${filename}`,
          downloadId: downloadId,
          title: tab.title || "Current Tab",
          format: format,
          quality: quality,
          savedToDisk: true,
        });
      } catch (downloadError) {
        console.error("Error saving screenshot to disk:", downloadError);

        // Fallback: Return data without saving (existing behavior)
        console.log("Falling back to data-only response");
        sendResponse({
          success: true,
          data: screenshotData,
          filename: filename,
          title: tab.title || "Current Tab",
          format: format,
          quality: quality,
          savedToDisk: false,
          fallbackReason: downloadError.message,
        });
      }
    }
  } catch (error) {
    const errorMsg =
      error.name === "AbortError"
        ? `Screenshot timeout after 10000ms`
        : `${error.name}: ${error.message}`;
    console.error("Error capturing screenshot:", errorMsg);
    sendResponse({ success: false, error: errorMsg });
  }
}

async function handleGetPageInfo(message, sendResponse) {
  try {
    const tabId = message.tabId;
    console.log("Getting page info for tab", tabId);

    // Get tab information
    const tab = await chrome.tabs.get(tabId);
    if (!tab) {
      sendResponse({ success: false, error: "Tab not found" });
      return;
    }

    // Basic page info from tab
    const pageInfo = {
      title: tab.title || "Untitled Page",
      url: tab.url || "about:blank",
      favIconUrl: tab.favIconUrl,
      status: tab.status,
    };

    console.log("Page info retrieved:", pageInfo);
    sendResponse({ success: true, ...pageInfo });
  } catch (error) {
    console.error("Error getting page info:", error);
    sendResponse({ success: false, error: error.message });
  }
}

function notifyUrlChange(tabId, url, source) {
  // Notify DevTools panels about URL changes
  chrome.runtime
    .sendMessage({
      type: "URL_CHANGED",
      tabId,
      url,
      source,
      timestamp: Date.now(),
    })
    .catch((error) => {
      // Ignore errors if no listeners (panel not open)
      console.debug("No listeners for URL change notification:", error.message);
    });
}

// Interaction handlers
async function handleBrowserClick(message, sendResponse) {
  console.log("🖱️ Background handling browser click:", message);

  try {
    const { tabId, selector } = message;

    if (!tabId) {
      sendResponse({ success: false, error: "Tab ID is required" });
      return;
    }

    if (!selector) {
      sendResponse({ success: false, error: "Selector is required" });
      return;
    }

    // Execute click script in the target tab
    const result = await executeScriptInTab(
      tabId,
      `
      // Use the interactions handler from interactions.js
      if (typeof window.interactionHandler !== 'undefined') {
        return window.interactionHandler.handleClick({ selector: '${selector.replace(
          /'/g,
          "\\'"
        )}' });
      } else {
        // Fallback implementation if interactions.js not loaded
        try {
          const element = document.querySelector('${selector.replace(
            /'/g,
            "\\'"
          )}');
          if (!element) {
            return { success: false, error: 'Element not found: ${selector}' };
          }
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await new Promise(resolve => setTimeout(resolve, 100));
          element.click();
          return {
            success: true,
            message: 'Element clicked successfully',
            elementInfo: {
              tagName: element.tagName,
              className: element.className,
              id: element.id
            }
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    `
    );

    console.log("🖱️ Click result:", result);
    sendResponse(result);
  } catch (error) {
    console.error("❌ Click error:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleBrowserType(message, sendResponse) {
  console.log("⌨️ Background handling browser type:", message);

  try {
    const { tabId, selector, text, clear = false } = message;

    if (!tabId) {
      sendResponse({ success: false, error: "Tab ID is required" });
      return;
    }

    if (!selector) {
      sendResponse({ success: false, error: "Selector is required" });
      return;
    }

    if (!text) {
      sendResponse({ success: false, error: "Text is required" });
      return;
    }

    // Execute type script in the target tab
    const result = await executeScriptInTab(
      tabId,
      `
      // Use the interactions handler from interactions.js
      if (typeof window.interactionHandler !== 'undefined') {
        return window.interactionHandler.handleType({
          selector: '${selector.replace(/'/g, "\\'")}',
          text: '${text.replace(/'/g, "\\'")}',
          clear: ${clear}
        });
      } else {
        // Fallback implementation if interactions.js not loaded
        try {
          const element = document.querySelector('${selector.replace(
            /'/g,
            "\\'"
          )}');
          if (!element) {
            return { success: false, error: 'Element not found: ${selector}' };
          }

          const isInputElement = element.tagName === 'INPUT' ||
                               element.tagName === 'TEXTAREA' ||
                               element.isContentEditable;

          if (!isInputElement) {
            return { success: false, error: 'Element is not a text input field: ${selector}' };
          }

          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await new Promise(resolve => setTimeout(resolve, 100));
          element.focus();

          if (${clear}) {
            if (element.isContentEditable) {
              element.textContent = '';
            } else {
              element.value = '';
            }
          }

          const textToType = '${text.replace(/'/g, "\\'")}';
          if (element.isContentEditable) {
            element.textContent += textToType;
          } else {
            element.value += textToType;
          }

          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));

          return {
            success: true,
            message: 'Text typed successfully',
            elementInfo: {
              tagName: element.tagName,
              className: element.className,
              id: element.id,
              value: element.value || element.textContent
            }
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    `
    );

    console.log("⌨️ Type result:", result);
    sendResponse(result);
  } catch (error) {
    console.error("❌ Type error:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleBrowserWait(message, sendResponse) {
  console.log("⏳ Background handling browser wait:", message);

  try {
    const { tabId, selector, timeout = 30000 } = message;

    if (!tabId) {
      sendResponse({ success: false, error: "Tab ID is required" });
      return;
    }

    if (!selector) {
      sendResponse({ success: false, error: "Selector is required" });
      return;
    }

    const maxTimeout = Math.min(timeout, 60000); // Max 60 seconds

    // Execute wait script in the target tab
    const result = await executeScriptInTab(
      tabId,
      `
      // Use the interactions handler from interactions.js
      if (typeof window.interactionHandler !== 'undefined') {
        return window.interactionHandler.handleWait({
          selector: '${selector.replace(/'/g, "\\'")}',
          timeout: ${maxTimeout}
        });
      } else {
        // Fallback implementation if interactions.js not loaded
        return new Promise((resolve) => {
          const startTime = Date.now();
          const interval = 500;

          const checkElement = () => {
            try {
              const elapsed = Date.now() - startTime;

              if (elapsed >= ${maxTimeout}) {
                resolve({
                  success: false,
                  error: 'Element not found within ${maxTimeout}ms: ${selector}'
                });
                return;
              }

              const element = document.querySelector('${selector.replace(
                /'/g,
                "\\'"
              )}');

              if (element) {
                const rect = element.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 &&
                                window.getComputedStyle(element).visibility !== 'hidden' &&
                                window.getComputedStyle(element).display !== 'none';

                resolve({
                  success: true,
                  message: 'Element found after ' + elapsed + 'ms',
                  elementInfo: {
                    tagName: element.tagName,
                    className: element.className,
                    id: element.id
                  },
                  visible: isVisible,
                  waitTime: elapsed
                });
                return;
              }

              setTimeout(checkElement, interval);

            } catch (error) {
              resolve({ success: false, error: error.message });
            }
          };

          checkElement();
        });
      }
    `
    );

    console.log("⏳ Wait result:", result);
    sendResponse(result);
  } catch (error) {
    console.error("❌ Wait error:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Element-specific screenshot capture function
async function captureElementScreenshot(
  tabId,
  selector,
  format = "png",
  quality = 90
) {
  try {
    // First, get element position and size
    const elementInfo = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (sel) => {
        const element = document.querySelector(sel);
        if (!element) {
          return { success: false, error: `Element not found: ${sel}` };
        }

        const rect = element.getBoundingClientRect();
        const scrollX =
          window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY =
          window.pageYOffset || document.documentElement.scrollTop;

        return {
          success: true,
          x: Math.round(rect.left + scrollX),
          y: Math.round(rect.top + scrollY),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          elementInfo: {
            tagName: element.tagName,
            className: element.className,
            id: element.id,
          },
        };
      },
      args: [selector],
    });

    if (!elementInfo[0]?.result?.success) {
      throw new Error(
        elementInfo[0]?.result?.error || "Failed to get element info"
      );
    }

    const { x, y, width, height } = elementInfo[0].result;

    if (width <= 0 || height <= 0) {
      throw new Error("Element has zero dimensions");
    }

    // Get the window containing the tab
    const windows = await chrome.windows.getAll({ populate: true });
    const targetWindow = windows.find((w) =>
      w.tabs.some((t) => t.id === tabId)
    );

    if (!targetWindow) {
      throw new Error("Could not find window containing the tab");
    }

    // Capture full page screenshot
    const captureOptions = {
      format: format === "jpeg" ? "jpeg" : "png",
    };

    if (format === "jpeg" && quality) {
      captureOptions.quality = Math.max(0, Math.min(100, quality));
    }

    const fullScreenshot = await chrome.tabs.captureVisibleTab(
      targetWindow.id,
      captureOptions
    );

    // Create canvas to crop the element
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;

        // Draw the cropped portion
        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        // Convert to data URL with the requested format
        const croppedDataUrl = canvas.toDataURL(
          format === "jpeg" ? "image/jpeg" : "image/png",
          format === "jpeg" ? quality / 100 : undefined
        );

        resolve(croppedDataUrl);
      };

      img.onerror = () =>
        reject(new Error("Failed to load screenshot for cropping"));
      img.src = fullScreenshot;
    });
  } catch (error) {
    console.error("❌ Element screenshot error:", error);
    throw error;
  }
}

// Helper function to execute scripts in tabs
async function executeScriptInTab(tabId, script) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        func: function (scriptToExecute) {
          // Execute the script safely using Function constructor
          try {
            const result = new Function(scriptToExecute)();
            return result;
          } catch (error) {
            return {
              success: false,
              error: error.message,
            };
          }
        },
        args: [script],
      },
      (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (result && result[0]) {
          resolve(result[0].result);
        } else {
          reject(new Error("No result from script execution"));
        }
      }
    );
  });
}

async function handleCopyToClipboard(message, sendResponse) {
  console.log("🎯 handleCopyToClipboard called");
  console.log("Message:", message);

  try {
    const { data, filename, downloadId } = message;

    if (!data) {
      console.error("❌ No data provided");
      sendResponse({ success: false, error: "No data provided" });
      return;
    }

    // Extract filename as plain string for serialization
    const filenameString = filename || "screenshot.png";
    console.log("📁 Filename:", filenameString);
    console.log("🆔 Download ID:", downloadId);

    // Build the full absolute file path
    let filePath = null;

    if (downloadId) {
      try {
        const downloads = await chrome.downloads.search({ id: downloadId });
        if (downloads && downloads.length > 0) {
          // Chrome Downloads API returns the full absolute path
          const downloadPath = downloads[0].filename;

          console.log(`📁 Chrome download path: ${downloadPath}`);

          // Check if it's already an absolute path (starts with / or contains drive letter)
          if (downloadPath.startsWith("/") || downloadPath.match(/^[A-Z]:\\/)) {
            // Already absolute path - use as-is
            filePath = downloadPath;
          } else {
            // Relative path - construct full path
            filePath = `~/Downloads/${downloadPath}`;
          }

          console.log(`📁 Final file path: ${filePath}`);
        }
      } catch (error) {
        console.warn("⚠️ Could not get file path from downloadId:", error);
      }
    }

    // Fallback: If no downloadId, construct path from filename
    if (!filePath && filenameString) {
      filePath = `~/Downloads/screenshots/${filenameString}`;
      console.log(`📁 Constructed file path: ${filePath}`);
    }

    // Get MCP server settings
    const result = await chrome.storage.local.get(["browserConnectorSettings"]);
    const settings = result.browserConnectorSettings || {
      serverHost: "localhost",
      serverPort: 3024,
    };

    // Solution C: Hybrid Smart Fallback
    // Step 1: Try native clipboard copy via MCP server
    console.log("🎯 Attempting native clipboard copy via MCP server...");

    try {
      const clipboardResponse = await fetch(
        `http://${settings.serverHost}:${settings.serverPort}/copy-file-to-clipboard`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath: filePath }),
          signal: AbortSignal.timeout(5000),
        }
      );

      const clipboardResult = await clipboardResponse.json();

      if (clipboardResult.success) {
        console.log("✅ Native clipboard copy successful!");
        console.log(`📋 File copied: ${filePath}`);
        console.log(`💡 Platform: ${clipboardResult.platform}`);
        console.log("🎉 Paste in Claude Code should work now!");

        sendResponse({
          success: true,
          method: "MCP native clipboard",
          filePath: filePath,
          filename: filenameString,
          platform: clipboardResult.platform,
          note: "File copied to native OS clipboard - paste in Claude Code!",
        });
        return;
      } else {
        console.warn("⚠️ Native clipboard failed:", clipboardResult.error);
      }
    } catch (clipboardError) {
      console.warn("⚠️ MCP clipboard request failed:", clipboardError.message);
    }

    // Step 2: Fallback - Auto-open file manager with file selected
    console.log("🔄 Falling back to show-in-finder method...");

    try {
      const finderResponse = await fetch(
        `http://${settings.serverHost}:${settings.serverPort}/show-in-finder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath: filePath }),
          signal: AbortSignal.timeout(5000),
        }
      );

      const finderResult = await finderResponse.json();

      if (finderResult.success) {
        console.log("✅ File manager opened with file selected!");
        console.log(`📁 File location: ${filePath}`);
        console.log("💡 Press Cmd+C (Mac) or Ctrl+C (Win/Linux) to copy");

        sendResponse({
          success: true,
          method: "Show in file manager",
          filePath: filePath,
          filename: filenameString,
          platform: finderResult.platform,
          note: "File manager opened - press Cmd+C to copy, then paste in Claude Code",
        });
        return;
      } else {
        console.warn("⚠️ Show in finder failed:", finderResult.error);
      }
    } catch (finderError) {
      console.warn("⚠️ Show-in-finder request failed:", finderError.message);
    }

    // Step 3: Final fallback - Show file path (user can manually navigate)
    console.log("📝 All MCP methods failed - providing file path...");
    sendResponse({
      success: true,
      method: "File path display",
      filePath: filePath,
      filename: filenameString,
      note: `Screenshot saved to: ${filePath} - Navigate to this location to copy the file`,
    });
  } catch (error) {
    console.error("❌ Failed to copy to clipboard:", error);
    sendResponse({ success: false, error: error.message });
  }
}
