import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import { FaGraduationCap, FaUserCircle, FaHome, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
// ⬇️ Is line me galti ho sakti hai, ise copy-paste karein:
import { auth } from "../../firebase";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userRole = localStorage.getItem("userRole");
  
  // --- PHOTO LOGIC ---
  // Pehle LocalStorage check karega (fast), nahi to Firebase auth se lega
  const userPhoto = localStorage.getItem("userPhoto") || auth.currentUser?.photoURL;

  // Simple Logout Function
  const handleLogout = () => {
    if (window.confirm("Logout?")) {
      localStorage.clear(); // LocalStorage saaf
      navigate("/admin-login");
    }
  };

  const isActive = (path) => location.pathname === path ? "nav-item active" : "nav-item";

  return (
    <nav className="navbar">
      {/* --- LOGO --- */}
      <div className="logo" onClick={() => navigate("/homepage")}>
        <FaGraduationCap className="logo-icon" />
        <span>EduConnect</span>
      </div>

      {/* --- LINKS --- */}
      <div className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
        
        {/* Mobile Close Button */}
        <div className="mobile-close" onClick={() => setMobileMenuOpen(false)}>
            <FaTimes />
        </div>

        <Link to="/homepage" className={isActive("/homepage")} onClick={() => setMobileMenuOpen(false)}>
          <FaHome /> Home
        </Link>
        
        {userRole === "admin" && (
          <Link to="/admin/class-selection" className={isActive("/admin/class-selection")} onClick={() => setMobileMenuOpen(false)}>
            Manage Subjects
          </Link>
        )}

        {/* --- PROFILE SECTION (Updated) --- */}
        <div 
          className={`nav-item ${location.pathname === "/student-profile" ? "active" : ""}`} 
          onClick={() => { navigate("/student-profile"); setMobileMenuOpen(false); }}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          {/* Yahan Logic Lagaya hai: Photo hai to Photo, nahi to Icon */}
          {userPhoto ? (
            <img 
              src={userPhoto} 
              alt="Profile" 
              className="nav-profile-pic" // Iski CSS niche di hai
            />
          ) : (
            <FaUserCircle style={{ fontSize: "1.3rem" }} /> 
          )}
          
          <span>Profile</span>
        </div>

        {/* --- LOGOUT BUTTON --- */}
        <div className="nav-item logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
        </div>

      </div>

      {/* --- HAMBURGER --- */}
      <div className="hamburger" onClick={() => setMobileMenuOpen(true)}>
        <FaBars />
      </div>

      {mobileMenuOpen && <div className="overlay" onClick={() => setMobileMenuOpen(false)}></div>}
    </nav>
  );
};

export default Navbar;