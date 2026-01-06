import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
  type Unsubscribe
} from 'firebase/auth';
import { auth } from './firebase-config';

interface UserData {
  uid: string;
  email: string;
  displayName: string | null;
}

interface TestLoginUser {
  id: string;
  email: string;
  displayName: string;
  firebaseUid: string;
}

interface TestLoginResponse {
  success: boolean;
  token: string;
  user: TestLoginUser;
}

class AuthSystem {
  private googleProvider: GoogleAuthProvider;

  constructor() {
    this.googleProvider = new GoogleAuthProvider();
    this.initializeAuthStateListener();
  }

  /**
   * Initialize auth state listener to sync with localStorage
   */
  private initializeAuthStateListener(): void {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, store data in localStorage
        const token = await user.getIdToken();
        localStorage.setItem('firebaseUID', user.uid);
        localStorage.setItem('firebaseToken', token);
        localStorage.setItem('userName', user.displayName || '');
        localStorage.setItem('userEmail', user.email || '');

        // Auto-sync user to backend database
        this.syncUserToBackend(token).catch((err) => {
          console.error('Failed to sync user to backend:', err);
        });
      } else {
        // User is signed out, clear localStorage
        this.clearLocalStorage();
      }
    });
  }

  /**
   * Sync user to backend database
   * This ensures the user exists in SurrealDB for relationships and other features
   */
  private async syncUserToBackend(token: string): Promise<void> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${API_URL}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok && response.status !== 429) {
        // Log but don't throw for non-critical sync failures (except rate limiting)
        const errorData = await response.json().catch(() => ({}));
        console.warn('User sync response:', response.status, errorData);
      }
    } catch (err) {
      // Network error - log but don't throw
      console.warn('User sync network error:', err);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<UserCredential> {
    try {
      const userCredential = await signInWithPopup(auth, this.googleProvider);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      this.clearLocalStorage();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clear authentication data from localStorage
   */
  private clearLocalStorage(): void {
    localStorage.removeItem('firebaseUID');
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
  }

  /**
   * Require authentication - redirect if not authenticated
   */
  requireAuth(redirectTo: string = '/login'): void {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = redirectTo;
    }
  }

  /**
   * Get current user object
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Get current user data from Firebase
   */
  getCurrentUserData(): UserData | null {
    const user = auth.currentUser;
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName
    };
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Refresh the current user's ID token
   */
  async refreshToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const token = await user.getIdToken(true);
      localStorage.setItem('firebaseToken', token);
      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Get the current token from localStorage
   */
  getStoredToken(): string | null {
    return localStorage.getItem('firebaseToken');
  }

  /**
   * Get the current user ID from localStorage
   */
  getStoredUserId(): string | null {
    return localStorage.getItem('firebaseUID');
  }

  /**
   * Test login - bypasses Firebase for admin testing
   * Uses email + "password" to log in as any existing user
   */
  async testLogin(email: string, password: string): Promise<TestLoginUser> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const response = await fetch(`${API_URL}/api/auth/test-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Test login failed' }));
      throw new Error(error.error || 'Test login failed');
    }

    const data: TestLoginResponse = await response.json();

    // Store test token and user info in localStorage
    localStorage.setItem('firebaseToken', data.token);
    localStorage.setItem('firebaseUID', data.user.firebaseUid);
    localStorage.setItem('userName', data.user.displayName);
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('isTestLogin', 'true');

    return data.user;
  }

  /**
   * Check if current session is a test login
   */
  isTestLogin(): boolean {
    return localStorage.getItem('isTestLogin') === 'true';
  }

  /**
   * Get test user from localStorage if in test login mode
   */
  getTestUser(): TestLoginUser | null {
    if (!this.isTestLogin()) return null;

    const token = localStorage.getItem('firebaseToken');
    const uid = localStorage.getItem('firebaseUID');
    const email = localStorage.getItem('userEmail');
    const displayName = localStorage.getItem('userName');

    if (!token || !uid || !email) return null;

    return {
      id: '', // Not stored, but not needed for display
      firebaseUid: uid,
      email,
      displayName: displayName || email.split('@')[0]
    };
  }

  /**
   * Get list of users for test login selection
   */
  async getTestUsers(): Promise<Array<{ id: string; email: string; displayName: string }>> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const response = await fetch(`${API_URL}/api/auth/test-users`);

    if (!response.ok) {
      throw new Error('Failed to fetch test users');
    }

    const data = await response.json();
    return data.users;
  }

  /**
   * Clear test login session
   */
  clearTestLogin(): void {
    this.clearLocalStorage();
    localStorage.removeItem('isTestLogin');
  }
}

// Export singleton instance
export default new AuthSystem();
