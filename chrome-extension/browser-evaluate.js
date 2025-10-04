/**
 * Browser Evaluate Tool
 *
 * Executes JavaScript code in the page context.
 * Supports both synchronous and asynchronous code execution.
 */

class BrowserEvaluateTool {
  constructor() {
    this.lastEvaluation = null;
    this.defaultTimeout = 30000; // 30 seconds
  }

  /**
   * Execute JavaScript code in page context
   * @param {string} code - JavaScript code to execute
   * @param {Object} options - Evaluation options
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluate(code, options = {}) {
    const {
      timeout = this.defaultTimeout,
      returnByValue = true,
      awaitPromise = true
    } = options;

    const startTime = Date.now();

    try {
      // Validate code
      if (!code || typeof code !== 'string') {
        return {
          success: false,
          error: 'Code must be a non-empty string'
        };
      }

      // Create execution promise with timeout
      const executionPromise = new Promise(async (resolve, reject) => {
        try {
          // Wrap code in async function to support await
          const wrappedCode = awaitPromise
            ? `(async () => { ${code} })()`
            : `(() => { ${code} })()`;

          // Execute the code
          const result = await eval(wrappedCode);

          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      // Add timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Execution timeout after ${timeout}ms`));
        }, timeout);
      });

      // Race between execution and timeout
      const result = await Promise.race([executionPromise, timeoutPromise]);

      // Serialize result if needed
      let serializedResult;
      if (returnByValue) {
        try {
          serializedResult = this.serializeValue(result);
        } catch (error) {
          serializedResult = {
            type: 'error',
            message: 'Result could not be serialized',
            error: error.message
          };
        }
      } else {
        serializedResult = {
          type: typeof result,
          preview: String(result).substring(0, 100)
        };
      }

      this.lastEvaluation = {
        code: code.substring(0, 200),
        result: serializedResult,
        timestamp: Date.now(),
        elapsed: Date.now() - startTime
      };

      return {
        success: true,
        result: serializedResult,
        type: typeof result,
        elapsed: Date.now() - startTime,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        elapsed: Date.now() - startTime
      };
    }
  }

  /**
   * Serialize evaluation result
   * @private
   */
  serializeValue(value) {
    if (value === undefined) return { type: 'undefined' };
    if (value === null) return { type: 'null', value: null };

    const type = typeof value;

    switch (type) {
      case 'boolean':
      case 'number':
      case 'string':
        return { type, value };

      case 'function':
        return {
          type: 'function',
          name: value.name || '(anonymous)',
          source: value.toString().substring(0, 200)
        };

      case 'object':
        if (Array.isArray(value)) {
          return {
            type: 'array',
            length: value.length,
            value: value.slice(0, 100).map(v => this.serializeValue(v))
          };
        }

        if (value instanceof Error) {
          return {
            type: 'error',
            message: value.message,
            stack: value.stack
          };
        }

        if (value instanceof Element) {
          return {
            type: 'element',
            tagName: value.tagName.toLowerCase(),
            id: value.id || undefined,
            className: value.className || undefined,
            outerHTML: value.outerHTML.substring(0, 200)
          };
        }

        if (value instanceof NodeList || value instanceof HTMLCollection) {
          return {
            type: 'nodelist',
            length: value.length,
            items: Array.from(value).slice(0, 20).map(node => ({
              tagName: node.tagName?.toLowerCase(),
              id: node.id,
              className: node.className
            }))
          };
        }

        // Plain object
        try {
          const serialized = {};
          const keys = Object.keys(value).slice(0, 50);
          for (const key of keys) {
            try {
              serialized[key] = this.serializeValue(value[key]);
            } catch (e) {
              serialized[key] = { type: 'error', message: 'Could not serialize' };
            }
          }
          return {
            type: 'object',
            value: serialized,
            keys: Object.keys(value).length
          };
        } catch (e) {
          return {
            type: 'object',
            error: 'Could not serialize object'
          };
        }

      default:
        return {
          type: 'unknown',
          value: String(value).substring(0, 100)
        };
    }
  }

  /**
   * Execute code and return DOM element
   * @param {string} code - Code that returns an element
   * @returns {Promise<Object>} Element result
   */
  async evaluateForElement(code) {
    const result = await this.evaluate(code, { returnByValue: false });

    if (!result.success) {
      return result;
    }

    // Verify result is an element
    const element = await eval(code);

    if (!(element instanceof Element)) {
      return {
        success: false,
        error: 'Code did not return a DOM element',
        actualType: typeof element
      };
    }

    return {
      success: true,
      element: {
        tagName: element.tagName.toLowerCase(),
        id: element.id || undefined,
        className: element.className || undefined,
        textContent: element.textContent?.substring(0, 100),
        outerHTML: element.outerHTML.substring(0, 200)
      }
    };
  }

  /**
   * Get last evaluation info
   */
  getLastEvaluation() {
    return this.lastEvaluation;
  }

  /**
   * Execute multiple code snippets in sequence
   * @param {Array<string>} codeArray - Array of code strings
   * @returns {Promise<Object>} Results array
   */
  async evaluateMultiple(codeArray) {
    const results = [];

    for (const code of codeArray) {
      const result = await this.evaluate(code);
      results.push(result);

      // Stop on first error if specified
      if (!result.success) {
        break;
      }
    }

    return {
      success: results.every(r => r.success),
      results,
      totalExecuted: results.length,
      timestamp: Date.now()
    };
  }
}

// Make available globally
window.BrowserEvaluateTool = BrowserEvaluateTool;
