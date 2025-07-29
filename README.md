# AI Rookie Enterprise

A full-featured B2B platform for AI training and workshops.

## Setup Instructions

1. **Fix npm permissions first** (if needed):
   ```bash
   sudo chown -R $(whoami) ~/.npm
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Features

- ✅ **Responsive Design** - Works on all devices
- ✅ **React Router** - Proper navigation with URLs
- ✅ **Form Validation** - Real-time validation with error messages
- ✅ **Local Storage** - Persistent booking data
- ✅ **Loading States** - Better UX with loading indicators
- ✅ **Mobile Menu** - Hamburger menu for mobile devices
- ✅ **Error Handling** - Proper error states and messages
- ✅ **Booking System** - Complete booking flow with confirmation

## Pages

- **Home** (`/`) - Landing page with hero section and testimonials
- **Tutors** (`/tutors`) - Browse experts and their workshops
- **Booking** (`/booking`) - Book workshops with form validation
- **Booking Success** (`/booking-success`) - Confirmation page
- **Dashboard** (`/dashboard`) - View bookings and statistics

## Technical Stack

- **React 18** - Modern React with hooks
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool
- **Lucide React** - Beautiful icons
- **Local Storage** - Data persistence

## Project Structure

```
src/
├── App.jsx          # Main application component
├── main.jsx         # React entry point
└── index.css        # Global styles with Tailwind
```

## Key Features Implemented

### 1. State Management
- Custom hooks for booking state
- Local storage integration
- Form state management

### 2. Routing
- React Router for navigation
- Route-based page rendering
- State passing between routes

### 3. Form Validation
- Real-time validation
- Error message display
- Required field validation
- Email format validation

### 4. Responsive Design
- Mobile-first approach
- Responsive navigation
- Touch-friendly interface

### 5. User Experience
- Loading states
- Success confirmations
- Error handling
- Smooth transitions

## Usage

The app is a complete B2B booking platform where companies can:

1. Browse AI experts and their workshops
2. Book workshops in different formats (1-on-1, team, or program)
3. Fill out detailed booking forms with validation
4. View booking confirmations and manage bookings
5. Access a dashboard with booking statistics

All booking data is stored locally and persists between sessions.