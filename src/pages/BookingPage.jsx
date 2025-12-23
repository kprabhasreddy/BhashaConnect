import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, DollarSign } from 'lucide-react';

const BookingPage = ({ navigateTo, tutor, currentUser, onBooking }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: 60,
  });
  const [errors, setErrors] = useState({});

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Calculate total amount
  const calculateTotal = () => {
    if (!tutor || !formData.duration) return 0;
    return Math.round((tutor.hourlyRate * formData.duration) / 60);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.date);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      if (selectedDate < todayDate) {
        newErrors.date = 'Date cannot be in the past';
      }
    }

    if (!formData.time) {
      newErrors.time = 'Please select a time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const bookingData = {
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration),
        amount: calculateTotal(),
        notes: '',
      };
      await onBooking(bookingData);
    }
  };

  if (!tutor) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xl text-gray-600 mb-4">No tutor selected</p>
          <button
            onClick={() => navigateTo('browse')}
            className="text-primary hover:underline"
          >
            Browse Tutors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigateTo('browse')}
          className="flex items-center text-gray-600 hover:text-primary mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Tutors
        </button>

        {/* Tutor Summary Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{tutor.avatar}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{tutor.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {tutor.languages.map((language) => (
                  <span
                    key={language}
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {language}
                  </span>
                ))}
              </div>
              <p className="text-xl font-semibold text-gray-900 mt-2">
                ₹{tutor.hourlyRate}/hour
              </p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Book Your Session</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Picker */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-5 w-5" />
                Select Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={today}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Time Picker */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-5 w-5" />
                Select Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time}</p>
              )}
            </div>

            {/* Duration Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>

            {/* Total Amount Display */}
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-primary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  <span className="text-lg font-medium text-gray-700">Total Amount:</span>
                </div>
                <span className="text-3xl font-bold text-primary">
                  ₹{calculateTotal()}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formData.duration} minutes × ₹{tutor.hourlyRate}/hour
              </p>
            </div>

            {/* Confirm Button */}
            <button
              type="submit"
              className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-light transition-colors shadow-lg"
            >
              Confirm Booking
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;

