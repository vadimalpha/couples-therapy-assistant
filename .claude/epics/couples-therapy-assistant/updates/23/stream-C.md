---
issue: 23
stream: AI Prompts & Relationship Synthesis
agent: general-purpose
started: 2025-12-25T18:35:26Z
status: completed
completed: 2025-12-25T18:41:42Z
---

# Stream C: AI Prompts & Relationship Synthesis

## Scope
Create relationship synthesis and chat prompts, integrate sender_id context, add relationship_shared session type.

## Files
- `backend/src/prompts/relationship-synthesis.txt`
- `backend/src/prompts/relationship-chat.txt`
- `backend/src/services/ai-orchestrator.ts`

## Progress

### Completed (2025-12-25T18:41:42Z)

1. **Created relationship-synthesis.txt prompt**
   - Comprehensive system prompt for initial shared conversation message
   - Addresses both partners as a couple
   - Draws from both exploration transcripts and all previous guidance
   - Highlights shared needs, alignment points, and divergence areas
   - Suggests dialogue framework for constructive conversation
   - Warm, supportive tone as neutral facilitator
   - Includes therapeutic boundaries and best practices

2. **Created relationship-chat.txt prompt**
   - System prompt for ongoing shared relationship conversation
   - Addresses partners as a couple, not individuals
   - Receives and processes sender_id to track who sent each message
   - Responds to both partners in every message, not just sender
   - Facilitates dialogue and de-escalation
   - Promotes shared understanding using reflection, reframing, validation
   - Never takes sides or assigns blame
   - Includes techniques from EFT, Imago, Gottman, and Narrative Therapy

3. **Created ai-orchestrator.ts service**
   - New service to handle relationship_shared session type
   - `generateRelationshipSynthesis()` - Creates initial welcome message
     - Loads both partners' exploration sessions
     - Retrieves previous individual/joint-context guidance
     - Uses relationship-synthesis.txt prompt
     - Returns synthesis message with token usage
   - `generateRelationshipResponse()` - Handles ongoing conversation
     - Processes messages with sender_id context
     - Uses relationship-chat.txt prompt
     - Includes sender information in message formatting
     - Returns AI response with token usage
   - `streamRelationshipResponse()` - Streaming version for real-time chat
     - Same functionality as generateRelationshipResponse
     - Streams chunks via callback for better UX
   - Helper functions:
     - `buildRelationshipSynthesisContext()` - Formats context from both explorations
     - `buildSystemPromptWithSenderContext()` - Adds partner names to prompt
     - `convertRelationshipMessages()` - Formats messages with sender labels
     - `getPartnerGuidance()` - Retrieves previous guidance for context
     - `calculateCost()` - Token usage cost calculation

### Integration Details

**Sender ID Flow:**
- Messages include `senderId` field to identify which partner sent it
- AI orchestrator receives `senderId` in context
- Messages formatted as `[Message from Partner A/B]\n{content}`
- AI prompt instructs model to acknowledge sender and address both partners

**Session Type Handling:**
- Added support for `relationship_shared` session type
- Loads context from both partners' exploration and guidance sessions
- Includes RAG context and pattern insights for relationship-level view
- Token limits: 2048 for synthesis, 1536 for ongoing chat

**Architecture:**
- Follows same patterns as ai-exploration.ts and guidance-synthesis.ts
- Uses Anthropic SDK with Claude Sonnet 4 model
- Integrates with existing prompt-builder, conversation, conflict, and user services
- Includes comprehensive error handling and logging

## Status
✅ Stream C completed - All files created and committed
