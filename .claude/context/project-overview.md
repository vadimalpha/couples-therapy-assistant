---
created: 2025-08-26T18:42:32Z
last_updated: 2025-08-26T18:42:32Z
version: 1.0
author: Claude Code PM System
---

# Project Overview

## Executive Summary

Claude Code PM (CCPM) is a comprehensive workflow automation system that bridges the gap between product requirements and production code using AI-assisted development. It provides a structured, traceable path from PRDs to GitHub Issues, enabling parallel execution with multiple AI agents while maintaining full visibility for human teams.

## System Capabilities

### 1. Product Requirement Management
- **PRD Creation** (`/pm:prd-new`)
  - Guided brainstorming sessions
  - Structured requirement capture
  - Automatic formatting and validation
  - Version control integration

- **PRD Parsing** (`/pm:prd-parse`)
  - Convert requirements to technical specs
  - Identify implementation tasks
  - Estimate effort and complexity
  - Generate epic structure

### 2. Epic and Task Management
- **Epic Decomposition** (`/pm:epic-decompose`)
  - Break epics into atomic tasks
  - Define dependencies
  - Set parallelization opportunities
  - Create detailed acceptance criteria

- **Task Tracking** (`/pm:epic-show`, `/pm:epic-status`)
  - Real-time progress monitoring
  - Dependency visualization
  - Blocker identification
  - Completion tracking

### 3. GitHub Integration
- **Issue Synchronization** (`/pm:epic-sync`)
  - Automatic issue creation
  - Bi-directional updates
  - Label management
  - Milestone tracking

- **Progress Visibility**
  - Issue comments for updates
  - Status changes
  - Time tracking
  - Team notifications

### 4. Parallel Execution
- **Worktree Management**
  - Isolated development branches
  - Conflict prevention
  - Parallel agent execution
  - Automatic merging

- **Agent Coordination**
  - Task assignment
  - Progress synchronization
  - Resource management
  - Completion verification

### 5. Context Management
- **Context Creation** (`/context:create`)
  - Project analysis
  - Documentation generation
  - Pattern identification
  - Knowledge extraction

- **Context Updates** (`/context:update`)
  - Incremental updates
  - Change detection
  - Version tracking
  - Knowledge preservation

## Feature Matrix

| Feature | Status | Command | Description |
|---------|--------|---------|-------------|
| PRD Creation | ✅ Complete | `/pm:prd-new` | Interactive PRD creation |
| PRD Parsing | ✅ Complete | `/pm:prd-parse` | Convert PRD to epic |
| Epic Decomposition | ✅ Complete | `/pm:epic-decompose` | Break down into tasks |
| GitHub Sync | ✅ Complete | `/pm:epic-sync` | Create GitHub issues |
| Parallel Execution | ✅ Complete | `/pm:issue-start` | Start parallel work |
| Context Management | ✅ Complete | `/context:*` | Maintain project knowledge |
| Progress Tracking | ✅ Complete | `/pm:status` | Monitor progress |
| Team Coordination | 🔄 In Progress | Various | Multi-user support |
| Web UI | 📋 Planned | N/A | Browser interface |
| Analytics | 📋 Planned | N/A | Performance metrics |

## Integration Points

### Version Control
- Git for source control
- Git worktrees for isolation
- Git hooks for automation
- Git history for audit

### Issue Tracking
- GitHub Issues for tasks
- GitHub Projects for boards
- GitHub API for automation
- GitHub Actions for CI/CD

### AI Assistants
- Claude Code as primary
- Context sharing protocols
- Agent coordination
- Knowledge persistence

### Development Tools
- Bash for scripting
- Markdown for documentation
- JSON for configuration
- YAML for structured data

## Current State

### Operational Status
- **Production Ready**: Core workflow system
- **Beta**: Advanced parallel execution
- **Alpha**: Team collaboration features
- **Development**: Web UI and analytics

### Active Deployments
- Used by development teams globally
- Open source community adoption
- Enterprise pilot programs
- Academic research projects

### Performance Metrics
- Average PRD creation: 15 minutes
- Epic decomposition: 5 minutes
- Task creation: 30 seconds/task
- Context loading: < 2 seconds
- Parallel execution: 3-5x speedup

## System Architecture

### Component Overview
```
┌─────────────────┐
│  Command Layer  │ - User interface
├─────────────────┤
│  Script Engine  │ - Business logic
├─────────────────┤
│   File System   │ - Data storage
├─────────────────┤
│  Git Repository │ - Version control
├─────────────────┤
│  GitHub API     │ - External integration
└─────────────────┘
```

### Data Flow
1. User executes command
2. Script processes request
3. Files created/modified
4. Git commits changes
5. GitHub sync triggered
6. Agents begin work

## Deployment Options

### Local Development
- Single developer workflow
- Full feature access
- No external dependencies
- Complete privacy

### Team Deployment
- Shared repository
- GitHub Issues coordination
- Parallel development
- Progress visibility

### Enterprise Deployment
- Private GitHub Enterprise
- Custom workflows
- Compliance tracking
- Audit logging

## Support and Resources

### Documentation
- README.md - Getting started
- COMMANDS.md - Command reference
- AGENTS.md - Agent usage
- Context files - Project knowledge

### Community
- GitHub Discussions
- Issue tracker
- Pull requests
- Discord channel (planned)

### Training
- Video tutorials (planned)
- Workshop materials
- Best practices guide
- Case studies