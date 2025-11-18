import { useState } from 'react';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowseTutorsPage from './pages/BrowseTutorsPage';
import BookingPage from './pages/BookingPage';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import { sampleTutors } from './data/sampleData';

function App() {
  // Core state management
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('home');
  const [tutors, setTutors] = useState(sampleTutors);
  const [bookings, setBookings] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');

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
    setCurrentUser(null);
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
  const handleBooking = (bookingData) => {
    const newBooking = {
      id: Date.now(),
      tutorId: selectedTutor.id,
      tutorName: selectedTutor.name,
      studentEmail: currentUser.email,
      studentName: currentUser.name,
      date: bookingData.date,
      time: bookingData.time,
      duration: bookingData.duration,
      amount: bookingData.amount,
      status: 'confirmed',
    };
    setBookings([...bookings, newBooking]);
    navigateTo('student-dashboard');
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
