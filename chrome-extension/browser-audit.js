/**
 * Browser Audit Tool
 *
 * Runs comprehensive performance, accessibility, SEO, and best practices audits.
 * Provides actionable insights and scores.
 */

class BrowserAuditTool {
  constructor() {
    this.lastAudit = null;
  }

  /**
   * Run comprehensive page audit
   * @param {Object} options - Audit options
   * @returns {Promise<Object>} Audit results
   */
  async runAudit(options = {}) {
    const {
      categories = ['performance', 'accessibility', 'seo', 'best-practices'],
      includeRecommendations = true
    } = options;

    const startTime = Date.now();

    try {
      const results = {
        url: window.location.href,
        timestamp: Date.now(),
        categories: {}
      };

      // Run requested audits
      if (categories.includes('performance')) {
        results.categories.performance = await this.auditPerformance();
      }

      if (categories.includes('accessibility')) {
        results.categories.accessibility = await this.auditAccessibility();
      }

      if (categories.includes('seo')) {
        results.categories.seo = await this.auditSEO();
      }

      if (categories.includes('best-practices')) {
        results.categories.bestPractices = await this.auditBestPractices();
      }

      // Calculate overall score
      const scores = Object.values(results.categories).map(cat => cat.score);
      const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

      this.lastAudit = {
        url: window.location.href,
        overallScore,
        timestamp: Date.now()
      };

      return {
        success: true,
        overallScore,
        ...results,
        elapsed: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        elapsed: Date.now() - startTime
      };
    }
  }

  /**
   * Audit performance metrics
   * @private
   */
  async auditPerformance() {
    const metrics = {};
    const issues = [];
    const recommendations = [];

    // Get performance timing data
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigation = window.performance.navigation;

      metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
      metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      metrics.firstPaint = timing.responseEnd - timing.navigationStart;
      metrics.domInteractive = timing.domInteractive - timing.navigationStart;

      // Check load time
      if (metrics.loadTime > 3000) {
        issues.push({
          severity: 'high',
          message: `Slow page load: ${(metrics.loadTime / 1000).toFixed(2)}s`,
          metric: 'loadTime'
        });
        recommendations.push('Optimize images, minify CSS/JS, enable compression');
      }

      // Check DOM content loaded
      if (metrics.domContentLoaded > 2000) {
        issues.push({
          severity: 'medium',
          message: `Slow DOM parsing: ${(metrics.domContentLoaded / 1000).toFixed(2)}s`,
          metric: 'domContentLoaded'
        });
        recommendations.push('Reduce DOM complexity, defer non-critical scripts');
      }
    }

    // Check resource counts
    const resources = performance.getEntriesByType('resource');
    metrics.resourceCount = resources.length;
    metrics.scriptCount = resources.filter(r => r.initiatorType === 'script').length;
    metrics.imageCount = resources.filter(r => r.initiatorType === 'img').length;
    metrics.cssCount = resources.filter(r => r.initiatorType === 'link').length;

    if (metrics.resourceCount > 100) {
      issues.push({
        severity: 'medium',
        message: `High resource count: ${metrics.resourceCount} requests`,
        metric: 'resourceCount'
      });
      recommendations.push('Combine files, use sprites, implement lazy loading');
    }

    // Check image optimization
    const images = document.querySelectorAll('img');
    let unoptimizedImages = 0;
    images.forEach(img => {
      if (!img.loading || img.loading !== 'lazy') {
        unoptimizedImages++;
      }
    });

    if (unoptimizedImages > 10) {
      issues.push({
        severity: 'low',
        message: `${unoptimizedImages} images without lazy loading`,
        metric: 'imageOptimization'
      });
      recommendations.push('Add loading="lazy" to images below the fold');
    }

    // Calculate score (0-100)
    let score = 100;
    score -= issues.filter(i => i.severity === 'high').length * 20;
    score -= issues.filter(i => i.severity === 'medium').length * 10;
    score -= issues.filter(i => i.severity === 'low').length * 5;
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      metrics,
      issues,
      recommendations,
      issueCount: issues.length
    };
  }

  /**
   * Audit accessibility
   * @private
   */
  async auditAccessibility() {
    const issues = [];
    const recommendations = [];

    // Check for alt text on images
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        severity: 'high',
        message: `${imagesWithoutAlt.length} images missing alt text`,
        count: imagesWithoutAlt.length
      });
      recommendations.push('Add descriptive alt text to all images');
    }

    // Check for form labels
    const inputs = document.querySelectorAll('input, textarea, select');
    let inputsWithoutLabels = 0;
    inputs.forEach(input => {
      const hasLabel = input.labels && input.labels.length > 0;
      const hasAriaLabel = input.getAttribute('aria-label');
      if (!hasLabel && !hasAriaLabel) {
        inputsWithoutLabels++;
      }
    });

    if (inputsWithoutLabels > 0) {
      issues.push({
        severity: 'high',
        message: `${inputsWithoutLabels} form inputs without labels`,
        count: inputsWithoutLabels
      });
      recommendations.push('Add labels or aria-label to all form inputs');
    }

    // Check color contrast
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, span, div');
    let lowContrastCount = 0;

    for (const el of Array.from(textElements).slice(0, 100)) {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;

      if (color && bgColor) {
        const ratio = this.calculateContrastRatio(color, bgColor);
        if (ratio < 4.5) {
          lowContrastCount++;
        }
      }
    }

    if (lowContrastCount > 5) {
      issues.push({
        severity: 'medium',
        message: `${lowContrastCount} elements with low color contrast`,
        count: lowContrastCount
      });
      recommendations.push('Increase color contrast to meet WCAG AA standards (4.5:1)');
    }

    // Check for heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const h1Count = document.querySelectorAll('h1').length;

    if (h1Count === 0) {
      issues.push({
        severity: 'medium',
        message: 'Page is missing an h1 heading'
      });
      recommendations.push('Add a descriptive h1 heading to the page');
    } else if (h1Count > 1) {
      issues.push({
        severity: 'low',
        message: `Multiple h1 headings found (${h1Count})`
      });
      recommendations.push('Use only one h1 heading per page');
    }

    // Calculate score
    let score = 100;
    score -= issues.filter(i => i.severity === 'high').length * 20;
    score -= issues.filter(i => i.severity === 'medium').length * 10;
    score -= issues.filter(i => i.severity === 'low').length * 5;
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      issues,
      recommendations,
      issueCount: issues.length,
      metrics: {
        totalImages: images.length,
        imagesWithoutAlt: imagesWithoutAlt.length,
        totalInputs: inputs.length,
        inputsWithoutLabels,
        lowContrastElements: lowContrastCount,
        h1Count
      }
    };
  }

  /**
   * Calculate color contrast ratio
   * @private
   */
  calculateContrastRatio(color1, color2) {
    const getLuminance = (color) => {
      const rgb = color.match(/\d+/g);
      if (!rgb || rgb.length < 3) return 0;

      const [r, g, b] = rgb.map(val => {
        const v = parseInt(val) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Audit SEO
   * @private
   */
  async auditSEO() {
    const issues = [];
    const recommendations = [];
    const metrics = {};

    // Check title
    metrics.title = document.title;
    if (!metrics.title || metrics.title.length === 0) {
      issues.push({
        severity: 'high',
        message: 'Page is missing a title tag'
      });
      recommendations.push('Add a descriptive title tag (50-60 characters)');
    } else if (metrics.title.length > 60) {
      issues.push({
        severity: 'low',
        message: `Title too long (${metrics.title.length} characters)`
      });
      recommendations.push('Shorten title to 50-60 characters');
    }

    // Check meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    metrics.metaDescription = metaDesc?.content || null;
    if (!metrics.metaDescription) {
      issues.push({
        severity: 'high',
        message: 'Page is missing a meta description'
      });
      recommendations.push('Add a meta description (150-160 characters)');
    }

    // Check canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    metrics.canonical = canonical?.href || null;
    if (!metrics.canonical) {
      issues.push({
        severity: 'medium',
        message: 'Page is missing a canonical URL'
      });
      recommendations.push('Add a canonical link tag');
    }

    // Check robots meta
    const robots = document.querySelector('meta[name="robots"]');
    metrics.robots = robots?.content || 'index, follow';

    // Check for viewport meta
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      issues.push({
        severity: 'high',
        message: 'Page is missing viewport meta tag'
      });
      recommendations.push('Add viewport meta tag for mobile optimization');
    }

    // Calculate score
    let score = 100;
    score -= issues.filter(i => i.severity === 'high').length * 20;
    score -= issues.filter(i => i.severity === 'medium').length * 10;
    score -= issues.filter(i => i.severity === 'low').length * 5;
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      metrics,
      issues,
      recommendations,
      issueCount: issues.length
    };
  }

  /**
   * Audit best practices
   * @private
   */
  async auditBestPractices() {
    const issues = [];
    const recommendations = [];

    // Check HTTPS
    if (window.location.protocol !== 'https:') {
      issues.push({
        severity: 'high',
        message: 'Page not served over HTTPS'
      });
      recommendations.push('Enable HTTPS for security');
    }

    // Check for console errors
    // (This would need to be tracked separately as we can't access past console logs)

    // Check for deprecated APIs
    const deprecated = [];
    if (document.all) deprecated.push('document.all');
    if (document.layers) deprecated.push('document.layers');

    if (deprecated.length > 0) {
      issues.push({
        severity: 'low',
        message: `Using deprecated APIs: ${deprecated.join(', ')}`
      });
      recommendations.push('Update code to use modern APIs');
    }

    // Calculate score
    let score = 100;
    score -= issues.filter(i => i.severity === 'high').length * 20;
    score -= issues.filter(i => i.severity === 'medium').length * 10;
    score -= issues.filter(i => i.severity === 'low').length * 5;
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      issues,
      recommendations,
      issueCount: issues.length
    };
  }

  /**
   * Get last audit info
   */
  getLastAudit() {
    return this.lastAudit;
  }
}

// Make available globally
window.BrowserAuditTool = BrowserAuditTool;
