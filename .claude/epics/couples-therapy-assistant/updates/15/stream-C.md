---
issue: 15
stream: AI Integration & System Prompts
agent: general-purpose
started: 2025-12-25T17:41:54Z
updated: 2025-12-25T17:51:51Z
status: completed
---

# Stream C: AI Integration & System Prompts

## Scope
Create exploration system prompt, AI exploration service, and integrate AI responses with conversation flow.

## Files
- `backend/src/prompts/exploration-system-prompt.txt`
- `backend/src/services/ai-exploration.ts`
- `backend/src/routes/conversations.ts` (extend for AI responses)

## Progress

### Completed
- ✅ Installed @anthropic-ai/sdk package
- ✅ Created exploration system prompt file
  - Empathetic, warm, therapeutic tone
  - One question at a time approach
  - Validates emotions before probing
  - Guides self-reflection without advice
- ✅ Created ai-exploration service
  - generateExplorationResponse() for non-streaming
  - streamExplorationResponse() for SSE streaming
  - Token usage tracking and cost calculation
  - Context-aware prompts (intake data support ready)
  - Error handling with graceful degradation
- ✅ Extended conversation routes
  - New POST /api/conversations/:id/ai-stream endpoint
  - Session type validation (only individual_a, individual_b)
  - SSE streaming implementation
  - Auto-saves AI response to conversation
  - Returns token usage stats
- ✅ Updated .env.example with ANTHROPIC_API_KEY

## Implementation Details

### System Prompt Strategy
- Core therapeutic principles embedded in prompt
- Context injection for intake data (when available)
- Designed for exploration phase, not advice phase
- Examples included for tone consistency

### AI Service Architecture
- Uses Claude Sonnet 4 (claude-sonnet-4-20250514)
- Streaming support via Anthropic SDK
- Token usage tracking ($3/M input, $15/M output)
- Filters conversation to user/ai messages only
- Graceful error handling

### API Integration
- Follows existing SSE pattern from ai-stream.ts
- Session ownership verification
- Session type filtering (exploration only)
- Full conversation history as context
- Usage stats returned after completion

## Coordination Notes
- No conflicts with other streams
- All files within assigned scope
- Ready for integration testing
