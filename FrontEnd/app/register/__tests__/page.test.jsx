/**
 * Tests for Registration Page Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import RegisterPage from '../page';
import { auth } from '../../../lib/api';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API
jest.mock('../../../lib/api', () => ({
  auth: {
    register: jest.fn(),
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

describe('RegisterPage', () => {
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
      render(<RegisterPage />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    test('should render submit button', () => {
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toBeInTheDocument();
    });

    test('should render login link', () => {
      render(<RegisterPage />);

      const loginLink = screen.getByText(/log in here/i);
      expect(loginLink).toBeInTheDocument();
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });

    test('should render page header', () => {
      render(<RegisterPage />);

      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByText(/join our class registration system/i)).toBeInTheDocument();
    });
  });

  describe('Password Strength Indicator', () => {
    test('should not show password strength indicator when password is empty', () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText(/^password/i);
      expect(passwordInput.value).toBe('');
      
      // Password strength indicator should not be visible
      expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();
    });

    test('should show password strength indicator when user types password', () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText(/^password/i);
      fireEvent.change(passwordInput, { target: { value: 'weak' } });

      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    });

    test('should update password strength in real-time', () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText(/^password/i);

      // Type weak password
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      expect(screen.getByText(/weak/i)).toBeInTheDocument();

      // Type stronger password
      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      expect(screen.getByText(/strong/i)).toBeInTheDocument();
    });

    test('should show password requirements checklist', () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText(/^password/i);
      fireEvent.change(passwordInput, { target: { value: 'test' } });

      // Check that password requirements are shown
      const requirements = screen.getAllByText(/at least 12 characters/i);
      expect(requirements.length).toBeGreaterThan(0);
      const uppercaseReqs = screen.getAllByText(/one uppercase letter/i);
      expect(uppercaseReqs.length).toBeGreaterThan(0);
      const lowercaseReqs = screen.getAllByText(/one lowercase letter/i);
      expect(lowercaseReqs.length).toBeGreaterThan(0);
      const numberReqs = screen.getAllByText(/one number/i);
      expect(numberReqs.length).toBeGreaterThan(0);
    });
  });

  describe('Form Validation', () => {
    test('should show validation error for empty full name', async () => {
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      });
    });

    test('should show validation error for short full name', async () => {
      render(<RegisterPage />);

      const fullNameInput = screen.getByLabelText(/full name/i);
      fireEvent.change(fullNameInput, { target: { value: 'A' } });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    test('should prevent submission with invalid email', async () => {
      render(<RegisterPage />);

      // Fill other fields with valid data
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'invalid-email' },
      });
      fireEvent.change(screen.getByLabelText(/^username/i), {
        target: { value: 'johndoe' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'StrongPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'StrongPassword123!' },
      });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      // Wait a bit to ensure API is not called
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(auth.register).not.toHaveBeenCalled();
    });

    test('should prevent submission with invalid username', async () => {
      render(<RegisterPage />);

      // Fill other fields with valid data
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^username/i), {
        target: { value: 'ab' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'StrongPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'StrongPassword123!' },
      });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      // Wait a bit to ensure API is not called
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(auth.register).not.toHaveBeenCalled();
    });

    test('should prevent submission with weak password', async () => {
      render(<RegisterPage />);

      // Fill other fields with valid data
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^username/i), {
        target: { value: 'johndoe' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'weak' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'weak' },
      });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      // Wait a bit to ensure API is not called
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(auth.register).not.toHaveBeenCalled();
    });

    test('should show validation error when passwords do not match', async () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    test('should clear field error when user starts typing', async () => {
      render(<RegisterPage />);

      const fullNameInput = screen.getByLabelText(/full name/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      // Trigger validation error
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      });

      // Start typing
      fireEvent.change(fullNameInput, { target: { value: 'John' } });

      // Error should be cleared
      expect(screen.queryByText(/full name is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Successful Registration Flow', () => {
    test('should call register API with correct data', async () => {
      auth.register.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });

      render(<RegisterPage />);

      // Fill form
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^username/i), {
        target: { value: 'johndoe' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'StrongPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'StrongPassword123!' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(auth.register).toHaveBeenCalledWith({
          username: 'johndoe',
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'StrongPassword123!',
        });
      });
    });

    test('should redirect to dashboard on successful registration', async () => {
      auth.register.mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });

      render(<RegisterPage />);

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^username/i), {
        target: { value: 'johndoe' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'StrongPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'StrongPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('should show loading spinner during submission', async () => {
      auth.register.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ accessToken: 'token' }), 100))
      );

      render(<RegisterPage />);

      // Fill form
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^username/i), {
        target: { value: 'johndoe' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'StrongPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'StrongPassword123!' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    test('should disable form inputs during submission', async () => {
      auth.register.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ accessToken: 'token' }), 100))
      );

      render(<RegisterPage />);

      // Fill form
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^username/i), {
        target: { value: 'johndoe' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'StrongPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'StrongPassword123!' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      // Inputs should be disabled
      expect(screen.getByLabelText(/full name/i)).toBeDisabled();
      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('should display error message on API failure', async () => {
      auth.register.mockRejectedValue(new Error('Registration failed'));

      render(<RegisterPage />);

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^username/i), {
        target: { value: 'johndoe' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'StrongPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'StrongPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
      });
    });

    test('should display custom error message from API', async () => {
      auth.register.mockRejectedValue(new Error('Username already exists'));

      render(<RegisterPage />);

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^username/i), {
        target: { value: 'johndoe' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'StrongPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'StrongPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
      });
    });

    test('should not redirect on API failure', async () => {
      auth.register.mockRejectedValue(new Error('Registration failed'));

      render(<RegisterPage />);

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^username/i), {
        target: { value: 'johndoe' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'StrongPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'StrongPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    test('should not prevent form submission after validation passes', async () => {
      auth.register.mockResolvedValue({
        accessToken: 'test-access-token',
      });

      render(<RegisterPage />);

      // Fill form with valid data
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^username/i), {
        target: { value: 'johndoe' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'StrongPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'StrongPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(auth.register).toHaveBeenCalled();
      });
    });
  });
});
