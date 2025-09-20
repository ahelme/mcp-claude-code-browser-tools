/**
 * 🦁 MANE Service Worker Framework
 * HTTP server infrastructure for MCP communication
 *
 * This service worker provides the HTTP bridge infrastructure that enables
 * communication between Claude Code and the browser tools extension.
 *
 * Built by: Foundation Architect (Agent A)
 * For: MANE (Modular Agentic Non-linear Engineering)
 */

import http from 'http';
import url from 'url';
import {
  IHttpBridge,
  IHttpRequest,
  IHttpResponse,
  IRouteHandler,
  IBridgeStatus,
  ILogger,
  IMetrics,
  ErrorType
} from './interfaces.js';

/**
 * HTTP request handler type
 */
type HttpRequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>;

/**
 * Route definition
 */
interface Route {
  path: string;
  method: string;
  handler: IRouteHandler;
}

/**
 * HTTP Bridge implementation for MCP communication
 *
 * Features:
 * - Route registration and management
 * - CORS support for browser extension
 * - Request/response logging and metrics
 * - Error handling and recovery
 * - Health monitoring
 */
export class HttpBridge implements IHttpBridge {
  private server: http.Server | null = null;
  private routes = new Map<string, Route>();
  private requestCount = 0;
  private errorCount = 0;
  private startTime = 0;
  private currentPort = 0;

  constructor(
    private logger: ILogger,
    private metrics: IMetrics
  ) {
    this.setupDefaultRoutes();
  }

  /**
   * Start the HTTP server
   */
  async start(port: number): Promise<void> {
    if (this.server) {
      throw new Error('Server is already running');
    }

    this.logger.info(`Starting HTTP bridge on port ${port}`);

    return new Promise((resolve, reject) => {
      this.server = http.createServer(this.handleRequest.bind(this));

      this.server.on('error', (error: Error & { code?: string }) => {
        this.logger.error('HTTP server error', error);

        if (error.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(error);
        }
      });

      this.server.listen(port, () => {
        this.currentPort = port;
        this.startTime = Date.now();

        this.logger.info(`HTTP bridge started successfully on port ${port}`);
        this.metrics.increment('http_bridge.started', { port: port.toString() });

        resolve();
      });
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    this.logger.info('Stopping HTTP bridge');

    return new Promise((resolve, reject) => {
      this.server!.close((error) => {
        if (error) {
          this.logger.error('Error stopping HTTP bridge', error);
          reject(error);
        } else {
          this.logger.info('HTTP bridge stopped successfully');
          this.metrics.increment('http_bridge.stopped');
          this.server = null;
          this.currentPort = 0;
          resolve();
        }
      });
    });
  }

  /**
   * Register a route handler
   */
  registerRoute(path: string, handler: IRouteHandler): void {
    // Support both GET and POST for flexibility
    const methods = ['GET', 'POST'];

    for (const method of methods) {
      const routeKey = `${method}:${path}`;
      this.routes.set(routeKey, { path, method, handler });
    }

    this.logger.debug(`Registered route: ${path}`, { methods });
    this.metrics.increment('http_bridge.route_registered', { path });
  }

  /**
   * Get server status
   */
  getStatus(): IBridgeStatus {
    const uptime = this.server ? Date.now() - this.startTime : 0;

    return {
      running: !!this.server,
      port: this.currentPort,
      uptime,
      requestCount: this.requestCount,
      errorCount: this.errorCount
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    this.requestCount++;
    const startTime = Date.now();

    // Set CORS headers for browser extension
    this.setCorsHeaders(res);

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      const parsedUrl = url.parse(req.url || '', true);
      const path = parsedUrl.pathname || '/';
      const method = req.method || 'GET';

      this.logger.debug(`${method} ${path}`, {
        userAgent: req.headers['user-agent'],
        contentType: req.headers['content-type']
      });

      // Find matching route
      const routeKey = `${method}:${path}`;
      const route = this.routes.get(routeKey);

      if (!route) {
        await this.sendNotFound(res, path);
        return;
      }

      // Parse request body
      const body = await this.parseRequestBody(req);

      // Create request context
      const request: IHttpRequest = {
        method,
        path,
        headers: req.headers as Record<string, string>,
        body,
        query: parsedUrl.query as Record<string, string>
      };

      // Execute route handler
      const response = await route.handler.handle(request);

      // Send response
      await this.sendResponse(res, response);

      const duration = Date.now() - startTime;
      this.metrics.timing('http_bridge.request.duration', duration, {
        method,
        path,
        status: response.statusCode.toString()
      });

    } catch (error) {
      this.errorCount++;

      this.logger.error('Request handling error', {
        url: req.url,
        method: req.method,
        error: error instanceof Error ? error.message : String(error)
      });

      await this.sendError(res, error);

      const duration = Date.now() - startTime;
      this.metrics.timing('http_bridge.request.duration', duration, {
        method: req.method || 'unknown',
        path: 'error',
        status: '500'
      });
    }
  }

  /**
   * Set CORS headers for browser extension access
   */
  private setCorsHeaders(res: http.ServerResponse): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  /**
   * Parse request body based on content type
   */
  private async parseRequestBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const contentType = req.headers['content-type'] || '';

          if (contentType.includes('application/json')) {
            resolve(body ? JSON.parse(body) : {});
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const parsed = new URLSearchParams(body);
            const result: Record<string, string> = {};
            for (const [key, value] of parsed) {
              result[key] = value;
            }
            resolve(result);
          } else {
            resolve(body);
          }
        } catch (error) {
          reject(new Error(`Invalid request body: ${error instanceof Error ? error.message : String(error)}`));
        }
      });

      req.on('error', reject);
    });
  }

  /**
   * Send HTTP response
   */
  private async sendResponse(res: http.ServerResponse, response: IHttpResponse): Promise<void> {
    // Set headers
    for (const [key, value] of Object.entries(response.headers)) {
      res.setHeader(key, value);
    }

    // Set content type if not already set
    if (!response.headers['Content-Type']) {
      res.setHeader('Content-Type', response.contentType || 'application/json');
    }

    // Write response
    res.writeHead(response.statusCode);

    if (response.body !== undefined) {
      const bodyStr = typeof response.body === 'string'
        ? response.body
        : JSON.stringify(response.body);
      res.end(bodyStr);
    } else {
      res.end();
    }
  }

  /**
   * Send 404 Not Found response
   */
  private async sendNotFound(res: http.ServerResponse, path: string): Promise<void> {
    const response: IHttpResponse = {
      statusCode: 404,
      headers: {},
      contentType: 'application/json',
      body: {
        error: 'Not Found',
        message: `Route not found: ${path}`,
        availableRoutes: Array.from(this.routes.keys())
      }
    };

    await this.sendResponse(res, response);
  }

  /**
   * Send error response
   */
  private async sendError(res: http.ServerResponse, error: unknown): Promise<void> {
    const statusCode = error instanceof Error && 'statusCode' in error
      ? (error as any).statusCode
      : 500;

    const response: IHttpResponse = {
      statusCode,
      headers: {},
      contentType: 'application/json',
      body: {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error)
      }
    };

    await this.sendResponse(res, response);
  }

  /**
   * Setup default system routes
   */
  private setupDefaultRoutes(): void {
    // Health check endpoint
    this.registerRoute('/health', new HealthCheckHandler(this));

    // Status endpoint
    this.registerRoute('/status', new StatusHandler(this));

    // Routes listing endpoint
    this.registerRoute('/routes', new RoutesHandler(this));
  }

  /**
   * Get registered routes for debugging
   */
  getRoutes(): string[] {
    return Array.from(this.routes.keys());
  }
}

// ============================================================================
// DEFAULT ROUTE HANDLERS
// ============================================================================

/**
 * Health check route handler
 */
class HealthCheckHandler implements IRouteHandler {
  constructor(private bridge: HttpBridge) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const status = this.bridge.getStatus();

    return {
      statusCode: status.running ? 200 : 503,
      headers: {},
      contentType: 'application/json',
      body: {
        status: status.running ? 'healthy' : 'unhealthy',
        uptime: status.uptime,
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Status route handler
 */
class StatusHandler implements IRouteHandler {
  constructor(private bridge: HttpBridge) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const status = this.bridge.getStatus();

    return {
      statusCode: 200,
      headers: {},
      contentType: 'application/json',
      body: {
        ...status,
        errorRate: status.requestCount > 0 ? status.errorCount / status.requestCount : 0,
        averageUptime: status.uptime,
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Routes listing handler
 */
class RoutesHandler implements IRouteHandler {
  constructor(private bridge: HttpBridge) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    return {
      statusCode: 200,
      headers: {},
      contentType: 'application/json',
      body: {
        routes: this.bridge.getRoutes(),
        timestamp: Date.now()
      }
    };
  }
}

// ============================================================================
// HELPER ROUTE HANDLERS
// ============================================================================

/**
 * Simple route handler for static responses
 */
export class StaticHandler implements IRouteHandler {
  constructor(
    private response: any,
    private statusCode = 200,
    private contentType = 'application/json'
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    return {
      statusCode: this.statusCode,
      headers: {},
      contentType: this.contentType,
      body: this.response
    };
  }
}

/**
 * Proxy handler for forwarding requests
 */
export class ProxyHandler implements IRouteHandler {
  constructor(
    private targetUrl: string,
    private logger: ILogger
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    this.logger.debug(`Proxying request to: ${this.targetUrl}`);

    try {
      // This is a simplified proxy implementation
      // In practice, you'd use a proper HTTP client like axios or fetch
      return {
        statusCode: 200,
        headers: {},
        contentType: 'application/json',
        body: {
          proxied: true,
          target: this.targetUrl,
          originalRequest: request
        }
      };
    } catch (error) {
      return {
        statusCode: 502,
        headers: {},
        contentType: 'application/json',
        body: {
          error: 'Bad Gateway',
          message: `Proxy request failed: ${error instanceof Error ? error.message : String(error)}`
        }
      };
    }
  }
}

/**
 * JSON response helper
 */
export function jsonResponse(data: any, statusCode = 200): IHttpResponse {
  return {
    statusCode,
    headers: {},
    contentType: 'application/json',
    body: data
  };
}

/**
 * Error response helper
 */
export function errorResponse(message: string, statusCode = 500, details?: any): IHttpResponse {
  return {
    statusCode,
    headers: {},
    contentType: 'application/json',
    body: {
      error: true,
      message,
      details,
      timestamp: Date.now()
    }
  };
}