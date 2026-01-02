# Plan: Unified Chat Architecture

## Goal

Consolidate 4 separate chat implementations into a single unified architecture that:
- Uses one page/component for all chat types (intake, exploration, guidance, shared)
- Maximizes component reuse while preserving mode-aware prompts
- **Preserves chat-type-specific confirmation elements** (ReadyButton, IntakeSummary, etc.)
- Adds admin debug panel showing prompts sent to LLM (alongside existing admin pages)
- Consolidates AI services into single `chat-ai.ts` (already uses OpenAI GPT-4o)
- **Adds dashboard-based partner invite acceptance** (not just email links)

## Current Architecture (Before)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  IntakePage.tsx        → IntakeChat.tsx      (SSE streaming)    │
│  ConflictStartPage.tsx → ExplorationChat.tsx (WebSocket)        │
│  GuidancePage.tsx      → GuidanceChat.tsx    (WebSocket)        │
│  JointGuidancePage.tsx ← (NEW) Read-only guidance display       │
│  (implicit)            → SharedRelationshipChat.tsx (WebSocket) │
├─────────────────────────────────────────────────────────────────┤
│                        BACKEND                                   │
├─────────────────────────────────────────────────────────────────┤
│  ai-intake.ts          - GPT-4o (OpenAI) - used by intake.ts    │
│  ai-exploration.ts     - GPT-4o (OpenAI) - NOT IMPORTED ← DELETE│
│  chat-ai.ts            - GPT-4o (main orchestrator)             │
│  guidance-synthesis.ts - NOT IMPORTED ← DELETE                  │
└─────────────────────────────────────────────────────────────────┘
```

### Recent Additions (Jan 2026)
- **JointGuidancePage.tsx** - New non-chat page showing both partners' guidance side-by-side
- **Route**: `/conflicts/:id/joint-guidance`
- **guidanceMode** parameter added to conflict creation (structured/conversational/test)
- **Dashboard navigation** improved with 3 buttons for completed conflicts

## Code Exploration Findings

After analyzing the codebase, I found:

| File | Status | Action |
|------|--------|--------|
| `ai-exploration.ts` | Uses OpenAI (not Anthropic), NOT imported anywhere | Delete immediately |
| `ai-intake.ts` | Uses OpenAI, imported by `routes/intake.ts` | Migrate to chat-ai.ts |
| `guidance-synthesis.ts` | NOT imported anywhere | Delete immediately |
| `websocket/handlers.ts` | Already imports from `chat-ai.ts` | No changes needed |

**Key insight**: There is NO Anthropic dependency to remove. All AI services use OpenAI GPT-4o.

## Target Architecture (After)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  UnifiedChatPage.tsx                                            │
│    ├── useChatSession hook (unified WebSocket/SSE)              │
│    ├── ChatWindow.tsx (existing, reused)                        │
│    ├── ChatModeHeader.tsx (mode-specific header/instructions)   │
│    └── AdminDebugPanel.tsx (collapsible prompt viewer)          │
├─────────────────────────────────────────────────────────────────┤
│                        BACKEND                                   │
├─────────────────────────────────────────────────────────────────┤
│  unified-ai.ts         - Single service, OpenAI only            │
│    ├── streamResponse(sessionType, messages, context)           │
│    ├── synthesizeGuidance(conflictId, partnerId)                │
│    └── getPromptForAdmin(sessionId) ← Debug endpoint            │
└─────────────────────────────────────────────────────────────────┘
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Single page vs multi-page | Single UnifiedChatPage | Eliminates code duplication, consistent UX |
| Streaming protocol | WebSocket for all | SSE has reconnection issues; WebSocket already works for 3/4 chat types |
| AI service consolidation | Keep chat-ai.ts, delete duplicates | chat-ai.ts is most complete |
| Admin panel visibility | Collapsible side panel | Non-intrusive, real-time visibility |
| Admin detection | Email whitelist in env | Simple, already used for other admin features |
| Existing admin pages | Keep as-is | AdminPromptsPage and AdminLogsPage are separate from debug panel |
| Confirmation elements | Preserve per chat type | ReadyButton, IntakeSummary needed for user flow |

## Existing Elements to Preserve

### Non-Chat Pages (Keep Unchanged)
- `JointGuidancePage.tsx` - Read-only display of both partners' guidance side-by-side
  - Route: `/conflicts/:id/joint-guidance`
  - NOT a chat interface - stays separate from unified chat architecture
  - Links to "Refine My Guidance" (chat) and "Start Partner Chat" (chat)

### Admin Pages (Keep Unchanged)
- `AdminPromptsPage.tsx` - Edit prompt templates
- `AdminLogsPage.tsx` - View LLM interaction logs with stats
- Route: `/admin/prompts`, `/admin/logs`

### Chat-Type-Specific Confirmation Elements

| Chat Type | Confirmation Component | Purpose |
|-----------|----------------------|---------|
| Exploration | `ReadyButton.tsx` | "I'm Ready" with confirmation dialog |
| Intake | `IntakeSummary.tsx` | Review extracted data, "Looks Good" button |
| Guidance | `GuidanceStatus.tsx` | Status indicator (pending/synthesizing/ready) |
| Shared | None | No finalization, ongoing conversation |

These components will be **conditionally rendered** in UnifiedChatPage based on session type.

## Implementation Phases

### Phase 1: Backend Consolidation (SIMPLIFIED)

Based on code exploration, this phase is simpler than originally planned.

**1.1 Delete unused AI services (immediate)**

These files are NOT imported anywhere and can be deleted immediately:
```bash
rm backend/src/services/ai-exploration.ts
rm backend/src/services/guidance-synthesis.ts
```

**1.2 Migrate intake streaming to chat-ai.ts**

File: `backend/src/services/chat-ai.ts`
- Add `streamIntakeResponse()` function (copy from ai-intake.ts)
- Add `IntakeContext` interface
- Add intake-specific helper functions

File: `backend/src/routes/intake.ts`
- Update import: `from '../services/ai-intake'` → `from '../services/chat-ai'`

File: `backend/src/services/ai-intake.ts`
- Delete after updating intake.ts import

**1.3 Add admin debug endpoint**

File: `backend/src/routes/conversations.ts`
```typescript
// GET /api/conversations/:id/debug-prompt
// Returns: { systemPrompt, userMessages, model, tokens }
// Requires: admin email in whitelist
```

File: `backend/src/services/chat-ai.ts`
- Add `getDebugPrompt(sessionId)` function to reconstruct prompt for display

**Note**: No Anthropic dependency exists - no package.json changes needed.

### Phase 2: Frontend Hook Unification

**2.1 Create unified hook**

File: `frontend/src/hooks/useChatSession.ts` (NEW)
```typescript
interface UseChatSessionOptions {
  sessionId: string;
  sessionType: SessionType;
  onMessage?: (msg: Message) => void;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

interface UseChatSessionReturn {
  messages: Message[];
  sendMessage: (content: string) => void;
  isStreaming: boolean;
  isConnected: boolean;
  finalize: () => Promise<void>;
  isFinalized: boolean;
  debugPrompt: string | null;  // For admin panel
}
```

This hook:
- Wraps existing `useConversation` WebSocket logic
- Adds session type awareness for routing
- Exposes debug prompt for admin panel
- Handles all session types uniformly

### Phase 3: Frontend Component Unification

**3.1 Create UnifiedChatPage**

File: `frontend/src/pages/UnifiedChatPage.tsx` (NEW)
```typescript
// Route: /chat/:sessionType/:sessionId
// Handles: intake, exploration, guidance, shared

const UnifiedChatPage = () => {
  const { sessionType, sessionId } = useParams();
  const { user } = useAuth();
  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  const { messages, sendMessage, isStreaming, debugPrompt, finalize, isFinalized } = useChatSession({
    sessionId,
    sessionType,
  });

  return (
    <div className="unified-chat-page">
      <ChatModeHeader sessionType={sessionType} />
      <div className="chat-content">
        <ChatWindow
          messages={messages}
          onSend={sendMessage}
          isTyping={isStreaming}
          disabled={isFinalized}
        />

        {/* Chat-type-specific confirmation elements */}
        {sessionType === 'exploration' && !isFinalized && (
          <ReadyButton onReady={finalize} />
        )}
        {sessionType === 'intake' && isFinalized && (
          <IntakeSummary sessionId={sessionId} />
        )}
        {sessionType === 'guidance' && (
          <GuidanceStatus conflictId={conflictId} />
        )}

        {isAdmin && <AdminDebugPanel prompt={debugPrompt} />}
      </div>
    </div>
  );
};
```

**3.2 Create ChatModeHeader**

File: `frontend/src/components/chat/ChatModeHeader.tsx` (NEW)
```typescript
// Shows mode-specific instructions and status
// intake: "Tell us about yourself..."
// exploration: "Describe the situation..."
// guidance: "Here's your personalized guidance"
// shared: "Discuss together with your partner"
```

**3.3 Create AdminDebugPanel**

File: `frontend/src/components/admin/AdminDebugPanel.tsx` (NEW)
```typescript
// Collapsible side panel showing:
// - System prompt (expandable)
// - Recent messages sent to LLM
// - Model used, token count
// - Refresh button to get latest
```

### Phase 4: Route Migration

**4.1 Update routes**

File: `frontend/src/App.tsx`
```typescript
// Old routes (keep temporarily for backwards compat):
// /intake/chat → IntakeChat
// /conflicts/:id/explore → ExplorationChat
// /conflicts/:id/guidance → GuidanceChat
// /conflicts/:id/shared → SharedRelationshipChat

// New unified routes:
// /chat/intake/:sessionId
// /chat/exploration/:sessionId
// /chat/guidance/:sessionId
// /chat/shared/:sessionId

// KEEP AS-IS (non-chat pages):
// /conflicts/:id/joint-guidance → JointGuidancePage (read-only, not a chat)
```

**4.2 Add redirects**

Keep old routes working with redirects to new unified page during transition.

**4.3 Dashboard already updated**

Dashboard navigation already shows 3 buttons for completed conflicts:
- "My Guidance" → `/conflicts/${id}/guidance` (chat)
- "Joint Guidance" → `/conflicts/${id}/joint-guidance` (read-only)
- "Partner Chat" → `/conflicts/${id}/shared` (chat)

Update dashboard links to use new `/chat/...` routes when unified page is ready.

### Phase 5: Dashboard Invite Acceptance (NEW FEATURE)

**Goal**: Allow users to accept partner invitations directly from the dashboard, not just via email links.

**5.1 Backend: Get pending invitations for current user**

File: `backend/src/routes/relationships.ts`
```typescript
// NEW: GET /api/relationships/invitations/received
// Returns invitations where current user's email matches invitation.partnerEmail
// Response: [{ id, fromUserEmail, fromUserName, relationshipType, createdAt }]
```

**5.2 Backend: Accept invitation by ID**

File: `backend/src/routes/relationships.ts`
```typescript
// UPDATE: POST /api/relationships/accept-by-id/:invitationId
// Same logic as accept-by-token but uses invitation ID
// Validates current user's email matches invitation.partnerEmail
```

**5.3 Frontend: Received invitations section on Dashboard**

File: `frontend/src/pages/DashboardPage.tsx`
```typescript
// Add new section "Pending Invitations" (above "Your Connections")
// Shows invitations where logged-in user is the invitee

// New component: ReceivedInvitationCard
{receivedInvitations.map(invite => (
  <ReceivedInvitationCard
    key={invite.id}
    fromEmail={invite.fromUserEmail}
    fromName={invite.fromUserName}
    relationshipType={invite.relationshipType}
    onAccept={() => handleAcceptInvite(invite.id)}
    onDecline={() => handleDeclineInvite(invite.id)}
  />
))}
```

**5.4 UI Design for ReceivedInvitationCard**

```
┌────────────────────────────────────────────────────────┐
│ Invitation from john@example.com                       │
│ John wants to connect as: Partner                      │
│                                                        │
│ [Accept]  [Decline]                                    │
└────────────────────────────────────────────────────────┘
```

**5.5 Email link still works**

Keep existing `/accept-invitation/:token` route working for users who click email links.

### Phase 6: Cleanup

**6.1 Delete obsolete files**

After unified page is working:
- `frontend/src/components/intake/IntakeChat.tsx`
- `frontend/src/components/conflict/ExplorationChat.tsx`
- `frontend/src/components/guidance/GuidanceChat.tsx`
- `frontend/src/components/chat/SharedRelationshipChat.tsx`
- `backend/src/services/ai-exploration.ts`
- `backend/src/services/ai-intake.ts`
- `backend/src/services/guidance-synthesis.ts`

**6.2 Update navigation**

Update all internal links to use new `/chat/:type/:id` routes.

## Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/pages/UnifiedChatPage.tsx` | Single page for all chat types |
| `frontend/src/hooks/useChatSession.ts` | Unified WebSocket hook |
| `frontend/src/components/chat/ChatModeHeader.tsx` | Mode-specific header |
| `frontend/src/components/admin/AdminDebugPanel.tsx` | Debug panel for admins |
| `frontend/src/components/admin/AdminDebugPanel.css` | Debug panel styles |
| `frontend/src/components/dashboard/ReceivedInvitationCard.tsx` | Accept/decline invite from dashboard |

## Files to Modify

| File | Change |
|------|--------|
| `backend/src/services/chat-ai.ts` | Add intake streaming, debug prompt function, prompt override store |
| `backend/src/services/prompt-builder.ts` | Check for prompt overrides before loading template |
| `backend/src/routes/conversations.ts` | Add GET /:id/debug-prompt, POST /:id/restart-with-prompt, POST /:id/save-prompt-template |
| `backend/src/routes/intake.ts` | Update import from ai-intake to chat-ai |
| `backend/src/routes/relationships.ts` | Add GET /invitations/received, POST /accept-by-id |
| `frontend/src/App.tsx` | Add new unified routes |
| `frontend/src/pages/DashboardPage.tsx` | Add received invitations section |

**Note**: `websocket/handlers.ts` already uses chat-ai.ts - no changes needed.

## Files to Delete

### Phase 1 (Backend - Immediate)

| File | Reason |
|------|--------|
| `backend/src/services/ai-exploration.ts` | NOT imported anywhere, duplicates chat-ai.ts |
| `backend/src/services/guidance-synthesis.ts` | NOT imported anywhere |
| `backend/src/services/ai-intake.ts` | After migrating to chat-ai.ts |

### Phase 6 (Frontend - After Unified Page Works)

| File | Reason |
|------|--------|
| `frontend/src/components/intake/IntakeChat.tsx` | Replaced by UnifiedChatPage |
| `frontend/src/components/conflict/ExplorationChat.tsx` | Replaced by UnifiedChatPage |
| `frontend/src/components/guidance/GuidanceChat.tsx` | Replaced by UnifiedChatPage |
| `frontend/src/components/chat/SharedRelationshipChat.tsx` | Replaced by UnifiedChatPage |

## Admin Debug Panel Details

### UI Design
```
┌──────────────────────────────────────────────────────────────────┐
│ Chat Window                              │ Debug (Admin)        │
│                                          │ ┌──────────────────┐ │
│ [Messages...]                            │ │ Model: gpt-4o    │ │
│                                          │ │ Tokens: 2,048    │ │
│                                          │ ├──────────────────┤ │
│                                          │ │ System Prompt:   │ │
│                                          │ │ ┌──────────────┐ │ │
│                                          │ │ │ You are a... │ │ │
│                                          │ │ │ [editable]   │ │ │
│                                          │ │ └──────────────┘ │ │
│                                          │ │ ⚠️ Modified      │ │
│                                          │ ├──────────────────┤ │
│                                          │ │ [Restart Chat]   │ │
│                                          │ │ [Save Template]  │ │
│                                          │ │ [Reset]          │ │
│                                          │ ├──────────────────┤ │
│                                          │ │ Context:         │ │
│                                          │ │ RAG: {...}       │ │
│                                          │ └──────────────────┘ │
│ [Input...]                               │ [Refresh]           │
└──────────────────────────────────────────────────────────────────┘
```

### Implementation
- Panel is collapsible (minimized by default)
- Fetches prompt data via `GET /api/conversations/:id/debug-prompt`
- Updates after each message sent
- Shows full system prompt with expand/collapse
- Displays RAG context and pattern insights if present

## Prompt Editing & Testing Feature (Admin)

### Overview
Allow admins to edit prompts in real-time and test how changes affect conversations, with option to save changes permanently.

### User Flow

1. **View Current Prompt** - Admin sees the active system prompt in debug panel
2. **Edit Prompt** - Text area becomes editable, shows "Modified" indicator
3. **Restart Chat** - Clears messages, restarts session with modified prompt (temporary)
4. **Test Conversation** - Admin chats to see how the new prompt affects responses
5. **Save or Discard** - Either save to template permanently, or reset to original

### UI States

```
┌─────────────────────────────────────────────────────────────┐
│ State: VIEWING (default)                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ System Prompt:                              [Edit ✏️]   │ │
│ │ You are a compassionate relationship therapist...       │ │
│ │ (read-only view)                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ State: EDITING                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ System Prompt:                    ⚠️ MODIFIED           │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ You are a compassionate relationship therapist...   │ │ │
│ │ │ (editable textarea)                                 │ │ │
│ │ │                                                     │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ [🔄 Restart Chat]  [💾 Save to Template]  [↩️ Reset]    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ State: TESTING (after restart)                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🧪 TESTING MODE - Using modified prompt                 │ │
│ │ Template: exploration-system-prompt.txt                 │ │
│ │                                                         │ │
│ │ [💾 Save to Template]  [↩️ Discard & Reset]             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Backend Implementation

**1.3.1 Store temporary prompt override**

File: `backend/src/services/chat-ai.ts`
```typescript
// In-memory store for temporary prompt overrides (session-scoped)
const promptOverrides: Map<string, string> = new Map();

export function setPromptOverride(sessionId: string, prompt: string): void {
  promptOverrides.set(sessionId, prompt);
}

export function getPromptOverride(sessionId: string): string | null {
  return promptOverrides.get(sessionId) || null;
}

export function clearPromptOverride(sessionId: string): void {
  promptOverrides.delete(sessionId);
}
```

**1.3.2 Restart session endpoint**

File: `backend/src/routes/conversations.ts`
```typescript
// POST /api/conversations/:id/restart-with-prompt
// Body: { systemPrompt: string }
// Actions:
//   1. Verify admin access
//   2. Clear all messages from session
//   3. Store prompt override for this session
//   4. Return success
// Note: Next AI response will use the overridden prompt
```

**1.3.3 Save prompt to template**

File: `backend/src/routes/conversations.ts`
```typescript
// POST /api/conversations/:id/save-prompt-template
// Body: { systemPrompt: string }
// Actions:
//   1. Verify admin access
//   2. Determine template file from session type:
//      - intake → intake-system-prompt.txt
//      - individual_a/b → exploration-system-prompt.txt
//      - joint_context_a/b → guidance-refinement-system-prompt.txt
//      - relationship_shared → relationship-system-prompt.txt
//   3. Write to template file (backend/src/prompts/)
//   4. Clear prompt override (now using saved version)
//   5. Return success with template filename
```

**1.3.4 Modify prompt builder to check overrides**

File: `backend/src/services/prompt-builder.ts`
```typescript
export async function buildPrompt(templateName: string, context: PromptContext): Promise<string> {
  // Check for session-specific override first
  if (context.sessionId) {
    const override = getPromptOverride(context.sessionId);
    if (override) {
      // Use override instead of template, but still inject RAG context
      return injectContext(override, context);
    }
  }

  // Normal template loading...
}
```

### Frontend Implementation

**3.3.1 AdminDebugPanel state management**

File: `frontend/src/components/admin/AdminDebugPanel.tsx`
```typescript
interface AdminDebugPanelProps {
  sessionId: string;
  sessionType: SessionType;
  onRestartChat: () => void;  // Callback to clear chat UI
}

const AdminDebugPanel: React.FC<AdminDebugPanelProps> = ({
  sessionId,
  sessionType,
  onRestartChat,
}) => {
  const [originalPrompt, setOriginalPrompt] = useState<string>('');
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isModified = editedPrompt !== originalPrompt;

  const handleRestartChat = async () => {
    // POST to /api/conversations/:id/restart-with-prompt
    await restartWithPrompt(sessionId, editedPrompt);
    setIsTesting(true);
    onRestartChat();  // Clear messages in parent
  };

  const handleSaveTemplate = async () => {
    // POST to /api/conversations/:id/save-prompt-template
    await savePromptTemplate(sessionId, editedPrompt);
    setOriginalPrompt(editedPrompt);
    setIsTesting(false);
    setIsEditing(false);
  };

  const handleReset = async () => {
    setEditedPrompt(originalPrompt);
    setIsEditing(false);
    if (isTesting) {
      // Clear override and restart with original
      await restartWithPrompt(sessionId, originalPrompt);
      setIsTesting(false);
      onRestartChat();
    }
  };
  // ...
};
```

**3.3.2 Template name display**

Show which template file will be affected:
```typescript
const getTemplateName = (sessionType: SessionType): string => {
  const templateMap: Record<SessionType, string> = {
    'intake': 'intake-system-prompt.txt',
    'individual_a': 'exploration-system-prompt.txt',
    'individual_b': 'exploration-system-prompt.txt',
    'joint_context_a': 'guidance-refinement-system-prompt.txt',
    'joint_context_b': 'guidance-refinement-system-prompt.txt',
    'relationship_shared': 'relationship-system-prompt.txt',
  };
  return templateMap[sessionType] || 'unknown';
};
```

### Safety Considerations

| Concern | Mitigation |
|---------|------------|
| Accidental template overwrite | Confirmation dialog before saving |
| Lost changes on browser close | Warning when leaving with unsaved modifications |
| Template corruption | Backup original before overwriting |
| Non-admin access | Strict admin email whitelist check |
| Concurrent edits | Last-write-wins with timestamp warning |

### Confirmation Dialog for Save

```
┌─────────────────────────────────────────────────────────────┐
│ Save Prompt Template                                        │
├─────────────────────────────────────────────────────────────┤
│ This will permanently update:                               │
│                                                             │
│   📄 exploration-system-prompt.txt                          │
│                                                             │
│ This affects ALL future exploration chat sessions.          │
│                                                             │
│ Are you sure you want to save these changes?                │
│                                                             │
│                              [Cancel]  [Save Permanently]   │
└─────────────────────────────────────────────────────────────┘
```

## Backward Compatibility

- Old routes redirect to new unified page
- Existing sessions continue to work
- No database changes required
- Session types unchanged

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| WebSocket migration for intake | Test thoroughly; SSE fallback if needed |
| Admin panel performance | Lazy load, only fetch when panel open |
| Route migration breaks links | Keep redirects indefinitely |
| Unified hook complexity | Comprehensive tests for each session type |
| Prompt template overwrite | Confirmation dialog + backup original file before save |
| In-memory prompt overrides lost on server restart | Expected behavior; overrides are temporary by design |
| Malformed prompt breaks AI responses | Validate prompt structure; show error in debug panel |

## Testing Strategy

1. **Unit tests**: useChatSession hook with mock WebSocket
2. **Integration tests**: Each session type through UnifiedChatPage
3. **E2E tests**: Full flow from start to finish for each chat type
4. **Admin panel tests**: Verify prompt display accuracy
5. **Prompt editing tests**:
   - Edit prompt → restart chat → verify AI uses modified prompt
   - Save template → new session → verify saved prompt is used
   - Reset → verify original prompt restored
   - Concurrent admin edits → verify last-write-wins behavior
   - Malformed prompt → verify error handling
