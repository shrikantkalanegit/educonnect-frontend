import React, { useEffect, useState } from "react";
import "./HomePage.css";
import Navbar from "../Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { FaBookOpen, FaUsers, FaBook, FaChartLine, FaBell, FaCalendarAlt, FaQrcode } from "react-icons/fa"; // FaQrcode add kiya

const HomePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    // --- 🛡️ SECURITY CHECK ---
    const role = localStorage.getItem("userRole");
    if (role === "admin") {
      navigate("/admin-dashboard"); 
      return; 
    }

    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName.split(" ")[0]); 
  }, [navigate]);

  const features = [
    { 
      title: "My Subjects", 
      desc: "Course materials & notes", 
      icon: <FaBookOpen />, 
      path: "/subject",
      color: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)" 
    },
    { 
      title: "Community Hub", 
      desc: "Chat with batchmates", 
      icon: <FaUsers />, 
      path: "/community", 
      color: "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)" 
    },
    { 
      title: "Library / Books", 
      desc: "Reference books PDF", 
      icon: <FaBook />, 
      path: "/books",
      color: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" 
    },
    { 
      title: "Exam Portal", 
      desc: "Check results & dates", 
      icon: <FaChartLine />, 
      path: "/papers", 
      color: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)" 
    }
  ];

  return (
    <>
      <Navbar />
      <div className="home-container">
        
        {/* HERO SECTION */}
        <header className="hero-section">
          <div className="hero-text">
            <h1>Hello, {userName}! 👋</h1>
            <p>Ready to learn something new today?</p>
            <div className="date-badge">
              <FaCalendarAlt /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          {/* Progress Card (Attendance) */}
          <div className="progress-card">
            <div style={{display: "flex", justifyContent:"space-between", alignItems:"center"}}>
                <h3>Weekly Attendance</h3>
                <span style={{background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "10px", fontSize: "0.8rem"}}>Live</span>
            </div>
            
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{width: '85%'}}></div>
            </div>
            <p className="progress-text">85% - Keep it up! 🔥</p>

            {/* 👇 NEW SCAN BUTTON ADDED HERE */}
            <button onClick={() => navigate('/student/scan')} className="scan-btn">
                <FaQrcode /> Scan Attendance
            </button>
            
          </div>
        </header>

        {/* MAIN FEATURES GRID */}
        <div className="features-grid">
          {features.map((item, index) => (
            <div 
              key={index} 
              className="feature-card" 
              onClick={() => navigate(item.path)}
            >
              <div className="card-bg-glow" style={{background: item.color}}></div>
              <div className="icon-circle" style={{background: item.color}}>
                {item.icon}
              </div>
              <div className="card-content">
                <h2>{item.title}</h2>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* NOTICE BOARD SECTION */}
        <div className="notice-section">
          <div className="section-title">
            <FaBell style={{color: '#f1c40f'}} /> 
            <h3>Latest Updates</h3>
          </div>
          <div className="notice-board">
            <div className="notice-item">📢 <b>Exam Alert:</b> Mid-terms starting next week.</div>
            <div className="notice-item">🎉 <b>Event:</b> Coding Hackathon registration open!</div>
            <div className="notice-item">🛑 <b>Holiday:</b> College closed on Friday.</div>
          </div>
        </div>

      </div>
    </>
  );
};

export default HomePage;