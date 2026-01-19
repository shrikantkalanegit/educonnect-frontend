import React, { useEffect, useState } from "react";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase"; 
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { 
  FaBookOpen, FaUsers, FaBook, FaChartPie, FaBell, FaCalendarAlt, 
  FaQrcode, FaClipboardList, FaChalkboardTeacher, FaUserCircle, FaUniversity 
} from "react-icons/fa";

const HomePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Student");
  const [studentData, setStudentData] = useState({ department: "", year: "", photo: "" }); 
  const [notices, setNotices] = useState([]);
  
  // Demo Stats
  const [attendance] = useState(78); 
  const [assignments] = useState(3);

  // Gradients for Student Theme
  const gradSub = "linear-gradient(135deg, #d8b4fe 0%, #f0abfc 100%)"; // Purple-Pink
  const gradComm = "linear-gradient(135deg, #86efac 0%, #3b82f6 100%)"; // Green-Blue
  const gradLib = "linear-gradient(135deg, #fca5a5 0%, #fcd34d 100%)"; // Red-Yellow
  const gradExam = "linear-gradient(135deg, #67e8f9 0%, #2dd4bf 100%)"; // Cyan-Teal
  const gradScan = "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"; // Pink-Yellow (Attendance)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return; 
      if (user.displayName) setUserName(user.displayName.split(" ")[0]);

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            setStudentData({ 
                department: data.department, 
                year: data.year,
                photo: data.photo 
            });
            fetchAndFilterNotices(data.department, data.year);
        }
      } catch (e) { console.error("Error fetching user data:", e); }
    });
    return () => unsubAuth();
  }, []);

  // Notice Logic
  const fetchAndFilterNotices = (userDept, userYear) => {
    const noticesRef = collection(db, "notices");
    const qNotice = query(noticesRef, orderBy("createdAt", "desc"));

    onSnapshot(qNotice, (snapshot) => {
        const now = Date.now();
        const validNotices = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const isDeptMatch = (data.department === userDept) || (data.department === "Global");
            const isYearMatch = (data.targetYear === "All Years") || (data.targetYear === userYear);
            const isNotExpired = data.expiresAt ? data.expiresAt.toMillis() > now : true;

            if (isDeptMatch && isYearMatch && isNotExpired) {
                validNotices.push({ 
                    id: doc.id, ...data,
                    date: data.createdAt?.seconds 
                        ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-US', {month:'short', day:'numeric'}) 
                        : "Today"
                });
            }
        });
        setNotices(validNotices);
    });
  };

  return (
    <div className="std-wrapper-ios"> 
      
      {/* NAVBAR */}
      <nav className="ios-navbar">
        <div className="brand-box">
            <div className="brand-logo">E</div>
            <h2>EduConnect</h2>
        </div>
        {/* Profile Link */}
        <div className="nav-profile-pill" onClick={() => navigate('/student-profile')}>
            {studentData.photo ? <img src={studentData.photo} alt="P" /> : <FaUserCircle/>}
            <span>{userName}</span>
        </div>
      </nav>

      <div className="ios-content">
        
        {/* HEADER */}
        <header className="ios-header">
            <div>
                <h1>Dashboard</h1>
                <p>Good Morning, <span className="dept-tag">{userName}</span></p>
            </div>
            <div className="date-pill">
                <FaCalendarAlt /> {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
            </div>
        </header>

        {/* WIDGETS */}
        <div className="widget-row">
            {/* 🔥 UPDATED: Added onClick to navigate to Scanner */}
            <div className="ios-widget large-widget" onClick={() => navigate('/student/scan')}>
                <div className="widget-content">
                    <h3>{attendance}%</h3>
                    <p>Tap to Scan</p>
                    <div className="widget-icon" style={{background:'#d8b4fe'}}><FaQrcode/></div>
                </div>
            </div>
            <div className="ios-widget">
                <div className="widget-content">
                    <h3>{assignments}</h3>
                    <p>Pending</p>
                    <div className="widget-icon" style={{background:'#fca5a5'}}><FaClipboardList/></div>
                </div>
            </div>
            <div className="ios-widget">
                <div className="widget-content">
                    <h3>{notices.length}</h3>
                    <p>Notices</p>
                    <div className="widget-icon" style={{background:'#86efac'}}><FaBell/></div>
                </div>
            </div>
        </div>

        {/* APP LIBRARY */}
        <div className="section-label">My Academics</div>
        <div className="app-grid-ios">
            
            {/* 🔥 ADDED: Explicit Scan Button */}
            <div className="app-icon-container" onClick={() => navigate('/student/scan')}>
                <div className="app-squircle" style={{background: gradScan}}>
                    <FaQrcode />
                </div>
                <span>Scan QR</span>
            </div>

            <div className="app-icon-container" onClick={() => navigate('/subject')}>
                <div className="app-squircle" style={{background: gradSub}}>
                    <FaChalkboardTeacher />
                </div>
                <span>Classes</span>
            </div>

            <div className="app-icon-container" onClick={() => navigate('/community')}>
                <div className="app-squircle" style={{background: gradComm}}>
                    <FaUsers />
                </div>
                <span>Community</span>
            </div>

            <div className="app-icon-container" onClick={() => navigate('/books')}>
                <div className="app-squircle" style={{background: gradLib}}>
                    <FaBook />
                </div>
                <span>Library</span>
            </div>

            <div className="app-icon-container" onClick={() => navigate('/papers')}>
                <div className="app-squircle" style={{background: gradExam}}>
                    <FaChartPie />
                </div>
                <span>Results</span>
            </div>

        </div>

        {/* NOTICE BOARD */}
        <div className="section-label">Campus Feed</div>
        <div className="ios-list-container">
            {notices.length > 0 ? (
                notices.map(notice => (
                    <div key={notice.id} className="ios-list-row">
                        <div className="row-icon"><FaUniversity/></div>
                        <div className="row-info">
                            <h4>{notice.department === "Global" ? "Global Update" : notice.department}</h4>
                            <p>{notice.message}</p>
                        </div>
                        <div className="row-meta">
                            <span className="meta-badge">{notice.date}</span>
                        </div>
                    </div>
                ))
            ) : (
                <div style={{padding:'30px', textAlign:'center', color:'#64748b', fontStyle:'italic'}}>
                    No new updates 🎉
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default HomePage;