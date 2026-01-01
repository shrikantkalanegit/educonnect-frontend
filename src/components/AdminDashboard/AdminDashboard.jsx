import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { 
  FaHome, FaUserCircle, FaBell, 
  FaChalkboardTeacher, FaUsers, FaCrown, FaRobot,
  FaQrcode // 👈 1. Naya Icon Import kiya
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// 👇 Firebase Imports
import { auth, db } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState("");
  const [adminName, setAdminName] = useState("Administrator");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const unsubDoc = onSnapshot(doc(db, "admins", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.profilePic) setProfilePic(data.profilePic);
            if (data.name) setAdminName(data.name);
          }
        });
        return () => unsubDoc();
      } else {
        setProfilePic("");
        setAdminName("Administrator");
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <div className="admin-wrapper">
      <nav className="admin-navbar">
        <div className="brand-section">
          <div className="logo-icon">E</div>
          <div className="logo-text">EduConnect <span className="pro-badge">PRO</span></div>
        </div>
        
        <div className="nav-actions">
          <div className="nav-icon" onClick={() => navigate('/admin-dashboard')}><FaHome /></div>
          <div className="nav-icon notification-wrapper" onClick={() => navigate('/notifications')}>
            <FaBell /><span className="pulse-dot"></span>
          </div>
          
          <div className="profile-section" onClick={() => navigate('/admin/profile')}>
            <span className="admin-name">{adminName}</span>
            {profilePic ? (
              <img src={profilePic} alt="Admin" className="nav-profile-img" />
            ) : (
              <FaUserCircle className="profile-icon" />
            )}
          </div>
        </div>
      </nav>

      <div className="admin-content">
        <header className="page-header">
          <h1>Command Center</h1>
          <p>Manage your institution with precision.</p>
        </header>
        
        <div className="vip-grid">
          {/* Card 1 */}
          <div className="vip-card card-blue" onClick={() => navigate('/admin/class-selection')}>
            <div className="card-bg-icon"><FaChalkboardTeacher /></div>
            <div className="card-content">
              <div className="icon-box"><FaChalkboardTeacher /></div>
              <h2>Class Management</h2>
              <button className="vip-btn">Manage Classes &rarr;</button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="vip-card card-purple" onClick={() => navigate('/admin/community-selection')}>
            <div className="card-bg-icon"><FaUsers /></div>
            <div className="card-content">
              <div className="icon-box"><FaUsers /></div>
              <h2>Student Community</h2>
              <button className="vip-btn">View Forums &rarr;</button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="vip-card card-gold" onClick={() => navigate('/admin/staff-community')}>
            <div className="card-bg-icon"><FaCrown /></div>
            <div className="card-content">
              <div className="icon-box"><FaCrown /></div>
              <h2>Admin Staff Room</h2>
              <button className="vip-btn">Enter Staff Room &rarr;</button>
            </div>
          </div>

          {/* Card 4 */}
          <div className="vip-card card-teal" onClick={() => navigate('/admin/ai-tools')}>
            <div className="card-bg-icon"><FaRobot /></div>
            <div className="card-content">
              <div className="icon-box"><FaRobot /></div>
              <h2>Edu-AI Assistant</h2>
              <button className="vip-btn">Access AI &rarr;</button>
            </div>
          </div>

          {/* 👇 2. NAYA CARD ADD KIYA (Attendance) */}
          <div className="vip-card card-red" onClick={() => navigate('/admin/attendance')}>
            <div className="card-bg-icon"><FaQrcode /></div>
            <div className="card-content">
              <div className="icon-box"><FaQrcode /></div>
              <h2>Smart Attendance</h2>
              <button className="vip-btn">Generate QR &rarr;</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;