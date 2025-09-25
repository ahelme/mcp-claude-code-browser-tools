#!/usr/bin/env node

/**
 * Chrome Extension Validation Script
 * Checks for common issues that prevent Chrome extensions from loading
 */

const fs = require('fs');
const path = require('path');

const extensionDir = __dirname;
const errors = [];
const warnings = [];

console.log('🔍 Validating Chrome Extension Structure...\n');

// Check manifest.json
try {
  const manifestPath = path.join(extensionDir, 'manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  console.log('✅ manifest.json is valid JSON');

  // Check required manifest fields
  if (!manifest.manifest_version) {
    errors.push('manifest.json missing required field: manifest_version');
  } else if (manifest.manifest_version !== 3) {
    warnings.push(`manifest_version is ${manifest.manifest_version}, Chrome recommends version 3`);
  }

  if (!manifest.name) {
    errors.push('manifest.json missing required field: name');
  }

  if (!manifest.version) {
    errors.push('manifest.json missing required field: version');
  }

  // Check background service worker
  if (manifest.background) {
    if (manifest.background.service_worker) {
      const bgPath = path.join(extensionDir, manifest.background.service_worker);
      if (!fs.existsSync(bgPath)) {
        errors.push(`Background service worker not found: ${manifest.background.service_worker}`);
      } else {
        console.log(`✅ Background service worker exists: ${manifest.background.service_worker}`);
      }
    }
  }

  // Check devtools page
  if (manifest.devtools_page) {
    const devtoolsPath = path.join(extensionDir, manifest.devtools_page);
    if (!fs.existsSync(devtoolsPath)) {
      errors.push(`DevTools page not found: ${manifest.devtools_page}`);
    } else {
      console.log(`✅ DevTools page exists: ${manifest.devtools_page}`);
    }
  }

} catch (error) {
  errors.push(`Error reading/parsing manifest.json: ${error.message}`);
}

// Check all JavaScript files for syntax errors
const jsFiles = [
  'background.js',
  'devtools.js',
  'panel.js',
  'websocket.js',
  'navigation.js',
  'interactions.js',
  'screenshot.js'
];

console.log('\n📝 Checking JavaScript files...');
for (const file of jsFiles) {
  const filePath = path.join(extensionDir, file);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Basic syntax check - try to parse as a module
      new Function(content);
      console.log(`✅ ${file} - syntax OK`);
    } catch (error) {
      errors.push(`Syntax error in ${file}: ${error.message.split('\n')[0]}`);
    }
  } else {
    warnings.push(`File not found: ${file}`);
  }
}

// Check HTML files
const htmlFiles = [
  'devtools.html',
  'panel.html'
];

console.log('\n📄 Checking HTML files...');
for (const file of htmlFiles) {
  const filePath = path.join(extensionDir, file);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Check for basic HTML structure
      if (!content.includes('<!DOCTYPE html>') && !content.includes('<!doctype html>')) {
        warnings.push(`${file} missing DOCTYPE declaration`);
      }
      if (!content.includes('<html')) {
        warnings.push(`${file} missing <html> tag`);
      }
      console.log(`✅ ${file} exists`);
    } catch (error) {
      errors.push(`Error reading ${file}: ${error.message}`);
    }
  } else {
    errors.push(`Required HTML file not found: ${file}`);
  }
}

// Check for required icons
console.log('\n🎨 Checking icons...');
const iconPath = path.join(extensionDir, 'icons', 'icon16.png');
if (fs.existsSync(iconPath)) {
  console.log('✅ Required icon found: icons/icon16.png');
} else {
  warnings.push('Icon not found: icons/icon16.png (referenced in devtools.js)');
}

// Print results
console.log('\n' + '='.repeat(50));
console.log('VALIDATION RESULTS');
console.log('='.repeat(50));

if (errors.length === 0) {
  console.log('\n✅ No critical errors found!');
  console.log('The extension structure appears to be valid.');
} else {
  console.log('\n❌ CRITICAL ERRORS FOUND:');
  errors.forEach(error => console.log(`  • ${error}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(`  • ${warning}`));
}

console.log('\n📦 NEXT STEPS:');
console.log('1. If there are no critical errors, the issue may be:');
console.log('   • Extension needs to be reloaded in Chrome');
console.log('   • Chrome cache needs to be cleared');
console.log('   • Permissions issue with the extension directory');
console.log('\n2. To reload the extension in Chrome:');
console.log('   • Open chrome://extensions/');
console.log('   • Enable Developer mode');
console.log('   • Click "Load unpacked" and select the chrome-extension directory');
console.log('   • Or click the refresh icon on the existing extension card');

process.exit(errors.length > 0 ? 1 : 0);