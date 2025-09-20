# Browser Tools Event Contracts

## Event-Driven Architecture for MANE Agents

This document defines the event contracts for asynchronous communication between MANE agents in the browser tools ecosystem.

## Event Topics

### Tool Execution Events

#### `tool.executed`
Fired when any browser tool completes execution.

**Payload:**
```json
{
  "toolName": "browser_screenshot",
  "success": true,
  "duration": 1234,
  "timestamp": "2025-09-19T10:30:00Z",
  "agentId": "agent-g-screenshot",
  "metadata": {
    "selector": null,
    "fullPage": true,
    "outputPath": ".screenshots/screenshot-2025-09-19-103000.png"
  }
}
```

#### `tool.failed`
Fired when tool execution fails.

**Payload:**
```json
{
  "toolName": "browser_evaluate",
  "error": "Request timeout after 30000ms",
  "duration": 30001,
  "timestamp": "2025-09-19T10:30:30Z",
  "agentId": "agent-b-evaluate",
  "retryCount": 2,
  "metadata": {
    "script": "document.title"
  }
}
```

### Agent Lifecycle Events

#### `agent.started`
Fired when an agent begins work in their universe.

**Payload:**
```json
{
  "agentId": "agent-a-foundation",
  "universe": "../mane-universes/agent-a-foundation",
  "branch": "agent-a-foundation",
  "timestamp": "2025-09-19T10:25:00Z",
  "contractVersion": "1.0.0"
}
```

#### `agent.completed`
Fired when an agent completes their assigned tasks.

**Payload:**
```json
{
  "agentId": "agent-f-ui-panels",
  "universe": "../mane-universes/agent-f-ui-panels",
  "completedTasks": [
    "Create modular UI components",
    "Implement responsive design",
    "Add accessibility features"
  ],
  "timestamp": "2025-09-19T12:00:00Z",
  "readyForIntegration": true
}
```

### Quality Gate Events

#### `quality.checked`
Fired when quality gates are evaluated.

**Payload:**
```json
{
  "universe": "agent-b-evaluate",
  "checks": {
    "contractCompliance": true,
    "tests": true,
    "p95Latency": 850,
    "errorRate": 0.01,
    "coveragePercent": 95
  },
  "passed": true,
  "timestamp": "2025-09-19T11:45:00Z"
}
```

### Integration Events

#### `integration.promoted`
Fired when agent work is promoted to integration branch.

**Payload:**
```json
{
  "sourceAgent": "agent-c-audit",
  "targetBranch": "universe-integration",
  "pullRequestId": "pr-123",
  "timestamp": "2025-09-19T13:00:00Z",
  "qualityGatesPassed": true
}
```

#### `integration.conflict`
Fired when merge conflicts are detected during integration.

**Payload:**
```json
{
  "conflictingAgents": ["agent-b-evaluate", "agent-d-console"],
  "conflictedFiles": [
    "tools/base-tool.ts",
    "types/tool-result.ts"
  ],
  "integrationBranch": "universe-integration",
  "timestamp": "2025-09-19T13:15:00Z",
  "requiresManualResolution": true
}
```

## Event Routing

### Local Events
- Handled within individual agent universes
- Used for internal agent coordination
- No cross-universe dependencies

### Global Events
- Published to integration universe
- Available to all agents via event bus
- Used for system-wide coordination

## Implementation Notes

### Event Bus
- Use lightweight pub/sub system (Redis, EventEmitter, or WebSockets)
- Events are fire-and-forget (no blocking operations)
- Failed event deliveries are logged but don't halt execution

### Event Persistence
- Critical events (quality gates, integrations) are persisted
- Debugging events (tool executions) are ephemeral
- Event history available for troubleshooting

### Schema Evolution
- All events include schema version
- Backward compatibility maintained for 2 major versions
- Breaking changes require coordinated agent updates