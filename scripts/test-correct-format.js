#!/usr/bin/env node

/**
 * Quick test of correct WebSocket message format
 * Send message directly to our running server's WebSocket connection
 */

import { WebSocket } from 'ws';

const ws = new WebSocket('ws://localhost:3025/extension-ws');

ws.on('open', () => {
    console.log('🔌 Connected to debug server');

    // Test correct screenshot format
    const correctMessage = {
        "type": "take-screenshot",
        "requestId": Date.now().toString()
    };

    console.log('📤 Sending CORRECT format:', JSON.stringify(correctMessage, null, 2));
    ws.send(JSON.stringify(correctMessage));

    // Close after test
    setTimeout(() => {
        ws.close();
        process.exit(0);
    }, 5000);
});

ws.on('message', (data) => {
    console.log('📨 Received:', data.toString());
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});