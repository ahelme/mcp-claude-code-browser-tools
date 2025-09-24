# 🦁 MANE Interface Contracts Documentation

**Complete guide for agents implementing MANE foundation interfaces**

This document provides comprehensive documentation for all agents working with the MANE foundation. It includes examples, best practices, and integration patterns that enable autonomous AI agent development.

---

## 📋 Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Browser Tool Interface](#browser-tool-interface)
3. [UI Panel Interface](#ui-panel-interface)
4. [Registry Integration](#registry-integration)
5. [Service Worker Integration](#service-worker-integration)
6. [Quality Framework](#quality-framework)
7. [Best Practices](#best-practices)
8. [Examples](#examples)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start Guide

### For Tool Developers (Agents C-I)

1. **Import the base class**:
```typescript
import { BaseBrowserTool } from '../core/base-classes.js';
import { ILogger, IMetrics } from '../core/interfaces.js';
```

2. **Extend the base class**:
```typescript
export class MyBrowserTool extends BaseBrowserTool {
  readonly name = 'browser_my_tool';
  readonly endpoint = '/tools/browser_my_tool';
  readonly description = 'My custom browser tool';
  readonly schema = {
    type: 'object',
    properties: {
      param1: { type: 'string' },
      param2: { type: 'number' }
    },
    required: ['param1'],
    additionalProperties: false
  };

  protected async executeImpl(params: any): Promise<IToolResult> {
    // Your tool logic here
    return this.createSuccess({ result: 'Tool executed successfully' });
  }
}
```

3. **Register with the registry**:
```typescript
import { getRegistry } from '../core/registry.js';

const registry = getRegistry();
await registry.registerTool(new MyBrowserTool(logger, metrics));
```

### For UI Developers (Specialized Panels)

1. **Import the base class**:
```typescript
import { BaseUIPanel } from '../core/base-classes.js';
import { IPanelEventHandler } from '../core/interfaces.js';
```

2. **Extend the base class**:
```typescript
export class MyUIPanel extends BaseUIPanel {
  readonly id = 'my-panel';
  readonly selector = '#my-panel';
  readonly title = 'My Custom Panel';

  protected async renderCore(): Promise<HTMLElement> {
    const panel = this.createElement('div', ['panel']);
    panel.innerHTML = '<h2>My Panel Content</h2>';
    return panel;
  }

  getEventHandlers(): IPanelEventHandler[] {
    return [
      {
        event: 'click',
        selector: '.my-button',
        handler: (event) => this.handleButtonClick(event)
      }
    ];
  }

  // Implement other required methods...
}
```

---

## 🛠️ Browser Tool Interface

### Core Interface Definition

```typescript
interface IBrowserTool {
  readonly name: string;           // Unique identifier
  readonly endpoint: string;       // HTTP endpoint path
  readonly description: string;    // Human-readable description
  readonly schema: JSONSchema;     // Parameter validation schema
  readonly capabilities: IToolCapabilities;

  execute(params: unknown): Promise<IToolResult>;
  validate(params: unknown): IValidationResult;
  getStatus(): Promise<IToolStatus>;
}
```

### Implementation Pattern

```typescript
export class ExampleBrowserTool extends BaseBrowserTool {
  constructor(logger: ILogger, metrics: IMetrics) {
    super(
      logger,
      'browser_example',                    // Tool name
      '/tools/browser_example',             // HTTP endpoint
      'Example browser automation tool',     // Description
      {                                     // JSON Schema
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          timeout: { type: 'number', minimum: 0, maximum: 60000 }
        },
        required: ['url'],
        additionalProperties: false
      },
      {                                     // Capabilities
        async: true,
        timeout: 30000,
        retryable: true,
        batchable: false,
        requiresAuth: false
      }
    );
  }

  protected async executeImpl(params: any): Promise<IToolResult> {
    const { url, timeout = 30000 } = params;

    try {
      // Perform browser automation task
      const result = await this.performBrowserAction(url, timeout);

      return this.createSuccess({
        url: result.url,
        status: result.status,
        timing: result.timing
      });
    } catch (error) {
      return this.createErrorResult(
        `Browser action failed: ${error.message}`,
        { url, originalError: error.message }
      );
    }
  }

  protected async healthCheck(): Promise<boolean> {
    try {
      // Perform health check specific to your tool
      return await this.checkBrowserConnection();
    } catch (error) {
      this.logger.warn(`Health check failed: ${error.message}`);
      return false;
    }
  }

  private async performBrowserAction(url: string, timeout: number) {
    // Your specific browser automation logic
    return { url, status: 'success', timing: Date.now() };
  }

  private async checkBrowserConnection(): Promise<boolean> {
    // Your specific health check logic
    return true;
  }
}
```

### Schema Best Practices

```typescript
// ✅ Good Schema Example
const goodSchema = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      format: 'uri',
      description: 'Target URL to navigate to'
    },
    timeout: {
      type: 'number',
      minimum: 1000,
      maximum: 60000,
      default: 30000,
      description: 'Timeout in milliseconds'
    },
    retries: {
      type: 'integer',
      minimum: 0,
      maximum: 5,
      default: 1,
      description: 'Number of retry attempts'
    }
  },
  required: ['url'],
  additionalProperties: false  // ⚠️ Important for security
};

// ❌ Bad Schema Example
const badSchema = {
  type: 'object',
  // Missing properties definition
  // Missing additionalProperties: false
  // Missing required array
};
```

### Error Handling Patterns

```typescript
protected async executeImpl(params: any): Promise<IToolResult> {
  try {
    // Validate business logic
    if (!this.isValidBusinessCondition(params)) {
      return this.createErrorResult(
        'Invalid business condition',
        { condition: 'business_validation_failed' }
      );
    }

    // Attempt operation with timeout
    const result = await Promise.race([
      this.performOperation(params),
      this.createTimeoutPromise(this.capabilities.timeout)
    ]);

    return this.createSuccess(result);

  } catch (error) {
    // Log error with context
    this.logWithContext(LogLevel.ERROR, 'Operation failed', {
      params,
      error: error.message,
      stack: error.stack
    });

    // Return user-friendly error
    if (error.name === 'TimeoutError') {
      return this.createErrorResult(
        'Operation timed out',
        { timeout: this.capabilities.timeout }
      );
    }

    return this.createErrorResult(
      `Operation failed: ${error.message}`,
      { originalError: error.message }
    );
  }
}
```

---

## 🎨 UI Panel Interface

### Core Interface Definition

```typescript
interface IUIPanel {
  readonly id: string;              // Unique panel identifier
  readonly selector: string;        // CSS selector for container
  readonly title: string;           // Human-readable title

  initialize(): Promise<void>;
  render(): Promise<HTMLElement>;
  handleEvents(): void;
  updateState(state: any): Promise<void>;
  destroy(): Promise<void>;
}
```

### Implementation Pattern

```typescript
export class ExampleUIPanel extends BaseUIPanel {
  constructor(logger: ILogger, metrics?: IMetrics) {
    super(
      logger,
      'example-panel',                // Panel ID
      '#example-panel-container',     // CSS selector
      'Example Panel',                // Title
      {
        description: 'Example panel for demonstration',
        version: '1.0.0',
        order: 100                    // Display order
      }
    );
  }

  protected async initializeImpl(): Promise<void> {
    // Custom initialization logic
    this.logWithContext(LogLevel.INFO, 'Example panel initializing');

    // Initialize any required services or data
    await this.loadInitialData();
  }

  protected async renderCore(): Promise<HTMLElement> {
    const panel = this.createElement('div', ['example-panel']);

    // Create header
    const header = this.createElement('h2', ['panel-header'], {}, this.title);
    panel.appendChild(header);

    // Create content area
    const content = this.createElement('div', ['panel-content']);
    content.appendChild(this.renderContent());
    panel.appendChild(content);

    // Create controls
    const controls = this.createElement('div', ['panel-controls']);
    controls.appendChild(this.renderControls());
    panel.appendChild(controls);

    return panel;
  }

  protected getEventHandlers(): IPanelEventHandler[] {
    return [
      {
        event: 'click',
        selector: '.refresh-button',
        handler: this.handleRefresh.bind(this)
      },
      {
        event: 'change',
        selector: '.config-input',
        handler: this.handleConfigChange.bind(this)
      },
      {
        event: 'submit',
        selector: '.config-form',
        handler: this.handleFormSubmit.bind(this)
      }
    ];
  }

  protected async onStateChange(newState: any, oldState: any): Promise<void> {
    this.logWithContext(LogLevel.DEBUG, 'Panel state changed', {
      newState,
      oldState
    });

    // Update specific UI elements based on state changes
    if (newState.status !== oldState.status) {
      await this.updateStatusIndicator(newState.status);
    }

    if (newState.data !== oldState.data) {
      await this.updateDataDisplay(newState.data);
    }
  }

  protected async cleanupImpl(): Promise<void> {
    // Clean up any resources, timers, or event listeners
    this.clearUpdateTimer();
    this.disconnectWebSocket();
  }

  // Private helper methods
  private renderContent(): HTMLElement {
    const content = this.createElement('div', ['content']);

    // Status indicator
    const status = this.createElement('div', ['status-indicator']);
    status.textContent = `Status: ${this.state.status || 'Unknown'}`;
    content.appendChild(status);

    // Data display
    const dataDisplay = this.createElement('pre', ['data-display']);
    dataDisplay.textContent = JSON.stringify(this.state.data || {}, null, 2);
    content.appendChild(dataDisplay);

    return content;
  }

  private renderControls(): HTMLElement {
    const controls = this.createElement('div', ['controls']);

    // Refresh button
    const refreshBtn = this.createElement('button', ['btn', 'refresh-button'], {
      type: 'button'
    }, 'Refresh');
    controls.appendChild(refreshBtn);

    // Configuration input
    const configInput = this.createInput(
      'text',
      'config-input',
      'Configuration',
      this.state.config || '',
      'Enter configuration...'
    );
    controls.appendChild(configInput);

    return controls;
  }

  // Event handlers
  private async handleRefresh(event: Event): Promise<void> {
    event.preventDefault();
    this.logWithContext(LogLevel.INFO, 'Refresh requested');

    try {
      const freshData = await this.loadFreshData();
      await this.updateState({ data: freshData, lastRefresh: Date.now() });
    } catch (error) {
      this.logWithContext(LogLevel.ERROR, 'Refresh failed', { error: error.message });
      // Show error to user
      this.showErrorMessage(`Refresh failed: ${error.message}`);
    }
  }

  private async handleConfigChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const newConfig = input.value;

    this.logWithContext(LogLevel.DEBUG, 'Configuration changed', { newConfig });

    // Debounce configuration changes
    clearTimeout(this.configTimer);
    this.configTimer = setTimeout(async () => {
      await this.updateState({ config: newConfig });
    }, 500);
  }

  private async handleFormSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    // Process form data
    const config = Object.fromEntries(formData.entries());
    await this.updateState({ config });
  }

  // Helper methods
  private async loadInitialData(): Promise<void> {
    // Load initial data for the panel
  }

  private async loadFreshData(): Promise<any> {
    // Load fresh data from API or service
    return { timestamp: Date.now(), value: Math.random() };
  }

  private async updateStatusIndicator(status: string): Promise<void> {
    const indicator = this.findElement('.status-indicator');
    if (indicator) {
      indicator.textContent = `Status: ${status}`;
      indicator.className = `status-indicator status-${status.toLowerCase()}`;
    }
  }

  private async updateDataDisplay(data: any): Promise<void> {
    const display = this.findElement('.data-display');
    if (display) {
      display.textContent = JSON.stringify(data, null, 2);
    }
  }

  private showErrorMessage(message: string): void {
    // Create and show error message to user
    const errorEl = this.createElement('div', ['error-message'], {}, message);
    const container = this.findElement('.panel-content');
    if (container) {
      container.appendChild(errorEl);
      setTimeout(() => errorEl.remove(), 5000); // Remove after 5 seconds
    }
  }
}
```

### Event Handling Best Practices

```typescript
// ✅ Good Event Handler Pattern
getEventHandlers(): IPanelEventHandler[] {
  return [
    {
      event: 'click',
      selector: '.specific-button-class',  // Specific selector
      handler: async (event: Event) => {
        event.preventDefault();            // Prevent default if needed
        event.stopPropagation();          // Stop propagation if needed

        try {
          await this.handleSpecificAction(event);
        } catch (error) {
          this.logWithContext(LogLevel.ERROR, 'Handler failed', { error });
        }
      }
    }
  ];
}

// ❌ Bad Event Handler Pattern
getEventHandlers(): IPanelEventHandler[] {
  return [
    {
      event: 'click',
      selector: 'button',                  // Too broad
      handler: (event: Event) => {
        // No error handling
        this.handleAction();               // Synchronous, no error handling
      }
    }
  ];
}
```

---

## 📡 Registry Integration

### Auto-Registration Pattern

```typescript
// Tool auto-registration
import { getRegistry } from '../core/registry.js';
import { MyBrowserTool } from './my-browser-tool.js';

export async function initializeMyTool(logger: ILogger, metrics: IMetrics): Promise<void> {
  const registry = getRegistry();
  const tool = new MyBrowserTool(logger, metrics);

  try {
    await registry.registerTool(tool);
    logger.info(`Tool registered: ${tool.name}`);
  } catch (error) {
    logger.error(`Failed to register tool: ${tool.name}`, error);
    throw error;
  }
}

// Panel auto-registration
export async function initializeMyPanel(logger: ILogger): Promise<void> {
  const registry = getRegistry();
  const panel = new MyUIPanel(logger);

  try {
    await registry.registerPanel(panel);
    logger.info(`Panel registered: ${panel.id}`);
  } catch (error) {
    logger.error(`Failed to register panel: ${panel.id}`, error);
    throw error;
  }
}
```

### Tool Discovery Patterns

```typescript
// Discover all browser tools
const allTools = registry.discoverTools();

// Discover tools by category
const browserTools = registry.discoverTools({
  category: 'browser'
});

// Discover healthy tools only
const healthyTools = registry.discoverTools({
  healthy: true
});

// Discover tools with specific capabilities
const retryableTools = registry.discoverTools({
  capability: 'retryable'
});
```

### Request Routing

```typescript
// Route request through registry
async function executeToolViaRegistry(toolEndpoint: string, params: any): Promise<IToolResult> {
  const registry = getRegistry();

  try {
    return await registry.routeRequest(toolEndpoint, params);
  } catch (error) {
    console.error(`Routing failed for ${toolEndpoint}:`, error);
    throw error;
  }
}

// Example usage
const result = await executeToolViaRegistry('/tools/browser_navigate', {
  url: 'https://example.com'
});
```

---

## ⚙️ Service Worker Integration

### HTTP Endpoint Registration

```typescript
import { MANEServiceWorker } from '../core/service-worker.js';

// Register custom endpoints
async function setupCustomEndpoints(serviceWorker: MANEServiceWorker): Promise<void> {
  // Tool-specific endpoint
  await serviceWorker.registerEndpoint('/api/my-tool', async (req, res) => {
    try {
      const result = await processMyToolRequest(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Health check endpoint for specific tool
  await serviceWorker.registerEndpoint('/api/my-tool/health', async (req, res) => {
    const health = await checkMyToolHealth();
    res.json(health);
  });
}
```

### WebSocket Communication

```typescript
// Send command to Chrome extension
async function sendExtensionCommand(serviceWorker: MANEServiceWorker, command: any): Promise<any> {
  try {
    return await serviceWorker.sendToExtension(command);
  } catch (error) {
    console.error('Extension command failed:', error);
    throw error;
  }
}

// Example: Request screenshot
const screenshotResult = await sendExtensionCommand(serviceWorker, {
  type: 'take-screenshot',
  fullPage: true,
  requestId: Date.now().toString()
});
```

---

## 🧪 Quality Framework

### Quality Gate Integration

```typescript
import { createQualityFramework } from '../core/quality-framework.js';

// Run quality gates on your implementation
async function validateMyTool(tool: IBrowserTool): Promise<boolean> {
  const { runAllGates } = createQualityFramework(logger, metrics, registry);

  const passed = await runAllGates(tool);

  if (!passed) {
    console.error(`Quality gates failed for tool: ${tool.name}`);
    return false;
  }

  console.log(`Quality gates passed for tool: ${tool.name}`);
  return true;
}

// Validate before registration
async function safeRegisterTool(tool: IBrowserTool): Promise<void> {
  const isValid = await validateMyTool(tool);

  if (!isValid) {
    throw new Error(`Tool failed quality gates: ${tool.name}`);
  }

  const registry = getRegistry();
  await registry.registerTool(tool);
}
```

### Custom Quality Gates

```typescript
import { IQualityGate } from '../core/interfaces.js';

export class CustomQualityGate implements IQualityGate {
  readonly name = 'Custom Business Logic';
  readonly description = 'Validates custom business requirements';

  constructor(private logger: ILogger) {}

  async validate(target: any): Promise<{
    passed: boolean;
    score: number;
    details: Array<{ check: string; passed: boolean; message: string }>;
  }> {
    const checks = [];

    // Your custom validation logic
    checks.push({
      check: 'Business Rule 1',
      passed: this.validateBusinessRule1(target),
      message: 'Custom business rule validation'
    });

    const passedChecks = checks.filter(c => c.passed).length;
    const score = (passedChecks / checks.length) * 100;
    const passed = score >= 90;

    return { passed, score, details: checks };
  }

  private validateBusinessRule1(target: any): boolean {
    // Your validation logic
    return true;
  }
}
```

---

## ✨ Best Practices

### Code Organization

```
your-agent/
├── src/
│   ├── tools/                    # Browser tool implementations
│   │   ├── my-tool.ts
│   │   └── index.ts
│   ├── panels/                   # UI panel implementations
│   │   ├── my-panel.ts
│   │   └── index.ts
│   ├── services/                 # Helper services
│   │   └── api-client.ts
│   ├── types/                    # Custom type definitions
│   │   └── index.ts
│   └── index.ts                  # Main export
├── tests/                        # Test files
│   ├── unit/
│   ├── integration/
│   └── quality-gates/
├── docs/                         # Documentation
├── package.json
└── tsconfig.json
```

### Naming Conventions

```typescript
// Tool naming: browser_[action]_[target]
'browser_navigate'
'browser_screenshot'
'browser_click_element'
'browser_evaluate_script'

// Panel naming: [purpose]-[type]
'configuration-panel'
'status-dashboard'
'console-viewer'
'screenshot-manager'

// Endpoint naming: /tools/[tool-name]
'/tools/browser_navigate'
'/tools/browser_screenshot'

// CSS selectors: #[panel-id] or .[component-class]
'#configuration-panel'
'.status-indicator'
```

### Error Handling Strategy

```typescript
// 1. Use structured error types
enum MyToolErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR'
}

// 2. Create informative error messages
protected createToolError(type: MyToolErrorType, message: string, details?: any): Error {
  const error = new Error(message) as any;
  error.type = type;
  error.details = details;
  error.timestamp = Date.now();
  error.recoverable = type !== MyToolErrorType.VALIDATION_ERROR;
  return error;
}

// 3. Handle errors appropriately
try {
  const result = await this.performOperation(params);
  return this.createSuccess(result);
} catch (error) {
  if (error.type === MyToolErrorType.TIMEOUT_ERROR) {
    // Retry logic for timeout errors
    return await this.retryOperation(params);
  } else if (error.type === MyToolErrorType.VALIDATION_ERROR) {
    // Don't retry validation errors
    return this.createErrorResult(error.message, error.details);
  } else {
    // Log and return generic error
    this.logWithContext(LogLevel.ERROR, 'Operation failed', { error });
    return this.createErrorResult('Operation failed', { originalError: error.message });
  }
}
```

### Performance Optimization

```typescript
// 1. Use debouncing for frequent operations
private debounceTimer?: NodeJS.Timeout;

private debouncedOperation(params: any): void {
  clearTimeout(this.debounceTimer);
  this.debounceTimer = setTimeout(() => {
    this.performOperation(params);
  }, 500);
}

// 2. Implement caching for expensive operations
private cache = new Map<string, { data: any; timestamp: number }>();
private CACHE_TTL = 60000; // 1 minute

private async getCachedData(key: string, fetcher: () => Promise<any>): Promise<any> {
  const cached = this.cache.get(key);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
    return cached.data;
  }

  const data = await fetcher();
  this.cache.set(key, { data, timestamp: now });
  return data;
}

// 3. Use connection pooling for HTTP requests
private httpClient = new HttpClient({
  maxConnections: 10,
  keepAlive: true,
  timeout: 30000
});
```

### Security Guidelines

```typescript
// 1. Always validate and sanitize input
protected validateAndSanitizeInput(input: any): any {
  // Remove potentially dangerous characters
  const sanitized = { ...input };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      // Remove script tags, javascript: URLs, etc.
      sanitized[key] = this.sanitizeString(value);
    }
  }

  return sanitized;
}

private sanitizeString(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .trim();
}

// 2. Use parameterized queries for database operations
protected async queryDatabase(sql: string, params: any[]): Promise<any> {
  // Always use parameterized queries
  return this.db.query(sql, params);
}

// 3. Validate file paths and prevent directory traversal
protected validateFilePath(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  const allowed = path.resolve('./allowed-directory/');
  const resolved = path.resolve(normalized);

  return resolved.startsWith(allowed);
}
```

---

## 📁 Complete Examples

### Example Browser Tool: Page Analyzer

```typescript
import { BaseBrowserTool } from '../core/base-classes.js';
import { IToolResult, ILogger, IMetrics } from '../core/interfaces.js';

export class PageAnalyzerTool extends BaseBrowserTool {
  readonly name = 'browser_analyze_page';
  readonly endpoint = '/tools/browser_analyze_page';
  readonly description = 'Analyze page structure, performance, and accessibility';
  readonly schema = {
    type: 'object',
    properties: {
      url: { type: 'string', format: 'uri' },
      includePerformance: { type: 'boolean', default: true },
      includeAccessibility: { type: 'boolean', default: true },
      includeStructure: { type: 'boolean', default: true }
    },
    required: ['url'],
    additionalProperties: false
  };

  get capabilities() {
    return {
      async: true,
      timeout: 60000, // Longer timeout for analysis
      retryable: true,
      batchable: false,
      requiresAuth: false
    };
  }

  protected async executeImpl(params: any): Promise<IToolResult> {
    const { url, includePerformance, includeAccessibility, includeStructure } = params;

    try {
      this.logWithContext('info', 'Starting page analysis', { url });

      const analysis: any = { url, timestamp: Date.now() };

      if (includeStructure) {
        analysis.structure = await this.analyzePageStructure(url);
      }

      if (includePerformance) {
        analysis.performance = await this.analyzePagePerformance(url);
      }

      if (includeAccessibility) {
        analysis.accessibility = await this.analyzeAccessibility(url);
      }

      return this.createSuccess(analysis, {
        analysisTime: Date.now() - analysis.timestamp,
        componentsAnalyzed: Object.keys(analysis).length - 2 // Exclude url and timestamp
      });

    } catch (error) {
      return this.createErrorResult(
        `Page analysis failed: ${error.message}`,
        { url, error: error.message }
      );
    }
  }

  protected async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple page
      const testUrl = 'https://httpbin.org/status/200';
      await this.analyzePageStructure(testUrl);
      return true;
    } catch (error) {
      this.logger.warn('Page analyzer health check failed', { error: error.message });
      return false;
    }
  }

  private async analyzePageStructure(url: string): Promise<any> {
    // Implementation would integrate with Chrome extension
    return {
      title: 'Example Page',
      headings: ['h1: 2', 'h2: 5', 'h3: 8'],
      links: { internal: 12, external: 3 },
      images: { total: 15, withAlt: 12, missingAlt: 3 },
      forms: { total: 2, inputs: 8 }
    };
  }

  private async analyzePagePerformance(url: string): Promise<any> {
    // Implementation would use Lighthouse or similar
    return {
      loadTime: 2.3,
      firstContentfulPaint: 1.2,
      largestContentfulPaint: 2.1,
      cumulativeLayoutShift: 0.05,
      performanceScore: 0.92
    };
  }

  private async analyzeAccessibility(url: string): Promise<any> {
    // Implementation would run accessibility checks
    return {
      violations: 2,
      warnings: 5,
      score: 0.85,
      issues: [
        { type: 'missing-alt', count: 3, severity: 'warning' },
        { type: 'color-contrast', count: 2, severity: 'violation' }
      ]
    };
  }
}
```

### Example UI Panel: Analysis Dashboard

```typescript
import { BaseUIPanel } from '../core/base-classes.js';
import { IPanelEventHandler, ILogger } from '../core/interfaces.js';

export class AnalysisDashboardPanel extends BaseUIPanel {
  readonly id = 'analysis-dashboard';
  readonly selector = '#analysis-dashboard';
  readonly title = 'Page Analysis Dashboard';

  private refreshTimer?: NodeJS.Timeout;
  private wsConnection?: WebSocket;

  constructor(logger: ILogger) {
    super(logger, 'analysis-dashboard', '#analysis-dashboard', 'Analysis Dashboard', {
      description: 'Real-time page analysis results and controls',
      version: '1.0.0',
      order: 50
    });
  }

  protected async initializeImpl(): Promise<void> {
    // Initialize WebSocket connection for real-time updates
    await this.connectWebSocket();

    // Load initial analysis data
    await this.loadAnalysisData();

    // Start refresh timer
    this.startRefreshTimer();
  }

  protected async renderCore(): Promise<HTMLElement> {
    const dashboard = this.createElement('div', ['analysis-dashboard']);

    // Header
    const header = this.renderHeader();
    dashboard.appendChild(header);

    // Controls
    const controls = this.renderControls();
    dashboard.appendChild(controls);

    // Analysis results
    const results = this.renderResults();
    dashboard.appendChild(results);

    // Status bar
    const status = this.renderStatusBar();
    dashboard.appendChild(status);

    return dashboard;
  }

  protected getEventHandlers(): IPanelEventHandler[] {
    return [
      {
        event: 'click',
        selector: '.analyze-button',
        handler: this.handleAnalyzeClick.bind(this)
      },
      {
        event: 'click',
        selector: '.refresh-button',
        handler: this.handleRefreshClick.bind(this)
      },
      {
        event: 'change',
        selector: '.url-input',
        handler: this.handleUrlChange.bind(this)
      },
      {
        event: 'change',
        selector: '.analysis-options input',
        handler: this.handleOptionsChange.bind(this)
      }
    ];
  }

  protected async onStateChange(newState: any, oldState: any): Promise<void> {
    // Update analysis results display
    if (newState.analysisResults !== oldState.analysisResults) {
      await this.updateResultsDisplay(newState.analysisResults);
    }

    // Update status indicator
    if (newState.status !== oldState.status) {
      this.updateStatusIndicator(newState.status);
    }

    // Update button states
    if (newState.analyzing !== oldState.analyzing) {
      this.updateButtonStates(newState.analyzing);
    }
  }

  protected async cleanupImpl(): Promise<void> {
    // Clear timers
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    // Close WebSocket connection
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = undefined;
    }
  }

  // Render methods
  private renderHeader(): HTMLElement {
    const header = this.createElement('div', ['dashboard-header']);

    const title = this.createElement('h2', [], {}, this.title);
    const timestamp = this.createElement('div', ['timestamp']);
    timestamp.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;

    header.appendChild(title);
    header.appendChild(timestamp);

    return header;
  }

  private renderControls(): HTMLElement {
    const controls = this.createElement('div', ['dashboard-controls']);

    // URL input
    const urlGroup = this.createElement('div', ['input-group']);
    const urlLabel = this.createElement('label', [], { for: 'url-input' }, 'URL:');
    const urlInput = this.createElement('input', ['url-input'], {
      type: 'url',
      id: 'url-input',
      placeholder: 'https://example.com',
      value: this.state.url || ''
    });
    urlGroup.appendChild(urlLabel);
    urlGroup.appendChild(urlInput);
    controls.appendChild(urlGroup);

    // Analysis options
    const optionsGroup = this.createElement('div', ['analysis-options']);
    const optionsLabel = this.createElement('label', [], {}, 'Analysis Options:');
    optionsGroup.appendChild(optionsLabel);

    const options = [
      { id: 'structure', label: 'Structure', checked: true },
      { id: 'performance', label: 'Performance', checked: true },
      { id: 'accessibility', label: 'Accessibility', checked: true }
    ];

    options.forEach(option => {
      const checkbox = this.createElement('input', [], {
        type: 'checkbox',
        id: option.id,
        name: 'analysisOptions',
        value: option.id
      }) as HTMLInputElement;
      checkbox.checked = option.checked;

      const label = this.createElement('label', [], { for: option.id }, option.label);

      const optionDiv = this.createElement('div', ['option']);
      optionDiv.appendChild(checkbox);
      optionDiv.appendChild(label);
      optionsGroup.appendChild(optionDiv);
    });

    controls.appendChild(optionsGroup);

    // Action buttons
    const buttons = this.createElement('div', ['action-buttons']);
    const analyzeBtn = this.createElement('button', ['btn', 'analyze-button'], {
      type: 'button'
    }, 'Analyze Page');
    const refreshBtn = this.createElement('button', ['btn', 'refresh-button'], {
      type: 'button'
    }, 'Refresh');

    buttons.appendChild(analyzeBtn);
    buttons.appendChild(refreshBtn);
    controls.appendChild(buttons);

    return controls;
  }

  private renderResults(): HTMLElement {
    const results = this.createElement('div', ['analysis-results']);

    if (!this.state.analysisResults) {
      results.innerHTML = '<p class="no-results">No analysis results available</p>';
      return results;
    }

    const data = this.state.analysisResults;

    // Structure results
    if (data.structure) {
      const structureSection = this.renderStructureResults(data.structure);
      results.appendChild(structureSection);
    }

    // Performance results
    if (data.performance) {
      const performanceSection = this.renderPerformanceResults(data.performance);
      results.appendChild(performanceSection);
    }

    // Accessibility results
    if (data.accessibility) {
      const a11ySection = this.renderAccessibilityResults(data.accessibility);
      results.appendChild(a11ySection);
    }

    return results;
  }

  private renderStatusBar(): HTMLElement {
    const statusBar = this.createElement('div', ['status-bar']);

    const status = this.createElement('div', ['status']);
    status.textContent = `Status: ${this.state.status || 'Ready'}`;

    const progress = this.createElement('div', ['progress']);
    if (this.state.analyzing) {
      progress.innerHTML = '<div class="progress-bar"></div>';
    }

    statusBar.appendChild(status);
    statusBar.appendChild(progress);

    return statusBar;
  }

  private renderStructureResults(structure: any): HTMLElement {
    const section = this.createElement('div', ['results-section', 'structure-results']);
    const title = this.createElement('h3', [], {}, 'Page Structure');
    section.appendChild(title);

    const content = this.createElement('div', ['section-content']);
    content.innerHTML = `
      <div class="metric">
        <span class="label">Title:</span>
        <span class="value">${structure.title}</span>
      </div>
      <div class="metric">
        <span class="label">Headings:</span>
        <span class="value">${structure.headings.join(', ')}</span>
      </div>
      <div class="metric">
        <span class="label">Links:</span>
        <span class="value">${structure.links.internal} internal, ${structure.links.external} external</span>
      </div>
      <div class="metric">
        <span class="label">Images:</span>
        <span class="value">${structure.images.total} total, ${structure.images.missingAlt} missing alt text</span>
      </div>
    `;

    section.appendChild(content);
    return section;
  }

  private renderPerformanceResults(performance: any): HTMLElement {
    const section = this.createElement('div', ['results-section', 'performance-results']);
    const title = this.createElement('h3', [], {}, 'Performance');
    section.appendChild(title);

    const content = this.createElement('div', ['section-content']);

    // Performance score
    const scoreBar = this.createElement('div', ['score-bar']);
    const scoreValue = Math.round(performance.performanceScore * 100);
    const scoreColor = scoreValue >= 90 ? 'good' : scoreValue >= 50 ? 'needs-improvement' : 'poor';

    scoreBar.innerHTML = `
      <div class="score ${scoreColor}">
        <span class="score-value">${scoreValue}</span>
        <span class="score-label">Performance Score</span>
      </div>
    `;

    content.appendChild(scoreBar);

    // Metrics
    const metrics = this.createElement('div', ['metrics']);
    metrics.innerHTML = `
      <div class="metric">
        <span class="label">Load Time:</span>
        <span class="value">${performance.loadTime}s</span>
      </div>
      <div class="metric">
        <span class="label">First Contentful Paint:</span>
        <span class="value">${performance.firstContentfulPaint}s</span>
      </div>
      <div class="metric">
        <span class="label">Largest Contentful Paint:</span>
        <span class="value">${performance.largestContentfulPaint}s</span>
      </div>
      <div class="metric">
        <span class="label">Cumulative Layout Shift:</span>
        <span class="value">${performance.cumulativeLayoutShift}</span>
      </div>
    `;

    content.appendChild(metrics);
    section.appendChild(content);
    return section;
  }

  private renderAccessibilityResults(accessibility: any): HTMLElement {
    const section = this.createElement('div', ['results-section', 'accessibility-results']);
    const title = this.createElement('h3', [], {}, 'Accessibility');
    section.appendChild(title);

    const content = this.createElement('div', ['section-content']);

    // Accessibility score
    const scoreBar = this.createElement('div', ['score-bar']);
    const scoreValue = Math.round(accessibility.score * 100);
    const scoreColor = scoreValue >= 90 ? 'good' : scoreValue >= 50 ? 'needs-improvement' : 'poor';

    scoreBar.innerHTML = `
      <div class="score ${scoreColor}">
        <span class="score-value">${scoreValue}</span>
        <span class="score-label">Accessibility Score</span>
      </div>
    `;

    content.appendChild(scoreBar);

    // Issues
    const issues = this.createElement('div', ['issues']);
    const issuesTitle = this.createElement('h4', [], {}, 'Issues Found');
    issues.appendChild(issuesTitle);

    accessibility.issues.forEach((issue: any) => {
      const issueDiv = this.createElement('div', ['issue', issue.severity]);
      issueDiv.innerHTML = `
        <span class="issue-type">${issue.type.replace('-', ' ')}</span>
        <span class="issue-count">${issue.count}</span>
        <span class="issue-severity">${issue.severity}</span>
      `;
      issues.appendChild(issueDiv);
    });

    content.appendChild(issues);
    section.appendChild(content);
    return section;
  }

  // Event handlers
  private async handleAnalyzeClick(event: Event): Promise<void> {
    event.preventDefault();

    const url = this.getUrlFromInput();
    if (!url) {
      this.showError('Please enter a valid URL');
      return;
    }

    const options = this.getAnalysisOptions();

    try {
      await this.updateState({ analyzing: true, status: 'Analyzing...' });

      const results = await this.performAnalysis(url, options);

      await this.updateState({
        analyzing: false,
        status: 'Analysis complete',
        analysisResults: results,
        lastAnalysis: Date.now()
      });

    } catch (error) {
      await this.updateState({
        analyzing: false,
        status: 'Analysis failed'
      });

      this.showError(`Analysis failed: ${error.message}`);
    }
  }

  private async handleRefreshClick(event: Event): Promise<void> {
    event.preventDefault();
    await this.loadAnalysisData();
  }

  private async handleUrlChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    await this.updateState({ url: input.value });
  }

  private async handleOptionsChange(event: Event): Promise<void> {
    const options = this.getAnalysisOptions();
    await this.updateState({ analysisOptions: options });
  }

  // Helper methods
  private async connectWebSocket(): Promise<void> {
    try {
      this.wsConnection = new WebSocket('ws://localhost:3024/extension-ws');

      this.wsConnection.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      };

      this.wsConnection.onclose = () => {
        this.logWithContext('warn', 'WebSocket connection closed');
        // Attempt reconnect after delay
        setTimeout(() => this.connectWebSocket(), 5000);
      };

    } catch (error) {
      this.logWithContext('error', 'WebSocket connection failed', { error });
    }
  }

  private handleWebSocketMessage(message: any): void {
    // Handle real-time updates from Chrome extension
    if (message.type === 'analysisUpdate') {
      this.updateState({ analysisResults: message.data });
    }
  }

  private async loadAnalysisData(): Promise<void> {
    try {
      const response = await fetch('/api/analysis/latest');
      const data = await response.json();

      if (data.success) {
        await this.updateState({
          analysisResults: data.results,
          lastAnalysis: data.timestamp
        });
      }
    } catch (error) {
      this.logWithContext('warn', 'Failed to load analysis data', { error });
    }
  }

  private async performAnalysis(url: string, options: any): Promise<any> {
    const response = await fetch('/tools/browser_analyze_page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, ...options })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }

    return result.data;
  }

  private getUrlFromInput(): string | null {
    const input = this.findElement('.url-input') as HTMLInputElement;
    const url = input?.value?.trim();

    if (!url || !this.isValidUrl(url)) {
      return null;
    }

    return url;
  }

  private getAnalysisOptions(): any {
    const checkboxes = this.findElements('.analysis-options input[type="checkbox"]');
    const options: any = {};

    checkboxes.forEach((checkbox: Element) => {
      const input = checkbox as HTMLInputElement;
      const key = `include${input.value.charAt(0).toUpperCase() + input.value.slice(1)}`;
      options[key] = input.checked;
    });

    return options;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private updateButtonStates(analyzing: boolean): void {
    const analyzeBtn = this.findElement('.analyze-button') as HTMLButtonElement;
    const refreshBtn = this.findElement('.refresh-button') as HTMLButtonElement;

    if (analyzeBtn) {
      analyzeBtn.disabled = analyzing;
      analyzeBtn.textContent = analyzing ? 'Analyzing...' : 'Analyze Page';
    }

    if (refreshBtn) {
      refreshBtn.disabled = analyzing;
    }
  }

  private updateStatusIndicator(status: string): void {
    const statusEl = this.findElement('.status');
    if (statusEl) {
      statusEl.textContent = `Status: ${status}`;
      statusEl.className = `status status-${status.toLowerCase().replace(/\s+/g, '-')}`;
    }
  }

  private async updateResultsDisplay(results: any): Promise<void> {
    const resultsContainer = this.findElement('.analysis-results');
    if (!resultsContainer) return;

    // Clear existing results
    resultsContainer.innerHTML = '';

    // Render new results
    const newResults = this.renderResults();
    resultsContainer.appendChild(newResults);
  }

  private showError(message: string): void {
    // Create temporary error message
    const error = this.createElement('div', ['error-message'], {}, message);
    const container = this.findElement('.dashboard-controls');

    if (container) {
      container.appendChild(error);
      setTimeout(() => error.remove(), 5000);
    }
  }

  private startRefreshTimer(): void {
    this.refreshTimer = setInterval(() => {
      this.loadAnalysisData();
    }, 30000); // Refresh every 30 seconds
  }
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Registry Registration Fails

**Problem**: Tool fails to register with error "Tool name conflict"
**Solution**:
```typescript
// Ensure unique tool names
const TOOL_PREFIX = 'myagent_'; // Use agent-specific prefix
export class MyTool extends BaseBrowserTool {
  readonly name = `${TOOL_PREFIX}my_tool`;
  // ...
}
```

#### 2. Interface Compliance Failures

**Problem**: Quality gates fail with interface compliance errors
**Solution**:
```typescript
// Check all required methods are implemented
export class MyTool extends BaseBrowserTool {
  // ✅ All required properties
  readonly name = 'my_tool';
  readonly endpoint = '/tools/my_tool';
  readonly description = 'My tool description';
  readonly schema = { /* valid schema */ };

  // ✅ All required methods
  protected async executeImpl(params: any): Promise<IToolResult> { /* ... */ }
  protected async healthCheck(): Promise<boolean> { /* ... */ }
}
```

#### 3. WebSocket Connection Issues

**Problem**: Chrome extension not connecting
**Solution**:
```typescript
// Check service worker is running on correct port
const serviceWorker = new MANEServiceWorker(3024, '127.0.0.1', logger, metrics, monitor, registry);
await serviceWorker.start();

// Check Chrome extension port configuration
// Extension should connect to ws://localhost:3024/extension-ws
```

#### 4. Performance Gate Failures

**Problem**: Tools fail performance quality gates
**Solution**:
```typescript
// Optimize tool performance
protected async executeImpl(params: any): Promise<IToolResult> {
  // Use timeout protection
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), this.capabilities.timeout);
  });

  // Race operation against timeout
  const result = await Promise.race([
    this.performOptimizedOperation(params),
    timeoutPromise
  ]);

  return this.createSuccess(result);
}

// Cache expensive operations
private cache = new Map();

protected async performOptimizedOperation(params: any): Promise<any> {
  const cacheKey = this.getCacheKey(params);
  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey);
  }

  const result = await this.expensiveOperation(params);
  this.cache.set(cacheKey, result);
  return result;
}
```

#### 5. Schema Validation Errors

**Problem**: Parameter validation fails unexpectedly
**Solution**:
```typescript
// Ensure schema is comprehensive and correct
readonly schema = {
  type: 'object',
  properties: {
    requiredParam: {
      type: 'string',
      minLength: 1,
      description: 'Required parameter'
    },
    optionalParam: {
      type: 'number',
      minimum: 0,
      default: 10,
      description: 'Optional parameter with default'
    }
  },
  required: ['requiredParam'],
  additionalProperties: false // ⚠️ Important!
};

// Test schema with various inputs
private testSchema(): void {
  const testCases = [
    { requiredParam: 'test' }, // ✅ Valid
    { requiredParam: 'test', optionalParam: 5 }, // ✅ Valid
    { requiredParam: '' }, // ❌ Should fail - empty string
    {}, // ❌ Should fail - missing required
    { requiredParam: 'test', extra: 'not allowed' }, // ❌ Should fail - additional property
  ];

  testCases.forEach(testCase => {
    const validation = this.validate(testCase);
    console.log(`Input: ${JSON.stringify(testCase)}, Valid: ${validation.valid}`);
    if (!validation.valid) {
      console.log(`Errors: ${validation.errors?.join(', ')}`);
    }
  });
}
```

### Debugging Tools

#### 1. Enable Debug Logging

```typescript
// Set environment variable for debug mode
process.env.MCP_DEBUG = '1';

// Use structured logging
this.logWithContext('debug', 'Operation details', {
  operation: 'my_operation',
  params,
  timestamp: Date.now(),
  stackTrace: new Error().stack
});
```

#### 2. Health Check Monitoring

```typescript
// Add comprehensive health checks
protected async healthCheck(): Promise<boolean> {
  const checks = [
    () => this.checkDependency1(),
    () => this.checkDependency2(),
    () => this.checkConfiguration(),
    () => this.checkResources()
  ];

  for (const check of checks) {
    try {
      const result = await check();
      if (!result) {
        this.logger.warn(`Health check failed: ${check.name}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Health check error: ${check.name}`, { error });
      return false;
    }
  }

  return true;
}
```

#### 3. Performance Monitoring

```typescript
// Add detailed performance tracking
protected async executeImpl(params: any): Promise<IToolResult> {
  const startTime = Date.now();
  const memBefore = process.memoryUsage().heapUsed;

  try {
    const result = await this.performOperation(params);

    // Log performance metrics
    const duration = Date.now() - startTime;
    const memAfter = process.memoryUsage().heapUsed;
    const memDelta = memAfter - memBefore;

    this.metrics.timing('tool.execution.duration', duration, { tool: this.name });
    this.metrics.gauge('tool.memory.delta', memDelta, { tool: this.name });

    this.logWithContext('debug', 'Execution completed', {
      duration,
      memoryDelta: Math.round(memDelta / 1024 / 1024 * 100) / 100 + 'MB'
    });

    return this.createSuccess(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    this.metrics.timing('tool.execution.error', duration, {
      tool: this.name,
      errorType: error.constructor.name
    });

    throw error;
  }
}
```

---

## 📞 Support & Resources

### Getting Help

1. **Foundation Team**: foundation@mane.dev
2. **Documentation**: Check `/docs` directory for detailed guides
3. **Examples**: Review `/examples` for complete implementations
4. **Quality Gates**: Run `npm run quality-gate` to validate your implementation

### Additional Resources

- [MANE Architecture Guide](../MANE/MANE-ARCHITECTURE.md)
- [HTTP API Contracts](../contracts/http.yaml)
- [Quality Gate Requirements](../contracts/QUALITY_GATE.md)
- [Chrome Extension Integration](../MANE/CHROME-EXTENSION-MANE-IMPLEMENTATION.md)

### Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Implement following MANE patterns
4. Ensure all quality gates pass
5. Submit pull request with detailed description

---

**Built with MANE** 🦁 - *The future of AI-collaborative development*

*Version: 2.0.0*
*Last Updated: 2025-01-20*
*Next Review: 2025-04-20*