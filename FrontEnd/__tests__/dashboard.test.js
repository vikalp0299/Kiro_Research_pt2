import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../pages/dashboard';
import { 
  displayAllAvailableClasses, 
  displayEnrolledClasses, 
  displayDroppedClasses,
  enrollClass,
  unenrollClass
} from '../utils/api';

// Mock the API functions
jest.mock('../utils/api', () => ({
  displayAllAvailableClasses: jest.fn(),
  displayEnrolledClasses: jest.fn(),
  displayDroppedClasses: jest.fn(),
  enrollClass: jest.fn(),
  unenrollClass: jest.fn(),
}));

describe('Dashboard Page', () => {
  const mockAvailableClasses = [
    { classId: 'CSE 101', className: 'Intro to Computer Science', credits: 3, description: 'Basic CS concepts' }
  ];
  
  const mockEnrolledClasses = [
    { classId: 'IFT 201', className: 'Data Structures', credits: 4 }
  ];
  
  const mockDroppedClasses = [
    { classId: 'EEE 301', className: 'Circuit Analysis', credits: 3 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock-token');
    
    displayAllAvailableClasses.mockResolvedValue({ data: mockAvailableClasses });
    displayEnrolledClasses.mockResolvedValue({ data: mockEnrolledClasses });
    displayDroppedClasses.mockResolvedValue({ data: mockDroppedClasses });
  });

  test('renders dashboard with navigation tabs', async () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Class Registration Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Available Classes')).toBeInTheDocument();
    expect(screen.getByText('My Classes')).toBeInTheDocument();
    expect(screen.getByText('Dropped Classes')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('loads and displays available classes by default', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('CSE 101')).toBeInTheDocument();
      expect(screen.getByText('Intro to Computer Science')).toBeInTheDocument();
      expect(screen.getByText('Credits: 3')).toBeInTheDocument();
    });
  });

  test('switches to enrolled classes tab', async () => {
    render(<Dashboard />);
    
    fireEvent.click(screen.getByText('My Classes'));
    
    await waitFor(() => {
      expect(screen.getByText('IFT 201')).toBeInTheDocument();
      expect(screen.getByText('Data Structures')).toBeInTheDocument();
    });
  });

  test('switches to dropped classes tab', async () => {
    render(<Dashboard />);
    
    fireEvent.click(screen.getByText('Dropped Classes'));
    
    await waitFor(() => {
      expect(screen.getByText('EEE 301')).toBeInTheDocument();
      expect(screen.getByText('Circuit Analysis')).toBeInTheDocument();
    });
  });

  test('handles class enrollment', async () => {
    enrollClass.mockResolvedValue({ success: true });
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('CSE 101')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Enroll'));
    
    await waitFor(() => {
      expect(enrollClass).toHaveBeenCalledWith('CSE 101');
      expect(screen.getByText('Successfully enrolled in class')).toBeInTheDocument();
    });
  });

  test('handles class unenrollment', async () => {
    unenrollClass.mockResolvedValue({ success: true });
    
    render(<Dashboard />);
    
    fireEvent.click(screen.getByText('My Classes'));
    
    await waitFor(() => {
      expect(screen.getByText('IFT 201')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Drop'));
    
    await waitFor(() => {
      expect(unenrollClass).toHaveBeenCalledWith('IFT 201');
      expect(screen.getByText('Successfully dropped class')).toBeInTheDocument();
    });
  });

  test('handles re-enrollment from dropped classes', async () => {
    enrollClass.mockResolvedValue({ success: true });
    
    render(<Dashboard />);
    
    fireEvent.click(screen.getByText('Dropped Classes'));
    
    await waitFor(() => {
      expect(screen.getByText('EEE 301')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Re-enroll'));
    
    await waitFor(() => {
      expect(enrollClass).toHaveBeenCalledWith('EEE 301');
      expect(screen.getByText('Successfully enrolled in class')).toBeInTheDocument();
    });
  });

  test('displays error message on enrollment failure', async () => {
    enrollClass.mockResolvedValue({ success: false, message: 'Already enrolled' });
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('CSE 101')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Enroll'));
    
    await waitFor(() => {
      expect(screen.getByText('Already enrolled')).toBeInTheDocument();
    });
  });

  test('handles logout', () => {
    render(<Dashboard />);
    
    fireEvent.click(screen.getByText('Logout'));
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });
});