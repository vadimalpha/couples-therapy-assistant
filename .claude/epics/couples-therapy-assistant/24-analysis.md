---
issue: 24
analyzed: 2025-12-25T18:49:30Z
parallel_streams: 3
estimated_hours: 24-32
---

# Issue #24 Analysis: OpenAI GPT-5.2 & Embeddings Integration

## Work Streams

### Stream A: OpenAI Client & Chat AI Service
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/services/openai-client.ts` (NEW)
- `backend/src/services/chat-ai.ts` (NEW or REPLACE existing AI service)
- Update existing conversation routes for new service

**Work**:
1. Create OpenAI SDK singleton client
2. Implement chat completions with GPT-5.2 streaming
3. Token usage logging for cost monitoring
4. Error handling for rate limits (429)
5. Integrate with existing conversation routes

**Dependencies**: None

---

### Stream B: Embedding Service & Vector Storage
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/services/embedding.ts` (NEW or UPDATE)
- `backend/src/services/rag-context.ts` (UPDATE)
- SurrealDB schema updates for vector index

**Work**:
1. Create embedding generation with text-embedding-3-small
2. embedAndStore function for intake/conversation data
3. Update SurrealDB schema with MTREE vector index
4. Vector similarity search implementation

**Dependencies**: None

---

### Stream C: System Prompts & Integration
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `backend/src/prompts/*.txt` (UPDATE for GPT-5.2 style if needed)
- Update services to use new OpenAI client
- SSE streaming endpoint updates

**Work**:
1. Review and update prompts for GPT-5.2 compatibility
2. Update conversation routes to use chat-ai service
3. Ensure SSE streaming works with new OpenAI client
4. Update token usage endpoint for cost monitoring

**Dependencies**: None

---

## Parallel Execution Strategy

All streams can run in parallel with no dependencies.

## Key Changes from Anthropic to OpenAI

- Model: Claude Sonnet 4 → GPT-5.2
- Embeddings: text-embedding-ada-002 → text-embedding-3-small
- Context window: Much larger (400K tokens)
- Streaming: Similar SSE approach
