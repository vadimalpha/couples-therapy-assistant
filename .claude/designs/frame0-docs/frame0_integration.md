# Frame0 Integration Guide

This guide explains how Frame0 integrates into the design helper workflow and provides best practices for translating site architecture to visual designs.

## Overview

Frame0 serves as the visual design bridge between UX documentation and final code generation. It provides:
- Visual representation of site architecture
- Clickable prototypes for validation
- Structured design data for code generation
- Designer-friendly interface for iterations

## Workflow Integration

### Complete Design Pipeline
```
1. Project Brief (project_brief.md)
   ↓
2. Research & Analysis (research.md, research/*.md)
   ↓
3. UX Architecture (site_architecture.md, ux-wireframes/*.html)
   ↓
4. **Frame0 Visual Design** (Frame0 pages, frame0_mappings.md) ← NEW STEP
   ↓
5. UI Styling (design_system.md, ui-designs/*.html)
   ↓
6. Code Generation (Final HTML/CSS/React)
```

## Frame0 Structure Mapping

### Architecture to Frame0 Translation

| Site Architecture | Frame0 Representation | Purpose |
|------------------|----------------------|----------|
| Page | Frame0 Page | Each website page gets its own Frame0 page |
| Section | Rectangle Container | Major content blocks with padding |
| Component | Shape Group | Reusable UI patterns |
| Element | Individual Shape | Text, buttons, images, icons |

### Example Mapping
```
Homepage (site_architecture.md)          →  Homepage (Frame0 Page)
├── Hero Section                        →  Rectangle (1440x600)
│   ├── Hero Container                  →  Group
│   │   ├── Headline (H1)             →  Text Shape (heading type)
│   │   ├── Subheadline               →  Text Shape (paragraph type)
│   │   └── CTA Button                →  Group (Rectangle + Text)
│   └── Trust Badges                   →  Group
│       └── Badge Elements (4x)        →  Icon Shapes
```

## Frame0 Design Patterns

### 1. Container Structure
```
Page Container (Full Width)
└── Content Container (Max Width: 1200px, Centered)
    ├── Section Container (With Padding)
    │   └── Component Groups
    └── Section Container (With Padding)
        └── Component Groups
```

### 2. Component Creation
Create reusable components as groups:
- **Navigation Bar**: Group containing logo, menu items, CTA
- **Product Card**: Group with image placeholder, text, price, button
- **Footer**: Group with multiple text elements and links

### 3. Responsive Design
Create separate frames for different viewports:
- Desktop: 1440px width
- Tablet: 768px width
- Mobile: 375px width

## Shape Specifications

### Common Dimensions
Based on standard web patterns:

**Desktop (1440px viewport)**
- Container max-width: 1200px
- Section padding: 80px vertical, 40px horizontal
- Grid gap: 24px
- Card width: 360px (3-column), 280px (4-column)

**Mobile (375px viewport)**
- Container padding: 20px
- Section padding: 40px vertical, 20px horizontal
- Grid: Single column
- Card width: 100% - 40px

### Typography Hierarchy
Frame0 text shapes should reflect:
- H1: 48px (desktop), 32px (mobile)
- H2: 36px (desktop), 28px (mobile)
- H3: 24px (desktop), 20px (mobile)
- Body: 16px
- Small: 14px

### Color Placeholders
Use grayscale for structure:
- White (#FFFFFF): Backgrounds
- Light Gray (#F5F5F5): Section backgrounds
- Medium Gray (#E0E0E0): Borders, dividers
- Dark Gray (#666666): Placeholder text
- Black (#000000): Primary text

## Navigation Implementation

### Link Structure
Connect Frame0 pages using the link tool:

1. **Primary Navigation**
   - Logo → Homepage
   - Menu Items → Respective pages
   - CTA Button → Conversion page

2. **In-Page Links**
   - Product Cards → Product Detail
   - Category Links → Category Pages
   - "Learn More" → About/Feature pages

3. **User Flow Links**
   - Add to Cart → Cart Page
   - Checkout → Checkout Flow
   - Account → Dashboard

### Creating Links
```
1. Select shape/group to be clickable
2. Use set_link tool with:
   - linkType: "page"
   - pageId: [target Frame0 page ID]
3. Document in frame0_mappings.md
```

## Component Library

### Essential Components to Create

1. **Navigation Components**
   - Desktop Navigation Bar
   - Mobile Navigation (Hamburger)
   - Breadcrumb Navigation
   - Footer Navigation

2. **Content Components**
   - Hero Section
   - Feature Card
   - Testimonial Block
   - Call-to-Action Section

3. **E-commerce Components**
   - Product Card
   - Product Gallery
   - Shopping Cart Item
   - Checkout Form Fields

4. **Form Components**
   - Input Field Group
   - Button (Primary/Secondary)
   - Checkbox/Radio Group
   - Dropdown Select

## Best Practices

### 1. Naming Conventions
- Pages: Match site architecture exactly (e.g., "Homepage", "Product Listing")
- Sections: Descriptive names (e.g., "Hero Section", "Features Grid")
- Components: Reusable names (e.g., "Product Card Component")
- Elements: Specific names (e.g., "Add to Cart Button")

### 2. Organization
- Group related shapes
- Use consistent spacing
- Align elements precisely
- Maintain visual hierarchy

### 3. Documentation
Always update `frame0_mappings.md` with:
- Page IDs and names
- Component IDs for reuse
- Navigation connections
- Any deviations from architecture

### 4. Iteration Workflow
1. Update site_architecture.md first
2. Get approval on structural changes
3. Update Frame0 designs to match
4. Document changes in mappings
5. Maintain sync across all documents

## Frame0 to Code Translation

Frame0's structured data enables clean code generation:

### Shape Properties → CSS
- Position (left, top) → CSS positioning
- Size (width, height) → CSS dimensions
- Corner radius → border-radius
- Fill color → background-color
- Stroke → border

### Groups → HTML Components
- Group structure → HTML nesting
- Group names → CSS classes
- Repeated groups → Component instances

### Pages → Routes
- Page names → URL paths
- Page links → Navigation routes
- Page structure → Template layouts

## Validation Checklist

Before proceeding to UI styling:
- [ ] All pages from sitemap are created
- [ ] Navigation links work correctly
- [ ] Components are grouped and reusable
- [ ] Measurements match architecture specs
- [ ] Mobile versions are created
- [ ] Mappings documentation is complete
- [ ] Frame0 design matches approved architecture

## Common Patterns

### Grid Layouts
```
Container (1200px)
├── Row (flex, gap: 24px)
│   ├── Column (360px)
│   ├── Column (360px)
│   └── Column (360px)
```

### Card Components
```
Card Group (360x400)
├── Image Placeholder (360x240, gray rect)
├── Content Container (padding: 24px)
│   ├── Title Text (H3)
│   ├── Description Text (paragraph)
│   └── CTA Button Group
```

### Form Layouts
```
Form Container (600px)
├── Field Group (margin-bottom: 24px)
│   ├── Label Text
│   └── Input Rectangle (height: 48px)
└── Submit Button (width: 100%)
```

## Troubleshooting

### Sync Issues
If Frame0 and documentation get out of sync:
1. site_architecture.md is source of truth
2. Review what changed in architecture
3. Update Frame0 to match
4. Update mappings file
5. Verify all pages and links work

### Performance
For large sites:
- Create component library first
- Duplicate components rather than recreating
- Use Frame0's built-in alignment tools
- Work on one page at a time

### Collaboration
- Export pages as images for review
- Use Frame0's preview for stakeholder feedback
- Document any approved deviations
- Keep mappings file updated for team reference

---

This integration enables a smooth transition from UX documentation to visual design, providing validation opportunities before final implementation.