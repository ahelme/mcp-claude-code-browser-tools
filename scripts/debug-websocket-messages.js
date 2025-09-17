#!/usr/bin/env node

/**
 * WebSocket Message Debug Logger
 * Temporarily patches http-bridge-server.js to log all WebSocket messages
 */

import fs from 'fs';
import path from 'path';

const serverPath = './scripts/http-bridge-server.js';

console.log('🔍 Adding comprehensive WebSocket logging to http-bridge-server.js...');

// Read the current server file
let serverCode = fs.readFileSync(serverPath, 'utf8');

// Add debug logging to the WebSocket message handler
const originalMessageHandler = `ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);`;

const debugMessageHandler = `ws.on('message', (data) => {
        // 🔍 DEBUG: Log ALL incoming WebSocket messages
        console.log('\\n📨 [WEBSOCKET IN]', new Date().toISOString());
        console.log('Raw data:', data.toString());

        try {
            const message = JSON.parse(data);
            console.log('Parsed message:', JSON.stringify(message, null, 2));`;

// Add debug logging to outgoing WebSocket messages
const originalSendPattern = /wsConnection\.send\(JSON\.stringify\(([^)]+)\)\);/g;

serverCode = serverCode.replace(originalMessageHandler, debugMessageHandler);

// Replace all WebSocket send operations with debug logging
serverCode = serverCode.replace(originalSendPattern, (match, messageObj) => {
    return `
        // 🔍 DEBUG: Log outgoing WebSocket message
        const outgoingMessage = JSON.stringify(${messageObj});
        console.log('\\n📤 [WEBSOCKET OUT]', new Date().toISOString());
        console.log('Sending:', outgoingMessage);
        wsConnection.send(outgoingMessage);`;
});

// Write the debug version
fs.writeFileSync(serverPath, serverCode);

console.log('✅ Added comprehensive WebSocket message logging!');
console.log('📝 All incoming and outgoing WebSocket messages will now be logged');
console.log('🔄 Restart the server to see debug output');
