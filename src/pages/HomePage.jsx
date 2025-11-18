import { Video, Shield, Calendar } from 'lucide-react';
import { indianLanguages } from '../data/sampleData';

const HomePage = ({ navigateTo }) => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Learn Any Indian Language From Expert Tutors
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            Connect with verified tutors for personalized 1-on-1 sessions in 22+ Indian languages
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigateTo('browse')}
              className="bg-white text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Find Your Tutor
            </button>
            <button
              onClick={() => navigateTo('register')}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Become a Tutor
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Why Choose BhashaConnect?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Video Sessions</h3>
              <p className="text-gray-600">
                Interactive one-on-one video lessons with real-time feedback and personalized attention
              </p>
            </div>
            <div className="text-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Tutors</h3>
              <p className="text-gray-600">
                All tutors are verified professionals with proven experience and excellent ratings
              </p>
            </div>
            <div className="text-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600">
                Book sessions at your convenience with flexible time slots to fit your schedule
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Languages We Offer
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {indianLanguages.map((language) => (
              <span
                key={language}
                className="bg-white px-6 py-3 rounded-full text-gray-700 font-medium shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:bg-primary hover:text-white"
              >
                {language}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2024 BhashaConnect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

