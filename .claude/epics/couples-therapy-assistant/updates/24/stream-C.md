---
issue: 24
stream: Integration & Prompts Update
agent: general-purpose
started: 2025-12-25T18:54:26Z
status: completed
---

# Stream C: Integration & Prompts Update

## Scope
Update existing services to use new OpenAI client, review prompts for GPT-5.2 compatibility.

## Files Modified
- `backend/src/services/chat-ai.ts` (created)
- `backend/src/routes/conversations.ts`
- `backend/src/services/ai-intake.ts`
- `backend/src/services/intake.ts`
- `backend/src/queue/workers/guidance-worker.ts`
- `backend/.env.example`

## Completed Work

### 1. Created Comprehensive Chat AI Service
- Created `chat-ai.ts` with full OpenAI GPT-5.2 integration
- Implemented all AI functionality:
  - `generateExplorationResponse` - Non-streaming exploration chat
  - `streamExplorationResponse` - Streaming exploration chat with SSE support
  - `synthesizeIndividualGuidance` - Individual partner guidance synthesis
  - `synthesizeJointContextGuidance` - Joint-context guidance for both partners
  - `generateRelationshipSynthesis` - Initial shared session synthesis
  - `generateRelationshipResponse` - Relationship chat responses
  - `streamRelationshipResponse` - Streaming relationship chat
- All helper functions migrated from Anthropic to OpenAI format
- Maintained exact same API contracts (no frontend breaking changes)
- Updated cost calculations for GPT-5.2 pricing ($2.50/$10 per million tokens)

### 2. Updated Conversation Routes
- Changed import from `ai-exploration` to `chat-ai`
- SSE streaming endpoint continues to work identically for frontend
- Maintains existing response format: `data: {"type":"chunk","content":"..."}\n\n`

### 3. Updated AI Intake Service
- Migrated from Anthropic SDK to OpenAI SDK
- Updated streaming implementation to use OpenAI's streaming format
- Changed environment variable check from `ANTHROPIC_API_KEY` to `OPENAI_API_KEY`
- Updated cost calculations for GPT-5.2 pricing
- Model changed from `claude-sonnet-4-20250514` to `gpt-5.2`

### 4. Updated Intake Data Extraction
- Migrated `intake.ts` extraction logic to OpenAI
- Leveraged OpenAI's `response_format: { type: 'json_object' }` for structured output
- Updated from Anthropic messages API to OpenAI chat completions API
- Maintained exact same extraction prompt and data structure

### 5. Updated Guidance Worker
- Changed import from `guidance-synthesis` to `chat-ai`
- No other changes needed - function signatures remain identical

### 6. Updated Environment Configuration
- Removed `ANTHROPIC_API_KEY` from `.env.example`
- Updated `OPENAI_API_KEY` documentation to reflect dual use:
  - GPT-5.2 for chat completions
  - text-embedding-3-large for embeddings
- Consolidated to single AI provider

### 7. Reviewed Prompts
- All prompts in `backend/src/prompts/*.txt` reviewed
- Confirmed GPT-5.2 compatibility - prompts are model-agnostic
- No changes needed - excellent therapeutic quality maintained
- Prompts reviewed:
  - `exploration-system-prompt.txt` - Exploration phase guidance
  - `individual-guidance-prompt.txt` - Individual synthesis
  - `intake-system-prompt.txt` - Intake interviews
  - `joint-context-chat.txt` - Joint context conversations
  - `joint-context-synthesis.txt` - Joint synthesis
  - `relationship-chat.txt` - Shared relationship chat
  - `relationship-synthesis.txt` - Relationship synthesis

## Key Technical Details

### OpenAI Streaming Format
```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-5.2',
  messages: [...],
  stream: true,
  stream_options: { include_usage: true },
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) {
    onChunk(delta);
  }
  // Usage data comes in final chunk
  if (chunk.usage) {
    usage = { ... };
  }
}
```

### Message Format Conversion
- Anthropic: `role: 'user' | 'assistant'`
- OpenAI: Same format, but requires system message separate
- Conversion: Filter and map `ConversationMessage[]` to OpenAI format

### Backward Compatibility
- All exported functions maintain identical signatures
- Frontend sees no API changes
- SSE streaming format unchanged
- Error messages maintain same structure

## Commits
1. Issue #24: Create chat-ai service with OpenAI GPT-5.2 integration
2. Issue #24: Update conversations route to use chat-ai service
3. Issue #24: Update ai-intake service to use OpenAI GPT-5.2
4. Issue #24: Update guidance worker to use chat-ai service
5. Issue #24: Update intake service data extraction to use OpenAI GPT-5.2
6. Issue #24: Update environment variable documentation for OpenAI migration

## Notes
- Old Anthropic services (`ai-exploration.ts`, `ai-orchestrator.ts`, `guidance-synthesis.ts`) remain in codebase but are no longer imported
- These can be removed in a cleanup task if desired
- All active code paths now use OpenAI GPT-5.2
- No breaking changes to API contracts or frontend interfaces
