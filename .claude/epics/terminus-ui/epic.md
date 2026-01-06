---
name: terminus-ui
status: backlog
created: 2025-08-30T18:51:57Z
progress: 0%
prd: .claude/prds/terminus.md
github: [Will be updated when synced to GitHub]
---

# Epic: Terminus UI/UX Implementation

## Overview

Implementation of the complete iOS user interface for the Terminus social activity app, leveraging existing HTML prototypes and design specifications. Focus on creating a minimal, refined iOS-native experience with AI-powered features for connection management and activity discovery.

## Architecture Decisions

- **Framework**: SwiftUI for iOS 15+ with UIKit integration where needed
- **Design System**: iOS Human Interface Guidelines with custom Terminus branding
- **State Management**: SwiftUI @StateObject and @ObservableObject patterns
- **Navigation**: iOS TabView with NavigationView hierarchy
- **Image Handling**: AsyncImage for profile photos with local caching
- **Accessibility**: Full VoiceOver support and Dynamic Type compliance

## Technical Approach

### Frontend Components

**Core UI Components**:
- Custom TabBar with 5 sections (Connections, Activities, Discover, Reminders, Profile)
- ConnectionCard component with profile images and relationship health indicators
- ActivityCard component with category icons and "good for" tags
- SmartListCard component for connection smart lists
- MoodSelectorChips for activity discovery filtering
- TimeDurationChips for activity planning
- FloatingActionButton (FAB) for quick actions

**State Management**:
- ConnectionsViewModel for contact intelligence
- ActivitiesViewModel for interest and activity management
- RemindersViewModel for follow-up management
- DiscoverViewModel for AI-powered recommendations
- UserPreferencesModel for settings and onboarding

**User Interaction Patterns**:
- Swipe actions on connection cards (message, remind, note)
- Pull-to-refresh on all list views
- Modal presentations for forms and detail views
- Success states with auto-dismiss functionality
- Inline photo upload with camera/library picker

### Backend Services

**Required API Endpoints** (UI Integration Focus):
- GET/POST /connections - Contact CRUD operations
- GET/POST /activities - Activity tracking endpoints  
- GET/POST /reminders - Reminder management
- GET /discover - AI recommendation engine
- POST /upload/photo - Profile image handling

**Data Models**:
- Connection model with photo URL and relationship metadata
- Activity model with categories and connection associations
- Reminder model with status and notification preferences
- DiscoverResult model for AI recommendations

### Infrastructure

**iOS-Specific Requirements**:
- Core Data for local storage and offline capabilities
- CloudKit integration for cross-device synchronization
- Push Notifications for reminder alerts
- Photos framework for profile image management
- Contacts framework integration (with permission handling)

## Implementation Strategy

### Phase 1: Core UI Framework (Week 1-2)
- Set up SwiftUI project structure with design system
- Implement TabBar navigation and core screens
- Create reusable UI components library
- Integrate existing HTML prototype designs

### Phase 2: Connection Management UI (Week 3-4)
- ConnectionsListView with smart lists and search
- AddConnectionView with photo upload and inline reminder toggle
- ConnectionDetailView with shared interests and activity suggestions
- Swipe actions implementation

### Phase 3: Activity Discovery UI (Week 5)
- ActivitiesListView with category filtering
- DiscoverView with mood and time chips
- Activity recommendation cards with "Let's do it" actions
- AddActivityView with categorization

### Phase 4: Reminders & Polish (Week 6)
- RemindersView with Done/Snooze actions
- Success states and micro-interactions
- Accessibility testing and compliance
- Performance optimization and testing

## Task Breakdown Preview

High-level task categories (≤10 tasks):
- [ ] **Design System Setup**: SwiftUI theme, colors, typography, component library
- [ ] **Tab Navigation**: TabBar implementation with 5 main sections
- [ ] **Connections UI**: List, detail, and add connection screens
- [ ] **Activities UI**: Activity tracking and categorization interfaces
- [ ] **Discovery UI**: AI recommendation interface with mood/time filtering
- [ ] **Reminders UI**: Reminder management with Done/Snooze actions
- [ ] **Profile & Settings**: User preferences and app settings
- [ ] **Form Components**: Photo upload, text inputs, toggles, pickers
- [ ] **Success States**: Confirmation modals and feedback animations
- [ ] **Accessibility & Polish**: VoiceOver, Dynamic Type, performance optimization

## Dependencies

**External Dependencies**:
- iOS 15.0+ deployment target
- Existing design assets in `.claude/designs/prototypes/`
- App architecture specifications in `.claude/designs/app_architecture.md`

**Internal Dependencies**:
- Backend API endpoints (can be mocked initially)
- Core Data models (can be created alongside UI)
- Authentication system (can be stubbed)

**Design Assets Available**:
- HTML prototypes for all major screens
- App architecture with detailed component specifications
- Frame0 design system documentation
- Visual mockups and interaction patterns

## Success Criteria (Technical)

**Performance Benchmarks**:
- App launch time: <2 seconds cold start
- Screen transitions: <300ms navigation
- List scrolling: 60 FPS with 1000+ items
- Image loading: Progressive with placeholder states

**Quality Gates**:
- 100% VoiceOver accessibility coverage
- Zero memory leaks in Instruments
- App Store submission ready
- iOS Human Interface Guidelines compliance

**Acceptance Criteria**:
- All screens from HTML prototypes implemented
- Mood and time-based filtering functional
- Photo upload and profile management working
- Success states and micro-interactions polished
- Offline data persistence functional

## Estimated Effort

**Overall Timeline**: 6 weeks (1.5 months)
**Resource Requirements**: 1 iOS developer, 1 designer (part-time for consultation)
**Critical Path Items**:
1. Design system and component library (Week 1)
2. Core navigation and data flow (Week 2)
3. Connection management UI (Week 3-4)
4. Activity and discovery UI (Week 5)
5. Polish and accessibility (Week 6)

**Risk Mitigation**:
- Use existing HTML prototypes as pixel-perfect reference
- Implement mocked data initially to unblock UI development
- Progressive enhancement approach for advanced features
- Regular design review sessions to ensure fidelity