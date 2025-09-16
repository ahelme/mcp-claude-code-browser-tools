#!/usr/bin/env node
/**
 * CLI wrapper for browser automation without MCP
 * Usage: node browser-cli.js <command> [args...]
 */

import http from 'http';

const API_BASE = 'http://localhost:3024';

function makeRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, API_BASE);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve(result);
                } catch (e) {
                    resolve({ error: 'Invalid JSON response', body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function main() {
    const [,, command, ...args] = process.argv;

    try {
        let result;

        switch (command) {
            case 'navigate':
                if (!args[0]) throw new Error('Usage: navigate <url>');
                result = await makeRequest('/navigate', 'POST', { url: args[0] });
                break;

            case 'screenshot':
                const screenshotData = {};
                if (args[0]) screenshotData.selector = args[0];
                if (args[1]) screenshotData.fullPage = args[1] === 'true';
                result = await makeRequest('/capture-screenshot', 'POST', screenshotData);
                break;

            case 'click':
                if (!args[0]) throw new Error('Usage: click <selector>');
                result = await makeRequest('/click', 'POST', { selector: args[0] });
                break;

            case 'type':
                if (!args[0] || !args[1]) throw new Error('Usage: type <selector> <text>');
                result = await makeRequest('/type', 'POST', {
                    selector: args[0],
                    text: args[1],
                    clear: args[2] === 'true'
                });
                break;

            case 'health':
                result = await makeRequest('/health');
                break;

            default:
                console.log('Available commands:');
                console.log('  navigate <url>');
                console.log('  screenshot [selector] [fullPage]');
                console.log('  click <selector>');
                console.log('  type <selector> <text> [clear]');
                console.log('  health');
                return;
        }

        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();