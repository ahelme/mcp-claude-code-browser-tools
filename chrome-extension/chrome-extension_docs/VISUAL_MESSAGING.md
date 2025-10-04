# 💬 Visual Messaging - True Pair Programming with Claude

## Overview

Visual Messaging enables **real-time two-way conversation** between you and Claude directly in your browser's DevTools panel. Share screenshots with element context, discuss what you see, and receive Claude's responses instantly - all without leaving your browser.

**This is THE killer feature for true pair programming with AI!**

## Features

### 🎯 Core Capabilities

- **Two-Way Messaging**: Send messages to Claude and receive responses in real-time
- **Screenshot Attachments**: Attach multiple screenshots with element metadata
- **Element Picker**: Hover and click to capture specific UI elements
- **Conversation History**: Full threaded conversation with timestamps
- **Visual Context**: Thumbnails with CSS selectors for precise element reference

### 🎨 User Interface

**Two-Column Layout:**
- **Left**: Message input + screenshot attachments
- **Right**: Conversation thread

**Color-Coded Messages:**
- **Blue**: Your messages
- **Green**: Claude's responses

## How to Use

### 1. Send a Message to Claude

1. Type your message in the text area (left column)
2. Press `Cmd+Enter` (Mac) or `Ctrl+Enter` (Windows) to send
3. Your message appears in the conversation thread (right column)

### 2. Attach Screenshots

#### Using Element Picker:

1. Click **🎯 Pick Element** button
2. Hover over elements on the page - they'll highlight with a cyan overlay
3. Click the element you want to capture
4. Screenshot appears in the attachment list with thumbnail preview
5. Picker automatically resets for next capture

#### Screenshot Details:

Each screenshot shows:
- 40x40px thumbnail preview
- Filename (auto-generated from element)
- CSS selector (for precise reference)
- Time captured

### 3. Manage Screenshots

- **Select**: Check boxes to attach to message
- **✖ Deselect**: Clear all selections
- **🗑️ Clear**: Remove all screenshots (with confirmation)

### 4. Manage Conversation

- **Scroll**: Conversation auto-scrolls to newest message
- **🗑️ Clear**: Clear entire conversation history (with confirmation)

## Message Flow

### User → Claude

1. User types message and selects screenshots
2. Clicks "📤 Send to Claude"
3. Message sent via HTTP POST to `/visual-message` endpoint
4. Delivered to Claude via MCP tool `browser_receive_visual_message`
5. Message appears in conversation thread

### Claude → User

1. Claude calls MCP tool or uses `send-claude-message.mjs` utility
2. Message sent via HTTP POST to `/send-response` endpoint
3. Delivered to extension via WebSocket
4. Message appears in conversation thread

## Technical Details

### Architecture

```
DevTools Panel (visual-message-panel.js)
    ↓ (HTTP POST /visual-message)
HTTP Bridge (http-bridge.mjs:3024)
    ↓ (MCP tool call)
Claude Code (MCP client)
    ↓ (HTTP POST /send-response)
HTTP Bridge (http-bridge.mjs:3024)
    ↓ (WebSocket message)
DevTools Panel (visual-message-panel.js)
```

### Endpoints

**User → Claude:**
- `POST http://localhost:3024/visual-message`
- Body: `{ message: string, screenshots: Array }`

**Claude → User:**
- `POST http://localhost:3024/send-response`
- Body: `{ text: string, screenshots?: Array }`

### WebSocket Protocol

Messages use the following format:
```javascript
{
  type: "claude-response" | "visual-message-response",
  data: {
    text: string,
    screenshots: Array,
    timestamp: number
  }
}
```

## Element Picker Implementation

### How It Works

1. **Injection**: Content script (`content-element-picker.js`) injected on demand
2. **Overlay**: Full-screen overlay with pointer-events to capture hover
3. **Element Detection**: `document.elementFromPoint()` finds element at cursor
4. **Highlighting**: Cyan border overlay shows current target
5. **Capture**: Click triggers screenshot with element metadata
6. **Auto-Reset**: Picker automatically stops after successful capture

### Element Metadata

Each captured element includes:
- **Filename**: Generated from element type and text/attributes
- **Selector**: CSS selector for precise targeting
- **Timestamp**: When screenshot was captured
- **Data URL**: Base64-encoded screenshot image

## Keyboard Shortcuts

- **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows): Send message
- **Click element**: Capture screenshot (when picker active)
- **ESC**: Stop element picker (when active)

## Best Practices

### For Developers

1. **Be Specific**: Use element picker to target exact UI components
2. **Add Context**: Describe what you're seeing or asking about
3. **Multiple Angles**: Capture different elements for complete context
4. **Review Selectors**: Check CSS selectors in thumbnails for accuracy

### For Claude Integration

1. **Check Screenshots**: Review attached screenshots before responding
2. **Reference Elements**: Use CSS selectors from screenshots in responses
3. **Be Visual**: Describe what you see in the screenshots
4. **Confirm Understanding**: Verify you're discussing the right element

## Troubleshooting

### Extension Not Connected

**Symptom**: "Chrome extension not connected" error

**Solution**:
1. Check HTTP bridge is running on port 3024
2. Verify extension is loaded in Chrome
3. Check extension icon shows "Connected" status
4. Reload extension if needed

### Element Picker Not Working

**Symptom**: Can't activate element picker or elements not highlighting

**Solution**:
1. Ensure you're on a regular webpage (not chrome:// or devtools://)
2. Try reloading the page
3. Check browser console for errors
4. See Issue #72 for known precision limitations

### Messages Not Sending

**Symptom**: Messages not appearing in conversation

**Solution**:
1. Check WebSocket connection status
2. Verify HTTP bridge is running
3. Check browser console for errors
4. Ensure message text is not empty

### Screenshots Not Attaching

**Symptom**: Screenshots captured but not selectable

**Solution**:
1. Check screenshot appears in attachment list
2. Try clicking checkbox to select
3. Verify screenshot has thumbnail preview
4. Check browser console for errors

## Known Limitations

1. **Element Picker Precision** (Issue #72): Picker may stop at parent container instead of smallest child element
2. **Screenshot Format**: Currently viewport screenshots only (no full-page)
3. **Message Persistence**: Conversation clears on panel reload
4. **Emoji Support**: Some emojis may cause JSON parsing issues in responses

## Future Enhancements

- [ ] Export conversation history
- [ ] Save/load conversation sessions
- [ ] Full-page screenshot support
- [ ] Improved element picker precision (Issue #72)
- [ ] Message editing/deletion
- [ ] Screenshot annotations
- [ ] Drag-and-drop screenshot uploads
- [ ] Message search/filter

## Contributing

Found a bug or have a feature request?

1. Check existing issues: https://github.com/ahelme/mcp-claude-code-browser-tools/issues
2. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

## Credits

Built during Iterations 1-17 autonomous sprint with real-time collaboration between Aeon and Claude through the visual messaging system itself!

**Meta moment**: This feature was tested and refined by using the feature to communicate during development. True dogfooding! 🐕

---

**Questions?** Use the visual messaging system to ask Claude! 😉
