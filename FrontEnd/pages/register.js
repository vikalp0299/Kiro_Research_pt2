import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { userRegisterRequest } from '../utils/api';
import { validateEmail, validatePassword } from '../utils/validation';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Real-time validation
    if (name === 'email') {
      setErrors(prev => ({
        ...prev,
        email: validateEmail(value) ? '' : 'Invalid email format'
      }));
    }

    if (name === 'password') {
      const strength = validatePassword(value);
      setPasswordStrength(strength.message);
      // Clear any previous password errors during real-time validation
      setErrors(prev => ({
        ...prev,
        password: ''
      }));
    }

    if (name === 'confirmPassword') {
      setErrors(prev => ({
        ...prev,
        confirmPassword: value !== formData.password ? 'Passwords do not match' : ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate all fields
    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);
    const passwordsMatch = formData.password === formData.confirmPassword;

    const newErrors = {};

    if (!emailValidation) {
      newErrors.email = 'Invalid email format';
    }

    if (!passwordValidation.isValid) {
      newErrors.password = 'Please fix password requirements above';
    }

    if (!passwordsMatch) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await userRegisterRequest(
        formData.fullName,
        formData.email,
        formData.username,
        formData.password
      );

      if (response.success) {
        localStorage.setItem('token', response.token);
        router.push('/dashboard');
      } else {
        setErrors({ general: response.message || 'Registration failed' });
      }
    } catch (err) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {passwordStrength && (
              <div className={`password-strength ${passwordStrength.includes('Strong') ? 'strong' : 'weak'}`}>
                {passwordStrength}
              </div>
            )}
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          </div>
          {errors.general && <div className="error-message">{errors.general}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p>
          Already have an account? <Link href="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}