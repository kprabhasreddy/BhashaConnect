import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { authAPI } from '../utils/api';

const LoginPage = ({ navigateTo, onLogin }) => {
  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (apiError) setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      if (response.success) {
        const user = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.full_name || formData.email.split('@')[0],
          userType: response.data.user.user_type || userType,
        };
        onLogin(user);
      }
    } catch (error) {
      // Handle different error types
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.message) {
        if (error.message.includes('Too many')) {
          errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
        } else if (error.message.includes('Email Not Verified')) {
          errorMessage = 'Please verify your email address before logging in. Check your inbox.';
        } else if (error.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigateTo('home')}
          className="flex items-center text-gray-600 hover:text-primary mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Sign In
          </h1>

          {/* User Type Toggle */}
          <div className="flex gap-4 mb-8 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setUserType('student')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                userType === 'student'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setUserType('tutor')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                userType === 'tutor'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tutor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-light transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigateTo('register')}
              className="text-primary hover:underline font-semibold"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

