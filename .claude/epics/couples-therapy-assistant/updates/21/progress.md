---
issue: 21
title: UI/UX Mockups & Design System
started: 2025-12-24T02:26:02Z
status: in_progress
---

# Issue #21 Progress: UI/UX Mockups & Design System

## Completed

### Design System (CSS)
- Color palette with full shade ranges (50-900)
- Typography scale using Inter and Nunito Sans
- Spacing system (8px grid)
- Component styles: buttons, inputs, cards, badges, alerts
- Crisis footer styling
- Loading states (spinner, skeleton)
- Toggle switches, progress bars
- Responsive utilities

### HTML Prototype Screens Created
1. **Authentication (4 screens)**
   - Login
   - Register
   - Forgot Password
   - Accept Invitation (Partner B)

2. **Onboarding (4 screens)**
   - Intake Survey - Start
   - Intake Survey - Questions (with progress bar)
   - Intake Survey - Complete
   - Invite Partner

3. **Dashboard (3 screens)**
   - Dashboard - Empty State
   - Dashboard - With Conflicts
   - Dashboard - Partner B Pending

4. **Conflict Flow (5 screens)**
   - Create Conflict Form
   - Conflict Waiting for Partner
   - Respond to Conflict (Blind Input)
   - Individual Guidance Only
   - Full Guidance (All 3 phases)

5. **States (2 screens)**
   - Loading State
   - Crisis Resources

## Files Created
- `designs/prototypes/design-system.css` - Full design system
- `designs/prototypes/index.html` - Interactive prototype with 18+ screens

## How to View
Open `designs/prototypes/index.html` in a browser. Use the left sidebar to navigate between screens.

### Chat-Based UI Update (Dec 25)
Based on epic changes to conversational approach:

6. **New Chat Flow Screens (7 screens)**
   - Conflict Start (topic entry)
   - Exploration Chat (Partner A with AI)
   - Exploration Ready (confirmation)
   - Waiting for Partner
   - Partner B Chat (blind input as chat)
   - Guidance Chat (AI-delivered guidance)
   - Shared Relationship Chat (both partners + AI)

7. **Chat UI Components Added**
   - Chat message bubbles (user/AI/partner variants)
   - Streaming indicator animation
   - Chat input with send button
   - "I'm Ready" button for conversation finalization
   - Participant badges for shared chat
   - Partner-colored avatars and message styles

## Remaining Work
- [ ] Mobile responsive testing
- [ ] Add remaining screens (Settings, Terms, Privacy)
- [ ] Component library reference page
- [ ] Export design tokens for development

## Notes
- Used calming color palette suitable for sensitive relationship topics
- Implemented crisis footer on guidance pages
- "Report this advice" button included on all guidance cards
- Blind input flow clearly explained to Partner B
- **NEW**: Conversational chat approach replaces form-based conflict entry
- **NEW**: Guidance delivered as chat messages, not cards
- **NEW**: Shared relationship chat where both partners interact with AI together
