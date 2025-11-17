---
inclusion: always
---

# Testing Guidelines

## Testing Stack
- **Jest**: Test runner and assertions
- **Supertest**: HTTP API testing
- **React Testing Library**: Component testing

## Test Organization
- Place tests in `__tests__` directories or `.test.js` files
- Group related tests with `describe` blocks
- Use clear, descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

## Jest Best Practices
- Use `test()` or `it()` for test cases
- Use `beforeEach()` and `afterEach()` for setup/cleanup
- Use `beforeAll()` and `afterAll()` for expensive setup
- Mock external dependencies
- Test one thing per test case

## API Testing with Supertest
```javascript
const request = require('supertest');
const app = require('../app');

describe('POST /api/login', () => {
  it('should return JWT token on valid credentials', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'password123'
      })
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body).toHaveProperty('token');
    expect(response.body.token).toBeTruthy();
  });
  
  it('should return 401 on invalid credentials', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'wrongpassword'
      })
      .expect(401);
    
    expect(response.body).toHaveProperty('error');
  });
});
```

## Testing Authentication
- Test successful login/registration
- Test invalid credentials
- Test token validation
- Test protected routes
- Test token expiration
- Test logout functionality

## React Component Testing
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByText(/submit/i));
    
    await screen.findByText(/success/i);
    expect(onSubmit).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123'
    });
  });
});
```

## Mock Functions
- Use `jest.fn()` for mock functions
- Use `jest.mock()` for module mocking
- Verify mock calls with `expect(mock).toHaveBeenCalled()`
- Check call arguments with `expect(mock).toHaveBeenCalledWith()`
- Reset mocks between tests with `jest.clearAllMocks()`

## Database Testing
- Use in-memory database or test database
- Clean up data after each test
- Use transactions for test isolation
- Mock database calls when appropriate
- Test error scenarios

## Async Testing
- Use async/await in test functions
- Use `await` for promises
- Use `findBy` queries for async elements
- Set appropriate timeouts for slow operations
- Handle promise rejections properly

## Test Coverage
- Aim for high coverage but focus on critical paths
- Test edge cases and error scenarios
- Test user interactions and workflows
- Don't test implementation details
- Test behavior, not implementation

## Testing Checklist
- [ ] All API endpoints have tests
- [ ] Authentication flows are tested
- [ ] Error scenarios are covered
- [ ] Input validation is tested
- [ ] Database operations are tested
- [ ] Components render correctly
- [ ] User interactions work as expected
- [ ] Loading and error states are tested
- [ ] Security features are validated

## Test Execution
- Run tests before committing code
- Run full test suite in CI/CD
- Fix failing tests immediately
- Keep tests fast and focused
- Use watch mode during development

## Debugging Tests
- Use `console.log()` for debugging
- Use `screen.debug()` in React tests
- Run single test with `.only()`
- Skip tests with `.skip()`
- Check test output carefully
- Use descriptive error messages
