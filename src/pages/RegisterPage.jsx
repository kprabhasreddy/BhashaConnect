import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { indianLanguages } from '../data/sampleData';
import { authAPI, tutorAPI } from '../utils/api';

const RegisterPage = ({ navigateTo, onRegister }) => {
  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    languages: [],
    hourlyRate: '',
    experience: '',
    bio: '',
    availability: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleLanguageToggle = (language) => {
    const languages = formData.languages.includes(language)
      ? formData.languages.filter((l) => l !== language)
      : [...formData.languages, language];
    setFormData({ ...formData, languages });
  };

  const handleAvailabilityToggle = (day) => {
    const availability = formData.availability.includes(day)
      ? formData.availability.filter((d) => d !== day)
      : [...formData.availability, day];
    setFormData({ ...formData, availability });
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Password validation (matches backend requirements)
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else {
      const password = formData.password;
      if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/[a-z]/.test(password)) {
        newErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = 'Password must contain at least one number';
      } else if (!/[^A-Za-z0-9]/.test(password)) {
        newErrors.password = 'Password must contain at least one special character (!@#$%^&* etc.)';
      }
    }

    // Tutor-specific validation
    if (userType === 'tutor') {
      if (formData.languages.length === 0) {
        newErrors.languages = 'Select at least one language';
      }
      if (!formData.hourlyRate) {
        newErrors.hourlyRate = 'Hourly rate is required';
      } else {
        const rate = parseInt(formData.hourlyRate);
        if (rate < 100) {
          newErrors.hourlyRate = 'Minimum rate is ₹100';
        } else if (rate > 5000) {
          newErrors.hourlyRate = 'Maximum rate is ₹5000';
        }
      }
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
      // Register user
      const registerResponse = await authAPI.register({
        email: formData.email,
        password: formData.password,
        name: formData.name.trim(), // Trim whitespace
        userType: userType,
      });

      if (registerResponse.success) {
        // Auto-login after registration
        const loginResponse = await authAPI.login(formData.email, formData.password);
        
        if (loginResponse.success) {
          const user = {
            id: loginResponse.data.user.id,
            email: loginResponse.data.user.email,
            name: formData.name,
            userType: userType,
          };

          // If tutor, create tutor profile
          if (userType === 'tutor') {
            try {
              await tutorAPI.createProfile({
                languages: formData.languages,
                hourlyRate: parseInt(formData.hourlyRate),
                experience: formData.experience,
                bio: formData.bio || 'No bio provided.',
              });
            } catch (profileError) {
              console.error('Tutor profile creation error:', profileError);
              // Continue even if profile creation fails - user can create it later
            }
          }

          onRegister(user);
        }
      }
    } catch (error) {
      // Handle validation errors with better messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message) {
        // Check for specific validation errors
        if (error.message.includes('Password must')) {
          errorMessage = error.message;
        } else if (error.message.includes('Name must')) {
          errorMessage = error.message;
        } else if (error.message.includes('Invalid email')) {
          errorMessage = error.message;
        } else if (error.message.includes('already exists') || error.message.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please login instead.';
        } else if (error.message.includes('Too many')) {
          errorMessage = 'Too many registration attempts. Please wait a few minutes and try again.';
        } else if (error.message.includes('Validation Error') || error.message.includes('invalid input')) {
          // Parse validation details if available
          errorMessage = error.message;
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
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigateTo('home')}
          className="flex items-center text-gray-600 hover:text-primary mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Create Your Account
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
            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
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
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Tutor-Specific Fields */}
            {userType === 'tutor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Languages Taught *
                  </label>
                  <div className="flex flex-wrap gap-2 border border-gray-300 rounded-lg p-4 min-h-[100px]">
                    {indianLanguages.map((language) => (
                      <button
                        key={language}
                        type="button"
                        onClick={() => handleLanguageToggle(language)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          formData.languages.includes(language)
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                  {errors.languages && (
                    <p className="mt-1 text-sm text-red-600">{errors.languages}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate (₹) *
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.hourlyRate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="500"
                    min="0"
                  />
                  {errors.hourlyRate && (
                    <p className="mt-1 text-sm text-red-600">{errors.hourlyRate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., 5 years"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Tell students about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleAvailabilityToggle(day)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.availability.includes(day)
                            ? 'bg-secondary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigateTo('login')}
              className="text-primary hover:underline font-semibold"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

