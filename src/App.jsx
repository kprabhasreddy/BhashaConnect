import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowseTutorsPage from './pages/BrowseTutorsPage';
import BookingPage from './pages/BookingPage';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import { tutorAPI, bookingAPI } from './utils/api';
import { removeAuthToken } from './utils/api';

function App() {
  // Core state management
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('home');
  const [tutors, setTutors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [loading, setLoading] = useState(false);

  // Load tutors from backend
  useEffect(() => {
    const loadTutors = async () => {
      try {
        setLoading(true);
        const response = await tutorAPI.getAll();
        if (response.success && response.data) {
          // Transform backend data to match frontend format
          const transformedTutors = response.data.map((tutor) => {
            // Handle nested user data structure
            const userData = tutor.users || (Array.isArray(tutor.users) ? tutor.users[0] : null);
            
            return {
              id: tutor.id, // This is the tutor_profile.id (UUID)
              userId: tutor.user_id, // Store user_id separately if needed
              name: userData?.full_name || 'Tutor',
              email: userData?.email || '',
              languages: tutor.languages || [],
              rating: parseFloat(tutor.avg_rating) || 0,
              reviews: tutor.total_reviews || 0,
              hourlyRate: tutor.hourly_rate || 500,
              experience: `${tutor.experience_years || 0} years`,
              bio: tutor.bio || '',
              avatar: '👨‍🏫',
              availability: [],
            };
          });
          setTutors(transformedTutors);
        }
      } catch (error) {
        console.error('Failed to load tutors:', error);
        // Keep empty array on error - will show "No tutors found"
      } finally {
        setLoading(false);
      }
    };

    if (view === 'browse' || view === 'home') {
      loadTutors();
    }
  }, [view]);

  // Load bookings when user is logged in
  useEffect(() => {
    const loadBookings = async () => {
      if (!currentUser) return;

      try {
        const response = await bookingAPI.getAll();
        if (response.success) {
          // Transform backend bookings to match frontend format
          const transformedBookings = response.data.map((booking) => ({
            id: booking.id,
            tutorId: booking.tutor_id,
            tutorName: booking.tutor?.full_name || 'Tutor',
            studentEmail: booking.student?.email || currentUser.email,
            studentName: booking.student?.full_name || currentUser.name,
            date: booking.session_date,
            time: booking.start_time,
            duration: booking.duration_minutes,
            amount: parseFloat(booking.total_amount) || 0,
            status: booking.status,
          }));
          setBookings(transformedBookings);
        }
      } catch (error) {
        console.error('Failed to load bookings:', error);
      }
    };

    if (currentUser && (view === 'student-dashboard' || view === 'tutor-dashboard')) {
      loadBookings();
    }
  }, [currentUser, view]);

  // Navigation handler
  const navigateTo = (newView) => {
    setView(newView);
  };

  // Login handler
  const handleLogin = (user) => {
    setCurrentUser(user);
    // Navigate based on user type
    if (user.userType === 'student') {
      navigateTo('browse');
    } else {
      navigateTo('tutor-dashboard');
    }
  };

  // Logout handler
  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
    setBookings([]);
    navigateTo('home');
  };

  // Registration handler
  const handleRegister = (userData) => {
    const newUser = {
      email: userData.email,
      name: userData.name,
      userType: userData.userType,
    };

    // If tutor, add to tutors list
    if (userData.userType === 'tutor') {
      const newTutor = {
        id: tutors.length + 1,
        name: userData.name,
        email: userData.email,
        languages: userData.languages || [],
        rating: 0,
        reviews: 0,
        hourlyRate: userData.hourlyRate || 500,
        experience: userData.experience || '0 years',
        bio: userData.bio || '',
        avatar: '👨‍🏫',
        availability: userData.availability || [],
      };
      setTutors([...tutors, newTutor]);
    }

    // Set as current user and navigate
    setCurrentUser(newUser);
    if (userData.userType === 'student') {
      navigateTo('browse');
    } else {
      navigateTo('tutor-dashboard');
    }
  };

  // Booking handler
  const handleBooking = async (bookingData) => {
    if (!selectedTutor) return;

    try {
      setLoading(true);
      // Use the tutor ID directly (it's the tutor profile ID from backend)
      const response = await bookingAPI.create({
        tutorId: selectedTutor.id,
        date: bookingData.date,
        time: bookingData.time,
        duration: bookingData.duration,
        notes: bookingData.notes,
      });

      if (response.success) {
        // Reload bookings to get the new one
        const bookingsResponse = await bookingAPI.getAll();
        if (bookingsResponse.success) {
          const transformedBookings = bookingsResponse.data.map((booking) => ({
            id: booking.id,
            tutorId: booking.tutor_id,
            tutorName: booking.tutor?.full_name || 'Tutor',
            studentEmail: booking.student?.email || currentUser.email,
            studentName: booking.student?.full_name || currentUser.name,
            date: booking.session_date,
            time: booking.start_time,
            duration: booking.duration_minutes,
            amount: parseFloat(booking.total_amount) || 0,
            status: booking.status,
          }));
          setBookings(transformedBookings);
        }
        alert('Booking created! Please complete payment.');
        navigateTo('student-dashboard');
      }
    } catch (error) {
      alert(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render current view
  const renderView = () => {
    switch (view) {
      case 'home':
        return <HomePage navigateTo={navigateTo} />;
      case 'login':
        return <LoginPage navigateTo={navigateTo} onLogin={handleLogin} />;
      case 'register':
        return <RegisterPage navigateTo={navigateTo} onRegister={handleRegister} />;
      case 'browse':
        return (
          <BrowseTutorsPage
            navigateTo={navigateTo}
            tutors={tutors}
            currentUser={currentUser}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            setSelectedTutor={setSelectedTutor}
            loading={loading}
          />
        );
      case 'booking':
        return (
          <BookingPage
            navigateTo={navigateTo}
            tutor={selectedTutor}
            currentUser={currentUser}
            onBooking={handleBooking}
          />
        );
      case 'student-dashboard':
        return (
          <StudentDashboard
            navigateTo={navigateTo}
            currentUser={currentUser}
            bookings={bookings}
          />
        );
      case 'tutor-dashboard':
        return (
          <TutorDashboard
            navigateTo={navigateTo}
            currentUser={currentUser}
            tutors={tutors}
            bookings={bookings}
          />
        );
      default:
        return <HomePage navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentUser={currentUser}
        navigateTo={navigateTo}
        onLogout={handleLogout}
        view={view}
      />
      <main>{renderView()}</main>
    </div>
  );
}

export default App;
