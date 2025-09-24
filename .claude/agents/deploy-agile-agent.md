# Deploy AgileAI Agent - Universal Scope-Controlled Deployment

**Usage**: `/deploy-agile-agent --agent=C --issue=41 --enforce-xml-scope=YES`

## Agent Deployment with XML Scope Enforcement

This command deploys AgileAI agents with strict XML-defined scope boundaries and GitHub issue compliance.

### Parameters
- `--agent`: Agent letter (A-I)
- `--issue`: GitHub issue number for the agent
- `--enforce-xml-scope`: YES/NO for XML boundary enforcement
- `--break-points`: Optional - force break-point verification (default: YES)

### Execution Flow

1. **XML Scope Lookup**: Read `MANE/browser-tools-mane-project.xml` for agent definition
2. **GitHub Issue Validation**: Load issue details and requirements
3. **Scope Contract**: Display deliverables and boundaries to user
4. **Agent Identity Assumption**: Deploy agent with enforcement guardrails
5. **Break-Point Verification**: Mandatory user approval at completion points

### Agent Directory Mapping
```
A = Claude_Identity_Agent-A_Foundation.md
B = Claude_Identity_Agent-B_Framework.md
C = Claude_Identity_Agent-C_Navigation.md
D = Claude_Identity_Agent-D_Screenshot.md
E = Claude_Identity_Agent-E_Interaction.md
F = Claude_Identity_Agent-F_Evaluation.md
G = Claude_Identity_Agent-G_Audit.md
H = Claude_Identity_Agent-H_Console.md
I = Claude_Identity_Agent-I_Content.md
```

### Critical Context Loading
- Project CLAUDE.md
- Memory Bank active context
- XML agent specification
- GitHub issue requirements
- Foundation/framework status

### Scope Enforcement
- **Allowed Files**: Per XML specification
- **Forbidden Actions**: Framework changes, other agent work
- **Completion Criteria**: Exact XML deliverables only
- **Auto-Stop**: When scope complete

### Break-Point System
- User approval required before starting
- Progress verification at 50% completion
- Final deliverables approval
- GitHub issue status update

This creates laser-focused agent deployment with automatic scope boundaries.