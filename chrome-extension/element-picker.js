/**
 * Element Picker - Interactive Element Selection for Screenshots
 *
 * Provides a visual overlay system for selecting elements on the page.
 * Users can hover to see element info and click to capture screenshots.
 *
 * Features:
 * - Blue hover overlay showing element bounds
 * - Tooltip with selector and dimensions
 * - Click to capture element screenshot
 * - ESC to cancel picker mode
 * - Element metadata extraction
 */

class ElementPicker {
  constructor() {
    this.isActive = false;
    this.overlay = null;
    this.tooltip = null;
    this.currentElement = null;
    this.onElementSelectedCallback = null;
  }

  /**
   * Start element picker mode
   * @param {Function} callback - Called when element is selected with metadata
   */
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

    // Visual feedback
    document.body.style.cursor = 'crosshair';
  }

  /**
   * Stop element picker mode
   */
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

  /**
   * Create the blue overlay element
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'element-picker-overlay';
    this.overlay.style.cssText = `
      position: absolute;
      background: rgba(14, 165, 233, 0.2);
      border: 2px solid rgba(14, 165, 233, 0.8);
      pointer-events: none;
      z-index: 999999;
      transition: all 0.1s ease;
      display: none;
    `;
    document.body.appendChild(this.overlay);
  }

  /**
   * Create the tooltip element
   */
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'element-picker-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      padding: 6px 10px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 11px;
      pointer-events: none;
      z-index: 1000000;
      display: none;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(this.tooltip);
  }

  /**
   * Remove overlay from DOM
   */
  removeOverlay() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
  }

  /**
   * Remove tooltip from DOM
   */
  removeTooltip() {
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    this.tooltip = null;
  }

  /**
   * Attach event listeners for picker interaction
   */
  attachEventListeners() {
    this.handleMouseMove = this.onMouseMove.bind(this);
    this.handleClick = this.onClick.bind(this);
    this.handleKeyDown = this.onKeyDown.bind(this);

    document.addEventListener('mousemove', this.handleMouseMove, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown, true);
  }

  /**
   * Detach event listeners
   */
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

  /**
   * Handle mouse move - update overlay and tooltip
   */
  onMouseMove(e) {
    if (!this.isActive) return;

    const element = e.target;

    // Ignore picker UI elements
    if (element === this.overlay || element === this.tooltip) {
      return;
    }

    this.currentElement = element;
    this.updateOverlay(element);
    this.updateTooltip(element, e.clientX, e.clientY);
  }

  /**
   * Handle click - capture element
   */
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

  /**
   * Handle keyboard - ESC to cancel
   */
  onKeyDown(e) {
    if (!this.isActive) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.stop();
    }
  }

  /**
   * Update overlay position and size
   */
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

  /**
   * Update tooltip content and position
   */
  updateTooltip(element, mouseX, mouseY) {
    if (!this.tooltip) return;

    const selector = this.generateSelector(element);
    const rect = element.getBoundingClientRect();
    const dimensions = `${Math.round(rect.width)}×${Math.round(rect.height)}px`;

    this.tooltip.innerHTML = `
      <div style="color: #0ea5e9; font-weight: 600;">${selector}</div>
      <div style="color: #a1a1aa; font-size: 10px; margin-top: 2px;">${dimensions}</div>
    `;

    this.tooltip.style.display = 'block';

    // Position tooltip near cursor, but avoid overflow
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

  /**
   * Generate a CSS selector for an element
   */
  generateSelector(element) {
    // Prefer ID
    if (element.id) {
      return `#${element.id}`;
    }

    // Try class names
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes[0]}`;
      }
    }

    // Use tag name with nth-child
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      const parentSelector = parent.tagName === 'BODY' ? '' : this.generateSelector(parent) + ' > ';
      return `${parentSelector}${element.tagName.toLowerCase()}:nth-child(${index})`;
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Extract metadata from selected element
   */
  extractElementMetadata(element) {
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const metadata = {
      selector: this.generateSelector(element),
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      bounds: {
        x: rect.left + scrollX,
        y: rect.top + scrollY,
        width: rect.width,
        height: rect.height,
        top: rect.top + scrollY,
        right: rect.right + scrollX,
        bottom: rect.bottom + scrollY,
        left: rect.left + scrollX,
      },
      computedStyle: this.getRelevantStyles(element),
      attributes: this.getElementAttributes(element),
      textContent: element.textContent?.slice(0, 100) || null,
    };

    return metadata;
  }

  /**
   * Get relevant computed styles
   */
  getRelevantStyles(element) {
    const computed = window.getComputedStyle(element);
    return {
      display: computed.display,
      position: computed.position,
      zIndex: computed.zIndex,
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontSize: computed.fontSize,
      fontFamily: computed.fontFamily,
    };
  }

  /**
   * Get element attributes as object
   */
  getElementAttributes(element) {
    const attrs = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }
}

// Make available globally
window.ElementPicker = ElementPicker;
