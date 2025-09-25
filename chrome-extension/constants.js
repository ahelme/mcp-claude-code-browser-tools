/**
 * Browser Navigation Tools - Global Constants
 *
 * Centralized configuration for all magic numbers and settings
 * to improve maintainability and make configuration changes easier.
 */

// Navigation Timeout Configuration
export const NAVIGATION_TIMEOUTS = {
  MIN: 1000,              // Minimum allowed timeout (1 second)
  MAX: 60000,             // Maximum allowed timeout (60 seconds)
  DEFAULT: 10000,         // Default navigation timeout (10 seconds)
  STATUS_CLEAR_DELAY: 3000 // Delay before clearing status message
};

// Retry Strategy Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 2,         // Maximum retry attempts
  BASE_DELAY: 1000,       // Base delay for exponential backoff (1 second)
  MAX_DELAY: 5000,        // Maximum delay cap (5 seconds)
  RETRYABLE_PATTERNS: [
    'timeout',
    'network',
    'connection',
    'unreachable',
    'temporary',
    'ERR_'
  ]
};

// Listener Pool Configuration
export const LISTENER_POOL_CONFIG = {
  MAX_CONCURRENT: 5,      // Maximum concurrent listeners
  MAX_AGE: 300000,        // Maximum listener age (5 minutes)
  MIN_INACTIVE_TIME: 60000, // Minimum inactivity before cleanup (1 minute)
  ORPHAN_AGE: 120000,     // Age to consider listener orphaned (2 minutes)
  CLEANUP_INTERVALS: {
    IDLE: 120000,         // 2 minutes when no listeners
    LIGHT: 60000,         // 1 minute for 1-2 listeners
    MODERATE: 30000,      // 30 seconds for 3-4 listeners
    HEAVY: 10000          // 10 seconds for 5+ listeners
  }
};

// Memory Management Configuration
export const MEMORY_CONFIG = {
  MAX_LOG_ENTRIES: 500,   // Maximum log entries to keep
  LOG_CLEANUP_THRESHOLD: 400, // Trigger cleanup at this count
  MAX_MESSAGE_QUEUE_SIZE: 100, // Maximum WebSocket message queue
  MEMORY_CHECK_INTERVAL: 30000, // Check memory every 30 seconds
  MEMORY_WARNING_THRESHOLD: 0.8 // Warn at 80% memory usage
};

// DOM Update Configuration
export const DOM_CONFIG = {
  BATCH_UPDATE_SIZE: 50,  // Batch DOM updates in groups of 50
  BATCH_UPDATE_DELAY: 16, // Delay between batches (1 frame at 60fps)
  MAX_DOM_NODES: 1000,    // Maximum DOM nodes before cleanup
  FRAGMENT_THRESHOLD: 10  // Use DocumentFragment for 10+ operations
};

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  RECONNECT_DELAY: 5000,  // Delay before reconnection attempt
  MAX_RECONNECT_ATTEMPTS: 5, // Maximum reconnection attempts
  PING_INTERVAL: 30000,   // Ping interval (30 seconds)
  PONG_TIMEOUT: 5000,      // Timeout waiting for pong
  MESSAGE_QUEUE_SIZE: 100  // Maximum queued messages
};

// URL Validation Configuration
export const URL_VALIDATION_CONFIG = {
  ALLOWED_PROTOCOLS: ['http:', 'https:'],
  BLOCKED_PROTOCOLS: [
    'file:',
    'chrome:',
    'chrome-extension:',
    'moz-extension:',
    'javascript:',
    'vbscript:',
    'about:',
    'resource:'
  ],
  SPECIAL_PROTOCOLS: ['devtools:'], // Allowed in Chrome extension context
  MAX_URL_LENGTH: 2048,    // Maximum URL length
  HOSTNAME_PATTERN: /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i
};

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  LISTENER_CREATION: 5,    // Max 5ms for listener creation
  LISTENER_REMOVAL: 5,     // Max 5ms for listener removal
  CLEANUP_CYCLE: 50,       // Max 50ms for cleanup cycle
  STATUS_CHECK: 2,         // Max 2ms for status check
  NAVIGATION_SLOW: 5000,   // Consider navigation slow after 5s
  MEMORY_GROWTH_WARNING: 0.5 // Warn if memory grows by 50%
};

// Cleanup Configuration
export const CLEANUP_CONFIG = {
  WAIT_OPERATIONS: {
    MAX_AGE: 120000,      // Maximum wait operation age (2 minutes)
    CLEANUP_INTERVAL: 30000 // Check for orphaned waits every 30s
  },
  INTERACTION_OPERATIONS: {
    CHECK_INTERVAL: 500,   // Check element every 500ms
    MAX_WAIT_TIME: 60000   // Maximum wait time (60 seconds)
  }
};

// Test Configuration
export const TEST_CONFIG = {
  MAX_TEST_DURATION: 300000, // Maximum test suite duration (5 minutes)
  TEST_TIMEOUT: 30000,       // Individual test timeout (30 seconds)
  STRESS_TEST_ITERATIONS: 100, // Stress test iteration count
  CONCURRENT_TESTS: 8,       // Concurrent test operations
  MEMORY_SNAPSHOT_INTERVAL: 5 // Take memory snapshot every 5 iterations
};

// Logging Configuration
export const LOGGING_CONFIG = {
  LEVELS: {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3
  },
  DEFAULT_LEVEL: 1,        // INFO level by default
  MAX_MESSAGE_LENGTH: 1000, // Truncate long messages
  TIMESTAMP_FORMAT: 'HH:mm:ss.SSS',
  LOG_PREFIX: {
    NAVIGATION: '[NAV]',
    INTERACTION: '[INT]',
    WEBSOCKET: '[WS]',
    MEMORY: '[MEM]',
    PERFORMANCE: '[PERF]'
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NAVIGATION: {
    IN_PROGRESS: 'Navigation already in progress',
    URL_REQUIRED: 'URL is required for navigation',
    INVALID_MESSAGE: 'Invalid message format - expected object',
    NO_ACTIVE_TAB: 'No active tab found',
    TIMEOUT: 'Navigation timeout after {timeout}ms',
    FAILED: 'Navigation failed: {error}'
  },
  URL_VALIDATION: {
    EMPTY: 'URL must be a non-empty string',
    PROTOCOL_BLOCKED: 'Protocol {protocol} not allowed for security reasons',
    DATA_URL_BLOCKED: 'Data URLs not allowed for security reasons',
    INVALID_FORMAT: 'Invalid URL format: {error}',
    INVALID_HOSTNAME: 'Invalid hostname',
    URL_TOO_LONG: 'URL exceeds maximum length of {max} characters',
    DEVTOOLS_CONTEXT_ONLY: 'Devtools URLs only allowed in Chrome extension context'
  },
  LISTENER_POOL: {
    CAPACITY_WARNING: 'Listener pool approaching maximum capacity - cleaning up stale listeners',
    REMOVE_NONEXISTENT: 'Attempted to remove non-existent listener: {id}',
    CLEANUP_FAILED: 'Failed to remove navigation listener: {error}'
  },
  MEMORY: {
    HIGH_USAGE: 'Memory usage exceeding threshold: {percent}%',
    CLEANUP_REQUIRED: 'Memory cleanup required - removing old entries',
    LEAK_DETECTED: 'Potential memory leak detected'
  }
};

// Success Messages
export const SUCCESS_MESSAGES = {
  NAVIGATION: {
    COMPLETED: 'Navigation completed in {time}ms',
    RETRY_SUCCESS: 'Navigation succeeded after {attempts} attempt(s)',
    CANCELLED: 'Navigation cancelled'
  },
  CLEANUP: {
    LISTENERS_REMOVED: 'Cleaned up {count} stale listeners',
    MEMORY_FREED: 'Freed {amount}MB of memory',
    LOGS_TRUNCATED: 'Truncated {count} old log entries'
  }
};

// Export as default for convenience
export default {
  NAVIGATION_TIMEOUTS,
  RETRY_CONFIG,
  LISTENER_POOL_CONFIG,
  MEMORY_CONFIG,
  DOM_CONFIG,
  WEBSOCKET_CONFIG,
  URL_VALIDATION_CONFIG,
  PERFORMANCE_THRESHOLDS,
  CLEANUP_CONFIG,
  TEST_CONFIG,
  LOGGING_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};