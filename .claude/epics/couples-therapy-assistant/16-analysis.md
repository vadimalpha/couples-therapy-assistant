---
issue: 16
analyzed: 2025-12-25T17:54:31Z
parallel_streams: 3
estimated_hours: 48-56
---

# Issue #16 Analysis: Guidance Synthesis & Refinement

## Work Streams

### Stream A: Job Queue Infrastructure
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/queue/index.ts`
- `backend/src/queue/workers/guidance-worker.ts`
- `backend/src/queue/jobs.ts`

**Work**:
1. Install BullMQ and ioredis packages
2. Create queue infrastructure (connection, queues)
3. Create guidance worker that processes synthesis jobs
4. Create job types and interfaces
5. Hook finalization to queue jobs
6. Handle job failures gracefully

**Dependencies**: None

---

### Stream B: Synthesis Service & Prompts
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/services/guidance-synthesis.ts`
- `backend/src/prompts/individual-guidance-prompt.txt`
- `backend/src/prompts/joint-context-synthesis.txt`
- `backend/src/prompts/joint-context-chat.txt`

**Work**:
1. Create individual guidance prompt template
2. Create joint-context synthesis prompt
3. Create joint-context chat prompt (for refinement)
4. Implement synthesizeIndividualGuidance()
5. Implement synthesizeJointContextGuidance()
6. Token usage tracking
7. Create joint_context_a/joint_context_b sessions

**Dependencies**: None (can mock queue integration)

---

### Stream C: Frontend GuidanceChat
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `frontend/src/components/guidance/GuidanceChat.tsx`
- `frontend/src/components/guidance/GuidanceStatus.tsx`
- `frontend/src/components/guidance/index.ts`
- `frontend/src/components/guidance/Guidance.css`
- `frontend/src/pages/GuidancePage.tsx`

**Work**:
1. Create GuidanceChat component (reuses ChatWindow)
2. Create GuidanceStatus component (shows synthesis progress)
3. Create GuidancePage for routing
4. Style components
5. Add routes: /conflicts/:id/guidance

**Dependencies**: None (reuses chat components)

---

## Parallel Execution Strategy

```
Stream A (Job Queue) ──────────────────────────►
Stream B (Synthesis Service) ──────────────────►
Stream C (Frontend) ──────────────────────────►
                              └── Integration after A+B ready
```

- All streams can start immediately
- Final integration connects worker → service → frontend

## Coordination Points

1. **Stream A + B integration**: Worker calls synthesis service
2. **Types shared** in backend/src/types/index.ts
3. No file conflicts expected

## Risk Assessment

- **Medium Risk**: BullMQ/Redis setup (new infrastructure)
- **Medium Risk**: Prompt engineering for synthesis
- **Low Risk**: Frontend (straightforward React)

## Output Artifacts

- BullMQ job queue with Redis
- Guidance synthesis service with prompts
- GuidanceChat frontend component
- Automatic trigger on finalization
