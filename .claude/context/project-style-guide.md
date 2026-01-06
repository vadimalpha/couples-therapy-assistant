---
created: 2025-08-26T18:42:32Z
last_updated: 2025-08-26T18:42:32Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide

## Code Style Conventions

### Bash Scripts

#### File Naming
- Use kebab-case: `epic-show.sh`, `prd-parse.sh`
- Prefix with category: `pm-*.sh`, `context-*.sh`
- Use `.sh` extension for all scripts

#### Script Structure
```bash
#!/bin/bash
# Script: script-name.sh
# Purpose: Brief description
# Usage: script-name.sh [arguments]

# Constants
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Functions
function validate_input() {
    # Function implementation
}

# Main execution
main() {
    # Main logic
}

# Execute main
main "$@"
```

#### Coding Standards
- Use `readonly` for constants
- Quote all variables: `"$var"` not `$var`
- Use `[[ ]]` for conditionals, not `[ ]`
- Functions use `function` keyword
- Local variables in functions: `local var_name`
- Exit codes: 0 for success, 1 for errors

#### Error Handling
```bash
# Check command success
if ! command; then
    echo "❌ Error: Command failed" >&2
    exit 1
fi

# Validate file exists
if [[ ! -f "$file_path" ]]; then
    echo "❌ File not found: $file_path" >&2
    exit 1
fi
```

### Markdown Files

#### Document Structure
```markdown
---
# Frontmatter (required for context/epic/PRD files)
created: 2025-08-26T18:42:32Z
last_updated: 2025-08-26T18:42:32Z
version: 1.0
---

# Document Title

## Section Heading

### Subsection

Content with **bold** and *italic* text.

- Bullet points
- With consistent markers

1. Numbered lists
2. When order matters
```

#### Formatting Rules
- One blank line between sections
- Use ATX-style headers (#, ##, ###)
- Maximum line length: 120 characters
- Use reference-style links for repeated URLs
- Tables must have headers

#### File Naming
- Lowercase with hyphens: `project-overview.md`
- Descriptive names: `tech-context.md` not `tech.md`
- No spaces or special characters

### JSON Configuration

#### Format
```json
{
    "setting_name": "value",
    "nested": {
        "property": "value"
    },
    "array": [
        "item1",
        "item2"
    ]
}
```

#### Standards
- 2-space indentation
- Snake_case for keys
- Double quotes only
- Trailing commas forbidden
- Comments not allowed

## Documentation Standards

### Command Documentation

#### Format
```markdown
### `/command:name`
- **Purpose**: What it does
- **Usage**: `/command:name [arguments]`
- **Description**: Detailed explanation
- **When to use**: Specific scenarios
- **Output**: What it produces
```

### Error Messages

#### Format
- ❌ Errors: "❌ Error: {specific description}"
- ⚠️ Warnings: "⚠️ Warning: {description}"
- ✅ Success: "✅ {action} complete"
- 📋 Info: "📋 {information}"

### Status Indicators
- 🔄 In Progress
- ✅ Complete
- ❌ Failed
- ⚠️ Warning
- 📋 Information
- 🚀 Launched
- 🧠 Thinking/Processing

## Git Conventions

### Commit Messages

#### Format
```
<type>: <subject>

<body>

<footer>
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks

#### Examples
```
feat: Add parallel execution support

Implement Git worktree management for parallel agent execution.
This allows multiple agents to work simultaneously without conflicts.

Closes #123
```

### Branch Naming
- Feature: `feature/epic-name`
- Bugfix: `fix/issue-description`
- Hotfix: `hotfix/critical-issue`
- Epic: `epic/epic-name`

### Tag Naming
- Version: `v1.0.0`
- Release: `release-2024-01-15`
- Milestone: `milestone-phase1`

## File Organization

### Directory Structure
```
.claude/
├── context/        # Project context files
├── epics/          # Epic definitions
│   └── {name}/     # Epic-specific directory
├── prds/           # Product requirements
├── scripts/        # Automation scripts
│   └── pm/         # PM workflow scripts
└── config/         # Configuration files
```

### File Placement Rules
- Scripts in `.claude/scripts/{category}/`
- PRDs in `.claude/prds/`
- Epics in `.claude/epics/{epic-name}/`
- Context in `.claude/context/`
- Config in `.claude/` root

## Testing Conventions

### Test File Naming
- Test scripts: `test-{feature}.sh`
- Mock data: `mock-{data-type}.json`
- Fixtures: `fixture-{name}.md`

### Test Structure
```bash
#!/bin/bash
# Test: feature-name

# Setup
setup() {
    # Prepare test environment
}

# Teardown
teardown() {
    # Clean up
}

# Test cases
test_feature_one() {
    # Test implementation
}

# Run tests
run_tests() {
    setup
    test_feature_one
    teardown
}
```

## Comments and Documentation

### Code Comments

#### Shell Scripts
```bash
# Single line comment
# explaining the next line

# Multi-line comment block
# explaining complex logic
# across multiple lines

# TODO: Task to complete
# FIXME: Known issue to fix
# NOTE: Important information
# HACK: Temporary solution
```

### Inline Documentation
- Explain WHY, not WHAT
- Document complex logic
- Note assumptions
- Warn about side effects

## Naming Conventions

### Variables
- Bash: `UPPER_SNAKE_CASE` for constants
- Bash: `lower_snake_case` for variables
- JSON: `snake_case` for keys

### Functions
- Bash: `snake_case`
- Descriptive verb phrases: `validate_input`, `create_epic`

### Files
- Scripts: `kebab-case.sh`
- Markdown: `kebab-case.md`
- JSON: `kebab-case.json`

## Quality Standards

### Code Review Checklist
- [ ] Follows style guide
- [ ] Has error handling
- [ ] Includes comments
- [ ] Tests pass
- [ ] Documentation updated

### Definition of Done
- Code complete and tested
- Documentation written
- Style guide followed
- Peer reviewed
- Integrated and deployed