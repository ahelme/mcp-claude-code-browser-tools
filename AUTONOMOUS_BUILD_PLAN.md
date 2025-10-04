# 🚀 AUTONOMOUS BUILD PLAN: Visual Messaging MVP

## 🎯 **MISSION**
Build the world's first **two-way messaging system between human and AI agent directly in the browser DevTools panel**. This is THE killer feature that differentiates us from all competitors.

**Branch:** `feature/visual-messaging-mvp`
**Timeline:** 2-6 weeks (aggressive sprint)
**Mode:** Autonomous with tight build-test-iterate loops

---

## 🔥 **THE VISION**

**User workflow (15 seconds):**
1. Click element picker in DevTools panel
2. Click problematic element
3. Type "This looks weird" in message box
4. Hit Send
5. Claude responds IN THE PANEL with analysis + fix
6. Done! ✅

**No context switching. No terminal. Just CONVERSATION in the browser.**

---

## 📋 **PHASE 1: MVP - Message Box + Screenshots (Week 1-2)**

### **Core Deliverables:**
- ✅ Message input UI in DevTools panel
- ✅ Screenshot attachment system
- ✅ Element picker (hover + click)
- ✅ Two-way messaging (user → Claude → user)
- ✅ Conversation thread display

### **Build-Test-Iterate Loop:**

#### **Iteration 1: UI Scaffold (2-4 hours)**
**Build:**
- Create `chrome-extension/panel/visual-message-panel.js`
- Design HTML structure for message box
- Basic CSS styling
- Render in `panel.html`

**Test:**
- Panel loads without errors
- Message box appears in DevTools
- Textarea accepts input
- Send button is clickable

**Success Criteria:** Can type in message box and click send (even if it does nothing yet)

---

#### **Iteration 2: Screenshot Attachment UI (2-3 hours)**
**Build:**
- Screenshot list component
- Checkbox selection
- Load recent screenshots from directory
- Display element metadata (selector, dimensions)

**Test:**
- Screenshot list populates
- Checkboxes toggle correctly
- Selected count updates
- Element info displays

**Success Criteria:** Can select/deselect screenshots, see count update

---

#### **Iteration 3: Element Picker (4-6 hours)**
**Build:**
- Create `chrome-extension/element-picker.js`
- Hover overlay (blue highlight)
- Element info tooltip (selector, dimensions)
- Click to capture element
- Extract element metadata (selector, bounds, classes)
- Save screenshot with element data

**Test:**
- Hover shows blue overlay on elements
- Tooltip shows correct selector/dimensions
- Click captures element screenshot
- Element metadata included in screenshot file
- ESC cancels picker mode

**Success Criteria:** Can hover, see info, click to capture element screenshot

---

#### **Iteration 4: Message Sending (3-4 hours)**
**Build:**
- HTTP bridge endpoint: `POST /visual-message`
- Load selected screenshot data (base64)
- Send message + screenshots to bridge
- Add message to local conversation history
- Show "sending..." status

**Test:**
- Click send → HTTP request fires
- Bridge receives message + screenshots
- Console shows request payload
- Message appears in conversation as "sending"

**Success Criteria:** Message + screenshots reach HTTP bridge successfully

---

#### **Iteration 5: MCP Tool Integration (3-4 hours)**
**Build:**
- Add `browser_receive_visual_message` to MCP server tools list
- Define input schema (message, screenshots array)
- Map HTTP bridge → MCP server
- Format screenshots for Claude (base64 images)

**Test:**
- Bridge forwards to MCP server
- MCP server receives tool call
- Claude Code sees message + screenshots
- I (Claude) can view attached screenshots

**Success Criteria:** I can see user's message + screenshots in Claude Code

---

#### **Iteration 6: WebSocket Two-Way Messaging (4-6 hours)**
**Build:**
- HTTP bridge WebSocket event: `visual-message-response`
- Extension panel WebSocket listener
- Receive Claude's response
- Parse response (text, screenshots, metadata)
- Add to conversation thread

**Test:**
- I (Claude) send response via MCP
- Bridge forwards via WebSocket
- Extension receives response
- Response appears in conversation
- User sees it in panel!

**Success Criteria:** Complete round-trip! User → Claude → User communication works!

---

#### **Iteration 7: Conversation Display (3-4 hours)**
**Build:**
- Message thread component
- User vs Claude message styling
- Timestamp display
- Screenshot attachment display
- Auto-scroll to latest
- Status indicators (sending, sent, error)

**Test:**
- Messages display in correct order
- User/Claude messages styled differently
- Timestamps show correctly
- Attached screenshots render
- Auto-scrolls on new message

**Success Criteria:** Beautiful conversation thread that's easy to follow

---

#### **Iteration 8: End-to-End Integration Test (2-3 hours)**
**Test Scenarios:**

1. **Simple message without screenshots**
   - Type "Hello"
   - Send
   - I respond "Hi! How can I help?"
   - Response appears in panel

2. **Message with screenshot**
   - Capture screenshot
   - Type "Is this centered?"
   - Send with screenshot attached
   - I analyze screenshot
   - Respond with analysis
   - Response appears in panel

3. **Element picker workflow**
   - Click element picker
   - Hover over nav menu
   - See blue overlay + tooltip
   - Click to capture
   - Screenshot added to list (auto-checked)
   - Type message
   - Send
   - I respond with element-specific analysis

4. **Multi-screenshot message**
   - Capture 3 elements
   - Select all 3 checkboxes
   - Type "Check these three areas"
   - Send
   - I analyze all 3
   - Respond with findings for each

**Success Criteria:** All 4 scenarios work end-to-end without errors

---

#### **Iteration 9: Polish & UX (4-6 hours)**
**Build:**
- Improve CSS styling (modern, clean)
- Add animations (fade in messages, smooth scroll)
- Keyboard shortcuts (Cmd+Enter to send, ESC to cancel picker)
- Loading states (spinner while Claude responds)
- Error handling (show errors in conversation)
- Desktop notifications (when Claude responds)

**Test:**
- UI looks professional
- Animations are smooth
- Keyboard shortcuts work
- Loading states appear correctly
- Errors display user-friendly messages
- Notifications show when panel not focused

**Success Criteria:** MVP feels polished and professional

---

## 🚀 **PHASE 2: CDP Superpowers (Week 3-4)**

### **Core Deliverables:**
- ✅ Chrome DevTools Protocol integration via chrome.debugger API
- ✅ CSS matched styles inspection
- ✅ Visual element highlighting
- ✅ Grid/Flexbox overlays
- ✅ Precise layout measurements

### **Build-Test-Iterate Loop:**

#### **Iteration 10: CDP Foundation (3-4 hours)**
**Build:**
- Request debugger permission in manifest.json
- Create `chrome-extension/cdp-client.js`
- Attach chrome.debugger to active tab
- Enable CSS and DOM domains
- Helper functions for sending CDP commands

**Test:**
- Debugger attaches without errors
- User sees "DevTools is debugging" banner
- Can send basic CDP commands
- CSS domain enabled
- DOM domain enabled

**Success Criteria:** CDP connection established and working

---

#### **Iteration 11: browser_get_matched_styles Tool (4-5 hours)**
**Build:**
- MCP tool definition
- CDP command: `CSS.getMatchedStylesForNode`
- Get nodeId from selector
- Parse CSS rules response
- Format matched rules with source files, line numbers, specificity
- Return inheritance chain and pseudo-element styles

**Test:**
- Call tool with selector
- Returns all matched CSS rules
- Shows source file + line numbers
- Includes specificity values
- Shows inherited styles
- Includes ::before/::after styles

**Success Criteria:** I can see ALL CSS rules affecting an element with complete metadata

---

#### **Iteration 12: browser_highlight_element Tool (3-4 hours)**
**Build:**
- MCP tool definition
- CDP command: `Overlay.highlightNode`
- Configure highlight colors (content, padding, border, margin)
- Show info overlay (dimensions, selector)
- Auto-remove highlight after timeout

**Test:**
- Call tool with selector
- Element highlights in user's browser
- Box model visualization shows (4 colors)
- Dimension overlay appears
- Highlight disappears after timeout

**Success Criteria:** I can visually point to elements for user

---

#### **Iteration 13: browser_visualize_layout Tool (4-5 hours)**
**Build:**
- MCP tool definition
- CDP command: `Overlay.setShowGridOverlays` for Grid
- CDP command: `Overlay.setShowFlexOverlays` for Flexbox
- Configure overlay options (show line names, track sizes, area names)
- Take screenshot with overlay visible

**Test:**
- Call tool with Grid selector
- Grid overlay appears in browser
- Shows grid lines, track sizes, area names
- Screenshot captures overlay
- Call tool with Flexbox selector
- Flexbox overlay appears
- Shows flex container and items

**Success Criteria:** Beautiful visual Grid/Flexbox overlays like DevTools inspector

---

#### **Iteration 14: browser_measure_layout Tool (2-3 hours)**
**Build:**
- Get element via DOM.querySelector
- CDP command: `DOM.getBoxModel`
- Calculate center points
- Calculate viewport center
- Calculate offset from center
- Return precise measurements

**Test:**
- Call tool with selector
- Returns exact dimensions
- Returns center coordinates
- Returns viewport center
- Calculates offset ("12px left of center")

**Success Criteria:** Pixel-perfect measurement data for alignment debugging

---

#### **Iteration 15: CDP Integration Test (2-3 hours)**
**Test Workflow:**

User: [Captures button] "Why is this off-center?"

Claude:
1. Calls browser_measure_layout({ selector: "button.primary" })
2. Gets: "Button is 12px left of center"
3. Calls browser_get_matched_styles({ selector: "button.primary" })
4. Sees: "margin: 0 auto (from base.css:45)"
5. Calls browser_highlight_element({ selector: "button.primary" })
6. Button highlights in browser with box model
7. Responds: "The button is 12px off-center because it's inline-block instead of block. Let me fix..."

**Success Criteria:** Complete CSS debugging workflow using CDP tools

---

## 💎 **PHASE 3: Visual Precision (Week 5-6)**

### **Core Deliverables:**
- ✅ Visual diff engine (pixelmatch)
- ✅ Before/after comparison
- ✅ Lighthouse integration
- ✅ Accessibility overlay

### **Build-Test-Iterate Loop:**

#### **Iteration 16: Pixelmatch Integration (3-4 hours)**
**Build:**
- Install pixelmatch library
- Create `chrome-extension/visual-diff-engine.js`
- Load before/after screenshots
- Run pixel comparison
- Generate diff image
- Calculate percentage changed

**Test:**
- Compare identical images → 0% diff
- Compare different images → accurate %
- Diff image highlights changes
- Performance is acceptable

**Success Criteria:** Accurate pixel-level image comparison

---

#### **Iteration 17: browser_visual_diff Tool (4-5 hours)**
**Build:**
- MCP tool definition
- Store "before" screenshot automatically when task starts
- Capture "after" screenshot
- Run pixelmatch comparison
- Return diff data + images
- Display in conversation

**Test:**
- I make CSS change
- Call browser_visual_diff
- Shows before/after/diff images
- Percentage changed is accurate
- User sees visual comparison in panel

**Success Criteria:** Clear before/after visual proof of changes

---

#### **Iteration 18: Lighthouse Integration (4-6 hours)**
**Build:**
- Install lighthouse library
- Create browser_audit tool
- Run Lighthouse on current page
- Extract scores (performance, accessibility, SEO, best-practices)
- Format issues with recommendations
- Return structured audit data

**Test:**
- Call browser_audit
- Lighthouse runs successfully
- Returns all category scores
- Lists specific issues
- Provides recommendations
- Completes in reasonable time

**Success Criteria:** Full Lighthouse audit available as MCP tool

---

#### **Iteration 19: browser_accessibility_overlay Tool (5-6 hours)**
**Build:**
- Scan page for a11y issues
- Calculate color contrast ratios
- Check for alt text, ARIA labels
- Create visual overlay showing issues
- Highlight problem areas on screenshot
- Annotate with issue descriptions

**Test:**
- Call tool on page with a11y issues
- Identifies contrast problems
- Finds missing alt text
- Creates annotated screenshot
- Issues clearly visible

**Success Criteria:** Visual accessibility debugging overlay

---

#### **Iteration 20: Final Integration & Polish (6-8 hours)**
**Integration Test:**

Complete workflow:
1. User: [Captures nav] "Check accessibility"
2. Claude calls browser_audit
3. Finds contrast issue + missing alt
4. Calls browser_accessibility_overlay
5. Creates visual overlay
6. Highlights problems in screenshot
7. Responds with annotated image + fixes
8. Makes changes
9. Calls browser_visual_diff
10. Shows before/after proof
11. Calls browser_audit again
12. Confirms issues fixed ✅

**Polish:**
- Performance optimization
- Memory management
- Error handling
- Loading states
- Documentation
- Demo creation

**Success Criteria:** Entire feature works smoothly end-to-end

---

## 🔄 **AUTONOMOUS WORK LOOP**

```
1. Pick next todo item
2. Mark as in_progress
3. BUILD: Write code for that iteration
4. TEST: Verify success criteria
5. If tests pass:
   - Mark as completed
   - Git commit with clear message
   - Move to next item
6. If tests fail:
   - DEBUG: Analyze failure
   - FIX: Update code
   - RETEST: Verify fix
   - Repeat until passing
7. Every 5 items completed:
   - Run integration test
   - Ensure previous features still work
   - Commit consolidated progress
8. REPEAT until all todos complete!
```

---

## 🎯 **SUCCESS CRITERIA FOR MVP**

### **Must Have:**
- ✅ Message box in DevTools panel
- ✅ Element picker working
- ✅ Screenshots attach to messages
- ✅ Two-way messaging (user ↔ Claude)
- ✅ Conversation displays correctly
- ✅ End-to-end workflow completes

### **Nice to Have:**
- ✅ Smooth animations
- ✅ Keyboard shortcuts
- ✅ Desktop notifications
- ✅ Error handling
- ✅ Loading states

---

## 🚀 **READY TO LAUNCH**

When complete:
1. Full demo video showing 15-second workflow
2. Documentation with examples
3. README updated with killer feature
4. GitHub issues #70 and #71 updated
5. Ready for user testing!

---

## 💪 **LET'S GOOOOO!!!**

**This is THE feature that changes everything!**

Nobody else has this. Nobody can copy it quickly. We're first to market with **true pair programming in the browser**! 🔥

Time to build something REVOLUTIONARY! 🚀✨
