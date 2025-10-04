/**
 * Visual Tools Integration - Panel UI Integration
 *
 * Connects the visual precision tools to the DevTools panel UI,
 * allowing users to run tools and see results directly in the panel.
 */

// Initialize tools when panel loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎨 Initializing Visual Precision Tools...');

  // Initialize tool instances
  const visualDiff = new VisualDiffEngine();
  const layoutTool = new LayoutMeasurementTool();
  const styleAnalyzer = new StyleAnalyzer();
  const a11yOverlay = new AccessibilityOverlay();

  // Get UI elements
  const visualDiffBtn = document.getElementById('visual-diff-btn');
  const visualDiffResult = document.getElementById('visual-diff-result');

  const measureSelector = document.getElementById('measure-selector');
  const measureBtn = document.getElementById('measure-layout-btn');
  const measureResult = document.getElementById('measure-result');

  const analyzeSelector = document.getElementById('analyze-selector');
  const analyzeBtn = document.getElementById('analyze-styles-btn');
  const analyzeResult = document.getElementById('analyze-result');

  const a11ySelector = document.getElementById('a11y-selector');
  const a11yBtn = document.getElementById('a11y-check-btn');
  const a11yResult = document.getElementById('a11y-result');

  // Visual Diff Handler
  visualDiffBtn?.addEventListener('click', async () => {
    visualDiffResult.style.display = 'block';
    visualDiffResult.textContent = '⏳ Visual diff requires two screenshots. Use element picker to capture before/after states.';

    // This is a simplified version - full implementation would:
    // 1. Let user select 2 screenshots from the screenshot list
    // 2. Run comparison
    // 3. Display diff image and metrics in panel
  });

  // Layout Measurement Handler
  measureBtn?.addEventListener('click', async () => {
    const selector = measureSelector.value.trim();

    if (!selector) {
      measureResult.style.display = 'block';
      measureResult.textContent = '⚠️ Please enter a CSS selector';
      return;
    }

    // Send message to content script to measure
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'MEASURE_LAYOUT',
        selector
      }, (response) => {
        measureResult.style.display = 'block';

        if (response && response.success) {
          const m = response.measurements;
          measureResult.innerHTML = `
            ✅ <strong>${selector}</strong><br>
            📐 ${m.dimensions.width.toFixed(1)}px × ${m.dimensions.height.toFixed(1)}px<br>
            📍 Position: (${m.position.x.toFixed(1)}, ${m.position.y.toFixed(1)})<br>
            📦 Margin: ${m.spacing.marginTop}/${m.spacing.marginRight}/${m.spacing.marginBottom}/${m.spacing.marginLeft}px<br>
            <span style="color: #0ea5e9;">Visual overlay active on page</span>
          `;
        } else {
          measureResult.textContent = `❌ ${response?.error || 'Measurement failed'}`;
        }
      });
    });
  });

  // Style Analysis Handler
  analyzeBtn?.addEventListener('click', async () => {
    const selector = analyzeSelector.value.trim();

    if (!selector) {
      analyzeResult.style.display = 'block';
      analyzeResult.textContent = '⚠️ Please enter a CSS selector';
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'ANALYZE_STYLES',
        selector
      }, (response) => {
        analyzeResult.style.display = 'block';

        if (response && response.success) {
          const s = response.analysis.summary;
          analyzeResult.innerHTML = `
            ✅ <strong>${selector}</strong><br>
            📊 ${response.analysis.totalProperties} properties<br>
            ⚠️ ${s.importantCount} !important flags<br>
            ${response.analysis.conflictCount > 0 ?
              `🔴 ${response.analysis.conflictCount} conflicts detected<br>` :
              '✅ No conflicts<br>'}
            <span style="color: #0ea5e9;">Check console for details</span>
          `;
        } else {
          analyzeResult.textContent = `❌ ${response?.error || 'Analysis failed'}`;
        }
      });
    });
  });

  // Accessibility Check Handler
  a11yBtn?.addEventListener('click', async () => {
    const selector = a11ySelector.value.trim();

    if (!selector) {
      a11yResult.style.display = 'block';
      a11yResult.textContent = '⚠️ Please enter a CSS selector';
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'CHECK_A11Y',
        selector
      }, (response) => {
        a11yResult.style.display = 'block';

        if (response && response.success) {
          const s = response.analysis.summary;
          const total = response.analysis.issueCount;

          a11yResult.innerHTML = `
            ${total === 0 ? '✅' : '⚠️'} <strong>${selector}</strong><br>
            ${total === 0 ?
              '✅ No accessibility issues' :
              `🔴 ${s.critical} critical<br>⚠️ ${s.warning} warnings<br>ℹ️ ${s.info} info<br>`}
            <span style="color: #0ea5e9;">Visual overlay on page</span>
          `;
        } else {
          a11yResult.textContent = `❌ ${response?.error || 'Check failed'}`;
        }
      });
    });
  });

  console.log('✅ Visual Precision Tools initialized');
});
