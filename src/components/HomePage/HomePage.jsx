import React, { useEffect, useState } from "react";
import "./HomePage.css";
import Navbar from "../Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase"; 
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore"; // 👈 Firestore
import { FaBookOpen, FaUsers, FaBook, FaChartLine, FaBell, FaCalendarAlt, FaQrcode } from "react-icons/fa";

const HomePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Student");
  
  // Attendance
  const [presentCount, setPresentCount] = useState(0);
  const [attendancePercentage, setAttendancePercentage] = useState(0);

  // 🔔 NOTICES STATE
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    // 1. Role Check
    const role = localStorage.getItem("userRole");
    if (role === "admin") { navigate("/admin-dashboard"); return; }
    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName.split(" ")[0]);

    // 2. Fetch Attendance
    const fetchAttendance = async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            const q = query(collection(db, "attendance_records"), where("studentId", "==", user.uid));
            // Snapshot se count lo (Realtime ki zarurat nahi agar ye heavy hai, but onSnapshot easy hai)
            // Abhi simple rakhte hain, real implementation mein getDocs use karein
        } catch (error) { console.error("Error", error); }
    };
    // (Attendance logic placeholder for brevity, using dummy data below if needed)

    // 3. 🔥 FETCH LIVE NOTICES
    const noticesRef = collection(db, "notices");
    const qNotice = query(noticesRef, orderBy("timestamp", "desc")); // Latest pehle
    
    const unsubNotice = onSnapshot(qNotice, (snapshot) => {
        const fetchedNotices = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setNotices(fetchedNotices);
    });

    return () => unsubNotice(); // Cleanup listener

  }, [navigate]);

  const features = [
    { title: "My Subjects", desc: "Course materials & notes", icon: <FaBookOpen />, path: "/subject", color: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)" },
    { title: "Community Hub", desc: "Chat with batchmates", icon: <FaUsers />, path: "/community", color: "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)" },
    { title: "Library / Books", desc: "Reference books PDF", icon: <FaBook />, path: "/books", color: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
    { title: "Exam Portal", desc: "Check results & dates", icon: <FaChartLine />, path: "/papers", color: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)" }
  ];

  return (
    <>
      <Navbar />
      <div className="home-container">
        
        <header className="hero-section">
          <div className="hero-text">
            <h1>Hello, {userName}! 👋</h1>
            <p>Ready to learn something new today?</p>
            <div className="date-badge">
              <FaCalendarAlt /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <div className="progress-card">
            <div style={{display: "flex", justifyContent:"space-between", alignItems:"center"}}>
                <h3>My Attendance</h3>
                <span style={{background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "10px", fontSize: "0.8rem"}}>
                    {presentCount} Classes
                </span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{width: `${attendancePercentage}%`}}></div>
            </div>
            <p className="progress-text">
                {attendancePercentage}% - {attendancePercentage > 75 ? "Great Job! 🔥" : "Need Improvement ⚠️"}
            </p>
            <button onClick={() => navigate('/student/scan')} className="scan-btn">
                <FaQrcode /> Scan Attendance
            </button>
          </div>
        </header>

        <div className="features-grid">
          {features.map((item, index) => (
            <div key={index} className="feature-card" onClick={() => navigate(item.path)}>
              <div className="card-bg-glow" style={{background: item.color}}></div>
              <div className="icon-circle" style={{background: item.color}}>{item.icon}</div>
              <div className="card-content"><h2>{item.title}</h2><p>{item.desc}</p></div>
            </div>
          ))}
        </div>

        {/* 🔥 LIVE NOTICE BOARD */}
        <div className="notice-section">
          <div className="section-title"><FaBell style={{color: '#f1c40f'}} /> <h3>Campus Updates</h3></div>
          
          <div className="notice-board">
            {notices.length > 0 ? (
                notices.map((notice) => (
                    <div key={notice.id} className="notice-item">
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                            <span style={{fontSize:'0.8rem', fontWeight:'bold', color:'#333'}}>
                                📢 {notice.target === "All" ? "All Students" : notice.target}
                            </span>
                            <span style={{fontSize:'0.75rem', color:'#888'}}>{notice.date}</span>
                        </div>
                        {notice.message}
                    </div>
                ))
            ) : (
                <div className="notice-item" style={{borderLeft:'4px solid #ccc', fontStyle:'italic'}}>
                    No new announcements today.
                </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default HomePage;