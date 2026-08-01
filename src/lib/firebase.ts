import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase Web API keys are publishable identifiers (not secrets); access is
// enforced by the Realtime Database security rules in FIREBASE_SECURITY_RULES.md.
const firebaseConfig = {
  apiKey: "AIzaSyDpvbDFwLGrSzqEZuDvqvjUQjPQhCwaSqg",
  authDomain: "lovable-animestream.firebaseapp.com",
  databaseURL: "https://lovable-animestream-default-rtdb.firebaseio.com",
  projectId: "lovable-animestream",
  storageBucket: "lovable-animestream.firebasestorage.app",
  messagingSenderId: "1019848045009",
  appId: "1:1019848045009:web:958a3b6ec13ecfec1df0f0",
  measurementId: "G-V50DSDQECW",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
