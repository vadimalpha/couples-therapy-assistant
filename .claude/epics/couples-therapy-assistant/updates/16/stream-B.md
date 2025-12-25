---
issue: 16
stream: Synthesis Service & Prompts
agent: general-purpose
started: 2025-12-25T17:54:31Z
updated: 2025-12-25T18:00:48Z
status: completed
---

# Stream B: Synthesis Service & Prompts

## Scope
Create guidance synthesis service with prompt templates for individual and joint-context guidance.

## Files
- `backend/src/services/guidance-synthesis.ts` - Complete
- `backend/src/prompts/individual-guidance-prompt.txt` - Complete
- `backend/src/prompts/joint-context-synthesis.txt` - Complete
- `backend/src/prompts/joint-context-chat.txt` - Complete

## Progress

### Completed
1. Created individual guidance prompt
   - Synthesizes single partner's exploration
   - Validates emotions and experiences
   - Identifies key themes and patterns
   - Offers actionable but non-prescriptive suggestions
   - Invites continued dialogue

2. Created joint-context synthesis prompt
   - Incorporates both partners' perspectives
   - Identifies areas of alignment and difference
   - Provides personalized insights for specific partner
   - Suggests communication approaches
   - Maintains therapeutic neutrality

3. Created joint-context chat prompt
   - Supports ongoing refinement dialogue
   - Answers questions about initial guidance
   - Deepens understanding of insights
   - Maintains consistency with synthesis
   - Handles various question types (clarification, pushback, practical, etc.)

4. Implemented guidance synthesis service
   - `synthesizeIndividualGuidance()`: Creates guidance from single partner's exploration
   - `synthesizeJointContextGuidance()`: Creates guidance using both partners' perspectives
   - Extracts and integrates intake data when available
   - Tracks token usage and costs for monitoring
   - Creates and manages joint_context sessions
   - Validates session states before synthesis
   - Handles missing data gracefully

## Technical Details

### Token Limits
- Individual guidance: 2048 max output tokens (~8k context)
- Joint-context guidance: 3072 max output tokens (~20k context)

### Session Flow
1. Individual synthesis creates new `joint_context_a` or `joint_context_b` session
2. Joint-context synthesis adds to existing joint_context session
3. Guidance stored as first AI message in new session

### Error Handling
- Validates API key configuration
- Verifies exploration sessions are finalized
- Gracefully handles missing intake data
- Logs all synthesis operations for monitoring

## Commits
- `2f4a601`: Add guidance synthesis prompts
- `fceb01b`: Create guidance synthesis service
