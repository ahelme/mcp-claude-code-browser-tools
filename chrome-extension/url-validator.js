/**
 * URL Validation Utility Module
 *
 * Extracted URL validation logic for better code organization and reusability.
 * Handles URL validation, normalization, and security checking.
 */

import { URL_VALIDATION_CONFIG, ERROR_MESSAGES } from './constants.js';

/**
 * URL Validator Class
 * Provides comprehensive URL validation with security features
 */
export class URLValidator {
  constructor() {
    this.config = URL_VALIDATION_CONFIG;
    this.errorMessages = ERROR_MESSAGES.URL_VALIDATION;
  }

  /**
   * Validate URL format and security compliance
   * @param {string} url - URL to validate
   * @returns {Object} Validation result with isValid boolean and error message
   */
  validateUrl(url) {
    // Basic validation
    if (!this._isValidString(url)) {
      return {
        isValid: false,
        error: this.errorMessages.EMPTY
      };
    }

    const trimmedUrl = url.trim();

    // Check URL length
    if (trimmedUrl.length > this.config.MAX_URL_LENGTH) {
      return {
        isValid: false,
        error: this.errorMessages.URL_TOO_LONG.replace('{max}', this.config.MAX_URL_LENGTH)
      };
    }

    // Check for blocked protocols (allow devtools for Chrome extension context)
    const protocolCheck = this._checkProtocols(trimmedUrl);
    if (!protocolCheck.isValid) {
      return protocolCheck;
    }

    // Check for data URLs (can be dangerous)
    if (trimmedUrl.toLowerCase().startsWith('data:')) {
      return {
        isValid: false,
        error: this.errorMessages.DATA_URL_BLOCKED
      };
    }

    // URL format validation
    return this._validateUrlFormat(trimmedUrl);
  }

  /**
   * Normalize URL for consistent handling
   * @param {string} url - URL to normalize
   * @returns {string} Normalized URL
   */
  normalizeUrl(url) {
    try {
      // Handle devtools URLs specially
      if (url.toLowerCase().startsWith('devtools:')) {
        return url; // Return as-is for devtools URLs
      }

      // If no protocol specified, assume https
      let normalizedUrl = url;
      if (!url.includes('://')) {
        normalizedUrl = `https://${url}`;
      }

      const urlObj = new URL(normalizedUrl);

      // Convert hostname to lowercase
      urlObj.hostname = urlObj.hostname.toLowerCase();

      // Remove trailing slash for consistency (except for root)
      if (urlObj.pathname === '/' && urlObj.search === '' && urlObj.hash === '') {
        return urlObj.href;
      } else if (urlObj.href.endsWith('/') && urlObj.search === '' && urlObj.hash === '') {
        return urlObj.href.slice(0, -1);
      }

      return urlObj.href;
    } catch (error) {
      console.warn('🔄 URL normalization failed, using original:', error.message);
      return url;
    }
  }

  /**
   * Check if URL uses secure protocol
   * @param {string} url - URL to check
   * @returns {boolean} True if protocol is secure
   */
  isSecureProtocol(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract domain from URL
   * @param {string} url - URL to extract domain from
   * @returns {string|null} Domain or null if invalid
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if URL is localhost
   * @param {string} url - URL to check
   * @returns {boolean} True if localhost
   */
  isLocalhost(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'localhost' ||
             urlObj.hostname === '127.0.0.1' ||
             urlObj.hostname.startsWith('192.168.') ||
             urlObj.hostname.startsWith('10.') ||
             urlObj.hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate multiple URLs in batch
   * @param {string[]} urls - Array of URLs to validate
   * @returns {Object[]} Array of validation results
   */
  validateUrls(urls) {
    if (!Array.isArray(urls)) {
      throw new Error('URLs must be an array');
    }

    return urls.map((url, index) => ({
      index,
      url,
      ...this.validateUrl(url)
    }));
  }

  /**
   * Get validation statistics for a batch of URLs
   * @param {string[]} urls - Array of URLs to analyze
   * @returns {Object} Statistics about URL validation
   */
  getValidationStats(urls) {
    const results = this.validateUrls(urls);
    const valid = results.filter(r => r.isValid);
    const invalid = results.filter(r => !r.isValid);

    const errorTypes = {};
    invalid.forEach(result => {
      const errorKey = result.error.split(':')[0]; // Get error type
      errorTypes[errorKey] = (errorTypes[errorKey] || 0) + 1;
    });

    return {
      total: urls.length,
      valid: valid.length,
      invalid: invalid.length,
      validPercent: Math.round((valid.length / urls.length) * 100),
      errorTypes,
      secureUrls: valid.filter(r => this.isSecureProtocol(r.url)).length,
      localhostUrls: valid.filter(r => this.isLocalhost(r.url)).length
    };
  }

  // Private methods

  /**
   * Check if input is a valid string
   * @private
   */
  _isValidString(url) {
    return typeof url === 'string' && url.trim().length > 0;
  }

  /**
   * Check protocols for security compliance
   * @private
   */
  _checkProtocols(trimmedUrl) {
    const urlLower = trimmedUrl.toLowerCase();

    // Check for blocked protocols
    for (const protocol of this.config.BLOCKED_PROTOCOLS) {
      if (urlLower.startsWith(protocol)) {
        return {
          isValid: false,
          error: this.errorMessages.PROTOCOL_BLOCKED.replace('{protocol}', protocol)
        };
      }
    }

    // Allow devtools URLs when running in Chrome extension context
    if (urlLower.startsWith('devtools:')) {
      if (typeof chrome !== 'undefined' && chrome.devtools) {
        console.log('🔧 Allowing devtools URL in Chrome extension context');
        return { isValid: true };
      } else {
        return {
          isValid: false,
          error: this.errorMessages.DEVTOOLS_CONTEXT_ONLY
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate URL format and structure
   * @private
   */
  _validateUrlFormat(trimmedUrl) {
    try {
      // Handle devtools URLs specially
      if (trimmedUrl.toLowerCase().startsWith('devtools:')) {
        if (typeof chrome !== 'undefined' && chrome.devtools) {
          return { isValid: true, url: trimmedUrl };
        } else {
          return {
            isValid: false,
            error: this.errorMessages.DEVTOOLS_CONTEXT_ONLY
          };
        }
      }

      // Try to create URL object for validation
      let testUrl;

      // If no protocol specified, assume https
      if (!trimmedUrl.includes('://')) {
        testUrl = new URL(`https://${trimmedUrl}`);
      } else {
        testUrl = new URL(trimmedUrl);
      }

      // Validate protocol
      if (!this.config.ALLOWED_PROTOCOLS.includes(testUrl.protocol)) {
        return {
          isValid: false,
          error: `Protocol ${testUrl.protocol} not supported. Use http: or https:`
        };
      }

      // Validate hostname
      if (!testUrl.hostname || testUrl.hostname.length === 0) {
        return {
          isValid: false,
          error: this.errorMessages.INVALID_HOSTNAME
        };
      }

      // Additional hostname validation using regex
      if (!this.config.HOSTNAME_PATTERN.test(testUrl.hostname)) {
        return {
          isValid: false,
          error: this.errorMessages.INVALID_HOSTNAME
        };
      }

      // Check for suspicious patterns
      if (this._hasSuspiciousPatterns(testUrl)) {
        return {
          isValid: false,
          error: 'URL contains suspicious patterns'
        };
      }

      return { isValid: true, url: testUrl.href };
    } catch (error) {
      return {
        isValid: false,
        error: this.errorMessages.INVALID_FORMAT.replace('{error}', error.message)
      };
    }
  }

  /**
   * Check for suspicious URL patterns
   * @private
   */
  _hasSuspiciousPatterns(urlObj) {
    const suspicious = [
      // Suspicious query parameters
      /[?&](javascript|vbscript|data)=/i,
      // Suspicious paths
      /\/(javascript|vbscript|data):/i,
      // Multiple redirects or suspicious encoding
      /%[0-9a-f]{2}/i && urlObj.href.includes('%25'), // Double encoding
      // Suspicious ports (common malware ports)
      urlObj.port && ['1337', '31337', '4444', '5555'].includes(urlObj.port)
    ];

    return suspicious.some(pattern => {
      if (typeof pattern === 'object' && pattern.test) {
        return pattern.test(urlObj.href);
      }
      return pattern;
    });
  }
}

/**
 * URL Normalization Utility Functions
 */
export class URLNormalizer {
  /**
   * Normalize URL with comprehensive rules
   * @param {string} url - URL to normalize
   * @param {Object} options - Normalization options
   * @returns {string} Normalized URL
   */
  static normalize(url, options = {}) {
    const defaultOptions = {
      removeTrailingSlash: true,
      lowercaseHostname: true,
      removeWWW: false,
      sortQuery: false,
      removeEmptyQuery: true,
      removeDefaultPort: true
    };

    const opts = { ...defaultOptions, ...options };

    try {
      let normalizedUrl = url;

      // Add protocol if missing
      if (!normalizedUrl.includes('://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      const urlObj = new URL(normalizedUrl);

      // Lowercase hostname
      if (opts.lowercaseHostname) {
        urlObj.hostname = urlObj.hostname.toLowerCase();
      }

      // Remove www prefix
      if (opts.removeWWW && urlObj.hostname.startsWith('www.')) {
        urlObj.hostname = urlObj.hostname.substring(4);
      }

      // Remove default ports
      if (opts.removeDefaultPort) {
        if ((urlObj.protocol === 'http:' && urlObj.port === '80') ||
            (urlObj.protocol === 'https:' && urlObj.port === '443')) {
          urlObj.port = '';
        }
      }

      // Sort query parameters
      if (opts.sortQuery && urlObj.search) {
        const params = new URLSearchParams(urlObj.search);
        const sortedParams = new URLSearchParams();

        [...params.keys()].sort().forEach(key => {
          params.getAll(key).forEach(value => {
            sortedParams.append(key, value);
          });
        });

        urlObj.search = sortedParams.toString();
      }

      // Remove empty query string
      if (opts.removeEmptyQuery && urlObj.search === '?') {
        urlObj.search = '';
      }

      // Remove trailing slash
      if (opts.removeTrailingSlash &&
          urlObj.pathname !== '/' &&
          urlObj.pathname.endsWith('/') &&
          urlObj.search === '' &&
          urlObj.hash === '') {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }

      return urlObj.href;
    } catch (error) {
      console.warn('URL normalization failed:', error.message);
      return url;
    }
  }

  /**
   * Normalize URLs for comparison
   * @param {string} url - URL to normalize for comparison
   * @returns {string} Comparison-normalized URL
   */
  static forComparison(url) {
    return this.normalize(url, {
      removeTrailingSlash: true,
      lowercaseHostname: true,
      removeWWW: true,
      sortQuery: true,
      removeEmptyQuery: true,
      removeDefaultPort: true
    });
  }
}

// Create default instance for backward compatibility
export const urlValidator = new URLValidator();

// Export convenience functions
export const validateUrl = (url) => urlValidator.validateUrl(url);
export const normalizeUrl = (url) => urlValidator.normalizeUrl(url);
export const isSecureProtocol = (url) => urlValidator.isSecureProtocol(url);
export const extractDomain = (url) => urlValidator.extractDomain(url);
export const isLocalhost = (url) => urlValidator.isLocalhost(url);

export default {
  URLValidator,
  URLNormalizer,
  urlValidator,
  validateUrl,
  normalizeUrl,
  isSecureProtocol,
  extractDomain,
  isLocalhost
};