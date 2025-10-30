import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../pages/register';
import { userRegisterRequest } from '../utils/api';

// Mock the API function
jest.mock('../utils/api', () => ({
  userRegisterRequest: jest.fn(),
}));

describe('Register Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders registration form', () => {
    render(<Register />);
    
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  test('validates email format', async () => {
    render(<Register />);
    
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  test('validates password strength', async () => {
    render(<Register />);
    
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'weak' } });

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 10 characters long')).toBeInTheDocument();
    });
  });

  test('validates password confirmation', async () => {
    render(<Register />);
    
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  test('handles successful registration', async () => {
    const mockResponse = { success: true, token: 'mock-token' };
    userRegisterRequest.mockResolvedValue(mockResponse);

    render(<Register />);
    
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'johndoe' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'StrongPassword123!' }
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'StrongPassword123!' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(userRegisterRequest).toHaveBeenCalledWith(
        'John Doe',
        'john@example.com',
        'johndoe',
        'StrongPassword123!'
      );
    });
  });

  test('displays error message on registration failure', async () => {
    const mockResponse = { success: false, message: 'Username already exists' };
    userRegisterRequest.mockResolvedValue(mockResponse);

    render(<Register />);
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'existinguser' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'StrongPassword123!' }
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'StrongPassword123!' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });
  });
});