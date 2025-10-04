# MCP Server Clipboard Endpoints

## Summary

Added two new endpoints to `mcp-server/http-bridge.mjs` for native OS clipboard operations.

## Endpoints Added

### 1. `/copy-file-to-clipboard` (POST)

**Purpose:** Copy a screenshot file to the OS clipboard in native format (like Finder copy).

**Request:**
```json
{
  "filePath": "/Users/username/Downloads/screenshots/screenshot.png"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "File copied to clipboard in native format",
  "platform": "darwin",
  "filePath": "/Users/username/Downloads/screenshots/screenshot.png"
}
```

**Platform Commands:**
- **macOS:** `osascript -e 'set the clipboard to POSIX file "/path"'`
- **Windows:** `powershell.exe -command "Get-Item 'C:\path' | Set-Clipboard"`
- **Linux:** `xclip -selection clipboard -t image/png -i "/path"` (with wl-copy fallback)

**Security:**
- Validates file path is within `~/Downloads/screenshots/` directory
- Checks file exists before attempting copy
- Returns 400/404 errors for invalid paths

---

### 2. `/show-in-finder` (POST)

**Purpose:** Fallback method - opens file manager with file selected.

**Request:**
```json
{
  "filePath": "/Users/username/Downloads/screenshots/screenshot.png"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "File revealed in file manager",
  "platform": "darwin",
  "filePath": "/Users/username/Downloads/screenshots/screenshot.png"
}
```

**Platform Commands:**
- **macOS:** `open -R "/path"` (reveals and selects file)
- **Windows:** `explorer /select,"/path"` (opens with file selected)
- **Linux:** `xdg-open "/parent/directory"` (opens parent directory)

**Security:** Same validation as `/copy-file-to-clipboard`

---

## Implementation Details

**Added Imports:**
```javascript
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
```

**Location:** Lines 396-541 in `http-bridge.mjs`

**Cross-Platform Support:**
- ✅ macOS (darwin)
- ✅ Windows (win32)
- ✅ Linux (X11 with xclip, Wayland with wl-clipboard)

**Error Handling:**
- Path validation (must be in screenshots directory)
- File existence check
- Platform support check
- Command execution error handling

---

## Testing

**Test macOS clipboard copy:**
```bash
curl -X POST http://localhost:3024/copy-file-to-clipboard \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/Users/lennox/Downloads/screenshots/screenshot.png"}'
```

**Test show in Finder:**
```bash
curl -X POST http://localhost:3024/show-in-finder \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/Users/lennox/Downloads/screenshots/screenshot.png"}'
```

---

## Next Steps

1. **Restart MCP HTTP Bridge** to load new endpoints
2. **Update Chrome extension** to call these endpoints
3. **Test clipboard paste** in Claude Code
4. **Implement hybrid fallback** logic in extension

---

**Status:** ✅ MCP Server endpoints implemented  
**Date:** October 2, 2025  
**Related Issue:** GitHub #64
