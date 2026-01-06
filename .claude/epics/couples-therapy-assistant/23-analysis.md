---
issue: 23
analyzed: 2025-12-25T18:35:26Z
parallel_streams: 3
estimated_hours: 32-40
---

# Issue #23 Analysis: Shared Relationship Chat

## Work Streams

### Stream A: Backend Multi-User WebSocket & API
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/websocket/multi-user-room.ts`
- `backend/src/routes/conversations.ts` (modify for sender_id)
- `backend/src/services/conversation.ts` (modify for multi-user)

**Work**:
1. Extend WebSocket to support multi-user rooms
2. Add presence tracking (who's online in room)
3. Add typing indicators for multiple users
4. Modify message endpoints to include sender_id
5. Add access verification for shared sessions
6. Broadcast messages to all room participants

**Dependencies**: None (builds on existing WebSocket from #22)

---

### Stream B: Frontend Shared Chat Components
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `frontend/src/components/chat/SharedRelationshipChat.tsx`
- `frontend/src/components/chat/ParticipantBadge.tsx`
- `frontend/src/components/chat/ChatMessage.tsx` (modify for partner variants)
- `frontend/src/styles/shared-chat.css`

**Work**:
1. Create SharedRelationshipChat page component
2. Create ParticipantBadge for online status display
3. Extend ChatMessage with partner-a/partner-b styling
4. Add multi-user typing indicators UI
5. Integrate unlock logic ("Join Shared Conversation" button)
6. Mobile-responsive design

**Dependencies**: None (uses existing chat components from #22)

---

### Stream C: AI Prompts & Relationship Synthesis
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/prompts/relationship-synthesis.txt`
- `backend/src/prompts/relationship-chat.txt`
- `backend/src/services/ai-orchestrator.ts` (modify for relationship mode)

**Work**:
1. Create relationship synthesis prompt (initial message for couple)
2. Create relationship chat prompt (neutral facilitator)
3. Add `relationship_shared` session type handling
4. Integrate sender_id context into AI prompts
5. Generate synthesis from both partners' contexts

**Dependencies**: None (extends existing AI orchestrator from #15/#16)

---

## Parallel Execution Strategy

```
Stream A (Backend Multi-User) ──────────────────►
Stream B (Frontend Components) ─────────────────►
Stream C (AI Prompts) ──────────────────────────►
```

All streams can run completely in parallel with no dependencies.

## Output Artifacts

- Multi-user WebSocket room support
- SharedRelationshipChat component
- ParticipantBadge component
- Partner message styling variants
- Relationship synthesis prompt
- Relationship chat prompt
- sender_id tracking throughout
