import { useState } from 'react';
import { BookOpen, Menu, X } from 'lucide-react';

const Navigation = ({ currentUser, navigateTo, onLogout, view }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavClick = (viewName) => {
    navigateTo(viewName);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => handleNavClick('home')}
          >
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gray-900">BhashaConnect</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {currentUser ? (
              <>
                {currentUser.userType === 'student' && (
                  <button
                    onClick={() => handleNavClick('browse')}
                    className="text-gray-700 hover:text-primary transition-colors"
                  >
                    Browse Tutors
                  </button>
                )}
                <button
                  onClick={() =>
                    handleNavClick(
                      currentUser.userType === 'student'
                        ? 'student-dashboard'
                        : 'tutor-dashboard'
                    )
                  }
                  className="text-gray-700 hover:text-primary transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={onLogout}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('browse')}
                  className="text-gray-700 hover:text-primary transition-colors"
                >
                  Browse Tutors
                </button>
                <button
                  onClick={() => handleNavClick('login')}
                  className="text-gray-700 hover:text-primary transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light transition-colors"
                >
                  Register
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-700"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {currentUser ? (
              <>
                {currentUser.userType === 'student' && (
                  <button
                    onClick={() => handleNavClick('browse')}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Browse Tutors
                  </button>
                )}
                <button
                  onClick={() =>
                    handleNavClick(
                      currentUser.userType === 'student'
                        ? 'student-dashboard'
                        : 'tutor-dashboard'
                    )
                  }
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Dashboard
                </button>
                <button
                  onClick={onLogout}
                  className="block w-full text-left px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('browse')}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Browse Tutors
                </button>
                <button
                  onClick={() => handleNavClick('login')}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="block w-full text-left px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;

