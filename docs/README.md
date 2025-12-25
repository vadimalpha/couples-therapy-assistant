# Documentation

This directory contains comprehensive documentation for the Couples Therapy Assistant application.

## Testing Documentation

### [TESTING.md](./TESTING.md)
**Main testing guide** - Start here for an overview of all testing approaches.

- Overview of test types (E2E, unit, integration)
- Quick start guide
- Test data management
- Debugging guide
- Best practices

### [e2e-tests.md](./e2e-tests.md)
**Comprehensive E2E test scenarios** - Detailed test plans for all user flows.

- Authentication flows (signup, login)
- Intake survey completion
- Conflict creation and management
- Individual exploration with AI
- Joint-context guidance
- Real-time relationship chat
- Error handling scenarios
- Performance validation

### [e2e-test-examples.md](./e2e-test-examples.md)
**Practical Puppeteer MCP examples** - Copy-paste ready test commands.

- Step-by-step test execution examples
- Real Puppeteer MCP commands
- Troubleshooting guide
- Common selectors reference
- Test results template

## Quick Links

### For Developers
- **Running tests**: See [TESTING.md](./TESTING.md#quick-start-testing)
- **E2E test execution**: See [e2e-test-examples.md](./e2e-test-examples.md)
- **Test coverage goals**: See [TESTING.md](./TESTING.md#test-coverage-goals)

### For QA Engineers
- **Test scenarios**: See [e2e-tests.md](./e2e-tests.md#test-scenarios)
- **Test execution workflow**: See [TESTING.md](./TESTING.md#e2e-testing-workflow)
- **Result documentation**: See [e2e-test-examples.md](./e2e-test-examples.md#test-results-template)

### For Product Managers
- **Feature coverage**: See [e2e-tests.md](./e2e-tests.md#test-coverage)
- **User flow validation**: See [e2e-tests.md](./e2e-tests.md#test-scenarios)
- **Testing gaps**: See [e2e-tests.md](./e2e-tests.md#gaps)

## Testing Workflow

1. **Setup** (one time)
   - Install dependencies: `npm install`
   - Configure environment variables
   - Start required services (SurrealDB, Redis)

2. **Start Application**
   ```bash
   # Backend
   cd backend && npm run dev

   # Frontend (requires Node 20.19+ or 22.12+)
   cd frontend && npm run dev
   ```

3. **Run Tests**
   - **E2E (manual)**: Follow examples in [e2e-test-examples.md](./e2e-test-examples.md)
   - **Unit tests**: `cd backend && npm test`
   - **Component tests**: `cd frontend && npm test`

4. **Document Results**
   - Use template from [e2e-test-examples.md](./e2e-test-examples.md#test-results-template)
   - Capture screenshots at key steps
   - Report bugs or issues found

## Test Coverage

### ✅ Fully Documented
- Authentication (signup, login, logout)
- Intake survey submission
- Conflict creation
- Individual exploration
- AI guidance synthesis
- Joint-context guidance
- Real-time chat
- Error handling

### ⚠️ Partially Documented
- Partner invitation flow
- Performance testing
- Load testing

### ❌ Not Yet Documented
- Email notifications
- Analytics tracking
- Mobile responsive testing
- Cross-browser compatibility
- Accessibility testing

## Tools Used

### Puppeteer MCP
- Browser automation through Claude Code
- Manual test execution
- Screenshot capture
- JavaScript evaluation

### Jest
- Backend unit tests
- API integration tests

### React Testing Library
- Frontend component tests
- User interaction simulation

### Playwright (Future)
- Automated E2E test suite
- Cross-browser testing
- Visual regression testing

## Contributing

When adding new features:

1. **Document test scenarios** in [e2e-tests.md](./e2e-tests.md)
2. **Add test examples** in [e2e-test-examples.md](./e2e-test-examples.md)
3. **Write unit tests** for backend functions
4. **Write component tests** for React components
5. **Update** this README if adding new documentation

## Getting Help

### Common Issues

**Frontend won't start**
- Check Node.js version: `node --version` (needs 20.19+ or 22.12+)
- Try: `nvm use 22` (if using nvm)
- See [TESTING.md](./TESTING.md#debugging-failed-tests)

**Backend connection errors**
- Verify SurrealDB running: `lsof -i :8000`
- Check environment variables in `.env`
- See [TESTING.md](./TESTING.md#debugging-failed-tests)

**Tests failing**
- Check logs: Backend logs, browser console
- Verify test data is clean
- See troubleshooting in [e2e-test-examples.md](./e2e-test-examples.md#troubleshooting)

### Resources

- [Puppeteer MCP](https://github.com/modelcontextprotocol/servers)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)

## Roadmap

### Phase 1: Documentation ✅ (Current)
- [x] E2E test scenarios documented
- [x] Puppeteer MCP examples created
- [x] Testing guide written

### Phase 2: Execution (Next)
- [ ] Run documented test scenarios
- [ ] Capture test result screenshots
- [ ] Document bugs and issues
- [ ] Create test data fixtures

### Phase 3: Automation (Future)
- [ ] Convert manual tests to Playwright
- [ ] Set up CI/CD pipeline
- [ ] Add visual regression testing
- [ ] Implement load testing

### Phase 4: Enhancement (Future)
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Accessibility testing
- [ ] Performance benchmarks
