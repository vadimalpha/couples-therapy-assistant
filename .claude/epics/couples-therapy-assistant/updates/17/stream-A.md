---
issue: 17
stream: Vector Embeddings & Similarity Search
agent: general-purpose
started: 2025-12-25T18:16:30Z
status: in_progress
---

# Stream A: Vector Embeddings & Similarity Search

## Scope
Enhance embeddings service, add conflict embeddings, implement vector similarity search for RAG.

## Files
- `backend/src/services/embeddings.ts` (extend)
- `backend/src/services/conflict.ts` (add embedding)
- `backend/src/services/rag.ts`

## Progress

### Completed
- ✅ Enhanced embeddings.ts with OpenAI text-embedding-ada-002 integration
  - Replaced pseudo-embeddings with real API calls
  - Added graceful fallback to pseudo-embeddings if OpenAI unavailable
  - Updated embedding dimension to 1536 (ada-002 standard)
  - Installed openai npm package

- ✅ Added generateConflictEmbedding function
  - Generates embeddings from conflict title (and optional description)
  - Stores embeddings in SurrealDB with proper metadata
  - Handles missing conflicts gracefully

- ✅ Integrated embedding generation into conflict creation
  - Embeddings generated asynchronously after conflict creation
  - Non-blocking approach - failures logged but don't break workflow
  - Uses fire-and-forget pattern with error handling

- ✅ Created RAG service (backend/src/services/rag.ts)
  - getSimilarConflicts: Vector similarity search using cosine similarity
  - getRAGContext: Fetches complete context (conflicts + intake + history)
  - buildContextString: Formats context for prompt injection
  - Filters by relationship_id and excludes current conflict
  - Handles missing embeddings gracefully

- ✅ Updated .env.example with OPENAI_API_KEY documentation

### Notes
- Using application-level cosine similarity instead of SurrealDB vector functions for now
- Could optimize with SurrealDB's native vector::similarity::cosine in future
- Embeddings are optional - system degrades gracefully if missing
