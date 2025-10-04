/**
 * Browser Get Content Tool
 *
 * Extracts HTML and text content from the page or specific elements.
 * Supports multiple output formats and content filtering.
 */

class BrowserGetContentTool {
  constructor() {
    this.lastContent = null;
  }

  /**
   * Get content from page or element
   * @param {string|null} selector - CSS selector (null for entire page)
   * @param {Object} options - Content options
   * @returns {Object} Content result
   */
  getContent(selector = null, options = {}) {
    const {
      format = 'html', // 'html', 'text', 'markdown', 'both'
      includeHidden = false,
      maxLength = null,
      includeMetadata = true
    } = options;

    try {
      const element = selector ? document.querySelector(selector) : document.documentElement;

      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`
        };
      }

      // Get content based on format
      let content = {};

      if (format === 'html' || format === 'both') {
        let html = element.outerHTML;
        if (maxLength && html.length > maxLength) {
          html = html.substring(0, maxLength) + '... (truncated)';
        }
        content.html = html;
      }

      if (format === 'text' || format === 'both') {
        let text = includeHidden ? element.textContent : this.getVisibleText(element);
        text = this.cleanText(text);
        if (maxLength && text.length > maxLength) {
          text = text.substring(0, maxLength) + '... (truncated)';
        }
        content.text = text;
      }

      if (format === 'markdown') {
        content.markdown = this.convertToMarkdown(element);
        if (maxLength && content.markdown.length > maxLength) {
          content.markdown = content.markdown.substring(0, maxLength) + '... (truncated)';
        }
      }

      // Add metadata
      let metadata = {};
      if (includeMetadata) {
        metadata = {
          selector: selector || 'document',
          tagName: element.tagName.toLowerCase(),
          id: element.id || undefined,
          className: element.className || undefined,
          contentLength: element.outerHTML.length,
          textLength: element.textContent.length,
          childCount: element.children.length,
          timestamp: Date.now()
        };
      }

      this.lastContent = {
        selector,
        format,
        timestamp: Date.now()
      };

      return {
        success: true,
        ...content,
        metadata
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get visible text only (excludes hidden elements)
   * @private
   */
  getVisibleText(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const style = window.getComputedStyle(parent);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0'
          ) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let text = '';
    let node;
    while (node = walker.nextNode()) {
      text += node.textContent;
    }

    return text;
  }

  /**
   * Clean and normalize text
   * @private
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')           // Collapse whitespace
      .replace(/\n\s*\n/g, '\n\n')    // Normalize line breaks
      .trim();
  }

  /**
   * Convert HTML to simple markdown
   * @private
   */
  convertToMarkdown(element) {
    let markdown = '';
    const clone = element.cloneNode(true);

    // Convert headings
    clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
      const level = parseInt(heading.tagName[1]);
      const prefix = '#'.repeat(level);
      heading.textContent = `${prefix} ${heading.textContent.trim()}\n\n`;
    });

    // Convert links
    clone.querySelectorAll('a').forEach(link => {
      const text = link.textContent.trim();
      const href = link.getAttribute('href');
      link.textContent = `[${text}](${href})`;
    });

    // Convert bold/strong
    clone.querySelectorAll('strong, b').forEach(bold => {
      bold.textContent = `**${bold.textContent.trim()}**`;
    });

    // Convert italic/em
    clone.querySelectorAll('em, i').forEach(italic => {
      italic.textContent = `*${italic.textContent.trim()}*`;
    });

    // Convert lists
    clone.querySelectorAll('ul, ol').forEach(list => {
      const items = list.querySelectorAll('li');
      const isOrdered = list.tagName === 'OL';
      items.forEach((item, index) => {
        const prefix = isOrdered ? `${index + 1}.` : '-';
        item.textContent = `${prefix} ${item.textContent.trim()}\n`;
      });
      list.textContent = list.textContent + '\n';
    });

    // Convert code blocks
    clone.querySelectorAll('pre code, code').forEach(code => {
      const isBlock = code.parentElement?.tagName === 'PRE';
      if (isBlock) {
        code.textContent = `\`\`\`\n${code.textContent.trim()}\n\`\`\`\n`;
      } else {
        code.textContent = `\`${code.textContent.trim()}\``;
      }
    });

    markdown = clone.textContent || '';
    return this.cleanText(markdown);
  }

  /**
   * Get all text content from page
   * @returns {Object} Text content
   */
  getAllText() {
    return this.getContent(null, { format: 'text' });
  }

  /**
   * Get all HTML from page
   * @returns {Object} HTML content
   */
  getAllHTML() {
    return this.getContent(null, { format: 'html' });
  }

  /**
   * Get specific element's content
   * @param {string} selector - CSS selector
   * @returns {Object} Element content
   */
  getElementContent(selector) {
    return this.getContent(selector, { format: 'both' });
  }

  /**
   * Get page metadata
   * @returns {Object} Page metadata
   */
  getPageMetadata() {
    return {
      success: true,
      url: window.location.href,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content,
      keywords: document.querySelector('meta[name="keywords"]')?.content,
      author: document.querySelector('meta[name="author"]')?.content,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
      ogDescription: document.querySelector('meta[property="og:description"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      language: document.documentElement.lang,
      charset: document.characterSet,
      timestamp: Date.now()
    };
  }

  /**
   * Get last content retrieval info
   */
  getLastContent() {
    return this.lastContent;
  }

  /**
   * Extract all links from page or element
   * @param {string|null} selector - CSS selector
   * @returns {Object} Links array
   */
  getLinks(selector = null) {
    try {
      const element = selector ? document.querySelector(selector) : document;

      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`
        };
      }

      const links = Array.from(element.querySelectorAll('a[href]')).map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        title: link.title || undefined,
        target: link.target || undefined,
        rel: link.rel || undefined
      }));

      return {
        success: true,
        links,
        count: links.length,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract all images from page or element
   * @param {string|null} selector - CSS selector
   * @returns {Object} Images array
   */
  getImages(selector = null) {
    try {
      const element = selector ? document.querySelector(selector) : document;

      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`
        };
      }

      const images = Array.from(element.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt || undefined,
        title: img.title || undefined,
        width: img.naturalWidth,
        height: img.naturalHeight,
        loading: img.loading || undefined
      }));

      return {
        success: true,
        images,
        count: images.length,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Make available globally
window.BrowserGetContentTool = BrowserGetContentTool;
