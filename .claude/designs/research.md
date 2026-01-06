# Research & Inspiration

## Project Context
Mobile Application - iOS app for memory and connection management (Terminus)

## Reference Apps

### App 1: LinkedIn
- **Platform**: iOS App
- **Type**: Competitor (professional networking)
- **Key Takeaways**:
  - Card-based contact layouts with key info visible
  - Clear connection status indicators
  - Simple, professional visual language
- **Detailed Analysis**: See `research/linkedin.md`

### App 2: Things 3
- **Platform**: iOS App
- **Type**: Inspiration (task/activity organization)
- **Key Takeaways**:
  - Minimalist design with focus on content
  - Smart time-based organization
  - Natural language input
- **Detailed Analysis**: See `research/things3.md`

### App 3: Pinterest
- **Platform**: iOS App
- **Type**: Inspiration (interest tracking)
- **Key Takeaways**:
  - Visual collections and boards
  - Quick save/organize actions
  - Discovery through shared interests
- **Detailed Analysis**: See `research/pinterest.md`

### App 4: Due
- **Platform**: iOS App
- **Type**: Inspiration (reminders)
- **Key Takeaways**:
  - Persistent reminder system
  - Time-centric interface
  - Minimal, focused design
- **Detailed Analysis**: See `research/due.md`

### App 5: Notion
- **Platform**: iOS App
- **Type**: Inspiration (flexible organization)
- **Key Takeaways**:
  - Customizable database views
  - Flexible property system
  - Multiple organization methods
- **Detailed Analysis**: See `research/notion.md`

## Design Patterns Observed

### Visual Language
- **Clean Minimalism**: All successful apps use plenty of white space
- **System Consistency**: Following iOS HIG for familiarity
- **Subtle Depth**: Cards, shadows, and layers to show hierarchy
- **Purposeful Color**: Minimal color use, mainly for actions and states

### Navigation Patterns
- **Bottom Tab Bar**: Standard iOS pattern for main sections
- **List-Based**: Primary content in scannable lists
- **Quick Actions**: Floating action buttons or swipe gestures
- **Search First**: Prominent search for large datasets

### Organization Methods
- **Smart Groups**: Automatic categorization (Today, Upcoming, Overdue)
- **Custom Collections**: User-created groups (boards, projects, tags)
- **Multiple Views**: Same data shown different ways (list, grid, calendar)
- **Filters & Sorts**: Save custom views for quick access

### Interaction Patterns
- **One-Tap Actions**: Primary actions immediately accessible
- **Swipe Gestures**: Quick actions without entering detail view
- **Long Press**: Context menus for additional options
- **Drag & Drop**: Reorganization of items

## Key Insights for Terminus Design

### Core UI Components

1. **Contact Cards**
   - Photo, name, and 2-3 key details visible
   - Last interaction date prominent
   - Shared interests as visual tags
   - Quick action buttons (message, remind, note)

2. **Smart Lists**
   - "Need to Follow Up" (overdue connections)
   - "Recently Met" (new connections to nurture)
   - "Share Your Interests" (grouped by common interests)
   - "Upcoming Reminders" (scheduled follow-ups)

3. **Interest System**
   - Visual tags with colors/icons
   - Multi-select for filtering
   - Quick add from contact view
   - Suggest connections based on shared interests

4. **Activity Tracking**
   - Simple list of saved activities
   - Categories (restaurants, events, hobbies)
   - Location/context aware
   - "Perfect for..." suggestions linking activities to contacts

5. **Reminder Design**
   - Natural language input ("Follow up with John next week")
   - Smart defaults based on relationship type
   - Persistent notifications option
   - Snooze with smart intervals

### Visual Design Direction

1. **Color Palette**
   - Primary: iOS system blue (#007AFF) for actions
   - Success: Green for completed follow-ups
   - Warning: Orange/red for overdue items
   - Background: White with light gray sections
   - Text: Black primary, gray secondary

2. **Typography**
   - SF Pro Display for headers
   - SF Pro Text for body
   - Clear hierarchy with size and weight
   - Generous line spacing for readability

3. **Modern Touches**
   - Subtle gradients on buttons
   - Smooth corner radius (matching iOS standards)
   - Contextual haptic feedback
   - Fluid animations for state changes
   - Glass morphism for overlays

### Unique Terminus Features

1. **Relationship Health Indicator**
   - Visual indicator showing interaction frequency
   - Color-coded (green = healthy, yellow = needs attention, red = dormant)

2. **Interest Matching**
   - When viewing a contact, highlight shared interests
   - Suggest activities you both might enjoy

3. **Smart Reminders**
   - AI-suggested follow-up times based on relationship pattern
   - Context-aware reminders ("You're near John's office")

4. **Memory Captures**
   - Quick photo/note during meetings
   - Automatically linked to contact and date
   - Searchable conversation topics

5. **Batch Operations**
   - Select multiple contacts for group activities
   - Bulk reminder scheduling
   - Mass interest tagging