#!/usr/bin/env node

/**
 * Fix WebSocket message formats in http-bridge-server.js
 * Update from our incorrect formats to the correct Chrome extension formats
 */

import fs from 'fs';

const serverPath = './scripts/http-bridge-server.js';

console.log('🔧 Fixing WebSocket message formats...');

let serverCode = fs.readFileSync(serverPath, 'utf8');

// Fix screenshot command format
serverCode = serverCode.replace(
    /action: 'screenshot'/g,
    'type: "take-screenshot"'
);

// Fix screenshot response handler
serverCode = serverCode.replace(
    /message\.type === 'screenshot'/g,
    'message.type === "screenshot-data"'
);

// Fix evaluate command format
serverCode = serverCode.replace(
    /action: 'evaluate'/g,
    'type: "execute-script"'
);

// Fix evaluate response handler
serverCode = serverCode.replace(
    /message\.type === 'evaluateResult'/g,
    'message.type === "script-result"'
);

// Fix navigate command format
serverCode = serverCode.replace(
    /action: 'navigate'/g,
    'type: "navigate-to"'
);

// Fix other command formats
serverCode = serverCode.replace(
    /action: 'click'/g,
    'type: "click-element"'
);

serverCode = serverCode.replace(
    /action: 'type'/g,
    'type: "type-text"'
);

serverCode = serverCode.replace(
    /action: 'wait'/g,
    'type: "wait-for-element"'
);

serverCode = serverCode.replace(
    /action: 'getContent'/g,
    'type: "get-page-content"'
);

// Fix page content response handler
serverCode = serverCode.replace(
    /message\.type === 'pageContent'/g,
    'message.type === "page-content-data"'
);

// Add requestId to all outgoing messages
serverCode = serverCode.replace(
    /(type: "[^"]+")(\s*})/g,
    '$1,\n            requestId: Date.now().toString()$2'
);

fs.writeFileSync(serverPath, serverCode);

console.log('✅ Fixed WebSocket message formats!');
console.log('🔄 Restart the server to use correct formats');