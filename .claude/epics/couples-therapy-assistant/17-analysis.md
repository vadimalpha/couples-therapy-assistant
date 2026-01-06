---
issue: 17
analyzed: 2025-12-25T18:16:30Z
parallel_streams: 3
estimated_hours: 32-40
---

# Issue #17 Analysis: RAG Context & Pattern Recognition

## Work Streams

### Stream A: Vector Embeddings & Similarity Search
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/services/embeddings.ts` (extend existing)
- `backend/src/services/conflict.ts` (add embedding generation)
- `backend/src/services/rag.ts`

**Work**:
1. Enhance embeddings service with real embedding API (OpenAI/Voyage)
2. Generate embeddings on conflict creation
3. Implement vector similarity search in SurrealDB
4. Create RAG service to retrieve relevant context
5. Get last 5 similar conflicts for context

**Dependencies**: Extends existing embeddings.ts from Issue #14

---

### Stream B: Pattern Recognition Engine
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/services/pattern-recognition.ts`
- `backend/src/types/index.ts` (pattern types)

**Work**:
1. Create PatternRecognitionEngine class
2. Implement theme frequency analysis (finances, chores, intimacy, etc.)
3. Implement relationship cycle detection (pursue-withdraw, demand-withdraw)
4. Generate frequency alerts
5. Detect patterns across 30/60/90 day windows

**Dependencies**: None

---

### Stream C: RAG Integration & Frontend
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/services/prompt-builder.ts`
- `frontend/src/components/patterns/PatternInsights.tsx`
- `frontend/src/components/patterns/index.ts`
- `frontend/src/components/patterns/Patterns.css`

**Work**:
1. Create prompt builder that injects RAG context
2. Inject pattern insights into joint-context prompts
3. Create PatternInsights frontend component
4. Show recurring themes with warning icons
5. Suggest dedicated conversations for 3+ occurrences

**Dependencies**: Partial dependency on A & B

---

## Parallel Execution Strategy

```
Stream A (Embeddings/RAG) ──────────────────────►
Stream B (Pattern Recognition) ─────────────────►
Stream C (Integration/Frontend) ────────────────►
                              └── Uses A+B for integration
```

## Coordination Points

1. Pattern types shared in types/index.ts
2. Stream C needs A & B services to integrate
3. Prompt templates need updating

## Output Artifacts

- Enhanced vector embeddings service
- Pattern recognition engine
- RAG context for all prompts
- Pattern insights UI component
