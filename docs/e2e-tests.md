# E2E Testing with Puppeteer MCP

## Overview

This document outlines end-to-end testing procedures for the Couples Therapy Assistant using Puppeteer MCP tools. These tests cover critical user flows including authentication, intake surveys, conflict workflows, and guidance delivery.

## Prerequisites

### Environment Setup

1. **Backend Server**: Running on `http://localhost:3001`
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend Server**: Running on `http://localhost:5173`
   ```bash
   cd frontend
   npm run dev
   ```

3. **Database**: SurrealDB running on `ws://localhost:8000`

4. **Puppeteer MCP**: Available as part of Claude Code environment

### Test Data

Create test users with the following credentials:

- **Partner A**:
  - Email: `partner.a.test@example.com`
  - Password: `TestPass123!`

- **Partner B**:
  - Email: `partner.b.test@example.com`
  - Password: `TestPass123!`

## Test Scenarios

### Test 1: Authentication Flow

#### 1.1 User Registration

**Objective**: Verify new users can create accounts successfully.

**Steps**:

1. Navigate to signup page:
   ```
   mcp__puppeteer__puppeteer_navigate
   url: http://localhost:5173/signup
   ```

2. Fill registration form:
   ```
   mcp__puppeteer__puppeteer_fill
   selector: input[name="email"]
   value: partner.a.test@example.com

   mcp__puppeteer__puppeteer_fill
   selector: input[name="password"]
   value: TestPass123!

   mcp__puppeteer__puppeteer_fill
   selector: input[name="confirmPassword"]
   value: TestPass123!

   mcp__puppeteer__puppeteer_fill
   selector: input[name="displayName"]
   value: Partner A
   ```

3. Submit form:
   ```
   mcp__puppeteer__puppeteer_click
   selector: button[type="submit"]
   element: Submit button
   ```

4. Verify success:
   ```
   mcp__puppeteer__puppeteer_screenshot
   name: registration-success
   ```

**Expected Results**:
- User redirected to dashboard or intake page
- Success message displayed
- Firebase Authentication creates user account

#### 1.2 User Login

**Objective**: Verify existing users can log in successfully.

**Steps**:

1. Navigate to login page:
   ```
   mcp__puppeteer__puppeteer_navigate
   url: http://localhost:5173/login
   ```

2. Fill login form:
   ```
   mcp__puppeteer__puppeteer_fill
   selector: input[name="email"]
   value: partner.a.test@example.com

   mcp__puppeteer__puppeteer_fill
   selector: input[name="password"]
   value: TestPass123!
   ```

3. Submit form:
   ```
   mcp__puppeteer__puppeteer_click
   selector: button[type="submit"]
   element: Login button
   ```

4. Verify login:
   ```
   mcp__puppeteer__puppeteer_screenshot
   name: login-success
   ```

**Expected Results**:
- User redirected to dashboard
- User session established
- Auth state persists on page reload

### Test 2: Intake Survey Flow

#### 2.1 Complete Intake Survey

**Objective**: Verify users can complete the initial intake survey.

**Steps**:

1. Navigate to intake page (after login):
   ```
   mcp__puppeteer__puppeteer_navigate
   url: http://localhost:5173/intake
   ```

2. Fill relationship basics:
   ```
   mcp__puppeteer__puppeteer_fill
   selector: input[name="relationshipLength"]
   value: 2 years

   mcp__puppeteer__puppeteer_fill
   selector: input[name="partnerName"]
   value: Partner B

   mcp__puppeteer__puppeteer_fill
   selector: input[name="partnerEmail"]
   value: partner.b.test@example.com
   ```

3. Select relationship type:
   ```
   mcp__puppeteer__puppeteer_select
   selector: select[name="relationshipType"]
   value: married
   ```

4. Fill main concerns:
   ```
   mcp__puppeteer__puppeteer_fill
   selector: textarea[name="mainConcerns"]
   value: Communication issues and conflict resolution
   ```

5. Fill therapy goals:
   ```
   mcp__puppeteer__puppeteer_fill
   selector: textarea[name="goals"]
   value: Improve communication and rebuild trust
   ```

6. Submit survey:
   ```
   mcp__puppeteer__puppeteer_click
   selector: button[type="submit"]
   element: Submit intake button
   ```

7. Capture completion:
   ```
   mcp__puppeteer__puppeteer_screenshot
   name: intake-completed
   ```

**Expected Results**:
- Intake data saved to database
- Partner invitation email sent (if configured)
- User redirected to dashboard
- Intake status marked as complete

### Test 3: Conflict Workflow

#### 3.1 Create New Conflict

**Objective**: Verify Partner A can create a new conflict for discussion.

**Steps**:

1. Navigate to conflicts page:
   ```
   mcp__puppeteer__puppeteer_navigate
   url: http://localhost:5173/conflicts
   ```

2. Click create conflict button:
   ```
   mcp__puppeteer__puppeteer_click
   selector: button[data-action="create-conflict"]
   element: Create conflict button
   ```

3. Fill conflict details:
   ```
   mcp__puppeteer__puppeteer_fill
   selector: input[name="conflictTitle"]
   value: Household Chores Distribution

   mcp__puppeteer__puppeteer_fill
   selector: textarea[name="conflictDescription"]
   value: We need to discuss how to divide household responsibilities more fairly
   ```

4. Submit conflict:
   ```
   mcp__puppeteer__puppeteer_click
   selector: button[type="submit"]
   element: Submit conflict button
   ```

5. Verify creation:
   ```
   mcp__puppeteer__puppeteer_screenshot
   name: conflict-created
   ```

**Expected Results**:
- Conflict created in database
- Partner B notified (if online via WebSocket)
- Conflict appears in Partner A's list
- Status shows as "waiting for partner"

#### 3.2 Partner Exploration Phase

**Objective**: Verify Partner A can complete individual exploration.

**Steps**:

1. Navigate to exploration page:
   ```
   mcp__puppeteer__puppeteer_navigate
   url: http://localhost:5173/conflicts/[conflict-id]/explore
   ```

2. Start conversation with AI:
   ```
   mcp__puppeteer__puppeteer_fill
   selector: textarea[name="message"]
   value: I feel overwhelmed with household chores and need help

   mcp__puppeteer__puppeteer_click
   selector: button[data-action="send-message"]
   element: Send message button
   ```

3. Wait for AI response (check loading state):
   ```
   mcp__puppeteer__puppeteer_evaluate
   script: () => {
     const loader = document.querySelector('[data-state="loading"]');
     return loader ? 'loading' : 'ready';
   }
   ```

4. Continue conversation:
   ```
   mcp__puppeteer__puppeteer_fill
   selector: textarea[name="message"]
   value: I've been doing most of the cleaning and cooking while working full time

   mcp__puppeteer__puppeteer_click
   selector: button[data-action="send-message"]
   element: Send message button
   ```

5. Complete exploration:
   ```
   mcp__puppeteer__puppeteer_click
   selector: button[data-action="complete-exploration"]
   element: Complete exploration button
   ```

6. Capture guidance:
   ```
   mcp__puppeteer__puppeteer_screenshot
   name: individual-guidance
   ```

**Expected Results**:
- AI responses streamed in real-time
- Conversation saved to database
- Individual guidance synthesized
- Status updated to "exploration complete"

### Test 4: Joint Context Guidance

#### 4.1 View Combined Guidance

**Objective**: Verify both partners can view joint-context guidance after both complete exploration.

**Prerequisites**: Both Partner A and Partner B have completed individual exploration.

**Steps**:

1. Login as Partner B:
   ```
   mcp__puppeteer__puppeteer_navigate
   url: http://localhost:5173/login

   mcp__puppeteer__puppeteer_fill
   selector: input[name="email"]
   value: partner.b.test@example.com

   mcp__puppeteer__puppeteer_fill
   selector: input[name="password"]
   value: TestPass123!

   mcp__puppeteer__puppeteer_click
   selector: button[type="submit"]
   element: Login button
   ```

2. Navigate to conflict:
   ```
   mcp__puppeteer__puppeteer_navigate
   url: http://localhost:5173/conflicts/[conflict-id]
   ```

3. View joint guidance:
   ```
   mcp__puppeteer__puppeteer_click
   selector: button[data-action="view-guidance"]
   element: View guidance button
   ```

4. Capture guidance screen:
   ```
   mcp__puppeteer__puppeteer_screenshot
   name: joint-guidance-partner-b
   ```

**Expected Results**:
- Joint-context guidance displayed
- Shows insights from both partners
- Highlights areas of alignment and divergence
- Suggests communication approaches

### Test 5: Relationship Chat

#### 5.1 Real-time Chat Between Partners

**Objective**: Verify partners can engage in facilitated chat with AI moderation.

**Steps**:

1. Partner A sends message:
   ```
   mcp__puppeteer__puppeteer_navigate
   url: http://localhost:5173/conflicts/[conflict-id]/chat

   mcp__puppeteer__puppeteer_fill
   selector: textarea[name="chatMessage"]
   value: I appreciate you joining this conversation. Can we talk about the chores?

   mcp__puppeteer__puppeteer_click
   selector: button[data-action="send-chat"]
   element: Send chat button
   ```

2. Verify message appears:
   ```
   mcp__puppeteer__puppeteer_screenshot
   name: chat-message-sent
   ```

3. Check WebSocket delivery (in second browser/session as Partner B):
   ```
   mcp__puppeteer__puppeteer_evaluate
   script: () => {
     const messages = document.querySelectorAll('[data-message-sender]');
     return Array.from(messages).map(m => ({
       sender: m.dataset.messageSender,
       content: m.textContent
     }));
   }
   ```

4. Partner B responds:
   ```
   mcp__puppeteer__puppeteer_fill
   selector: textarea[name="chatMessage"]
   value: Yes, I'm happy to discuss this. I know it's been a challenge

   mcp__puppeteer__puppeteer_click
   selector: button[data-action="send-chat"]
   element: Send chat button
   ```

5. AI facilitates:
   ```
   mcp__puppeteer__puppeteer_screenshot
   name: ai-facilitation
   ```

**Expected Results**:
- Messages delivered in real-time via WebSocket
- AI provides facilitation when appropriate
- Message history persisted
- Both partners see synchronized chat

## Advanced Test Scenarios

### Test 6: Error Handling

#### 6.1 Network Error Recovery

**Steps**:

1. Disconnect network during exploration:
   ```
   mcp__puppeteer__puppeteer_evaluate
   script: () => {
     // Simulate offline
     window.dispatchEvent(new Event('offline'));
   }
   ```

2. Attempt to send message:
   ```
   mcp__puppeteer__puppeteer_fill
   selector: textarea[name="message"]
   value: Test message during offline

   mcp__puppeteer__puppeteer_click
   selector: button[data-action="send-message"]
   element: Send message button
   ```

3. Verify error handling:
   ```
   mcp__puppeteer__puppeteer_screenshot
   name: offline-error-handling
   ```

**Expected Results**:
- Error message displayed to user
- Message queued for retry
- Graceful degradation

#### 6.2 Session Timeout

**Steps**:

1. Clear session storage:
   ```
   mcp__puppeteer__puppeteer_evaluate
   script: () => {
     sessionStorage.clear();
     localStorage.clear();
   }
   ```

2. Attempt authenticated action:
   ```
   mcp__puppeteer__puppeteer_navigate
   url: http://localhost:5173/conflicts
   ```

3. Verify redirect:
   ```
   mcp__puppeteer__puppeteer_screenshot
   name: session-timeout-redirect
   ```

**Expected Results**:
- User redirected to login
- Return URL preserved
- Session cleanly terminated

### Test 7: Performance Validation

#### 7.1 AI Response Streaming

**Objective**: Verify AI responses stream efficiently.

**Steps**:

1. Start timer and send message:
   ```
   mcp__puppeteer__puppeteer_evaluate
   script: () => {
     window.startTime = Date.now();
   }

   mcp__puppeteer__puppeteer_fill
   selector: textarea[name="message"]
   value: Tell me about effective communication strategies

   mcp__puppeteer__puppeteer_click
   selector: button[data-action="send-message"]
   element: Send message button
   ```

2. Measure time to first chunk:
   ```
   mcp__puppeteer__puppeteer_evaluate
   script: () => {
     const firstChunk = document.querySelector('[data-streaming="true"]');
     if (firstChunk) {
       return Date.now() - window.startTime;
     }
     return null;
   }
   ```

**Expected Results**:
- First chunk within 2 seconds
- Smooth streaming
- No UI blocking

## Running Tests Manually

### Setup

1. Start backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open Claude Code with Puppeteer MCP enabled

### Execution

For each test scenario:

1. Copy the Puppeteer MCP commands from the test steps
2. Execute them in sequence through Claude Code
3. Capture screenshots at key points
4. Verify expected results
5. Document any failures or unexpected behavior

### Test Results Documentation

Create a test run report with:

- Date and time of execution
- Environment details (Node version, browser version)
- Test scenarios executed
- Pass/fail status for each test
- Screenshots of key steps
- Any bugs or issues discovered

## Automated Test Scripts

While this document focuses on manual testing with Puppeteer MCP, automated test scripts can be created using Playwright or Puppeteer. Example structure:

```javascript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can register', async ({ page }) => {
  await page.goto('http://localhost:5173/signup');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'TestPass123!');
  await page.fill('input[name="confirmPassword"]', 'TestPass123!');
  await page.fill('input[name="displayName"]', 'Test User');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/dashboard|intake/);
});
```

## Troubleshooting

### Common Issues

1. **Frontend not starting**:
   - Check Node.js version (requires 20.19+ or 22.12+)
   - Run `npm install` in frontend directory
   - Check for port conflicts on 5173

2. **Backend connection errors**:
   - Verify SurrealDB is running on ws://localhost:8000
   - Check Redis connection if using queue features
   - Verify .env file has correct configuration

3. **WebSocket connection failures**:
   - Check CORS settings in backend
   - Verify Socket.IO client version matches server
   - Check browser console for errors

4. **AI responses not working**:
   - Verify OPENAI_API_KEY or ANTHROPIC_API_KEY in .env
   - Check API rate limits
   - Verify prompt configuration

## Test Coverage

### Current Coverage

- ✅ Authentication (signup, login)
- ✅ Intake survey submission
- ✅ Conflict creation
- ✅ Individual exploration
- ✅ Individual guidance synthesis
- ✅ Joint-context guidance
- ✅ Real-time chat
- ⚠️ Error handling (partial)
- ⚠️ Performance validation (partial)

### Gaps

- Partner invitation flow
- Email notifications
- Conflict resolution completion
- Progress tracking analytics
- Mobile responsive testing
- Cross-browser compatibility
- Accessibility testing

## Future Enhancements

1. **Automated Test Suite**: Migrate manual tests to Playwright test suite
2. **Visual Regression Testing**: Add screenshot comparison
3. **Load Testing**: Test system under concurrent users
4. **Security Testing**: Penetration testing for auth flows
5. **Integration Testing**: API endpoint testing
6. **Unit Testing**: Component-level testing for React components

## References

- [Puppeteer MCP Documentation](https://github.com/modelcontextprotocol/servers)
- [Playwright Testing Documentation](https://playwright.dev)
- [Application Architecture](../README.md)
