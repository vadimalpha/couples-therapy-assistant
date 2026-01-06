import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import authSystem from './AuthSystem';

// Extended user type that can be either Firebase User or test login user
interface TestUser {
  uid: string;
  email: string;
  displayName: string | null;
  isTestUser: true;
  getIdToken: () => Promise<string>;
}

export type AuthUser = User | TestUser;

// Type guard to check if user is a test user
export function isTestUser(user: AuthUser | null): user is TestUser {
  return user !== null && 'isTestUser' in user && user.isTestUser === true;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isTestLogin: boolean;
  setError: (error: string | null) => void;
  signOut: () => Promise<void>;
  testLogin: (email: string, password: string) => Promise<void>;
  refreshTestLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTestLogin, setIsTestLogin] = useState<boolean>(false);

  // Check for existing test login on mount
  const checkTestLogin = useCallback(() => {
    if (authSystem.isTestLogin()) {
      const testUser = authSystem.getTestUser();
      if (testUser) {
        setUser({
          uid: testUser.firebaseUid,
          email: testUser.email,
          displayName: testUser.displayName,
          isTestUser: true,
          getIdToken: async () => authSystem.getStoredToken() || ''
        });
        setIsTestLogin(true);
        setLoading(false);
        return true;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    // First check for test login
    if (checkTestLogin()) {
      return;
    }

    // Subscribe to Firebase auth state changes
    const unsubscribe = authSystem.onAuthStateChanged((firebaseUser) => {
      // Only update if not in test login mode
      if (!authSystem.isTestLogin()) {
        setUser(firebaseUser);
        setIsTestLogin(false);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [checkTestLogin]);

  const handleSignOut = async () => {
    if (isTestLogin) {
      authSystem.clearTestLogin();
      setUser(null);
      setIsTestLogin(false);
    } else {
      await authSystem.signOut();
    }
  };

  const handleTestLogin = async (email: string, password: string) => {
    try {
      const testUser = await authSystem.testLogin(email, password);
      setUser({
        uid: testUser.firebaseUid,
        email: testUser.email,
        displayName: testUser.displayName,
        isTestUser: true,
        getIdToken: async () => authSystem.getStoredToken() || ''
      });
      setIsTestLogin(true);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test login failed';
      setError(message);
      throw err;
    }
  };

  const refreshTestLogin = () => {
    checkTestLogin();
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    isTestLogin,
    setError,
    signOut: handleSignOut,
    testLogin: handleTestLogin,
    refreshTestLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
