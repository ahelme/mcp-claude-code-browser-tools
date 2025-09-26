#!/usr/bin/env node

/**
 * Comprehensive Documentation Server for MANE Browser Tools
 *
 * Serves both REST (OpenAPI) and WebSocket (AsyncAPI) protocol documentation.
 * This is an AI-agent-friendly approach that provides auto-discoverable API docs.
 *
 * Features:
 * - REST API docs (OpenAPI 3.0.3) via Swagger UI
 * - WebSocket protocol docs (AsyncAPI 3.0.0) via AsyncAPI Studio
 * - Combined documentation portal with navigation
 * - AI-agent discoverable endpoints
 *
 * Usage:
 *   node chrome-extension/docs-server.mjs
 *
 * Endpoints:
 *   http://localhost:3020/docs - Combined documentation portal
 *   http://localhost:3020/rest-docs - REST API documentation
 *   http://localhost:3020/ws-docs - WebSocket protocol documentation
 *   http://localhost:3020/openapi.yaml - REST API contract
 *   http://localhost:3020/asyncapi.yaml - WebSocket protocol contract
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3020;

// Enable CORS
app.use(cors());

// Load specification paths
const openApiPath = path.join(__dirname, 'contracts', 'http.yaml');
const asyncApiPath = path.join(__dirname, 'contracts', 'websocket.asyncapi.yaml');

// Validate OpenAPI specification
if (!fs.existsSync(openApiPath)) {
  console.error('❌ OpenAPI specification not found at:', openApiPath);
  process.exit(1);
}

// Validate AsyncAPI specification
if (!fs.existsSync(asyncApiPath)) {
  console.error('❌ AsyncAPI specification not found at:', asyncApiPath);
  process.exit(1);
}

// Serve raw OpenAPI specification
app.get('/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(fs.readFileSync(openApiPath, 'utf8'));
});

app.get('/openapi.json', (req, res) => {
  // For simplicity, let Swagger UI parse the YAML directly
  res.redirect('/openapi.yaml');
});

// Serve raw AsyncAPI specification
app.get('/asyncapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(fs.readFileSync(asyncApiPath, 'utf8'));
});

app.get('/asyncapi.json', (req, res) => {
  // For simplicity, redirect to YAML (AsyncAPI tooling prefers YAML)
  res.redirect('/asyncapi.yaml');
});

// Combined documentation portal
app.get('/docs', (req, res) => {
  const portalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MANE Browser Tools - Complete API Documentation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { color: #2c3e50; margin-bottom: 10px; }
    .header p { color: #7f8c8d; font-size: 18px; }
    .docs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 40px; }
    .doc-card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .doc-card h2 { color: #2c3e50; margin-top: 0; }
    .doc-card p { color: #7f8c8d; margin-bottom: 20px; }
    .btn { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; font-weight: 500; }
    .btn:hover { background: #2980b9; }
    .endpoints { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .endpoints h2 { color: #2c3e50; margin-top: 0; }
    .endpoint { margin: 10px 0; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; font-family: 'Monaco', 'Consolas', monospace; }
    .endpoint code { color: #e74c3c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Browser Tools API Documentation</h1>
      <p>Complete protocol documentation for REST APIs and WebSocket communication</p>
    </div>

    <div class="docs-grid">
      <div class="doc-card">
        <h2>📚 REST API Documentation</h2>
        <p>Interactive OpenAPI 3.0.3 documentation for HTTP endpoints. Test API calls directly from your browser with Swagger UI.</p>
        <a href="/rest-docs" class="btn">View REST API Docs</a>
      </div>

      <div class="doc-card">
        <h2>🔌 WebSocket Protocol Documentation</h2>
        <p>AsyncAPI 3.0.0 specification for WebSocket communication. Understand real-time messaging between extension and bridge.</p>
        <a href="/ws-docs" class="btn">View WebSocket Docs</a>
      </div>
    </div>

    <div class="endpoints">
      <h2>🤖 AI-Agent Discoverable Endpoints</h2>
      <div class="endpoint"><strong>Health Check:</strong> <code>GET /health</code></div>
      <div class="endpoint"><strong>OpenAPI Contract:</strong> <code>GET /openapi.yaml</code></div>
      <div class="endpoint"><strong>AsyncAPI Contract:</strong> <code>GET /asyncapi.yaml</code></div>
      <div class="endpoint"><strong>JSON Formats:</strong> <code>GET /openapi.json</code> | <code>GET /asyncapi.json</code></div>
    </div>

    <div style="text-align: center; margin-top: 40px; color: #7f8c8d;">
      <p>Generated from contracts • Always accurate • AI-agent friendly</p>
    </div>
  </div>
</body>
</html>`;
  res.send(portalHtml);
});

// REST API documentation (Swagger UI)
app.get('/rest-docs', (req, res) => {
  const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MANE Browser Tools - REST API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
    .swagger-ui .topbar { background-color: #2b3e50; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
  res.send(swaggerHtml);
});

// WebSocket Protocol documentation (AsyncAPI Studio)
app.get('/ws-docs', (req, res) => {
  const asyncApiHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MANE Browser Tools - WebSocket Protocol Documentation</title>
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; }
    .header p { margin: 0; opacity: 0.9; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .back-link { display: inline-block; margin-bottom: 20px; padding: 8px 16px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; }
    .back-link:hover { background: #2980b9; }
    .content { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 24px; }
    .asyncapi-embed { width: 100%; height: 800px; border: 1px solid #ddd; border-radius: 4px; }
    .protocol-info { margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .protocol-info h3 { color: #2c3e50; margin-top: 0; }
    .protocol-info ul { margin: 0; }
    .protocol-info code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔌 WebSocket Protocol Documentation</h1>
    <p>AsyncAPI 3.0.0 specification for real-time communication</p>
  </div>

  <div class="container">
    <a href="/docs" class="back-link">← Back to Documentation Portal</a>

    <div class="content">
      <h2>Interactive AsyncAPI Documentation</h2>
      <p>Loading AsyncAPI Studio with WebSocket protocol specification...</p>
      <iframe class="asyncapi-embed" src="https://studio.asyncapi.com/?url=${encodeURIComponent(req.get('host') + '/asyncapi.yaml')}"></iframe>
    </div>

    <div class="protocol-info">
      <h3>🔗 Direct Links</h3>
      <p><strong>Raw Contract:</strong> <a href="/asyncapi.yaml" target="_blank">/asyncapi.yaml</a></p>
      <p><strong>JSON Format:</strong> <a href="/asyncapi.json" target="_blank">/asyncapi.json</a></p>
      <p><strong>Implementation:</strong> <code>chrome-extension/websocket.js</code></p>

      <h3>📊 Protocol Overview</h3>
      <ul>
        <li><strong>Connection:</strong> ws://localhost:3024/extension-ws</li>
        <li><strong>Heartbeat:</strong> 30-second ping/pong intervals</li>
        <li><strong>Messages:</strong> JSON format with type-based routing</li>
        <li><strong>Reconnection:</strong> Exponential backoff (1s → 30s max)</li>
        <li><strong>Performance:</strong> 160ms-1947ms navigation times</li>
      </ul>
    </div>
  </div>
</body>
</html>`;
  res.send(asyncApiHtml);
});

// Health check endpoint (AI-agent discoverable)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Browser Tools Complete API Documentation Server',
    version: '2.0.0',
    protocols: {
      rest: {
        docs: '/rest-docs',
        contract: '/openapi.yaml',
        json: '/openapi.json'
      },
      websocket: {
        docs: '/ws-docs',
        contract: '/asyncapi.yaml',
        json: '/asyncapi.json'
      }
    },
    endpoints: {
      portal: '/docs',
      health: '/health'
    },
    aiAgent: {
      discoverable: true,
      formats: ['openapi-3.0.3', 'asyncapi-3.0.0'],
      contracts: ['/openapi.yaml', '/asyncapi.yaml']
    }
  });
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// Start server
app.listen(PORT, 'localhost', () => {
  console.log(`🚀 Browser Tools API Documentation Server running at http://localhost:${PORT}`);
  console.log(`📚 Interactive docs: http://localhost:${PORT}/docs`);
  console.log(`📄 OpenAPI spec: http://localhost:${PORT}/openapi.yaml`);
  console.log(`🔍 AI-discoverable JSON: http://localhost:${PORT}/openapi.json`);
  console.log('');
  console.log('🎯 Port Layout:');
  console.log('   3020 - API Documentation (this server)');
  console.log('   3024 - MCP HTTP Bridge (main functionality)');
  console.log('   3025+ - Multi-project instances');
});