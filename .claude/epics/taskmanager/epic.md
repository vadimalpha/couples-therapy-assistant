---
name: taskmanager
status: backlog
created: 2025-08-26T18:27:34Z
progress: 0%
prd: .claude/prds/taskmanager.md
github: https://github.com/vadimalpha/taskmanager/issues/1
---

# Epic: taskmanager

## Overview
Build a minimalist task manager using Next.js and Supabase, leveraging existing authentication and database infrastructure. Focus on core functionality with smart defaults rather than complex AI features initially.

## Architecture Decisions

### Simplification Strategy
- **Use Supabase for everything**: Auth, database, real-time sync, and RLS for security
- **Progressive enhancement**: Start with basic CRUD, add AI features later
- **Client-side first**: Use React Query for state management, minimize backend complexity
- **Leverage browser APIs**: Use localStorage for offline mode, Service Workers for sync
- **Smart defaults over AI**: Use simple heuristics (time of day, due dates) instead of complex ML initially

### Technology Choices
- **Framework**: Next.js 14 with App Router (simplified routing and SSR)
- **Database**: Supabase (PostgreSQL with built-in auth and real-time)
- **UI**: Tailwind CSS + shadcn/ui components (production-ready components)
- **State**: React Query + Zustand (minimal boilerplate)
- **Deployment**: Vercel (zero-config deployment)

### Design Patterns
- **Database-driven UI**: Let Postgres views handle complex queries
- **Optimistic updates**: Immediate UI feedback with background sync
- **Command palette pattern**: Single entry point for all actions (Cmd+K)

## Technical Approach

### Frontend Components
**Reusable UI Kit (leverage shadcn/ui):**
- Command palette for quick actions
- Modal system for task details
- Toast notifications for feedback
- Keyboard shortcut system

**Core Views (single-page app approach):**
- TaskList component with filtering
- FocusMode component (just CSS transforms)
- QuickAdd inline input
- Settings sidebar

### Backend Services
**Supabase Tables (simple schema):**
```sql
- tasks (id, title, description, due_date, priority, project_id, completed_at, user_id)
- projects (id, name, color, user_id)
- user_preferences (user_id, daily_limit, focus_mode, theme)
```

**Database Functions (let Postgres do the work):**
- get_todays_tasks() - Returns 5 prioritized tasks
- auto_reschedule() - Moves overdue tasks
- calculate_streak() - Simple SQL aggregation

### Infrastructure
- Supabase handles auth, database, real-time sync
- Vercel Edge Functions for any custom logic
- Browser localStorage for offline cache
- Service Worker for background sync

## Implementation Strategy

### Phase 1: MVP (Week 1-2)
- Basic CRUD with Supabase
- Focus modes using view filters
- Quick capture with keyboard shortcuts
- Simple prioritization (due date + manual priority)

### Phase 2: Enhancement (Week 3)
- Offline mode with Service Workers
- Calendar view integration
- Productivity analytics (SQL aggregations)
- Polish and performance optimization

### Risk Mitigation
- Use proven libraries (no custom auth or state management)
- Progressive enhancement (works without JS)
- Database backups via Supabase
- Feature flags for gradual rollout

## Task Breakdown Preview

Simplified to 10 essential tasks:

- [ ] **Setup & Configuration**: Initialize Next.js, Supabase, and deploy pipeline
- [ ] **Database Schema**: Create tables, RLS policies, and helper functions in Supabase
- [ ] **Authentication Flow**: Implement sign-up/login using Supabase Auth UI
- [ ] **Task CRUD Operations**: Basic create, read, update, delete with optimistic updates
- [ ] **Focus Mode Views**: Implement view filtering (Today, Deep Work, Planning modes)
- [ ] **Quick Capture**: Command palette with keyboard shortcuts (Cmd+K pattern)
- [ ] **Smart Prioritization**: Simple algorithm using due dates and Eisenhower matrix
- [ ] **Offline Support**: Service Worker for caching and background sync
- [ ] **Analytics Dashboard**: SQL views for streaks and productivity metrics
- [ ] **Polish & Deploy**: Responsive design, loading states, and production deployment

## Dependencies

### External Service Dependencies
- Supabase (free tier sufficient for MVP)
- Vercel hosting (free tier)
- Optional: OpenAI API (Phase 2 only)

### Internal Dependencies
- No internal team dependencies for MVP
- Design can use default Tailwind/shadcn themes

## Success Criteria (Technical)

### Performance Benchmarks
- Time to Interactive: < 2 seconds
- Task creation latency: < 200ms (optimistic updates)
- Offline capability: Full CRUD operations
- Bundle size: < 200KB gzipped

### Quality Gates
- Lighthouse score: > 90
- Zero runtime errors in production
- 100% keyboard accessible
- Works on mobile browsers

### Acceptance Criteria
- User can complete full task lifecycle offline
- Sync happens automatically when online
- No data loss during sync conflicts
- Focus modes update instantly (< 50ms)

## Estimated Effort

### Timeline
- **Total Duration**: 3 weeks
- **Week 1**: Setup, auth, basic CRUD (tasks 1-4)
- **Week 2**: Views, quick capture, prioritization (tasks 5-7)
- **Week 3**: Offline, analytics, polish (tasks 8-10)

### Resource Requirements
- 1 Full-stack developer
- Supabase free tier
- Vercel free tier
- $0 infrastructure cost for MVP

### Critical Path
1. Supabase setup (blocks everything)
2. Task CRUD (blocks all features)
3. Focus modes (core differentiator)
4. Offline support (key technical requirement)

## Tasks Created
- [ ] #2 - Setup & Configuration (parallel: true)
- [ ] #3 - Database Schema (parallel: false)
- [ ] #4 - Authentication Flow (parallel: false)
- [ ] #5 - Task CRUD Operations (parallel: false)
- [ ] #6 - Focus Mode Views (parallel: true)
- [ ] #7 - Quick Capture (parallel: true)
- [ ] #8 - Smart Prioritization (parallel: true)
- [ ] #9 - Offline Support (parallel: true)
- [ ] #10 - Analytics Dashboard (parallel: true)
- [ ] #11 - Polish & Deploy (parallel: false)

Total tasks: 10
Parallel tasks: 6
Sequential tasks: 4
Estimated total effort: 47 hours
