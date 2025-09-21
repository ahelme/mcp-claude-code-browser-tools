#!/usr/bin/env node

/**
 * Test Script for Browser Interactions
 *
 * Tests the browser_click, browser_type, and browser_wait functionality
 * through the MCP server endpoints.
 */

import fetch from 'node-fetch';

const MCP_SERVER_URL = 'http://localhost:3024';

// Test configuration
const TEST_URL = 'file:///Users/lennox/development/browser-tools-setup/chrome-extension-mvp/test-interactions.html';

async function testNavigate() {
  console.log('🧭 Testing navigation...');

  try {
    const response = await fetch(`${MCP_SERVER_URL}/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: TEST_URL })
    });

    const result = await response.json();
    console.log('✅ Navigation result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Navigation failed:', error.message);
    return false;
  }
}

async function testClick() {
  console.log('🖱️ Testing click functionality...');

  const testCases = [
    { selector: '#simple-button', description: 'Simple button click' },
    { selector: '.special-button', description: 'Button with class click' },
    { selector: '#test-link', description: 'Link click' },
    { selector: '#div-button', description: 'Clickable div click' }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`  Testing: ${testCase.description}`);

      const response = await fetch(`${MCP_SERVER_URL}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selector: testCase.selector })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`  ✅ ${testCase.description} - SUCCESS`);
        console.log(`     Element: ${result.result?.elementInfo?.tagName} (${testCase.selector})`);
      } else {
        console.log(`  ❌ ${testCase.description} - FAILED: ${result.error}`);
      }
    } catch (error) {
      console.log(`  ❌ ${testCase.description} - ERROR: ${error.message}`);
    }
  }
}

async function testType() {
  console.log('⌨️ Testing type functionality...');

  const testCases = [
    {
      selector: '#simple-input',
      text: 'Hello World!',
      description: 'Type in simple input'
    },
    {
      selector: '#email-input',
      text: 'test@example.com',
      clear: true,
      description: 'Type email with clear'
    },
    {
      selector: '#textarea-input',
      text: 'This is a\\nmulti-line\\ntext input test.',
      description: 'Type in textarea'
    },
    {
      selector: '#contenteditable-div',
      text: 'This content was typed by automation!',
      clear: true,
      description: 'Type in contenteditable div'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`  Testing: ${testCase.description}`);

      const response = await fetch(`${MCP_SERVER_URL}/type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: testCase.selector,
          text: testCase.text,
          clear: testCase.clear || false
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`  ✅ ${testCase.description} - SUCCESS`);
        console.log(`     Element: ${result.result?.elementInfo?.tagName} (${testCase.selector})`);
        console.log(`     Final value: ${result.result?.elementInfo?.value?.substring(0, 50) || 'N/A'}...`);
      } else {
        console.log(`  ❌ ${testCase.description} - FAILED: ${result.error}`);
      }
    } catch (error) {
      console.log(`  ❌ ${testCase.description} - ERROR: ${error.message}`);
    }
  }
}

async function testWait() {
  console.log('⏳ Testing wait functionality...');

  // First, trigger the delayed element to appear
  console.log('  Triggering delayed element...');
  await fetch(`${MCP_SERVER_URL}/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selector: '#show-delayed-element' })
  });

  // Now test waiting for it
  const testCases = [
    {
      selector: '#delayed-element',
      timeout: 5000,
      description: 'Wait for delayed element (should appear)'
    },
    {
      selector: '#non-existent-element',
      timeout: 2000,
      description: 'Wait for non-existent element (should timeout)'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`  Testing: ${testCase.description}`);

      const startTime = Date.now();
      const response = await fetch(`${MCP_SERVER_URL}/wait`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: testCase.selector,
          timeout: testCase.timeout
        })
      });

      const result = await response.json();
      const elapsed = Date.now() - startTime;

      if (result.success) {
        console.log(`  ✅ ${testCase.description} - SUCCESS`);
        console.log(`     Wait time: ${result.result?.waitTime || elapsed}ms`);
        console.log(`     Element visible: ${result.result?.visible || 'unknown'}`);
      } else {
        console.log(`  ❌ ${testCase.description} - FAILED: ${result.error}`);
        console.log(`     Elapsed time: ${elapsed}ms`);
      }
    } catch (error) {
      console.log(`  ❌ ${testCase.description} - ERROR: ${error.message}`);
    }
  }
}

async function testHealthCheck() {
  console.log('🔍 Checking server health...');

  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`);
    const result = await response.json();

    console.log('✅ Server health:', result);
    return result.connected;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Browser Interactions Test Suite');
  console.log('=' .repeat(50));

  // Check server health first
  const serverHealthy = await testHealthCheck();
  if (!serverHealthy) {
    console.log('❌ Server not healthy or extension not connected. Aborting tests.');
    return;
  }

  console.log('');

  // Navigate to test page
  const navigated = await testNavigate();
  if (!navigated) {
    console.log('❌ Navigation failed. Aborting tests.');
    return;
  }

  // Wait a moment for page to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('');
  await testClick();

  console.log('');
  await testType();

  console.log('');
  await testWait();

  console.log('');
  console.log('🎉 Test suite completed!');
  console.log('=' .repeat(50));

  console.log('');
  console.log('📋 Manual Testing Instructions:');
  console.log('1. Open the test page in your browser:');
  console.log(`   ${TEST_URL}`);
  console.log('2. Open DevTools and go to the Browser Tools panel');
  console.log('3. Test interactions manually using the UI');
  console.log('4. Check the console logs for detailed interaction results');
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});