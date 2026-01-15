import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import { FaGraduationCap, FaUserCircle, FaHome, FaSignOutAlt, FaBars, FaTimes, FaSun, FaMoon, FaExchangeAlt } from "react-icons/fa";
// 👇 signOut import kiya
import { auth } from "../../firebase";
import { signOut } from "firebase/auth"; 

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userRole = localStorage.getItem("userRole");
  
  // 🌓 THEME LOGIC
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

  // 🔥 SECURE LOGOUT LOGIC
  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await signOut(auth); // 1. Firebase Logout
        localStorage.clear(); // 2. Clear Data
        
        // 3. Redirect & Block Back Button
        navigate("/", { replace: true }); 
        
      } catch (error) {
        console.error("Logout Error:", error);
      }
    }
  };

  const isActive = (path) => location.pathname === path ? "nav-item active" : "nav-item";

  return (
    <nav className="navbar glass-nav">
      
      {/* --- LOGO --- */}
      <div className="logo" onClick={() => navigate(userRole === 'admin' ? '/admin-dashboard' : '/homepage')}>
        <div className="logo-icon-box">
            <FaGraduationCap />
        </div>
        <span className="logo-text">EduConnect <span className="dot">.</span></span>
      </div>

      {/* --- LINKS --- */}
      <div className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
        
        <div className="mobile-header">
            <span>Menu</span>
            <div className="mobile-close" onClick={() => setMobileMenuOpen(false)}>
                <FaTimes />
            </div>
        </div>

        <Link to={userRole === 'admin' ? '/admin-dashboard' : '/homepage'} className={isActive(userRole === 'admin' ? '/admin-dashboard' : '/homepage')} onClick={() => setMobileMenuOpen(false)}>
          <FaHome /> <span>Home</span>
        </Link>
        
        {/* ADMIN LINKS */}
        {userRole === "admin" && (
          <>
            <Link to="/admin/class-selection" className={isActive("/admin/class-selection")} onClick={() => setMobileMenuOpen(false)}>
               <span>Manage Subjects</span>
            </Link>
            
            <div 
                className="nav-item" 
                onClick={() => { navigate("/admin/select-dept"); setMobileMenuOpen(false); }}
                style={{ cursor: "pointer" }}
                title="Switch Department"
            >
               <FaExchangeAlt style={{color: '#3b82f6'}} /> 
               <span>Switch Faculty</span>
            </div>
          </>
        )}

        {/* PROFILE */}
        <div 
          className={`nav-item ${location.pathname === "/student-profile" ? "active" : ""}`} 
          onClick={() => { navigate(userRole === 'admin' ? '/admin/profile' : '/student-profile'); setMobileMenuOpen(false); }}
        >
          {userPhoto ? (
            <img src={userPhoto} alt="Profile" className="nav-profile-pic" />
          ) : (
            <FaUserCircle className="profile-icon-default" /> 
          )}
          <span>Profile</span>
        </div>

        {/* THEME */}
        <div className="nav-item theme-toggle-btn" onClick={toggleTheme} title="Switch Theme">
            {darkMode ? <FaSun className="sun-icon"/> : <FaMoon className="moon-icon"/>}
        </div>

        {/* 🚪 LOGOUT */}
        <div className="nav-item logout-btn" onClick={handleLogout} title="Logout">
            <FaSignOutAlt /> <span className="mobile-only">Logout</span>
        </div>

      </div>

      {/* HAMBURGER */}
      <div className="hamburger" onClick={() => setMobileMenuOpen(true)}>
        <FaBars />
      </div>

      {mobileMenuOpen && <div className="overlay" onClick={() => setMobileMenuOpen(false)}></div>}
    </nav>
  );
};

export default Navbar;