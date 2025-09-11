# Browser Tools Testing Scripts

This directory contains scripts for testing websites with browser automation tools using Browser Tools MCP.

## Scripts

### 1. `start-browser-tools.sh`
Starts the browser-tools MCP server for UI testing.

**Usage:**
```bash
./scripts/start-browser-tools.sh
```

**What it does:**
- Starts the browser-tools server on port 3026 (to avoid conflicts)
- Provides instructions for connecting Chrome extension
- Sets up environment for browser automation testing

### 2. `test-ui-with-browser-tools.js`
Example test cases for browser automation using browser-tools MCP.

**Usage:**
```bash
node ./scripts/test-ui-with-browser-tools.js
```

**What it tests:**
- Page load and navigation
- Screenshot capture
- DOM element inspection
- Console log monitoring
- Network activity tracking
- Accessibility compliance
- Performance metrics

## Setup Instructions

1. **Install Chrome Extension**
   - Download the BrowserToolsMCP Chrome extension
   - Install it in Chrome

2. **Start Your Web Application**
   ```bash
   # Start your local development server
   # Example: npm start, yarn dev, python -m http.server, etc.
   ```

3. **Start Browser-Tools Server**
   ```bash
   ./scripts/start-browser-tools.sh
   ```

4. **Connect Chrome**
   - Open Chrome and navigate to your test URL
   - Open DevTools (F12)
   - Find the BrowserToolsMCP panel
   - The server will automatically connect on port 3026

5. **Run Tests**
   - Use the BrowserToolsMCP panel to:
     - Capture screenshots
     - Run accessibility audits
     - Monitor console output
     - Check network activity
     - Analyze DOM elements

## Example Test URLs

- **Local Development**: http://localhost:3000
- **Public Sites**: https://example.com, https://google.com
- **Testing Playground**: https://the-internet.herokuapp.com/

## Expected Results

✅ All pages load without errors  
✅ Screenshots captured successfully  
✅ DOM elements can be inspected  
✅ Console logs are captured  
✅ Network requests are tracked  
✅ Accessibility audit passes  
✅ Performance metrics are collected  
✅ Browser automation commands work correctly  

## Troubleshooting

If browser-tools doesn't connect:
1. Close all Chrome windows
2. Restart the browser-tools server
3. Make sure only one DevTools panel is open
4. Check that the extension is enabled

## Common Elements to Test

- **Navigation**: Links, menus, breadcrumbs
- **Forms**: Input fields, buttons, validation
- **Images**: Loading, alt text, responsive sizing
- **Tables**: Data display, sorting, pagination
- **Modals**: Open/close, overlays, focus management
- **Interactive**: Dropdowns, accordions, tabs
- **Media**: Videos, audio players, embeds
- **Responsive**: Mobile, tablet, desktop views