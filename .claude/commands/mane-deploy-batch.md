# 🦁 MANE Deploy Batch Command
**XML-Powered Batch Deployment with Mandatory User Workflow Enforcement**

---allowed-tools: [github, task, read, write, edit, bash, glob, grep]

## Command Description

The `/mane-deploy-batch` command deploys a specific batch of MANE agents while **enforcing mandatory user workflow steps** to ensure proper foundation inheritance and dependency management. This command **ALWAYS** includes critical user interaction points for PR review and merge approval.

## Command Syntax

```bash
/mane-deploy-batch [batch-number] [options]
```

## Arguments

### Batch Number (Required)
- **batch=1**: Foundation Infrastructure (Agent A)
- **batch=2**: Framework Enhancement (Agent F)
- **batch=3**: Core Tools (Agents G, H, I - Navigation, Screenshot, Interaction)
- **batch=4**: Advanced Tools (Agents B, C, D, E - Evaluate, Audit, Console, Content)

### Options
- **--verify-dependencies**: Verify all prerequisite batches are merged (default: true)
- **--force-worktree-recreation**: Recreate worktrees to inherit latest merged code
- **--validate-foundation**: Ensure foundation contracts are available before deployment

## Mandatory User Workflow Enforcement

### 🚨 **CRITICAL WORKFLOW STEPS - ALWAYS ENFORCED**

#### **Phase 1: Pre-Deployment Validation**
1. **Check Previous Batch Status** - Verify all prerequisite PRs are merged
2. **Validate Foundation Inheritance** - Ensure new worktrees will inherit proper foundation
3. **Confirm User Readiness** - User must confirm they're ready for batch deployment

#### **Phase 2: Agent Deployment**
1. **Create/Update Worktrees** - Ensure clean worktrees with latest merged code
2. **Deploy Specialized Agents** - Launch agents with proper foundation inheritance
3. **Validate Agent Setup** - Confirm agents have access to foundation contracts

#### **Phase 3: Work Completion & User Interaction**
1. **Agent Work Execution** - Agents complete their specialized work
2. **Mandatory Commit Workflow**:
   - ✅ Agent stages all changes
   - ✅ Agent commits with descriptive message
   - ✅ Agent pushes branch to remote
   - ✅ Agent creates detailed Pull Request
3. **🛑 MANDATORY USER HALT** - Command stops and prompts user

#### **Phase 4: User Action Required**
```
🚨 **CRITICAL: USER ACTION REQUIRED**

Batch {batch-number} agents have completed their work and created PRs.

**MANDATORY WORKFLOW:**
✅ All agent code committed to dedicated branches
✅ Branches pushed to remote repository
✅ Pull Requests created: {pr-links}
⏳ **USER MUST MERGE PRS BEFORE PROCEEDING**

**Why this is critical:**
- Foundation/prerequisite work MUST be merged before next batch
- New worktrees must be created AFTER merge to inherit latest code
- Ensures proper dependency chain and prevents integration conflicts

**Next Steps:**
1. Review PRs: {pr-links}
2. Merge PRs to main branch (in dependency order)
3. Confirm merge completion
4. **THEN run next batch deployment** (worktrees will inherit merged code)

**⚠️ DO NOT DEPLOY NEXT BATCH UNTIL PRS ARE MERGED ⚠️**
```

## Dependency Management

### **Batch Dependencies (Enforced)**
- **Batch 1**: No dependencies (Foundation)
- **Batch 2**: Requires Batch 1 merged
- **Batch 3**: Requires Batch 1 + 2 merged
- **Batch 4**: Requires Batch 1 + 2 + 3 merged

### **Merge Verification Steps**
1. **Check Git History** - Verify prerequisite commits exist in main branch
2. **Validate Foundation Files** - Ensure foundation contracts are available
3. **Test Interface Inheritance** - Confirm new agents can access base classes

## Usage Examples

### Standard Batch Deployment
```bash
# Deploy Foundation (creates PR, halts for user merge)
/mane-deploy-batch batch=1

# After user merges Foundation PR:
/mane-deploy-batch batch=2 --verify-dependencies

# After user merges Framework PR:
/mane-deploy-batch batch=3 --verify-dependencies --force-worktree-recreation
```

### Emergency Worktree Recreation
```bash
# Recreate worktrees to inherit latest merged foundation
/mane-deploy-batch batch=3 --force-worktree-recreation --validate-foundation
```

## Safety Features

### **Automatic Safeguards**
- **Dependency Validation** - Blocks deployment if prerequisites not merged
- **Foundation Inheritance** - Ensures new worktrees inherit merged foundation
- **User Confirmation** - Requires explicit user approval at critical points
- **PR Validation** - Verifies PRs exist and are properly formatted

### **User Interaction Points**
- **Pre-deployment Confirmation** - User confirms readiness
- **Post-completion Halt** - Command stops for PR review/merge
- **Dependency Validation** - User confirms prerequisite merges
- **Next Batch Readiness** - User confirms when ready to proceed

## Integration with MANE System

### **XML Configuration Compliance**
- Reads batch mappings from `browser-tools-mane-project.xml`
- Enforces mandatory-user-workflow from agent definitions
- Validates quality gates and integration requirements

### **Automatic Command Generation**
- Generates appropriate agent deployment commands
- Creates proper commit and PR workflows
- Provides user with exact next steps

## Error Handling

### **Common Scenarios**
- **Missing Prerequisites**: Clear guidance on which PRs need merging
- **Worktree Conflicts**: Automatic worktree recreation with proper inheritance
- **Foundation Missing**: Detailed validation of required foundation files
- **User Workflow Skipped**: Enforcement stops and requires proper workflow

### **Recovery Procedures**
- **Dependency Issues**: Step-by-step PR merge guidance
- **Foundation Problems**: Foundation validation and inheritance fixing
- **Workflow Violations**: Reset to proper workflow state

## Success Criteria

### **Batch Deployment Success**
- ✅ All agent worktrees created with proper foundation inheritance
- ✅ Agents complete specialized work successfully
- ✅ All changes committed, pushed, and PR created
- ✅ User prompted for required merge actions
- ✅ System ready for next batch after user merge

### **User Workflow Compliance**
- ✅ User understands critical merge requirements
- ✅ Proper dependency chain maintained
- ✅ Foundation inheritance working correctly
- ✅ No integration conflicts from skipped steps

---

**🦁 Built with MANE - The future of AI collaborative development**

*Command Version: 1.0*
*Mandatory User Workflow: Enforced*
*Last Updated: September 20, 2025*