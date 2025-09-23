#!/usr/bin/env node

/**
 * MANE Universe Doctor
 *
 * Health check CLI for all MANE agent universes
 * Usage: node scripts/universe-doctor.js [options]
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
const UNIVERSES_DIR = resolve(PROJECT_ROOT, '..', 'mane-universes');

// ANSI colors for terminal output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function execSilent(command, cwd = PROJECT_ROOT) {
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    return null;
  }
}

function getContractVersion() {
  try {
    const packagePath = resolve(PROJECT_ROOT, 'package.json');
    if (existsSync(packagePath)) {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
      return pkg.version || '1.0.0';
    }
  } catch (error) {
    // Fallback to git tag
    const gitTag = execSilent('git describe --tags --abbrev=0');
    return gitTag || '1.0.0';
  }
  return '1.0.0';
}

function getWorktreeInfo() {
  const worktreesOutput = execSilent('git worktree list --porcelain');
  if (!worktreesOutput) return [];

  const worktrees = [];
  const lines = worktreesOutput.split('\n');
  let current = {};

  for (const line of lines) {
    if (line.startsWith('worktree ')) {
      if (current.path) worktrees.push(current);
      current = { path: line.substring(9) };
    } else if (line.startsWith('HEAD ')) {
      current.head = line.substring(5);
    } else if (line.startsWith('branch ')) {
      current.branch = line.substring(7);
    } else if (line === 'detached') {
      current.detached = true;
    }
  }
  if (current.path) worktrees.push(current);

  return worktrees.filter(wt => wt.path.includes('mane-universes'));
}

function checkUniverseHealth(universePath, branch) {
  const health = {
    path: universePath,
    branch,
    exists: existsSync(universePath),
    status: 'unknown',
    lastRebase: null,
    contractVersion: null,
    cleanWorkingTree: false,
    behindMain: 0,
    aheadMain: 0,
    hasTests: false,
    testsPassing: null,
    lintPassing: null
  };

  if (!health.exists) {
    health.status = 'missing';
    return health;
  }

  try {
    // Check if working tree is clean
    const statusOutput = execSilent('git status --porcelain', universePath);
    health.cleanWorkingTree = !statusOutput || statusOutput.length === 0;

    // Check commits ahead/behind main
    const revList = execSilent('git rev-list --left-right --count main...HEAD', universePath);
    if (revList) {
      const [behind, ahead] = revList.split('\t').map(Number);
      health.behindMain = behind || 0;
      health.aheadMain = ahead || 0;
    }

    // Check last rebase/merge from main
    const lastMerge = execSilent('git log --oneline --grep="Merge\\|rebase" -n 1 --format="%cr"', universePath);
    health.lastRebase = lastMerge || 'never';

    // Check for tests
    health.hasTests = existsSync(resolve(universePath, 'package.json')) ||
                      existsSync(resolve(universePath, 'tests')) ||
                      existsSync(resolve(universePath, 'test'));

    // Try to run tests if they exist
    if (health.hasTests) {
      const testResult = execSilent('npm test', universePath) ||
                        execSilent('yarn test', universePath) ||
                        execSilent('node --test', universePath);
      health.testsPassing = testResult !== null;
    }

    // Check linting
    const lintResult = execSilent('npm run lint', universePath) ||
                      execSilent('npx eslint .', universePath) ||
                      execSilent('npx prettier --check .', universePath);
    health.lintPassing = lintResult !== null;

    // Determine overall status
    if (!health.cleanWorkingTree) {
      health.status = 'dirty';
    } else if (health.behindMain > 10) {
      health.status = 'stale';
    } else if (health.testsPassing === false || health.lintPassing === false) {
      health.status = 'failing';
    } else if (health.aheadMain > 0) {
      health.status = 'ready';
    } else {
      health.status = 'synced';
    }

  } catch (error) {
    health.status = 'error';
    health.error = error.message;
  }

  return health;
}

function getStatusIcon(status) {
  switch (status) {
    case 'ready': return colorize('✅', 'green');
    case 'synced': return colorize('🔄', 'blue');
    case 'dirty': return colorize('⚠️', 'yellow');
    case 'stale': return colorize('⏰', 'yellow');
    case 'failing': return colorize('❌', 'red');
    case 'missing': return colorize('🚫', 'red');
    case 'error': return colorize('💥', 'red');
    default: return colorize('❓', 'yellow');
  }
}

function formatUniverseReport(health) {
  const icon = getStatusIcon(health.status);
  const branchName = colorize(health.branch || 'unknown', 'cyan');
  const statusText = colorize(health.status.toUpperCase(),
    health.status === 'ready' ? 'green' :
    health.status === 'synced' ? 'blue' :
    health.status === 'failing' || health.status === 'missing' ? 'red' : 'yellow'
  );

  let details = [];

  if (health.behindMain > 0) {
    details.push(colorize(`${health.behindMain} behind main`, 'yellow'));
  }
  if (health.aheadMain > 0) {
    details.push(colorize(`${health.aheadMain} ahead`, 'green'));
  }
  if (!health.cleanWorkingTree) {
    details.push(colorize('dirty working tree', 'red'));
  }
  if (health.hasTests) {
    const testStatus = health.testsPassing ?
      colorize('tests ✓', 'green') :
      colorize('tests ✗', 'red');
    details.push(testStatus);
  }
  if (health.lintPassing !== null) {
    const lintStatus = health.lintPassing ?
      colorize('lint ✓', 'green') :
      colorize('lint ✗', 'red');
    details.push(lintStatus);
  }

  const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : '';
  const lastRebaseStr = health.lastRebase ? ` • Last sync: ${health.lastRebase}` : '';

  return `${icon} ${branchName} • ${statusText}${detailsStr}${lastRebaseStr}`;
}

function printSummary(universes) {
  const summary = {
    total: universes.length,
    ready: 0,
    synced: 0,
    issues: 0,
    missing: 0
  };

  universes.forEach(u => {
    switch (u.status) {
      case 'ready': summary.ready++; break;
      case 'synced': summary.synced++; break;
      case 'missing': summary.missing++; break;
      default: summary.issues++; break;
    }
  });

  console.log(colorize('\n📊 MANE Universe Summary', 'bold'));
  console.log(`${colorize('Total Universes:', 'blue')} ${summary.total}`);
  console.log(`${colorize('Ready for Integration:', 'green')} ${summary.ready}`);
  console.log(`${colorize('Synced with Main:', 'blue')} ${summary.synced}`);
  console.log(`${colorize('Issues Detected:', 'yellow')} ${summary.issues}`);
  console.log(`${colorize('Missing Universes:', 'red')} ${summary.missing}`);

  if (summary.issues > 0 || summary.missing > 0) {
    console.log(colorize('\n⚠️  Some universes need attention!', 'yellow'));
  } else if (summary.ready > 0) {
    console.log(colorize('\n🚀 Universes ready for integration!', 'green'));
  } else {
    console.log(colorize('\n✨ All universes in sync!', 'green'));
  }
}

function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const watch = args.includes('--watch') || args.includes('-w');

  console.log(colorize('🏥 MANE Universe Doctor', 'bold'));
  console.log(colorize('Checking health of all agent universes...\n', 'cyan'));

  const contractVersion = getContractVersion();
  console.log(`${colorize('Contract Version:', 'blue')} ${contractVersion}`);

  const worktrees = getWorktreeInfo();
  if (worktrees.length === 0) {
    console.log(colorize('\n❌ No MANE universes found!', 'red'));
    console.log(colorize('Run: git worktree add ../mane-universes/[agent-name] [branch]', 'yellow'));
    process.exit(1);
  }

  const universeHealths = worktrees.map(wt => {
    const branch = wt.branch || 'detached';
    return checkUniverseHealth(wt.path, branch);
  });

  // Sort by status priority (issues first, then ready, then synced)
  universeHealths.sort((a, b) => {
    const statusPriority = {
      'missing': 0, 'error': 1, 'failing': 2, 'dirty': 3, 'stale': 4, 'ready': 5, 'synced': 6
    };
    return statusPriority[a.status] - statusPriority[b.status];
  });

  console.log(colorize('\n🌌 Universe Status:', 'bold'));
  universeHealths.forEach(health => {
    console.log(`  ${formatUniverseReport(health)}`);
  });

  printSummary(universeHealths);

  // Actionable recommendations
  const problemUniverses = universeHealths.filter(u =>
    ['missing', 'error', 'failing', 'dirty', 'stale'].includes(u.status)
  );

  if (problemUniverses.length > 0) {
    console.log(colorize('\n🔧 Recommended Actions:', 'bold'));
    problemUniverses.forEach(u => {
      switch (u.status) {
        case 'missing':
          console.log(`  • Create universe: ${colorize(`git worktree add ${u.path} ${u.branch}`, 'cyan')}`);
          break;
        case 'dirty':
          console.log(`  • Clean ${u.branch}: ${colorize(`cd ${u.path} && git add . && git commit`, 'cyan')}`);
          break;
        case 'stale':
          console.log(`  • Update ${u.branch}: ${colorize(`cd ${u.path} && git rebase main`, 'cyan')}`);
          break;
        case 'failing':
          console.log(`  • Fix tests in ${u.branch}: ${colorize(`cd ${u.path} && npm test`, 'cyan')}`);
          break;
      }
    });
  }

  // Watch mode
  if (watch) {
    console.log(colorize('\n👀 Watching for changes... (Ctrl+C to stop)', 'cyan'));
    setInterval(() => {
      console.clear();
      main();
    }, 5000);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}