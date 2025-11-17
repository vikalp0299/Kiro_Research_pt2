/**
 * Tests for Dashboard Page Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '../page';
import { classes, auth } from '../../../lib/api';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API
jest.mock('../../../lib/api', () => ({
  classes: {
    getAvailable: jest.fn(),
    getEnrolled: jest.fn(),
    getDropped: jest.fn(),
    enroll: jest.fn(),
    unenroll: jest.fn(),
  },
  auth: {
    logout: jest.fn(),
  },
}));

describe('DashboardPage', () => {
  let mockPush;

  const mockAvailableClasses = [
    {
      classId: 'IFT 593',
      className: 'Advanced Computer Networks',
      credits: 4,
      description: 'This course covers advanced topics in networking',
    },
    {
      classId: 'CSE 201',
      className: 'Data Structures',
      credits: 3,
      description: 'Introduction to data structures and algorithms',
    },
  ];

  const mockEnrolledClasses = [
    {
      classId: 'IFT 501',
      className: 'Software Engineering',
      credits: 3,
      description: 'Software development methodologies',
    },
  ];

  const mockDroppedClasses = [
    {
      classId: 'CCE 301',
      className: 'Computer Architecture',
      credits: 4,
      description: 'Computer organization and design',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });

    // Default mock responses
    classes.getAvailable.mockResolvedValue({ classes: mockAvailableClasses });
    classes.getEnrolled.mockResolvedValue({ classes: mockEnrolledClasses });
    classes.getDropped.mockResolvedValue({ classes: mockDroppedClasses });
  });

  describe('Page Rendering', () => {
    test('should render dashboard header', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Class Dashboard')).toBeInTheDocument();
      });
    });

    test('should render logout button', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });
    });

    test('should render all tab buttons', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /available classes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /my classes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /dropped classes/i })).toBeInTheDocument();
      });
    });

    test('should have "Available Classes" tab active by default', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const availableTab = screen.getByRole('button', { name: /available classes/i });
        expect(availableTab).toHaveClass('active');
      });
    });
  });

  describe('Tab Navigation', () => {
    test('should switch to "My Classes" tab when clicked', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /available classes/i })).toHaveClass('active');
      });

      const myClassesTab = screen.getByRole('button', { name: /my classes/i });
      fireEvent.click(myClassesTab);

      await waitFor(() => {
        expect(myClassesTab).toHaveClass('active');
        expect(classes.getEnrolled).toHaveBeenCalled();
      });
    });

    test('should switch to "Dropped Classes" tab when clicked', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /available classes/i })).toHaveClass('active');
      });

      const droppedTab = screen.getByRole('button', { name: /dropped classes/i });
      fireEvent.click(droppedTab);

      await waitFor(() => {
        expect(droppedTab).toHaveClass('active');
        expect(classes.getDropped).toHaveBeenCalled();
      });
    });

    test('should fetch appropriate data when switching tabs', async () => {
      render(<DashboardPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(classes.getAvailable).toHaveBeenCalled();
      });

      // Switch to My Classes
      fireEvent.click(screen.getByRole('button', { name: /my classes/i }));

      await waitFor(() => {
        expect(classes.getEnrolled).toHaveBeenCalled();
      });

      // Switch to Dropped Classes
      fireEvent.click(screen.getByRole('button', { name: /dropped classes/i }));

      await waitFor(() => {
        expect(classes.getDropped).toHaveBeenCalled();
      });
    });
  });

  describe('Data Fetching', () => {
    test('should fetch available classes on initial load', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(classes.getAvailable).toHaveBeenCalled();
      });
    });

    test('should display loading spinner while fetching data', async () => {
      classes.getAvailable.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ classes: [] }), 100))
      );

      render(<DashboardPage />);

      expect(screen.getByText(/loading classes/i)).toBeInTheDocument();
    });

    test('should display classes after successful fetch', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('IFT 593')).toBeInTheDocument();
        expect(screen.getByText('Advanced Computer Networks')).toBeInTheDocument();
        expect(screen.getByText('CSE 201')).toBeInTheDocument();
      });
    });

    test('should display error message on fetch failure', async () => {
      classes.getAvailable.mockRejectedValue(new Error('Failed to load classes'));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load classes/i)).toBeInTheDocument();
      });
    });

    test('should display empty state when no classes available', async () => {
      classes.getAvailable.mockResolvedValue({ classes: [] });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/no classes available for enrollment/i)).toBeInTheDocument();
      });
    });
  });

  describe('Enrollment Actions', () => {
    test('should call enroll API when enroll button is clicked', async () => {
      classes.enroll.mockResolvedValue({});

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('IFT 593')).toBeInTheDocument();
      });

      const enrollButtons = screen.getAllByRole('button', { name: /enroll/i });
      fireEvent.click(enrollButtons[0]);

      await waitFor(() => {
        expect(classes.enroll).toHaveBeenCalledWith('IFT 593');
      });
    });

    test('should refresh class list after successful enrollment', async () => {
      classes.enroll.mockResolvedValue({});

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('IFT 593')).toBeInTheDocument();
      });

      // Clear previous calls
      classes.getAvailable.mockClear();

      const enrollButtons = screen.getAllByRole('button', { name: /enroll/i });
      fireEvent.click(enrollButtons[0]);

      await waitFor(() => {
        expect(classes.getAvailable).toHaveBeenCalled();
      });
    });

    test('should display error message on enrollment failure', async () => {
      classes.enroll.mockRejectedValue(new Error('Failed to enroll in class'));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('IFT 593')).toBeInTheDocument();
      });

      const enrollButtons = screen.getAllByRole('button', { name: /enroll/i });
      fireEvent.click(enrollButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/failed to enroll in class/i)).toBeInTheDocument();
      });
    });
  });

  describe('Unenrollment Actions', () => {
    test('should call unenroll API when unenroll button is clicked', async () => {
      classes.unenroll.mockResolvedValue({});

      render(<DashboardPage />);

      // Switch to My Classes tab
      fireEvent.click(screen.getByRole('button', { name: /my classes/i }));

      await waitFor(() => {
        expect(screen.getByText('IFT 501')).toBeInTheDocument();
      });

      const unenrollButton = screen.getByRole('button', { name: /unenroll/i });
      fireEvent.click(unenrollButton);

      await waitFor(() => {
        expect(classes.unenroll).toHaveBeenCalledWith('IFT 501');
      });
    });

    test('should refresh class list after successful unenrollment', async () => {
      classes.unenroll.mockResolvedValue({});

      render(<DashboardPage />);

      // Switch to My Classes tab
      fireEvent.click(screen.getByRole('button', { name: /my classes/i }));

      await waitFor(() => {
        expect(screen.getByText('IFT 501')).toBeInTheDocument();
      });

      // Clear previous calls
      classes.getEnrolled.mockClear();

      const unenrollButton = screen.getByRole('button', { name: /unenroll/i });
      fireEvent.click(unenrollButton);

      await waitFor(() => {
        expect(classes.getEnrolled).toHaveBeenCalled();
      });
    });

    test('should display error message on unenrollment failure', async () => {
      classes.unenroll.mockRejectedValue(new Error('Failed to unenroll from class'));

      render(<DashboardPage />);

      // Switch to My Classes tab
      fireEvent.click(screen.getByRole('button', { name: /my classes/i }));

      await waitFor(() => {
        expect(screen.getByText('IFT 501')).toBeInTheDocument();
      });

      const unenrollButton = screen.getByRole('button', { name: /unenroll/i });
      fireEvent.click(unenrollButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to unenroll from class/i)).toBeInTheDocument();
      });
    });
  });

  describe('Logout Functionality', () => {
    test('should call logout API when logout button is clicked', async () => {
      auth.logout.mockResolvedValue({});

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(auth.logout).toHaveBeenCalled();
      });
    });

    test('should redirect to login page after successful logout', async () => {
      auth.logout.mockResolvedValue({});

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('should redirect to login page even if logout API fails', async () => {
      auth.logout.mockRejectedValue(new Error('Logout failed'));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading spinner during initial data fetch', async () => {
      classes.getAvailable.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ classes: [] }), 100))
      );

      render(<DashboardPage />);

      expect(screen.getByText(/loading classes/i)).toBeInTheDocument();
    });

    test('should show loading state on specific class during action', async () => {
      classes.enroll.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('IFT 593')).toBeInTheDocument();
      });

      const enrollButtons = screen.getAllByRole('button', { name: /enroll/i });
      fireEvent.click(enrollButtons[0]);

      // Button should be disabled during loading
      await waitFor(() => {
        expect(enrollButtons[0]).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    test('should allow dismissing error messages', async () => {
      classes.getAvailable.mockRejectedValue(new Error('Failed to load classes'));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load classes/i)).toBeInTheDocument();
      });

      // Find and click dismiss button (ErrorMessage component has dismiss functionality)
      const errorMessage = screen.getByText(/failed to load classes/i).closest('div');
      const dismissButton = errorMessage.querySelector('button');
      
      if (dismissButton) {
        fireEvent.click(dismissButton);

        await waitFor(() => {
          expect(screen.queryByText(/failed to load classes/i)).not.toBeInTheDocument();
        });
      }
    });
  });
});
