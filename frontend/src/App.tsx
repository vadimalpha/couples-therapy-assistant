import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import authSystem from './auth/AuthSystem';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ConflictStartPage from './pages/ConflictStartPage';
import GuidancePage from './pages/GuidancePage';
import ProfilePage from './pages/ProfilePage';
import IntakePage from './pages/IntakePage';
import { ExplorationChat } from './components/conflict';
import { IntakeChat, IntakeSummary } from './components/intake';
import './App.css';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to Couples Therapy Assistant</h1>
      <p>You are signed in as: {user.email}</p>
      <button
        onClick={async () => {
          await authSystem.signOut();
        }}
        style={{
          padding: '10px 20px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '20px'
        }}
      >
        Sign Out
      </button>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conflicts/new"
            element={
              <ProtectedRoute>
                <ConflictStartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conflicts/:id/explore"
            element={
              <ProtectedRoute>
                <ExplorationChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conflicts/:id/guidance"
            element={
              <ProtectedRoute>
                <GuidancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intake"
            element={
              <ProtectedRoute>
                <IntakePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intake/chat"
            element={
              <ProtectedRoute>
                <IntakeChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intake/summary"
            element={
              <ProtectedRoute>
                <IntakeSummary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
