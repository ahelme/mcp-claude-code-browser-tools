#!/usr/bin/env node

/**
 * 🦁 MANE XML CLI Tool
 * Command-line interface for MANE XML configuration processing
 *
 * Usage:
 *   node mane-xml-cli.js load <xml-file>
 *   node mane-xml-cli.js validate <xml-file>
 *   node mane-xml-cli.js batch <batch-id> [--commands] [--test-checklist]
 *   node mane-xml-cli.js agent <agent-id>
 *   node mane-xml-cli.js context
 *   node mane-xml-cli.js status
 */

const { MANEXMLProcessor } = require('./mane-xml-processor.js');
const fs = require('fs').promises;
const path = require('path');

class MANEXMLCli {
  constructor() {
    this.processor = new MANEXMLProcessor();
    this.xmlFile = null;
  }

  async run() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      this.showHelp();
      return;
    }

    const command = args[0];

    try {
      switch (command) {
        case 'load':
          await this.loadCommand(args[1]);
          break;
        case 'validate':
          await this.validateCommand(args[1]);
          break;
        case 'batch':
          await this.batchCommand(args[1], args.slice(2));
          break;
        case 'agent':
          await this.agentCommand(args[1]);
          break;
        case 'context':
          await this.contextCommand();
          break;
        case 'status':
          await this.statusCommand();
          break;
        case 'generate-integration':
          await this.generateIntegrationCommand(args[1], args.slice(2));
          break;
        case 'demo':
          await this.demoCommand();
          break;
        default:
          console.error(`❌ Unknown command: ${command}`);
          this.showHelp();
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  async loadCommand(xmlFile) {
    if (!xmlFile) {
      console.error('❌ Please specify an XML file to load');
      return;
    }

    console.log('🦁 MANE XML Processor - Load Command');
    console.log('=====================================\n');

    this.xmlFile = xmlFile;
    const project = await this.processor.loadProject(xmlFile);

    console.log('✅ Project Loaded Successfully!\n');
    console.log(`📋 Project: ${project.metadata.name}`);
    console.log(`📝 Description: ${project.metadata.description}`);
    console.log(`🔢 Version: ${project.metadata.version}`);
    console.log(`🏗️ Methodology: ${project.metadata.methodology}`);
    console.log(`🚀 Deployment Model: ${project.metadata['deployment-model']}\n`);

    const status = this.processor.getProjectStatus();
    console.log(`📊 Project Status:`);
    console.log(`   Total Batches: ${status.totalBatches}`);
    console.log(`   Completed: ${status.completedBatches}`);
    console.log(`   Progress: ${status.completionPercentage}%`);
    console.log(`   Current Phase: ${status.currentPhase}`);
    console.log(`   Next Milestone: ${status.nextMilestone}\n`);
  }

  async validateCommand(xmlFile) {
    if (!xmlFile) {
      console.error('❌ Please specify an XML file to validate');
      return;
    }

    console.log('🦁 MANE XML Processor - Validation');
    console.log('==================================\n');

    this.xmlFile = xmlFile;
    await this.processor.loadProject(xmlFile);
    const validation = this.processor.validateProject();

    if (validation.isValid) {
      console.log('✅ XML Configuration is Valid!\n');
    } else {
      console.log('❌ XML Configuration has Errors:\n');
      validation.errors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
      console.log('');
    }

    if (validation.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      validation.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
      console.log('');
    }

    if (validation.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      validation.recommendations.forEach(rec => {
        console.log(`   💡 ${rec}`);
      });
      console.log('');
    }
  }

  async batchCommand(batchId, flags) {
    if (!batchId) {
      console.error('❌ Please specify a batch ID');
      return;
    }

    await this.ensureProjectLoaded();

    console.log(`🦁 MANE Batch Analysis - Batch ${batchId}`);
    console.log('======================================\n');

    const mapping = this.processor.getBatchMapping(batchId);

    console.log(`📦 Batch Information:`);
    console.log(`   ID: batch-${mapping.batchId}`);
    console.log(`   Name: ${mapping.name}`);
    console.log(`   Description: ${mapping.description}`);
    console.log(`   Status: ${mapping.status}`);
    console.log(`   Priority: ${mapping.priority}`);
    console.log(`   Strategy: ${mapping.strategy}\n`);

    console.log(`🤖 Agents (${mapping.agents.length}):`);
    mapping.agents.forEach(agentId => {
      const agent = this.processor.getAgentUniverse(agentId);
      console.log(`   ${agent.emoji} ${agent.name} (${agent.specialization})`);
      console.log(`      Status: ${agent.status} | Priority: ${agent.priority}`);
    });
    console.log('');

    console.log(`🌌 Universes (${mapping.universes.length}):`);
    mapping.universes.forEach(universe => {
      console.log(`   📁 ${universe}`);
    });
    console.log('');

    if (mapping.dependencies.length > 0) {
      console.log(`📋 Dependencies:`);
      mapping.dependencies.forEach(dep => {
        console.log(`   📌 ${dep}`);
      });
      console.log('');
    }

    if (flags.includes('--commands')) {
      console.log(`⚡ Integration Commands:`);
      const commands = this.processor.generateIntegrationCommands(batchId, {
        verbose: flags.includes('--verbose'),
        dryRun: flags.includes('--dry-run')
      });

      Object.entries(commands).forEach(([name, command]) => {
        console.log(`   ${name}: ${command}`);
      });
      console.log('');
    }

    if (flags.includes('--test-checklist')) {
      console.log(`🧪 User Testing Checklist:`);
      const checklist = this.processor.generateUserTestingChecklist(batchId);

      console.log(`   Duration: ${checklist.estimatedDuration}`);
      console.log(`   Prerequisites:`);
      checklist.prerequisites.forEach(prereq => {
        console.log(`     ✓ ${prereq}`);
      });
      console.log('');

      checklist.testCategories.forEach(category => {
        console.log(`   ${category.agentEmoji} ${category.agentName}:`);
        category.tests.forEach(test => {
          console.log(`     🔧 ${test.toolName} (${test.status})`);
          console.log(`        Command: ${test.mcpToolName}`);
          console.log(`        Expected: ${test.testCommands[test.toolName].expectedResult}`);
          if (test.knownIssues.length > 0) {
            console.log(`        Issues: ${test.knownIssues.join(', ')}`);
          }
        });
        console.log('');
      });
    }
  }

  async agentCommand(agentId) {
    if (!agentId) {
      console.error('❌ Please specify an agent ID');
      return;
    }

    await this.ensureProjectLoaded();

    console.log(`🤖 MANE Agent Analysis - ${agentId}`);
    console.log('====================================\n');

    const agent = this.processor.getAgentUniverse(agentId);

    console.log(`${agent.emoji} ${agent.name}`);
    console.log(`   Specialization: ${agent.specialization}`);
    console.log(`   Batch: ${agent.batch}`);
    console.log(`   Status: ${agent.status}`);
    console.log(`   Priority: ${agent.priority}\n`);

    if (agent.capabilities.length > 0) {
      console.log(`🎯 Capabilities:`);
      agent.capabilities.forEach(capability => {
        console.log(`   ✓ ${capability}`);
      });
      console.log('');
    }

    if (agent.targetTools.length > 0) {
      console.log(`🔧 Target Tools:`);
      agent.targetTools.forEach(tool => {
        console.log(`   🛠️  ${tool.name} (${tool.status})`);
        console.log(`      Description: ${tool.description}`);
        if (tool['mcp-tool-name']) {
          console.log(`      MCP Tool: ${tool['mcp-tool-name']}`);
        }
        if (tool['known-issues']) {
          console.log(`      Issues: ${tool['known-issues'].issue.join(', ')}`);
        }
      });
      console.log('');
    }

    if (agent.workspace) {
      console.log(`📁 Workspace:`);
      console.log(`   Universe Path: ${agent.workspace['universe-path']}`);
      console.log(`   Branch: ${agent.workspace['branch-name']}`);
      if (agent.workspace['implementation-location']) {
        console.log(`   Implementation: ${agent.workspace['implementation-location']}`);
      }
      console.log('');
    }

    if (agent.responsibilities.length > 0) {
      console.log(`📋 Responsibilities:`);
      agent.responsibilities.forEach(resp => {
        const priority = resp.priority ? ` (${resp.priority})` : '';
        console.log(`   📌 ${resp._}${priority}`);
      });
      console.log('');
    }
  }

  async contextCommand() {
    await this.ensureProjectLoaded();

    console.log('📚 MANE Essential Context');
    console.log('=========================\n');

    const context = this.processor.getEssentialContext();

    console.log(`🎯 Project Overview:`);
    console.log(`   Purpose: ${context.projectOverview.purpose}\n`);

    console.log(`📋 Goals (${context.projectOverview.goals.length}):`);
    context.projectOverview.goals.forEach(goal => {
      console.log(`   ${goal.priority.toUpperCase()}: ${goal.description}`);
    });
    console.log('');

    console.log(`⚠️  Constraints (${context.projectOverview.constraints.length}):`);
    context.projectOverview.constraints.forEach(constraint => {
      console.log(`   ${constraint.type}: ${constraint.description}`);
    });
    console.log('');

    console.log(`🏗️  Architecture:`);
    console.log(`   Communication Flow:`);
    context.technicalArchitecture.communicationFlow.forEach((step, index) => {
      console.log(`     ${index + 1}. ${step}`);
    });
    console.log('');

    console.log(`🔌 Key Contracts (${context.technicalArchitecture.keyContracts.length}):`);
    context.technicalArchitecture.keyContracts.forEach(contract => {
      console.log(`   📄 ${contract.name}: ${contract.description}`);
    });
    console.log('');

    console.log(`🚨 Known Issues (${context.developmentContext.knownIssues.length}):`);
    context.developmentContext.knownIssues.forEach(issue => {
      console.log(`   ${issue.severity.toUpperCase()}: ${issue._} (${issue.tool})`);
    });
    console.log('');
  }

  async statusCommand() {
    await this.ensureProjectLoaded();

    console.log('📊 MANE Project Status');
    console.log('=====================\n');

    const status = this.processor.getProjectStatus();
    const context = this.processor.getEssentialContext();

    console.log(`📈 Overall Progress:`);
    console.log(`   Completion: ${status.completionPercentage}%`);
    console.log(`   Batches: ${status.completedBatches}/${status.totalBatches}`);
    console.log(`   Current Phase: ${status.currentPhase}`);
    console.log(`   Next Milestone: ${status.nextMilestone}\n`);

    // Tool status breakdown
    const workingTools = context.developmentContext.currentStatus['working-tools'];
    const brokenTools = context.developmentContext.currentStatus['broken-tools'];

    console.log(`🛠️  Tools Status:`);
    console.log(`   Working: ${workingTools.count}/9`);
    console.log(`   Broken: ${brokenTools.count}/9`);
    console.log(`   Overall: ${Math.round((workingTools.count / 9) * 100)}% functional\n`);

    console.log(`✅ Working Tools:`);
    workingTools.tool.forEach(tool => {
      console.log(`   🟢 ${tool.name} (${tool.agent})`);
    });
    console.log('');

    console.log(`❌ Broken Tools:`);
    brokenTools.tool.forEach(tool => {
      console.log(`   🔴 ${tool.name} (${tool.severity}) - ${tool.agent}`);
    });
    console.log('');

    // Batch status
    console.log(`📦 Batch Status:`);
    for (let i = 1; i <= 4; i++) {
      try {
        const mapping = this.processor.getBatchMapping(i);
        const statusIcon = mapping.status === 'completed' ? '✅' :
                          mapping.status === 'in-progress' ? '🔄' : '⏳';
        console.log(`   ${statusIcon} Batch ${i}: ${mapping.name} (${mapping.status})`);
      } catch (error) {
        console.log(`   ❓ Batch ${i}: Not found`);
      }
    }
    console.log('');
  }

  async generateIntegrationCommand(batchId, flags) {
    if (!batchId) {
      console.error('❌ Please specify a batch ID');
      return;
    }

    await this.ensureProjectLoaded();

    console.log(`⚡ MANE Integration Commands - Batch ${batchId}`);
    console.log('==========================================\n');

    const options = {
      dryRun: flags.includes('--dry-run'),
      verbose: flags.includes('--verbose'),
      createBackup: !flags.includes('--no-backup'),
      testFirst: !flags.includes('--no-test')
    };

    const commands = this.processor.generateIntegrationCommands(batchId, options);

    console.log('🚀 Generated Commands:\n');
    Object.entries(commands).forEach(([name, command]) => {
      console.log(`${name.padEnd(12)}: ${command}`);
    });
    console.log('');

    console.log('💡 Usage Example:');
    console.log(`   # Analyze before integrating`);
    console.log(`   ${commands.discovery}`);
    console.log(`   ${commands.validate}`);
    console.log('');
    console.log(`   # Perform integration with testing`);
    console.log(`   ${commands.integrate}`);
    console.log('');
    console.log(`   # Validate results`);
    console.log(`   ${commands.test}`);
    console.log(`   ${commands.status}`);
    console.log('');
  }

  async demoCommand() {
    console.log('🦁 MANE XML Processor Demo');
    console.log('==========================\n');

    const xmlFile = path.join(__dirname, '../browser-tools-mane-project.xml');

    try {
      await fs.access(xmlFile);
    } catch (error) {
      console.error(`❌ Demo XML file not found: ${xmlFile}`);
      console.log('   Please ensure browser-tools-mane-project.xml exists in the project root.');
      return;
    }

    console.log('🔍 Running comprehensive demo with browser-tools-mane-project.xml\n');

    // Load project
    console.log('1️⃣  Loading project...');
    await this.loadCommand(xmlFile);

    // Validate
    console.log('2️⃣  Validating configuration...');
    await this.validateCommand(xmlFile);

    // Show batch 3 (Core Tools)
    console.log('3️⃣  Analyzing Batch 3 (Core Tools)...');
    await this.batchCommand('3', ['--commands']);

    // Show agent details
    console.log('4️⃣  Analyzing Navigation Agent...');
    await this.agentCommand('agent-g-navigation');

    // Show overall status
    console.log('5️⃣  Project status overview...');
    await this.statusCommand();

    console.log('✨ Demo completed! The MANE XML system provides complete');
    console.log('   declarative configuration for AI collaborative development.');
  }

  async ensureProjectLoaded() {
    if (!this.processor.project) {
      // Try to load default project file
      const defaultFile = path.join(__dirname, '../browser-tools-mane-project.xml');
      try {
        await fs.access(defaultFile);
        await this.processor.loadProject(defaultFile);
        console.log('📁 Loaded default project configuration\n');
      } catch (error) {
        throw new Error('No project loaded. Use "load <xml-file>" command first.');
      }
    }
  }

  showHelp() {
    console.log('🦁 MANE XML CLI Tool');
    console.log('====================\n');
    console.log('Usage:');
    console.log('  node mane-xml-cli.js load <xml-file>           Load and display project info');
    console.log('  node mane-xml-cli.js validate <xml-file>       Validate XML configuration');
    console.log('  node mane-xml-cli.js batch <id> [flags]        Analyze specific batch');
    console.log('  node mane-xml-cli.js agent <id>                Analyze specific agent');
    console.log('  node mane-xml-cli.js context                   Show essential context');
    console.log('  node mane-xml-cli.js status                    Show project status');
    console.log('  node mane-xml-cli.js generate-integration <id> Generate integration commands');
    console.log('  node mane-xml-cli.js demo                      Run comprehensive demo');
    console.log('');
    console.log('Batch flags:');
    console.log('  --commands                                     Show integration commands');
    console.log('  --test-checklist                               Generate user testing checklist');
    console.log('');
    console.log('Integration flags:');
    console.log('  --dry-run                                      Dry run mode');
    console.log('  --verbose                                      Verbose output');
    console.log('  --no-backup                                    Skip backup creation');
    console.log('  --no-test                                      Skip testing');
    console.log('');
    console.log('Examples:');
    console.log('  node mane-xml-cli.js demo');
    console.log('  node mane-xml-cli.js load browser-tools-mane-project.xml');
    console.log('  node mane-xml-cli.js batch 3 --commands --test-checklist');
    console.log('  node mane-xml-cli.js generate-integration 3 --dry-run --verbose');
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new MANEXMLCli();
  cli.run().catch(error => {
    console.error(`❌ CLI Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = MANEXMLCli;