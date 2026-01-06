import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ConflictStartPage from './pages/ConflictStartPage';
import JointGuidancePage from './pages/JointGuidancePage';
import ProfilePage from './pages/ProfilePage';
import IntakePage from './pages/IntakePage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import AdminLogsPage from './pages/AdminLogsPage';
import AdminPromptsPage from './pages/AdminPromptsPage';
import UnifiedChatPage from './pages/UnifiedChatPage';
import { IntakeSummary } from './components/intake';
import { CrisisFooter, AppHeader } from './components/layout';
import './App.css';
import './styles/accessibility.css';

const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  // Wait for auth to finish loading before redirecting
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <AppHeader />
      {children}
    </>
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

// Check if current route is a full-page chat experience
const isChatRoute = (pathname: string): boolean => {
  // Match chat routes: /chat/:sessionType, /conflicts/:id/joint-guidance
  const chatPatterns = [
    /^\/chat\/[^/]+$/,  // Unified chat route: /chat/intake, /chat/exploration, etc.
    /^\/conflicts\/[^/]+\/joint-guidance$/,  // Keep joint guidance as separate view
  ];
  return chatPatterns.some(pattern => pattern.test(pathname));
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const showFooter = !isChatRoute(location.pathname);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <div style={{ flex: '1 0 auto' }}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />

          {/* Protected routes with header */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <DashboardPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/conflicts/new"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <ConflictStartPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/conflicts/:id/joint-guidance"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <JointGuidancePage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/intake"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <IntakePage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/intake/summary"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <IntakeSummary />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <ProfilePage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <AdminLogsPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/prompts"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <AdminPromptsPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          {/* Unified chat route - handles all chat types */}
          <Route
            path="/chat/:sessionType"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <UnifiedChatPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      {showFooter && <CrisisFooter />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
