# Couples Therapy Assistant - Frontend

React + TypeScript frontend with Firebase authentication.

## Prerequisites

- Node.js 18+ (project uses Firebase which requires Node 20+, but will run with warnings on 18)
- npm

## Installation

```bash
npm install --cache /tmp/.npm-cache
```

Note: Using a temporary cache location to avoid npm cache permission issues.

## Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── auth/
│   ├── firebase-config.ts   # Firebase initialization
│   ├── AuthSystem.ts         # Auth service class (BOR pattern)
│   └── AuthContext.tsx       # React auth context provider
├── components/
│   ├── LoginPage.tsx         # Login page component
│   ├── SignupPage.tsx        # Signup page component
│   └── Auth.css             # Auth pages styling
├── App.tsx                   # Main app with routing
└── main.tsx                  # App entry point
```

## Features

- Email/Password authentication
- Google Sign-In
- Protected routes
- Auth state management
- Token refresh handling
- localStorage persistence

## Firebase Configuration

The app is configured to use the Firebase project:
- Project ID: weiu-fbfe2
- Auth Domain: weiu-fbfe2.firebaseapp.com

## Authentication Flow

1. User visits app
2. If not authenticated, redirected to `/login`
3. User can sign in or sign up with email/password or Google
4. After authentication, user data stored in localStorage:
   - `firebaseUID`
   - `firebaseToken`
   - `userName`
   - `userEmail`
5. User redirected to home page
6. Protected routes check auth state
7. Token automatically refreshed as needed

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies

- React 18
- TypeScript
- Vite
- Firebase Auth
- React Router
