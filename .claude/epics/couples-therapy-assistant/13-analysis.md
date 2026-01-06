---
issue: 13
analyzed: 2025-12-25T16:42:55Z
parallel_streams: 3
estimated_hours: 40-56
---

# Issue #13 Analysis: Database & Firebase Auth Foundation

## Work Streams

### Stream A: Database Layer
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `src/utils/db.ts`
- `src/db/schema.sql`
- `migrations/*.sql`

**Work**:
1. Create SurrealDB connection singleton
2. Create namespace `couples_therapy` and database `main`
3. Execute schema definitions (users, relationships, conflicts, conversation_sessions, conversation_messages)
4. Verify tables created correctly
5. Write basic CRUD utilities

**Dependencies**: SurrealDB Cloud credentials (available)

---

### Stream B: Frontend Auth (Firebase)
**Agent Type**: general-purpose
**Can Start Immediately**: Yes
**Files**:
- `src/auth/firebase-config.ts`
- `src/auth/AuthSystem.ts`
- `src/auth/AuthContext.tsx`
- `src/components/LoginPage.tsx`
- `src/components/SignupPage.tsx`

**Work**:
1. Initialize Firebase with provided config
2. Create AuthSystem class (BOR pattern):
   - `signIn(email, password)`
   - `signUp(email, password)`
   - `signInWithGoogle()`
   - `signOut()`
   - `requireAuth()`
   - `getCurrentUser()`
3. Create AuthContext for React state management
4. Build LoginPage with email/password + Google Sign-In button
5. Build SignupPage with email/password registration
6. Handle localStorage for auth persistence

**Dependencies**: Firebase project config (available)

---

### Stream C: Backend Auth + User Sync
**Agent Type**: general-purpose
**Can Start Immediately**: Yes (but benefits from Stream A completion)
**Files**:
- `src/middleware/auth.ts`
- `src/services/user.ts`
- `src/services/relationship.ts`
- `src/routes/auth.ts`
- `src/routes/relationships.ts`

**Work**:
1. Firebase Admin SDK initialization
2. Auth middleware:
   - Extract Bearer token from Authorization header
   - Verify with `admin.auth().verifyIdToken(token)`
   - Attach decoded user to `req.user`
3. User Service:
   - `GET /api/users/me` - Current user profile
   - `POST /api/users/sync` - Sync Firebase user to SurrealDB
4. Relationship Service:
   - `POST /api/relationships/invite` - Generate invitation token, send email
   - `POST /api/relationships/accept/:token` - Partner B accepts
   - `GET /api/relationships/me` - Get current relationship

**Dependencies**: Firebase Admin service account JSON (user has it), SurrealDB connection (Stream A)

---

## Parallel Execution Strategy

```
Stream A (Database) ──────────────────────────►
Stream B (Frontend Auth) ─────────────────────►
Stream C (Backend Auth) ──────────►[wait for A]►
                         └─────────────────────►
```

- Streams A and B can run fully in parallel (no file overlap)
- Stream C can start immediately on middleware/services, but needs Stream A for database operations
- All streams can complete independently

## Coordination Points

1. **Stream C depends on Stream A** for database connection when implementing user sync
2. **Frontend (Stream B) + Backend (Stream C)** integration testing happens after both complete
3. No file conflicts expected - clean separation

## Risk Assessment

- **Low Risk**: All credentials available (Firebase, SurrealDB)
- **Medium Risk**: First SurrealDB Cloud connection - may need debugging
- **Low Risk**: Firebase Admin SDK is well-documented

## Suggested Agent Assignment

| Stream | Agent | Priority |
|--------|-------|----------|
| A - Database | general-purpose | High (unblocks C) |
| B - Frontend Auth | general-purpose | High |
| C - Backend Auth | general-purpose | High (start immediately, sync with A) |

## Output Artifacts

- Working Firebase authentication flow (frontend)
- SurrealDB schema with all tables
- Backend auth middleware verifying Firebase tokens
- User sync creating SurrealDB records from Firebase users
- Relationship invitation/acceptance system
