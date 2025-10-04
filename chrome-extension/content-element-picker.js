/**
 * Content Script: Element Picker
 *
 * Runs in the webpage context to enable interactive element selection.
 * Communicates with panel via background script messaging.
 */

// Initialize element picker instance
let elementPicker = null;

// Listen for messages from panel (via background script)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Content script received message:', message);

  switch (message.type) {
    case 'START_ELEMENT_PICKER':
      handleStartElementPicker(message, sendResponse);
      return true;

    case 'STOP_ELEMENT_PICKER':
      handleStopElementPicker(message, sendResponse);
      return true;

    default:
      return false;
  }
});

/**
 * Start element picker mode
 */
function handleStartElementPicker(message, sendResponse) {
  try {
    // Create element picker if not exists
    if (!elementPicker) {
      elementPicker = new ElementPicker();
    }

    // Start picker with callback
    elementPicker.start((elementMetadata) => {
      console.log('✅ Element selected:', elementMetadata);

      // Send element metadata back to panel
      chrome.runtime.sendMessage({
        type: 'ELEMENT_SELECTED',
        data: elementMetadata,
        tabId: message.tabId
      });

      // Capture screenshot of selected element
      captureElementScreenshot(elementMetadata);
    });

    sendResponse({ success: true, message: 'Element picker started' });
  } catch (error) {
    console.error('❌ Failed to start element picker:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Stop element picker mode
 */
function handleStopElementPicker(message, sendResponse) {
  try {
    if (elementPicker) {
      elementPicker.stop();
    }
    sendResponse({ success: true, message: 'Element picker stopped' });
  } catch (error) {
    console.error('❌ Failed to stop element picker:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Capture screenshot of selected element
 */
async function captureElementScreenshot(elementMetadata) {
  try {
    // Request screenshot from background script
    const response = await chrome.runtime.sendMessage({
      type: 'CAPTURE_ELEMENT_SCREENSHOT',
      data: {
        selector: elementMetadata.selector,
        bounds: elementMetadata.bounds
      }
    });

    if (response.success) {
      console.log('✅ Element screenshot captured');
    } else {
      console.error('❌ Element screenshot failed:', response.error);
    }
  } catch (error) {
    console.error('❌ Failed to capture element screenshot:', error);
  }
}

/**
 * ElementPicker class (same as before, but in content script context)
 */
class ElementPicker {
  constructor() {
    this.isActive = false;
    this.overlay = null;
    this.tooltip = null;
    this.currentElement = null;
    this.onElementSelectedCallback = null;
  }

  start(callback) {
    if (this.isActive) {
      console.warn('⚠️ Element picker already active');
      return;
    }

    console.log('🎯 Starting element picker...');
    this.isActive = true;
    this.onElementSelectedCallback = callback;

    this.createOverlay();
    this.createTooltip();
    this.attachEventListeners();

    document.body.style.cursor = 'crosshair';
  }

  stop() {
    if (!this.isActive) return;

    console.log('🛑 Stopping element picker');
    this.isActive = false;

    this.removeOverlay();
    this.removeTooltip();
    this.detachEventListeners();

    document.body.style.cursor = '';
    this.currentElement = null;
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'browser-tools-element-picker-overlay';
    this.overlay.style.cssText = `
      position: absolute;
      background: rgba(14, 165, 233, 0.2);
      border: 2px solid rgba(14, 165, 233, 0.8);
      pointer-events: none;
      z-index: 2147483646;
      transition: all 0.1s ease;
      display: none;
    `;
    document.body.appendChild(this.overlay);
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'browser-tools-element-picker-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      padding: 6px 10px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 11px;
      pointer-events: none;
      z-index: 2147483647;
      display: none;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(this.tooltip);
  }

  removeOverlay() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
  }

  removeTooltip() {
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    this.tooltip = null;
  }

  attachEventListeners() {
    this.handleMouseMove = this.onMouseMove.bind(this);
    this.handleClick = this.onClick.bind(this);
    this.handleKeyDown = this.onKeyDown.bind(this);

    document.addEventListener('mousemove', this.handleMouseMove, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown, true);
  }

  detachEventListeners() {
    if (this.handleMouseMove) {
      document.removeEventListener('mousemove', this.handleMouseMove, true);
    }
    if (this.handleClick) {
      document.removeEventListener('click', this.handleClick, true);
    }
    if (this.handleKeyDown) {
      document.removeEventListener('keydown', this.handleKeyDown, true);
    }
  }

  onMouseMove(e) {
    if (!this.isActive) return;

    const element = e.target;

    if (element === this.overlay || element === this.tooltip) {
      return;
    }

    this.currentElement = element;
    this.updateOverlay(element);
    this.updateTooltip(element, e.clientX, e.clientY);
  }

  onClick(e) {
    if (!this.isActive) return;

    e.preventDefault();
    e.stopPropagation();

    if (this.currentElement && this.onElementSelectedCallback) {
      const metadata = this.extractElementMetadata(this.currentElement);
      this.onElementSelectedCallback(metadata);
    }

    this.stop();
  }

  onKeyDown(e) {
    if (!this.isActive) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.stop();
    }
  }

  updateOverlay(element) {
    if (!this.overlay) return;

    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    this.overlay.style.display = 'block';
    this.overlay.style.left = `${rect.left + scrollX}px`;
    this.overlay.style.top = `${rect.top + scrollY}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
  }

  updateTooltip(element, mouseX, mouseY) {
    if (!this.tooltip) return;

    const selector = this.generateSelector(element);
    const rect = element.getBoundingClientRect();
    const dimensions = `${Math.round(rect.width)}×${Math.round(rect.height)}px`;

    this.tooltip.innerHTML = `
      <div style="color: #0ea5e9; font-weight: 600;">${this.escapeHtml(selector)}</div>
      <div style="color: #a1a1aa; font-size: 10px; margin-top: 2px;">${dimensions}</div>
    `;

    this.tooltip.style.display = 'block';

    const tooltipRect = this.tooltip.getBoundingClientRect();
    let left = mouseX + 10;
    let top = mouseY + 10;

    if (left + tooltipRect.width > window.innerWidth) {
      left = mouseX - tooltipRect.width - 10;
    }
    if (top + tooltipRect.height > window.innerHeight) {
      top = mouseY - tooltipRect.height - 10;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  generateSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes[0]}`;
      }
    }

    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      const parentSelector = parent.tagName === 'BODY' ? '' : this.generateSelector(parent) + ' > ';
      return `${parentSelector}${element.tagName.toLowerCase()}:nth-child(${index})`;
    }

    return element.tagName.toLowerCase();
  }

  extractElementMetadata(element) {
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    return {
      selector: this.generateSelector(element),
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      bounds: {
        x: rect.left + scrollX,
        y: rect.top + scrollY,
        width: rect.width,
        height: rect.height,
      },
      textContent: element.textContent?.slice(0, 100) || null,
    };
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

console.log('✅ Element picker content script loaded');
