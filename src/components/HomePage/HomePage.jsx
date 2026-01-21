import React, { useEffect, useState } from "react";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase"; 
import { collection, query, orderBy, onSnapshot, doc, getDoc, where } from "firebase/firestore";
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
  
  // 🔥 REAL-TIME STATS STATE
  const [attendanceCount, setAttendanceCount] = useState(0); 
  const [pendingAssignments, setPendingAssignments] = useState(0);

  // Gradients for Student Theme
  const gradSub = "linear-gradient(135deg, #d8b4fe 0%, #f0abfc 100%)"; 
  const gradComm = "linear-gradient(135deg, #86efac 0%, #3b82f6 100%)"; 
  const gradLib = "linear-gradient(135deg, #fca5a5 0%, #fcd34d 100%)"; 
  const gradExam = "linear-gradient(135deg, #67e8f9 0%, #2dd4bf 100%)"; 
  const gradScan = "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"; 

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return; 
      if (user.displayName) setUserName(user.displayName.split(" ")[0]);

      try {
        // 1. Fetch Student Details
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            setStudentData({ 
                department: data.department, 
                year: data.year,
                photo: data.photo 
            });
            
            // 2. Start Listeners
            fetchAndFilterNotices(data.department, data.year);
            fetchRealTimeStats(user.uid, data.department, data.year);
        }
      } catch (e) { console.error("Error fetching user data:", e); }
    });
    return () => unsubAuth();
  }, []);

  // 🔥 FETCH REAL-TIME STATS (Attendance & Assignments)
  const fetchRealTimeStats = (uid, dept, year) => {
    
    // A. Attendance Calculation (Count present records)
    const attendRef = collection(db, "attendance_records");
    const qAttend = query(attendRef, where("studentUid", "==", uid));
    
    onSnapshot(qAttend, (snap) => {
        // Jitne documents mile, utni baar student present tha
        setAttendanceCount(snap.size); 
    });

    // B. Assignment Logic (Total Given - Submitted = Pending)
    // Note: Abhi hum sirf logic laga rahe hain. Jab aap Assignment Upload feature banayenge tab ye data dikhayega.
    
    // 1. Teacher ne kitne diye? (Assignment Collection)
    const assignRef = collection(db, "assignments"); // Maan lo ye collection hai
    const qAssign = query(assignRef, where("department", "==", dept), where("year", "==", year));
    
    // 2. Student ne kitne kiye? (Submissions Collection)
    const submitRef = collection(db, "submissions");
    const qSubmit = query(submitRef, where("studentUid", "==", uid));

    // Dono ko track karo
    onSnapshot(qAssign, (assignSnap) => {
        const totalGiven = assignSnap.size;
        
        onSnapshot(qSubmit, (submitSnap) => {
             const totalSubmitted = submitSnap.size;
             // Pending kabhi negative nahi hona chahiye
             const pending = Math.max(0, totalGiven - totalSubmitted);
             setPendingAssignments(pending);
        });
    });
  };

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
            
            {/* 🔥 1. ATTENDANCE WIDGET (Dynamic) */}
            <div className="ios-widget large-widget" onClick={() => navigate('/student/scan')}>
                <div className="widget-content">
                    {/* Abhi hum Percentage nahi, Count dikha rahe hain kyunki Total classes pata nahi hain */}
                    <h3>{attendanceCount} <span style={{fontSize:'1rem', color:'#666'}}>Sessions</span></h3>
                    <p>Total Present</p>
                    <div className="widget-icon" style={{background:'#d8b4fe'}}><FaQrcode/></div>
                </div>
            </div>

            {/* 🔥 2. ASSIGNMENTS WIDGET (Dynamic) */}
            <div className="ios-widget">
                <div className="widget-content">
                    {/* Agar 0 pending hai to "All Done" dikhaye */}
                    <h4>{pendingAssignments === 0 ? "✅" : pendingAssignments}</h4>
                    <p>{pendingAssignments === 0 ? "All Done" : "Pending"}</p>
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
                <span>B. Library</span>
            </div>

            <div className="app-icon-container" onClick={() => navigate('/papers')}>
                <div className="app-squircle" style={{background: gradExam}}>
                    <FaChartPie />
                </div>
                <span>PE. Papers</span>
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