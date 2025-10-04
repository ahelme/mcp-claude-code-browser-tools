/**
 * Content Script - Browser Tools Integration
 *
 * Listens for messages from panel and executes browser tools.
 * This script is injected into every page and provides the runtime
 * environment for all browser automation tools.
 */

console.log('🔧 Browser Tools content script loaded');

// Initialize tool instances
const evaluateTool = new BrowserEvaluateTool();
const contentTool = new BrowserGetContentTool();
const auditTool = new BrowserAuditTool();
const consoleTool = new BrowserGetConsoleTool();
const clickTool = new BrowserClickTool();
const typeTool = new BrowserTypeTool();
const waitTool = new BrowserWaitTool();

// Start console monitoring automatically
consoleTool.startMonitoring({
  captureLog: true,
  captureInfo: true,
  captureWarn: true,
  captureError: true,
  captureDebug: false
});

// Message listener for tool execution requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Content script received message:', message.type);

  // Handle different tool execution requests
  switch (message.type) {
    case 'EVALUATE_JS':
      handleEvaluate(message, sendResponse);
      return true; // Keep response channel open for async

    case 'GET_CONTENT':
      handleGetContent(message, sendResponse);
      return false; // Synchronous response

    case 'RUN_AUDIT':
      handleRunAudit(message, sendResponse);
      return true; // Keep response channel open for async

    case 'GET_CONSOLE':
      handleGetConsole(message, sendResponse);
      return false; // Synchronous response

    case 'CLICK_ELEMENT':
      handleClick(message, sendResponse);
      return true; // Keep response channel open for async

    case 'TYPE_TEXT':
      handleType(message, sendResponse);
      return true; // Keep response channel open for async

    case 'WAIT_FOR':
      handleWait(message, sendResponse);
      return true; // Keep response channel open for async

    // Visual tools integration
    case 'MEASURE_LAYOUT':
      handleMeasureLayout(message, sendResponse);
      return false;

    case 'ANALYZE_STYLES':
      handleAnalyzeStyles(message, sendResponse);
      return false;

    case 'CHECK_A11Y':
      handleCheckA11y(message, sendResponse);
      return false;

    default:
      console.warn('⚠️ Unknown message type:', message.type);
      return false;
  }
});

/**
 * Handle JavaScript evaluation
 */
async function handleEvaluate(message, sendResponse) {
  try {
    const result = await evaluateTool.evaluate(message.code, {
      timeout: message.timeout || 30000,
      returnByValue: true,
      awaitPromise: true
    });
    sendResponse(result);
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle content extraction
 */
function handleGetContent(message, sendResponse) {
  const result = contentTool.getContent(message.selector, {
    format: message.format || 'html',
    includeHidden: message.includeHidden || false,
    maxLength: message.maxLength || null,
    includeMetadata: true
  });
  sendResponse(result);
}

/**
 * Handle audit execution
 */
async function handleRunAudit(message, sendResponse) {
  try {
    const result = await auditTool.runAudit({
      categories: message.categories || ['performance', 'accessibility', 'seo', 'best-practices'],
      includeRecommendations: true
    });
    sendResponse(result);
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle console log retrieval
 */
function handleGetConsole(message, sendResponse) {
  const result = consoleTool.getLogs({
    level: message.level || null,
    limit: message.limit || 50,
    since: message.since || null,
    search: message.search || null
  });
  sendResponse(result);
}

/**
 * Handle click action
 */
async function handleClick(message, sendResponse) {
  try {
    const result = await clickTool.click(message.selector, {
      clickType: message.clickType || 'left',
      scrollIntoView: message.scrollIntoView !== false,
      timeout: message.timeout || 5000
    });
    sendResponse(result);
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle type action
 */
async function handleType(message, sendResponse) {
  try {
    const result = await typeTool.type(message.selector, message.text, {
      clear: message.clear || false,
      delay: message.delay || 50,
      pressEnter: message.pressEnter || false,
      scrollIntoView: message.scrollIntoView !== false
    });
    sendResponse(result);
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle wait action
 */
async function handleWait(message, sendResponse) {
  try {
    let result;

    switch (message.waitType) {
      case 'element':
        result = await waitTool.waitForElement(message.selector, {
          timeout: message.timeout || 30000,
          visible: message.visible !== false,
          hidden: message.hidden || false
        });
        break;

      case 'timeout':
        result = await waitTool.waitForTimeout(message.duration || 1000);
        break;

      case 'text':
        result = await waitTool.waitForText(message.text, {
          timeout: message.timeout || 30000,
          selector: message.selector || 'body'
        });
        break;

      case 'navigation':
        result = await waitTool.waitForNavigation({
          timeout: message.timeout || 30000,
          waitUntil: message.waitUntil || 'load'
        });
        break;

      default:
        result = {
          success: false,
          error: `Unknown wait type: ${message.waitType}`
        };
    }

    sendResponse(result);
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle layout measurement (Visual Precision Tools)
 */
function handleMeasureLayout(message, sendResponse) {
  if (!window.LayoutMeasurementTool) {
    sendResponse({
      success: false,
      error: 'Layout Measurement Tool not loaded'
    });
    return;
  }

  const layoutTool = new LayoutMeasurementTool();
  const result = layoutTool.measureElement(message.selector);
  sendResponse(result);
}

/**
 * Handle style analysis (Visual Precision Tools)
 */
function handleAnalyzeStyles(message, sendResponse) {
  if (!window.StyleAnalyzer) {
    sendResponse({
      success: false,
      error: 'Style Analyzer not loaded'
    });
    return;
  }

  const styleAnalyzer = new StyleAnalyzer();
  const result = styleAnalyzer.analyzeElement(message.selector);
  sendResponse(result);
}

/**
 * Handle accessibility check (Visual Precision Tools)
 */
function handleCheckA11y(message, sendResponse) {
  if (!window.AccessibilityOverlay) {
    sendResponse({
      success: false,
      error: 'Accessibility Overlay not loaded'
    });
    return;
  }

  const a11yOverlay = new AccessibilityOverlay();
  const result = a11yOverlay.checkAccessibility(message.selector);
  sendResponse(result);
}

console.log('✅ Browser Tools content script ready');
