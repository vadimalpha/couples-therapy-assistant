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
      } else {
        // User is signed out, clear localStorage
        this.clearLocalStorage();
      }
    });
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
}

// Export singleton instance
export default new AuthSystem();
