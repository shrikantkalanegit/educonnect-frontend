import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { 
  FaBell, FaUserCircle, FaChalkboardTeacher, 
  FaCrown, FaRobot, FaQrcode, FaEllipsisV, FaBook, FaFileAlt, FaSignOutAlt,
  FaComments, FaCheckCircle, FaExclamationCircle, FaMoon, FaSun 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { doc, onSnapshot, collection, getCountFromServer } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState("");
  const [adminName, setAdminName] = useState("Admin");
  const [greeting, setGreeting] = useState("Welcome");
  const [stats, setStats] = useState({ students: 0, staff: 12, notices: 5 });
  
  // 🔘 States
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  
  // 🌗 THEME STATE (Default False = Light)
  const [darkMode, setDarkMode] = useState(false);

  // 🔔 Dummy Notifications
  const notifications = [
    { id: 1, text: "New student 'Rahul' registered.", time: "2 min ago", type: "success" },
    { id: 2, text: "Server maintenance at 12:00 PM.", time: "1 hr ago", type: "alert" },
    { id: 3, text: "Library book 'React JS' added.", time: "Yesterday", type: "info" }
  ];

  useEffect(() => {
    // 1. Check Saved Theme
    const savedTheme = localStorage.getItem("adminTheme");
    if (savedTheme === "dark") setDarkMode(true);

    // 2. Greeting Logic
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    // 3. Firebase Auth
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const unsubDoc = onSnapshot(doc(db, "admins", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.profilePic) setProfilePic(data.profilePic);
            if (data.name) setAdminName(data.name.split(" ")[0]);
          }
        });
        try {
          const studentSnap = await getCountFromServer(collection(db, "users"));
          setStats(prev => ({ ...prev, students: studentSnap.data().count }));
        } catch (e) { console.log(e); }
        return () => unsubDoc();
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 🌗 Theme Toggle Function
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("adminTheme", newMode ? "dark" : "light");
  };

  const handleLogout = async () => {
    if(window.confirm("Logout?")) { await signOut(auth); navigate("/"); }
  };

  return (
    // Dynamic Class based on Theme
    <div className={`admin-wrapper ${darkMode ? "dark-mode" : "light-mode"}`}>
      
      {/* NAVBAR */}
      <nav className="admin-navbar">
        <div className="brand-section">
          <div className="logo-icon">E</div>
          <div className="logo-text">EduConnect <span className="pro-badge">PRO</span></div>
        </div>
        
        <div className="nav-actions">
          
          {/* 👇 DARK MODE BUTTON (Fixed) */}
          <div className="icon-wrap theme-btn" onClick={toggleTheme} title="Switch Theme">
             {darkMode ? <FaSun className="sun-icon"/> : <FaMoon className="moon-icon"/>}
          </div>

          {/* NOTIFICATION BELL */}
          <div className="menu-container">
            <div className="icon-wrap" onClick={() => {setShowNotif(!showNotif); setShowMenu(false);}}>
                <FaBell />
                <span className="pulse-dot"></span>
            </div>

            {showNotif && (
                <div className="dropdown-menu notif-menu">
                    <div className="dropdown-header">Recent Alerts</div>
                    {notifications.map(notif => (
                        <div key={notif.id} className="notif-item">
                            <div className={`notif-icon ${notif.type}`}>
                                {notif.type === 'alert' ? <FaExclamationCircle /> : <FaCheckCircle />}
                            </div>
                            <div className="notif-text">
                                <p>{notif.text}</p>
                                <span>{notif.time}</span>
                            </div>
                        </div>
                    ))}
                    <div className="dropdown-footer" onClick={() => alert("All cleared!")}>Clear All</div>
                </div>
            )}
          </div>
          
          {/* PROFILE */}
          <div className="profile-section" onClick={() => navigate('/admin/profile')}>
            {profilePic ? (
                <img src={profilePic} alt="Profile" className="nav-profile-img" />
            ) : (
                <FaUserCircle className="profile-icon" />
            )}
            <span className="admin-name">{adminName}</span>
          </div>

          {/* 3-DOT MENU */}
          <div className="menu-container">
            <div className="icon-wrap three-dots" onClick={() => {setShowMenu(!showMenu); setShowNotif(false);}}>
                <FaEllipsisV />
            </div>
            {showMenu && (
                <div className="dropdown-menu">
                    <div className="dropdown-item" onClick={() => navigate('/admin/manage-books')}>
                        <FaBook className="menu-icon-sm"/> Manage Library
                    </div>
                    <div className="dropdown-item" onClick={() => navigate('/admin/exams')}>
                        <FaFileAlt className="menu-icon-sm"/> Exam Portal
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item danger" onClick={handleLogout}>
                        <FaSignOutAlt className="menu-icon-sm"/> Logout
                    </div>
                </div>
            )}
          </div>
        </div>
      </nav>

      {/* BODY */}
      <div className="admin-content">
        <header className="page-header">
          <div>
            <h1>{greeting}, {adminName} 👋</h1>
            <p>Your Command Center is Ready.</p>
          </div>
          <div className="date-badge">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
        </header>

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{stats.students}</div>
            <div className="stat-lbl">Total Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.staff}</div>
            <div className="stat-lbl">Faculty Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.notices}</div>
            <div className="stat-lbl">New Notices</div>
          </div>
        </div>
        
        {/* ACTIONS GRID */}
        <div className="section-title">QUICK ACTIONS</div>
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
      </div>
    </div>
  );
};

export default AdminDashboard;