#!/usr/bin/env node

/**
 * HTTP Bridge Server for Browser Tools MCP
 * 
 * Bridges communication between our MCP server and the Chrome extension.
 * 
 * Features:
 * - WebSocket server for Chrome extension connection
 * - HTTP endpoints for browser control (navigate, click, type, etc.)
 * - Console log and error aggregation
 * - Screenshot capture with local file saving
 * - Page content retrieval
 * 
 * Runs on port 3025 (hardcoded - Chrome extension expects this port)
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = 3025; // Always use 3025 as Chrome extension expects it
const HOST = '127.0.0.1';

// State management
let wsConnection = null;
let currentTabId = null;
let currentUrl = '';
let consoleLogs = [];
let consoleErrors = [];
let networkErrors = [];
const MAX_LOGS = 1000;

// Helper to get downloads folder
function getDownloadsFolder() {
    return path.join(os.homedir(), 'Downloads');
}

// Helper to ensure directory exists
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        connected: wsConnection !== null,
        currentUrl,
        timestamp: new Date().toISOString()
    });
});

// Identity endpoints (for MCP server discovery)
app.get('/.identity', (req, res) => {
    res.json({ name: 'browser-tools-http-bridge' });
});

app.get('/.port', (req, res) => {
    res.json({ port: PORT });
});

// Current URL endpoint
app.get('/current-url', (req, res) => {
    res.json({ url: currentUrl });
});

// Console logs endpoints
app.get('/console-logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    res.json(consoleLogs.slice(-limit));
});

app.get('/console-errors', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    res.json(consoleErrors.slice(-limit));
});

app.get('/network-errors', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    res.json(networkErrors.slice(-limit));
});

// Clear logs endpoints
app.post('/clear-console-logs', (req, res) => {
    consoleLogs = [];
    res.json({ success: true });
});

app.post('/clear-console-errors', (req, res) => {
    consoleErrors = [];
    res.json({ success: true });
});

// Navigate endpoint
app.post('/navigate', async (req, res) => {
    const { url } = req.body;
    
    if (!wsConnection) {
        return res.status(503).json({ error: 'Chrome extension not connected' });
    }
    
    try {
        wsConnection.send(JSON.stringify({
            action: 'navigate',
            url
        }));
        
        // Wait a bit for navigation to start
        await new Promise(resolve => setTimeout(resolve, 500));
        res.json({ success: true, url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Click endpoint
app.post('/click', async (req, res) => {
    const { selector } = req.body;
    
    if (!wsConnection) {
        return res.status(503).json({ error: 'Chrome extension not connected' });
    }
    
    try {
        wsConnection.send(JSON.stringify({
            action: 'click',
            selector
        }));
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Type endpoint
app.post('/type', async (req, res) => {
    const { selector, text } = req.body;
    
    if (!wsConnection) {
        return res.status(503).json({ error: 'Chrome extension not connected' });
    }
    
    try {
        wsConnection.send(JSON.stringify({
            action: 'type',
            selector,
            text
        }));
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Evaluate JavaScript endpoint
app.post('/evaluate', async (req, res) => {
    const { script } = req.body;
    
    if (!wsConnection) {
        return res.status(503).json({ error: 'Chrome extension not connected' });
    }
    
    try {
        // Create a promise to wait for the result
        const resultPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Evaluation timeout'));
            }, 10000);
            
            const messageHandler = (data) => {
                const message = JSON.parse(data);
                if (message.type === 'evaluateResult') {
                    clearTimeout(timeout);
                    wsConnection.off('message', messageHandler);
                    resolve(message.result);
                }
            };
            
            wsConnection.on('message', messageHandler);
        });
        
        wsConnection.send(JSON.stringify({
            action: 'evaluate',
            script
        }));
        
        const result = await resultPromise;
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Screenshot endpoint
app.post('/capture-screenshot', async (req, res) => {
    const { selector, fullPage = false } = req.body;
    
    if (!wsConnection) {
        return res.status(503).json({ error: 'Chrome extension not connected' });
    }
    
    try {
        // Create a promise to wait for the screenshot
        const screenshotPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Screenshot timeout'));
            }, 30000);
            
            const messageHandler = (data) => {
                const message = JSON.parse(data);
                if (message.type === 'screenshot') {
                    clearTimeout(timeout);
                    wsConnection.off('message', messageHandler);
                    resolve(message.data);
                }
            };
            
            wsConnection.on('message', messageHandler);
        });
        
        wsConnection.send(JSON.stringify({
            action: 'screenshot',
            selector,
            fullPage
        }));
        
        const screenshotData = await screenshotPromise;
        
        // Save screenshot to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `screenshot-${timestamp}.png`;
        const screenshotDir = path.join(path.dirname(__dirname), '.screenshots');
        ensureDirectoryExists(screenshotDir);
        const filepath = path.join(screenshotDir, filename);
        
        // Decode base64 and save
        const buffer = Buffer.from(screenshotData.replace(/^data:image\/png;base64,/, ''), 'base64');
        fs.writeFileSync(filepath, buffer);
        
        res.json({ 
            success: true,
            path: filepath,
            filename
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Wait for element endpoint
app.post('/wait', async (req, res) => {
    const { selector, timeout = 30000 } = req.body;
    
    if (!wsConnection) {
        return res.status(503).json({ error: 'Chrome extension not connected' });
    }
    
    try {
        wsConnection.send(JSON.stringify({
            action: 'wait',
            selector,
            timeout
        }));
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get page content endpoint
app.get('/get-content', async (req, res) => {
    if (!wsConnection) {
        return res.status(503).json({ error: 'Chrome extension not connected' });
    }
    
    try {
        // Create a promise to wait for the content
        const contentPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Content fetch timeout'));
            }, 10000);
            
            const messageHandler = (data) => {
                const message = JSON.parse(data);
                if (message.type === 'pageContent') {
                    clearTimeout(timeout);
                    wsConnection.off('message', messageHandler);
                    resolve(message.content);
                }
            };
            
            wsConnection.on('message', messageHandler);
        });
        
        wsConnection.send(JSON.stringify({
            action: 'getContent'
        }));
        
        const content = await contentPromise;
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start HTTP server
const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 HTTP Bridge Server running at http://${HOST}:${PORT}`);
    console.log('📡 Waiting for Chrome extension connection...');
});

// Create WebSocket server
const wss = new WebSocketServer({ 
    server,
    path: '/extension-ws'
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('✅ Chrome extension connected!');
    wsConnection = ws;
    
    // Handle messages from Chrome extension
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            // Update state based on message type
            switch (message.type) {
                case 'url':
                    currentUrl = message.url;
                    console.log(`📍 Current URL: ${currentUrl}`);
                    break;
                    
                case 'tabId':
                    currentTabId = message.tabId;
                    console.log(`📑 Current Tab ID: ${currentTabId}`);
                    break;
                    
                case 'consoleLog':
                    consoleLogs.push({
                        timestamp: new Date().toISOString(),
                        ...message.data
                    });
                    // Rotate logs if too many
                    if (consoleLogs.length > MAX_LOGS) {
                        consoleLogs = consoleLogs.slice(-MAX_LOGS);
                    }
                    break;
                    
                case 'consoleError':
                    consoleErrors.push({
                        timestamp: new Date().toISOString(),
                        ...message.data
                    });
                    if (consoleErrors.length > MAX_LOGS) {
                        consoleErrors = consoleErrors.slice(-MAX_LOGS);
                    }
                    break;
                    
                case 'networkError':
                    networkErrors.push({
                        timestamp: new Date().toISOString(),
                        ...message.data
                    });
                    if (networkErrors.length > MAX_LOGS) {
                        networkErrors = networkErrors.slice(-MAX_LOGS);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('⚠️  Chrome extension disconnected');
        if (wsConnection === ws) {
            wsConnection = null;
            currentTabId = null;
            currentUrl = '';
        }
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
    
    // Send initial ping to confirm connection
    ws.send(JSON.stringify({ action: 'ping' }));
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down HTTP Bridge Server...');
    server.close(() => {
        process.exit(0);
    });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});

console.log('\n📌 Chrome Extension Setup:');
console.log('1. Install extension from: https://browsertools.agentdesk.ai/');
console.log('2. Extension will auto-connect to localhost:3025');
console.log('3. Connection status shown in extension icon\n');