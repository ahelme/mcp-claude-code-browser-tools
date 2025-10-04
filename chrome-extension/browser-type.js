/**
 * Browser Type Tool
 *
 * Types text into input fields and editable elements.
 * Supports various input types and validation.
 */

class BrowserTypeTool {
  constructor() {
    this.lastTyped = null;
  }

  /**
   * Type text into an element
   * @param {string} selector - CSS selector for input element
   * @param {string} text - Text to type
   * @param {Object} options - Type options
   * @returns {Object} Type result
   */
  async type(selector, text, options = {}) {
    const {
      clear = false,
      delay = 50, // ms between keystrokes
      pressEnter = false,
      scrollIntoView = true
    } = options;

    try {
      const element = document.querySelector(selector);

      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`
        };
      }

      // Check if element is typeable
      const isInput = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
      const isEditable = element.isContentEditable;

      if (!isInput && !isEditable) {
        return {
          success: false,
          error: `Element is not typeable: ${selector}`,
          elementType: element.tagName.toLowerCase()
        };
      }

      // Scroll into view
      if (scrollIntoView) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.wait(200);
      }

      // Focus the element
      element.focus();

      // Clear existing value if requested
      if (clear) {
        if (isInput) {
          element.value = '';
        } else {
          element.textContent = '';
        }
      }

      // Type text character by character
      for (const char of text) {
        if (isInput) {
          element.value += char;
        } else {
          element.textContent += char;
        }

        // Dispatch input event
        element.dispatchEvent(new Event('input', { bubbles: true }));

        // Delay between keystrokes if specified
        if (delay > 0) {
          await this.wait(delay);
        }
      }

      // Dispatch change event
      element.dispatchEvent(new Event('change', { bubbles: true }));

      // Press Enter if requested
      if (pressEnter) {
        element.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          bubbles: true
        }));
      }

      this.lastTyped = {
        selector,
        text,
        element: element.tagName.toLowerCase(),
        timestamp: Date.now()
      };

      return {
        success: true,
        selector,
        text,
        element: element.tagName.toLowerCase(),
        cleared: clear,
        enteredPressed: pressEnter,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        selector
      };
    }
  }

  /**
   * Wait helper
   * @private
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get last typed element info
   */
  getLastTyped() {
    return this.lastTyped;
  }

  /**
   * Clear an input field
   * @param {string} selector - CSS selector for input element
   */
  async clear(selector) {
    const element = document.querySelector(selector);

    if (!element) {
      return {
        success: false,
        error: `Element not found: ${selector}`
      };
    }

    const isInput = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';

    if (isInput) {
      element.value = '';
    } else if (element.isContentEditable) {
      element.textContent = '';
    } else {
      return {
        success: false,
        error: 'Element is not clearable'
      };
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    return {
      success: true,
      selector,
      cleared: true
    };
  }
}

// Make available globally
window.BrowserTypeTool = BrowserTypeTool;
