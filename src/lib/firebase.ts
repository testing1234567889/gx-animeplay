import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBpsA9-X9ckiyz2erxurJdLOzv-Deoi7R0",
  authDomain: "animeplay-738a4.firebaseapp.com",
  databaseURL: "https://animeplay-738a4-default-rtdb.firebaseio.com",
  projectId: "animeplay-738a4",
  storageBucket: "animeplay-738a4.firebasestorage.app",
  messagingSenderId: "129738568083",
  appId: "1:129738568083:web:d144ad8d1a66d893213866",
  measurementId: "G-J6G96TPMHX",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
