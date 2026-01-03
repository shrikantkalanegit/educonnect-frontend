import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Agar future me chahiye ho

// Yahan apni Firebase Console se copy kiya hua config paste karein
const firebaseConfig = {
  apiKey: "AIzaSyD...", 
  authDomain: "educonnect-....firebaseapp.com",
  projectId: "educonnect-...",
  storageBucket: "educonnect-....appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exports (Inka use hum baaki files me karenge)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);