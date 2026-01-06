---
created: 2025-08-26T18:42:32Z
last_updated: 2025-08-26T18:42:32Z
version: 1.0
author: Claude Code PM System
---

# System Patterns

## Architectural Patterns

### Command Pattern
- All operations exposed as commands
- Standardized format: `/category:action`
- Commands map to executable scripts
- Parameters passed as arguments

### Pipeline Architecture
```
PRD → Epic → Tasks → Issues → Development
```
- Linear flow with clear stages
- Each stage produces artifacts
- Traceable from requirement to code

### Document-Driven Development
- PRDs define requirements
- Epics translate to technical specs
- Tasks provide implementation details
- All decisions documented in markdown

## Design Patterns

### Repository Pattern
- File system as data store
- Markdown files as entities
- Directory structure as relationships
- Git provides versioning

### Factory Pattern
- Scripts create standardized documents
- Templates ensure consistency
- Frontmatter for metadata

### Observer Pattern
- GitHub Issues for status tracking
- Git hooks for automation
- File watchers for real-time updates

## Data Flow Patterns

### Unidirectional Flow
```
User Input → Command → Script → File System → Git → GitHub
```

### Event-Driven Updates
- File changes trigger Git commits
- Commits trigger CI/CD
- Issues update on state changes

### Parallel Execution
- Git worktrees for isolation
- Independent task branches
- Merge on completion

## Code Organization Patterns

### Separation of Concerns
- Scripts: Business logic
- Markdown: Data storage
- JSON: Configuration
- Git: Version control

### Single Responsibility
- Each script does one thing
- Clear command boundaries
- Focused file purposes

### Convention Over Configuration
- Standard directory structure
- Predictable file naming
- Minimal configuration required

## Communication Patterns

### Human-AI Interface
- Commands as communication protocol
- Markdown for shared understanding
- Context files for knowledge transfer

### Team Collaboration
- GitHub Issues for coordination
- Git branches for isolation
- PRs for code review

### Status Broadcasting
- Issue comments for updates
- Git commits for changes
- File timestamps for activity

## Error Handling Patterns

### Fail-Fast
- Validate inputs early
- Clear error messages
- Exit on critical failures

### Graceful Degradation
- Continue with warnings
- Partial success handling
- Recovery suggestions

### Defensive Programming
- Check file existence
- Validate permissions
- Handle edge cases

## Testing Patterns

### Mock Objects
- Mock output files
- Test data fixtures
- Simulated responses

### Integration Testing
- End-to-end workflows
- GitHub API testing
- Multi-script pipelines

### Regression Prevention
- Git history for comparison
- Before/after snapshots
- Automated validation

## Scalability Patterns

### Horizontal Scaling
- Parallel agent execution
- Multiple worktrees
- Distributed development

### Modular Architecture
- Pluggable commands
- Extensible workflows
- Custom integrations

### Caching Strategy
- Local file caching
- Git object caching
- Context preloading

## Security Patterns

### Principle of Least Privilege
- Minimal permissions required
- Scoped GitHub tokens
- Read-only defaults

### Defense in Depth
- Input validation
- Permission checks
- Audit logging

### Secure Defaults
- No credentials in code
- Environment variables for secrets
- .gitignore for sensitive files

## Anti-Patterns to Avoid

### Avoided Anti-Patterns
- ❌ Hard-coded paths
- ❌ Credentials in files
- ❌ Monolithic scripts
- ❌ Synchronous blocking
- ❌ Manual state management

### Preferred Approaches
- ✅ Relative paths
- ✅ Environment variables
- ✅ Modular commands
- ✅ Async operations
- ✅ Git-based state