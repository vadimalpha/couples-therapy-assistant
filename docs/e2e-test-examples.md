# E2E Test Examples with Puppeteer MCP

This document provides practical examples of running E2E tests using Puppeteer MCP tools in Claude Code.

## Test Execution Guide

### Prerequisites Check

Before running tests, verify the application is running:

```bash
# Check backend
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"...","dbConnected":true,"version":"1.0.0"}
```

## Example 1: Authentication Test

### Step 1: Navigate to Signup Page

Request to Claude Code:
```
Navigate to the signup page at http://localhost:5173/signup using Puppeteer
```

Claude will execute:
```javascript
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:5173/signup"
})
```

### Step 2: Fill Registration Form

Request to Claude Code:
```
Fill the signup form with:
- Email: test.partner.a@example.com
- Password: SecurePass123!
- Confirm Password: SecurePass123!
- Display Name: Test Partner A
```

Claude will execute:
```javascript
mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="email"]',
  value: "test.partner.a@example.com"
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="password"]',
  value: "SecurePass123!"
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="confirmPassword"]',
  value: "SecurePass123!"
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="displayName"]',
  value: "Test Partner A"
})
```

### Step 3: Submit and Capture

Request to Claude Code:
```
Submit the signup form and take a screenshot
```

Claude will execute:
```javascript
mcp__puppeteer__puppeteer_click({
  selector: 'button[type="submit"]',
  element: "Submit signup form button"
})

// Wait a moment for redirect
setTimeout(() => {
  mcp__puppeteer__puppeteer_screenshot({
    name: "signup-success",
    width: 1280,
    height: 720
  })
}, 2000)
```

### Step 4: Verify Registration

Request to Claude Code:
```
Check what page we're on after signup
```

Claude will execute:
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `() => {
    return {
      url: window.location.href,
      title: document.title,
      hasUser: !!document.querySelector('[data-user-email]')
    };
  }`
})
```

## Example 2: Intake Survey Test

### Setup: Login First

Request to Claude Code:
```
Login as test.partner.a@example.com with password SecurePass123!
```

### Navigate to Intake

Request to Claude Code:
```
Navigate to the intake page at http://localhost:5173/intake
```

### Fill Intake Survey

Request to Claude Code:
```
Fill the intake survey with:
- Relationship length: 3 years
- Partner name: Test Partner B
- Partner email: test.partner.b@example.com
- Relationship type: select "committed" from dropdown
- Main concerns: We struggle with communication during conflicts
- Therapy goals: Learn to communicate better and resolve disagreements constructively
```

Claude will execute:
```javascript
mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="relationshipLength"]',
  value: "3 years"
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="partnerName"]',
  value: "Test Partner B"
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="partnerEmail"]',
  value: "test.partner.b@example.com"
})

mcp__puppeteer__puppeteer_select({
  selector: 'select[name="relationshipType"]',
  value: "committed"
})

mcp__puppeteer__puppeteer_fill({
  selector: 'textarea[name="mainConcerns"]',
  value: "We struggle with communication during conflicts"
})

mcp__puppeteer__puppeteer_fill({
  selector: 'textarea[name="goals"]',
  value: "Learn to communicate better and resolve disagreements constructively"
})
```

### Submit and Verify

Request to Claude Code:
```
Submit the intake form and capture the result
```

## Example 3: Conflict Creation Test

### Navigate to Conflict Creation

Request to Claude Code:
```
Go to the new conflict page at http://localhost:5173/conflicts/new
```

### Create Conflict

Request to Claude Code:
```
Create a new conflict with:
- Title: Financial Planning Disagreement
- Description: We need to discuss our approach to saving money and making large purchases
```

Claude will execute:
```javascript
mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="title"]',
  value: "Financial Planning Disagreement"
})

mcp__puppeteer__puppeteer_fill({
  selector: 'textarea[name="description"]',
  value: "We need to discuss our approach to saving money and making large purchases"
})

mcp__puppeteer__puppeteer_click({
  selector: 'button[type="submit"]',
  element: "Create conflict button"
})

// Wait for creation
setTimeout(() => {
  mcp__puppeteer__puppeteer_screenshot({
    name: "conflict-created"
  })
}, 2000)
```

### Capture Conflict ID

Request to Claude Code:
```
Get the conflict ID from the URL after creation
```

Claude will execute:
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `() => {
    const match = window.location.pathname.match(/conflicts\/([^\/]+)/);
    return match ? match[1] : null;
  }`
})
```

## Example 4: Exploration Chat Test

### Navigate to Exploration

Request to Claude Code:
```
Navigate to the exploration page for conflict ID abc123
```

Claude will execute:
```javascript
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:5173/conflicts/abc123/explore"
})
```

### Send Messages to AI

Request to Claude Code:
```
Send the following message to the AI exploration chat: "I'm worried about our financial future and feel we're not on the same page"
```

Claude will execute:
```javascript
mcp__puppeteer__puppeteer_fill({
  selector: 'textarea[name="message"]',
  value: "I'm worried about our financial future and feel we're not on the same page"
})

mcp__puppeteer__puppeteer_click({
  selector: 'button[data-action="send-message"]',
  element: "Send message button"
})
```

### Monitor AI Response

Request to Claude Code:
```
Wait for the AI response to appear and capture it
```

Claude will execute:
```javascript
// Wait for response
setTimeout(() => {
  mcp__puppeteer__puppeteer_evaluate({
    script: `() => {
      const messages = document.querySelectorAll('[data-message-role="assistant"]');
      const lastMessage = messages[messages.length - 1];
      return lastMessage ? lastMessage.textContent : null;
    }`
  })
}, 5000)
```

### Continue Conversation

Request to Claude Code:
```
Send another message: "I want to save for a house but my partner wants to spend on experiences now"
```

### Complete Exploration

Request to Claude Code:
```
Click the complete exploration button and take a screenshot of the guidance
```

## Example 5: Real-time Chat Test

### Open Chat as Partner A

Request to Claude Code:
```
Navigate to the shared relationship chat at http://localhost:5173/relationships/rel123/shared
```

### Send Chat Message

Request to Claude Code:
```
Send this chat message: "Hi, I'm ready to discuss our financial planning"
```

Claude will execute:
```javascript
mcp__puppeteer__puppeteer_fill({
  selector: 'textarea[name="chatMessage"]',
  value: "Hi, I'm ready to discuss our financial planning"
})

mcp__puppeteer__puppeteer_click({
  selector: 'button[data-action="send-chat"]',
  element: "Send chat message button"
})
```

### Verify Message Sent

Request to Claude Code:
```
Capture a screenshot of the chat and verify the message appears
```

### Check Message Status

Request to Claude Code:
```
Check if the message was sent successfully
```

Claude will execute:
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `() => {
    const messages = document.querySelectorAll('[data-message-sender]');
    return Array.from(messages).map(m => ({
      sender: m.dataset.messageSender,
      content: m.querySelector('[data-message-content]')?.textContent,
      timestamp: m.dataset.timestamp
    }));
  }`
})
```

## Example 6: Error Handling Test

### Test Offline Behavior

Request to Claude Code:
```
Simulate going offline and try to send a message
```

Claude will execute:
```javascript
// Trigger offline event
mcp__puppeteer__puppeteer_evaluate({
  script: `() => {
    window.dispatchEvent(new Event('offline'));
    return 'Offline mode activated';
  }`
})

// Try to send message
mcp__puppeteer__puppeteer_fill({
  selector: 'textarea[name="message"]',
  value: "Test offline message"
})

mcp__puppeteer__puppeteer_click({
  selector: 'button[data-action="send-message"]',
  element: "Send button"
})

// Capture error state
setTimeout(() => {
  mcp__puppeteer__puppeteer_screenshot({
    name: "offline-error-state"
  })
}, 1000)
```

### Test Session Timeout

Request to Claude Code:
```
Clear the session and try to access a protected route
```

Claude will execute:
```javascript
// Clear storage
mcp__puppeteer__puppeteer_evaluate({
  script: `() => {
    localStorage.clear();
    sessionStorage.clear();
    return 'Storage cleared';
  }`
})

// Try to access protected route
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:5173/conflicts/new"
})

// Should redirect to login
setTimeout(() => {
  mcp__puppeteer__puppeteer_screenshot({
    name: "session-timeout-redirect"
  })
}, 2000)
```

## Example 7: Multi-step Complete Flow

### Complete User Journey Test

Request to Claude Code:
```
Run a complete user journey test:

1. Sign up as test.user.1@example.com
2. Complete intake survey
3. Create a conflict about household chores
4. Complete exploration chat
5. View individual guidance
6. Capture screenshots at each step
```

This will execute all the steps in sequence, which is useful for regression testing.

## Tips for Effective Testing

### 1. Always Wait for Dynamic Content

When testing pages with dynamic content (AI responses, WebSocket updates), add explicit waits:

```
Wait 3 seconds then check if the AI response appears
```

### 2. Use Data Attributes for Reliable Selection

When possible, use data attributes instead of classes:

```javascript
// Good
selector: '[data-action="send-message"]'

// Less reliable
selector: '.send-button'
```

### 3. Capture Context for Debugging

When something fails, capture multiple data points:

```
Take a screenshot, get the current URL, and dump the console errors
```

### 4. Test Error States

Don't just test happy paths:

```
Test what happens when:
- Network is offline
- API returns error
- Required field is missing
- Session expires
```

### 5. Verify WebSocket Connections

For real-time features, check connection status:

```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `() => {
    // Assuming socket is exposed on window
    return window.socket ? window.socket.connected : false;
  }`
})
```

## Common Selectors Reference

Based on the application structure:

```javascript
// Authentication
'input[name="email"]'
'input[name="password"]'
'input[name="confirmPassword"]'
'input[name="displayName"]'
'button[type="submit"]'

// Intake
'input[name="relationshipLength"]'
'input[name="partnerName"]'
'input[name="partnerEmail"]'
'select[name="relationshipType"]'
'textarea[name="mainConcerns"]'
'textarea[name="goals"]'

// Conflicts
'input[name="title"]'
'textarea[name="description"]'
'button[data-action="create-conflict"]'

// Exploration Chat
'textarea[name="message"]'
'button[data-action="send-message"]'
'button[data-action="complete-exploration"]'
'[data-message-role="assistant"]'
'[data-message-role="user"]'

// Shared Chat
'textarea[name="chatMessage"]'
'button[data-action="send-chat"]'
'[data-message-sender]'
'[data-message-content]'
```

## Troubleshooting

### Screenshots Not Capturing

If screenshots aren't working:
```
Try taking a screenshot with full page option:
{
  name: "test-screenshot",
  width: 1920,
  height: 1080
}
```

### Elements Not Found

If selectors aren't working:
```
First, dump all form elements to find the right selector:

mcp__puppeteer__puppeteer_evaluate({
  script: `() => {
    const inputs = document.querySelectorAll('input, textarea, select, button');
    return Array.from(inputs).map(el => ({
      tag: el.tagName,
      name: el.name,
      id: el.id,
      type: el.type,
      class: el.className
    }));
  }`
})
```

### Timing Issues

If actions are executing too fast:
```
Add explicit waits between steps:
1. Fill form
2. Wait 1 second
3. Submit form
4. Wait 2 seconds
5. Take screenshot
```

## Test Results Template

After running tests, document results:

```markdown
# Test Run Results

**Date**: 2025-12-25
**Tester**: [Name]
**Environment**: Local development
**Browser**: Chrome (via Puppeteer)

## Tests Executed

### ✅ Authentication Flow
- Signup: PASS
- Login: PASS
- Session persistence: PASS

### ✅ Intake Survey
- Form submission: PASS
- Data validation: PASS
- Partner invitation: SKIP (email not configured)

### ✅ Conflict Creation
- Create conflict: PASS
- View conflict: PASS

### ⚠️ Exploration Chat
- Send messages: PASS
- AI responses: PARTIAL (slow response time)
- Complete exploration: PASS

### ❌ Shared Chat
- Send message: FAIL (WebSocket connection refused)
- Real-time updates: FAIL

## Issues Found

1. **WebSocket Connection Issue**
   - Error: Connection refused to ws://localhost:3001
   - Impact: Real-time chat not working
   - Action: Check backend WebSocket configuration

2. **Slow AI Responses**
   - Average response time: 8 seconds
   - Expected: < 3 seconds
   - Action: Investigate API latency

## Screenshots

- signup-success.png
- intake-completed.png
- conflict-created.png
- exploration-guidance.png
```
