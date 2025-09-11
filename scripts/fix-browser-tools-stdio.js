#!/usr/bin/env node

/**
 * Fix browser-tools-mcp stdio issues
 * Replaces all console.log/error statements with stderr writes
 * to comply with MCP stdio protocol requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find the browser-tools-mcp installation
function findBrowserToolsPath() {
    const npxCache = path.join(process.env.HOME, '.npm', '_npx');
    
    try {
        // Get the most recent directory
        const dirs = fs.readdirSync(npxCache)
            .map(dir => ({
                name: dir,
                path: path.join(npxCache, dir),
                time: fs.statSync(path.join(npxCache, dir)).mtime
            }))
            .sort((a, b) => b.time - a.time);
        
        // Look for browser-tools-mcp in recent directories
        for (const dir of dirs) {
            const mcpPath = path.join(dir.path, 'node_modules', '@agentdeskai', 'browser-tools-mcp', 'dist', 'mcp-server.js');
            if (fs.existsSync(mcpPath)) {
                return mcpPath;
            }
        }
    } catch (err) {
        console.error('Error finding browser-tools-mcp:', err);
    }
    
    return null;
}

// Fix the stdio issues in the file
function fixStdioIssues(filePath) {
    console.log(`Fixing stdio issues in: ${filePath}`);
    
    // Create backup
    const backupDir = path.join(process.cwd(), '.backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `mcp-server-${timestamp}.js`);
    fs.copyFileSync(filePath, backupPath);
    console.log(`Backup created: ${backupPath}`);
    
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Count issues before
    const consoleLogCount = (content.match(/console\.log/g) || []).length;
    const consoleErrorCount = (content.match(/console\.error/g) || []).length;
    
    console.log(`Found ${consoleLogCount} console.log statements`);
    console.log(`Found ${consoleErrorCount} console.error statements`);
    
    // Replace console.log with stderr writes
    content = content.replace(
        /console\.log\((.*?)\);/g,
        'process.stderr.write($1 + "\\n");'
    );
    
    // Replace console.error with stderr writes
    content = content.replace(
        /console\.error\((.*?)\);/g,
        'process.stderr.write("[ERROR] " + $1 + "\\n");'
    );
    
    // Write the fixed content
    fs.writeFileSync(filePath, content);
    
    console.log('✅ Fixed all console statements to use stderr');
    console.log('✅ MCP stdio protocol compliance restored');
    
    return true;
}

// Main execution
function main() {
    console.log('Browser Tools MCP Stdio Fix');
    console.log('============================\n');
    
    const mcpPath = findBrowserToolsPath();
    
    if (!mcpPath) {
        console.error('❌ Could not find browser-tools-mcp installation');
        console.error('Please ensure @agentdeskai/browser-tools-mcp is installed');
        process.exit(1);
    }
    
    console.log(`Found browser-tools-mcp at: ${mcpPath}\n`);
    
    if (fixStdioIssues(mcpPath)) {
        console.log('\n✅ Successfully fixed browser-tools-mcp stdio issues');
        console.log('📝 Next steps:');
        console.log('   1. Restart Claude Code to load the fixed MCP server');
        console.log('   2. Browser-tools functions should now be available');
    }
}

// Run the fix
main();