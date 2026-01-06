# App Architecture for Terminus iOS App

## 1. Complete Screen Map

### Primary Navigation (Tab Bar)
```
/
├── /connections (Connections Tab)
│   ├── /connections/list (default view)
│   ├── /connections/smart-lists
│   │   ├── /connections/smart-lists/need-follow-up
│   │   ├── /connections/smart-lists/recently-met
│   │   ├── /connections/smart-lists/share-interests
│   │   └── /connections/smart-lists/upcoming-reminders
│   ├── /connections/detail/[id]
│   ├── /connections/add-new
│   └── /connections/search
├── /activities (Activities Tab)
│   ├── /activities/list (default view)
│   ├── /activities/categories
│   │   ├── /activities/categories/restaurants
│   │   ├── /activities/categories/events
│   │   ├── /activities/categories/hobbies
│   │   └── /activities/categories/places
│   ├── /activities/detail/[id]
│   ├── /activities/add-new
│   └── /activities/search
├── /discover (Discover Tab)
│   ├── /discover/for-you
│   ├── /discover/by-interest
│   └── /discover/by-location
├── /reminders (Reminders Tab)
│   ├── /reminders/today
│   ├── /reminders/upcoming
│   ├── /reminders/overdue
│   └── /reminders/completed
└── /profile (Profile Tab)
    ├── /profile/my-interests
    ├── /profile/settings
    ├── /profile/preferences
    └── /profile/help
```

### Modal/Overlay Screens
```
├── /quick-add (floating action button)
│   ├── /quick-add/connection
│   ├── /quick-add/activity
│   └── /quick-add/reminder
├── /memory-capture
├── /interest-picker
└── /notification-settings
```

## 2. Screen-by-Screen Breakdown

### Connections Tab - List View
Purpose: Primary view for managing all connections with smart organization

#### Status Bar (0-44px)
└── System Status Bar
    ├── Time (left)
    ├── Carrier/WiFi (center)
    └── Battery/Icons (right)

#### Navigation Bar (44-88px)
├── Title Component
│   └── "Connections" (H1, SF Pro Display, 34pt)
├── Search Button (right, 44x44px)
└── Add Button (right, 44x44px)

#### Smart Lists Section (88-280px)
├── Section Container (padding: 16px)
│   └── Smart List Grid (2x2 grid, gap: 12px)
│       ├── Need Follow-up Card (165x80px)
│       │   ├── Icon (24x24px)
│       │   ├── Title (SF Pro Text, 15pt)
│       │   └── Count Badge (20px height)
│       ├── Recently Met Card (165x80px)
│       ├── Share Interests Card (165x80px)
│       └── Upcoming Reminders Card (165x80px)

#### Connections List Section (280px-bottom)
├── List Container (full width)
│   └── Connection Cards (repeated)
│       ├── Card Container (height: 88px, padding: 16px)
│       │   ├── Profile Image (56x56px, rounded)
│       │   ├── Content Area (flex: 1)
│       │   │   ├── Name (SF Pro Text, 17pt, semibold)
│       │   │   ├── Last Interaction (SF Pro Text, 13pt, gray)
│       │   │   └── Interest Tags Container
│       │   │       └── Interest Tag (repeated, height: 24px)
│       │   └── Relationship Health Indicator (8x88px)
│       └── Swipe Actions (hidden)
│           ├── Message Action (80px wide)
│           ├── Remind Action (80px wide)
│           └── Note Action (80px wide)

#### Tab Bar (bottom 49px + safe area)
└── Tab Bar Container
    ├── Connections Tab (active)
    ├── Activities Tab
    ├── Discover Tab
    ├── Reminders Tab
    └── Profile Tab

### Connection Detail Screen
Purpose: View and manage individual connection details

#### Navigation Bar (0-88px)
├── Back Button (left, 44x44px)
├── Title "Contact" (center)
└── Edit Button (right, 44x44px)

#### Header Section (88-250px)
├── Profile Container (padding: 24px)
│   ├── Profile Image (80x80px, centered)
│   ├── Name (H1, SF Pro Display, 28pt, centered)
│   ├── Relationship Health Bar (width: 200px, height: 4px)
│   └── Last Interaction Text (SF Pro Text, 15pt, gray)

#### Quick Actions Section (250-330px)
├── Actions Container (padding: 16px)
│   └── Button Row (4 buttons, equal width)
│       ├── Message Button (icon + label)
│       ├── Call Button (icon + label)
│       ├── Reminder Button (icon + label)
│       └── Note Button (icon + label)

#### Shared Interests Section (330-450px)
├── Section Header
│   ├── Title "Shared Interests" (SF Pro Text, 20pt, semibold)
│   └── Edit Link (right)
└── Interest Tags Container (horizontal scroll)
    └── Interest Tags (repeated, 32px height)

#### Suggested Activities Section (450-620px)
├── Section Header "Perfect Activities Together"
└── Activity Cards Container (horizontal scroll)
    └── Activity Mini-Cards (120x100px each)

#### Recent Memories Section (620px-bottom)
├── Section Header "Recent Memories"
└── Memory List
    └── Memory Items (repeated)
        ├── Date (SF Pro Text, 13pt, gray)
        ├── Note/Photo Preview
        └── Context Tags

### Add New Connection Screen
Purpose: Efficiently add a new connection with key details

#### Navigation Bar (0-88px)
├── Cancel Button (left)
├── Title "New Connection" (center)
└── Save Button (right, disabled initially)

#### Form Content (88px-bottom)
├── Photo Section (88-200px)
│   ├── Photo Placeholder (80x80px, centered)
│   └── "Add Photo" Button
├── Basic Info Section (200-400px)
│   ├── Name Input Field (required)
│   │   ├── Label "Name" (SF Pro Text, 13pt)
│   │   └── Input (height: 44px)
│   ├── Company Input Field
│   └── Role Input Field
├── Context Section (400-550px)
│   ├── "Where did you meet?" Input
│   └── "When did you meet?" Date Picker
├── Interests Section (550-700px)
│   ├── Section Header "Their Interests"
│   ├── Add Interest Button
│   └── Selected Interests Display
└── Notes Section (700px-bottom)
    ├── Section Header "Quick Note"
    └── Text Area (min-height: 88px)

### Activities Tab - List View
Purpose: Track and discover activities/things to do

#### Navigation Bar (44-88px)
├── Title "Activities" (H1, 34pt)
├── Search Button (right)
└── Add Button (right)

#### Categories Section (88-220px)
├── Category Grid (2x2)
│   ├── Restaurants Card (icon + count)
│   ├── Events Card (icon + count)
│   ├── Hobbies Card (icon + count)
│   └── Places Card (icon + count)

#### Activities List (220px-bottom)
├── Section Header "All Activities"
└── Activity Cards (repeated)
    ├── Activity Name (SF Pro Text, 17pt)
    ├── Category Tag
    ├── Location (if applicable)
    └── "Good for" Connection Tags

### Add New Activity Screen
Purpose: Quick capture of activities to remember

#### Navigation Bar (0-88px)
├── Cancel Button (left)
├── Title "New Activity" (center)
└── Save Button (right)

#### Form Content (88px-bottom)
├── Activity Name Input (88-160px)
├── Category Picker (160-240px)
├── Location Section (240-340px)
│   ├── Location Toggle
│   └── Location Display/Picker
├── Tags Section (340-440px)
│   ├── "Good for" Label
│   └── Connection Multi-Select
└── Notes Section (440px-bottom)

### Reminders Tab
Purpose: Time-centric view of all follow-up reminders

#### Navigation Bar (44-88px)
├── Title "Reminders" (H1, 34pt)
└── Filter Button (right)

#### Time Sections (88px-bottom)
├── Today Section
│   ├── Section Header with Count
│   └── Reminder Items (repeated)
│       ├── Time (if set)
│       ├── Connection Name
│       ├── Reminder Text
│       └── Action Buttons (Done/Snooze)
├── Upcoming Section
├── Overdue Section (if any)
│   └── Items highlighted in red
└── Completed Section (collapsed by default)

### Set Reminder Flow
Purpose: Natural language reminder creation

#### Modal Container (centered, 90% width)
├── Header "Set Reminder"
├── Natural Language Input
│   └── Placeholder: "Follow up with John next week"
├── Smart Suggestions
│   ├── "In 1 week"
│   ├── "In 2 weeks"
│   ├── "In 1 month"
│   └── "Custom..."
├── Notification Options
│   ├── Standard Notification (toggle)
│   └── Persistent Reminder (toggle)
└── Action Buttons
    ├── Cancel
    └── Set Reminder

### Discover Tab
Purpose: Find connections and activities based on context

#### Navigation Bar (44-88px)
└── Title "Discover" (H1, 34pt)

#### Content Sections (88px-bottom)
├── For You Section
│   ├── "People to reconnect with"
│   └── Connection suggestions based on time
├── By Interest Section
│   ├── Interest filter pills
│   └── Connections sharing selected interests
└── By Location Section
    ├── "Nearby activities"
    └── Location-based suggestions

## 3. User Flows

### Primary Flow: Adding a New Connection
```
START → Connections Tab → Tap Add Button → Add New Connection Screen
                                         ↓
                            Enter Name & Basic Info
                                         ↓
                            Add Context (Where/When Met)
                                         ↓
                            Select Their Interests
                                         ↓
                            Optional: Add Quick Note
                                         ↓
                            Save → Return to Connections List
                                         ↓
                            Optional: Set Follow-up Reminder
```

### Recording an Activity Flow
```
START → Activities Tab → Tap Add Button → Add New Activity Screen
                    ↓                              ↓
            View Categories              Enter Activity Name
                    ↓                              ↓
            Filter by Category            Select Category
                                                   ↓
                                          Add Location (optional)
                                                   ↓
                                          Tag "Good for" Connections
                                                   ↓
                                          Save → Return to List
```

### Setting Up a Follow-up Reminder Flow
```
Two Entry Points:

1. From Connection:
   Connections Tab → Connection Detail → Reminder Button → Set Reminder Modal
                                                               ↓
                                                    Natural Language Input
                                                               ↓
                                                    Choose/Confirm Time
                                                               ↓
                                                    Set Notification Type
                                                               ↓
                                                    Save → Confirmation

2. From Quick Add:
   Any Screen → FAB → Quick Reminder → Select Connection → Set Reminder Modal
                                                               ↓
                                                    (Same flow as above)
```

### Finding Something to Do Flow
```
START → Two Paths:

Path 1 - Browse Activities:
Activities Tab → Browse List/Categories → Activity Detail → View "Good for" Tags
                                                               ↓
                                                    Select Connection(s)
                                                               ↓
                                                    Message/Plan Activity

Path 2 - Discover Based on Interest:
Discover Tab → By Interest → Select Interest → View Matching Connections
                                                        ↓
                                              View Suggested Activities
                                                        ↓
                                              Plan Activity Together
```

## 4. Component Library

### Navigation Components
- **Tab Bar**: 5 tabs with icons and labels (49px + safe area)
- **Navigation Bar**: Standard iOS pattern with title and actions (44px)
- **Search Bar**: Expandable search with cancel button
- **Back Button**: Standard iOS chevron pattern

### Card Components
- **Connection Card**: 88px height with profile, info, and health indicator
- **Smart List Card**: 80px height with icon, title, and count
- **Activity Card**: 72px height with name, category, and tags
- **Reminder Card**: Variable height with time, person, and actions

### Form Components
- **Text Input**: 44px height with floating label
- **Multi-Select Pills**: Tag-style selection for interests
- **Date/Time Picker**: iOS native components
- **Toggle Switch**: Standard iOS toggle

### Feedback Components
- **Relationship Health Bar**: 4px colored progress bar
- **Count Badge**: Circular badge with number
- **Empty States**: Illustration + message + action
- **Loading States**: Skeleton screens for lists

### Action Components
- **Primary Button**: 44px height, full corner radius
- **Icon Button**: 44x44px touch target
- **Floating Action Button**: 56px circle with plus icon
- **Swipe Actions**: 80px wide action panels

## 5. Interaction Patterns

### Gestures
- **Swipe Right**: Reveal quick actions on connections
- **Swipe Left**: Delete/archive actions
- **Long Press**: Context menu for additional options
- **Pull to Refresh**: Update lists with latest data
- **Pinch to Zoom**: On memory photos

### Transitions
- **Push Navigation**: Standard iOS slide from right
- **Modal Presentation**: Slide up from bottom
- **Tab Switch**: Instant with persistence
- **Card Expansion**: Smooth scale and fade

### Feedback
- **Haptic Feedback**: On significant actions (save, delete)
- **Visual Feedback**: Button states, loading indicators
- **Success States**: Green checkmarks, brief confirmations
- **Error States**: Red highlights with clear messages

## 6. Data Relationships

```
User
├── Connections[]
│   ├── Basic Info (name, photo, company, role)
│   ├── Interests[] (many-to-many)
│   ├── Last Interaction Date
│   ├── Relationship Health Score
│   └── Memories[]
├── Activities[]
│   ├── Name, Category, Location
│   ├── Good For Connections[] (many-to-many)
│   └── Notes
├── Reminders[]
│   ├── Connection (one-to-one)
│   ├── Due Date/Time
│   ├── Message
│   ├── Notification Type
│   └── Status (pending/completed/snoozed)
└── Interests[]
    ├── Name, Icon, Color
    └── Shared With Connections[]
```

## 7. Responsive Behavior

### Portrait Orientation (Primary)
- Optimized for one-handed use
- Bottom navigation easily reachable
- Critical actions in thumb zone

### Landscape Orientation
- List views show more content
- Detail views use two-column layout
- Tab bar remains at bottom

### Accessibility
- Dynamic Type support
- VoiceOver optimized
- High contrast mode support
- Reduce motion options

## 8. Performance Considerations

### Offline Capability
- Core data cached locally
- Sync when connection available
- Clear offline indicators

### Smart Loading
- Lazy load images
- Infinite scroll for long lists
- Preload next likely screen

### Search Optimization
- Local search first
- Fuzzy matching on names
- Recent searches cached

## 9. Sync Status
- Last Updated: 2025-08-05
- Frame0 Sync: ⚠️ Needs Creation
- UI Sync: ⚠️ Needs Creation
- Changes: Initial architecture created