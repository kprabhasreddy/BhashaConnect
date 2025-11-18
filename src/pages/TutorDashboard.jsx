import { Calendar, Clock, DollarSign, Star, User, Edit } from 'lucide-react';

const TutorDashboard = ({ navigateTo, currentUser, tutors, bookings }) => {
  // Find current tutor's profile
  const tutorProfile = tutors.find((t) => t.email === currentUser?.email);

  // Filter bookings for current tutor
  const tutorBookings = bookings.filter(
    (booking) => booking.tutorId === tutorProfile?.id
  );

  // Calculate stats (mock data for now)
  const totalSessions = tutorBookings.length;
  const monthlyEarnings = tutorBookings.reduce((sum, booking) => sum + booking.amount, 0);
  const averageRating = tutorProfile?.rating || 0;

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {currentUser?.name || 'Tutor'}!
          </h1>
          <p className="text-gray-600">Manage your tutoring profile and sessions</p>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">This Month's Earnings</p>
                <p className="text-3xl font-bold text-gray-900">₹{monthlyEarnings}</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Average Rating</p>
                <div className="flex items-center gap-1">
                  <p className="text-3xl font-bold text-gray-900">{averageRating}</p>
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        {tutorProfile && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
              <button
                onClick={() => alert('Edit profile feature coming soon!')}
                className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
              >
                <Edit className="h-5 w-5" />
                Edit Profile
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{tutorProfile.avatar}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {tutorProfile.name}
                    </h3>
                    <p className="text-gray-600">{tutorProfile.email}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Languages Taught:</p>
                  <div className="flex flex-wrap gap-2">
                    {tutorProfile.languages.map((language) => (
                      <span
                        key={language}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Hourly Rate:</p>
                  <p className="text-xl font-semibold text-gray-900">
                    ₹{tutorProfile.hourlyRate}/hour
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Experience:</p>
                  <p className="text-gray-900">{tutorProfile.experience}</p>
                </div>

                {tutorProfile.bio && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Bio:</p>
                    <p className="text-gray-600">{tutorProfile.bio}</p>
                  </div>
                )}

                {tutorProfile.availability && tutorProfile.availability.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Availability:</p>
                    <p className="text-gray-600">{tutorProfile.availability.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Sessions Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Sessions</h2>

          {tutorBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <p className="text-xl text-gray-600">No upcoming sessions</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {tutorBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary/10 p-3 rounded-full">
                        <User className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {booking.studentName}
                        </h3>
                        <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span>{formatDate(booking.date)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{formatTime(booking.time)}</span>
                      <span className="text-gray-400">•</span>
                      <span>{booking.duration} minutes</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span className="text-lg font-semibold text-gray-900">
                        ₹{booking.amount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;

