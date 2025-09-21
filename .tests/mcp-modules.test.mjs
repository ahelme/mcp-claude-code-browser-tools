/**
 * 🦁 MANE MCP Server Modules Test Suite
 *
 * Tests for the modular MCP server components to ensure
 * proper functionality after splitting the monolithic server.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { serverInfo, getServerHealth } from '../scripts/modules/mcp-server-info.mjs';
import { tools, getToolNames, getTool, validateToolName } from '../scripts/modules/mcp-tool-definitions.mjs';
import {
  handleRegistryStatus,
  handleRegisterTool,
  handleDiscoverTools,
  handleQualityGate
} from '../scripts/modules/mcp-tool-handlers.mjs';

describe('MCP Server Info Module', () => {
  test('should export valid server information', () => {
    assert.strictEqual(typeof serverInfo, 'object');
    assert.strictEqual(typeof serverInfo.name, 'string');
    assert.strictEqual(typeof serverInfo.version, 'string');
    assert.strictEqual(typeof serverInfo.protocolVersion, 'string');
    assert.strictEqual(typeof serverInfo.description, 'string');
    assert(Array.isArray(serverInfo.capabilities));

    // Validate protocol version format
    assert.strictEqual(serverInfo.protocolVersion, '2025-06-18');

    // Validate version format (semver)
    assert(serverInfo.version.match(/^\d+\.\d+\.\d+$/));
  });

  test('should generate valid server health status', () => {
    // Set global startTime for testing
    global.startTime = Date.now() - 1000; // 1 second ago

    const health = getServerHealth();

    assert.strictEqual(typeof health, 'object');
    assert.strictEqual(typeof health.status, 'string');
    assert.strictEqual(typeof health.uptime, 'number');
    assert.strictEqual(typeof health.timestamp, 'string');
    assert.strictEqual(typeof health.version, 'string');

    assert.strictEqual(health.status, 'healthy');
    assert(health.uptime >= 1000); // At least 1 second
    assert.strictEqual(health.version, serverInfo.version);

    // Validate ISO timestamp
    assert(new Date(health.timestamp).toISOString() === health.timestamp);
  });
});

describe('MCP Tool Definitions Module', () => {
  test('should export valid tool definitions', () => {
    assert.strictEqual(typeof tools, 'object');

    // Check required tools exist
    const requiredTools = [
      'mane_registry_status',
      'mane_register_tool',
      'mane_discover_tools',
      'mane_quality_gate'
    ];

    for (const toolName of requiredTools) {
      assert(toolName in tools, `Tool ${toolName} should exist`);

      const tool = tools[toolName];
      assert.strictEqual(typeof tool.name, 'string');
      assert.strictEqual(typeof tool.description, 'string');
      assert.strictEqual(typeof tool.inputSchema, 'object');
      assert.strictEqual(tool.inputSchema.type, 'object');
    }
  });

  test('should provide utility functions', () => {
    const toolNames = getToolNames();
    assert(Array.isArray(toolNames));
    assert(toolNames.length > 0);

    // Test getTool function
    const firstTool = getTool(toolNames[0]);
    assert.strictEqual(typeof firstTool, 'object');
    assert.strictEqual(firstTool.name, toolNames[0]);

    // Test validateToolName function
    assert.strictEqual(validateToolName(toolNames[0]), true);
    assert.strictEqual(validateToolName('nonexistent_tool'), false);
  });

  test('should have valid input schemas', () => {
    const toolNames = getToolNames();

    for (const toolName of toolNames) {
      const tool = getTool(toolName);
      const schema = tool.inputSchema;

      // Basic schema validation
      assert.strictEqual(schema.type, 'object');
      assert.strictEqual(typeof schema.properties, 'object');
      assert.strictEqual(schema.additionalProperties, false);

      // Validate properties have types
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        assert.strictEqual(typeof propSchema.type, 'string');
      }
    }
  });
});

describe('MCP Tool Handlers Module', () => {
  test('should handle registry status requests', async () => {
    const result = await handleRegistryStatus();

    assert.strictEqual(typeof result, 'object');
    assert(Array.isArray(result.content));
    assert(result.content.length > 0);
    assert.strictEqual(result.content[0].type, 'text');

    // Parse the JSON response
    const response = JSON.parse(result.content[0].text);
    assert.strictEqual(typeof response.registry, 'object');
    assert.strictEqual(typeof response.registry.status, 'string');
    assert.strictEqual(typeof response.registry.totalTools, 'number');
    assert.strictEqual(typeof response.timestamp, 'string');
  });

  test('should handle registry status with health details', async () => {
    const result = await handleRegistryStatus({ includeHealthDetails: true });

    const response = JSON.parse(result.content[0].text);
    assert(Array.isArray(response.tools));
    assert(response.tools.length > 0);

    // Validate tool structure
    const tool = response.tools[0];
    assert.strictEqual(typeof tool.name, 'string');
    assert.strictEqual(typeof tool.category, 'string');
    assert.strictEqual(typeof tool.healthy, 'boolean');
    assert.strictEqual(typeof tool.endpoint, 'string');
  });

  test('should handle tool registration requests', async () => {
    const toolConfig = {
      name: 'test_tool',
      endpoint: '/test',
      description: 'Test tool',
      schema: { type: 'object' }
    };

    const result = await handleRegisterTool({ toolConfig });

    assert.strictEqual(typeof result, 'object');
    assert(Array.isArray(result.content));

    const response = JSON.parse(result.content[0].text);
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.tool.name, 'test_tool');
    assert.strictEqual(response.tool.status, 'registered');
  });

  test('should reject invalid tool registration', async () => {
    try {
      await handleRegisterTool({ toolConfig: { name: 'incomplete' } });
      assert.fail('Should have thrown error for incomplete tool config');
    } catch (error) {
      assert(error.message.includes('Missing required fields'));
    }
  });

  test('should handle tool discovery requests', async () => {
    const result = await handleDiscoverTools();

    assert.strictEqual(typeof result, 'object');
    assert(Array.isArray(result.content));

    const response = JSON.parse(result.content[0].text);
    assert.strictEqual(typeof response.discovered, 'number');
    assert.strictEqual(typeof response.total, 'number');
    assert(Array.isArray(response.tools));
    assert(response.tools.length > 0);

    // Validate tool structure
    const tool = response.tools[0];
    assert.strictEqual(typeof tool.name, 'string');
    assert.strictEqual(typeof tool.category, 'string');
    assert.strictEqual(typeof tool.endpoint, 'string');
    assert.strictEqual(typeof tool.description, 'string');
    assert.strictEqual(typeof tool.healthy, 'boolean');
  });

  test('should handle filtered tool discovery', async () => {
    const result = await handleDiscoverTools({
      filter: { category: 'browser' },
      includeMetadata: true
    });

    const response = JSON.parse(result.content[0].text);
    assert(response.tools.every(tool => tool.category === 'browser'));

    // With metadata, should include additional fields
    const tool = response.tools[0];
    assert.strictEqual(typeof tool.capabilities, 'object');
    assert.strictEqual(typeof tool.version, 'string');
  });

  test('should handle quality gate validation', async () => {
    const result = await handleQualityGate({ target: 'test_component' });

    assert.strictEqual(typeof result, 'object');
    assert(Array.isArray(result.content));

    const response = JSON.parse(result.content[0].text);
    assert.strictEqual(typeof response.target, 'string');
    assert.strictEqual(typeof response.overall, 'object');
    assert.strictEqual(typeof response.overall.passed, 'boolean');
    assert.strictEqual(typeof response.overall.score, 'number');
    assert.strictEqual(typeof response.gates, 'object');
  });

  test('should handle strict quality gate validation', async () => {
    const result = await handleQualityGate({
      target: 'test_component',
      strict: true,
      gates: ['performance', 'security']
    });

    const response = JSON.parse(result.content[0].text);
    assert.strictEqual(response.overall.mode, 'strict');

    // Should only include requested gates
    const gateNames = Object.keys(response.gates);
    assert(gateNames.includes('performance'));
    assert(gateNames.includes('security'));
    assert(!gateNames.includes('interface-compliance'));
  });

  test('should reject quality gate without target', async () => {
    try {
      await handleQualityGate({});
      assert.fail('Should have thrown error for missing target');
    } catch (error) {
      assert(error.message.includes('target is required'));
    }
  });
});

describe('MCP Module Integration', () => {
  test('should work together as integrated system', async () => {
    // Test that all modules can be imported and used together
    assert.strictEqual(typeof serverInfo, 'object');
    assert.strictEqual(typeof tools, 'object');

    const toolNames = getToolNames();
    assert(toolNames.length > 0);

    // Each tool should have a corresponding handler
    for (const toolName of toolNames) {
      assert(validateToolName(toolName), `Tool ${toolName} should be valid`);

      const tool = getTool(toolName);
      assert.strictEqual(typeof tool, 'object');
      assert.strictEqual(tool.name, toolName);
    }
  });

  test('should maintain consistent data formats', async () => {
    // Test that all handlers return consistent content format
    const registryResult = await handleRegistryStatus();
    const discoveryResult = await handleDiscoverTools();
    const qualityResult = await handleQualityGate({ target: 'test' });

    // All should have same content structure
    for (const result of [registryResult, discoveryResult, qualityResult]) {
      assert.strictEqual(typeof result, 'object');
      assert(Array.isArray(result.content));
      assert(result.content.length > 0);
      assert.strictEqual(result.content[0].type, 'text');

      // Content should be valid JSON
      assert.doesNotThrow(() => {
        JSON.parse(result.content[0].text);
      });
    }
  });
});