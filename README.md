# BhashaConnect - Frontend Prototype

A functional frontend prototype for BhashaConnect, an Indian language tutoring marketplace. This is a demonstration prototype built to showcase core user flows to stakeholders.

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📋 Project Overview

BhashaConnect is a marketplace platform connecting students with language tutors for personalized 1-on-1 sessions in 22+ Indian languages.

### Technology Stack

- **Framework:** React 18+ with functional components and hooks
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React useState (in-memory state)
- **Icons:** Lucide React
- **Routing:** Single-page app with view switching (no React Router)

## 🎯 Features

### Core Pages/Views

1. **Landing Page** - Hero section, features, and language showcase
2. **User Registration** - Separate forms for Students and Tutors
3. **Login Page** - Authentication for both user types
4. **Browse Tutors** - Search and filter tutors by language
5. **Booking Page** - Schedule sessions with date/time selection and price calculation
6. **Student Dashboard** - View upcoming sessions and manage bookings
7. **Tutor Dashboard** - Profile management, earnings, and session overview
8. **Mobile Responsive Menu** - Hamburger menu for mobile devices

### Key Functionality

- ✅ User registration (Student/Tutor)
- ✅ Mock authentication (accepts any credentials)
- ✅ Real-time search and filtering
- ✅ Session booking with automatic price calculation
- ✅ Dashboard views for both user types
- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Modern, polished UI with Tailwind CSS

## 📁 Project Structure

```
BhashaConnect/
├── src/
│   ├── components/
│   │   └── Navigation.jsx          # Reusable navigation component
│   ├── pages/
│   │   ├── HomePage.jsx            # Landing page
│   │   ├── LoginPage.jsx           # Login page
│   │   ├── RegisterPage.jsx        # Registration page
│   │   ├── BrowseTutorsPage.jsx    # Tutor marketplace
│   │   ├── BookingPage.jsx         # Session booking
│   │   ├── StudentDashboard.jsx    # Student dashboard
│   │   └── TutorDashboard.jsx      # Tutor dashboard
│   ├── data/
│   │   └── sampleData.js           # Sample tutor data and language list
│   ├── App.jsx                     # Main app component with state management
│   ├── main.jsx                    # Entry point
│   ├── index.css                   # Tailwind CSS imports
│   └── App.css                     # Custom styles (minimal)
├── public/                         # Static assets
├── index.html                      # HTML template
├── tailwind.config.js              # Tailwind configuration
├── postcss.config.js               # PostCSS configuration
├── vite.config.js                  # Vite configuration
└── package.json                    # Dependencies and scripts
```

## 🗂️ State Management

The app uses React's `useState` hook for state management. All state is stored in the main `App.jsx` component:

- `currentUser` - Currently logged-in user (null if not logged in)
- `view` - Current page/view being displayed
- `tutors` - Array of all tutors (includes sample data)
- `bookings` - Array of all bookings
- `selectedTutor` - Tutor selected for booking
- `searchTerm` - Search query for filtering tutors
- `selectedLanguage` - Selected language filter

**Note:** State is stored in memory only and will reset on page refresh. No localStorage or sessionStorage is used.

## 📊 Sample Data

The app includes 8 diverse sample tutors covering multiple Indian languages:

1. Priya Sharma - Hindi, English (₹500/hr, 4.8⭐)
2. Rajesh Kumar - Tamil, English (₹600/hr, 4.9⭐)
3. Anjali Reddy - Telugu (₹550/hr, 4.9⭐)
4. Vikram Patel - Gujarati, Hindi (₹450/hr, 4.7⭐)
5. Sneha Das - Bengali (₹480/hr, 4.8⭐)
6. Arjun Menon - Malayalam (₹520/hr, 4.6⭐)
7. Kavya Rao - Kannada, English (₹580/hr, 4.9⭐)
8. Harpreet Singh - Punjabi, Hindi (₹470/hr, 4.7⭐)

## 🎨 Design System

### Color Palette

- **Primary:** Orange (#EA580C, #F97316)
- **Secondary:** Green (#16A34A, #22C55E)
- **Neutral:** Gray scale for text and backgrounds
- **Success:** Green
- **Warning:** Yellow
- **Error:** Red

### Typography

- Headings: Bold, large (2xl-6xl)
- Body: Regular weight, readable size (base to lg)
- Buttons: Semibold

### Responsive Breakpoints

- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (3 columns for tutor grid)

## 🔄 User Flows

### Flow 1: Student Books First Session

1. Land on homepage → Click "Find Your Tutor"
2. Browse tutors → Search/filter as needed
3. Click "Book Session" → Redirected to Login (if not logged in)
4. Register as Student → Automatically logged in
5. Return to Browse → Click "Book Session" again
6. Fill booking form → Confirm booking
7. View booking in Student Dashboard

### Flow 2: Tutor Registers

1. Land on homepage → Click "Register"
2. Select "Tutor" tab → Fill tutor-specific fields
3. Submit form → Taken to Tutor Dashboard
4. View profile and stats

### Flow 3: Returning User Logs In

1. Land on homepage → Click "Sign In"
2. Select user type → Enter credentials
3. Click "Sign In" → Navigate to appropriate dashboard

## ⚠️ Known Limitations

This is a **prototype** and does NOT include:

- ❌ Backend/API integration
- ❌ Real database
- ❌ Payment processing
- ❌ Email functionality
- ❌ Video calling
- ❌ File uploads
- ❌ Data persistence after page refresh
- ❌ Real user authentication security
- ❌ Password encryption
- ❌ localStorage/sessionStorage

## 🧪 Testing Checklist

### Functionality
- [x] Can register as student
- [x] Can register as tutor
- [x] Can login (any credentials work)
- [x] Can browse all tutors
- [x] Search filters tutors correctly
- [x] Language filter works
- [x] Can book a session (when logged in)
- [x] Booking price calculates correctly
- [x] Booking appears in student dashboard
- [x] Can logout and login again
- [x] Tutor sees their dashboard correctly

### Responsive Design
- [x] Works on mobile (375px width)
- [x] Works on tablet (768px width)
- [x] Works on desktop (1440px width)
- [x] Mobile menu works
- [x] Text is readable at all sizes
- [x] Buttons are tappable on mobile

## 📝 Development Notes

- All forms include basic validation
- Mock authentication accepts any email/password combination
- Booking prices are calculated automatically based on hourly rate and duration
- Tutor registration automatically adds the tutor to the tutors list
- State persists across views but resets on page refresh

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📄 License

This is a prototype project for demonstration purposes.

## 👤 Contact

For questions or clarifications about this prototype, please refer to the project documentation or contact the development team.

---

**Built with ❤️ for BhashaConnect**
