import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

// Check if we have valid Firebase Admin credentials
const hasValidCredentials = () => {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  return (
    clientEmail &&
    privateKey &&
    !clientEmail.includes('xxxxx') &&
    !privateKey.includes('YOUR_PRIVATE_KEY_HERE')
  );
};

// Initialize Firebase Admin (for server-side operations)
try {
  if (hasValidCredentials()) {
    adminApp = getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId: "feasibility-report-making",
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        })
      : getApps()[0];

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    console.log('Firebase Admin initialized successfully');
  } else {
    console.warn('Firebase Admin credentials not configured. Server-side auth verification will be skipped.');
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
}

export { adminApp, adminAuth, adminDb };
