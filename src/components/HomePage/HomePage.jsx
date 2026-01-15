import React, { useEffect, useState } from "react";
import "./HomePage.css";
import Navbar from "../Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase"; 
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FaBookOpen, FaUsers, FaBook, FaChartLine, FaBell, FaCalendarAlt, FaQrcode, FaGraduationCap } from "react-icons/fa";

const HomePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Student");
  
  const [studentData, setStudentData] = useState({ department: "", year: "" }); 
  const [notices, setNotices] = useState([]);
  
  // 🔥 FIX: Removed unused setters (setPresentCount, setAttendancePercentage)
  // Abhi ke liye ye bas static/demo values rahenge
  const [presentCount] = useState(0); 
  const [attendancePercentage] = useState(75);

  useEffect(() => {
    // 1. Check Auth & Fetch Student Details
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return; // Wait for login
      
      const role = localStorage.getItem("userRole");
      if (role === "admin") { navigate("/admin-dashboard"); return; }

      if (user.displayName) setUserName(user.displayName.split(" ")[0]);

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            setStudentData({ department: data.department, year: data.year });
            
            // Fetch Notices
            fetchAndFilterNotices(data.department, data.year);
        }
      } catch (e) { console.error("Error fetching user data:", e); }
    });

    return () => unsubAuth();
  }, [navigate]);

  const fetchAndFilterNotices = (userDept, userYear) => {
    const noticesRef = collection(db, "notices");
    const qNotice = query(noticesRef, orderBy("createdAt", "desc"));

    onSnapshot(qNotice, (snapshot) => {
        const now = Date.now();
        const validNotices = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            const isDeptMatch = data.department === userDept;
            const isYearMatch = data.targetYear === "All Years" || data.targetYear === userYear;
            const isNotExpired = data.expiresAt ? data.expiresAt.toMillis() > now : true;

            if (isDeptMatch && isYearMatch && isNotExpired) {
                validNotices.push({ 
                    id: doc.id, 
                    ...data,
                    formattedDate: data.createdAt?.seconds 
                        ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-US', {month:'short', day:'numeric'}) 
                        : "Today"
                });
            }
        });
        setNotices(validNotices);
    });
  };

  const features = [
    { title: "My Subjects", desc: "Notes & Materials", icon: <FaBookOpen />, path: "/subject", styleClass: "card-blue" },
    { title: "Community", desc: "Student Forum", icon: <FaUsers />, path: "/community", styleClass: "card-purple" },
    { title: "Library", desc: "Digital Books", icon: <FaBook />, path: "/books", styleClass: "card-gold" },
    { title: "Exam Portal", desc: "Results & Dates", icon: <FaChartLine />, path: "/papers", styleClass: "card-red" }
  ];

  return (
    <div className="student-wrapper"> 
      <Navbar />
      
      <div className="home-container">
        
        {/* HERO SECTION */}
        <header className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
                <h1>Hello, {userName}! <FaGraduationCap className="hat-icon"/></h1>
                <p>Welcome to <strong>{studentData.department || "EduConnect"}</strong> Dashboard.</p>
                <div className="date-badge">
                <FaCalendarAlt /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>
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
                            <span className="notice-tag">📢 {notice.department} • {notice.targetYear}</span>
                            <span className="notice-date">{notice.formattedDate}</span>
                        </div>
                        <p style={{fontWeight:'bold', marginBottom:'5px', fontSize:'0.95rem', color: 'var(--text-color)'}}>
                            {notice.message}
                        </p>
                        
                        <div style={{fontSize:'0.75rem', color:'#888', marginTop:'5px', display:'flex', alignItems:'center', gap:'5px'}}>
                            <span>- {notice.sender}</span>
                            {notice.durationLabel && (
                                <span style={{background:'#fee2e2', color:'#ef4444', padding:'1px 6px', borderRadius:'4px', fontWeight:'bold'}}>
                                    Expires in {notice.durationLabel}
                                </span>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <div className="empty-notice">
                    <p>No active notices for {studentData.department ? `${studentData.department} (${studentData.year})` : "you"}.</p>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;