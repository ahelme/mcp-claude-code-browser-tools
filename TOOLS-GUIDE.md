# Browser Tools MCP - Claude Operating Instructions

## Quick Reference for Claude 

This document provides concise instructions for Claude to operate browser-tools MCP on behalf of users.

## MCP Server Functions

Browser-tools MCP functions start with `mcp__browser-tools__`. 

Key functions include:
- `mcp__browser-tools__navigate` - Navigate to URL
- `mcp__browser-tools__screenshot` - Capture screenshot
- `mcp__browser-tools__click` - Click element
- `mcp__browser-tools__type` - Type text
- `mcp__browser-tools__evaluate` - Execute JavaScript
- `mcp__browser-tools__get_console_logs` - Get console output
- `mcp__browser-tools__wait_for_element` - Wait for element
- `mcp__browser-tools__get_page_content` - Get page HTML
- `mcp__browser-tools__audit` - Run Lighthouse audits

## Step-by-Step Operating Instructions

### 1. Check MCP Availability
First, verify browser-tools MCP is available:
```
Use ListMcpResourcesTool to check available MCP servers
Look for "browser-tools" in the server list

NOTE: If browser-tools is not listed, the server is not running.
See README.md if this is the case.
```

### 2. Basic Navigation & Screenshot
```python
1. Navigate to URL:
   mcp__browser-tools__navigate(url="https://example.com")

2. Wait for page load:
   mcp__browser-tools__wait_for_element(selector="body")

3. Capture screenshot:
   mcp__browser-tools__screenshot(selector="body")
   → Saves to .screenshots/ directory
```

### 3. Interacting with Page Elements
```python
# Click a button
mcp__browser-tools__click(selector="button#submit")

# Type in input field
mcp__browser-tools__type(selector="input#email", text="test@example.com")

# Get element text
mcp__browser-tools__evaluate(script="document.querySelector('h1').innerText")
```

### 4. Running Audits
```python
# Run accessibility audit
mcp__browser-tools__audit(type="accessibility")

# Run performance audit
mcp__browser-tools__audit(type="performance")

# Run SEO audit
mcp__browser-tools__audit(type="seo")

# Run best practices audit
mcp__browser-tools__audit(type="best-practices")
```

### 5. Monitoring & Debugging
```python
# Get console logs
mcp__browser-tools__get_console_logs()

# Get page content
mcp__browser-tools__get_page_content()

# Execute custom JavaScript
mcp__browser-tools__evaluate(script="return window.location.href")
```

## Quick Test Sequence

To verify browser-tools MCP is working:

```python
1. mcp__browser-tools__navigate(url="https://example.com")
2. mcp__browser-tools__wait_for_element(selector="h1")
3. mcp__browser-tools__screenshot()
4. mcp__browser-tools__get_console_logs()
5. mcp__browser-tools__audit(type="accessibility")
```

## Common Use Cases

### Form Testing
```python
mcp__browser-tools__navigate(url="file:///path/to/.tests/example-test-page.html")
mcp__browser-tools__type(selector="#name", text="Test User")
mcp__browser-tools__type(selector="#email", text="test@example.com")
mcp__browser-tools__click(selector="button[type='submit']")
mcp__browser-tools__get_console_logs()  # Check form submission
```

### Responsive Testing
```python
# Test different viewports
mcp__browser-tools__evaluate(script="window.innerWidth = 375")  # Mobile
mcp__browser-tools__screenshot()
mcp__browser-tools__evaluate(script="window.innerWidth = 768")  # Tablet
mcp__browser-tools__screenshot()
mcp__browser-tools__evaluate(script="window.innerWidth = 1920") # Desktop
mcp__browser-tools__screenshot()
```

### Performance Analysis
```python
mcp__browser-tools__navigate(url="https://example.com")
mcp__browser-tools__audit(type="performance")
mcp__browser-tools__evaluate(script="return performance.timing")
```


## 🛠️ Using Audit Tools

### ✅ Before You Start
Ensure you have:
- An active tab in your browser
- The BrowserTools extension enabled

### ▶️ Running Audits

**Headless Browser Automation:**
Puppeteer automates a headless Chrome instance to load the page and collect audit data, ensuring accurate results even for SPAs or content loaded via JavaScript.

The headless browser instance remains active for 60 seconds after the last audit call to efficiently handle consecutive audit requests.

**Structured Results:**
Each audit returns results in a structured JSON format, including overall scores and detailed issue lists. This makes it easy for MCP-compatible clients to interpret the findings and present actionable insights.

The MCP server provides tools to run audits on the current page. Here are example queries you can use to trigger them:

#### Accessibility Audit (runAccessibilityAudit)
Ensures the page meets accessibility standards like WCAG.

**Example Queries:**
- "Are there any accessibility issues on this page?"
- "Run an accessibility audit."
- "Check if this page meets WCAG standards."

#### Performance Audit (runPerformanceAudit)
Identifies performance bottlenecks and loading issues.

**Example Queries:**
- "Why is this page loading so slowly?"
- "Check the performance of this page."
- "Run a performance audit."

#### SEO Audit (runSEOAudit)
Evaluates how well the page is optimized for search engines.

**Example Queries:**
- "How can I improve SEO for this page?"
- "Run an SEO audit."
- "Check SEO on this page."

#### Best Practices Audit (runBestPracticesAudit)
Checks for general best practices in web development.

**Example Queries:**
- "Run a best practices audit."
- "Check best practices on this page."
- "Are there any best practices issues on this page?"

#### Audit Mode (runAuditMode)
Runs all audits in a particular sequence. Will run a NextJS audit if the framework is detected.

**Example Queries:**
- "Run audit mode."
- "Enter audit mode."

#### NextJS Audits (runNextJSAudit)
Checks for best practices and SEO improvements for NextJS applications

**Example Queries:**
- "Run a NextJS audit."
- "Run a NextJS audit, I'm using app router."
- "Run a NextJS audit, I'm using page router."

#### Debugger Mode (runDebuggerMode)
Runs all debugging tools in a particular sequence

**Example Queries:**
- "Enter debugger mode."


## Troubleshooting

See README.md

## Important Notes

### Port Configuration
- Default port: 3024

### Session Management
- Browser sessions timeout after 60 seconds
- Each MCP call maintains the session
- Session resets if idle too long

### File Locations
- Screenshots: `./.screenshots/`
- Test files: `./.tests/`
- Example page: `./.tests/example-test-page.html`

## Prerequisites

**IMPORTANT**: Claude Code Browser Tools MCP has two components that work together:
1. http bridge: The browser automation server (can be started by Claude Code itself)
2. MCP server: The MCP interface (configured in `.mcp.json`)

### How It Actually Works

**Reality Check**: 
- MCP servers are configured in `.mcp.json` for the Claude Code application
- Once configured, the MCP servers start automatically at the moment Claude launches 
- Claude CANNOT directly invoke MCP functions unless the MCP server is already configured and connected

### What Claude CANNOT Do

- Cannot force the MCP connection to initialize within the session
- Cannot directly call mcp__browser-tools__ functions unless already connected
- Cannot restart the Claude application to pick up MCP changes

### Solution for Users

Restart Claude Code after MCP configuration changes.

## Remember

- **SAVE** screenshots to `.screenshots/`
- **TEST** files go in `.tests/`
