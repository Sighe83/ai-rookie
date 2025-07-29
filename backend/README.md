# AI Rookie Backend

Node.js backend API for the AI Rookie B2B/B2C tutoring platform.

## Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Tutor Management** - Create and manage tutor profiles and sessions
- **Booking System** - Handle individual and group session bookings
- **Availability Management** - Real-time availability tracking and time slot booking
- **B2B/B2C Support** - Different pricing and features for different user types
- **Rate Limiting** - API protection against abuse
- **Error Handling** - Comprehensive error handling and logging

## Tech Stack

- **Node.js** with Express.js
- **PostgreSQL** database
- **Prisma** ORM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Helmet** for security headers
- **CORS** for cross-origin requests

## Setup

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL database
- Git

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and secrets
   ```

3. Set up the database:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed the database with sample data
   npm run seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

### Tutors
- `GET /api/tutors` - Get all tutors
- `GET /api/tutors/:id` - Get specific tutor

### Availability
- `GET /api/availability/:tutorId` - Get tutor availability
- `POST /api/availability/:tutorId` - Update tutor availability
- `PATCH /api/availability/:tutorId/:date/book` - Book time slot

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get specific booking
- `PATCH /api/bookings/:id/status` - Update booking status

## Database Schema

The database includes these main models:
- **User** - System users (customers, tutors, admins)
- **Tutor** - Tutor profiles and pricing
- **Session** - Available training sessions
- **Booking** - Session bookings with contact info
- **TutorAvailability** - Available time slots per tutor/date

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data
- `npx prisma studio` - Open Prisma Studio for database management
- `npx prisma migrate dev` - Run database migrations

## Environment Variables

See `.env.example` for all required environment variables.

## Security Features

- JWT authentication with configurable expiration
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Helmet security headers
- Input validation and sanitization