---
issue: 15
stream: Backend Conflict API & Visibility
agent: general-purpose
started: 2025-12-25T17:41:54Z
status: completed
updated: 2025-12-25T17:50:38Z
---

# Stream A: Backend Conflict API & Visibility

## Scope
Create conflict service, routes, types, and implement visibility filtering for partner conversations.

## Files
- `backend/src/routes/conflicts.ts`
- `backend/src/services/conflict.ts`
- `backend/src/types/index.ts` (add conflict types)
- `backend/src/index.ts` (register routes)

## Progress

### Completed
- Added conflict types to `backend/src/types/index.ts`:
  - ConflictStatus type with states: partner_a_chatting, pending_partner_b, partner_b_chatting, both_finalized
  - ConflictPrivacy type: private | shared
  - Conflict interface with all required fields

- Created conflict service (`backend/src/services/conflict.ts`):
  - createConflict: Creates conflict + automatically creates Partner A's individual_a session
  - getConflict: Retrieves conflict by ID
  - getConflictWithVisibility: Enforces visibility rules based on user role and status
  - getUserConflicts: Lists all conflicts for a user
  - invitePartnerB: Adds Partner B and creates their individual_b session
  - updateStatus: Validates and executes status transitions

- Implemented visibility rules (CRITICAL SECURITY):
  - Partner B cannot see Partner A's conversation until:
    1. Partner B finalizes their own conversation
    2. Status is both_finalized
    3. Privacy is 'shared'
  - Same rules apply for Partner A viewing Partner B
  - Enforced at service level with proper error handling

- Created conflict routes (`backend/src/routes/conflicts.ts`):
  - POST /api/conflicts: Create conflict (auto-creates individual_a session)
  - GET /api/conflicts/:id: Get conflict with visibility filtering
  - GET /api/conflicts: List user's conflicts
  - POST /api/conflicts/:id/invite: Invite Partner B
  - POST /api/conflicts/:id/status: Update conflict status
  - All routes require authentication
  - Proper error handling with 403 for access violations

- Registered routes in `backend/src/index.ts`

### Commit
- Issue #15: Add conflict types, service, and API routes with visibility filtering

## Notes
- Security implemented at service layer, not just UI
- Status transitions validated to prevent invalid state changes
- Follows existing patterns from conversation service and routes
- Uses SurrealDB with same patterns as other services
