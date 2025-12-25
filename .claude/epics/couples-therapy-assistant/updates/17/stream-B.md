---
issue: 17
stream: Pattern Recognition Engine
agent: general-purpose
started: 2025-12-25T18:16:30Z
status: completed
completed: 2025-12-25T18:20:14Z
---

# Stream B: Pattern Recognition Engine

## Scope
Create pattern recognition engine for detecting recurring themes and relationship cycles.

## Files
- `backend/src/services/pattern-recognition.ts`
- `backend/src/types/index.ts` (pattern types)

## Completed

### 1. Added Pattern Types (types/index.ts)
- `ThemeFrequency`: Track recurring themes with count and timeframe
- `RelationshipCycle`: Identify relationship patterns (pursue-withdraw, demand-withdraw, etc.)
- `PatternInsights`: Combine themes, cycles, and alerts

### 2. Created PatternRecognitionEngine (services/pattern-recognition.ts)
- **Main entry point**: `detectPatterns(relationshipId, currentConflictId?)`
- **Theme detection**: Analyzes 8 categories (finances, chores, intimacy, communication, family, parenting, work, time)
- **Cycle detection**: Identifies 4 relationship patterns (pursue-withdraw, demand-withdraw, mutual-criticism, mutual-avoidance)
- **Multi-timeframe analysis**: 30, 60, and 90-day windows
- **Conservative detection**: Only surfaces patterns with 3+ occurrences
- **Human-readable alerts**: Generates contextual frequency messages

### 3. Implementation Details
- Theme detection uses case-insensitive keyword matching
- Cycle detection requires 2+ keyword matches for confidence
- Gracefully handles conflicts with missing descriptions
- Filters out current conflict when analyzing patterns
- Consolidates themes across timeframes intelligently
- Only analyzes finalized conflicts (status = 'both_finalized')

### 4. Commit
- Issue #17: Add pattern recognition types and engine (commit 9171d9f)
