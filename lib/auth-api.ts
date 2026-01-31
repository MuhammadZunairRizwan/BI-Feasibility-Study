import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';

export interface AuthUser {
  uid: string;
  email: string | undefined;
  name: string | undefined;
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];

    // If Firebase Admin is not configured, decode the token without verification
    // This is for development only - in production, always use Firebase Admin
    if (!adminAuth) {
      console.warn('Firebase Admin not configured. Skipping token verification (dev mode).');

      // Decode JWT without verification (for development only)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          return {
            uid: payload.user_id || payload.sub,
            email: payload.email,
            name: payload.name,
          };
        }
      } catch (decodeError) {
        console.error('Failed to decode token:', decodeError);
        return null;
      }
      return null;
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}
