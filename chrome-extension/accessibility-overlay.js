/**
 * Accessibility Overlay - Visual A11y Indicators
 *
 * Provides visual indicators for accessibility issues directly on screenshots
 * and live pages. Highlights ARIA problems, contrast issues, missing labels,
 * keyboard navigation problems, and semantic HTML violations.
 *
 * Features:
 * - Visual overlay showing a11y issues
 * - Color contrast analysis (WCAG AA/AAA)
 * - Missing ARIA labels detection
 * - Keyboard navigation validation
 * - Semantic HTML check
 * - Screen reader compatibility hints
 *
 * Use Cases:
 * - Accessibility audits
 * - WCAG compliance verification
 * - Design review for a11y
 * - Screen reader testing prep
 * - Keyboard navigation testing
 */

class AccessibilityOverlay {
  constructor() {
    this.overlayId = 'a11y-overlay';
    this.issues = [];
    this.wcagLevel = 'AA'; // AA or AAA
  }

  /**
   * Analyze accessibility of an element
   * @param {string} selector - CSS selector for target element
   * @param {Object} options - Analysis options
   * @returns {Object} Accessibility analysis results
   */
  analyzeElement(selector, options = {}) {
    const {
      checkContrast = true,
      checkAria = true,
      checkKeyboard = true,
      checkSemantic = true,
      wcagLevel = this.wcagLevel
    } = options;

    const element = document.querySelector(selector);

    if (!element) {
      return {
        success: false,
        error: `Element not found: ${selector}`
      };
    }

    const issues = [];

    // Contrast check
    if (checkContrast) {
      const contrastIssues = this.checkColorContrast(element, wcagLevel);
      issues.push(...contrastIssues);
    }

    // ARIA check
    if (checkAria) {
      const ariaIssues = this.checkAria(element);
      issues.push(...ariaIssues);
    }

    // Keyboard navigation check
    if (checkKeyboard) {
      const keyboardIssues = this.checkKeyboardAccessibility(element);
      issues.push(...keyboardIssues);
    }

    // Semantic HTML check
    if (checkSemantic) {
      const semanticIssues = this.checkSemanticHTML(element);
      issues.push(...semanticIssues);
    }

    return {
      success: true,
      selector,
      wcagLevel,
      issueCount: issues.length,
      issues: issues.map((issue, index) => ({ ...issue, id: index })),
      summary: {
        critical: issues.filter(i => i.severity === 'critical').length,
        warning: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length
      }
    };
  }

  /**
   * Check color contrast compliance
   * @private
   */
  checkColorContrast(element, wcagLevel) {
    const issues = [];
    const computed = window.getComputedStyle(element);
    const color = computed.color;
    const background = computed.backgroundColor;

    // Skip if no text content
    if (!element.textContent.trim()) {
      return issues;
    }

    const fontSize = parseFloat(computed.fontSize);
    const fontWeight = computed.fontWeight;
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && parseInt(fontWeight) >= 700);

    const ratio = this.calculateContrastRatio(color, background);

    const thresholds = {
      AA: isLargeText ? 3 : 4.5,
      AAA: isLargeText ? 4.5 : 7
    };

    if (ratio < thresholds[wcagLevel]) {
      issues.push({
        type: 'contrast',
        severity: 'critical',
        message: `Insufficient color contrast (${ratio.toFixed(2)}:1). Required: ${thresholds[wcagLevel]}:1 for WCAG ${wcagLevel}`,
        element: element.tagName.toLowerCase(),
        details: {
          ratio,
          required: thresholds[wcagLevel],
          color,
          background,
          isLargeText
        }
      });
    }

    return issues;
  }

  /**
   * Calculate contrast ratio between two colors
   * @private
   */
  calculateContrastRatio(color1, color2) {
    const l1 = this.relativeLuminance(color1);
    const l2 = this.relativeLuminance(color2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculate relative luminance of a color
   * @private
   */
  relativeLuminance(color) {
    // Parse RGB from color string
    const rgb = color.match(/\d+/g).map(Number);
    const [r, g, b] = rgb.map(val => {
      const sRGB = val / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Check ARIA attributes
   * @private
   */
  checkAria(element) {
    const issues = [];

    // Check for aria-label or aria-labelledby
    const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(
      element.tagName.toLowerCase()
    );

    if (isInteractive && element.getAttribute('role')) {
      const hasLabel = element.getAttribute('aria-label') ||
                      element.getAttribute('aria-labelledby') ||
                      element.textContent.trim();

      if (!hasLabel) {
        issues.push({
          type: 'aria',
          severity: 'critical',
          message: 'Interactive element missing accessible label',
          element: element.tagName.toLowerCase(),
          details: {
            role: element.getAttribute('role'),
            suggestion: 'Add aria-label or aria-labelledby attribute'
          }
        });
      }
    }

    // Check for invalid ARIA attributes
    const ariaAttrs = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('aria-'));

    ariaAttrs.forEach(attr => {
      if (!this.isValidAriaAttribute(attr.name)) {
        issues.push({
          type: 'aria',
          severity: 'warning',
          message: `Invalid ARIA attribute: ${attr.name}`,
          element: element.tagName.toLowerCase(),
          details: {
            attribute: attr.name,
            value: attr.value
          }
        });
      }
    });

    return issues;
  }

  /**
   * Check if ARIA attribute is valid (simplified check)
   * @private
   */
  isValidAriaAttribute(name) {
    const validAria = [
      'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
      'aria-expanded', 'aria-pressed', 'aria-selected', 'aria-checked',
      'aria-current', 'aria-disabled', 'aria-readonly', 'aria-required',
      'aria-invalid', 'aria-live', 'aria-atomic', 'aria-busy'
    ];
    return validAria.includes(name);
  }

  /**
   * Check keyboard accessibility
   * @private
   */
  checkKeyboardAccessibility(element) {
    const issues = [];

    const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(
      element.tagName.toLowerCase()
    );

    const isClickable = element.onclick ||
                       element.getAttribute('onclick') ||
                       window.getEventListeners?.(element)?.click?.length > 0;

    if (isClickable && !isInteractive) {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex === null || parseInt(tabIndex) < 0) {
        issues.push({
          type: 'keyboard',
          severity: 'critical',
          message: 'Clickable element not keyboard accessible',
          element: element.tagName.toLowerCase(),
          details: {
            suggestion: 'Add tabindex="0" or use a semantic element like <button>'
          }
        });
      }
    }

    // Check for keyboard trap
    if (element.tabIndex >= 0) {
      const focusable = element.querySelectorAll('[tabindex]');
      if (focusable.length > 0 && !element.querySelector('[tabindex="-1"]')) {
        // Simplified check - real implementation would test focus flow
        issues.push({
          type: 'keyboard',
          severity: 'warning',
          message: 'Potential keyboard trap detected',
          element: element.tagName.toLowerCase(),
          details: {
            focusableElements: focusable.length
          }
        });
      }
    }

    return issues;
  }

  /**
   * Check semantic HTML
   * @private
   */
  checkSemanticHTML(element) {
    const issues = [];

    // Check for divs/spans with click handlers
    if (['div', 'span'].includes(element.tagName.toLowerCase())) {
      const hasClickHandler = element.onclick || element.getAttribute('onclick');
      if (hasClickHandler) {
        issues.push({
          type: 'semantic',
          severity: 'warning',
          message: `Using ${element.tagName.toLowerCase()} for interactive element`,
          element: element.tagName.toLowerCase(),
          details: {
            suggestion: 'Use <button> or <a> for better accessibility'
          }
        });
      }
    }

    // Check images for alt text
    if (element.tagName.toLowerCase() === 'img') {
      const alt = element.getAttribute('alt');
      if (alt === null || alt === undefined) {
        issues.push({
          type: 'semantic',
          severity: 'critical',
          message: 'Image missing alt attribute',
          element: 'img',
          details: {
            src: element.src,
            suggestion: 'Add descriptive alt text or alt="" for decorative images'
          }
        });
      }
    }

    return issues;
  }

  /**
   * Show visual overlay with accessibility issues
   * @param {string} selector - CSS selector for target element
   * @param {Object} options - Display options
   */
  showOverlay(selector, options = {}) {
    const analysis = this.analyzeElement(selector, options);

    if (!analysis.success) {
      return analysis;
    }

    // Remove existing overlay
    this.clearOverlay();

    const element = document.querySelector(selector);
    const rect = element.getBoundingClientRect();

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
      font-family: sans-serif;
      font-size: 12px;
    `;

    // Element highlight based on issue severity
    const severityColors = {
      critical: '#ff4444',
      warning: '#ffaa00',
      info: '#4444ff'
    };

    const maxSeverity = analysis.issues.length > 0 ?
      analysis.issues.reduce((max, issue) =>
        issue.severity === 'critical' ? 'critical' :
        (max === 'critical' ? 'critical' :
         (issue.severity === 'warning' ? 'warning' : max)), 'info'
      ) : 'info';

    const highlight = document.createElement('div');
    highlight.style.cssText = `
      position: absolute;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 3px solid ${severityColors[maxSeverity]};
      background: ${severityColors[maxSeverity]}20;
    `;
    overlay.appendChild(highlight);

    // Issue badges
    analysis.issues.forEach((issue, index) => {
      const badge = document.createElement('div');
      badge.style.cssText = `
        position: absolute;
        top: ${rect.top - 25 - (index * 25)}px;
        left: ${rect.left}px;
        background: ${severityColors[issue.severity]};
        color: white;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 11px;
        white-space: nowrap;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      badge.textContent = `${issue.type.toUpperCase()}: ${issue.message}`;
      badge.title = issue.message; // Full text on hover
      overlay.appendChild(badge);
    });

    // Summary indicator
    if (analysis.issueCount > 0) {
      const summary = document.createElement('div');
      summary.style.cssText = `
        position: absolute;
        top: ${rect.bottom + 5}px;
        left: ${rect.left}px;
        background: #000;
        color: #fff;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 11px;
      `;
      summary.textContent = `⚠️ ${analysis.issueCount} a11y issue${analysis.issueCount > 1 ? 's' : ''} found`;
      overlay.appendChild(summary);
    }

    document.body.appendChild(overlay);

    return {
      success: true,
      overlayId: this.overlayId,
      analysis
    };
  }

  /**
   * Clear accessibility overlay
   */
  clearOverlay() {
    const existing = document.getElementById(this.overlayId);
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Analyze entire page for accessibility issues
   */
  analyzePage() {
    const allElements = document.querySelectorAll('*');
    const pageIssues = [];

    allElements.forEach(el => {
      const analysis = this.analyzeElement(el.tagName, { checkContrast: true, checkAria: true, checkKeyboard: true, checkSemantic: true });
      if (analysis.success && analysis.issues.length > 0) {
        pageIssues.push({
          element: el,
          selector: this.generateSelector(el),
          issues: analysis.issues
        });
      }
    });

    return {
      success: true,
      totalElements: allElements.length,
      elementsWithIssues: pageIssues.length,
      totalIssues: pageIssues.reduce((sum, item) => sum + item.issues.length, 0),
      issues: pageIssues
    };
  }

  /**
   * Generate CSS selector for element
   * @private
   */
  generateSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    if (element.className) {
      return `${element.tagName.toLowerCase()}.${element.className.split(' ')[0]}`;
    }
    return element.tagName.toLowerCase();
  }
}

// Make available globally
window.AccessibilityOverlay = AccessibilityOverlay;
