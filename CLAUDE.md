# Couples Therapy Assistant - Claude Instructions

## Testing

**ALWAYS follow the testing plan**: `.claude/testing-plan.md`

Key rules:
- Use Puppeteer for all UI testing
- Frontend URL: https://frontend-five-self-98.vercel.app/
- **Reuse existing conflicts** - do not create new ones unless testing conflict creation
- Use test accounts defined below

### Test Users (WORKING ACCOUNTS)
| User | Email | Password |
|------|-------|----------|
| Partner A | claude.test.partnera@gmail.com | ClaudeTest123! |
| Partner B | claude.test.partnerb@gmail.com | ClaudeTest123! |

### Relationship
- ID: `relationship:pm1oelumgl2zmlaisskv`
- Status: Active
- Partners: Partner A ↔ Partner B

### Test Conflicts

#### Conflict 1: Communication about household responsibilities
- **ID**: `conflict:eymrpkwt8wynojuquvp1`
- **Status**: `both_finalized`
- **Created**: Jan 2, 2026

**URLs**:
- Dashboard: https://frontend-five-self-98.vercel.app/dashboard
- Partner A Exploration: https://frontend-five-self-98.vercel.app/conflicts/conflict:eymrpkwt8wynojuquvp1/explore
- Partner A Guidance: https://frontend-five-self-98.vercel.app/conflicts/conflict:eymrpkwt8wynojuquvp1/guidance
- Partner B Guidance: https://frontend-five-self-98.vercel.app/conflicts/conflict:eymrpkwt8wynojuquvp1/guidance
- Partner Chat: https://frontend-five-self-98.vercel.app/conflicts/conflict:eymrpkwt8wynojuquvp1/shared

## Architecture

- **Frontend**: React + Vite, deployed on Vercel
- **Backend**: Express + TypeScript, deployed on Railway
- **Database**: SurrealDB
- **Auth**: Firebase Authentication
- **AI**: OpenAI GPT-5.2 (valid model - do not change to gpt-4o)

## Key Flows

1. **Conflict Creation**: Partner A creates conflict -> explores individually -> finalizes
2. **Partner B Join**: Partner B sees conflict -> joins -> explores individually -> finalizes
3. **Guidance**: Both partners get individual guidance, can refine via chat
4. **Partner Chat**: After both finalize, shared relationship chat available

## Session Types

- `intake` - Initial user onboarding
- `individual_a` / `individual_b` - Exploration chat
- `joint_context_a` / `joint_context_b` - Guidance refinement
- `relationship_shared` - Partner chat together

## Conflict Status Flow

```
partner_a_chatting -> pending_partner_b -> partner_b_chatting -> both_finalized
```
