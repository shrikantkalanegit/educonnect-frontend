// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Login ke liye
import { getFirestore } from "firebase/firestore"; // Database ke liye

const firebaseConfig = {
  apiKey: "AIzaSyCzGJ-u2SDoSX9_K_Kp5FkCSgokv-iMoCw",
  authDomain: "educonnect-e02b2.firebaseapp.com",
  projectId: "educonnect-e02b2",
  storageBucket: "educonnect-e02b2.firebasestorage.app",
  messagingSenderId: "237465642148",
  appId: "1:237465642148:web:b9603db6fbaf68c4f83231",
  measurementId: "G-5YHLCVPG91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth & DB taaki puri app mein use kar sakein
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;