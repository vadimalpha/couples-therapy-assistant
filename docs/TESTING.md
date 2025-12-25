# Testing Guide

## Overview

This document provides guidance on testing the Couples Therapy Assistant application.

## Test Types

### 1. E2E Tests with Puppeteer MCP

End-to-end tests that simulate real user interactions through the browser.

**Documentation**:
- [E2E Test Documentation](./e2e-tests.md) - Comprehensive test scenarios
- [E2E Test Examples](./e2e-test-examples.md) - Practical examples with Puppeteer MCP

**When to Use**:
- Testing complete user workflows
- Validating UI interactions
- Testing real-time features (WebSocket)
- Visual regression testing

**How to Run**:
1. Start the application (backend and frontend)
2. Use Puppeteer MCP tools through Claude Code
3. Follow test scenarios in the documentation

### 2. Backend Unit Tests

Test individual functions and modules in isolation.

**Location**: `backend/src/**/*.test.ts`

**How to Run**:
```bash
cd backend
npm test
```

**Coverage Areas**:
- AI service functions
- Database operations
- API endpoints
- Queue workers
- Utility functions

### 3. Frontend Component Tests

Test React components in isolation.

**Location**: `frontend/src/**/*.test.tsx`

**How to Run**:
```bash
cd frontend
npm test
```

**Coverage Areas**:
- UI components
- Custom hooks
- Auth context
- Form validation

### 4. Integration Tests

Test how different parts of the system work together.

**How to Run**:
```bash
cd backend
npm run test:integration
```

**Coverage Areas**:
- API + Database
- WebSocket + Queue
- AI Service + Database

## Quick Start Testing

### Prerequisites

1. **Environment Variables**:
   ```bash
   # backend/.env
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   FIREBASE_PROJECT_ID=...
   SURREALDB_URL=ws://localhost:8000
   REDIS_URL=redis://localhost:6379
   ```

2. **Services Running**:
   ```bash
   # SurrealDB
   surreal start --bind 0.0.0.0:8000 --user root --pass root memory

   # Redis (optional, for queue)
   redis-server

   # Backend
   cd backend && npm run dev

   # Frontend
   cd frontend && npm run dev
   ```

### Run All Tests

```bash
# Backend unit tests
cd backend && npm test

# Frontend component tests
cd frontend && npm test

# E2E tests (manual with Puppeteer MCP)
# See docs/e2e-test-examples.md
```

## E2E Testing Workflow

### 1. Setup

Ensure all services are running:
```bash
# Check backend
curl http://localhost:3001/health

# Check frontend
curl http://localhost:5173

# Check database
# SurrealDB should respond on ws://localhost:8000
```

### 2. Test Execution

Open Claude Code and run test scenarios:

**Example: Test Authentication**
```
Let's test the authentication flow:

1. Navigate to http://localhost:5173/signup
2. Fill signup form with test credentials
3. Submit and verify redirect
4. Take screenshot
```

**Example: Test Conflict Creation**
```
Test the conflict creation workflow:

1. Login as test user
2. Navigate to /conflicts/new
3. Create a conflict about finances
4. Verify conflict was created
5. Capture the conflict ID
```

### 3. Verify Results

Check that:
- Screenshots show expected UI states
- Database contains expected data
- No console errors in browser
- API responses are successful

## Test Data Management

### Creating Test Users

Use the signup flow or create directly via Firebase:

```javascript
// Via frontend
// Navigate to /signup and register

// Or via Firebase Admin SDK (backend)
const auth = admin.auth();
await auth.createUser({
  email: 'test@example.com',
  password: 'TestPass123!',
  displayName: 'Test User'
});
```

### Creating Test Conflicts

Use the frontend or API:

```bash
# Via API
curl -X POST http://localhost:3001/api/conflicts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-token>" \
  -d '{
    "title": "Test Conflict",
    "description": "Test description",
    "partnerId": "partner-user-id"
  }'
```

### Cleaning Test Data

```javascript
// Clear test data from SurrealDB
// Run via SurrealDB CLI or backend script

DELETE FROM user WHERE email CONTAINS 'test';
DELETE FROM relationship WHERE id CONTAINS 'test';
DELETE FROM conflict WHERE title CONTAINS 'Test';
```

## Common Test Scenarios

### Authentication
- ✅ User signup
- ✅ User login
- ✅ Session persistence
- ✅ Logout
- ✅ Password reset (if implemented)

### Intake Survey
- ✅ First-time user completes intake
- ✅ Partner receives invitation
- ✅ Both partners complete intake
- ✅ View intake summary

### Conflict Management
- ✅ Create new conflict
- ✅ View conflict list
- ✅ Individual exploration
- ✅ AI guidance generation
- ✅ Joint context guidance

### Real-time Chat
- ✅ Send messages
- ✅ Receive messages
- ✅ AI facilitation
- ✅ Message persistence
- ✅ WebSocket reconnection

### Error Handling
- ✅ Network offline
- ✅ Session timeout
- ✅ API errors
- ✅ Validation errors
- ✅ Rate limiting

## Performance Testing

### Load Testing

Test system under concurrent load:

```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 http://localhost:3001/api/health
```

### AI Response Times

Monitor AI response performance:
- First token latency: < 2s
- Streaming speed: > 50 tokens/s
- Total response time: < 10s

### WebSocket Performance

Test WebSocket message delivery:
- Message latency: < 100ms
- Reconnection time: < 3s
- Message ordering: preserved

## Debugging Failed Tests

### Check Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend console
# Open browser DevTools console

# Database logs
# Check SurrealDB output
```

### Common Issues

**Frontend Not Loading**
```bash
# Check Node version
node --version  # Should be 20.19+ or 22.12+

# Reinstall dependencies
cd frontend && rm -rf node_modules && npm install
```

**Backend API Errors**
```bash
# Check environment variables
cat backend/.env

# Verify database connection
curl http://localhost:3001/health
```

**WebSocket Connection Failed**
```bash
# Check CORS settings in backend
# Verify Socket.IO client version matches server
# Check firewall/proxy settings
```

**AI Responses Not Working**
```bash
# Verify API keys in .env
# Check API rate limits
# Monitor API logs for errors
```

## Test Coverage Goals

### Current Coverage
- Backend: ~60%
- Frontend: ~40%
- E2E: Manual only

### Target Coverage
- Backend: 80%+
- Frontend: 70%+
- E2E: Automated suite

## CI/CD Integration

### GitHub Actions (Future)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '22'
      - name: Install dependencies
        run: npm install
      - name: Run backend tests
        run: cd backend && npm test
      - name: Run frontend tests
        run: cd frontend && npm test
```

## Best Practices

### 1. Test Isolation

Each test should be independent:
- Create own test data
- Clean up after execution
- Don't rely on other tests

### 2. Descriptive Test Names

```javascript
// Good
test('should redirect to login when accessing protected route without auth')

// Bad
test('auth test')
```

### 3. Arrange-Act-Assert Pattern

```javascript
test('should create conflict successfully', async () => {
  // Arrange
  const userId = 'test-user-123';
  const conflictData = { title: 'Test', description: 'Test desc' };

  // Act
  const result = await createConflict(userId, conflictData);

  // Assert
  expect(result.id).toBeDefined();
  expect(result.title).toBe('Test');
});
```

### 4. Mock External Services

```javascript
// Mock AI API calls in tests
jest.mock('../services/openai', () => ({
  generateResponse: jest.fn().mockResolvedValue('Mock AI response')
}));
```

### 5. Test Error Paths

Don't just test happy paths:
```javascript
test('should handle AI API timeout gracefully', async () => {
  // Simulate timeout
  const result = await generateResponseWithTimeout(100);
  expect(result.error).toBe('Request timeout');
});
```

## Resources

- [Puppeteer MCP Documentation](https://github.com/modelcontextprotocol/servers)
- [Jest Testing Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)

## Getting Help

If you encounter issues:

1. Check the troubleshooting section in [e2e-tests.md](./e2e-tests.md)
2. Review test examples in [e2e-test-examples.md](./e2e-test-examples.md)
3. Check application logs for errors
4. Verify all services are running correctly
5. Ensure environment variables are configured

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure all tests pass
3. Update test documentation
4. Add test examples if needed
5. Update this guide if introducing new test types
