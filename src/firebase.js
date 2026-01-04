import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore"; 
import { getDatabase } from "firebase/database"; 

const firebaseConfig = {
  apiKey: "AIzaSyCzGJ-u2SDoSX9_K_Kp5FkCSgokv-iMoCw",
  authDomain: "educonnect-e02b2.firebaseapp.com",
  projectId: "educonnect-e02b2",
  storageBucket: "educonnect-e02b2.firebasestorage.app",
  messagingSenderId: "237465642148",
  appId: "1:237465642148:web:b9603db6fbaf68c4f83231",
  measurementId: "G-5YHLCVPG91",
  // 👇 IMPORTANT: Region specific URL add kiya hai (Fixes Warning)
  databaseURL: "https://educonnect-e02b2-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exports
export const auth = getAuth(app);
export const db = getFirestore(app);        // Firestore (Login ke liye)
export const realtimeDb = getDatabase(app); // Realtime DB (AI ke liye)

export default app;