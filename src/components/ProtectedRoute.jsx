import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ children, requiredRole }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Check Role from Firestore (Double Security)
        // Admin ke liye 'admins' collection, Student ke liye 'users'
        const collectionName = requiredRole === "admin" ? "admins" : "users";
        const docRef = doc(db, collectionName, currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
           setUserRole(requiredRole); // Authorized
        } else {
           setUserRole("unauthorized");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [requiredRole]);

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Checking Security... 🔒</div>;

  // 1. Agar User Login nahi hai -> Login Page par bhejo
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 2. Agar Role match nahi ho raha (Jaise Student Admin page kholne ki koshish kare)
  if (userRole !== requiredRole) {
    alert("⛔ Access Denied!");
    return <Navigate to="/" replace />;
  }

  // 3. Agar sab sahi hai -> Page dikhao
  return children;
};

export default ProtectedRoute;