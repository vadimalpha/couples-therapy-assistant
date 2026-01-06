---
name: couples-therapy-assistant
status: backlog
created: 2025-12-23T20:53:21Z
updated: 2025-12-25T18:50:10Z
progress: 0%
prd: .claude/prds/couples-therapy-assistant.md
github: https://github.com/vadimalpha/taskmanager/issues/12
---

# Epic: Couples Therapy Assistant

## Overview

Build a web-based AI conflict resolution platform for couples using a **conversational, chat-based approach**. Instead of filling out forms, partners independently **chat with an AI therapist** about conflicts until they feel heard, receive individual AI coaching, then access a **shared chat space** for joint relationship guidance.

**Core Interaction Model:**
- **Intake**: AI conducts conversational interview to learn about each partner (no predefined survey form)
- Partner A chats naturally with AI about the conflict (no forms)
- Partner B chats separately (blind—no access to Partner A's chat)
- Both conversations are fed as context for joint guidance
- All guidance is delivered as interactive chat messages that can be refined
- Shared relationship chat where both partners engage with AI together

**Core Innovation**: Conversational intake and blind input ensure authentic perspectives, and interactive refinement of guidance through continued chat.

**Key Technical Challenges**:
1. Real-time chat interface with streaming AI responses
2. Conversation session management (individual + shared)
3. Multi-turn context management for ongoing conversations
4. SurrealDB RAG implementation for pattern recognition
5. Privacy-preserving visibility controls at UI and API layers
6. WebSocket-based real-time synchronization for shared chat

## Architecture Decisions

### 1. Monolithic Backend with Service Separation
**Decision**: Single Node.js/Express backend with clear service boundaries (User, Conflict, AI Orchestrator)
**Rationale**: Simpler deployment for MVP, easy to extract to microservices later if needed

### 2. SurrealDB for Primary Database + OpenAI Embeddings for RAG
**Decision**: Use OpenAI text-embedding-3-small for embeddings, store vectors in SurrealDB
**Rationale**: OpenAI embeddings provide better semantic quality, SurrealDB stores vectors efficiently

### 3. Firebase Authentication (BOR Pattern)
**Decision**: Use Firebase Auth for user authentication with Google Sign-In and email/password, following the same implementation pattern as the BOR project
**Rationale**: Proven implementation pattern, Firebase handles auth complexity, Google Sign-In for easy onboarding, compatible with SurrealDB for user data storage

### 4. Real-Time Chat Architecture
**Decision**: WebSocket-based chat with streaming AI responses (Server-Sent Events for LLM streaming)
**Rationale**: Natural conversational experience requires real-time message delivery, not request-response

### 5. Conversation Session Management
**Decision**: Store full conversation transcripts in SurrealDB, pass to LLM on each message
**Rationale**: Each AI response needs full conversation context for coherent multi-turn dialogue

### 6. Redis for Background Jobs
**Decision**: Redis handles background processing (guidance synthesis, pattern analysis)
**Rationale**: Guidance synthesis after conversation finalization doesn't need real-time response

### 7. React + TypeScript SPA with Chat UI
**Decision**: Standard React 18 SPA with React Query for state management + custom chat components
**Rationale**: Team familiarity, React Query handles caching/sync, need dedicated chat UI components

### 8. Client-Side Privacy Enforcement + Server Validation
**Decision**: UI hides Partner A's conversation from Partner B, but backend ALSO validates access rights
**Rationale**: Defense in depth - never trust client, but good UX prevents accidental exposure

## Technical Approach

### Frontend Components

**Authentication Flow (Firebase - BOR Pattern)**
- Firebase Auth SDK integration (firebase-app-compat.js, firebase-auth-compat.js)
- LoginPage with email/password + Google Sign-In button (signInWithPopup)
- SignupPage with Firebase createUserWithEmailAndPassword
- AuthSystem wrapper class (following BOR's `website/js/auth.js` pattern):
  - `signIn(email, password)` - Firebase signInWithEmailAndPassword
  - `signUp(email, password)` - Firebase createUserWithEmailAndPassword
  - `signInWithGoogle()` - Firebase GoogleAuthProvider popup
  - `signOut()` - Clear localStorage + Firebase signOut
  - `requireAuth()` - onAuthStateChanged listener with redirect
  - `getCurrentUser()` / `getCurrentUserData()` - User state accessors
- User role management stored in SurrealDB (fetched after Firebase auth)
- Firebase token passed in `Authorization: Bearer` header to backend
- Backend verifies token with `admin.auth().verifyIdToken()` (Firebase Admin SDK)
- InvitationAcceptPage (Partner B accepts pairing via email link with token)

**Onboarding (Chat-Based Intake)**
- IntakeChat component (reuses ChatWindow/ChatMessage/ChatInput from Chat Infrastructure)
- AI conducts conversational interview (10-15 minutes, ~10-15 messages)
- Topics covered through natural dialogue: background, communication style, triggers, relationship context, goals
- AI summarizes learned information at end for user confirmation
- "I'm ready" button to finalize intake (same pattern as exploration chat)
- Full transcript stored in SurrealDB with vector embeddings for context retrieval
- Save/resume functionality (conversation continues where left off)
- PartnerInviteForm (sends email/SMS with unique token)

**Chat Interface Components**
- ChatWindow (main chat container with message list + input)
- ChatMessage (individual message bubble, role-aware styling)
- ChatInput (text input with send button, typing indicator support)
- StreamingMessage (AI response with real-time text streaming)
- ChatHeader (conflict title, partner indicator, status)
- ReadyButton ("I'm ready" to finalize conversation)
- ConversationLock (indicator when conversation is finalized)

**Conflict Management (Chat-Based)**
- ConflictStartPage (title + privacy setting → enters chat)
- ExplorationChat (Partner's individual conversation with AI)
- GuidanceChat (Interactive guidance refinement after finalization)
- SharedRelationshipChat (Both partners + AI in same chat space)
- ConflictDashboard (list of conflicts with chat status indicators)

**State Management**
- React Query for server state (conflicts, user profile, relationship status)
- WebSocket connection for real-time chat updates
- Local state for chat messages (optimistic updates)
- useConversation hook for chat session management
- No Redux needed - React Query + context for auth + WebSocket for chat

### Backend Services

**Auth Middleware** (`src/middleware/auth.ts` - BOR Pattern)
- Firebase Admin SDK initialization (`admin.initializeApp()`)
- `authenticateUser` middleware:
  - Extract Bearer token from `Authorization` header
  - Verify with `admin.auth().verifyIdToken(token)`
  - Attach decoded user (`uid`, `email`) to `req.user`
  - Fetch additional user data from SurrealDB
- `requirePartner` middleware - Verify user is in a relationship
- LocalStorage keys: `firebaseUID`, `firebaseToken`, `userName`, `userEmail`

**User Service** (`src/services/user.ts`)
- GET `/api/users/me` - Current user profile (uses Firebase UID)
- PATCH `/api/users/me/intake` - Save/update intake survey responses
- POST `/api/users/sync` - Sync Firebase user to SurrealDB on first login

**Relationship Service** (`src/services/relationship.ts`)
- POST `/api/relationships/invite` - Generate invitation token, send email/SMS
- POST `/api/relationships/accept/:token` - Partner B accepts invitation
- GET `/api/relationships/me` - Get current relationship status
- DELETE `/api/relationships/me` - Un-pair (mutual consent logic)

**Conflict Service** (`src/services/conflict.ts`)
- POST `/api/conflicts` - Partner A creates conflict (title + privacy) → creates conversation session
- GET `/api/conflicts/:id` - Fetch conflict with appropriate visibility filtering
- GET `/api/conflicts` - List conflicts (with chat status indicators)
- PATCH `/api/conflicts/:id/archive` - Soft delete with conversation history

**Conversation Service** (`src/services/conversation.ts`)
- POST `/api/conversations/:id/messages` - Send message in conversation (triggers AI response)
- GET `/api/conversations/:id` - Get full conversation transcript
- POST `/api/conversations/:id/finalize` - "I'm ready" button → locks conversation, triggers guidance
- WebSocket handlers for real-time message streaming
- Session types: `individual_a`, `individual_b`, `joint_context_a`, `joint_context_b`, `relationship_shared`

**Chat AI Service** (`src/services/chat-ai.ts`)
- Real-time conversation handler (exploration phase)
- `respondToMessage(sessionId, message)` - Generate AI response with full context
- OpenAI GPT-5.2 for chat completions (400K context window)
- Streaming response via Server-Sent Events
- System prompt selection based on conversation phase
- Context window management (intake + history + current conversation)

**Guidance Synthesis Service** (`src/services/guidance-synthesis.ts`)
- Background job triggered after partner finalizes conversation
- `synthesizeIndividualGuidance(sessionId)` - Summarize exploration → individual guidance
- `synthesizeJointContextGuidance(conflictId, partnerId)` - Both conversations → personal guidance
- `synthesizeRelationshipGuidance(conflictId)` - All conversations → initial shared guidance
- Guidance delivered as chat messages (can continue refining)

**Pattern Recognition Service** (`src/services/pattern-recognition.ts`)
- Analyzes conversation transcripts for recurring themes
- Identifies relationship cycles (pursue-withdraw, mutual criticism)
- Injects insights into guidance synthesis prompts

### Database Schema (SurrealDB)

**Tables:**
- `users` (id, firebase_uid, email, display_name, intake_completed, intake_data, created_at)
- `relationships` (id, partner_a_id, partner_b_id, status, confirmed_at)
- `conflicts` (id, relationship_id, created_by, title, status, privacy_setting, created_at)
- `conversation_sessions` (id, conflict_id, user_id, session_type, status, created_at, finalized_at)
  - session_type: `individual_a`, `individual_b`, `joint_context_a`, `joint_context_b`, `relationship_shared`
  - status: `active`, `finalized`
- `conversation_messages` (id, session_id, role, sender_id, content, tokens_used, created_at)
  - role: `user`, `assistant`
  - sender_id: null for assistant messages, user_id for user messages

**Relationships:**
- `users` → `relationships` (1-to-1 active relationship per user)
- `relationships` → `conflicts` (1-to-many)
- `conflicts` → `conversation_sessions` (1-to-5: individual_a, individual_b, joint_context_a, joint_context_b, relationship_shared)
- `conversation_sessions` → `conversation_messages` (1-to-many)

**Vector Embeddings (OpenAI text-embedding-3-small):**
- Generate embeddings via OpenAI API, store in SurrealDB
- Store intake survey responses as embeddings for semantic similarity search
- Store conversation summaries as embeddings for pattern matching across conflicts

### AI Prompt Flow (Conversational Model)

**Phase 0: Intake Interview (Chat-Based Onboarding)**
- Each partner chats with AI to complete intake (session_type: `intake`)
- AI conducts conversational interview covering:
  - Basic introduction (name, how they're feeling about starting)
  - Current relationship (duration, living situation, stage)
  - Communication style (how they express themselves during conflict)
  - Conflict triggers (what topics/situations cause tension)
  - Previous relationship patterns (if comfortable)
  - Relationship goals (what they hope to improve)
- AI asks follow-up questions based on responses (adaptive, not scripted)
- AI summarizes what it learned at the end
- User clicks "I'm ready" to finalize intake
- Transcript stored with vector embeddings for future context retrieval

**Phase 1: Exploration Conversations (Real-Time Chat)**
- Partner A chats with AI about the conflict (session_type: `individual_a`)
  - AI uses exploration system prompt (empathetic, clarifying questions)
  - Full conversation stored, passed as context on each message
  - Partner A clicks "I'm ready" → session finalized
- Partner B chats separately (session_type: `individual_b`)
  - Same exploration flow, blind to Partner A's conversation
  - Partner B clicks "I'm ready" → session finalized → triggers Phase 2

**Phase 2: Joint-Context Guidance Synthesis** (Background Job after both finalize)
- Synthesize Partner A's joint guidance:
  - Input: Partner A exploration transcript + Partner B exploration transcript
  - Output: Initial guidance message in `joint_context_a` session
  - Partner A can continue chatting to refine
- Synthesize Partner B's joint guidance:
  - Input: Both exploration transcripts
  - Output: Initial guidance message in `joint_context_b` session
  - Partner B can continue chatting to refine

**Phase 3: Shared Relationship Chat** (Unlocked after Phase 2)
- Both partners join shared chat (session_type: `relationship_shared`)
- AI has context: all 4 previous conversations (exploration + joint guidance)
- Initial AI message synthesizes relationship-level insights
- Both partners can chat together with AI

**Prompt Templates** (`src/prompts/`):
- `intake-interview-prompt.txt` - Conversational intake interview (warm, curious, covers background/triggers/goals)
- **Exploration Phase** (mode-specific):
  - `exploration-system-prompt-conversational.txt` - Warm, empathetic exploration with gentle guidance
  - `exploration-system-prompt-structured.txt` - Clinical, framework-based exploration
  - `exploration-system-prompt-test.txt` - Brief test mode responses
- **Individual Guidance Synthesis** (mode-specific):
  - `individual-guidance-prompt-conversational.txt` - Warm, personalized guidance
  - `individual-guidance-prompt-structured.txt` - Clinical, framework-based guidance
  - `individual-guidance-prompt-test.txt` - Brief test mode synthesis
- **Joint Context Synthesis** (mode-specific):
  - `joint-context-synthesis-conversational.txt` - Warm synthesis of partner context
  - `joint-context-synthesis-structured.txt` - Clinical synthesis
  - `joint-context-synthesis-test.txt` - Brief test mode
- `joint-context-chat.txt` - Ongoing refinement after initial guidance
- **Relationship Synthesis** (mode-specific):
  - `relationship-synthesis-conversational.txt` - Warm shared guidance
  - `relationship-synthesis-structured.txt` - Clinical shared guidance
  - `relationship-synthesis-test.txt` - Brief test mode
- `relationship-chat.txt` - Shared conversation system prompt

**Token Budget Considerations:**
- Exploration: ~2,000-5,000 tokens per conversation
- Synthesis: ~8,000-15,000 tokens (includes both transcripts)
- Shared chat: ~15,000-25,000 tokens (includes all context)
- **Estimated cost per conflict: $1-3** (vs $0.20-0.50 for form-based)

### Infrastructure

**MVP Deployment** (Keep Simple):
- Frontend: Vercel (free tier, auto-deploy from Git)
- Backend: Railway/Render ($5-25/month, easy Node.js deployment)
- SurrealDB: SurrealDB Cloud ($25-100/month) OR self-hosted Docker on Railway
- Redis: Railway Redis add-on (free tier, 25MB)
- Email: SendGrid (free tier, 100 emails/day)

**Monitoring**:
- Sentry for error tracking (free tier)
- Basic logging to stdout (Railway captures logs)
- Simple Prometheus metrics (optional, post-MVP)

**Security**:
- TLS via Vercel/Railway (automatic)
- Firebase Auth handles token management (no custom JWT implementation)
- Firebase ID tokens verified on backend via Admin SDK
- Rate limiting (express-rate-limit middleware)
- Helmet.js for HTTP headers

## Implementation Strategy

### Development Phases

**Phase 1: Core Auth & Pairing (Week 1-2)**
- Firebase Auth setup (project creation, config)
- Frontend AuthSystem class (BOR pattern - email/password + Google Sign-In)
- Backend Firebase Admin SDK integration (token verification middleware)
- User sync from Firebase to SurrealDB on first login
- Relationship invitation system (email with token)
- Intake survey UI + backend storage
- SurrealDB schema setup (users, relationships, conflicts, conversation_sessions, conversation_messages)

**Phase 2: Chat Infrastructure (Week 2-3)**
- WebSocket server setup for real-time messaging
- ChatWindow, ChatMessage, ChatInput components
- StreamingMessage component (SSE for AI responses)
- Conversation session management (create, finalize, lock)
- Message persistence to SurrealDB

**Phase 3: Exploration Chat Flow (Week 3-4)**
- Conflict creation (title + privacy) → auto-create `individual_a` session
- Partner A exploration chat (real-time AI responses)
- "I'm ready" button → finalize session
- Partner B invitation → create `individual_b` session
- Partner B blind exploration chat
- Session finalization triggers Phase 2 synthesis

**Phase 4: Guidance Synthesis & Refinement (Week 4-5)**
- OpenAI GPT-5.2 API integration
- Guidance Synthesis Service (background jobs)
- `joint_context_a` and `joint_context_b` session creation with initial AI message
- Interactive guidance refinement chat
- BullMQ job queue for synthesis

**Phase 5: Shared Relationship Chat (Week 5-6)**
- `relationship_shared` session creation (unlocked after both get joint guidance)
- Multi-user WebSocket room for shared chat
- Relationship synthesis (initial AI message)
- Both partners can chat together with AI

**Phase 6: RAG & Pattern Recognition (Week 6-7)**
- SurrealDB vector embeddings for intake data
- Conversation summary embeddings for pattern detection
- Pattern recognition across conversation transcripts
- Inject patterns into synthesis prompts

**Phase 7: UI Polish & Testing (Week 7-8)**
- Conflict dashboard with chat status indicators
- Conversation history view
- E2E testing with Playwright
- Manual UAT with 5-10 beta couples

**Phase 8: Launch Prep (Week 8-9)**
- Terms of Service, Privacy Policy
- Crisis resource footer on every page
- Content filtering for harmful AI responses
- Security audit (penetration testing)
- Deploy to production
- Monitor first 50 couples

### Risk Mitigation

**Risk 1: SurrealDB Learning Curve**
- **Mitigation**: Allocate Week 1 for team training, build prototype schema
- **Fallback**: If blockers arise, migrate to PostgreSQL + pgvector (2-day pivot)

**Risk 2: LLM Hallucinations/Harmful Advice**
- **Mitigation**: Implement content filtering layer before displaying to users
- **Mitigation**: "Report this message" button on every AI message
- **Mitigation**: Regular prompt audits + red-teaming
- **Fallback**: Human review queue for flagged responses

**Risk 3: Low Partner B Response Rate**
- **Mitigation**: Individual exploration chat is still valuable standalone
- **Mitigation**: Email notification when Partner A creates conflict (post-MVP)

**Risk 4: AI Cost Overruns (Higher with Conversational Model)**
- **Mitigation**: Set hard monthly cap ($3000) in Anthropic dashboard
- **Mitigation**: Monitor per-conflict cost (target $1-3, up from $0.20-0.50)
- **Mitigation**: Implement conversation length limits (soft cap: 20 messages per session)
- **Mitigation**: Consider conversation summarization for very long sessions

**Risk 5: WebSocket Reliability**
- **Mitigation**: Implement reconnection logic with exponential backoff
- **Mitigation**: Fall back to polling if WebSocket unavailable
- **Mitigation**: Queue messages during disconnection, sync on reconnect

**Risk 6: Multi-User Chat Coordination**
- **Mitigation**: Shared chat has clear turn indicators (who's typing)
- **Mitigation**: Rate limit messages to prevent spam
- **Fallback**: If coordination issues arise, implement "request to speak" mode

### Testing Approach

**Unit Tests** (Jest):
- Service layer logic (User, Relationship, Conflict, Conversation services)
- Guidance Synthesis prompt construction
- Pattern recognition algorithm
- Privacy filtering logic
- WebSocket message handlers

**Integration Tests** (Supertest + WebSocket):
- API endpoint testing (auth, conflict creation, session management)
- WebSocket connection and message flow
- Database interactions (SurrealDB conversation storage)
- AI service mocking (test prompt construction without actual LLM calls)
- Session finalization and synthesis triggers

**E2E Tests** (Playwright):
- Partner A creates conflict → chats with AI → finalizes
- Partner B joins blindly → chats with AI → finalizes
- Joint guidance sessions unlock after both finalize
- Shared relationship chat with both partners
- Privacy scenarios (Partner B cannot see Partner A's conversation)
- Streaming message display during AI response

**Manual Testing**:
- 5-10 beta couples use the app for 2 weeks
- Gather feedback on AI conversation quality
- Monitor completion rate (target 65% both partners finalize)
- Track average conversation length and satisfaction

## Task Breakdown Preview

We'll aim for **9 focused tasks** to implement the conversational model:

- [ ] **Task 1: Database & Firebase Auth Foundation (BOR Pattern)**
  - Firebase project setup + configuration
  - Frontend AuthSystem class (email/password + Google Sign-In)
  - Backend Firebase Admin SDK middleware (token verification)
  - SurrealDB schema setup (users, relationships, conflicts, conversation_sessions, conversation_messages)
  - User sync service (Firebase → SurrealDB on first login)
  - Relationship invitation/pairing system
  - **Est: 5-7 days**

- [ ] **Task 2: Intake Interview (Chat-Based)**
  - IntakeChat component (reuses ChatWindow/ChatMessage/ChatInput)
  - Intake interview system prompt (warm, conversational, adaptive follow-ups)
  - AI covers: background, communication style, triggers, relationship context, goals
  - AI summarizes learned information at end for user confirmation
  - "I'm ready" button to finalize intake (same UX pattern as exploration)
  - Store intake transcript in SurrealDB with vector embeddings
  - Save/resume functionality (conversation continues where left off)
  - Profile management (quarterly "refresh" intake conversation)
  - **Est: 4-5 days** (slightly longer due to prompt engineering)

- [ ] **Task 3: Chat Infrastructure**
  - WebSocket server setup (Socket.IO or native WS)
  - ChatWindow, ChatMessage, ChatInput components
  - StreamingMessage component (SSE for AI response streaming)
  - Conversation session management (create, get, finalize)
  - Message persistence to SurrealDB
  - useConversation hook for React
  - **Est: 6-8 days**

- [ ] **Task 4: Exploration Chat Flow**
  - Conflict creation (title + privacy) → auto-create `individual_a` session
  - Partner A exploration chat (real-time AI responses)
  - Exploration system prompt (empathetic, clarifying questions)
  - "I'm ready" button → finalize session
  - Partner B invitation → create `individual_b` session
  - Backend visibility filtering (Partner B cannot access Partner A's conversation)
  - **Est: 5-6 days**

- [ ] **Task 5: Guidance Synthesis & Refinement**
  - Anthropic Claude API integration
  - Guidance Synthesis Service (BullMQ background jobs)
  - Synthesize joint-context guidance from exploration transcripts
  - Create `joint_context_a` and `joint_context_b` sessions with initial AI message
  - Interactive refinement chat (continue refining guidance)
  - **Est: 6-7 days**

- [ ] **Task 6: Shared Relationship Chat**
  - `relationship_shared` session creation (unlocked after both get joint guidance)
  - Multi-user WebSocket room for shared chat
  - Relationship synthesis (initial AI message with all context)
  - Both partners can chat together with AI
  - Typing indicators for multi-user coordination
  - **Est: 4-5 days**

- [ ] **Task 7: RAG Context & Pattern Recognition**
  - SurrealDB vector search for intake data
  - Conversation summary embeddings for pattern detection
  - Pattern recognition across conversation transcripts
  - Inject RAG context + patterns into synthesis prompts
  - **Est: 4-5 days**

- [ ] **Task 8: Security, Privacy & Crisis Resources**
  - Content filtering for harmful AI messages
  - "Report this message" button
  - Crisis resource footer (suicide hotline, domestic violence)
  - Rate limiting, Helmet.js headers
  - Terms of Service, Privacy Policy pages
  - **Est: 3-4 days**

- [ ] **Task 9: Testing, Deployment & Launch**
  - E2E tests (Playwright) for chat workflows
  - WebSocket integration tests
  - Security audit (penetration testing)
  - Deploy to Vercel (frontend) + Railway (backend)
  - Monitor first 50 couples, iterate on feedback
  - **Est: 5-6 days**

**Total Estimated Effort: 42-54 days (8-11 weeks with 1 developer)**

## Tasks Created

- [ ] #21 - UI/UX Mockups & Design System (parallel: false) ← **Start here**
- [ ] #13 - Database & Auth Foundation (parallel: false)
- [ ] #14 - Intake Interview (Chat-Based) (parallel: true)
- [ ] #22 - Chat Infrastructure (parallel: false) ← **WebSocket + Chat UI**
- [ ] #24 - OpenAI GPT-5.2 & Embeddings Integration (parallel: false) ← **NEW: OpenAI integration**
- [ ] #15 - Exploration Chat Flow (parallel: true) ← **Updated from Conflict Creation**
- [ ] #16 - Guidance Synthesis & Refinement (parallel: false) ← **Updated from AI Orchestrator**
- [ ] #23 - Shared Relationship Chat (parallel: false) ← **Multi-user chat**
- [ ] #17 - RAG Context & Pattern Recognition (parallel: false)
- [ ] #19 - Security, Privacy & Crisis Resources (parallel: true)
- [ ] #20 - Testing, Deployment & Launch (parallel: false)

**Note**: #18 (Guidance Display UI) closed - merged into chat-based guidance (#16)

**Total tasks**: 11
**Parallel tasks**: 3 (Tasks #14, #15, #19 can run simultaneously after dependencies)
**Sequential tasks**: 8 (#21 → #13 → #22 → #24 → #15 → #16 → #23 → #17 → #20)
**Estimated total effort**: 336-432 hours (42-54 days)

## Dependencies

### External Service Dependencies
- **Firebase Auth** (Critical): Authentication, Google Sign-In (free tier covers most use cases)
- **OpenAI API** (Critical): GPT-5.2 for chat ($1.75/M in, $14/M out), text-embedding-3-small for RAG
- **SurrealDB Cloud** (Critical): Database hosting, embedding storage, backup strategy
- **SendGrid/AWS SES** (Important): Invitation emails (100 emails/day free tier)
- **Vercel** (Important): Frontend hosting, auto-deploy from Git
- **Railway/Render** (Important): Backend hosting, environment variables

### Internal Dependencies
- **Legal Review** (Critical): Terms of Service, Privacy Policy (consultant: $500-1000, 1 week)
- **Prompt Engineering** (Critical): Initial 6 prompt templates (in-house or consultant, 1-2 weeks)
- **Design Assets** (Optional): Logo, brand colors, UI mockups (Figma templates OK for MVP)

### Prerequisite Work
- **None** - Greenfield project, no existing systems to integrate

## Success Criteria (Technical)

### Performance Benchmarks
- [ ] AI response generation: < 30 seconds (P95) for all 5 prompts combined
- [ ] Page load time: < 2 seconds (homepage, dashboard)
- [ ] Database queries: < 200ms (P95) for conflict list, individual conflict fetch
- [ ] API response time: < 500ms (P95) for non-AI endpoints

### Quality Gates
- [ ] Unit test coverage: > 70% for service layer
- [ ] E2E test coverage: All critical paths (signup → conflict creation → response → guidance)
- [ ] Zero critical security vulnerabilities (OWASP Top 10)
- [ ] WCAG 2.1 AA compliance (color contrast, keyboard navigation, screen reader support)
- [ ] AI guidance quality: < 5% flagged responses in first 100 conflicts (manual review)

### Acceptance Criteria
- [ ] Partner B cannot see Partner A's conversation until both have finalized (enforced at API + UI)
- [ ] Each partner can chat with AI during exploration phase until they click "I'm ready"
- [ ] Joint-context guidance sessions unlock after both partners finalize exploration
- [ ] Shared relationship chat unlocks after both receive joint-context guidance
- [ ] All AI responses stream in real-time (SSE)
- [ ] Pattern recognition surfaces insights when 3+ similar themes detected across conversations
- [ ] Crisis resources visible on every page footer
- [ ] Users can delete account + all data (GDPR compliance)

## Estimated Effort

### Overall Timeline
- **MVP Development**: 8-10 weeks (1 full-time developer, extended for chat infrastructure)
- **Beta Testing**: 2 weeks (5-10 couples)
- **Launch Prep**: 1 week (legal, security audit, deployment)
- **Total to Launch**: 11-13 weeks (~3 months)

### Resource Requirements
- **Developer**: 1 full-stack engineer (Node.js, React, TypeScript)
- **Prompt Engineer**: 1 consultant (optional, can be developer, 20-40 hours)
- **Legal**: 1 consultant for Terms/Privacy Policy (~10 hours, $500-1000)
- **Beta Testers**: 5-10 couples (unpaid, recruit from personal network)

### Critical Path Items
1. **Weeks 1-2**: Auth + SurrealDB setup (blocks all other work)
2. **Weeks 2-3**: Chat Infrastructure (blocks exploration chat flow)
3. **Weeks 3-4**: Exploration Chat Flow (blocks guidance synthesis)
4. **Weeks 4-5**: Guidance Synthesis + Refinement (blocks shared chat)
5. **Weeks 5-6**: Shared Relationship Chat (blocks full workflow testing)
6. **Weeks 6-7**: RAG + Pattern Recognition (enhances guidance quality)
7. **Weeks 7-8**: UI Polish (blocks beta testing)
8. **Weeks 8-9**: Beta testing feedback loop (blocks launch)

### Monthly Infrastructure Cost (Post-Launch)
- SurrealDB Cloud: $25-100/month
- Railway (backend): $5-25/month
- OpenAI API: $500-2000/month (GPT-5.2 @ $1.75/M in + $14/M out, embeddings negligible)
- SendGrid: $0-15/month
- Sentry: $0 (free tier)
- **Total: $530-2140/month** (scales with usage, GPT-5.2 more cost-effective than previous models)

### Simplification Opportunities

1. **Reuse BOR Firebase Pattern**: AuthSystem class, Firebase Admin SDK middleware (proven implementation)
2. **Defer Notifications**: Email notifications when Partner A creates conflict (post-MVP, Week 10+)
3. **Defer Advanced Privacy**: End-to-end encryption (future, requires key management complexity)
4. **Defer Multi-LLM Support**: Anthropic Claude fallback (future, focus on OpenAI GPT-5.2 for MVP)
5. **Defer Analytics Dashboard**: Use SurrealDB queries for metrics (build UI later)
6. **Leverage Existing Tools**: Vercel/Railway handle CI/CD, no custom DevOps needed
7. **Use SurrealDB for Everything**: No separate vector DB, Redis handles synthesis queue only (Firebase handles auth)
8. **Streaming Responses**: Use SSE for AI responses instead of polling (better UX, simpler than full duplex)
9. **Conversation Length Limits**: Soft cap at 20 messages per session to control costs
10. **Summarization for Long Conversations**: Summarize transcripts >15 messages before passing to synthesis

