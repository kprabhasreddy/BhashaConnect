# BhashaConnect

A marketplace platform connecting students with language tutors for personalized 1-on-1 sessions in Indian languages. This is the MVP version with full backend integration, real authentication, and database persistence.

## What I Built

I started with a frontend prototype to validate the concept, then built out a complete backend system. Right now you can:

- **Register and login** - Real authentication with email verification via Supabase
- **Browse tutors** - See all active tutors pulled from the database
- **Book sessions** - Create bookings with availability checking and automatic price calculation
- **View dashboards** - Students see their bookings, tutors see their profile and stats
- **Payment integration** - Razorpay setup (currently in mock mode for testing)

The frontend is a React app, and I built an Express.js backend that connects to Supabase for the database and authentication. Everything persists now - no more losing data on refresh.

## Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account (for database/auth)
- Resend account (for emails - optional)

### Running Locally

1. **Clone the repo**
   ```bash
   git clone <your-repo-url>
   cd BhashaConnect
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   ```
   
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=your_resend_key
   JWT_SECRET=your_random_secret
   ```

   Run the database migration in Supabase SQL Editor:
   ```bash
   # Copy contents of backend/migrations/001_initial_schema.sql
   # Paste into Supabase SQL Editor and run
   ```

   Start the backend server:
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

3. **Set up the frontend**
   ```bash
   # From project root
   npm install
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

4. **Test it out**
   - Register a new account (student or tutor)
   - Check your email for verification (if email service is configured)
   - Login and browse tutors
   - Book a session

## Tech Stack

**Frontend:**
- React 18 with hooks
- Tailwind CSS for styling
- Vite for building
- Custom API service layer for backend calls

**Backend:**
- Express.js REST API
- Supabase (PostgreSQL database + authentication)
- JWT tokens for session management
- Zod for input validation
- Resend for email notifications

**Other:**
- Razorpay for payments (mock mode available)
- Rate limiting for security
- CORS configured for frontend-backend communication

## Project Structure

```
BhashaConnect/
├── src/                          # Frontend React app
│   ├── components/              # Reusable components
│   ├── pages/                   # Main page components
│   ├── utils/
│   │   └── api.js               # API service layer
│   └── App.jsx                  # Main app with state management
│
├── backend/                     # Express.js backend
│   ├── src/
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.js          # Registration, login, password reset
│   │   │   ├── users.js         # User profile management
│   │   │   ├── tutors.js        # Tutor profiles and search
│   │   │   ├── bookings.js      # Booking creation and management
│   │   │   ├── payments.js      # Razorpay integration
│   │   │   └── reviews.js       # Review system
│   │   ├── services/            # Business logic
│   │   │   ├── booking.js       # Availability checking, price calc
│   │   │   ├── payment.js       # Payment processing
│   │   │   ├── review.js        # Rating calculations
│   │   │   └── email.js         # Email templates and sending
│   │   ├── middleware/          # Auth middleware, validation
│   │   └── config/              # Supabase config, constants
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
│
└── DEMO_GUIDE.md                # Guide for demo presentation
```

## Features

### Authentication
- User registration (students and tutors)
- Email verification
- Login with JWT tokens
- Password reset flow
- Role-based access control

### Tutor Management
- Tutor profile creation with languages, rates, bio
- Availability management
- Public tutor listing
- Search and filtering (basic - can be enhanced)

### Booking System
- Create bookings with date/time selection
- Availability checking (prevents double bookings)
- Automatic price calculation (tutor rate + platform fee)
- Booking status tracking
- Conflict detection

### Payments
- Razorpay integration
- Order creation and verification
- Webhook handling for payment status
- Mock mode for testing without real payments

### Reviews
- Submit reviews after sessions
- Rating calculation (average ratings)
- Review display on tutor profiles

### Email Notifications
- Welcome emails
- Email verification
- Booking confirmations
- Review notifications
- (Requires Resend API key to actually send)

## Database Schema

The database has 8 main tables:
- `users` - User accounts and profiles
- `tutor_profiles` - Tutor-specific information
- `availability` - Tutor availability schedules
- `bookings` - Session bookings
- `payments` - Payment records
- `reviews` - Student reviews of tutors
- `messages` - Messaging between users (schema ready, endpoints stubbed)
- `email_logs` - Email sending history

All tables have proper foreign keys, indexes, and Row Level Security policies.

## API Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify-email` - Verify email

**Tutors:**
- `GET /api/tutors` - List all active tutors
- `GET /api/tutors/:id` - Get tutor profile
- `POST /api/tutors/profile` - Create tutor profile (tutors only)
- `PUT /api/tutors/profile` - Update tutor profile

**Bookings:**
- `POST /api/bookings` - Create booking (students only)
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking

**Payments:**
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Razorpay webhook handler

**Reviews:**
- `POST /api/reviews` - Submit review
- `GET /api/reviews/tutor/:tutorId` - Get tutor reviews

All endpoints require authentication except public tutor listing. Check the backend code for exact request/response formats.

## Current Limitations

This is an MVP, so some features are still in progress:

- **Messaging system** - Schema is ready but endpoints are stubbed
- **Advanced search** - Basic search works, but filters/sorting need enhancement
- **Admin dashboard** - Endpoints exist but UI not built
- **File uploads** - Profile pictures not implemented yet
- **Timezone handling** - Uses local time, no UTC conversion (important for production)
- **Payment testing** - Using mock mode since I don't have Razorpay test account

## What's Next

Priority items for production:
1. Complete messaging system
2. Add advanced tutor search with filters
3. Implement timezone handling
4. Add profile picture uploads
5. Build admin dashboard UI
6. Add booking cancellation with refunds
7. Email notification improvements
8. Mobile app (maybe React Native)

## Development Notes

- The frontend uses React hooks for state management
- Backend uses Express with async/await patterns
- All database queries go through Supabase client
- JWT tokens are stored in browser storage
- Rate limiting is enabled on auth endpoints
- CORS is configured to allow frontend-backend communication

## Demo

See `DEMO_GUIDE.md` for a walkthrough of how to present this to stakeholders. The guide covers all the main user flows and anticipated questions.

## License

This is a project for demonstration purposes.

---

Built for connecting students with Indian language tutors. Still a work in progress, but the core functionality is there and working.
