#!/usr/bin/env node

/**
 * Claude Response Sender Utility
 *
 * Allows Claude to send messages back to the user through the visual messaging system.
 *
 * Usage:
 *   node send-claude-message.mjs "Your message text here"
 *
 * Example:
 *   node send-claude-message.mjs "Great work on that feature! The tests are all passing now."
 */

import http from 'http';

const message = process.argv[2];

if (!message) {
  console.error('❌ Error: Message text is required');
  console.error('Usage: node send-claude-message.mjs "Your message here"');
  process.exit(1);
}

const data = JSON.stringify({
  text: message,
  screenshots: []
});

const options = {
  hostname: '127.0.0.1',
  port: 3024,
  path: '/send-response',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Message sent successfully!');
  } else {
    console.error(`❌ Failed with status ${res.statusCode}`);
  }

  let responseData = '';
  res.on('data', (chunk) => responseData += chunk);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error('Server response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('Make sure the HTTP bridge is running on port 3024');
});

req.write(data);
req.end();
