#!/usr/bin/env node

/**
 * Comprehensive fix for browser-tools-mcp stdio issues
 * Properly handles template literals and all console statements
 */

const fs = require('fs');
const path = require('path');

// Find all browser-tools-mcp installations
function findAllBrowserToolsPaths() {
    const npxCache = path.join(process.env.HOME, '.npm', '_npx');
    const paths = [];
    
    try {
        const dirs = fs.readdirSync(npxCache);
        
        for (const dir of dirs) {
            const mcpPath = path.join(npxCache, dir, 'node_modules', '@agentdeskai', 'browser-tools-mcp', 'dist', 'mcp-server.js');
            if (fs.existsSync(mcpPath)) {
                paths.push(mcpPath);
            }
        }
    } catch (err) {
        console.error('Error finding browser-tools-mcp:', err);
    }
    
    return paths;
}

// Fix the stdio issues properly
function fixStdioComprehensive(filePath) {
    console.log(`\nFixing: ${filePath}`);
    
    // Create backup
    const backupDir = path.join(process.cwd(), '.backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const cacheName = path.basename(path.dirname(path.dirname(path.dirname(path.dirname(filePath)))));
    const backupPath = path.join(backupDir, `mcp-server-${cacheName}-${timestamp}.js`);
    
    // Read original file
    const original = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(backupPath, original);
    console.log(`  Backup: ${backupPath}`);
    
    // Split into lines for precise replacement
    const lines = original.split('\n');
    const fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Handle console.log statements
        if (line.includes('console.log(')) {
            // Extract the content between console.log( and );
            const match = line.match(/console\.log\((.*)\);?$/);
            if (match) {
                const content = match[1];
                // Check if it's a template literal or complex expression
                if (content.includes('`') || content.includes('${')) {
                    // Template literal - preserve as is
                    line = line.replace(/console\.log\(/, 'process.stderr.write(');
                    line = line.replace(/\);$/, ' + "\\n");');
                } else {
                    // Simple string
                    line = line.replace(/console\.log\((.*?)\);/, 'process.stderr.write($1 + "\\n");');
                }
            }
        }
        
        // Handle console.error statements
        if (line.includes('console.error(')) {
            const match = line.match(/console\.error\((.*)\);?$/);
            if (match) {
                const content = match[1];
                if (content.includes('`') || content.includes('${')) {
                    // Template literal
                    line = line.replace(/console\.error\(/, 'process.stderr.write("[ERROR] " + ');
                    line = line.replace(/\);$/, ' + "\\n");');
                } else {
                    // Simple string
                    line = line.replace(/console\.error\((.*?)\);/, 'process.stderr.write("[ERROR] " + $1 + "\\n");');
                }
            }
        }
        
        fixedLines.push(line);
    }
    
    // Write the fixed content
    const fixed = fixedLines.join('\n');
    fs.writeFileSync(filePath, fixed);
    
    // Count fixes
    const logCount = (original.match(/console\.log/g) || []).length;
    const errorCount = (original.match(/console\.error/g) || []).length;
    
    console.log(`  Fixed: ${logCount} console.log + ${errorCount} console.error statements`);
    
    return true;
}

// Main execution
function main() {
    console.log('Browser Tools MCP - Comprehensive Stdio Fix');
    console.log('===========================================');
    
    const paths = findAllBrowserToolsPaths();
    
    if (paths.length === 0) {
        console.error('\n❌ No browser-tools-mcp installations found');
        process.exit(1);
    }
    
    console.log(`\nFound ${paths.length} browser-tools-mcp installation(s)`);
    
    let successCount = 0;
    for (const path of paths) {
        if (fixStdioComprehensive(path)) {
            successCount++;
        }
    }
    
    if (successCount > 0) {
        console.log('\n✅ Successfully fixed all browser-tools-mcp installations');
        console.log('\n📝 Next steps:');
        console.log('   1. Restart Claude Code');
        console.log('   2. Browser-tools MCP functions should be available');
        console.log('   3. Test with mcp__browser-tools__* functions');
    }
}

// Run the fix
main();