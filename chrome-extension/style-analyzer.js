/**
 * Style Analyzer - Computed CSS & Conflict Detection
 *
 * Analyzes computed styles, detects CSS conflicts, and provides insights
 * into actual applied styles versus authored styles.
 *
 * Features:
 * - Complete computed style analysis
 * - CSS conflict detection (specificity wars)
 * - Style inheritance tracking
 * - Important flag detection
 * - Overridden style identification
 * - Source stylesheet tracking
 *
 * Use Cases:
 * - Debug why styles aren't applying
 * - Identify specificity conflicts
 * - Find !important overuse
 * - Understand style inheritance
 * - CSS optimization opportunities
 */

class StyleAnalyzer {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Analyze all computed styles for an element
   * @param {string} selector - CSS selector for target element
   * @param {Object} options - Analysis options
   * @returns {Object} Complete style analysis
   */
  analyzeStyles(selector, options = {}) {
    const {
      includeInherited = true,
      includeDefault = false,
      groupByCategory = true
    } = options;

    const element = document.querySelector(selector);

    if (!element) {
      return {
        success: false,
        error: `Element not found: ${selector}`
      };
    }

    const computed = window.getComputedStyle(element);
    const styles = {};
    const categories = {
      layout: [],
      typography: [],
      visual: [],
      positioning: [],
      flex: [],
      grid: [],
      other: []
    };

    // Categorize CSS properties
    const propertyCategories = {
      layout: ['display', 'width', 'height', 'padding', 'margin', 'border', 'box-sizing', 'overflow'],
      typography: ['font', 'text', 'line-height', 'letter-spacing', 'word-spacing', 'white-space'],
      visual: ['color', 'background', 'opacity', 'box-shadow', 'border-radius', 'filter'],
      positioning: ['position', 'top', 'right', 'bottom', 'left', 'z-index', 'transform'],
      flex: ['flex', 'justify', 'align', 'gap', 'order'],
      grid: ['grid', 'gap', 'place']
    };

    // Collect all computed styles
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      const value = computed.getPropertyValue(prop);
      const priority = computed.getPropertyPriority(prop);

      styles[prop] = {
        value,
        priority,
        important: priority === 'important'
      };

      // Categorize
      let categorized = false;
      for (const [category, keywords] of Object.entries(propertyCategories)) {
        if (keywords.some(kw => prop.includes(kw))) {
          categories[category].push({ prop, value, priority });
          categorized = true;
          break;
        }
      }
      if (!categorized) {
        categories.other.push({ prop, value, priority });
      }
    }

    return {
      success: true,
      selector,
      totalProperties: computed.length,
      styles: groupByCategory ? categories : styles,
      summary: {
        importantCount: Object.values(styles).filter(s => s.important).length,
        customProperties: Object.keys(styles).filter(p => p.startsWith('--')).length
      }
    };
  }

  /**
   * Detect CSS conflicts and specificity issues
   * @param {string} selector - CSS selector for target element
   * @returns {Object} Conflict analysis
   */
  detectConflicts(selector) {
    const element = document.querySelector(selector);

    if (!element) {
      return {
        success: false,
        error: `Element not found: ${selector}`
      };
    }

    const conflicts = [];
    const computed = window.getComputedStyle(element);

    // Get all matching stylesheets
    const matchingRules = this.getMatchingRules(element);

    // Analyze each property for conflicts
    const propertyMap = new Map();

    matchingRules.forEach(rule => {
      const style = rule.style;
      for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        const value = style.getPropertyValue(prop);
        const priority = style.getPropertyPriority(prop);

        if (!propertyMap.has(prop)) {
          propertyMap.set(prop, []);
        }

        propertyMap.get(prop).push({
          value,
          priority,
          specificity: this.calculateSpecificity(rule.selectorText),
          selector: rule.selectorText,
          source: this.getRuleSource(rule)
        });
      }
    });

    // Find conflicts (multiple declarations of same property)
    propertyMap.forEach((declarations, prop) => {
      if (declarations.length > 1) {
        const computedValue = computed.getPropertyValue(prop);
        const winner = declarations.find(d => d.value === computedValue);

        conflicts.push({
          property: prop,
          computedValue,
          declarations: declarations.map(d => ({
            ...d,
            isApplied: d === winner
          })),
          conflictType: this.determineConflictType(declarations)
        });
      }
    });

    return {
      success: true,
      selector,
      conflictCount: conflicts.length,
      conflicts,
      summary: {
        importantConflicts: conflicts.filter(c =>
          c.declarations.some(d => d.priority === 'important')
        ).length,
        specificityConflicts: conflicts.filter(c => c.conflictType === 'specificity').length
      }
    };
  }

  /**
   * Get all CSS rules matching an element
   * @private
   */
  getMatchingRules(element) {
    const matchingRules = [];
    const sheets = Array.from(document.styleSheets);

    sheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        rules.forEach(rule => {
          if (rule.style && rule.selectorText) {
            try {
              if (element.matches(rule.selectorText)) {
                matchingRules.push(rule);
              }
            } catch (e) {
              // Invalid selector, skip
            }
          }
        });
      } catch (e) {
        // CORS or other access issue, skip
      }
    });

    return matchingRules;
  }

  /**
   * Calculate CSS specificity (simplified)
   * @private
   */
  calculateSpecificity(selector) {
    if (!selector) return { inline: 0, ids: 0, classes: 0, elements: 0 };

    const ids = (selector.match(/#/g) || []).length;
    const classes = (selector.match(/\./g) || []).length;
    const attrs = (selector.match(/\[/g) || []).length;
    const pseudoClasses = (selector.match(/:/g) || []).length - (selector.match(/::/g) || []).length;
    const elements = (selector.match(/[a-z]/gi) || []).length;

    return {
      inline: 0,
      ids,
      classes: classes + attrs + pseudoClasses,
      elements,
      score: ids * 100 + (classes + attrs + pseudoClasses) * 10 + elements
    };
  }

  /**
   * Get source of CSS rule
   * @private
   */
  getRuleSource(rule) {
    const sheet = rule.parentStyleSheet;
    if (!sheet) return 'inline';
    if (sheet.href) {
      return sheet.href.split('/').pop();
    }
    return 'style-tag';
  }

  /**
   * Determine type of conflict
   * @private
   */
  determineConflictType(declarations) {
    const hasImportant = declarations.some(d => d.priority === 'important');
    if (hasImportant) return 'important';

    const specificities = declarations.map(d => d.specificity.score);
    const allSame = specificities.every(s => s === specificities[0]);
    if (!allSame) return 'specificity';

    return 'source-order';
  }

  /**
   * Find overridden styles
   * @param {string} selector - CSS selector for target element
   * @returns {Object} Overridden style analysis
   */
  findOverriddenStyles(selector) {
    const conflicts = this.detectConflicts(selector);

    if (!conflicts.success) {
      return conflicts;
    }

    const overridden = conflicts.conflicts.map(conflict => {
      const applied = conflict.declarations.find(d => d.isApplied);
      const overridden = conflict.declarations.filter(d => !d.isApplied);

      return {
        property: conflict.property,
        appliedValue: applied.value,
        appliedSelector: applied.selector,
        appliedSpecificity: applied.specificity.score,
        overriddenDeclarations: overridden.map(d => ({
          value: d.value,
          selector: d.selector,
          specificity: d.specificity.score,
          reason: this.getOverrideReason(applied, d)
        }))
      };
    });

    return {
      success: true,
      selector,
      overriddenCount: overridden.length,
      overridden
    };
  }

  /**
   * Determine why a style was overridden
   * @private
   */
  getOverrideReason(winner, loser) {
    if (winner.priority === 'important' && loser.priority !== 'important') {
      return '!important flag';
    }
    if (winner.specificity.score > loser.specificity.score) {
      return 'higher specificity';
    }
    return 'source order (later in cascade)';
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Make available globally
window.StyleAnalyzer = StyleAnalyzer;
