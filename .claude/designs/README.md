# Terminus Design Assets

This directory contains all design documentation and assets for the Terminus project, copied from the original design-helper project.

## Directory Structure

```
.claude/designs/
├── README.md                    # This file - design asset index
├── app_architecture.md          # Complete app architecture and screen definitions
├── research.md                  # User research and competitive analysis
├── prototypes/                  # Interactive HTML prototypes
│   ├── index.html               # Main dashboard/connections view
│   ├── connections.html         # Connections list and management
│   ├── activities.html          # Activities tracking and discovery  
│   ├── discover.html            # AI-powered recommendations
│   ├── add-connection.html      # New connection capture flow
│   ├── reminders.html           # Follow-up reminder management
│   ├── success.html             # Confirmation and success states
│   ├── README.md                # Prototype documentation
│   └── images/                  # Prototype screenshots and assets
│       └── connections-list.png # Sample connection list mockup
└── frame0-docs/                 # Frame0 design system documentation
    ├── frame0_agent_guide.md    # Frame0 agent usage guide
    ├── frame0_best_practices.md # Design best practices
    └── frame0_integration.md    # Integration instructions
```

## Asset Origins

All assets were copied from: `/Users/vadimtelyatnikov/design/design-helper/`

- **Source Project**: Design Helper - Terminus Social Activity App
- **Copy Date**: 2025-08-30
- **Original Brief**: Based on project_brief.md for AI-powered social activity tracking

## Usage

These design assets should be referenced in development and serve as the foundation for:

1. **Development Planning** - Use `app_architecture.md` for screen structure
2. **UI Implementation** - Reference HTML prototypes for layout and interaction patterns  
3. **Design System** - Follow Frame0 documentation for component creation
4. **User Research** - Build upon existing research findings

## Next Steps

- [ ] Review prototypes for implementation accuracy
- [ ] Update designs based on PRD requirements
- [ ] Create Frame0 designs for missing screens
- [ ] Implement iOS-specific design system components
- [ ] Validate user flows against prototype interactions

## Related Files

- **PRD**: `.claude/prds/terminus.md` - Product requirements referencing these assets
- **Project Brief**: Original brief in design-helper project established core requirements