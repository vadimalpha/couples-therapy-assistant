import { Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest } from '../types';

let firebaseInitialized = false;

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

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
