#!/usr/bin/env node

/**
 * Strict wrapper for browser-tools-mcp that ensures ONLY JSON goes to stdout
 * All other output is suppressed or redirected to stderr
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Spawn the actual browser-tools-mcp process
const child = spawn('npx', ['-y', '@agentdeskai/browser-tools-mcp@1.2.1'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
        ...process.env,
        BROWSER_TOOLS_PORT: process.env.BROWSER_TOOLS_PORT || '3025'
    }
});

// Handle stdout - only pass through valid JSON-RPC messages
const stdoutReader = readline.createInterface({
    input: child.stdout,
    crlfDelay: Infinity
});

stdoutReader.on('line', (line) => {
    const trimmed = line.trim();
    
    // Only output if it looks like JSON (starts with { or [)
    if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
        try {
            // Verify it's valid JSON
            JSON.parse(trimmed);
            // Output the original line to stdout
            process.stdout.write(line + '\n');
        } catch (e) {
            // Not valid JSON, suppress it
            // Optionally log to stderr for debugging
            // process.stderr.write(`[WRAPPER] Suppressed non-JSON: ${line}\n`);
        }
    }
    // All non-JSON lines are silently suppressed
});

// Handle stderr - suppress all output
child.stderr.on('data', (data) => {
    // Suppress all stderr output to prevent any interference
    // Optionally log for debugging:
    // process.stderr.write(`[WRAPPER-STDERR] ${data}`);
});

// Handle child process exit
child.on('exit', (code, signal) => {
    process.exit(code || 0);
});

// Handle errors
child.on('error', (err) => {
    process.stderr.write(`[WRAPPER-ERROR] Failed to start browser-tools-mcp: ${err.message}\n`);
    process.exit(1);
});

// Pass through signals to child
process.on('SIGTERM', () => child.kill('SIGTERM'));
process.on('SIGINT', () => child.kill('SIGINT'));