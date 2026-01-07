import React, { useEffect, useState } from "react";
import "./HomePage.css";
import Navbar from "../Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase"; 
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { FaBookOpen, FaUsers, FaBook, FaChartLine, FaBell, FaCalendarAlt, FaQrcode, FaGraduationCap } from "react-icons/fa";

const HomePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Student");
  
  // Notice State
  const [notices, setNotices] = useState([]);
  
  // Demo Stats
  const [presentCount, setPresentCount] = useState(0); 
  const [attendancePercentage, setAttendancePercentage] = useState(75);

  useEffect(() => {
    // 1. Check Role
    const role = localStorage.getItem("userRole");
    if (role === "admin") { navigate("/admin-dashboard"); return; }
    
    // 2. Set Name
    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName.split(" ")[0]);

    // 3. Fetch Notices
    const noticesRef = collection(db, "notices");
    const qNotice = query(noticesRef, orderBy("timestamp", "desc"));
    const unsubNotice = onSnapshot(qNotice, (snapshot) => {
        const fetchedNotices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotices(fetchedNotices);
    });

    return () => unsubNotice();
  }, [navigate]);

  const features = [
    { title: "My Subjects", desc: "Notes & Materials", icon: <FaBookOpen />, path: "/subject", styleClass: "card-blue" },
    { title: "Community", desc: "Student Forum", icon: <FaUsers />, path: "/community", styleClass: "card-purple" },
    { title: "Library", desc: "Digital Books", icon: <FaBook />, path: "/books", styleClass: "card-gold" },
    { title: "Exam Portal", desc: "Results & Dates", icon: <FaChartLine />, path: "/papers", styleClass: "card-red" }
  ];

  return (
    // Wrapper class hata di, kyunki ab Body par class lag rahi hai (Navbar se)
    <div className="student-wrapper"> 
      <Navbar />
      
      <div className="home-container">
        
        {/* HERO SECTION (Cleaned Up) */}
        <header className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
                <h1>Hello, {userName}! <FaGraduationCap className="hat-icon"/></h1>
                <p>Welcome to your digital campus.</p>
                <div className="date-badge">
                <FaCalendarAlt /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>
            {/* Toggle Button Removed from here */}
          </div>
          
          <div className="progress-card">
            <div className="prog-header">
                <h3>Attendance</h3>
                <span className="count-badge">{presentCount} Days</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{width: `${attendancePercentage}%`}}></div>
            </div>
            <p className="progress-text">
                {attendancePercentage}% - {attendancePercentage > 75 ? "Excellent! 🌟" : "Warning ⚠️"}
            </p>
            <button onClick={() => navigate('/student/scan')} className="scan-btn">
                <FaQrcode /> Scan QR
            </button>
          </div>
        </header>

        {/* QUICK ACCESS GRID */}
        <div className="section-title">QUICK ACCESS</div>
        <div className="vip-grid">
          {features.map((item, index) => (
            <div key={index} className={`vip-card ${item.styleClass}`} onClick={() => navigate(item.path)}>
              <div className="card-bg-icon">{item.icon}</div>
              <div className="card-content">
                <div className="icon-box">{item.icon}</div>
                <h2>{item.title}</h2>
                <p className="card-desc">{item.desc}</p>
                <button className="vip-btn">Open &rarr;</button>
              </div>
            </div>
          ))}
        </div>

        {/* NOTICE BOARD */}
        <div className="notice-section">
          <div className="section-title-row">
             <h3><FaBell className="bell-icon" /> Campus Updates</h3>
             <span className="notice-count">{notices.length} New</span>
          </div>
          
          <div className="notice-board">
            {notices.length > 0 ? (
                notices.map((notice) => (
                    <div key={notice.id} className="notice-item">
                        <div className="notice-header">
                            <span className="notice-tag">📢 {notice.target}</span>
                            <span className="notice-date">{notice.date}</span>
                        </div>
                        <p>{notice.message}</p>
                    </div>
                ))
            ) : (
                <div className="empty-notice">No new announcements.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;