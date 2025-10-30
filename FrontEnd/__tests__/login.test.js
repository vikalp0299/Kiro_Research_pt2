import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../pages/login';
import { userLoginRequest } from '../utils/api';

// Mock the API function
jest.mock('../utils/api', () => ({
  userLoginRequest: jest.fn(),
}));

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form', () => {
    render(<Login />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Username or Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('handles form submission with valid credentials', async () => {
    const mockResponse = { success: true, token: 'mock-token' };
    userLoginRequest.mockResolvedValue(mockResponse);

    render(<Login />);
    
    fireEvent.change(screen.getByLabelText('Username or Email'), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(userLoginRequest).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  test('displays error message on login failure', async () => {
    const mockResponse = { success: false, message: 'Invalid credentials' };
    userLoginRequest.mockResolvedValue(mockResponse);

    render(<Login />);
    
    fireEvent.change(screen.getByLabelText('Username or Email'), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('shows loading state during login', async () => {
    userLoginRequest.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<Login />);
    
    fireEvent.change(screen.getByLabelText('Username or Email'), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByText('Logging in...')).toBeInTheDocument();
  });
});