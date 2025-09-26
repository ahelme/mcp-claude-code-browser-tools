#!/usr/bin/env node

/**
 * Standalone Documentation Server for MANE Browser Tools API
 *
 * Serves OpenAPI specification with Swagger UI for interactive API documentation.
 * This is an AI-agent-friendly approach that provides auto-discoverable API docs.
 *
 * Usage:
 *   node chrome-extension/docs-server.mjs
 *
 * Then visit: http://localhost:3025/docs
 * Or get raw spec: http://localhost:3025/openapi.yaml
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

// Load OpenAPI specification path
const openApiPath = path.join(__dirname, 'contracts', 'http.yaml');
if (!fs.existsSync(openApiPath)) {
  console.error('❌ OpenAPI specification not found at:', openApiPath);
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

// Serve Swagger UI HTML
app.get('/docs', (req, res) => {
  const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MANE Browser Tools API Documentation</title>
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MANE API Documentation Server',
    version: '1.0.0',
    endpoints: {
      docs: '/docs',
      openapi_yaml: '/openapi.yaml',
      openapi_json: '/openapi.json'
    }
  });
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// Start server
app.listen(PORT, 'localhost', () => {
  console.log(`🚀 MANE API Documentation Server running at http://localhost:${PORT}`);
  console.log(`📚 Interactive docs: http://localhost:${PORT}/docs`);
  console.log(`📄 OpenAPI spec: http://localhost:${PORT}/openapi.yaml`);
  console.log(`🔍 AI-discoverable JSON: http://localhost:${PORT}/openapi.json`);
  console.log('');
  console.log('🎯 Port Layout:');
  console.log('   3020 - API Documentation (this server)');
  console.log('   3024 - MCP HTTP Bridge (main functionality)');
  console.log('   3025+ - Multi-project instances');
});