---
created: 2025-08-26T18:42:32Z
last_updated: 2025-08-26T18:42:32Z
version: 1.0
author: Claude Code PM System
---

# Product Context

## Product Overview

**Claude Code PM** is a battle-tested workflow system that transforms Product Requirement Documents (PRDs) into executable development tasks using GitHub Issues, Git worktrees, and parallel AI agent execution.

## Target Users

### Primary Users
1. **Software Development Teams**
   - Teams using Claude Code for development
   - Need structured workflow management
   - Want to avoid "vibe coding"

2. **Technical Project Managers**
   - Managing multiple parallel workstreams
   - Need visibility into AI-assisted development
   - Require audit trails and traceability

3. **Solo Developers**
   - Building complex applications alone
   - Leveraging AI for productivity
   - Need organized task management

### User Personas

**Alex - The Team Lead**
- Manages 5-10 developers
- Uses Claude Code daily
- Needs visibility into progress
- Wants to prevent context loss

**Sam - The Solo Builder**
- Building a startup product
- Heavy Claude Code user
- Needs structure and organization
- Wants to ship faster with quality

**Jordan - The Enterprise Developer**
- Works in regulated environment
- Needs audit trails
- Requires spec-driven development
- Must track all changes

## Core Features

### 1. PRD Management
- Create comprehensive PRDs through guided brainstorming
- Version control for requirements
- Traceability from idea to implementation

### 2. Epic Planning
- Convert PRDs to technical epics
- Break down into implementable tasks
- Estimate effort and dependencies

### 3. GitHub Integration
- Automatic issue creation
- Real-time progress tracking
- Team visibility into AI work

### 4. Parallel Execution
- Git worktrees for isolation
- Multiple agents working simultaneously
- Automatic conflict prevention

### 5. Context Management
- Persistent context across sessions
- Knowledge transfer between agents
- Documentation auto-generation

## Use Cases

### Primary Use Cases

1. **Feature Development**
   - Start with PRD creation
   - Decompose into epic and tasks
   - Execute with AI assistance
   - Track progress in GitHub

2. **Bug Fixing**
   - Create issue for bug
   - AI analyzes and proposes fix
   - Human reviews and approves
   - Automated testing and deployment

3. **Code Refactoring**
   - Define refactoring goals in PRD
   - Break into safe incremental changes
   - Execute in parallel branches
   - Merge with confidence

4. **Documentation**
   - Generate from code analysis
   - Maintain context files
   - Update on each session
   - Keep knowledge current

### Workflow Scenarios

**Scenario 1: New Feature**
```
/pm:prd-new user-auth
/pm:prd-parse user-auth
/pm:epic-oneshot user-auth
/pm:issue-start 001
```

**Scenario 2: Team Collaboration**
- PM creates PRD
- Tech lead reviews and creates epic
- Developers pick up tasks
- AI assists each developer

**Scenario 3: Maintenance Mode**
- Regular context updates
- Incremental improvements
- Bug fixes as they arise
- Documentation maintenance

## Success Metrics

### User Success Indicators
- Reduced development time by 50%+
- Zero context loss between sessions
- 100% requirement traceability
- Parallel task completion

### Product KPIs
- Time from PRD to production
- Number of parallel agents active
- Context retention rate
- Issue completion velocity

## Competitive Advantage

### vs. Traditional Development
- Structured instead of ad-hoc
- Documented instead of tribal knowledge
- Parallel instead of sequential
- Traceable instead of opaque

### vs. Other AI Tools
- GitHub integration for team visibility
- Spec-driven to prevent drift
- Context persistence across sessions
- Audit trail for compliance

## Product Constraints

### Technical Constraints
- Requires Git and GitHub
- Unix-like environment
- Bash shell availability
- GitHub CLI installation

### User Constraints
- Git knowledge required
- Command line familiarity
- GitHub account needed
- Claude Code access

## Future Product Vision

### Near-term (3 months)
- Web UI for PRD management
- Enhanced parallel execution
- Better conflict resolution
- Performance metrics dashboard

### Medium-term (6 months)
- Team collaboration features
- Custom workflow definitions
- Integration with CI/CD
- Advanced analytics

### Long-term (12 months)
- Multi-repository support
- Enterprise features
- SaaS offering
- AI model flexibility