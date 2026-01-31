'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAK7FvjvR0Y1kcOvXInie18zQVILGsbRaY",
  authDomain: "feasibility-report-making.firebaseapp.com",
  projectId: "feasibility-report-making",
  storageBucket: "feasibility-report-making.firebasestorage.app",
  messagingSenderId: "587575695198",
  appId: "1:587575695198:web:bb6de3ca3146493da8a1cf",
  measurementId: "G-XFE095YR7S"
};

// Initialize Firebase (client-side only)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
