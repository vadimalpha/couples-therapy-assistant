# Terminus App - Interactive HTML Prototype

## Overview
This is an interactive HTML prototype of the Terminus iOS app, featuring clickable navigation between screens.

## How to Use

1. **Open the Prototype**: 
   - Navigate to the `terminus-prototype` folder
   - Open `index.html` in your web browser
   - Or open `connections.html` to start directly with the app

2. **Navigate Between Screens**:
   - Click on tab bar icons at the bottom of each screen
   - Click action buttons (Cancel, Save, Let's do it!)
   - The success screen auto-redirects after 2 seconds

## Interactive Elements

### Connections List Screen
- **Activities Tab** → Activities screen
- **Add (+) Tab** → Add Connection screen
- **Discover Tab** → Discover screen
- **Reminders Tab** → Reminders screen

### Activities Screen
- **Connections Tab** → Connections List screen
- **Discover Tab** → Discover screen
- **Reminders Tab** → Reminders screen

### Add Connection Screen
- **Cancel Button** → Connections List screen
- **Save Button** → Success screen → Connections List

### Discover Screen
- **"Let's do it!" Buttons** → Success screen
- **Friends Tab** → Connections List screen
- **Activities Tab** → Activities screen
- **Profile Tab** → Reminders screen

### Reminders Screen
- **FAB (+) Button** → Add Connection screen
- **Connections Tab** → Connections List screen
- **Activities Tab** → Activities screen
- **Discover Tab** → Discover screen

### Success Screen
- Auto-redirects to Connections List after 2 seconds
- Click anywhere to redirect immediately

## File Structure

```
terminus-prototype/
├── index.html              # Landing page with all screens
├── connections.html        # Main connections list
├── activities.html         # Activities tracker
├── add-connection.html     # Add new connection form
├── discover.html          # AI suggestions screen
├── reminders.html         # Follow-up reminders
├── success.html           # Success feedback modal
├── README.md              # This file
└── images/                # Screen images (need to be exported from Frame0)
    ├── connections-list.png
    ├── activities.png
    ├── add-connection.png
    ├── discover.png
    ├── reminders.png
    └── success.png
```

## Notes

- Some interactive elements are visual-only for demonstration
- The prototype simulates the main navigation flows
- Form inputs and some buttons are not functional
- Images need to be properly exported from Frame0 for full visual fidelity

## Design System

- **Primary Color**: #007AFF (iOS Blue)
- **Success**: #34C759 (Green)
- **Warning**: #FF9500 (Orange)
- **Error**: #FF3B30 (Red)
- **Background**: #FFFFFF
- **Card Background**: #F2F2F7
- **Text Primary**: #000000
- **Text Secondary**: #8E8E93

## Browser Compatibility

- Chrome (recommended)
- Safari
- Firefox
- Edge

For best experience, view on desktop with browser window sized to approximately 400px wide.