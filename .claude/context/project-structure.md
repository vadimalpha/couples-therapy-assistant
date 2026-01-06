---
created: 2025-08-26T18:42:32Z
last_updated: 2025-08-26T18:42:32Z
version: 1.0
author: Claude Code PM System
---

# Project Structure

## Directory Organization

```
ccpm/
├── .claude/                    # Claude-specific configuration and data
│   ├── context/                # Project context documentation
│   ├── epics/                  # Epic definitions and tasks
│   │   ├── taskmanager/        # Task manager epic
│   │   └── winepair/           # Wine pairing epic
│   ├── prds/                   # Product Requirement Documents
│   │   ├── taskmanager.md      # Task manager PRD
│   │   └── winepair.md         # Wine pairing PRD
│   ├── scripts/                # Automation scripts
│   │   ├── pm/                 # Project management scripts
│   │   └── test-and-log.sh     # Testing automation
│   ├── config.json             # Configuration settings
│   ├── settings.local.json     # Local settings
│   └── state.json              # Application state
├── commands/                   # Command definitions
│   ├── agents/                 # Agent-related commands
│   ├── contexts/               # Context management commands
│   ├── mcp-servers/            # MCP server configurations
│   ├── templates/              # Command templates
│   └── workflows/              # Workflow definitions
├── mock_outputs/               # Mock data and test outputs
│   └── 2025-08-26/            # Date-organized outputs
├── mobile/                     # Mobile-related files
├── AGENTS.md                   # Agent documentation
├── CLAUDE.md                   # Claude-specific instructions
├── COMMANDS.md                 # Command reference
├── LICENSE                     # MIT License
├── README.md                   # Project documentation
└── screenshot.webp             # Visual documentation
```

## Key Directories

### `.claude/`
Central hub for all Claude Code PM data and configuration:
- **epics/**: Contains epic definitions with task breakdowns
- **prds/**: Product requirement documents driving development
- **scripts/**: Bash scripts implementing workflow automation
- **context/**: Project context for AI agent understanding

### `commands/`
Command system organization:
- **agents/**: Agent-specific command definitions
- **contexts/**: Context management commands
- **templates/**: Reusable command templates
- **workflows/**: Complete workflow definitions

### `mock_outputs/`
Testing and demonstration outputs organized by date

## File Naming Conventions

### Epic Files
- Epic definition: `{epic-name}/epic.md`
- Task files: `{epic-name}/{task-number}.md` (e.g., `001.md`, `002.md`)

### PRD Files
- Format: `{feature-name}.md`
- Lowercase with hyphens for spaces

### Script Files
- Command scripts: `{command-name}.sh`
- Helper scripts: `{function}-{purpose}.sh`

## Important Files

### Configuration
- `.claude/config.json` - Global configuration
- `.claude/settings.local.json` - Local overrides
- `.claude/state.json` - Runtime state

### Documentation
- `README.md` - Main project documentation
- `COMMANDS.md` - Command reference
- `AGENTS.md` - Agent usage guide
- `CLAUDE.md` - Claude-specific instructions

### Automation
- `.claude/scripts/pm/*.sh` - PM workflow scripts
- `.claude/scripts/test-and-log.sh` - Testing automation

## Module Organization
The project is organized as a workflow automation system with:
- Script-based command execution
- File-based data storage (epics, PRDs, context)
- GitHub Issues integration
- Git worktree management