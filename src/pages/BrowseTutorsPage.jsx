import { useState, useMemo } from 'react';
import { Star, Search } from 'lucide-react';
import { indianLanguages } from '../data/sampleData';

const BrowseTutorsPage = ({
  navigateTo,
  tutors,
  currentUser,
  searchTerm,
  setSearchTerm,
  selectedLanguage,
  setSelectedLanguage,
  setSelectedTutor,
  loading,
}) => {
  // Filter tutors based on search term and language
  const filteredTutors = useMemo(() => {
    return tutors.filter((tutor) => {
      const matchesSearch =
        searchTerm === '' ||
        tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.languages.some((lang) =>
          lang.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesLanguage =
        selectedLanguage === 'all' ||
        tutor.languages.includes(selectedLanguage);

      return matchesSearch && matchesLanguage;
    });
  }, [tutors, searchTerm, selectedLanguage]);

  const handleBookSession = (tutor) => {
    if (!currentUser) {
      alert('Please login to book a session');
      navigateTo('login');
      return;
    }
    setSelectedTutor(tutor);
    navigateTo('booking');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900">
          Find Your Perfect Language Tutor
        </h1>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or language..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Language Filter */}
            <div className="md:w-64">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Languages</option>
                {indianLanguages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {loading ? (
          <p className="text-gray-600 mb-6">Loading tutors...</p>
        ) : (
          <p className="text-gray-600 mb-6">
            Found {filteredTutors.length} tutor{filteredTutors.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Tutor Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Loading tutors...</p>
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-xl text-gray-600">No tutors found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedLanguage('all');
              }}
              className="mt-4 text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor) => (
              <div
                key={tutor.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
              >
                {/* Avatar and Name */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">{tutor.avatar}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{tutor.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {tutor.rating}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({tutor.reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {tutor.languages.map((language) => (
                    <span
                      key={language}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {language}
                    </span>
                  ))}
                </div>

                {/* Bio */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tutor.bio}</p>

                {/* Experience */}
                <p className="text-sm text-gray-500 mb-4">
                  Experience: {tutor.experience}
                </p>

                {/* Availability */}
                {tutor.availability && tutor.availability.length > 0 && (
                  <p className="text-sm text-gray-500 mb-4">
                    Available: {tutor.availability.join(', ')}
                  </p>
                )}

                {/* Hourly Rate and Book Button */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{tutor.hourlyRate}
                    </span>
                    <span className="text-gray-500 text-sm">/hour</span>
                  </div>
                  <button
                    onClick={() => handleBookSession(tutor)}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-light transition-colors"
                  >
                    Book Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseTutorsPage;

