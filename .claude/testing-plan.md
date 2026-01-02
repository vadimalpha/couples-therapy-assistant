# Testing Plan - Couples Therapy Assistant

## Production URLs

- **Frontend**: https://frontend-five-self-98.vercel.app/
- **Backend API**: https://weui-production.up.railway.app
- **WebSocket**: wss://weui-production.up.railway.app

## Test Users

| User | Email | Password | Role |
|------|-------|----------|------|
| Partner A | claude.test.partnera@gmail.com | ClaudeTest123! | Primary conflict creator |
| Partner B | claude.test.partnerb@gmail.com | ClaudeTest123! | Partner who joins conflicts |

## Testing Rules

1. **ONLY use Puppeteer MCP** for UI testing - do NOT use Playwright MCP
2. **Always use the Vercel frontend URL** - do not use localhost or Railway frontend
3. **Reuse existing conflicts** - do not create new conflicts unless specifically testing conflict creation
4. **Check for existing test data first** before creating new records

## Test Scenarios

### 1. Partner B Conflict Visibility
- Login as Partner A, note existing conflicts
- Login as Partner B, verify Partner A's conflicts appear in dashboard
- Verify conflict status badges show correctly for each role

### 2. Guidance Links (Individual vs Joint)
- Login as user with completed conflict (both_finalized status)
- Verify "My Guidance" button appears -> navigates to `/conflicts/:id/guidance`
- Verify "Partner Chat" button appears -> navigates to `/conflicts/:id/shared`

### 3. Exploration Chat
- Use existing in-progress conflict
- Test sending messages
- Verify AI streaming responses work

### 4. Guidance Refinement
- Use existing conflict with `joint_context_a` or `joint_context_b` session
- Send message in guidance refinement chat
- Verify AI responds with guidance-specific content

### 5. Partner Chat (Relationship Shared)
- Use existing `both_finalized` conflict
- Navigate to Partner Chat
- Both partners should be able to send messages
- AI should respond to relationship context

## Existing Test Data Checklist

Before creating new data, check:
- [ ] Existing conflicts in Partner A's dashboard
- [ ] Conflict statuses available (partner_a_chatting, pending_partner_b, partner_b_chatting, both_finalized)
- [ ] Existing sessions for guidance testing

## Puppeteer Testing Workflow

```javascript
// Standard login flow
1. Navigate to https://frontend-five-self-98.vercel.app/
2. Click login/sign-in button
3. Fill email and password
4. Submit and wait for dashboard

// Taking screenshots for verification
- Use descriptive names: "dashboard-partner-a", "conflict-detail", etc.
- Width: 1200, Height: 800 for consistency
```

## Known Issues to Verify

1. Partner B can see Partner A's new conflicts
2. Separate buttons for "My Guidance" and "Partner Chat" on completed conflicts
3. Guidance refinement AI responds correctly
4. Partner Chat navigation works
