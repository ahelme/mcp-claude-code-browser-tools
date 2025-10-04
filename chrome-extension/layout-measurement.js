/**
 * Layout Measurement Tool - Precise Alignment & Spacing Data
 *
 * Provides pixel-perfect measurements of element dimensions, positions,
 * spacing, and alignment using getBoundingClientRect() and computed styles.
 *
 * Features:
 * - Element dimensions (width, height, padding, margin, border)
 * - Absolute positioning (x, y coordinates)
 * - Relative spacing between elements
 * - Alignment verification (is element aligned with another?)
 * - Visual overlay with measurement annotations
 *
 * Use Cases:
 * - Design QA and pixel-perfection validation
 * - Responsive layout debugging
 * - Alignment verification
 * - Spacing consistency checks
 */

class LayoutMeasurementTool {
  constructor() {
    this.measurements = new Map();
    this.overlayId = 'layout-measurement-overlay';
  }

  /**
   * Measure a single element's layout properties
   * @param {string} selector - CSS selector for target element
   * @returns {Object} Complete measurement data
   */
  measureElement(selector) {
    const element = document.querySelector(selector);

    if (!element) {
      return {
        success: false,
        error: `Element not found: ${selector}`
      };
    }

    const rect = element.getBoundingClientRect();
    const computed = window.getComputedStyle(element);

    const measurements = {
      success: true,
      selector,
      dimensions: {
        width: rect.width,
        height: rect.height,
        innerWidth: element.clientWidth,
        innerHeight: element.clientHeight,
        outerWidth: element.offsetWidth,
        outerHeight: element.offsetHeight
      },
      position: {
        x: rect.x,
        y: rect.y,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        offsetTop: element.offsetTop,
        offsetLeft: element.offsetLeft
      },
      spacing: {
        marginTop: parseFloat(computed.marginTop),
        marginRight: parseFloat(computed.marginRight),
        marginBottom: parseFloat(computed.marginBottom),
        marginLeft: parseFloat(computed.marginLeft),
        paddingTop: parseFloat(computed.paddingTop),
        paddingRight: parseFloat(computed.paddingRight),
        paddingBottom: parseFloat(computed.paddingBottom),
        paddingLeft: parseFloat(computed.paddingLeft)
      },
      border: {
        top: parseFloat(computed.borderTopWidth),
        right: parseFloat(computed.borderRightWidth),
        bottom: parseFloat(computed.borderBottomWidth),
        left: parseFloat(computed.borderLeftWidth)
      },
      computed: {
        display: computed.display,
        position: computed.position,
        float: computed.float,
        zIndex: computed.zIndex,
        boxSizing: computed.boxSizing
      },
      viewport: {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      }
    };

    // Store for comparison
    this.measurements.set(selector, measurements);

    return measurements;
  }

  /**
   * Measure spacing between two elements
   * @param {string} selector1 - First element selector
   * @param {string} selector2 - Second element selector
   * @returns {Object} Spacing measurements between elements
   */
  measureSpacing(selector1, selector2) {
    const el1 = document.querySelector(selector1);
    const el2 = document.querySelector(selector2);

    if (!el1 || !el2) {
      return {
        success: false,
        error: 'One or both elements not found'
      };
    }

    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    return {
      success: true,
      elements: {
        first: selector1,
        second: selector2
      },
      horizontal: {
        distance: Math.abs(rect2.left - rect1.right),
        overlap: Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left)),
        leftToLeft: rect2.left - rect1.left,
        rightToRight: rect2.right - rect1.right
      },
      vertical: {
        distance: Math.abs(rect2.top - rect1.bottom),
        overlap: Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top)),
        topToTop: rect2.top - rect1.top,
        bottomToBottom: rect2.bottom - rect1.bottom
      },
      alignment: {
        leftEdges: Math.abs(rect1.left - rect2.left) < 1,
        rightEdges: Math.abs(rect1.right - rect2.right) < 1,
        topEdges: Math.abs(rect1.top - rect2.top) < 1,
        bottomEdges: Math.abs(rect1.bottom - rect2.bottom) < 1,
        centerHorizontal: Math.abs((rect1.left + rect1.width/2) - (rect2.left + rect2.width/2)) < 1,
        centerVertical: Math.abs((rect1.top + rect1.height/2) - (rect2.top + rect2.height/2)) < 1
      }
    };
  }

  /**
   * Check if elements are aligned
   * @param {string} selector1 - First element selector
   * @param {string} selector2 - Second element selector
   * @param {string} edge - Edge to check: 'left', 'right', 'top', 'bottom', 'center-h', 'center-v'
   * @param {number} tolerance - Pixel tolerance (default: 1)
   */
  checkAlignment(selector1, selector2, edge, tolerance = 1) {
    const spacing = this.measureSpacing(selector1, selector2);

    if (!spacing.success) {
      return spacing;
    }

    const aligned = spacing.alignment;

    const edgeMap = {
      'left': aligned.leftEdges,
      'right': aligned.rightEdges,
      'top': aligned.topEdges,
      'bottom': aligned.bottomEdges,
      'center-h': aligned.centerHorizontal,
      'center-v': aligned.centerVertical
    };

    return {
      success: true,
      isAligned: edgeMap[edge] || false,
      edge,
      tolerance,
      elements: spacing.elements
    };
  }

  /**
   * Create visual overlay showing measurements
   * @param {string} selector - Element to measure
   * @param {Object} options - Display options
   */
  showMeasurementOverlay(selector, options = {}) {
    const {
      showDimensions = true,
      showSpacing = true,
      showPosition = true,
      color = '#00f6ff'
    } = options;

    const measurements = this.measureElement(selector);

    if (!measurements.success) {
      return measurements;
    }

    // Remove existing overlay
    this.clearOverlay();

    const el = document.querySelector(selector);
    const rect = el.getBoundingClientRect();

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = this.overlayId;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999999;
      font-family: monospace;
      font-size: 11px;
    `;

    // Element outline
    const outline = document.createElement('div');
    outline.style.cssText = `
      position: absolute;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px solid ${color};
      background: ${color}20;
    `;
    overlay.appendChild(outline);

    // Dimension labels
    if (showDimensions) {
      const widthLabel = this.createLabel(
        `${rect.width.toFixed(1)}px`,
        rect.left + rect.width/2,
        rect.top - 15,
        color
      );
      const heightLabel = this.createLabel(
        `${rect.height.toFixed(1)}px`,
        rect.left - 40,
        rect.top + rect.height/2,
        color
      );
      overlay.appendChild(widthLabel);
      overlay.appendChild(heightLabel);
    }

    // Spacing indicators
    if (showSpacing) {
      const { marginTop, marginLeft } = measurements.spacing;
      if (marginTop > 0) {
        const marginTopLabel = this.createLabel(
          `margin-top: ${marginTop}px`,
          rect.left,
          rect.top - marginTop - 5,
          '#ff6b6b'
        );
        overlay.appendChild(marginTopLabel);
      }
      if (marginLeft > 0) {
        const marginLeftLabel = this.createLabel(
          `margin-left: ${marginLeft}px`,
          rect.left - marginLeft - 70,
          rect.top,
          '#ff6b6b'
        );
        overlay.appendChild(marginLeftLabel);
      }
    }

    // Position indicator
    if (showPosition) {
      const posLabel = this.createLabel(
        `(${rect.x.toFixed(1)}, ${rect.y.toFixed(1)})`,
        rect.left,
        rect.top - 30,
        color
      );
      overlay.appendChild(posLabel);
    }

    document.body.appendChild(overlay);

    return {
      success: true,
      overlayId: this.overlayId,
      measurements
    };
  }

  /**
   * Create measurement label element
   * @private
   */
  createLabel(text, x, y, color) {
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      background: ${color};
      color: #000;
      padding: 2px 4px;
      border-radius: 2px;
      font-weight: bold;
      white-space: nowrap;
    `;
    label.textContent = text;
    return label;
  }

  /**
   * Clear measurement overlay
   */
  clearOverlay() {
    const existing = document.getElementById(this.overlayId);
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Get all stored measurements
   */
  getAllMeasurements() {
    return Object.fromEntries(this.measurements);
  }

  /**
   * Clear all stored measurements
   */
  clearMeasurements() {
    this.measurements.clear();
  }
}

// Make available globally
window.LayoutMeasurementTool = LayoutMeasurementTool;
