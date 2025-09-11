# PostFlow Testing Scripts

This directory contains scripts for testing PostFlow with browser automation tools.

## Scripts

### 1. `start-browser-tools.sh`
Starts the browser-tools MCP server for UI testing.

**Usage:**
```bash
./scripts/start-browser-tools.sh
```

**What it does:**
- Checks if PostFlow is running (frontend on 3000, backend on 3001)
- Starts the browser-tools server
- Provides instructions for connecting Chrome extension

### 2. `test-ui-with-browser-tools.js`
Comprehensive UI test plan for PostFlow using browser-tools.

**Usage:**
```bash
node ./scripts/test-ui-with-browser-tools.js
```

**What it tests:**
- Login page and authentication
- Dashboard with ShadCN cards
- Projects and Students pages
- Admin functionality
- Yellow theme consistency
- Accessibility compliance
- Performance metrics

## Setup Instructions

1. **Install Chrome Extension**
   - Download the BrowserToolsMCP Chrome extension
   - Install it in Chrome

2. **Start PostFlow**
   ```bash
   # Terminal 1 - Backend
   npm start
   
   # Terminal 2 - Frontend
   cd client && npm start
   ```

3. **Start Browser-Tools Server**
   ```bash
   ./scripts/start-browser-tools.sh
   ```

4. **Connect Chrome**
   - Open Chrome and go to http://localhost:3000
   - Open DevTools (F12)
   - Find the BrowserToolsMCP panel
   - The server will automatically connect

5. **Run Tests**
   - Use the BrowserToolsMCP panel to:
     - Capture screenshots
     - Run accessibility audits
     - Monitor console output
     - Check network activity
     - Analyze DOM elements

## Test Credentials

- **Admin**: admin@filmschool.edu / admin123
- **Producer**: producer@filmschool.edu / producer123

## Expected Results

✅ All pages load without errors  
✅ Yellow theme is consistent (HSL: 47 96% 53%)  
✅ ShadCN components render correctly  
✅ No console errors  
✅ Accessibility audit passes  
✅ Performance metrics are acceptable  
✅ Responsive design works on all screen sizes  

## Troubleshooting

If browser-tools doesn't connect:
1. Close all Chrome windows
2. Restart the browser-tools server
3. Make sure only one DevTools panel is open
4. Check that the extension is enabled

## ShadCN Components to Verify

- **Button**: Primary yellow, outline, secondary variants
- **Card**: Dashboard statistics cards
- **Input**: Form inputs
- **Select**: Dropdown menus
- **Table**: Data tables
- **Dialog**: Modal dialogs
- **Toast**: Notification toasts
- **Badge**: Status badges