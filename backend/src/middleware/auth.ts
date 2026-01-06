import { Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { AuthenticatedRequest } from '../types';

let firebaseInitialized = false;

// Test token prefix for admin test login
export const TEST_TOKEN_PREFIX = 'TEST_TOKEN:';

export function initializeFirebase(): void {
  if (firebaseInitialized) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error('Missing Firebase configuration. Check environment variables.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      clientEmail,
    }),
  });

  firebaseInitialized = true;
  console.log('Firebase Admin SDK initialized');
}

/**
 * Decode and validate a test token
 * Format: TEST_TOKEN:base64url({firebaseUid, email, userId, timestamp})
 */
export function decodeTestToken(token: string): DecodedIdToken | null {
  try {
    let payload = token.substring(TEST_TOKEN_PREFIX.length);
    // Convert URL-safe base64 back to standard base64
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (payload.length % 4) {
      payload += '=';
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));

    // Basic validation
    if (!decoded.firebaseUid || !decoded.email || !decoded.userId) {
      return null;
    }

    // Check token age (valid for 24 hours)
    const tokenAge = Date.now() - decoded.timestamp;
    if (tokenAge > 24 * 60 * 60 * 1000) {
      console.warn('[TEST_LOGIN] Token expired');
      return null;
    }

    // Create a synthetic DecodedIdToken
    const now = Math.floor(Date.now() / 1000);
    return {
      uid: decoded.firebaseUid,
      email: decoded.email,
      aud: 'test-login',
      auth_time: now,
      exp: now + 3600,
      iat: now,
      iss: 'test-login',
      sub: decoded.firebaseUid,
      firebase: { sign_in_provider: 'test-login', identities: {} },
    } as DecodedIdToken;
  } catch (error) {
    console.error('Failed to decode test token:', error);
    return null;
  }
}

export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  // Check for test token
  if (token.startsWith(TEST_TOKEN_PREFIX)) {
    const decoded = decodeTestToken(token);
    if (decoded) {
      console.log(`[TEST_LOGIN] Authenticated as ${decoded.email}`);
      req.user = decoded;
      next();
      return;
    }
    res.status(401).json({ error: 'Invalid test token' });
    return;
  }

  // Regular Firebase token verification
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
