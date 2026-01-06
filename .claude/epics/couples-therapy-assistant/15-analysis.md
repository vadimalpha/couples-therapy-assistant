---
issue: 15
analyzed: 2025-12-25T17:41:54Z
parallel_streams: 3
estimated_hours: 40-48
---

# Issue #15 Analysis: Exploration Chat Flow

## Work Streams

### Stream A: Backend Conflict API & Visibility
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/routes/conflicts.ts`
- `backend/src/services/conflict.ts`
- `backend/src/types/index.ts` (conflict types)

**Work**:
1. Create conflict types (ConflictStatus, Conflict interface)
2. Create conflict service (CRUD, status transitions)
3. Create conflict routes:
   - POST /api/conflicts - Create conflict + individual_a session
   - GET /api/conflicts/:id - With visibility filtering
   - GET /api/conflicts - List user's conflicts
4. Implement visibility filtering (Partner B cannot see Partner A's conversation)
5. Status tracking: partner_a_chatting → pending_partner_b → partner_b_chatting → both_finalized

**Dependencies**: None (uses existing conversation service from #22)

---

### Stream B: Frontend Components
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `frontend/src/pages/ConflictStartPage.tsx`
- `frontend/src/components/conflict/ExplorationChat.tsx`
- `frontend/src/components/conflict/ReadyButton.tsx`
- `frontend/src/components/conflict/ConversationLock.tsx`
- `frontend/src/components/conflict/index.ts`
- `frontend/src/components/conflict/Conflict.css`

**Work**:
1. Create ConflictStartPage (title input, privacy setting, enter chat)
2. Create ExplorationChat (reuses ChatWindow, integrates with SSE streaming)
3. Create ReadyButton ("I'm ready" to finalize)
4. Create ConversationLock indicator
5. Add routing for conflict pages
6. Style all components

**Dependencies**: None (reuses chat components from #22)

---

### Stream C: AI Integration & System Prompts
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/prompts/exploration-system-prompt.txt`
- `backend/src/services/ai-exploration.ts`
- `backend/src/routes/conversations.ts` (extend for AI responses)

**Work**:
1. Create exploration system prompt (empathetic, clarifying questions)
2. Create ai-exploration service (generates AI responses)
3. Extend conversation message handler to trigger AI response
4. Implement streaming AI response via SSE
5. Connect to Claude API (using existing ai-stream infrastructure)

**Dependencies**: Partial dependency on Stream A (conflict context needed)

---

## Parallel Execution Strategy

```
Stream A (Backend API) ──────────────────────────►
Stream B (Frontend Components) ─────────────────►
Stream C (AI Integration) ──────────────────────►
                              └── Integration after A ready
```

- All streams can start immediately
- Stream C integrates with A for conflict context
- No file conflicts expected

## Coordination Points

1. **Stream C depends on Stream A** for conflict service integration
2. **Frontend testing** needs backend API running
3. Types shared in `backend/src/types/index.ts`

## Risk Assessment

- **Low Risk**: Frontend components (straightforward React)
- **Medium Risk**: Visibility filtering (security-critical)
- **Medium Risk**: AI integration with Claude API

## Output Artifacts

- Conflict CRUD API with visibility enforcement
- 4 React components for exploration flow
- Exploration system prompt
- AI response integration with streaming
