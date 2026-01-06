---
created: 2025-08-26T18:42:32Z
last_updated: 2025-08-26T18:42:32Z
version: 1.0
author: Claude Code PM System
---

# Technical Context

## Technology Stack

### Core Technologies
- **Language**: Bash scripting
- **Version Control**: Git
- **Issue Tracking**: GitHub Issues
- **Documentation**: Markdown
- **Configuration**: JSON

### Development Tools
- **Editor**: Claude Code (primary)
- **Version Control**: Git with worktrees
- **CI/CD**: GitHub Actions (planned)
- **Testing**: Bash test framework

## Dependencies

### System Requirements
- Bash 4.0+
- Git 2.20+ (for worktree support)
- GitHub CLI (`gh`) for issue management
- Unix-like environment (macOS, Linux)

### External Services
- **GitHub**: Repository hosting and issue tracking
- **GitHub API**: Automated issue creation and management

### Command Line Tools
- `git` - Version control operations
- `gh` - GitHub CLI for issue management
- `jq` - JSON processing (optional)
- `date` - Timestamp generation
- `find` - File discovery
- `grep` - Text searching

## Architecture Patterns

### Data Storage
- **File-based**: All data stored as markdown or JSON files
- **Git-tracked**: Version control for all project data
- **Hierarchical**: Organized directory structure

### Workflow Automation
- **Script-driven**: Bash scripts for all operations
- **Command pattern**: Standardized command interface
- **Pipeline architecture**: Commands chain together

### Integration Points
- **GitHub Issues**: External issue tracking
- **Git Worktrees**: Parallel development branches
- **Claude Code**: AI-powered development

## Development Environment

### Project Setup
```bash
# Clone repository
git clone https://github.com/automazeio/ccpm.git

# Initialize PM system
/pm:init

# Create context
/context:create
```

### Configuration Files
- `.claude/config.json`: Global settings
- `.claude/settings.local.json`: Local overrides
- `.gitignore`: Version control exclusions

### Environment Variables
- `GITHUB_TOKEN`: For API access (optional)
- `EDITOR`: Preferred text editor
- `CLAUDE_*`: Claude-specific settings

## Build and Deployment

### Build Process
- No compilation required (interpreted scripts)
- Scripts are directly executable

### Deployment
- Git-based deployment
- No server infrastructure required
- Runs locally on developer machines

### Testing
- Script-based testing framework
- Mock outputs for validation
- Integration tests with GitHub API

## Performance Considerations

### Optimization Areas
- File I/O for large epic/PRD files
- GitHub API rate limiting
- Parallel agent execution

### Scalability
- Designed for teams up to 50 developers
- Supports unlimited epics/PRDs
- Parallel task execution via worktrees

## Security Considerations

### Access Control
- GitHub permissions for issue creation
- Local file system permissions
- Git repository access

### Sensitive Data
- No credentials in version control
- Local settings excluded from Git
- Environment variables for secrets

## Future Technology Considerations
- Web UI for epic/PRD management
- Database backend for larger scale
- Cloud hosting for team collaboration
- API for external integrations