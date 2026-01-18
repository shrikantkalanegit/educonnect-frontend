import React, { useState, useEffect } from "react";
import "./Navbar.css";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUserCircle, FaUniversity } from "react-icons/fa";
import { auth, db } from "../../firebase"; 
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

const Navbar = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ name: "Student", photo: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 🔥 FIX: User data fetch karte waqt 'profilePic' field check karo
        const userRef = doc(db, "users", user.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              name: data.name || "Student",
              photo: data.profilePic || "" // DB me field name 'profilePic' hona chahiye
            });
          }
          setLoading(false);
        }, (error) => {
          console.log("Navbar Error:", error);
          setLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    if(window.confirm("Logout?")) {
        await signOut(auth);
        navigate("/");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/home')}>
        <FaUniversity className="brand-icon" />
        <h2>EduConnect</h2>
      </div>

      <div className="navbar-actions">
        <div className="nav-profile" onClick={() => navigate('/student-profile')}>
            {/* 🔥 PHOTO CHECK */}
            {userData.photo ? (
                <img src={userData.photo} alt="Profile" className="nav-avatar"/>
            ) : (
                <FaUserCircle className="nav-avatar-icon"/>
            )}
            <span className="nav-username">
                {loading ? "..." : userData.name.split(" ")[0]}
            </span>
        </div>

        <button className="logout-btn" onClick={handleLogout} title="Logout">
            <FaSignOutAlt />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;