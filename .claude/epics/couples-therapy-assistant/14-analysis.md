---
issue: 14
analyzed: 2025-12-25T18:06:47Z
parallel_streams: 3
estimated_hours: 32-40
---

# Issue #14 Analysis: Intake Interview (Chat-Based)

## Work Streams

### Stream A: Backend Intake API & Service
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/routes/intake.ts`
- `backend/src/services/intake.ts`
- `backend/src/prompts/intake-system-prompt.txt`
- `backend/src/types/index.ts` (IntakeData type)

**Work**:
1. Create intake types (IntakeData interface)
2. Create intake service (createSession, getSession, extractInsights)
3. Create intake routes (POST messages, GET conversation, POST finalize)
4. Create intake system prompt (warm, conversational interviewer)
5. Integrate with AI streaming (similar to exploration)
6. Extract and save intake_data to user profile

**Dependencies**: Uses existing conversation service

---

### Stream B: Frontend Intake Components
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `frontend/src/pages/IntakePage.tsx`
- `frontend/src/components/intake/IntakeChat.tsx`
- `frontend/src/components/intake/IntakeSummary.tsx`
- `frontend/src/components/intake/index.ts`
- `frontend/src/components/intake/Intake.css`

**Work**:
1. Create IntakePage (entry point for new users)
2. Create IntakeChat (reuses ChatWindow, WebSocket connection)
3. Create IntakeSummary (shows AI's summary for confirmation)
4. Create "I'm ready" finalization flow
5. Style components consistently
6. Add routing: /intake

**Dependencies**: None (reuses chat components)

---

### Stream C: Profile & Vector Embeddings
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `frontend/src/pages/ProfilePage.tsx`
- `backend/src/services/embeddings.ts`
- `backend/src/routes/users.ts` (extend for intake refresh)

**Work**:
1. Create ProfilePage (view intake summary, trigger refresh)
2. Create embeddings service (generate vectors for intake)
3. Extend user routes for profile and intake refresh
4. Store embeddings in SurrealDB
5. Add routing: /profile

**Dependencies**: Partial dependency on Stream A (intake data needed)

---

## Parallel Execution Strategy

```
Stream A (Backend API) ──────────────────────────►
Stream B (Frontend) ─────────────────────────────►
Stream C (Profile/Embeddings) ───────────────────►
                              └── Integration after A ready
```

## Coordination Points

1. IntakeData type shared across streams
2. Frontend needs backend API for full testing
3. Embeddings require intake data to exist

## Output Artifacts

- Intake conversation API
- IntakeChat component
- Profile page with summary
- Vector embeddings for RAG
