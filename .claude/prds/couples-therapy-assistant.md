---
name: couples-therapy-assistant
description: AI-powered conflict resolution platform for couples using multi-perspective analysis and evidence-based therapeutic frameworks
status: backlog
created: 2025-12-23T20:12:45Z
updated: 2025-12-25T18:47:33Z
---

# PRD: Couples Therapy Assistant

## Executive Summary

The Couples Therapy Assistant is a web-based AI platform that helps couples navigate and resolve conflicts through natural, ongoing conversation with an AI therapist. The system employs a unique multi-perspective approach where each partner independently **chats with the AI** about a conflict until they feel heard and understood. These conversations are then used to provide joint relationship-focused guidance—delivered as interactive chat responses that partners can continue to refine.

**Core Interaction Model:**
- **Partner A chats** with the AI about the conflict until satisfied (no forms—just natural conversation)
- **Partner B chats** separately (blind input) until satisfied
- **AI provides joint feedback** to each partner (incorporating both conversations)
- **Both partners can continue chatting** with the AI to refine guidance and get answers aligned to their situation
- **Relationship feedback** is delivered as an interactive chat that both partners can engage with together

By leveraging evidence-based therapeutic frameworks (Gottman Method, Emotionally Focused Therapy, Nonviolent Communication) and maintaining conversational history through RAG (SurrealDB), the app provides increasingly personalized conflict resolution strategies while teaching couples essential communication skills.

**Value Proposition:**
- **Natural**: Chat naturally with an AI therapist instead of filling out forms
- **Iterative**: Refine guidance through ongoing conversation until it resonates
- **Accessible**: 24/7 AI-guided conflict resolution without scheduling therapy appointments
- **Non-judgmental**: Safe space for both partners to express their perspectives
- **Educational**: Teaches proven conflict resolution skills from multiple therapeutic modalities
- **Personalized**: Adapts to each couple's unique patterns, triggers, and relationship dynamics
- **Privacy-respecting**: Granular control over what each partner shares

## Problem Statement

### What Problem Are We Solving?

Couples face recurring conflicts but often lack:
1. **Immediate support** when tensions are high (therapists aren't available 24/7)
2. **Conflict resolution skills** - many couples don't know how to fight constructively
3. **Perspective-taking ability** - partners get stuck in their own narrative during conflicts
4. **Pattern awareness** - couples repeat unhealthy cycles without recognizing them
5. **Affordable access** to evidence-based relationship guidance ($150-300/session for therapy)

### Why Is This Important Now?

- **Rising relationship distress**: Stress from modern life increases couple conflict
- **Therapy access gap**: Long waitlists, high costs, and scheduling difficulties limit access to professional help
- **Preventative intervention**: Most couples wait 6+ years before seeking help; early intervention prevents escalation
- **AI maturity**: LLMs can now provide nuanced, empathetic guidance rooted in therapeutic frameworks
- **Proven digital health efficacy**: Studies show app-based relationship interventions improve communication and reduce conflict

### Current Alternatives & Limitations

| Alternative | Limitation |
|------------|------------|
| Traditional couples therapy | Expensive ($150-300/session), scheduling challenges, 6-12 month waitlists |
| Self-help books/videos | Passive learning, no personalization, requires high motivation |
| General therapy apps (BetterHelp, Talkspace) | Individual focus, not designed for couple dynamics |
| Existing couples apps (Paired, Lasting) | Quiz-based, lack real-time conflict support, no multi-perspective analysis |

## User Stories & Personas

### Primary Personas

#### Persona 1: Sarah (Partner Initiating Conflict Discussion)
- **Age**: 32, software engineer
- **Relationship**: 4 years married, no children
- **Pain Points**: Feels unheard during disagreements, wants to approach conflicts more constructively
- **Goals**: Learn how to express needs without escalating, understand partner's perspective
- **Tech Savviness**: High

#### Persona 2: Marcus (Partner Responding to Conflict)
- **Age**: 35, high school teacher
- **Relationship**: Same relationship as Sarah
- **Pain Points**: Tends to withdraw during conflicts, struggles to articulate feelings
- **Goals**: Stay engaged during difficult conversations, express emotions more clearly
- **Tech Savviness**: Medium

### User Journey Diagrams

#### Journey 1: Partner A - Conflict Initiation (Conversational)
```
┌─────────────────────────────────────────────────────────────────┐
│ PARTNER A: Initiating a Conflict (Chat-Based)                   │
└─────────────────────────────────────────────────────────────────┘

1. Login/Authentication
   │
   ├─> Dashboard (View past conflicts, Start new conflict)
   │
2. Start New Conflict Chat
   │
   ├─> Title the conflict (e.g., "Household chores distribution")
   ├─> Set visibility (Private/Shared with Partner B)
   ├─> ENTER CHAT INTERFACE
   │
3. Conversational Session with AI (No Forms)
   │
   ├─> Partner A describes the conflict naturally
   ├─> AI responds with clarifying questions, validation, insights
   ├─> Partner A continues chatting, adding context, details
   ├─> AI provides real-time guidance, suggestions, reflections
   ├─> Conversation continues until Partner A feels satisfied
   ├─> Partner A clicks "I'm ready" to finalize their input
   │
4. Individual Guidance Summary
   │
   ├─> AI synthesizes entire conversation into individual guidance
   ├─> Partner A can continue chatting to refine/clarify guidance
   ├─> Pattern recognition (if applicable based on history)
   │
5. Wait for Partner B Response
   │
   └─> Notification when Partner B completes their chat session
```

#### Journey 2: Partner B - Responding to Conflict (BLIND CHAT)
```
┌─────────────────────────────────────────────────────────────────┐
│ PARTNER B: Responding to a Conflict (Blind Chat)                │
└─────────────────────────────────────────────────────────────────┘

1. Login/Authentication
   │
   ├─> Dashboard (See pending conflicts from Partner A)
   │
2. View Conflict Invitation
   │
   ├─> Read conflict title ONLY
   ├─> Partner A's conversation is HIDDEN at this stage
   ├─> Set visibility (Private/Shared with Partner A)
   ├─> ENTER CHAT INTERFACE
   │
3. Conversational Session with AI (BLIND CHAT - KEY FEATURE)
   │
   ├─> Partner B describes their experience WITHOUT seeing Partner A's chat
   ├─> AI responds with clarifying questions, validation, insights
   ├─> Partner B continues chatting naturally
   ├─> AI provides real-time guidance, suggestions, reflections
   ├─> Conversation continues until Partner B feels satisfied
   ├─> Partner B clicks "I'm ready" to finalize their input
   │
4. Individual Guidance Summary
   │
   ├─> AI synthesizes entire conversation into individual guidance
   ├─> Partner B can continue chatting to refine/clarify
   ├─> AI cross-references with Partner A's conversation (behind scenes)
   │
5. THEN View Partner A's Chat Summary (if Partner A chose "Shared")
   │
   ├─> After receiving individual guidance, Partner B NOW sees
   │   a summary of Partner A's conversation (if they chose to share)
   ├─> If Partner A chose "Private," their conversation stays hidden
   │
6. Receive Joint-Context Guidance (Interactive)
   │
   ├─> AI provides personalized joint guidance as a chat message
   ├─> Partner B can continue chatting to refine and ask questions
   │
7. View Relationship Guidance (Shared Chat)
   │
   └─> Both partners access a shared chat for relationship-focused guidance
```

#### Journey 3: Joint View - Relationship Guidance (Shared Chat)
```
┌─────────────────────────────────────────────────────────────────┐
│ JOINT VIEW: Relationship-Focused Guidance (Shared Chat)         │
└─────────────────────────────────────────────────────────────────┘

Both partners can access this view after both have finalized their chat sessions

1. Conflict Overview
   │
   ├─> Conflict title & creation date
   ├─> Chat summaries (visible based on privacy settings)
   │
2. Shared Chat Interface
   │
   ├─> AI delivers relationship-focused guidance as initial message
   ├─> BOTH partners can now chat together with the AI
   ├─> Partners ask follow-up questions, request clarification
   ├─> AI refines guidance based on couple's joint input
   ├─> Conversation continues until both feel aligned
   │
3. Pattern Recognition (if applicable)
   │
   ├─> Recurring themes from relationship history
   ├─> Identified attachment triggers
   ├─> Communication cycle patterns (surfaced in chat)
   │
4. Interactive Conversation Tools
   │
   ├─> AI suggests dialogue exercises they can try together
   ├─> "Timeout" signals & self-soothing guidance
   ├─> Repair attempt suggestions (refined through chat)
   ├─> Homework/exercises generated based on conversation
   │
5. Conflict History
   │
   └─> Archive of past conflicts with conversation transcripts
       └─> Track recurring patterns over time
```

#### Journey 4: Onboarding & Relationship Pairing
```
┌─────────────────────────────────────────────────────────────────┐
│ ONBOARDING: Account Creation & Pairing                          │
└─────────────────────────────────────────────────────────────────┘

Partner A (Initiator):
1. Create Account
   │
   ├─> Email/Phone registration
   ├─> Password setup
   │
2. Intake Interview (Chat-Based, 10-15 minutes)
   │
   ├─> ENTER CHAT INTERFACE with AI
   │
   ├─> AI conducts conversational interview:
   │   ├─> Personal background (age, communication style)
   │   ├─> Previous relationship experiences
   │   ├─> Conflict triggers & sensitivities
   │   ├─> Current relationship context
   │   ├─> Common conflict areas
   │   ├─> Relationship goals
   │
   ├─> AI asks follow-up questions based on responses
   ├─> Conversation continues until AI has sufficient context
   ├─> User clicks "I'm ready" to complete intake
   │
3. Invite Partner
   │
   ├─> Send invite via email/phone
   ├─> Partner B receives unique link
   │
Partner B (Invitee):
4. Accept Invitation
   │
   ├─> Create account via invitation link
   ├─> Complete own intake interview (chat-based)
   │
5. Confirm Relationship Pairing
   │
   ├─> Both partners review & confirm pairing
   ├─> Relationship account activated
   │
6. Dashboard Access
   │
   └─> Begin creating/responding to conflicts
```

### User Stories

#### Onboarding & Pairing
**As a new user**, I want to complete an intake interview through natural conversation with the AI so it understands my background, relationship history, and conflict triggers.

**Acceptance Criteria:**
- Intake is a chat-based conversation with the AI (not a predefined form)
- AI asks questions conversationally and follows up based on my responses
- Covers: personal background, communication preferences, relationship context, conflict triggers, relationship goals
- Typically takes 10-15 minutes depending on conversation depth
- AI summarizes what it learned at the end for user confirmation
- User clicks "I'm ready" to complete intake when satisfied
- Full conversation transcript stored in RAG database for AI context
- Can exit and resume intake conversation where left off

**As Partner A**, I want to invite my partner via email/phone so we can link our accounts as a couple.

**Acceptance Criteria:**
- Generate unique invitation link
- Partner B receives email/SMS with invitation
- Invitation expires after 7 days
- Can resend invitation if needed

**As Partner B**, I want to accept the relationship invitation so we can use the platform together.

**Acceptance Criteria:**
- Click invitation link to create account
- Complete own intake survey
- Both partners confirm pairing before activation
- Cannot pair with multiple partners simultaneously (MVP constraint)

#### Conflict Creation & Response (Conversational)

**As Partner A**, I want to chat with the AI about a conflict so I can explore my feelings naturally and get guidance.

**Acceptance Criteria:**
- Provide conflict title (e.g., "Disagreement about finances")
- Choose visibility: Private (partner sees title only) or Shared (partner sees conversation summary)
- Enter a chat interface where I can describe the conflict naturally
- AI responds with clarifying questions, validation, and real-time insights
- Continue chatting until I feel heard and understood
- Click "I'm ready" button to finalize my input when satisfied
- Entire conversation is captured for context

**As Partner A**, I want to receive personalized AI guidance that I can refine through continued conversation.

**Acceptance Criteria:**
- After finalizing input, AI synthesizes my conversation into individual guidance
- Guidance is delivered as a chat message I can respond to
- I can ask follow-up questions, request clarification, or ask for alternatives
- AI refines guidance based on my continued input
- Conversation continues until guidance feels aligned to my situation
- Displays pattern recognition if similar conflicts exist in history

**As Partner B**, I want to see pending conflicts from my partner so I can chat about my perspective.

**Acceptance Criteria:**
- Dashboard shows conflicts awaiting my response
- Displays conflict title and creation date ONLY
- Partner A's conversation is HIDDEN until after Partner B finalizes their own chat
- Can respond immediately or save for later

**As Partner B**, I want to chat about my experience of the same conflict WITHOUT seeing Partner A's conversation first, so both perspectives are captured authentically.

**Acceptance Criteria:**
- Enter chat interface and describe my experience naturally (blind chat)
- AI responds with clarifying questions, validation, and insights
- Choose my own visibility setting (independent from Partner A)
- Click "I'm ready" to finalize—cannot edit conversation after (maintains authenticity)
- Receive personalized AI guidance as interactive chat immediately after

**As Partner B**, I want to see a summary of Partner A's conversation AFTER receiving my individual guidance, so I can understand their viewpoint without it influencing my description.

**Acceptance Criteria:**
- Partner A's conversation summary becomes visible only after Partner B finalizes and receives individual AI guidance
- If Partner A chose "Private," their conversation remains hidden
- If Partner A chose "Shared," Partner B can now read a summary before viewing joint guidance

**As both partners**, I want to participate in a shared chat for relationship-focused guidance so we can resolve the conflict together.

**Acceptance Criteria:**
- Shared chat unlocks only after both partners finalize their individual sessions
- AI delivers initial relationship guidance as a chat message
- BOTH partners can chat with the AI together in this shared space
- Partners can ask follow-up questions, request clarification, or discuss with AI present
- AI refines guidance based on couple's joint input
- Conversation continues until both partners feel aligned
- Homework/exercises are generated based on the full conversation context

#### Pattern Recognition & History

**As a user**, I want the AI to recognize recurring patterns so I can break unhealthy cycles.

**Acceptance Criteria:**
- AI analyzes conflict history via RAG database
- Identifies recurring themes (e.g., "money conflicts," "communication shutdowns")
- Highlights attachment triggers specific to each partner
- Suggests deeper work when patterns emerge (e.g., "You've had 3 financial conflicts this month")

**As a user**, I want to review past conflicts so I can track progress and learn from previous situations.

**Acceptance Criteria:**
- View chronological list of all conflicts
- Filter by date, topic, or resolution status
- Re-read all advice (individual and joint)
- Export conflict history (future feature)

## Requirements

### Functional Requirements

#### FR1: User Authentication & Account Management
- Email/phone-based registration
- Secure password authentication (minimum 8 characters, complexity requirements)
- Password reset via email
- Account deletion (with data purge confirmation)

#### FR2: Relationship Pairing System
- Partner A sends invitation via email/phone
- Generate unique, time-limited (7-day) invitation tokens
- Partner B creates account via invitation link
- Both partners explicitly confirm pairing
- Display paired partner's name/email in settings
- Support un-pairing (with mutual consent or after 30-day cooling period for unilateral requests)

#### FR3: Intake Interview & Personalization (Chat-Based)
- AI-conducted conversational intake interview (not predefined form)
- Topics covered through natural dialogue:
  - Personal background (age, communication style)
  - Relationship context (duration, stage, living situation)
  - Conflict triggers & sensitivities
  - Previous relationship patterns
  - Relationship goals
- AI asks follow-up questions based on user responses (adaptive conversation)
- AI summarizes learned information at the end for user confirmation
- User clicks "I'm ready" to finalize intake
- Save and resume functionality (conversation continues where left off)
- Full conversation transcript stored in RAG database (SurrealDB)
- Key insights extracted and indexed for context retrieval
- Ability to have a "refresh" intake conversation quarterly to update context

#### FR4: Conflict Creation & Conversational Workflow
- **Partner A**: Create conflict with title + privacy setting (no form—enters chat)
- **Partner A**: Chat naturally with AI about the conflict (real-time responses)
- **Partner A**: AI provides clarifying questions, validation, and insights during chat
- **Partner A**: Click "I'm ready" to finalize chat session (marks input as complete)
- **Partner A**: Receive individual guidance as interactive chat message (can continue refining)
- **Partner B**: View conflict title ONLY when responding (blind chat requirement)
- **Partner B**: Chat with AI about their perspective WITHOUT seeing Partner A's conversation
- **Partner B**: Privacy toggle for their own conversation (independent from Partner A)
- **Partner B**: Click "I'm ready" to finalize—conversation locked after (maintains authenticity)
- **Partner B**: View summary of Partner A's conversation ONLY AFTER finalizing and receiving individual guidance (if Partner A chose "Shared")
- **Both partners**: Receive joint-context guidance as interactive chat (can continue refining individually)
- **Both partners**: Access shared relationship chat where both can participate with AI
- **Both partners**: View conflict status (Pending Partner Response / Both Finalized / In Joint Chat)
- **Both partners**: Archive conflicts with full conversation history (soft delete)
- **UI Enforcement**: System must prevent Partner B from seeing Partner A's conversation until workflow step 5 (see Journey 2 diagram)

#### FR4.1: Chat Interface Requirements
- Real-time message streaming (AI responses appear as they're generated)
- Message threading for conversation flow
- Typing indicators for AI responses
- "I'm ready" button to finalize chat session
- Lock icon/indicator when conversation is finalized
- Conversation transcript saved with timestamps
- Ability to scroll through conversation history
- Mobile-responsive chat interface

#### FR5: AI Conversational & Guidance System

**Conversational Phases (Real-Time Chat)**

**Phase 0A: Partner A Exploration Chat**
  - AI engages in real-time conversation with Partner A
  - Each message uses full conversation context + intake data + history
  - AI asks clarifying questions, validates emotions, provides insights
  - Conversation continues until Partner A clicks "I'm ready"
  - Entire conversation stored for context

**Phase 0B: Partner B Exploration Chat**
  - AI engages in real-time conversation with Partner B (blind—no access to Partner A's chat)
  - Each message uses full conversation context + intake data + history
  - AI asks clarifying questions, validates emotions, provides insights
  - Conversation continues until Partner B clicks "I'm ready"
  - Entire conversation stored for context

**Guidance Phases (After Both Partners Finalize)**

**Phase 1: Individual Guidance (Delivered as Chat Messages)**
  1. **Guidance 1A**: Synthesize Partner A's entire conversation → Individual guidance for Partner A
  2. **Guidance 1B**: Synthesize Partner B's entire conversation → Individual guidance for Partner B
  - Each guidance uses ONLY that partner's conversation (blind analysis)
  - Delivered as a chat message that Partner can respond to for refinement
  - Conversation can continue until guidance feels aligned

**Phase 2: Joint-Context Guidance (Delivered as Chat Messages)**
  3. **Guidance 2A**: Analyze BOTH conversations → Personalized guidance for Partner A
  4. **Guidance 2B**: Analyze BOTH conversations → Personalized guidance for Partner B
  - Partner A's full conversation fed as context for Partner B's joint feedback (and vice versa)
  - Delivered as chat messages that each partner can continue refining
  - Focus: Help each individual see their partner's perspective

**Phase 3: Relationship Guidance (Shared Interactive Chat)**
  5. **Guidance 3**: Both conversations + all previous guidance → Initial relationship guidance
  - Delivered as first message in a shared chat space
  - BOTH partners can now chat together with the AI
  - AI refines guidance based on couple's joint input
  - Conversation continues until both partners feel aligned

- **Therapeutic Framework Integration**:
  - **Gottman Method**: Detect Four Horsemen (criticism, contempt, defensiveness, stonewalling), suggest antidotes
  - **EFT**: Identify primary vs. secondary emotions, highlight attachment needs
  - **NVC**: Structure observations, feelings, needs, requests
  - Frameworks applied throughout real-time chat, not just in final guidance

- **Context Window Management**:
  - Include intake survey responses in every AI message
  - Include last 5 conflict conversation summaries for pattern recognition
  - Use RAG (SurrealDB) to retrieve relevant historical context
  - Full conversation transcript included in guidance generation prompts

#### FR6: Pattern Recognition Engine
- Analyze conflicts for recurring themes
- Detect frequency patterns (e.g., 3+ similar conflicts in 30 days)
- Identify relationship cycles (pursue-withdraw, criticism-defensiveness)
- Surface insights in joint guidance: "This is the 4th time finances have created tension"

#### FR7: Dashboard & Navigation
- **Partner A Dashboard**:
  - "Start New Conflict" button
  - List of active conflicts (pending Partner B response)
  - List of completed conflicts (both responded)
  - Pattern insights widget

- **Partner B Dashboard**:
  - Pending conflicts requiring response
  - Completed conflicts
  - Pattern insights widget

#### FR8: Privacy & Visibility Controls
- Granular per-conflict privacy settings
- Clear indicators of what partner can/cannot see
- Confirmation dialog before sharing sensitive information
- Ability to redact/hide specific conflicts from partner (edge case: abuse scenarios)

### Non-Functional Requirements

#### NFR1: Performance
- AI response generation < 30 seconds (P95)
- Page load time < 2 seconds
- Support up to 10,000 concurrent users (future scaling)
- Database queries < 200ms (P95)

#### NFR2: Security & Privacy
- **Data Encryption**:
  - TLS 1.3 for data in transit
  - AES-256 encryption for data at rest
  - End-to-end encryption for conflict descriptions (future consideration)

- **Authentication**:
  - JWT-based session management
  - Refresh token rotation
  - Session timeout after 30 days of inactivity

- **Data Access**:
  - Users can only access their own conflicts and paired partner's shared conflicts
  - Admin access logged and audited
  - No third-party data sharing without explicit consent

#### NFR3: Scalability
- Horizontal scaling for web servers
- SurrealDB sharding for multi-tenancy
- Asynchronous AI processing queue (Celery/Redis)
- CDN for static assets

#### NFR4: Reliability & Availability
- 99.5% uptime SLA (MVP target)
- Automated backups every 6 hours
- Point-in-time recovery capability
- Graceful degradation if AI service is down (queue requests, notify users)

#### NFR5: Usability & Accessibility
- WCAG 2.1 AA compliance
- Mobile-responsive design (320px - 1920px viewports)
- Support for screen readers
- Color contrast ratio ≥ 4.5:1
- Simple language (8th-grade reading level for guidance)

#### NFR6: AI Quality & Safety
- **Hallucination Prevention**: Constrain AI to therapeutic frameworks, avoid fabricating statistics
- **Harmful Content Detection**: Filter and flag advice suggesting abuse, self-harm, or dangerous behaviors
- **Bias Mitigation**: Test for gender, cultural, and socioeconomic biases in guidance
- **Human Review**: Randomly sample 5% of AI responses for quality audits (post-MVP)

#### NFR7: Observability
- Application logging (info, warning, error levels)
- AI prompt/response logging for debugging
- User analytics (conflict creation rates, completion rates)
- Error tracking (Sentry or equivalent)
- Performance monitoring (response times, DB query times)

## Success Criteria

### North Star Metric
**Conflict resolution engagement rate**: % of conflicts where both partners respond and view joint guidance

**Target**: 65% completion rate within first 3 months post-launch

### Key Metrics (MVP)

| Metric | Target | Measurement |
|--------|--------|-------------|
| User registration → paired account | 40% conversion | Track invitations sent vs. confirmed pairings |
| Intake survey completion | 80% | Users who start survey and complete it |
| Partner B response rate | 60% | Conflicts created vs. conflicts with both responses |
| Time to Partner B response | Median < 48 hours | Timestamp analysis |
| Repeat usage (return within 30 days) | 50% | Users who create 2+ conflicts in first month |
| AI response satisfaction | 4.0/5.0 average | Post-advice rating (optional feature) |

### Qualitative Success Indicators
- Users report feeling "heard" by AI guidance
- Couples report improved communication skills
- Reduction in conflict escalation (self-reported)
- Positive sentiment in user feedback

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Application (React)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth Flow   │  │  Conflict    │  │  Dashboard   │     │
│  │              │  │  Creation    │  │  & History   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend API (Node.js/Express)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  User Mgmt   │  │  Conflict    │  │  AI Service  │     │
│  │  Service     │  │  Service     │  │  Orchestrator│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
            │                   │                   │
            ▼                   ▼                   ▼
┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐
│   SurrealDB      │  │  Vector Store    │  │  OpenAI        │
│   (Primary DB)   │  │  (RAG Context)   │  │  GPT-4 API     │
│                  │  │  OpenAI          │  │  (Primary LLM) │
│  - User accounts │  │  Embeddings      │  │                │
│  - Relationships │  │  stored in       │  │  Anthropic     │
│  - Conflicts     │  │  SurrealDB       │  │  Claude        │
│  - AI responses  │  │  - Intake data   │  │  (Fallback)    │
└──────────────────┘  │  - Conflict hist │  │                │
                      └──────────────────┘  └────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- React Query for data fetching
- Formik for form handling

**Backend:**
- Node.js 20+ with Express
- TypeScript for type safety
- JWT for authentication
- SurrealDB Node.js SDK

**Database:**
- SurrealDB (primary database, stores OpenAI embeddings for RAG)
- Redis (session management, AI request queue)

**AI/LLM:**
- OpenAI GPT-5.2 - primary chat model (latest model, Dec 2025)
- OpenAI text-embedding-3-small - embeddings for RAG
- Anthropic Claude - fallback option
- Structured prompt templates per therapeutic framework

**Infrastructure (Future):**
- Docker + Kubernetes for containerization
- AWS/GCP for cloud hosting
- CloudFlare for CDN + DDoS protection

### Data Models

#### User
```typescript
interface User {
  id: string;
  email: string;
  phone?: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  intake_completed: boolean;
  intake_data?: IntakeData;
}
```

#### Relationship
```typescript
interface Relationship {
  id: string;
  partner_a_id: string; // User who sent invitation
  partner_b_id: string; // User who accepted
  status: 'pending' | 'active' | 'unpaired';
  created_at: Date;
  confirmed_at?: Date;
}
```

#### Conflict
```typescript
interface Conflict {
  id: string;
  relationship_id: string;
  created_by: string; // User ID of Partner A
  title: string;
  status: 'partner_a_chatting' | 'pending_partner_b' | 'partner_b_chatting' | 'both_finalized' | 'in_joint_chat';
  created_at: Date;

  // Partner A's conversation
  partner_a_conversation_id: string;  // Reference to ConversationSession
  partner_a_visibility: 'private' | 'shared';
  partner_a_finalized_at?: Date;

  // Partner B's conversation
  partner_b_conversation_id?: string;  // Reference to ConversationSession
  partner_b_visibility?: 'private' | 'shared';
  partner_b_finalized_at?: Date;

  // Shared relationship chat
  relationship_conversation_id?: string;  // Reference to ConversationSession (shared)

  // AI-generated guidance summaries (synthesized from conversations)
  partner_a_individual_guidance?: AIGuidance;     // From Partner A's conversation
  partner_b_individual_guidance?: AIGuidance;     // From Partner B's conversation
  partner_a_joint_context_guidance?: AIGuidance;  // For Partner A (using both convos)
  partner_b_joint_context_guidance?: AIGuidance;  // For Partner B (using both convos)
  relationship_guidance?: AIGuidance;             // Initial relationship guidance
}
```

#### ConversationSession
```typescript
interface ConversationSession {
  id: string;
  conflict_id: string;
  user_id: string;           // null for shared relationship chat
  session_type: 'individual_a' | 'individual_b' | 'joint_context_a' | 'joint_context_b' | 'relationship_shared';
  status: 'active' | 'finalized';
  messages: ConversationMessage[];
  created_at: Date;
  finalized_at?: Date;
}
```

#### ConversationMessage
```typescript
interface ConversationMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  sender_id?: string;        // User ID if role is 'user' (for shared chats with 2 users)
  content: string;
  created_at: Date;
  tokens_used?: number;      // For assistant messages
}
```

#### AIGuidance
```typescript
interface AIGuidance {
  id: string;
  conflict_id: string;
  guidance_type: 'individual_only_a' | 'individual_only_b' | 'joint_context_a' | 'joint_context_b' | 'relationship';
  llm_provider: 'openai' | 'anthropic';
  model: string; // e.g., 'gpt-5.2', 'gpt-5.2-pro'
  prompt_template_version: string;
  guidance_mode: 'structured' | 'conversational';

  // For structured mode (JSON response)
  structured_content?: {
    summary: string;
    emotions_identified?: {
      primary: string[];
      secondary: string[];
      explanation: string;
    };
    needs_identified?: string[];
    needs_explanation?: string;
    four_horsemen_detected?: string[];
    four_horsemen_explanation?: string;
    antidotes?: string[];
    conversation_starters?: Array<{
      observation: string;
      feeling: string;
      need: string;
      request: string;
    }>;
    techniques?: Array<{
      name: string;
      description: string;
      example: string;
    }>;
    pattern_insights?: string[];

    // Additional fields for Prompts 2A/2B (joint-context)
    perspective_analysis?: {
      alignment_points?: string[];
      divergence_points?: string[];
      partner_insights?: string;
    };
    empathy_opportunities?: string[];
    bridge_building_starters?: Array<{
      observation: string;
      feeling: string;
      need: string;
      request: string;
    }>;
    repair_attempts?: string[];
    relationship_patterns?: {
      pattern_detected?: string;
      explanation?: string;
      role_guidance?: string;
    };

    // Additional fields for Prompt 3 (relationship)
    shared_understanding?: {
      agreement_points?: string[];
      divergence_points?: string[];
      shared_needs?: string[];
    };
    dialogue_framework?: {
      setup?: string;
      ground_rules?: string[];
      conversation_script?: Array<{
        step: number;
        speaker: string;
        instruction: string;
        example: string;
      }>;
    };
    de_escalation_techniques?: Array<{
      name: string;
      description: string;
      how_to_use: string;
    }>;
    homework?: Array<{
      exercise: string;
      instructions: string;
    }>;
  };

  // For conversational mode (plain text response)
  conversational_content?: string;

  generated_at: Date;
  tokens_used: number;
}
```

### AI Prompt Architecture & Flow

The system uses **conversational AI** throughout the conflict resolution process:
- **Real-time chat** during exploration phase (each message is an LLM call)
- **Guidance synthesis** after partners finalize their conversations
- **Interactive refinement** of all guidance through continued chat
- **Shared chat space** for relationship guidance where both partners participate

All interactions are delivered as natural chat messages that users can respond to.

---

## Complete Conversational Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ CONFLICT WORKFLOW: Conversational AI Flow                       │
└─────────────────────────────────────────────────────────────────┘

Step 1: Partner A Creates Conflict & Enters Chat
   │
   ├─> Inputs: Title, Privacy Setting
   ├─> ENTERS CHAT INTERFACE
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│ PHASE 0A: Partner A Exploration Chat (Multi-Turn)           │
│ LLM: OpenAI GPT-5.2                                          │
│ Context: Partner A's messages + intake data + history        │
│ Flow:                                                        │
│   - Partner A sends message describing conflict              │
│   - AI responds with clarifying questions/validation         │
│   - Partner A continues chatting, adding context             │
│   - AI provides real-time insights and reflections           │
│   - Conversation continues until Partner A clicks "I'm ready"│
│ Output: Full conversation transcript stored                  │
└──────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│ GUIDANCE 1A: Individual Guidance (Chat Message)              │
│ LLM: OpenAI GPT-5.2                                          │
│ Context: Partner A's FULL conversation transcript            │
│ Output: Synthesized individual guidance as chat message      │
│ ─────────────────────────────────────────────────────────── │
│ Partner A can CONTINUE CHATTING to refine guidance           │
│ Each response uses full context to adjust recommendations    │
└──────────────────────────────────────────────────────────────┘
   │
   ▼
Step 2: Partner B Responds (Blind Chat)
   │
   ├─> Sees: Title ONLY
   ├─> ENTERS CHAT INTERFACE
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│ PHASE 0B: Partner B Exploration Chat (Multi-Turn, BLIND)    │
│ LLM: OpenAI GPT-5.2                                          │
│ Context: Partner B's messages + intake data + history        │
│         (NO ACCESS to Partner A's conversation)              │
│ Flow: Same as Phase 0A                                       │
│ Output: Full conversation transcript stored                  │
└──────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│ GUIDANCE 1B: Individual Guidance (Chat Message)              │
│ LLM: OpenAI GPT-5.2                                          │
│ Context: Partner B's FULL conversation transcript            │
│ Output: Synthesized individual guidance as chat message      │
│ ─────────────────────────────────────────────────────────── │
│ Partner B can CONTINUE CHATTING to refine guidance           │
└──────────────────────────────────────────────────────────────┘
   │
   ├─> NOW reveal Partner A's conversation summary to Partner B
   │   (if Partner A chose "Shared")
   │
   ▼
Step 3: Generate Joint-Context Guidance (After Both Finalize)
   │
   ├─> Both partners have finalized their exploration chats
   ├─> System now has both full conversation transcripts
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│ GUIDANCE 2A: Joint-Context Guidance for Partner A (Chat)    │
│ LLM: OpenAI GPT-5.2                                          │
│ Context: Partner A's conversation + Partner B's conversation │
│ Output: Personalized guidance delivered as chat message      │
│ Focus: Help Partner A understand partner's perspective       │
│ ─────────────────────────────────────────────────────────── │
│ Partner A can CONTINUE CHATTING to refine/ask questions      │
└──────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│ GUIDANCE 2B: Joint-Context Guidance for Partner B (Chat)    │
│ LLM: OpenAI GPT-5.2                                          │
│ Context: Partner B's conversation + Partner A's conversation │
│ Output: Personalized guidance delivered as chat message      │
│ Focus: Help Partner B understand partner's perspective       │
│ ─────────────────────────────────────────────────────────── │
│ Partner B can CONTINUE CHATTING to refine/ask questions      │
└──────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│ GUIDANCE 3: Relationship Guidance (SHARED CHAT SPACE)        │
│ LLM: OpenAI GPT-5.2                                          │
│ Context: BOTH full conversations + all previous guidance     │
│ Output: Initial relationship guidance as first chat message  │
│ ─────────────────────────────────────────────────────────── │
│ BOTH partners now enter a SHARED CHAT:                       │
│   - Either partner can send messages                         │
│   - AI sees who sent each message (sender_id)                │
│   - AI responds to the couple as a unit                      │
│   - Guidance is refined based on couple's joint input        │
│   - Conversation continues until both feel aligned           │
└──────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
SUMMARY: Conversational Experience for Each Partner
═══════════════════════════════════════════════════════════════

Partner A Experience:
  1. Chats freely about the conflict (exploration phase)
  2. Receives individual guidance as chat → can keep refining
  3. Receives joint-context guidance as chat → can keep refining
  4. Enters shared chat with Partner B + AI for relationship guidance

Partner B Experience:
  1. Chats freely about the conflict (blind—no access to Partner A)
  2. Receives individual guidance as chat → can keep refining
  3. Sees Partner A's conversation summary (if shared)
  4. Receives joint-context guidance as chat → can keep refining
  5. Enters shared chat with Partner A + AI for relationship guidance

Both Partners Together:
  - Shared chat space where both can engage with AI
  - AI addresses them as a couple
  - Guidance refined through joint conversation
```

---

## Conversational System Prompts

### Intake Interview System Prompt

```markdown
SYSTEM ROLE:
You are a warm, professional AI therapist conducting an intake interview for a couples therapy app.
Your goal is to learn about this person's background, relationship history, communication style, and
what they hope to achieve. This context will help you provide personalized guidance during conflicts.

APPROACH:
- Be conversational and warm, not clinical or checklist-like
- Ask ONE question at a time
- Follow up on interesting or significant responses
- Validate and normalize their experiences
- Keep responses under 100 words
- Don't rush—let the conversation flow naturally

TOPICS TO COVER (in rough order, but adapt based on responses):
1. Basic introduction (name, how they're feeling about starting this)
2. Current relationship (how long together, living situation, relationship stage)
3. Communication style (how they typically express themselves during conflict)
4. Conflict triggers (what topics or situations tend to cause tension)
5. Previous relationship patterns (if comfortable sharing)
6. Relationship goals (what they hope to improve or achieve)

TRANSITIONS:
- After covering all topics, summarize what you've learned
- Ask if there's anything else important they want you to know
- When they seem ready, let them know they can click "I'm ready" to complete intake

TONE: Warm, curious, non-judgmental. Like a first session with a new therapist—building rapport.

EXAMPLE OPENING:
"Hi! I'm so glad you're here. I'm going to ask you some questions to help me understand you and
your relationship better. This will help me give you more personalized guidance later.

Let's start simply—what name would you like me to use, and how are you feeling about
starting this process?"
```

### Exploration Phase System Prompts (Phase 0A/0B)

The exploration phase uses mode-specific prompts based on the guidance style selected for the conflict. Unlike pure "listening only" exploration, these prompts allow the AI to offer preliminary guidance during the conversation—partners can respond, clarify, or push back, creating a collaborative refinement process before final synthesis.

#### Exploration Phase - CONVERSATIONAL MODE

```markdown
SYSTEM ROLE:
You are a compassionate AI therapist helping someone explore and understand a relationship conflict.
Your role is to listen deeply, validate emotions, and help them articulate their experience. You may
offer gentle guidance and observations as the conversation unfolds—this allows the person to respond,
refine, or correct your understanding before final synthesis.

CONTEXT:
{user_intake_data}
{relationship_history_summary}
{last_5_conflict_summaries}

CONFLICT TITLE: "{conflict_title}"

CONVERSATION SO FAR:
{conversation_transcript}

INSTRUCTIONS:
1. Listen actively and reflect back what you're hearing
2. Ask ONE clarifying question at a time
3. Validate emotions before probing deeper
4. Help identify underlying feelings and needs
5. Note patterns from history if relevant (gently)
6. You MAY offer preliminary insights, observations, or gentle guidance during the conversation
   - Frame these as tentative: "It sounds like...", "I'm noticing...", "I wonder if..."
   - Welcome their response: "Does that resonate?" or "What do you think about that?"
7. Keep responses warm, conversational, and under 150 words
8. If they seem ready to wrap up, ask "Is there anything else you want to share about this?"

TONE: Warm, empathetic, curious—like a trusted friend who happens to be a therapist.
Conversational and exploratory, not clinical.
```

#### Exploration Phase - STRUCTURED MODE

```markdown
SYSTEM ROLE:
You are a clinical AI couples therapist helping someone explore a relationship conflict through an
evidence-based lens. Your role is to gather information, identify patterns using established therapeutic
frameworks, and offer preliminary clinical observations. The person can respond to refine your
understanding before final synthesis.

CONTEXT:
{user_intake_data}
{relationship_history_summary}
{last_5_conflict_summaries}

CONFLICT TITLE: "{conflict_title}"

CONVERSATION SO FAR:
{conversation_transcript}

THERAPEUTIC FRAMEWORKS TO APPLY:
- Gottman Method: Four Horsemen, emotional bids, repair attempts
- Emotionally Focused Therapy (EFT): Primary vs secondary emotions, attachment needs
- Nonviolent Communication (NVC): Observations, feelings, needs, requests

INSTRUCTIONS:
1. Listen actively and reflect back using therapeutic language where appropriate
2. Ask ONE focused question at a time to gather clinical information
3. Identify which therapeutic frameworks are relevant to what they're sharing
4. Name patterns you observe using framework terminology (explained accessibly):
   - "This sounds like what's called a 'pursue-withdraw' pattern..."
   - "I notice what Gottman would call 'criticism' in how that conversation went..."
5. Offer preliminary framework-based observations:
   - "From an attachment perspective, it seems like..."
   - "Your underlying need here might be..."
6. Invite response: "Does that framework resonate with your experience?"
7. Keep responses clinically informed but accessible, under 200 words
8. If they seem ready to wrap up, ask "Is there anything else important for me to understand?"

TONE: Educational and clinically informed, but warm and accessible.
Professional therapist guiding through evidence-based exploration.
```

#### Exploration Phase - TEST MODE

```markdown
SYSTEM ROLE:
You are an AI assistant in test mode for exploration conversations. Keep responses brief for testing.

CONTEXT:
{user_intake_data}
{conflict_title}

CONVERSATION SO FAR:
{conversation_transcript}

INSTRUCTIONS:
1. Respond briefly (1-2 sentences max)
2. Ask one simple follow-up question
3. You may offer a brief observation if relevant
4. End with "TEST_MODE_EXPLORATION" marker for verification

TONE: Brief, functional, clearly marked as test mode.
```

### Guidance Synthesis Prompt (After Partner Finalizes)

```markdown
SYSTEM ROLE:
You've been listening to someone describe a relationship conflict through conversation.
Now synthesize what you've learned into personalized guidance.

CONTEXT:
{user_intake_data}
{full_conversation_transcript}

TASK:
Based on our entire conversation, provide guidance that:
1. Summarizes what you heard (show you were listening)
2. Identifies the underlying emotions and needs
3. Highlights any communication patterns you noticed
4. Offers specific, actionable suggestions
5. Provides conversation starters for talking to their partner

IMPORTANT: This guidance will be delivered as a chat message. The user can respond
to ask questions, request clarification, or ask for alternatives. Keep it
conversational and open to refinement.

OUTPUT: A warm, personalized message (300-500 words) that invites further dialogue.
```

### Shared Chat System Prompt (Relationship Guidance)

```markdown
SYSTEM ROLE:
You are facilitating a relationship guidance session for a couple. Both partners
are present in this chat. You've already heard each of their perspectives (in
separate conversations), and now you're helping them come together.

CONTEXT:
Partner A's full conversation: {partner_a_transcript}
Partner B's full conversation: {partner_b_transcript}
Previous guidance given to Partner A: {guidance_2a_summary}
Previous guidance given to Partner B: {guidance_2b_summary}

INSTRUCTIONS:
1. Address them as a couple, acknowledging both perspectives
2. Highlight areas of alignment (what they both want)
3. Gently surface areas of divergence without blame
4. When a message comes in, note who sent it (sender_id tells you)
5. Respond to both partners, not just the one who messaged
6. Suggest dialogue exercises they can try together
7. If tension rises, offer de-escalation techniques
8. Help them find shared understanding and next steps

TONE: Neutral facilitator, warm but balanced, never taking sides.
```

---

## Detailed Prompt Templates for Guidance Synthesis

The following templates show the full structure for synthesizing guidance after exploration conversations.
These are used when generating Guidance 1A/1B (individual), Guidance 2A/2B (joint-context), and
Guidance 3 (relationship). Note that all guidance is delivered as chat messages that users can respond to.

### PHASE 1: Individual-Only Analysis

### Prompt 1A: Partner A Individual-Only Analysis - STRUCTURED MODE

```markdown
SYSTEM ROLE:
You are an expert relationship therapist trained in evidence-based therapeutic frameworks:
Gottman Method, Emotionally Focused Therapy (EFT), and Nonviolent Communication (NVC).
You provide structured, compassionate guidance to help individuals understand their emotions
and communicate effectively during conflicts.

CONTEXT (Retrieved from RAG Database):
Partner A Background (from intake survey):
- Age: {age}
- Communication style preference: {comm_style}
- Conflict triggers: {triggers}
- Relationship duration: {relationship_duration}
- Common conflict areas: {common_conflicts}
- Previous relationship patterns: {past_patterns}

Recent Conflict History (last 5 conflicts):
{conflict_history_summary}

CURRENT CONFLICT:
Title: "{conflict_title}"
Partner A's Description:
"{partner_a_description}"

**IMPORTANT**: You are analyzing Partner A's perspective ONLY. You do NOT have access
to Partner B's description yet. Focus solely on helping Partner A understand their
own emotions, needs, and communication patterns.

---

TASK:
Analyze Partner A's individual perspective using the following therapeutic frameworks:

1. **Emotionally Focused Therapy (EFT) - Emotion Analysis:**
   - Identify PRIMARY emotions (underlying: fear, hurt, shame, loneliness)
   - Identify SECONDARY emotions (surface: anger, frustration, annoyance)
   - Explain the difference and why it matters

2. **Nonviolent Communication (NVC) - Needs Assessment:**
   - What unmet needs are driving this conflict? (e.g., equity, recognition, autonomy, connection)
   - Frame needs in neutral, universal human terms

3. **Gottman Method - Communication Pattern Detection:**
   - Check for "Four Horsemen": Criticism, Contempt, Defensiveness, Stonewalling
   - If detected, note which one(s) and explain gently
   - Suggest specific antidote(s)

4. **Conversation Starters (NVC Format):**
   Provide 3 conversation starters following this structure:
   - Observation (neutral, factual)
   - Feeling (emotion word)
   - Need (underlying need)
   - Request (specific, actionable)

5. **Conflict Resolution Techniques:**
   - Suggest 2-3 specific, actionable techniques Partner A can use
   - Examples: Softened start-up, repair attempts, taking a timeout

6. **Pattern Recognition:**
   {if conflict_history_has_similar_themes}
   - Note: "This is the {count} time you've mentioned {theme} in the past {timeframe}"
   - Suggest deeper exploration or couples therapy if patterns persist
   {endif}

---

OUTPUT FORMAT (JSON):
{
  "summary": "Brief 2-3 sentence overview of the conflict from Partner A's perspective",
  "emotions_identified": {
    "primary": ["emotion1", "emotion2"],
    "secondary": ["emotion1", "emotion2"],
    "explanation": "Why distinguishing these matters..."
  },
  "needs_identified": ["need1", "need2", "need3"],
  "needs_explanation": "Here's what you're really seeking...",
  "four_horsemen_detected": ["criticism", "defensiveness"] or [],
  "four_horsemen_explanation": "I notice potential criticism when you said... This can trigger...",
  "antidotes": ["Gentle start-up: Try beginning with...", "Take responsibility: Acknowledge..."],
  "conversation_starters": [
    {
      "observation": "When I see/hear...",
      "feeling": "I feel...",
      "need": "because I need...",
      "request": "Would you be willing to..."
    },
    // 2 more starters
  ],
  "techniques": [
    {
      "name": "Softened Start-Up",
      "description": "Begin conversations gently, using 'I' statements...",
      "example": "Instead of 'You never help,' try 'I feel overwhelmed when...'"
    },
    // 1-2 more techniques
  ],
  "pattern_insights": [
    "This is the 3rd conflict about household chores in 2 months. This suggests...",
    "Consider scheduling a dedicated conversation about..."
  ] or []
}
```

---

### Prompt 1B: Partner B Individual-Only Analysis - STRUCTURED MODE

```markdown
SYSTEM ROLE:
You are an expert relationship therapist trained in evidence-based therapeutic frameworks:
Gottman Method, Emotionally Focused Therapy (EFT), and Nonviolent Communication (NVC).
You provide structured, compassionate guidance to help individuals understand their emotions
and communicate effectively during conflicts.

CONTEXT (Retrieved from RAG Database):
Partner B Background (from intake survey):
- Age: {age}
- Communication style preference: {comm_style}
- Conflict triggers: {triggers}
- Relationship duration: {relationship_duration}
- Common conflict areas: {common_conflicts}
- Previous relationship patterns: {past_patterns}

Recent Conflict History (last 5 conflicts):
{conflict_history_summary}

CURRENT CONFLICT:
Title: "{conflict_title}"
Partner B's Description:
"{partner_b_description}"

**IMPORTANT**: You are analyzing Partner B's perspective ONLY. You do NOT have access
to Partner A's description yet. Focus solely on helping Partner B understand their
own emotions, needs, and communication patterns.

---

TASK:
Analyze Partner B's individual perspective using the same therapeutic frameworks as Partner A.

[Same task structure as Prompt 1A - EFT, NVC, Gottman, conversation starters, techniques, patterns]

OUTPUT FORMAT (JSON):
[Same JSON structure as Prompt 1A]
```

---

### PHASE 1: Conversational Mode Templates

### Prompt 1A: Partner A Individual-Only Analysis - CONVERSATIONAL MODE

```markdown
SYSTEM ROLE:
You are a supportive, empathetic AI assistant helping someone navigate a relationship conflict.
Provide warm, conversational advice as if you're a trusted friend with good emotional intelligence.
Keep responses natural and accessible—avoid jargon or overly clinical language.

CONTEXT (Retrieved from RAG Database):
[Same intake data as Structured Mode, but presented more casually in the prompt]

CURRENT CONFLICT:
Title: "{conflict_title}"
Their Description:
"{partner_a_description}"

---

TASK:
Read their situation and provide supportive, practical advice. Be warm but honest. Help them:

1. Understand what they're really feeling underneath the surface
2. Identify what they actually need from their partner
3. Recognize if they're communicating in a way that might make things worse
4. Figure out how to start a productive conversation
5. Get specific tips they can actually use

Keep it real. No therapy-speak. Just helpful, empathetic guidance.

If you've noticed patterns from their past conflicts, gently point them out.

---

OUTPUT FORMAT (Plain text, conversational):
Write 3-5 paragraphs addressing:
- What you're hearing in their words (validate their feelings)
- What might really be going on emotionally
- What they might need from their partner
- How to approach the conversation
- Any patterns you've noticed (if applicable)

Keep it warm, direct, and actionable. Like talking to a friend over coffee.
```

---

### Prompt 1B: Partner B Individual-Only Analysis - CONVERSATIONAL MODE

```markdown
SYSTEM ROLE:
You are a supportive, empathetic AI assistant helping someone navigate a relationship conflict.
Provide warm, conversational advice as if you're a trusted friend with good emotional intelligence.
Keep responses natural and accessible—avoid jargon or overly clinical language.

CONTEXT (Retrieved from RAG Database):
[Partner B's intake data, presented casually]

CURRENT CONFLICT:
Title: "{conflict_title}"
Their Description:
"{partner_b_description}"

**IMPORTANT**: You're focusing on their perspective only right now. You don't have their
partner's side yet. Help them understand their own feelings and what they need.

---

TASK:
[Same conversational task as Prompt 1A - understand feelings, identify needs, communication patterns, conversation tips]

Keep it real. No therapy-speak. Just helpful, empathetic guidance.

OUTPUT FORMAT (Plain text, conversational):
Write 3-5 paragraphs addressing their feelings, what they need, and how to approach the conversation.
Keep it warm, direct, and actionable.
```

---

### PHASE 2: Joint Analysis for Each Partner

### Prompt 2A: Joint Analysis → Personalized for Partner A - STRUCTURED MODE

```markdown
SYSTEM ROLE:
You are an expert relationship therapist trained in evidence-based therapeutic frameworks:
Gottman Method, Emotionally Focused Therapy (EFT), and Nonviolent Communication (NVC).

This is the SECOND analysis for Partner A. They've already received individual-only guidance.
Now you're providing JOINT-CONTEXT guidance to help Partner A understand their partner's
perspective and bridge the gap between them.

CONTEXT (Retrieved from RAG Database):
Partner A Background: {partner_a_intake_data}
Partner B Background: {partner_b_intake_data}
Recent Conflict History: {conflict_history_summary}

CURRENT CONFLICT:
Title: "{conflict_title}"

Partner A's Description:
"{partner_a_description}"

Partner B's Description:
"{partner_b_description}"

Previous AI Analysis (Individual-Only Guidance already given to Partner A):
{partner_a_individual_only_guidance_summary}

---

TASK:
Now that you have BOTH perspectives, provide personalized guidance for Partner A that:

1. **Perspective Comparison:**
   - Where does Partner A's story align with Partner B's?
   - Where do they diverge?
   - What is Partner B experiencing that Partner A might not realize?

2. **Empathy Building:**
   - Help Partner A step into Partner B's shoes
   - Highlight specific moments where Partner B's needs are visible
   - Translate Partner B's language/behavior into underlying emotions/needs

3. **Bridge-Building Conversation Starters:**
   - Provide NVC-formatted openers that acknowledge BOTH perspectives
   - Examples: "I know I feel X, and I'm hearing that you feel Y. Can we talk about..."

4. **Repair Attempts:**
   - Specific things Partner A can say/do to de-escalate and reconnect
   - Address specific points Partner B raised

5. **Updated Pattern Recognition:**
   - Now that you see both sides, what relationship-level patterns emerge?
   - How does this fit into their larger dynamic?

OUTPUT FORMAT (JSON):
{
  "perspective_analysis": {
    "alignment_points": ["Both feel overwhelmed", "Both value quality time"],
    "divergence_points": ["Partner A feels invisible; Partner B feels criticized"],
    "partner_b_insights": "What Partner B is really experiencing that Partner A might not see..."
  },
  "empathy_opportunities": [
    "When Partner B said '{quote}', they were expressing...",
    "Notice how Partner B might be feeling..."
  ],
  "bridge_building_starters": [
    {
      "observation": "I see that I feel overwhelmed, and you feel criticized...",
      "feeling": "I'm feeling torn because...",
      "need": "I think we both need...",
      "request": "Can we talk about how we can both feel more supported?"
    }
  ],
  "repair_attempts": [
    "Acknowledge Partner B's specific concern about...",
    "Try saying: 'I hear that when I ask for help, it feels like criticism...'"
  ],
  "relationship_patterns": {
    "pattern_detected": "Pursue-withdraw cycle",
    "explanation": "Partner A pursues (requests), Partner B withdraws (feels criticized)",
    "your_role": "As the pursuer, try softening your approach..."
  }
}
```

---

### Prompt 2B: Joint Analysis → Personalized for Partner B - STRUCTURED MODE

```markdown
SYSTEM ROLE:
You are an expert relationship therapist trained in evidence-based therapeutic frameworks:
Gottman Method, Emotionally Focused Therapy (EFT), and Nonviolent Communication (NVC).

This is the SECOND analysis for Partner B. They've already received individual-only guidance.
Now you're providing JOINT-CONTEXT guidance to help Partner B understand their partner's
perspective and bridge the gap between them.

CONTEXT (Retrieved from RAG Database):
Partner A Background: {partner_a_intake_data}
Partner B Background: {partner_b_intake_data}
Recent Conflict History: {conflict_history_summary}

CURRENT CONFLICT:
Title: "{conflict_title}"

Partner A's Description:
"{partner_a_description}"

Partner B's Description:
"{partner_b_description}"

Previous AI Analysis (Individual-Only Guidance already given to Partner B):
{partner_b_individual_only_guidance_summary}

---

TASK:
[Same structure as Prompt 2A, but personalized for Partner B's role in the dynamic]

OUTPUT FORMAT (JSON):
[Same JSON structure as Prompt 2A, but focusing on Partner B's bridge-building role]
```

---

### PHASE 2: Conversational Mode Templates

### Prompt 2A: Joint Analysis → Personalized for Partner A - CONVERSATIONAL MODE

```markdown
SYSTEM ROLE:
You're a supportive friend helping someone understand their partner's perspective in a conflict.

You've already given them initial guidance on their own feelings. Now you have BOTH sides
of the story, and you're helping them see where their partner is coming from.

CONTEXT:
[Both partners' intake data and conflict descriptions]
[Partner A's individual-only guidance summary]

TASK:
Help Partner A understand their partner's perspective now that you've seen both sides.

Gently point out:
- Where their stories align vs. differ
- What their partner might really be feeling/needing
- How their partner might be experiencing Partner A's words/actions
- Specific ways to acknowledge their partner's perspective
- How to have a conversation that bridges both experiences

Keep it warm, empathetic, and practical. Help them see the bigger picture.

OUTPUT FORMAT (Plain text, 4-6 paragraphs):
Show them their partner's perspective, build empathy, and give bridge-building advice.
```

---

### Prompt 2B: Joint Analysis → Personalized for Partner B - CONVERSATIONAL MODE

```markdown
SYSTEM ROLE:
[Same as Prompt 2A, but for Partner B]

TASK:
[Same structure as Prompt 2A, personalized for Partner B's perspective]

OUTPUT FORMAT (Plain text, 4-6 paragraphs):
[Same conversational approach]
```

---

### Prompt 3: Joint Relationship Guidance - STRUCTURED MODE

```markdown
SYSTEM ROLE:
You are an expert relationship therapist facilitating a couples' conflict resolution session.
You've analyzed both partners' perspectives individually. Now synthesize their experiences
to provide RELATIONSHIP-FOCUSED guidance that helps them reconnect and resolve this conflict together.

CONTEXT:
Both Partners' Intake Data:
{partner_a_intake} + {partner_b_intake}

Conflict Title: "{conflict_title}"

Partner A's Description:
"{partner_a_description}"

Partner B's Description:
"{partner_b_description}"

Individual AI Analyses Already Generated:
{partner_a_guidance_summary}
{partner_b_guidance_summary}

Recent Conflict History:
{conflict_history_summary}

---

TASK:
Synthesize both perspectives to guide the couple toward resolution. Focus on the RELATIONSHIP, not individuals.

1. **Shared Understanding:**
   - Areas of agreement (what do they both want?)
   - Areas of divergence (where do their stories differ?)
   - Underlying shared needs (connection, respect, partnership, etc.)

2. **Relationship-Level Patterns:**
   - Identify dyadic patterns (e.g., "pursue-withdraw," "demand-withdraw," "mutual criticism")
   - How does this conflict fit into their larger relationship dynamic?

3. **Structured Dialogue Framework:**
   - Provide step-by-step guidance for a resolution conversation
   - Include: setup (when/where), ground rules, speaker-listener exercise

4. **De-escalation Techniques:**
   - If emotions are high, how can they take a productive timeout?
   - Self-soothing strategies for both

5. **Homework/Exercises:**
   - Actionable exercises to work on together
   - Follow-up conversation prompts

6. **Pattern Insights:**
   {if recurring_theme_detected}
   - This is the {count} time this theme has appeared. Consider...
   {endif}

---

OUTPUT FORMAT (JSON):
{
  "shared_understanding": {
    "agreement_points": ["Both want fair division of labor"],
    "divergence_points": ["Partner A feels invisible; Partner B feels criticized"],
    "shared_needs": ["Equity", "Appreciation", "Teamwork"]
  },
  "relationship_patterns": {
    "current_cycle": "Partner A pursues (requests help), Partner B withdraws (feels criticized)",
    "gottman_insight": "This is a classic demand-withdraw pattern...",
    "how_to_break_it": "Partner A: Make requests gently. Partner B: Stay engaged even when uncomfortable."
  },
  "dialogue_framework": {
    "setup": "Choose a calm time, 20-30 minutes, neutral space...",
    "ground_rules": ["No interrupting", "Use 'I' statements", "Take breaks if needed"],
    "conversation_script": [
      {
        "step": 1,
        "speaker": "Partner A",
        "instruction": "Share your observation and feeling (2 minutes)...",
        "example": "When I see... I feel..."
      },
      {
        "step": 2,
        "speaker": "Partner B",
        "instruction": "Reflect back what you heard (1 minute)...",
        "example": "What I'm hearing is..."
      },
      // Continue for 5-6 steps
    ]
  },
  "de_escalation_techniques": [
    {
      "name": "The Timeout Signal",
      "description": "Agree on a hand signal or phrase for when emotions get too high...",
      "how_to_use": "Take 20 minutes to self-soothe, then reconvene"
    }
  ],
  "homework": [
    {
      "exercise": "Appreciation Exchange",
      "instructions": "Each evening this week, share one thing your partner did that you appreciated..."
    }
  ],
  "pattern_insights": [
    "This is your 4th conflict about household labor in 8 weeks. This suggests a structural issue...",
    "Consider creating a written chore agreement or exploring deeper equity issues..."
  ]
}
```

---

### Prompt 3: Joint Relationship Guidance - CONVERSATIONAL MODE

```markdown
SYSTEM ROLE:
You're helping a couple navigate a conflict. You've heard both sides. Now give them warm,
practical guidance on how to talk this through together and reconnect.

CONTEXT:
[Both descriptions, intake data, individual analyses]

TASK:
Help them understand each other and move forward. Point out:
- What they both actually want (usually more similar than they think)
- Where they're talking past each other
- How to have a productive conversation about this
- Specific things they can do together to resolve this

Keep it real, warm, and actionable. Focus on reconnection, not blame.

If you've noticed this conflict keeps coming up, gently point that out and suggest they might need a bigger conversation or outside help.

OUTPUT FORMAT (Plain text, 4-6 paragraphs):
- What's really happening between them
- What they both need
- How to talk about it (specific script/framework)
- Action steps they can take together
- Any patterns worth noting
```

---

## Prompt Execution Flow Example

### Real-World Example: "Household Chores" Conflict

**Context:**
- Partner A (Sarah): Creates conflict, selects **Structured Mode**
- Partner B (Marcus): Responds blindly, inherits Structured Mode

---

**PROMPT 1 SENT TO LLM:**
```
[Full Structured Mode template for Partner A]

CURRENT CONFLICT:
Title: "Disagreement about household chores"
Partner A's Description:
"I feel like I'm doing all the cleaning and cooking while my partner just
relaxes after work. I've asked for help multiple times but nothing changes.
I'm exhausted and resentful."

[AI processes and returns structured JSON response]
```

**Partner A sees:** Structured guidance with emotion analysis, NVC conversation starters, etc.

---

**PROMPT 2 SENT TO LLM:**
```
[Full Structured Mode template for Partner B]

Partner A's Perspective (NOT SHOWN TO PARTNER B YET):
"I feel like I'm doing all the cleaning and cooking while my partner just
relaxes after work..."

Partner B's Description (submitted blind):
"I do help around the house, but my partner doesn't seem to notice. I handle
all the yard work, car maintenance, and finances. I feel criticized no matter
what I do."

[AI processes with cross-reference analysis]
```

**Partner B sees:**
1. Individual structured guidance
2. THEN Partner A's description is revealed (if Partner A chose "Shared")

---

**PROMPT 3 SENT TO LLM:**
```
[Full Joint Guidance template]

Partner A's Description: [full text]
Partner B's Description: [full text]

[AI synthesizes both perspectives into relationship-focused guidance]
```

**Both partners see:** Joint guidance focusing on shared needs (equity, appreciation) and
dialogue framework for resolution conversation.

---

## Summary: Key Differences Between Modes

| Aspect | Structured Mode | Conversational Mode |
|--------|----------------|---------------------|
| Tone | Clinical, educational | Warm, friend-like |
| Frameworks | Explicit (Gottman, EFT, NVC) | Implicit (principles applied but not named) |
| Output Format | Structured JSON → formatted UI | Natural paragraphs |
| Terminology | "Four Horsemen," "primary emotions" | Plain language, no jargon |
| Length | Longer, more detailed | Shorter, more digestible |
| Best For | Couples wanting to learn therapy skills | Couples wanting quick, accessible advice |

## Constraints & Assumptions

### Constraints

**Technical:**
- MVP is web-only (no native mobile apps)
- SurrealDB learning curve for team (new technology)
- **LLM costs (conversational model)**:
  - Per intake interview: ~$0.30-0.60 (10-15 messages × ~$0.03-0.04 each)
  - Per conflict: ~$1.00-3.00 (variable based on conversation length)
    - Exploration chat (Partner A): ~10-20 messages × ~$0.02-0.05 each = $0.20-1.00
    - Exploration chat (Partner B): ~10-20 messages × ~$0.02-0.05 each = $0.20-1.00
    - Individual guidance synthesis (2 prompts): ~$0.10-0.20
    - Joint-context guidance (2 prompts): ~$0.10-0.20
    - Relationship guidance (initial + refinement): ~$0.10-0.30
    - Shared chat refinement (variable): ~$0.10-0.50
- Internet connectivity required (no offline mode)
- Real-time streaming for chat responses required

**Business:**
- Bootstrap/self-funded (no external investment initially)
- Solo founder or small team (1-3 people)
- Launch timeline: 3-4 months for MVP

**Regulatory:**
- Not a licensed therapy service (disclaimer required)
- HIPAA compliance NOT required (not a covered entity)
- GDPR/CCPA compliance required if serving EU/CA users
- Must include crisis resources (suicide prevention, domestic violence hotlines)

**User Experience:**
- Assumes both partners willing to participate (cannot force engagement)
- Assumes basic digital literacy (chat interfaces, reading AI-generated text)
- English-language only for MVP

### Assumptions

**User Behavior:**
- Couples will engage asynchronously (within 24-48 hours)
- Users prefer privacy (won't share login credentials with partner)
- Intake interviews typically involve 10-15 messages
- Exploration conversations typically involve 10-20 messages per partner
- Users will engage with AI guidance through continued conversation
- Shared relationship chat will typically involve 5-15 messages

**Market:**
- Target market is tech-savvy millennials/Gen Z couples (ages 25-45)
- Users trust AI for sensitive relationship advice
- Willingness to pay $10-30/month for subscription (post-MVP monetization)

**Technical:**
- SurrealDB can handle vector embeddings for RAG effectively
- Anthropic Claude quality sufficient for empathetic guidance
- Prompt engineering can prevent hallucinations and harmful advice
- RAG context window (100k+ tokens) supports rich personalization

## Out of Scope (MVP)

The following features are explicitly **NOT** included in the initial MVP but may be considered for future iterations:

### Features Not in V1
- ❌ Mobile native apps (iOS/Android)
- ❌ Video/audio conflict descriptions (text only)
- ❌ Real-time chat between partners within app
- ❌ Live video therapy sessions with human therapists
- ❌ Conflict resolution "status" tracking (resolved/unresolved)
- ❌ Follow-up check-ins on past conflicts
- ❌ Gamification (badges, streaks, relationship score)
- ❌ Integration with calendar/reminder apps
- ❌ Therapist referral network
- ❌ Multi-language support
- ❌ Group therapy (3+ people)
- ❌ Anonymous mode (both partners must have accounts)
- ❌ Export conflicts to PDF/sharing with external therapist
- ❌ In-app payments/subscriptions (free during MVP testing)

### Technical Capabilities Not in V1
- ❌ Voice-to-text conflict input
- ❌ Advanced analytics dashboard (relationship health score)
- ❌ A/B testing different prompt templates
- ❌ Multiple LLM provider switching (Anthropic only for MVP)
- ❌ Offline mode with sync
- ❌ End-to-end encryption (encryption at rest only)

### Integrations Not in V1
- ❌ Third-party apps (Google Calendar, Slack, etc.)
- ❌ Wearables (tracking stress levels during conflicts)
- ❌ Social media sharing

## Dependencies

### External Dependencies

**Critical Path:**
1. **OpenAI API Access**
   - API key procurement
   - Model: GPT-5.2 ($1.75/M input, $14/M output)
   - Context: 400K tokens, 128K max output
   - Embeddings: text-embedding-3-small for RAG
   - Fallback: Anthropic Claude if OpenAI unavailable

2. **SurrealDB Setup**
   - Team training on SurrealQL (1-2 weeks learning curve)
   - Cloud hosting decision (SurrealDB Cloud vs. self-hosted)
   - Schema for storing OpenAI embeddings

3. **Email Service Provider**
   - SendGrid, AWS SES, or Postmark for transactional emails
   - Invitation emails, password resets, notifications

4. **Domain & Hosting**
   - Domain registration (e.g., couplestherapy.ai)
   - SSL certificate (Let's Encrypt)
   - Cloud hosting (Vercel for frontend, Railway/Render for backend)

### Internal Dependencies

**Team Skills Required:**
- React/TypeScript frontend development
- Node.js/Express backend development
- SurrealDB database design & querying
- Prompt engineering for LLMs
- UX design for sensitive/emotional interfaces
- Basic DevOps (CI/CD, monitoring)

**Legal/Compliance:**
- Terms of Service (consultant: $500-1000)
- Privacy Policy (GDPR/CCPA compliant)
- Disclaimer: "Not a substitute for professional therapy"
- Crisis resource list (National Suicide Prevention Lifeline, RAINN, etc.)

### Third-Party Services

| Service | Purpose | Estimated Cost |
|---------|---------|----------------|
| OpenAI API | GPT-4 chat + embeddings | $1000-3000/month (usage-based) |
| SurrealDB Cloud | Database + embedding storage | $25-100/month |
| Vercel | Frontend hosting | $0-20/month (Hobby → Pro) |
| Railway/Render | Backend hosting + WebSocket support | $10-50/month |
| SendGrid | Email delivery | $0-15/month (up to 40k emails) |
| Sentry | Error tracking | $0 (Developer tier) |

**Total Estimated Monthly Infrastructure Cost (MVP)**: $1035-3185/month

Note: Conversational model costs ~$1-3 per conflict. OpenAI embeddings add minimal cost (~$0.0001/1K tokens).
Consider implementing conversation limits or tiered pricing for cost control.

## Risk Assessment

### High-Risk Areas

**1. AI Generates Harmful Advice (Critical)**
- **Risk**: AI suggests victim-blaming, abusive tactics, or dangerous actions
- **Mitigation**:
  - Content filtering layer before displaying to users
  - Regular prompt audits and red-teaming
  - "Report this advice" button for users
  - Include crisis resources on every page

**2. User Privacy Breach (High)**
- **Risk**: Conflict descriptions leaked or accessed by unauthorized parties
- **Mitigation**:
  - Encryption at rest (AES-256)
  - Strict access controls (users can only see own + paired partner's shared conflicts)
  - Security audit before launch
  - Penetration testing

**3. Low Partner B Response Rate (High)**
- **Risk**: Partner A creates conflicts but Partner B never responds → poor user experience
- **Mitigation**:
  - Email notifications (future feature)
  - Design individual guidance to be valuable even if Partner B doesn't respond
  - Encourage both partners to commit during onboarding

**4. SurrealDB Adoption Challenges (Medium)**
- **Risk**: Team struggles with new database paradigm, delaying development
- **Mitigation**:
  - Allocate 2 weeks for SurrealDB training/prototyping
  - Maintain option to migrate to PostgreSQL + pgvector if blockers arise
  - Leverage SurrealDB community/documentation

**5. LLM Cost Overruns (Medium)**
- **Risk**: Higher-than-expected usage drives API costs beyond budget
- **Mitigation**:
  - Set hard monthly spend limits ($1500 cap)
  - Monitor per-user costs
  - Optimize prompts to reduce token usage
  - Consider caching similar conflicts (future optimization)

## Implementation Phases

### Phase 0: Discovery & Design (Weeks 1-2)
- Finalize PRD (this document)
- Create detailed wireframes for all screens
- Design prompt templates for 3 therapeutic frameworks
- Set up development environment

### Phase 1: Core Infrastructure (Weeks 3-4)
- Set up SurrealDB instance
- Implement user authentication (registration, login, password reset)
- Build relationship pairing system
- Create intake survey UI + backend

### Phase 2: Conflict Creation & AI Integration (Weeks 5-7)
- Build conflict creation form
- Implement privacy controls
- Integrate Anthropic Claude API
- Develop 3 AI prompt templates (individual A, individual B, joint)
- Build AI response display UI

### Phase 3: Pattern Recognition & History (Weeks 8-9)
- Implement RAG retrieval from SurrealDB
- Build conflict history view
- Develop pattern detection logic
- Create dashboard with insights

### Phase 4: Testing & Refinement (Weeks 10-11)
- User acceptance testing with 5-10 beta couples
- Prompt refinement based on feedback
- Security audit & penetration testing
- Performance optimization

### Phase 5: Launch Preparation (Week 12)
- Write Terms of Service & Privacy Policy
- Set up error tracking (Sentry)
- Create crisis resource page
- Deploy to production
- Soft launch to limited users (50 couples)

### Phase 6: Post-Launch Iteration (Ongoing)
- Monitor usage metrics
- Collect user feedback
- A/B test prompt variations
- Plan V2 features based on data

## Next Steps

1. **Get PRD Approval**: Review this document with stakeholders/co-founders
2. **Create Epic**: Run `/pm:prd-parse couples-therapy-assistant` to generate implementation tasks
3. **Design Phase**: Create high-fidelity mockups for all user journeys
4. **Technical Spike**: Prototype SurrealDB RAG integration (1 week)
5. **Prompt Engineering**: Draft and test initial AI prompt templates
6. **Legal Setup**: Engage lawyer for Terms of Service review

---

## Appendix A: Therapeutic Framework Details

### Gottman Method - Four Horsemen & Antidotes
| Horseman | Description | Antidote |
|----------|-------------|----------|
| Criticism | Attacking partner's character | Gentle start-up using "I" statements |
| Contempt | Superiority, mockery, sarcasm | Build culture of appreciation |
| Defensiveness | Victimhood, making excuses | Take responsibility |
| Stonewalling | Withdrawing, silent treatment | Self-soothing, take breaks |

### EFT - Primary vs. Secondary Emotions
- **Secondary Emotions** (surface): Anger, frustration, annoyance
- **Primary Emotions** (underlying): Fear, hurt, shame, loneliness
- **Goal**: Help partners express primary emotions to create vulnerability and connection

### NVC - Four Components
1. **Observation**: Describe situation without judgment ("When I see/hear...")
2. **Feeling**: Express emotion ("I feel...")
3. **Need**: Identify underlying need ("...because I need...")
4. **Request**: Make specific, actionable request ("Would you be willing to...")

## Appendix B: Sample AI Guidance Output

**Conflict Title**: "Disagreement about household chores"

**Partner A's Description**: "I feel like I'm doing all the cleaning and cooking while my partner just relaxes after work. I've asked for help multiple times but nothing changes."

**AI Guidance for Partner A** (Individual):

---

### Emotions I'm Noticing:
- **Primary emotions**: Feeling unseen, unappreciated, possibly lonely in the responsibility
- **Secondary emotions**: Frustration, resentment building up

### Your Underlying Needs (NVC):
- **Equity**: You need a fair distribution of household labor
- **Recognition**: You need your efforts to be acknowledged
- **Partnership**: You need to feel you're in this together

### Communication Pattern Alert (Gottman):
I notice potential **criticism** emerging in your language ("my partner just relaxes"). This is understandable given your frustration, but criticism can trigger defensiveness. Let's reframe this.

### Conversation Starters (NVC Format):
1. "When I come home and see dishes still in the sink after I've asked for help *[Observation]*, I feel overwhelmed and alone *[Feeling]* because I need to feel like we're sharing responsibilities equally *[Need]*. Would you be willing to talk about creating a chore schedule together? *[Request]*"

2. "I've noticed I've been feeling resentful lately *[Feeling]*, and I realize it's because I need more support with household tasks *[Need]*. Can we set aside 20 minutes this weekend to discuss how we can divide things more evenly? *[Request]*"

### Techniques to Try:
- **Softened Start-Up**: Begin the conversation gently, not when emotions are high
- **Specific Requests**: Instead of "help more," try "Would you handle dinner on Tuesdays and Thursdays?"
- **Appreciation**: Acknowledge what your partner *does* contribute before making requests

---

This is one of 3 conflicts you've created mentioning household responsibilities in the past 2 months. This pattern suggests household labor equity is a core issue worth deeper exploration.

---

## Appendix C: Crisis Resources

**Every page footer must include:**

> 🆘 **In Crisis?**
> If you're experiencing thoughts of self-harm or are in an abusive relationship:
> - **National Suicide Prevention Lifeline**: 988 (US)
> - **National Domestic Violence Hotline**: 1-800-799-7233
> - **Crisis Text Line**: Text HOME to 741741

This app is not a substitute for professional mental health care. If you're in crisis, please contact emergency services or a licensed therapist immediately.
