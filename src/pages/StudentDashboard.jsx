import { Calendar, Clock, DollarSign, User } from 'lucide-react';

const StudentDashboard = ({ navigateTo, currentUser, bookings }) => {
  // Filter bookings for current student
  const studentBookings = bookings.filter(
    (booking) => booking.studentEmail === currentUser?.email
  );

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
            Welcome, {currentUser?.name || 'Student'}!
          </h1>
          <p className="text-gray-600">
            You have {studentBookings.length} upcoming session{studentBookings.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <button
            onClick={() => navigateTo('browse')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors shadow-lg"
          >
            Book New Session
          </button>
        </div>

        {/* Bookings Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Upcoming Sessions</h2>

          {studentBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <p className="text-xl text-gray-600 mb-4">No sessions booked yet</p>
              <button
                onClick={() => navigateTo('browse')}
                className="text-primary hover:underline font-semibold"
              >
                Browse Tutors
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {studentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {booking.tutorName}
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

                  <div className="mt-6 pt-4 border-t flex gap-3">
                    <button
                      onClick={() => alert('Reschedule feature coming soon!')}
                      className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => alert('Cancel feature coming soon!')}
                      className="flex-1 border border-red-300 text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
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

export default StudentDashboard;

