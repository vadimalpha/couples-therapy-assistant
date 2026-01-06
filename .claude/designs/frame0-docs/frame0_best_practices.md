# Frame0 Design System Best Practices

This guide outlines best practices for using Frame0 effectively in the design helper workflow, particularly for creating design systems and maintaining consistency across iterations.

## Revised Workflow Order

### Optimal Design Process Flow
```
1. UX Architecture (Documentation & Structure)
   ↓
2. Frame0 Visual Layout (Spacing & Hierarchy)
   ↓
3. UI Design System (Colors & Styling)
   ↓
4. Iteration Loop (Update any layer as needed)
```

### Why This Order Works Better

**UX → Frame0 → UI** creates a natural progression:
- **UX Agent**: Defines WHAT goes where (structure)
- **Frame0 Agent**: Defines HOW it's arranged (layout)
- **UI Agent**: Defines HOW it looks (styling)

This separation allows for:
- Clear handoffs between phases
- Easy iteration at any level
- Visual validation before styling
- Better designer collaboration

## Frame0's Role in Design Decisions

### Visual Layout Decisions
Frame0 excels at helping with:
1. **Spacing Relationships**
   - Component padding and margins
   - Section spacing rhythm
   - Visual breathing room

2. **Size Proportions**
   - Relative component sizes
   - Visual hierarchy through scale
   - Responsive scaling decisions

3. **Alignment Systems**
   - Grid adherence
   - Component alignment
   - Visual balance

4. **Component Grouping**
   - Related element proximity
   - Visual associations
   - Logical clustering

### Design System Foundation
Frame0 helps establish:
- **8px Grid System**: Align all elements to 8px increments
- **Spacing Scale**: 4, 8, 16, 24, 32, 48, 64, 80px
- **Container Logic**: Max widths and padding
- **Component Dimensions**: Consistent sizing

## File Management Strategy

### Repository Structure
```
design-helper/
├── project_brief.md
├── research.md
├── research/
│   └── [site-analyses].md
├── site_architecture.md
├── ux-wireframes/
│   └── [page-name].html
├── frame0-designs/          ← Frame0 files
│   ├── main-site.frame0
│   ├── components.frame0
│   └── style-guide.frame0
├── frame0_mappings.md       ← ID mappings
├── design_system.md
└── ui-designs/
    ├── [page-name].html
    ├── component-library.html
    └── style-guide.html
```

### Version Control
- Frame0 files are JSON-based and git-friendly
- Commit with descriptive messages
- Tag major design milestones
- Keep mappings file updated

## Design System Pages in Frame0

### 1. Style Guide Page Structure
Create a dedicated Frame0 page showing:
```
Style Guide Page
├── Typography Section
│   ├── H1 Specimen (48px desktop, 32px mobile)
│   ├── H2 Specimen (36px desktop, 28px mobile)
│   ├── H3 Specimen (24px desktop, 20px mobile)
│   ├── Body Text (16px)
│   └── Small Text (14px)
├── Spacing Section
│   ├── 4px example
│   ├── 8px example
│   └── [continue scale]
├── Grid Section
│   └── 12-column visualization
└── Component Spacing
    └── Examples of component padding
```

### 2. Component Library Page
Organize components by type:
```
Component Library Page
├── Navigation Components
│   ├── Desktop Nav
│   ├── Mobile Nav
│   └── Breadcrumbs
├── Content Components
│   ├── Cards (S, M, L)
│   ├── Heroes
│   └── Features
├── Form Components
│   ├── Input Fields
│   ├── Buttons
│   └── Selects
└── States Documentation
    ├── Default states
    ├── Hover states
    └── Active states
```

## Iteration Best Practices

### The Sacred Sync Loop
1. **Documentation First**: Update site_architecture.md
2. **Visual Layout Second**: Update Frame0 designs
3. **Styling Third**: Update design_system.md and HTML
4. **Validate**: Ensure all three layers align

### Making Changes
- **Structural Change**: Start with UX agent
- **Layout Change**: Start with Frame0 agent
- **Style Change**: Start with UI agent
- **Always cascade**: Changes flow downstream

### Frame0 Iteration Process
1. Open existing Frame0 file
2. Make visual adjustments
3. Update frame0_mappings.md
4. If structural, update site_architecture.md
5. Notify UI agent of changes

## Component Design in Frame0

### Creating Reusable Components
1. **Group Related Elements**
   ```
   Product Card (Group)
   ├── Image Placeholder (Rectangle)
   ├── Content Container (Rectangle)
   │   ├── Title (Text)
   │   ├── Description (Text)
   │   └── Price (Text)
   └── CTA Button (Group)
       ├── Button BG (Rectangle)
       └── Button Text (Text)
   ```

2. **Name Consistently**
   - Use descriptive names
   - Include size variants (Card-Small, Card-Medium)
   - Note states (Button-Default, Button-Hover)

3. **Document Variations**
   - Create all size variants
   - Show different content scenarios
   - Include edge cases

### Responsive Design in Frame0
Create frames for each breakpoint:
- **Mobile**: 375px (minimum supported)
- **Tablet**: 768px (portrait)
- **Desktop**: 1440px (standard)

Show how components adapt:
- Stack vs. grid layouts
- Text size changes
- Padding adjustments
- Hidden/shown elements

## Design Tokens in Frame0

### Visual Representation
Use Frame0 to visualize design tokens:

1. **Color Swatches**
   - Create rectangles for each color
   - Add text labels with hex codes
   - Group by color family

2. **Spacing Visualization**
   - Create rectangles showing each space unit
   - Label with pixel values
   - Show in context

3. **Typography Specimens**
   - Show each text style
   - Include line height visualization
   - Demonstrate hierarchy

## Collaboration Benefits

### Designer Handoff
Frame0 enables:
- Visual designers to refine layouts
- Easy feedback on proportions
- Quick iteration on spacing
- Clear component structure

### Developer Reference
Frame0 provides:
- Exact measurements
- Component relationships
- Responsive behavior
- Interaction patterns

## Common Patterns

### Card-Based Layouts
```
Container (1200px max-width)
├── Grid (3 columns, 24px gap)
│   ├── Card 1 (calc(33.33% - 16px))
│   ├── Card 2 (calc(33.33% - 16px))
│   └── Card 3 (calc(33.33% - 16px))
```

### Form Layouts
```
Form Container (600px max-width)
├── Field Group (margin-bottom: 24px)
│   ├── Label (margin-bottom: 8px)
│   └── Input (height: 48px)
└── Submit Button (margin-top: 32px)
```

### Hero Sections
```
Hero Container (full-width)
├── Content Container (1200px, centered)
│   ├── Headline (margin-bottom: 16px)
│   ├── Subheadline (margin-bottom: 32px)
│   └── CTA Group (gap: 16px)
```

## Quality Checklist

Before handoff to UI agent:
- [ ] All pages from architecture are created
- [ ] Consistent spacing throughout
- [ ] Components are grouped and reusable
- [ ] Responsive versions exist
- [ ] Navigation links work
- [ ] Design system pages created
- [ ] Mappings file is complete
- [ ] Visual hierarchy is clear
- [ ] Accessibility considered (sizes, contrast)

## Future Enhancements

### UI Component Library Integration
Frame0 designs can map to:
- **Bootstrap**: Grid and component structure
- **Tailwind**: Utility class patterns
- **Material Design**: Component specifications
- **Ant Design**: Layout and spacing
- **Chakra UI**: Design token system

### Preparation for Libraries
- Use standard spacing scale (4px base)
- Follow common component patterns
- Maintain clear naming conventions
- Design with flexibility in mind

---

This approach ensures Frame0 serves as an effective bridge between structure and styling, enabling better design decisions and easier iterations throughout the process.