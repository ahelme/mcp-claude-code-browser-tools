# Browser Tools MCP - Claude Operating Instructions

## Quick Reference for Claude

This document provides concise instructions for Claude to operate browser-tools MCP on behalf of users.

## Available MCP Functions

Browser-tools MCP functions start with `mcp__browser-tools__`. Key functions include:
- `mcp__browser-tools__navigate` - Navigate to URL
- `mcp__browser-tools__screenshot` - Capture screenshot
- `mcp__browser-tools__click` - Click element
- `mcp__browser-tools__type` - Type text
- `mcp__browser-tools__evaluate` - Execute JavaScript
- `mcp__browser-tools__get_console_logs` - Get console output
- `mcp__browser-tools__wait_for_element` - Wait for element
- `mcp__browser-tools__get_page_content` - Get page HTML
- `mcp__browser-tools__audit` - Run Lighthouse audits

## Prerequisites

**IMPORTANT**: The browser-tools server must be running BEFORE Claude can use it:
```bash
# User must run this in terminal first:
./scripts/start-browser-tools.sh
```

## Step-by-Step Operating Instructions

### 1. Check MCP Availability
First, verify browser-tools MCP is available:
```
Use ListMcpResourcesTool to check available MCP servers
Look for "browser-tools" in the server list

NOTE: If browser-tools is not listed, the server is not running.
User must start it with: ./scripts/start-browser-tools.sh
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

## Important Notes

### Port Configuration
- Default port: 3025
- This project uses: 3026 (to avoid conflicts)
- Server must be running: `./scripts/start-browser-tools.sh`

### Session Management
- Browser sessions timeout after 60 seconds
- Each MCP call maintains the session
- Session resets if idle too long

### File Locations
- Screenshots: `./.screenshots/`
- Test files: `./.tests/`
- Example page: `./.tests/example-test-page.html`

### Error Handling
If MCP functions fail:
1. Check if browser-tools server is running
2. Verify port is not blocked
3. Ensure Chrome extension is installed (for manual testing)
4. Check for session timeout

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

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MCP not available | Check if browser-tools is in `.claude/mcp.json` |
| Functions fail | Ensure server is running on correct port |
| Session timeout | Navigate to URL again to start new session |
| No screenshots | Check `.screenshots/` directory permissions |

## Remember

- **ALWAYS** use browser-tools MCP instead of Puppeteer
- **SAVE** screenshots to `./.screenshots/`
- **TEST** files go in `./.tests/`
- **PORT** 3026 for this project (not default 3025)