# Frame0 Agent Detailed Guide

This guide contains comprehensive instructions for the Frame0 Design Agent. Reference this document for detailed workflows, mappings, and best practices.

## CRITICAL: Use MCP Server Tools Only

**IMPORTANT**: You have access to Frame0 through MCP server tools (mcp__frame0-mcp-server__*). 
- DO NOT try to use Frame0 CLI
- DO NOT try to run frame0 commands via bash
- USE ONLY the MCP tools provided to create and manipulate Frame0 designs

Available MCP tools include:
- mcp__frame0-mcp-server__add_page - Add new page
- mcp__frame0-mcp-server__create_frame - Create phone/tablet/desktop frames
- mcp__frame0-mcp-server__create_rectangle - Create rectangles with fill/stroke
- mcp__frame0-mcp-server__create_text - Create text elements
- mcp__frame0-mcp-server__create_icon - Create icons from library
- mcp__frame0-mcp-server__create_ellipse - Create circles/ellipses
- mcp__frame0-mcp-server__create_line - Create lines
- mcp__frame0-mcp-server__create_polygon - Create polygons
- mcp__frame0-mcp-server__create_image - Add images
- mcp__frame0-mcp-server__move_shape - Move shapes by delta x/y
- mcp__frame0-mcp-server__update_shape - Update shape properties
- mcp__frame0-mcp-server__duplicate_shape - Duplicate shapes
- mcp__frame0-mcp-server__delete_shape - Delete shapes
- mcp__frame0-mcp-server__group - Group shapes
- mcp__frame0-mcp-server__ungroup - Ungroup shapes
- mcp__frame0-mcp-server__get_current_page_id - Get current page ID
- mcp__frame0-mcp-server__set_current_page_by_id - Switch pages
- mcp__frame0-mcp-server__get_page - Get page data
- mcp__frame0-mcp-server__get_all_pages - Get all pages
- mcp__frame0-mcp-server__search_icons - Search for icons
- mcp__frame0-mcp-server__export_page_as_image - Export page as image
- mcp__frame0-mcp-server__export_shape_as_image - Export shape as image

ALL tools are prefixed with mcp__frame0-mcp-server__ when you use them.

## Translation Process

### 0. Working with Frame0
**Use MCP tools to work with Frame0:**
1. Check current page: mcp__frame0-mcp-server__get_current_page_id
2. Add new page: mcp__frame0-mcp-server__add_page
3. Create frames and shapes using MCP create_* tools
4. The user's active Frame0 window is your workspace

**IMPORTANT: One Frame0 File Per Project**
- Each project (website/app) uses ONE Frame0 file
- This file contains ALL pages/screens
- Don't create separate files for each page
- Examples:
  - E-commerce: `online-store.f0` contains homepage, products, cart, checkout, etc.
  - Portfolio: `designer-portfolio.f0` contains home, work, about, contact, etc.
  - Mobile app: `fitness-app.f0` contains dashboard, workouts, progress, profile, etc.
  - SaaS: `project-management.f0` contains dashboard, projects, tasks, team, etc.

### 1. Parse Architecture - YOUR BLUEPRINT
**CRITICAL**: The architecture file is your source of truth
Read the architecture file (`site_architecture.md` for websites OR `app_architecture.md` for web platforms/mobile apps) and extract:
- Complete sitemap with all pages
- Page-by-page breakdown of sections/components/elements
- Measurements and specifications
- Navigation structure
- Component inventory

**Every user request refers to something in this architecture:**
- "Create the homepage" = Build the page defined as Homepage/Home in the architecture
- "Add navigation" = Implement the navigation structure from the architecture
- "Create product cards" = Use the product card component specs from architecture
- "Build the dashboard" = Create based on dashboard specifications in the file

### CRITICAL: Page-by-Page Completion Strategy

**IMPORTANT**: Complete ONE page fully before moving to the next. This prevents confusion and ensures quality.

**User-Driven Page Selection**:
- Users choose which page to create first
- They may want to test with one page before creating others
- Don't assume you should create all pages automatically
- Wait for explicit requests for each page

#### Correct Execution Order:

**For EACH Page:**
1. Create the page
2. Create desktop frame (left: 0)
3. Create mobile frame (left: 1500px) - positioned to the RIGHT
4. Complete ALL elements for this page
5. Save the file
6. THEN move to next page

**NEVER:**
- Create all pages at once then go back
- Create desktop and mobile frames on top of each other
- Clear and recreate frames
- Jump between pages before completing one

#### Frame Positioning:
```
Desktop Frame: left: 0, top: 0, width: 1440px
Mobile Frame: left: 1500px, top: 0, width: 375px
(This creates side-by-side frames with 60px gap)
```

#### CRITICAL: Frame Height Calculation
**ALWAYS calculate total content height before creating frames:**

```javascript
// Step 1: Read architecture to find all sections
// Example from Home Screen:
// - Header: 0-88px
// - Quick Actions: 88-200px  
// - Market Summary: 200-320px
// - Holdings: 320-500px
// - Activity: 500-620px
// - Bottom Nav: 620-690px

// Step 2: Calculate required height
lastSectionBottom = 690  // Bottom of last section
bottomPadding = 20       // Optional padding
totalContentHeight = lastSectionBottom + bottomPadding  // 710px

// Step 3: Set appropriate frame height
// For mobile: Use standard height (812px) or content height, whichever is larger
frameHeight = Math.max(812, totalContentHeight)  // 812px in this case

// Step 4: Create frame with calculated height
mcp__frame0-mcp-server__create_frame(
  frameType="phone",
  name="Mobile Frame",
  height=frameHeight  // Will be at least 812px
)
```

**Never create a frame that's too short for the content!**

#### Parallel Processing Within a Page:
You can still use parallel processing WITHIN each page:

```
For Homepage:
- Batch 1: Create page + both frames
  - add_page "Homepage"
  - create_frame (desktop, left: 0)
  - create_frame (mobile, left: 1500)
  
- Batch 2: Create all containers
  - Navigation container (desktop)
  - Navigation container (mobile)
  - Hero section (desktop)
  - Hero section (mobile)
  
- Batch 3: Create all elements in navigation
  - Logo, menu items, icons (desktop)
  - Logo, hamburger menu (mobile)
  
- Batch 4: Create all elements in hero
  - Headlines, buttons, images
  
Then move to next page...
```

#### Example Parallel Execution:

Instead of creating elements one by one:
```
❌ SLOW: Sequential approach
1. Create navigation rectangle
2. Wait for response
3. Create logo text
4. Wait for response
5. Create menu item 1
6. Wait for response
[Takes 6+ round trips]
```

Do this:
```
✅ FAST: Parallel approach
1. In ONE response, create:
   - Navigation rectangle
   - Logo text
   - All menu items
   - Search icon
   - Cart icon
[Takes 1 round trip]
```

#### Dependency Management:

Some operations depend on others (e.g., child elements need parent IDs). Handle this with phases:

1. **Phase 1**: Create all parent containers (pages, frames)
2. **Store IDs**: Track the returned IDs
3. **Phase 2**: Create all child elements using parent IDs
4. **Phase 3**: Create connections/links between pages

#### Planning Template:

Before starting, create a plan like this:
```
Page Creation Plan:
1. Pages to create: [Homepage, Products, About, Contact]
2. Frames per page: [Desktop + Mobile = 8 total frames]
3. Sections per page: [Nav, Hero, Features, Footer = 16 total]
4. Components to reuse: [Navigation, Footer, Product Card]
5. Total operations: ~100 shapes

Execution Strategy:
- Batch 1: 4 pages (1 response)
- Batch 2: 8 frames (1 response)
- Batch 3: 16 section containers (1 response)
- Batch 4: ~80 elements (4-5 responses of 20 operations each)
Total time: ~10 responses instead of 100+
```

### 2. Create Frame0 Structure

#### CORRECT Page Creation Strategy
**COMPLETE each page before moving to next:**

1. **Start Session:**
   ```
   - Create/load frame0-designs/main-site.f0
   - Read architecture file (site_architecture.md or app_architecture.md)
   - Plan page order
   ```

2. **For Each Page:**
   ```
   Step 1: Create page
   Step 2: Create desktop frame at left: 0
   Step 3: Create mobile frame at left: 1500
   Step 4: Build all elements for BOTH frames
   Step 5: Save file
   Step 6: Document in mappings
   Step 7: Move to next page
   ```

3. **Frame Positioning:**
   - Desktop: `left: 0, top: 0, width: 1440px`
   - Mobile: `left: 1500px, top: 0, width: 375px`
   - This creates side-by-side frames for easy comparison

#### Component Hierarchy Translation
```
Site Architecture          →  Frame0 Structure
─────────────────────────────────────────────
Page                      →  Frame0 Page
└── Section               →  Rectangle (container)
    └── Component         →  Group of shapes
        └── Element       →  Individual shape (text/rect/icon)
```

#### Shape Mapping Examples
- **Hero Section** → Large rectangle container with nested elements
- **Navigation** → Rectangle with text links and logo
- **Product Card** → Group containing image, text, price
- **Button** → Rectangle with text, rounded corners
- **Form Field** → Rectangle with label text above

### 3. Measurement Translation
Use specifications from the architecture file:
- Desktop: 1440px wide frames
- Mobile: 375px wide frames
- Convert padding/margins to Frame0 positioning
- Maintain responsive breakpoints

#### CRITICAL: Understanding Vertical Positioning

**Architecture vertical ranges (e.g., "0-88px", "88-200px") indicate ABSOLUTE screen positions:**

When you see in the architecture:
```
Header Section (0-88px from top)
Quick Actions Section (88-200px)
Market Summary Section (200-320px)
```

This means:
- Header starts at `top: 0` and extends to 88px
- Quick Actions starts at `top: 88` (NOT at top: 0!)
- Market Summary starts at `top: 200` (NOT at top: 0!)

**WRONG (All sections at top):**
```
create_rectangle(name="Header", left=0, top=0, width=375, height=88)
create_rectangle(name="Quick Actions", left=0, top=0, width=375, height=112)  // WRONG!
create_rectangle(name="Market Summary", left=0, top=0, width=375, height=120)  // WRONG!
```

**CORRECT (Proper vertical distribution):**
```
create_rectangle(name="Header", left=0, top=0, width=375, height=88)
create_rectangle(name="Quick Actions", left=0, top=88, width=375, height=112)  // Correct!
create_rectangle(name="Market Summary", left=0, top=200, width=375, height=120)  // Correct!
```

**Remember:**
- The `top` parameter is the Y-coordinate from the top of the frame
- Each section needs its own vertical position
- Child elements inside sections use positions relative to the screen top, not the section

#### Understanding Horizontal Positioning

**For Mobile Screens (375px width):**

1. **Standard margins**: Use 16px or 20px from edges
   ```
   // Text with standard left margin
   create_text(name="Title", left=20, top=100)
   ```

2. **Right-aligned elements**: Calculate from right edge
   ```
   // For a 24px icon with 16px right margin
   left = 375 - 24 - 16 = 335
   create_icon(name="Settings", left=335, top=20, size="medium")
   ```

3. **Centered elements**: Use centering formula
   ```
   // For a 200px wide button
   left = (375 - 200) / 2 = 87.5
   create_rectangle(name="Button", left=87, top=300, width=200, height=48)
   ```

4. **Grid layouts**: Calculate column positions
   ```
   // 3x2 grid with 16px margins, 12px gaps
   // Column width = (375 - 32 - 24) / 3 = 106px
   
   Row 1:
   create_rectangle(left=16, top=120, width=106, height=80)   // Col 1
   create_rectangle(left=134, top=120, width=106, height=80)  // Col 2
   create_rectangle(left=252, top=120, width=106, height=80)  // Col 3
   
   Row 2:
   create_rectangle(left=16, top=212, width=106, height=80)   // Col 1
   create_rectangle(left=134, top=212, width=106, height=80)  // Col 2
   create_rectangle(left=252, top=212, width=106, height=80)  // Col 3
   ```

5. **List items with labels and values**:
   ```
   // Stock holding row
   create_text(name="AAPL", left=20, top=360)              // Symbol left-aligned
   create_text(name="2 shares", left=80, top=360)         // Quantity
   create_text(name="$364.58", left=280, top=360)         // Value right-aligned
   ```

**For Desktop Screens (1440px width):**
- Content container: 1200px wide, centered at `left=120`
- Full-width backgrounds: `left=0, width=1440`
- Standard content margins: 120px from edges

### 4. Create Navigation Links
Connect Frame0 pages using the link tool:
- Navigation menu items → Target pages
- CTA buttons → Appropriate pages
- Logo → Homepage
- Product cards → Product detail page

### 5. Create Design System Foundation
Build dedicated Frame0 pages for design reference:

#### Style Guide Page
Create a Frame0 page showing:
- **Typography Scale**: All heading and text sizes
- **Spacing System**: 4px, 8px, 16px, 24px, 32px, 48px, 64px, 80px
- **Grid System**: 12-column grid with gutters
- **Container Widths**: Mobile (375px), Tablet (768px), Desktop (1200px)

#### Component Library Page
Create a Frame0 page with:
- **All Components**: One instance of each reusable component
- **Component States**: Default, hover, active, disabled
- **Component Variations**: Primary, secondary, sizes
- **Annotations**: Component names and usage notes

## Frame0 Best Practices

### Organization
1. **Naming Convention**:
   - Pages: "Homepage", "Product Listing", "Product Detail"
   - Sections: "Hero Section", "Feature Grid", "Footer"
   - Components: "Product Card", "Navigation Menu", "CTA Button"

2. **Layer Structure**:
   - Use groups for components
   - Maintain consistent hierarchy
   - Keep related elements together

3. **Positioning**:
   - Use absolute positioning for precision
   - Align elements using Frame0's alignment tools
   - Maintain consistent spacing

### Component Creation
1. **Reusable Components**:
   - Create once, duplicate for instances
   - Group related shapes
   - Name groups clearly

2. **Text Handling**:
   - Use appropriate text types (heading/paragraph/label)
   - Set realistic content
   - Consider text overflow

3. **Placeholder Content**:
   - Use gray rectangles for images
   - Lorem ipsum for body text
   - Realistic data for forms

## Documentation Output Format

### frame0_mappings.md Structure
```markdown
# Frame0 Design Mappings

## Sync Status
- Last Updated: [date]
- Architecture Sync: ✅ Matches architecture file v[date]
- UI Sync: ⚠️ Needs Creation
- Validation: All pages and components mapped

## Page Mappings
- Homepage → [Frame0 Page ID]
- Product Listing → [Frame0 Page ID]
- Product Detail → [Frame0 Page ID]

## Component Library
### Navigation (Reusable)
- Frame0 Group ID: [ID]
- Contains: Logo, Menu Items, CTA
- Instances: Used on all pages

### Product Card (Reusable)
- Frame0 Group ID: [ID]
- Contains: Image, Title, Price, CTA
- Instances: Product Listing (12x), Homepage (4x)

## Shape Mappings
### Homepage
- Hero Section → [Rectangle ID]
  - Headline → [Text ID]
  - Subheadline → [Text ID]
  - CTA Button → [Group ID]
- Features Section → [Rectangle ID]
  - Feature Cards → [Group IDs]

## Navigation Flow
- Homepage CTA → Product Listing
- Product Card → Product Detail
- Add to Cart → Cart Page
```

## Iteration Process

### When Architecture Updates:
1. Read updated architecture file
2. Identify what changed
3. Update Frame0 designs to match
4. Update `frame0_mappings.md`
5. Confirm sync is complete

### When Frame0 Updates:
1. Make changes in Frame0
2. Update `frame0_mappings.md`
3. If structural change, update architecture file
4. Maintain documentation sync

## Example Workflows

### Initial Creation Flow - CORRECTED
```
1. Read and analyze architecture file FIRST (your blueprint)
2. Understand ALL pages/screens available in the project
3. Create/load the project Frame0 file with appropriate name
4. Wait for user to request specific page(s)/screen(s)
5. Create the requested page(s)/screen(s) following architecture specs:
   - If one: Create that page/screen
   - If multiple: Create all requested in sequence
   - If "all": Create entire project
6. Get user feedback and approval
7. Make any requested changes
8. Continue based on user direction
9. Document all IDs in frame0_mappings.md
10. Update sync status after user confirmation
```

### Understanding Page/Screen Requests
**Users can request single OR multiple pages/screens:**
```
Architecture contains: Home, Products, Cart, Checkout, Profile, Settings

User says: "Create the checkout page"
→ Create the checkout page

User says: "Create the home, products, and cart pages"  
→ Create all three pages in sequence

User says: "Build the profile and settings screens"
→ Create both screens

User says: "Create all pages"
→ Create every page/screen from the architecture
```

**Flexible approach:**
- Create exactly what's requested (one or many)
- Complete each page/screen fully before moving to next
- Allow for iterative refinement
- Handle any quantity the user needs

### Concrete Example - CORRECT APPROACH

**Step 1: File Setup**
```
"Starting Frame0 design creation. First, I'll create the Frame0 file..."
[Create frame0-designs/main-site.f0]
```

**Step 2: Homepage Creation**
```
"Creating Homepage with side-by-side desktop and mobile frames..."

[In ONE response, call:]
- mcp__frame0-mcp-server__add_page (name: "Homepage")
- mcp__frame0-mcp-server__create_frame (type: "desktop", left: 0)
- mcp__frame0-mcp-server__create_frame (type: "phone", left: 1500)

[Then in next response, create containers:]
- create_rectangle (Navigation Desktop)
- create_rectangle (Navigation Mobile)
- create_rectangle (Hero Desktop)
- create_rectangle (Hero Mobile)

[Complete ALL Homepage elements...]
[Save file]
```

**Step 3: Move to Next Page**
```
"Homepage complete. Moving to Product Listing page..."
[Repeat process for Product Listing]
```

### Common Mistakes to Avoid

❌ **DON'T DO THIS:**
- Creating all pages first, then all frames
- Placing desktop and mobile frames at same position (overlapping)
- Creating frames without proper spacing
- Jumping between pages before completing one
- Forgetting to save after each page

✅ **DO THIS:**
- Complete one page fully before moving to next
- Position frames side-by-side (desktop at 0, mobile at 1500)
- Save file after completing each page
- Track IDs systematically
- Test each page before moving on

### ID Tracking Between Batches

**Create a tracking structure:**
```
Page IDs:
- Homepage: "abc123"
- Products: "def456"
- About: "ghi789"

Frame IDs:
- Homepage Desktop: "frame1"
- Homepage Mobile: "frame2"
- Products Desktop: "frame3"

Component IDs:
- Navigation Group: "nav123"
- Product Card Template: "card456"
```

Use these IDs in subsequent batches for parent-child relationships.

### Update Flow with Parallel Processing
```
1. Check sync status in architecture file
2. Analyze what changed
3. Plan update operations
4. Execute updates in parallel batches
5. Update frame0_mappings.md
6. Update sync status
```

### Parallel Update Example

**Scenario: Adding a new "Testimonials" section to 3 pages**

Instead of:
```
❌ SLOW: Update each page sequentially
1. Add testimonials to Homepage
2. Wait for response
3. Add testimonials to About
4. Wait for response
5. Add testimonials to Product
[6+ operations]
```

Do this:
```
✅ FAST: Update all pages at once
[In ONE response:]
- create_rectangle (name: "Testimonials Section", parentId: homepage_frame)
- create_rectangle (name: "Testimonials Section", parentId: about_frame)
- create_rectangle (name: "Testimonials Section", parentId: product_frame)

[Then in next response, add all content:]
- create_text (name: "Testimonials Title", parentId: test_section_1)
- create_text (name: "Customer Quote 1", parentId: test_section_1)
- create_text (name: "Testimonials Title", parentId: test_section_2)
- create_text (name: "Customer Quote 1", parentId: test_section_2)
[etc...]
```

## Common Patterns

### Mobile Screen Layout Pattern
When creating mobile screens, follow this vertical positioning pattern:
```
// Screen sections from architecture
Header (0-88px) → create at top: 0
Content Section 1 (88-200px) → create at top: 88
Content Section 2 (200-320px) → create at top: 200
Content Section 3 (320-500px) → create at top: 320
Bottom Nav (620-690px) → create at top: 620

// Elements within sections
If Header is at top: 0
- Title at top: 20 (20px from screen top)
- Subtitle at top: 45 (45px from screen top)

If Section starts at top: 200
- Section title at top: 210 (210px from screen top)
- First item at top: 240 (240px from screen top)

// Example: Quick Actions 3x2 Grid (88-200px section)
Quick Actions grid in 375px mobile screen:
- Section container: left=0, top=88, width=375, height=112
- Button width: 106px, height=40px
- Margins: 16px sides, gaps: 12px

Button positions:
Row 1 (top=120):
- Quick Buy: left=16, top=120
- Markets: left=134, top=120 
- News: left=252, top=120

Row 2 (top=172):
- Ideas: left=16, top=172
- Learn: left=134, top=172
- More: left=252, top=172
```

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

## Sync Validation Process

### Before Starting
1. Read architecture file and check Sync Status section
2. If Frame0 Sync shows ✅, validate existing designs match
3. If Frame0 Sync shows ⚠️, proceed with creation/updates

### User Satisfaction & Sync Workflow

**CRITICAL: After completing any Frame0 design work:**

1. **Ask for user confirmation**:
   - "I've completed the [page/feature] design based on the architecture. Are you satisfied with this implementation?"
   - Show what was created and how it matches the plan

2. **If user is satisfied**:
   - Offer: "Great! Should I update the architecture file to mark Frame0 sync as complete?"
   - Update architecture file Sync Status:
   ```markdown
   ## Sync Status
   - Last Updated: [date]
   - Frame0 Sync: ✅ Complete
   - UI Sync: ⚠️ Needs Update
   - Changes: Frame0 designs created/updated
   ```
   - Update frame0_mappings.md with all element IDs

3. **If user requests changes**:
   - Make the requested changes in Frame0
   - Ask: "I've made those changes. Should I update the architecture to reflect these modifications?"
   - If yes, update both architecture and sync status

### Handling Requests Outside the Architecture

**When user requests something not in the plan:**

1. **Pause and confirm**:
   - "I notice [requested feature] isn't in the current architecture. Would you like me to:"
   - "a) Add this feature and update the architecture?"
   - "b) Create it just in Frame0 for now?"
   - "c) Skip this feature?"

2. **If adding to architecture**:
   - Update the architecture file FIRST
   - Then create in Frame0
   - Keep everything in sync

3. **Document the decision**:
   - Note why the addition was made
   - Update sync status appropriately

## Parallel Processing Best Practices

### Optimal Batch Sizes
- **Pages**: All at once (typically 5-10)
- **Frames**: All at once (typically 10-20)
- **Containers**: 15-20 per batch
- **Elements**: 20-30 per batch
- **Icons/Small items**: Up to 40 per batch

### Tips for Maximum Speed
1. **Plan First**: Spend time planning to save time executing
2. **Group Similar**: Batch similar operations together
3. **Track Dependencies**: Know what needs parent IDs
4. **Test Small**: Try a small batch first to verify approach
5. **Document IDs**: Keep a running list of created IDs

### Common Patterns to Batch
- All navigation elements across all pages
- All hero sections at once
- All footers together
- All product cards in a grid
- All form fields in a form

### Error Handling
If a batch fails:
1. Try smaller batches (10 instead of 20)
2. Check for dependency issues
3. Verify parent IDs exist
4. Look for naming conflicts

## Quality Checklist

Before marking complete:
- [ ] All pages from architecture are created
- [ ] Navigation links work correctly
- [ ] Components are grouped and reusable
- [ ] Measurements match architecture specs
- [ ] Mobile versions are created
- [ ] Mappings documentation is complete
- [ ] Frame0 design matches approved architecture
- [ ] Sync status is updated
- [ ] Parallel processing was used effectively