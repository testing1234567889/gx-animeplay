import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

// The Firebase Web API key is a publishable identifier, but it is injected at
// build time from the GOOGLE_API_KEY secret so it never lives in source.
declare const __FIREBASE_API_KEY__: string;
const apiKey =
  typeof __FIREBASE_API_KEY__ !== "undefined" && __FIREBASE_API_KEY__
    ? __FIREBASE_API_KEY__
    : "";

const firebaseConfig = {
  apiKey,
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
