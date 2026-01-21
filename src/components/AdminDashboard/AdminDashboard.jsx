import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
// 🔥 FIX: FaClipboardList ko yahan add kar diya hai 👇
import { 
  FaBell, FaUserCircle, FaChalkboardTeacher, 
  FaCrown, FaRobot, FaQrcode, FaBook, FaFileAlt, 
  FaComments, FaUniversity, FaUserGraduate, FaBullhorn, FaUserCog, FaIdCard, FaClipboardList 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { doc, onSnapshot, collection, query, orderBy, where, getCountFromServer } from "firebase/firestore"; 
import { onAuthStateChanged } from "firebase/auth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState("");
  const [adminName, setAdminName] = useState("Admin");
  
  const [currentDept, setCurrentDept] = useState(localStorage.getItem("currentDept") || "");
  const [stats, setStats] = useState({ students: 0, faculty: 0, notices: 0 });
  const [liveNotices, setLiveNotices] = useState([]);

  // 🔥 Gradients
  const gradClassroom = "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
  const gradStaff = "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
  const gradComm = "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)";
  const gradAI = "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)";
  const gradAttend = "linear-gradient(135deg, #fa709a 0%, #fee140 100%)";
  const gradLib = "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)";
  
  useEffect(() => {
    const dept = localStorage.getItem("currentDept");
    if (!dept) { navigate("/admin/select-dept"); return; }
    setCurrentDept(dept);
  }, [navigate]);

  // 1. FETCH STATS
  useEffect(() => {
    if (!currentDept) return;
    const fetchStats = async () => {
      try {
        const studentsQ = query(collection(db, "users"), where("department", "==", currentDept), where("role", "==", "student"));
        const studentSnap = await getCountFromServer(studentsQ);

        const facultyQ = query(collection(db, "admins"), where("department", "==", currentDept));
        const facultySnap = await getCountFromServer(facultyQ);
        
        let facultyCount = facultySnap.data().count;
        if(facultyCount === 0) facultyCount = 1; 

        setStats(prev => ({
            ...prev,
            students: studentSnap.data().count,
            faculty: facultyCount
        }));
      } catch (error) { console.error("Stats Error:", error); }
    };
    fetchStats();
  }, [currentDept]);

  // 2. FETCH PROFILE
  useEffect(() => {
    let unsubSnapshot = null; 

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (unsubSnapshot) unsubSnapshot();

        unsubSnapshot = onSnapshot(doc(db, "admins", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfilePic(docSnap.data().photo || docSnap.data().profilePic);
            setAdminName(docSnap.data().name.split(" ")[0]);
          }
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  // 3. FETCH NOTICES
  useEffect(() => {
    if (!currentDept) return;
    const noticeQuery = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsubNotice = onSnapshot(noticeQuery, (snapshot) => {
        const now = Date.now();
        const validNotices = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const isMyDeptOrGlobal = (data.department === currentDept) || (data.department === "Global");
            const isNotExpired = data.expiresAt ? data.expiresAt.toMillis() > now : true;
            if (isMyDeptOrGlobal && isNotExpired) validNotices.push({ id: doc.id, ...data });
        });
        setLiveNotices(validNotices);
        setStats(prev => ({ ...prev, notices: validNotices.length }));
    });
    return () => unsubNotice();
  }, [currentDept]);

  return (
    <div className="admin-wrapper-ios">
      
      {/* NAVBAR */}
      <nav className="ios-navbar">
        <div className="brand-box">
            <div className="brand-logo">E</div>
            <h2>EduConnect</h2>
        </div>
        
        <div className="nav-profile-pill" onClick={() => navigate('/admin/profile')}>
            {profilePic ? <img src={profilePic} alt="P" /> : <FaUserCircle/>}
            <span>{adminName}</span>
        </div>
      </nav>

      <div className="ios-content">
        
        <header className="ios-header">
            <div>
                <h1>Dashboard</h1>
                <p>Welcome to <span className="dept-tag">{currentDept}</span> HQ</p>
            </div>
            <div className="switch-campus-btn" onClick={() => navigate('/admin/select-dept')}>
                <FaUniversity /> Switch
            </div>
        </header>

        {/* 1. WIDGETS */}
        <div className="widget-row">
            <div className="ios-widget large-widget">
                <div className="widget-content">
                    <h3>{stats.students}</h3>
                    <p>Total Students</p>
                    <div className="widget-icon" style={{background:'#4facfe'}}><FaUserGraduate/></div>
                </div>
            </div>
            <div className="ios-widget">
                <div className="widget-content">
                    <h3>{stats.faculty}</h3>
                    <p>Faculty</p>
                    <div className="widget-icon" style={{background:'#f093fb'}}><FaCrown/></div>
                </div>
            </div>
            <div className="ios-widget">
                <div className="widget-content">
                    <h3>{stats.notices}</h3>
                    <p>Updates</p>
                    <div className="widget-icon" style={{background:'#fa709a'}}><FaBell/></div>
                </div>
            </div>
        </div>

        {/* 2. APP LIBRARY */}
        <div className="section-label">Apps & Tools</div>
        <div className="app-grid-ios">
            
            <div className="app-icon-container" onClick={() => navigate('/admin/class-selection')}>
                <div className="app-squircle" style={{background: gradClassroom}}>
                    <FaChalkboardTeacher />
                </div>
                <span>Classes</span>
            </div>

            <div className="app-icon-container" onClick={() => navigate('/admin/staff-community')}>
                <div className="app-squircle" style={{background: gradStaff}}>
                    <FaCrown />
                </div>
                <span>Staff Room</span>
            </div>

            <div className="app-icon-container" onClick={() => navigate('/admin/manage-access')}>
                <div className="app-squircle" style={{background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'}}>
                    <FaUserCog />
                </div>
                <span>Student Mng</span>
            </div>

           {/* ID Card Generator App */}
            <div className="app-icon-container" onClick={() => navigate('/admin/id-cards')}>
                <div className="app-squircle" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                    <FaIdCard />
                </div>
                <span>ID Cards</span>
            </div>

            <div className="app-icon-container" onClick={() => navigate('/admin/community')}>
                <div className="app-squircle" style={{background: gradComm}}>
                    <FaComments />
                </div>
                <span>Community</span>
            </div>

            <div className="app-icon-container" onClick={() => navigate('/admin/ai')}>
                <div className="app-squircle" style={{background: gradAI}}>
                    <FaRobot />
                </div>
                <span>Edu AI</span>
            </div>

            <div className="app-icon-container" onClick={() => navigate('/admin/attendance')}>
                <div className="app-squircle" style={{background: gradAttend}}>
                    <FaQrcode />
                </div>
                <span>Attend</span>
            </div>
            
            {/* 🔥 Fixed Assignments Icon */}
            <div className="app-icon-container" onClick={() => navigate('/admin/assignments')}>
                <div className="app-squircle" style={{background: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)'}}>
                    <FaClipboardList />
                </div>
                <span>Assignments</span>
           </div>

            <div className="app-icon-container" onClick={() => navigate('/admin/manage-books')}>
                <div className="app-squircle" style={{background: gradLib}}>
                    <FaBook />
                </div>
                <span>Library</span>
            </div>

            <div className="app-icon-container" onClick={() => navigate('/admin/exams')}>
                <div className="app-squircle" style={{background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'}}>
                    <FaFileAlt />
                </div>
                <span>Exams</span>
            </div>
        </div>

        {/* 3. NOTICE BOARD */}
        <div className="section-label">Live Updates</div>
        <div className="ios-list-container">
            {liveNotices.length > 0 ? (
                liveNotices.map(notice => (
                    <div key={notice.id} className="ios-list-row">
                        <div className="row-icon"><FaBullhorn/></div>
                        <div className="row-info">
                            <h4>{notice.department === "Global" ? "🌍 Global Alert" : `${notice.targetYear} Update`}</h4>
                            <p>{notice.message}</p>
                        </div>
                        <div className="row-meta">
                            <span className="meta-badge">{notice.durationLabel || "New"}</span>
                        </div>
                    </div>
                ))
            ) : (
                <div style={{padding:'30px', textAlign:'center', color:'#1e293b', fontWeight:'500'}}>
                    No active notices 📭
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;