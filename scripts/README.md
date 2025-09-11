# Browser Tools Scripts

Scripts for browser automation testing with Browser Tools MCP.

## Scripts

### 1. `start-browser-tools.sh`
Starts browser-tools server on auto-assigned port.
```bash
./scripts/start-browser-tools.sh
```

### 2. `get-browser-tools-port.sh`
Returns this project's assigned port from registry.
```bash
./scripts/get-browser-tools-port.sh
```

### 3. `test-ui-with-browser-tools.js`
Example browser automation test cases.
```bash
node ./scripts/test-ui-with-browser-tools.js
```

Tests: navigation, screenshots, DOM, console, network, accessibility, performance.

## Quick Setup

1. Install BrowserToolsMCP Chrome extension
2. Start your web app
3. Run: `./scripts/start-browser-tools.sh`
4. Open Chrome → DevTools (F12) → BrowserToolsMCP panel
5. Server auto-connects on assigned port

## Test URLs

- Local: `http://localhost:3000`
- Public: `https://example.com`
- Playground: `https://the-internet.herokuapp.com/`

## Expected Results

✅ Pages load  
✅ Screenshots work  
✅ DOM inspection  
✅ Console capture  
✅ Network tracking  
✅ Audits pass  
✅ Metrics collected  

## Troubleshooting

1. Restart Chrome
2. Restart server
3. One DevTools panel only
4. Extension enabled

## Test Elements

- Navigation: links, menus
- Forms: inputs, validation
- Images: loading, alt text
- Tables: sorting, pagination
- Modals: overlays, focus
- Interactive: dropdowns, tabs
- Media: video, audio
- Responsive: mobile, tablet, desktop