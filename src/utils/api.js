/**
 * API utility for making backend requests
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Get authentication token from storage
 */
const getAuthToken = () => {
  // Try to get from sessionStorage first, then localStorage
  return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
};

/**
 * Set authentication token
 */
export const setAuthToken = (token, rememberMe = false) => {
  if (rememberMe) {
    localStorage.setItem('auth_token', token);
  } else {
    sessionStorage.setItem('auth_token', token);
  }
};

/**
 * Remove authentication token
 */
export const removeAuthToken = () => {
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('auth_token');
};

/**
 * Make API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, read as text
        const text = await response.text();
        throw new Error(text || `Request failed with status ${response.status}`);
      }
    } else {
      // If not JSON, read as text
      const text = await response.text();
      throw new Error(text || `Request failed with status ${response.status}`);
    }

    if (!response.ok) {
      // Handle validation errors with details
      if (data.details && Array.isArray(data.details)) {
        const errorMessages = data.details.map(d => d.message).join(', ');
        throw new Error(errorMessages || data.message || data.error || 'Request failed');
      }
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    // If it's already an Error object, throw it as is
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise wrap it
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

/**
 * Authentication API
 */
export const authAPI = {
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        full_name: userData.name,
        user_type: userData.userType,
      }),
    });
  },

  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store token if received
    if (response.data?.session?.access_token) {
      setAuthToken(response.data.session.access_token);
    }

    return response;
  },

  logout: () => {
    removeAuthToken();
  },

  forgotPassword: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

/**
 * User API
 */
export const userAPI = {
  getProfile: async () => {
    return apiRequest('/users/me');
  },

  updateProfile: async (updates) => {
    return apiRequest('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
};

/**
 * Tutor API
 */
export const tutorAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.language) params.append('language', filters.language);
    if (filters.minRating) params.append('min_rating', filters.minRating);
    if (filters.minPrice) params.append('min_price', filters.minPrice);
    if (filters.maxPrice) params.append('max_price', filters.maxPrice);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    return apiRequest(`/tutors${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (tutorId) => {
    return apiRequest(`/tutors/${tutorId}`);
  },

  createProfile: async (profileData) => {
    return apiRequest('/tutors/profile', {
      method: 'POST',
      body: JSON.stringify({
        languages: profileData.languages,
        hourly_rate: profileData.hourlyRate,
        experience_years: parseInt(profileData.experience) || 0,
        bio: profileData.bio,
        education: profileData.education,
        certifications: profileData.certifications || [],
      }),
    });
  },

  updateProfile: async (profileData) => {
    return apiRequest('/tutors/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        languages: profileData.languages,
        hourly_rate: profileData.hourlyRate,
        experience_years: parseInt(profileData.experience) || 0,
        bio: profileData.bio,
        education: profileData.education,
        certifications: profileData.certifications || [],
      }),
    });
  },

  setAvailability: async (availability) => {
    return apiRequest('/tutors/availability', {
      method: 'POST',
      body: JSON.stringify(availability),
    });
  },
};

/**
 * Booking API
 */
export const bookingAPI = {
  create: async (bookingData) => {
    return apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        tutor_id: bookingData.tutorId,
        session_date: bookingData.date,
        start_time: bookingData.time,
        duration_minutes: bookingData.duration,
        notes: bookingData.notes,
      }),
    });
  },

  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.upcoming) params.append('upcoming', filters.upcoming);
    if (filters.past) params.append('past', filters.past);

    const queryString = params.toString();
    return apiRequest(`/bookings${queryString ? `?${queryString}` : ''}`);
  },

  cancel: async (bookingId, reason) => {
    return apiRequest(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  complete: async (bookingId) => {
    return apiRequest(`/bookings/${bookingId}/complete`, {
      method: 'POST',
    });
  },
};

/**
 * Payment API
 */
export const paymentAPI = {
  createOrder: async (bookingId) => {
    return apiRequest('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId }),
    });
  },

  verify: async (paymentData) => {
    return apiRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
};

/**
 * Review API
 */
export const reviewAPI = {
  submit: async (reviewData) => {
    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        booking_id: reviewData.bookingId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      }),
    });
  },

  getByTutor: async (tutorId, page = 1) => {
    return apiRequest(`/reviews/tutor/${tutorId}?page=${page}`);
  },
};

export default {
  auth: authAPI,
  user: userAPI,
  tutor: tutorAPI,
  booking: bookingAPI,
  payment: paymentAPI,
  review: reviewAPI,
};

