/**
 * Tests for Login Page Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '../page';
import { auth } from '../../../lib/api';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API
jest.mock('../../../lib/api', () => ({
  auth: {
    login: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('LoginPage', () => {
  let mockPush;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });
    localStorageMock.setItem.mockClear();
  });

  describe('Form Rendering', () => {
    test('should render all required form fields', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    });

    test('should render submit button', () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();
    });

    test('should render registration link', () => {
      render(<LoginPage />);

      const registerLink = screen.getByText(/create one here/i);
      expect(registerLink).toBeInTheDocument();
      expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
    });

    test('should render page header', () => {
      render(<LoginPage />);

      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      expect(screen.getByText(/sign in to access your classes/i)).toBeInTheDocument();
    });

    test('should have proper autocomplete attributes', () => {
      render(<LoginPage />);

      const identifierInput = screen.getByLabelText(/username or email/i);
      const passwordInput = screen.getByLabelText(/^password/i);

      expect(identifierInput).toHaveAttribute('autocomplete', 'username');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  describe('Form Validation', () => {
    test('should show validation error for empty identifier', async () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username or email is required/i)).toBeInTheDocument();
      });
    });

    test('should show validation error for empty password', async () => {
      render(<LoginPage />);

      const identifierInput = screen.getByLabelText(/username or email/i);
      fireEvent.change(identifierInput, { target: { value: 'testuser' } });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    test('should show validation errors for both empty fields', async () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username or email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    test('should clear field error when user starts typing', async () => {
      render(<LoginPage />);

      const identifierInput = screen.getByLabelText(/username or email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Trigger validation error
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username or email is required/i)).toBeInTheDocument();
      });

      // Start typing
      fireEvent.change(identifierInput, { target: { value: 'test' } });

      // Error should be cleared
      expect(screen.queryByText(/username or email is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Successful Login Flow', () => {
    test('should call login API with correct data using username', async () => {
      auth.login.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });

      render(<LoginPage />);

      // Fill form
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'TestPassword123!' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(auth.login).toHaveBeenCalledWith({
          identifier: 'testuser',
          password: 'TestPassword123!',
        });
      });
    });

    test('should call login API with correct data using email', async () => {
      auth.login.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });

      render(<LoginPage />);

      // Fill form
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'TestPassword123!' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(auth.login).toHaveBeenCalledWith({
          identifier: 'test@example.com',
          password: 'TestPassword123!',
        });
      });
    });

    test('should call login API and handle successful response', async () => {
      auth.login.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });

      render(<LoginPage />);

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'TestPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(auth.login).toHaveBeenCalledWith({
          identifier: 'testuser',
          password: 'TestPassword123!',
        });
      });
    });

    test('should redirect to dashboard on successful login', async () => {
      auth.login.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });

      render(<LoginPage />);

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'TestPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('should show loading spinner during submission', async () => {
      auth.login.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ accessToken: 'token' }), 100))
      );

      render(<LoginPage />);

      // Fill form
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'TestPassword123!' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Button should no longer have "Sign In" text (replaced with spinner)
      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    });

    test('should disable form inputs during submission', async () => {
      auth.login.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ accessToken: 'token' }), 100))
      );

      render(<LoginPage />);

      // Fill form
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'TestPassword123!' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Inputs should be disabled
      expect(screen.getByLabelText(/username or email/i)).toBeDisabled();
      expect(screen.getByLabelText(/^password/i)).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('should display error message on API failure', async () => {
      auth.login.mockRejectedValue(new Error('Invalid credentials'));

      render(<LoginPage />);

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'WrongPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    test('should display generic error message when API error has no message', async () => {
      auth.login.mockRejectedValue(new Error());

      render(<LoginPage />);

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'TestPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/login failed\. please check your credentials/i)).toBeInTheDocument();
      });
    });

    test('should not redirect on API failure', async () => {
      auth.login.mockRejectedValue(new Error('Invalid credentials'));

      render(<LoginPage />);

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'WrongPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    test('should clear error message when user starts typing', async () => {
      auth.login.mockRejectedValue(new Error('Invalid credentials'));

      render(<LoginPage />);

      // Fill and submit form to trigger error
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'WrongPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Start typing in identifier field
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'testuser2' },
      });

      // Error should be cleared
      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
    });

    test('should allow form resubmission after error', async () => {
      // First attempt fails
      auth.login.mockRejectedValueOnce(new Error('Invalid credentials'));
      // Second attempt succeeds
      auth.login.mockResolvedValueOnce({
        accessToken: 'test-access-token',
      });

      render(<LoginPage />);

      // First submission
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'WrongPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Second submission with correct password
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'CorrectPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Navigation', () => {
    test('should have link to registration page', () => {
      render(<LoginPage />);

      const registerLink = screen.getByText(/create one here/i);
      expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
    });

    test('should display registration prompt text', () => {
      render(<LoginPage />);

      expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
    });
  });
});
