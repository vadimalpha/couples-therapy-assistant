---
name: terminus
description: AI-powered social activity app that tracks interests and manages connections for busy professionals
status: backlog
created: 2025-08-30T18:11:11Z
---

# PRD: Terminus

## Executive Summary

Terminus is an AI-powered iOS application designed to solve the modern networking professional's challenge of managing connections and finding meaningful activities. The app intelligently tracks user interests, monitors friend availability, and provides personalized recommendations to combat boredom while strengthening professional and personal relationships.

**Value Proposition**: Transform idle time into meaningful experiences by leveraging AI to suggest activities and remind users to nurture important relationships based on shared interests.

## Problem Statement

**Core Problems**:
1. **Connection Overload**: High-volume networkers struggle to maintain meaningful relationships with numerous connections
2. **Activity Paralysis**: Busy professionals forget interesting activities when they have spare time
3. **Relationship Decay**: Important new connections are forgotten without systematic follow-up

**Why Now**:
- Post-pandemic shift toward intentional relationship building
- Increased networking through digital platforms creating connection management challenges
- Growing awareness of mental health benefits from meaningful social activities
- AI capabilities now mature enough to provide intelligent, contextual recommendations

## User Stories

### Primary User Personas

**1. The High-Volume Networker (Primary)**
- Age: 28-45
- Role: Sales executives, consultants, entrepreneurs
- Pain: Meets 10-20 new people weekly, struggles to follow up meaningfully
- Goal: Maintain valuable connections without letting relationships fade

**2. The Busy Executive (Secondary)**  
- Age: 35-55
- Role: C-suite, senior managers, celebrities
- Pain: Limited free time, wants to maximize social ROI
- Goal: Optimize social activities for both enjoyment and relationship building

**3. The Social Organizer (Tertiary)**
- Age: 25-40
- Role: Event planners, community managers, influencers
- Pain: Constantly planning activities for others, neglects own interests
- Goal: Better work-life balance through personal activity management

### Detailed User Journeys

**Journey 1: New Connection Follow-up**
1. User meets someone at a conference, adds them to Terminus
2. App captures shared interests during initial interaction logging
3. AI suggests follow-up timing and activity based on interest overlap
4. User receives reminder with personalized message suggestions
5. Connection deepens through shared activity recommendation

**Journey 2: Boredom to Activity**
1. User opens app during free time/boredom
2. App analyzes available time, location, energy level
3. AI suggests activities matching current mood and interests
4. App checks friend availability for social options
5. User books activity or invites available friends

**Journey 3: Interest Discovery and Tracking**
1. User logs new interest or activity they enjoyed
2. App categorizes and creates future recommendation triggers
3. System learns preferences and suggests related activities
4. Interest evolves through continued tracking and refinement

## Requirements

### Functional Requirements

**Core Features**:

1. **Contact Intelligence**
   - Import contacts with relationship context tagging
   - Track interaction history and shared interests
   - AI-powered follow-up timing recommendations
   - Relationship strength scoring and tracking

2. **Interest Management**
   - Personal interest catalog with categorization
   - Activity logging and experience rating
   - Interest evolution tracking over time
   - Shared interest identification between connections

3. **Activity Recommendations**
   - Context-aware activity suggestions (time, location, mood, energy)
   - Friend availability integration
   - Interest-based filtering and personalization
   - Real-time event and activity discovery

4. **Social Coordination**
   - Friend availability status and preferences
   - Group activity planning and invitation system
   - Calendar integration for scheduling
   - Activity history and shared experience tracking

5. **AI-Powered Insights**
   - Relationship maintenance recommendations
   - Optimal activity timing suggestions
   - Interest pattern recognition and suggestions
   - Connection strength analytics

**User Interface**:
- Minimal, refined iOS design aesthetic
- Quick activity logging and interest capture
- Dashboard with personalized recommendations
- Contact relationship visualization
- Activity planning and invitation flows

### Non-Functional Requirements

**Performance**:
- App launch time: <2 seconds
- Recommendation generation: <1 second
- Contact sync: Real-time
- Offline activity logging capability

**Security**:
- End-to-end encryption for personal data
- Secure contact information handling
- Privacy-first AI processing (on-device when possible)
- GDPR and CCPA compliance

**Scalability**:
- Support 10,000+ contacts per user
- Handle 100,000+ concurrent users
- Scalable AI recommendation engine
- Cloud-based data synchronization

**Usability**:
- Intuitive onboarding flow (<5 minutes)
- Accessibility compliance (WCAG 2.1 AA)
- Multi-language support (English, Spanish, French initially)
- iOS Human Interface Guidelines adherence

## Success Criteria

**Primary KPIs**:
1. **User Engagement**: 70% weekly active users within 6 months
2. **Connection Quality**: 40% increase in meaningful follow-ups per user
3. **Activity Completion**: 60% of recommended activities attempted
4. **Relationship Strength**: 25% improvement in user-reported relationship quality

**Secondary Metrics**:
- App retention: 60% at 30 days, 30% at 90 days
- Daily session time: Average 8-12 minutes
- Recommendation accuracy: 75% user satisfaction rating
- Feature adoption: 80% of users utilize core features within first week

**Business Metrics**:
- User acquisition cost < $25
- Monthly churn rate < 10%
- App Store rating > 4.2 stars
- Organic growth rate > 20% monthly

## Constraints & Assumptions

**Technical Constraints**:
- iOS exclusive (iPhone and iPad compatibility required)
- Requires iOS 15.0 minimum
- AI processing must respect device performance limitations
- Contact access requires user permission

**Resource Constraints**:
- Initial launch budget: $500K development + $200K marketing
- 6-month development timeline
- Team size: 5 developers, 2 designers, 1 product manager
- AI/ML expertise required for recommendation engine

**Business Constraints**:
- Must comply with App Store guidelines
- Privacy regulations (GDPR, CCPA) compliance mandatory
- Cannot store sensitive contact data without explicit consent
- Freemium model with premium features for monetization

**Key Assumptions**:
- Users willing to manually input relationship context initially
- iOS users comfortable with AI-powered recommendations
- Network effects will drive organic growth
- Privacy concerns won't prevent adoption among target audience

## Out of Scope

**Explicitly NOT Building**:
- Android version (Phase 1)
- Web application or desktop client
- Direct messaging or communication features
- Event creation or booking platform
- Payment processing for activities
- Enterprise or team features
- Integration with dating apps
- Public social network features
- Location tracking without explicit permission

**Future Considerations**:
- Android expansion (Phase 2)
- Web companion dashboard (Phase 3)
- Enterprise networking features (Phase 3)
- Integration with CRM systems (Phase 4)

## Dependencies

### External Dependencies

**Technology**:
- iOS SDK and development tools
- Core ML framework for on-device AI processing
- CloudKit for data synchronization
- EventKit for calendar integration
- Contacts framework for address book access

**Third-Party Services**:
- OpenAI/Anthropic API for advanced AI features
- Apple Push Notification Service
- App Store Connect for distribution
- Analytics platform (Firebase or Mixpanel)
- Crash reporting service (Crashlytics)

**Data Sources**:
- User-generated content and manual input
- Public event APIs (Eventbrite, Facebook Events)
- Location-based activity services (Foursquare, Google Places)
- Calendar and contact system integration

### Internal Dependencies

**Team Dependencies**:
- iOS development team (3 senior developers)
- AI/ML engineering (1 specialist)
- UX/UI design team (2 designers)
- Backend infrastructure team (1 developer)
- Product management and user research

**Infrastructure**:
- Cloud hosting platform (AWS/Google Cloud)
- CI/CD pipeline setup
- App Store developer account
- Beta testing infrastructure (TestFlight)
- User feedback and analytics systems

**Timeline Dependencies**:
- Design system completion: Month 1
- Core backend architecture: Month 2
- AI recommendation engine: Month 3-4
- iOS app development: Month 2-5
- Testing and refinement: Month 5-6
- App Store review and launch: Month 6

## Design Assets

**Existing Design Documentation**:
- **App Architecture**: `.claude/designs/app_architecture.md` - Complete screen map and user flow definitions
- **HTML Prototypes**: `.claude/designs/prototypes/` - Interactive mockups of key screens:
  - `index.html` - Main dashboard/connections view
  - `connections.html` - Connections list and management
  - `activities.html` - Activities tracking and discovery
  - `discover.html` - AI-powered recommendations
  - `add-connection.html` - New connection capture flow
  - `reminders.html` - Follow-up reminder management
  - `success.html` - Confirmation and success states
- **Frame0 Integration**: `.claude/designs/frame0-docs/` - Design system tooling and best practices
- **Research Foundation**: `.claude/designs/research.md` and supporting analysis files

**Visual Design References**:
- Prototype images in `.claude/designs/prototypes/images/`
- Design system documentation for minimal, refined aesthetic
- iOS-native component specifications and interaction patterns

This comprehensive PRD establishes the foundation for building Terminus as an AI-powered social activity management platform that transforms how busy professionals maintain relationships and discover meaningful activities.