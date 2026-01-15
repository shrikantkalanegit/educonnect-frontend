import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { 
  FaBell, FaUserCircle, FaChalkboardTeacher, 
  FaCrown, FaRobot, FaQrcode, FaEllipsisV, FaBook, FaFileAlt, FaSignOutAlt,
  FaComments, FaCheckCircle, FaTrash, FaMoon, FaSun, FaUniversity, FaBullhorn, FaClock
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { doc, onSnapshot, collection, query, where, getCountFromServer, deleteDoc, orderBy } from "firebase/firestore"; 
import { onAuthStateChanged, signOut } from "firebase/auth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState("");
  const [adminName, setAdminName] = useState("Admin");
  const [greeting, setGreeting] = useState("Welcome");
  
  // 🔥 FIX 1: Initialize State directly from LocalStorage
  const [currentDept, setCurrentDept] = useState(localStorage.getItem("currentDept") || "");

  const [stats, setStats] = useState({ students: 0, staff: 0, notices: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [liveNotices, setLiveNotices] = useState([]);

  // --- EFFECT 1: CHECK DEPT & THEME ---
  useEffect(() => {
    const dept = localStorage.getItem("currentDept");
    if (!dept) {
        navigate("/admin/select-dept");
        return;
    }
    setCurrentDept(dept); // Ensure State is Sync

    // Theme & Time
    const savedTheme = localStorage.getItem("adminTheme");
    if (savedTheme === "dark") setDarkMode(true);
    
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening");
  }, [navigate]);

  // --- EFFECT 2: AUTH & USER STATS ---
  useEffect(() => {
    if (!currentDept) return;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Admin Profile Listener
        const unsubProfile = onSnapshot(doc(db, "admins", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.profilePic) setProfilePic(data.profilePic);
            if (data.name) setAdminName(data.name.split(" ")[0]);
          }
        });

        // Get Stats (One time fetch to avoid heavy listeners)
        try {
          const studentQ = query(collection(db, "users"), where("department", "==", currentDept));
          const studentSnap = await getCountFromServer(studentQ);
          setStats(prev => ({ ...prev, students: studentSnap.data().count, staff: 12 }));
        } catch (e) { console.log("Stats Error:", e); }

        return () => unsubProfile(); // Cleanup inner listener
      }
    });

    return () => unsubscribeAuth();
  }, [currentDept]); // Run when Department changes

  // --- EFFECT 3: NOTICES LISTENER (This caused the crash) ---
  useEffect(() => {
    if (!currentDept) return;

    // 🔥 FIX 2: Proper Query & Listener
    const noticeQuery = query(
        collection(db, "notices"), 
        where("department", "==", currentDept),
        orderBy("createdAt", "desc")
    );

    const unsubNotice = onSnapshot(noticeQuery, (snapshot) => {
        const now = Date.now();
        const validNotices = [];
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Check Expiry
            if (data.expiresAt && data.expiresAt.toMillis() > now) {
                validNotices.push({ id: doc.id, ...data });
            }
        });

        setLiveNotices(validNotices);
        setStats(prev => ({ ...prev, notices: validNotices.length }));
    }, (error) => {
        console.error("Notice Listener Error:", error);
        // Agar Index missing error aaye to console mein link milega
    });

    // 🔥 FIX 3: Strict Cleanup
    return () => {
        unsubNotice();
        setLiveNotices([]); // Reset state on unmount
    };
  }, [currentDept]); // Only re-run when Dept changes

  // ... (Baaki Functions Same Rahenge) ...
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("adminTheme", newMode ? "dark" : "light");
  };

  const handleLogout = async () => {
    if(window.confirm("Are you sure you want to logout?")) { 
        try {
            await signOut(auth); localStorage.clear(); navigate("/", { replace: true });
        } catch (error) { console.error("Logout Failed", error); }
    }
  };

  const handleDeleteNotice = async (id) => {
      if(window.confirm("Delete this update permanently?")) {
          await deleteDoc(doc(db, "notices", id));
      }
  };

  return (
    <div className={`admin-wrapper ${darkMode ? "dark-mode" : "light-mode"}`}>
      
      {/* NAVBAR */}
      <nav className="admin-navbar">
        <div className="brand-section">
          <div className="logo-icon">E</div>
          <div className="logo-text">EduConnect <span className="pro-badge">PRO</span></div>
        </div>
        
        <div className="nav-actions">
          {/* HOME BTN */}
          <div className="icon-wrap home-btn" onClick={() => navigate('/admin/select-dept')} title="Switch Campus">
             <FaUniversity />
          </div>
          
          <div className="icon-wrap theme-btn" onClick={toggleTheme} title="Switch Theme">
             {darkMode ? <FaSun className="sun-icon"/> : <FaMoon className="moon-icon"/>}
          </div>

          {/* NOTIFICATIONS */}
          <div className="menu-container">
            <div className="icon-wrap" onClick={() => {setShowNotif(!showNotif); setShowMenu(false);}}>
                <FaBell /><span className="pulse-dot"></span>
            </div>
            {showNotif && (
                <div className="dropdown-menu notif-menu">
                    <div className="dropdown-header">Campus Updates ({liveNotices.length})</div>
                    {liveNotices.length === 0 ? (
                        <div style={{padding:'20px', textAlign:'center', color:'#999'}}>No Active Notices</div>
                    ) : (
                        liveNotices.map(note => (
                            <div key={note.id} className="notif-item">
                                <div className="notif-icon info"><FaBullhorn /></div>
                                <div className="notif-text">
                                    <p>{note.message.substring(0, 40)}...</p>
                                    <span>{note.targetYear} • {note.durationLabel} left</span>
                                </div>
                            </div>
                        ))
                    )}
                    <div className="dropdown-footer" onClick={() => navigate('/admin/profile')}>Create New Update</div>
                </div>
            )}
          </div>
          
          <div className="profile-section" onClick={() => navigate('/admin/profile')}>
            {profilePic ? <img src={profilePic} alt="Profile" className="nav-profile-img" /> : <FaUserCircle className="profile-icon" />}
            <span className="admin-name">{adminName}</span>
          </div>

          <div className="menu-container">
            <div className="icon-wrap three-dots" onClick={() => {setShowMenu(!showMenu); setShowNotif(false);}}>
                <FaEllipsisV />
            </div>
            {showMenu && (
                <div className="dropdown-menu">
                    <div className="dropdown-item" onClick={() => navigate('/admin/manage-books')}><FaBook className="menu-icon-sm"/> Manage Library</div>
                    <div className="dropdown-item" onClick={() => navigate('/admin/exams')}><FaFileAlt className="menu-icon-sm"/> Exam Portal</div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item danger" onClick={handleLogout}><FaSignOutAlt className="menu-icon-sm"/> Logout</div>
                </div>
            )}
          </div>
        </div>
      </nav>

      {/* BODY */}
      <div className="admin-content">
        <header className="page-header">
          <div>
            <h1>{greeting}, {adminName} </h1>
            <p>You are managing: <span className="dept-pill">{currentDept} Faculty</span></p>
          </div>
          <div className="date-badge">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
        </header>

        {/* STATS ROW */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{stats.students}</div>
            <div className="stat-lbl">{currentDept} Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.staff}</div>
            <div className="stat-lbl">Faculty Members</div>
          </div>
          <div className="stat-card active-card">
            <div className="stat-num">{stats.notices}</div>
            <div className="stat-lbl">Active Notices</div>
          </div>
        </div>

        {/* QUICK ACTIONS GRID */}
        <div className="section-title" style={{marginTop:'10px'}}>QUICK ACTIONS</div>
        <div className="vip-grid">
          <div className="vip-card card-blue" onClick={() => navigate('/admin/class-selection')}>
            <div className="card-bg-icon"><FaChalkboardTeacher /></div>
            <div className="card-content">
              <div className="icon-box"><FaChalkboardTeacher /></div>
              <h2>Classrooms</h2>
              <button className="vip-btn">Manage Classes &rarr;</button>
            </div>
          </div>
          <div className="vip-card card-gold" onClick={() => navigate('/admin/staff-community')}>
            <div className="card-bg-icon"><FaCrown /></div>
            <div className="card-content">
              <div className="icon-box"><FaCrown /></div>
              <h2>Staff Room</h2>
              <button className="vip-btn">Faculty Only &rarr;</button>
            </div>
          </div>
          <div className="vip-card card-purple" onClick={() => navigate('/admin/community-selection')}>
            <div className="card-bg-icon"><FaComments /></div>
            <div className="card-content">
              <div className="icon-box"><FaComments /></div>
              <h2>Community</h2>
              <button className="vip-btn">View Forums &rarr;</button>
            </div>
          </div>
          <div className="vip-card card-teal" onClick={() => navigate('/admin/ai')}>
            <div className="card-bg-icon"><FaRobot /></div>
            <div className="card-content">
              <div className="icon-box"><FaRobot /></div>
              <h2>Edu-AI</h2>
              <button className="vip-btn">Ask Assistant &rarr;</button>
            </div>
          </div>
          <div className="vip-card card-red" onClick={() => navigate('/admin/attendance')}>
            <div className="card-bg-icon"><FaQrcode /></div>
            <div className="card-content">
              <div className="icon-box"><FaQrcode /></div>
              <h2>Attendance</h2>
              <button className="vip-btn">QR Scanner &rarr;</button>
            </div>
          </div>
        </div>

        {/* NOTICE BOARD SECTION */}
        <div className="notice-board-section" style={{marginTop:'40px'}}>
            <div className="section-title">📢 ACTIVE CAMPUS UPDATES</div>
            
            <div className="notice-list">
                {liveNotices.length > 0 ? (
                    liveNotices.map((notice) => (
                        <div key={notice.id} className="notice-card">
                            <div className="notice-left">
                                <div className="notice-avatar">
                                    {notice.senderPic ? <img src={notice.senderPic} alt="Sender"/> : <FaUserCircle/>}
                                </div>
                                <div className="notice-content">
                                    <h4>{notice.sender} <span className="target-badge">{notice.targetYear}</span></h4>
                                    <p>{notice.message}</p>
                                    <span className="time-badge"><FaClock/> Expires in {notice.durationLabel}</span>
                                </div>
                            </div>
                            <button className="delete-notice-btn" onClick={() => handleDeleteNotice(notice.id)} title="Delete Notice">
                                <FaTrash />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="empty-notice-state">
                        <FaBullhorn style={{fontSize:'2rem', opacity:0.3}} />
                        <p>No active updates. Create one from Profile.</p>
                    </div>
                )}
            </div>
        </div>
        
      </div>
    </div>
  );
};

export default AdminDashboard;