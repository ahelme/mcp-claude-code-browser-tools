/**
 * Visual Diff Engine - Pixel-Perfect Before/After Comparison
 *
 * Provides pixel-level comparison between two screenshots to detect visual changes.
 * Uses pixelmatch algorithm for precise diff detection with highlighted changes.
 *
 * Features:
 * - Before/after screenshot comparison
 * - Pixel-level diff detection
 * - Highlighted difference overlay
 * - Percentage match calculation
 * - Color-coded diff visualization (magenta = changed pixels)
 *
 * Use Cases:
 * - Visual regression testing
 * - UI change detection
 * - Design review and approval
 * - Screenshot comparison
 */

class VisualDiffEngine {
  constructor() {
    this.diffThreshold = 0.1; // Sensitivity: 0 = exact match, 1 = very lenient
    this.diffColor = [255, 0, 255]; // Magenta for differences
  }

  /**
   * Compare two screenshots and generate diff visualization
   * @param {string} beforeDataUrl - Base64 data URL of before screenshot
   * @param {string} afterDataUrl - Base64 data URL of after screenshot
   * @param {Object} options - Comparison options
   * @returns {Promise<Object>} Diff result with visualization and metrics
   */
  async compare(beforeDataUrl, afterDataUrl, options = {}) {
    const {
      threshold = this.diffThreshold,
      includeAA = false, // Anti-aliasing detection
      alpha = 0.1, // Opacity blending
      diffColor = this.diffColor
    } = options;

    try {
      // Load images
      const beforeImg = await this.loadImage(beforeDataUrl);
      const afterImg = await this.loadImage(afterDataUrl);

      // Validate dimensions match
      if (beforeImg.width !== afterImg.width || beforeImg.height !== afterImg.height) {
        return {
          success: false,
          error: 'Image dimensions must match',
          beforeSize: { width: beforeImg.width, height: beforeImg.height },
          afterSize: { width: afterImg.width, height: afterImg.height }
        };
      }

      // Create canvases for comparison
      const width = beforeImg.width;
      const height = beforeImg.height;

      const beforeCanvas = this.imageToCanvas(beforeImg);
      const afterCanvas = this.imageToCanvas(afterImg);
      const diffCanvas = document.createElement('canvas');
      diffCanvas.width = width;
      diffCanvas.height = height;

      // Get image data
      const beforeCtx = beforeCanvas.getContext('2d');
      const afterCtx = afterCanvas.getContext('2d');
      const diffCtx = diffCanvas.getContext('2d');

      const beforeData = beforeCtx.getImageData(0, 0, width, height);
      const afterData = afterCtx.getImageData(0, 0, width, height);
      const diffData = diffCtx.createImageData(width, height);

      // Perform pixel-by-pixel comparison using simple algorithm
      // (Note: Real pixelmatch library would be imported for production)
      const diffPixels = this.simplePixelMatch(
        beforeData.data,
        afterData.data,
        diffData.data,
        width,
        height,
        { threshold, diffColor }
      );

      // Draw diff visualization
      diffCtx.putImageData(diffData, 0, 0);

      // Calculate match percentage
      const totalPixels = width * height;
      const matchPercentage = ((totalPixels - diffPixels) / totalPixels) * 100;

      return {
        success: true,
        diffPixels,
        totalPixels,
        matchPercentage: matchPercentage.toFixed(2),
        isIdentical: diffPixels === 0,
        diffImageUrl: diffCanvas.toDataURL(),
        dimensions: { width, height },
        threshold
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Simple pixel matching algorithm (placeholder for pixelmatch library)
   * In production, would use: https://github.com/mapbox/pixelmatch
   *
   * @private
   */
  simplePixelMatch(img1, img2, output, width, height, options) {
    const { threshold, diffColor } = options;
    let diffCount = 0;

    for (let i = 0; i < img1.length; i += 4) {
      const r1 = img1[i];
      const g1 = img1[i + 1];
      const b1 = img1[i + 2];
      const a1 = img1[i + 3];

      const r2 = img2[i];
      const g2 = img2[i + 1];
      const b2 = img2[i + 2];
      const a2 = img2[i + 3];

      // Calculate color difference
      const delta = Math.sqrt(
        Math.pow(r1 - r2, 2) +
        Math.pow(g1 - g2, 2) +
        Math.pow(b1 - b2, 2) +
        Math.pow(a1 - a2, 2)
      ) / 255;

      if (delta > threshold) {
        // Pixel differs - mark in diff color
        output[i] = diffColor[0];
        output[i + 1] = diffColor[1];
        output[i + 2] = diffColor[2];
        output[i + 3] = 255;
        diffCount++;
      } else {
        // Pixel matches - show grayscale
        const gray = (r1 + g1 + b1) / 3;
        output[i] = gray;
        output[i + 1] = gray;
        output[i + 2] = gray;
        output[i + 3] = a1;
      }
    }

    return diffCount;
  }

  /**
   * Load image from data URL
   * @private
   */
  loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  }

  /**
   * Convert image to canvas
   * @private
   */
  imageToCanvas(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
  }

  /**
   * Compare current page state with a previous screenshot
   * @param {string} beforeDataUrl - Previous screenshot data URL
   * @param {string} selector - Optional CSS selector to compare specific element
   */
  async compareWithCurrent(beforeDataUrl, selector = null) {
    // Capture current state
    const currentDataUrl = await this.captureCurrentState(selector);

    // Compare
    return this.compare(beforeDataUrl, currentDataUrl);
  }

  /**
   * Capture current page/element state
   * @private
   */
  async captureCurrentState(selector = null) {
    return new Promise((resolve, reject) => {
      if (selector) {
        // Capture specific element (would integrate with screenshot module)
        chrome.runtime.sendMessage({
          type: 'CAPTURE_ELEMENT',
          selector
        }, (response) => {
          if (response && response.dataUrl) {
            resolve(response.dataUrl);
          } else {
            reject(new Error('Failed to capture element'));
          }
        });
      } else {
        // Capture full viewport
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
          if (dataUrl) {
            resolve(dataUrl);
          } else {
            reject(new Error('Failed to capture viewport'));
          }
        });
      }
    });
  }
}

// Make available globally
window.VisualDiffEngine = VisualDiffEngine;
