# Dashboard Redesign & Free Chat Auto-Subject

## Overview
Three features to implement:
1. **Auto-subject for free chats** - LLM generates subject after first AI response
2. **Individual/Partner toggle** - Switch between personal chats and partner conflicts
3. **Collapsible connections sections** - Compact header with counts

---

## Feature 1: Auto-Subject for Free Chats

### Current State
- Solo chats have no subject/title stored in database
- Titles are hardcoded based on session type ("Free Chat", "Contextual Chat", "Guided Reflection")
- Dashboard only shows type and date

### Implementation

**Backend Changes:**

1. **Add subject field to ConversationSession** (`backend/src/types/index.ts`)
```typescript
interface ConversationSession {
  // existing fields...
  subject?: string;  // Auto-generated or user-provided
}
```

2. **Generate subject after first AI response** (`backend/src/services/chat-ai.ts`)
- After `streamSoloResponse` completes successfully AND it's the first message
- Call a new function `generateChatSubject(userMessage, aiResponse)`
- Use a short LLM call to generate a 3-5 word subject
- Store in session via `conversationService.updateSession()`

3. **Add subject generation function** (`backend/src/services/chat-ai.ts`)
```typescript
async function generateChatSubject(userMessage: string, aiResponse: string): Promise<string> {
  // Quick LLM call with small model to generate subject
  // Prompt: "Generate a 3-5 word subject for this conversation: [message excerpt]"
}
```

4. **Add updateSession method** (`backend/src/services/conversation.ts`)
```typescript
async updateSession(sessionId: string, updates: Partial<ConversationSession>): Promise<void>
```

**Frontend Changes:**

5. **Display subject in SoloChatPage** (`frontend/src/pages/SoloChatPage.tsx`)
- Use `session.subject` if available, fallback to type-based title
- Show "Generating subject..." while first message is processing

6. **Display subject in Dashboard** (`frontend/src/pages/DashboardPage.tsx`)
- Show subject in solo chat list items instead of just type

---

## Feature 2: Individual/Partner Toggle with Redesigned Layout

### Design

```
┌──────────────────────────────────────────────────────────────┐
│  [Individual]  [Partner]                    + Personal Chat  │
├──────────────────────────────────────────────────────────────┤

When INDIVIDUAL selected:
┌──────────────────────────────────────────────────────────────┐
│ 💭 Work stress discussion          Free Chat      Jan 8      │
├──────────────────────────────────────────────────────────────┤
│ 🧘 Processing the argument         Guided         Jan 6      │
├──────────────────────────────────────────────────────────────┤
│ 💬 Career decisions                Contextual     Jan 5      │
└──────────────────────────────────────────────────────────────┘

When PARTNER selected:
┌──────────────────────────────────────────────────────────────┐
│  [All]  [In Progress]  [Completed]              + New Conflict│
├──────────────────────────────────────────────────────────────┤
│ Communication issues    Partner A    In Progress   Jan 7     │
├──────────────────────────────────────────────────────────────┤
│ Household tasks         Partner B    Completed     Jan 3     │
└──────────────────────────────────────────────────────────────┘
```

### Key Requirements
- Single toggle between "Individual" and "Partner"
- Partner view has sub-tabs: All / In Progress / Completed
- Full-width row layout (not cards)
- All items sorted by creation date (newest first)

### Implementation

**Frontend Changes:**

1. **Add state for toggle** (`frontend/src/pages/DashboardPage.tsx`)
```typescript
const [viewMode, setViewMode] = useState<'individual' | 'partner'>('partner');
const [partnerFilter, setPartnerFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
```

2. **Create toggle component**
- Two buttons: "Individual" / "Partner"
- Persist selection in localStorage

3. **Create sub-tabs for Partner view**
- Three tabs: "All" / "In Progress" / "Completed"

4. **Redesign chat rows** - Replace card grid with full-width rows
- Each row: Icon | Subject/Title | Type/Partner | Status | Date
- Clickable row to navigate
- Hover state for interactivity

5. **Sort by creation date**
- All lists sorted by `createdAt` descending (newest first)

**CSS Changes** (`frontend/src/pages/DashboardPage.css`)

6. **Add new styles**
```css
.view-toggle { /* Individual/Partner toggle */ }
.partner-tabs { /* All/In Progress/Completed tabs */ }
.chat-row { /* Full-width row style */ }
.chat-row:hover { /* Hover state */ }
```

---

## Feature 3: Collapsible Connections Sections

### Design

Collapsed:
```
┌──────────────────────────────────────────────────────────────┐
│ ▶ Your Connections (3)                                       │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ ▶ Pending Invites (2)                                        │
└──────────────────────────────────────────────────────────────┘
```

Expanded (current behavior):
```
┌──────────────────────────────────────────────────────────────┐
│ ▼ Your Connections (3)                                       │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                         │
│ │Partner A│ │Partner B│ │+ Add    │                         │
│ └─────────┘ └─────────┘ └─────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

### Implementation

1. **Add collapsed state** (`frontend/src/pages/DashboardPage.tsx`)
```typescript
const [connectionsCollapsed, setConnectionsCollapsed] = useState(true);
const [invitesCollapsed, setInvitesCollapsed] = useState(true);
```

2. **Create collapsible header component**
- Arrow icon (▶/▼) indicating state
- Section title with count in parentheses
- Click to toggle

3. **Wrap existing content** in collapsible container
- Show/hide based on collapsed state
- Smooth animation for expand/collapse

---

## Files to Modify

| File | Changes |
|------|---------|
| `backend/src/types/index.ts` | Add `subject` field to ConversationSession |
| `backend/src/services/conversation.ts` | Add `updateSession` method |
| `backend/src/services/chat-ai.ts` | Add `generateChatSubject` function, call after first solo response |
| `frontend/src/pages/DashboardPage.tsx` | Toggle, tabs, collapsible sections, row layout |
| `frontend/src/pages/DashboardPage.css` | New styles for toggle, tabs, rows, collapsible |
| `frontend/src/pages/SoloChatPage.tsx` | Display subject from session |

---

## Implementation Order

1. Backend: Add subject field to types
2. Backend: Add updateSession method
3. Backend: Add generateChatSubject function
4. Backend: Call subject generation after first solo response
5. Frontend: Add Individual/Partner toggle
6. Frontend: Add Partner sub-tabs
7. Frontend: Redesign to row layout
8. Frontend: Sort by creation date
9. Frontend: Add collapsible connections sections
10. Frontend: Display subject in solo chats
