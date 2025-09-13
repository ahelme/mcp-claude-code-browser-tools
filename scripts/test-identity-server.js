#!/usr/bin/env node
/**
 * Test server to find the correct identity for Chrome extension
 * Run this on a different port to test various identity responses
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3026; // Different port to avoid conflict

app.use(cors());
app.use(express.json());

// Test different identity responses
const identities = [
    'browser-tools-mcp-server',
    'browser-tools-mcp',
    'browsertools-mcp',
    'AgentDeskAI-browser-tools',
    'browser-tools-server',
    'mcp-browser-tools'
];

let currentIndex = 0;

app.get('/.identity', (req, res) => {
    const identity = identities[currentIndex];
    console.log(`Testing identity: ${identity}`);
    res.json({ name: identity });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        connected: false,
        testingIdentity: identities[currentIndex],
        availableIdentities: identities
    });
});

app.post('/next-identity', (req, res) => {
    currentIndex = (currentIndex + 1) % identities.length;
    console.log(`Switched to identity: ${identities[currentIndex]}`);
    res.json({
        newIdentity: identities[currentIndex],
        index: currentIndex
    });
});

app.listen(PORT, () => {
    console.log(`\n🧪 Test Identity Server running on http://localhost:${PORT}`);
    console.log(`Current identity: ${identities[currentIndex]}`);
    console.log(`\nTo test different identities:`);
    console.log(`curl -X POST http://localhost:${PORT}/next-identity`);
    console.log(`\nTo check current identity:`);
    console.log(`curl http://localhost:${PORT}/.identity`);
});