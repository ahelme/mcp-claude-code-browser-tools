# Clipboard Research - Image Paste Compatibility

## Problem Statement
Screenshots copy to clipboard successfully but **do not paste into Claude Code** (Electron app). They paste successfully in graphics apps, suggesting a clipboard format compatibility issue.

## Methods Attempted (All Failed)

1. **ClipboardItem in Service Worker** ❌
   - Error: `ClipboardItem is not defined` (not available in service workers)

2. **Canvas toBlob + ClipboardItem** ❌
   - CSP violation with canvas approach

3. **fetch(dataUrl) + ClipboardItem** ❌
   - CSP violation: `Refused to connect to data:image/png`

4. **CSP-Safe Base64 Decoding** ❌
   - Uses `atob()` + `Uint8Array` to convert data URL to blob
   - `ClipboardItem({'image/png': blob})` writes successfully
   - Issue: Blob format incompatible with Claude Code paste

5. **execCommand Fallback** ❌
   - Never reached (ClipboardItem succeeds but wrong format)

## Research Findings

### Key Discovery: Multiple MIME Types Support

**Source:** [Stefan Judis - Clipboard Magic Trick](https://www.stefanjudis.com/notes/a-clipboard-magic-trick-how-to-use-different-mime-types-with-the-clipboard/)

The Clipboard API supports **multiple MIME types in a single ClipboardItem**. Applications choose which format to use based on what they support (content negotiation).

### Recommended Approach

Provide multiple representations of the same content:

```javascript
const clipboardData = {
  'text/plain': new Blob([filename], { type: 'text/plain' }),
  'text/html': new Blob([`<img src="${dataUrl}">`], { type: 'text/html' }),
  'image/png': blob
};

await navigator.clipboard.write([new ClipboardItem(clipboardData)]);
```

### Why This Helps

1. **Content Negotiation:** Target app chooses best format
2. **Fallback Support:** If `image/png` blob format doesn't work, `text/html` with embedded data URL might
3. **Electron Compatibility:** Electron apps may prefer different clipboard representations

## Electron-Specific Considerations

**Source:** [Electron GitHub Issues](https://github.com/electron/electron/issues/23156)

- Electron's clipboard API converts images to PNG regardless of original format
- Native clipboard format exposure is limited (Chromium bug #487266)
- Web Clipboard API with ClipboardItem now supported in modern Electron

### Claude Code (Electron App) Requirements

Claude Code may expect:
- Specific image metadata
- `text/html` format with embedded image
- Native file format vs inline blob

## Chromium Clipboard Limitations

**Source:** [Chromium Bug #487266](https://bugs.chromium.org/p/chromium/issues/detail?id=487266)

Chrome doesn't expose all clipboard formats available at OS level. This can cause compatibility issues between applications.

## Recommended Next Steps

### 1. Try Multi-MIME Type Approach

```javascript
// In background.js injected script
const clipboardData = {
  'text/plain': new Blob([filename], { type: 'text/plain' }),
  'text/html': new Blob([
    `<img src="${dataUrl}" alt="${filename}" />`
  ], { type: 'text/html' }),
  'image/png': blob
};

const clipboardItem = new ClipboardItem(clipboardData);
await navigator.clipboard.write([clipboardItem]);
```

### 2. Test Different HTML Formats

Try variations of `text/html`:
- Plain `<img>` tag with data URL
- Wrapped in `<div>` or other container
- With specific attributes (width, height, alt)

### 3. Investigate Native File Format

Some apps prefer clipboard as file reference rather than blob. Consider:
- Using Chrome Downloads API to save file
- Copying file path to clipboard
- Using native drag-drop events

### 4. Debug Clipboard Contents

Use system clipboard inspector to see what formats are available:
- macOS: Built-in clipboard viewer
- Windows: Clipboard History (Win+V)
- Linux: `xclip -selection clipboard -t TARGETS -o`

## Additional Resources

- [MDN: ClipboardItem](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem)
- [Multi-MIME Type Copying](https://blog.tomayac.com/2020/03/20/multi-mime-type-copying-with-the-async-clipboard-api/)
- [Chrome: Async Clipboard](https://web.dev/articles/async-clipboard)
- [Electron Clipboard API](https://www.electronjs.org/docs/latest/api/clipboard)

## Implementation Priority

1. **HIGH:** Multi-MIME type approach (text/plain + text/html + image/png)
2. **MEDIUM:** HTML format variations
3. **LOW:** Native file format approach (complex, may not be needed)

## Success Criteria

- ✅ Screenshot pastes into Claude Code text input
- ✅ Screenshot pastes into other apps (graphics, docs)
- ✅ No CSP violations
- ✅ Clean console output
- ✅ Files save to disk successfully

---

**Status:** Ready to implement multi-MIME type approach
**Next Session:** Test ClipboardItem with multiple MIME types
