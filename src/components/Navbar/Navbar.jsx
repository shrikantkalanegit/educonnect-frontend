import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import { FaGraduationCap, FaUserCircle, FaHome, FaSignOutAlt, FaBars, FaTimes, FaSun, FaMoon } from "react-icons/fa";
import { auth } from "../../firebase";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userRole = localStorage.getItem("userRole");
  
  // 🌓 THEME LOGIC (Moved to Navbar)
  const [darkMode, setDarkMode] = useState(localStorage.getItem("studentTheme") === "dark");

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("studentTheme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("studentTheme", "light");
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // --- PHOTO LOGIC ---
  const userPhoto = localStorage.getItem("userPhoto") || auth.currentUser?.photoURL;

  // Logout
  const handleLogout = () => {
    if (window.confirm("Logout?")) {
      localStorage.clear();
      // Theme reset na karein taaki user wapas aaye to same theme mile
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

        {/* --- PROFILE --- */}
        <div 
          className={`nav-item ${location.pathname === "/student-profile" ? "active" : ""}`} 
          onClick={() => { navigate("/student-profile"); setMobileMenuOpen(false); }}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          {userPhoto ? (
            <img src={userPhoto} alt="Profile" className="nav-profile-pic" />
          ) : (
            <FaUserCircle style={{ fontSize: "1.3rem" }} /> 
          )}
          <span>Profile</span>
        </div>

        {/* 🔥 NEW: THEME TOGGLE (Inside Navbar) */}
        <div className="nav-item theme-toggle-btn" onClick={toggleTheme} title="Change Theme">
            {darkMode ? <FaSun className="sun-icon"/> : <FaMoon className="moon-icon"/>}
        </div>

        {/* --- LOGOUT --- */}
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