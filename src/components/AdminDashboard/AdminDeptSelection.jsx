import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase"; 
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, getDoc, doc, serverTimestamp, query, orderBy, Timestamp } from "firebase/firestore";
import { FaPlus, FaArrowRight, FaBullhorn, FaSignOutAlt, FaUserCircle, FaPaperPlane, FaTimes } from "react-icons/fa";
import "./AdminDeptSelection.css"; 

const AdminDeptSelection = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  
  const [newDeptName, setNewDeptName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState({ name: "Admin", photo: "" });
  const [noticeMsg, setNoticeMsg] = useState("");
  const [recentDept, setRecentDept] = useState(null);

  // Gradient Classes for Random Assignment
  const gradClasses = ["grad-1", "grad-2", "grad-3", "grad-4", "grad-5"];

  useEffect(() => {
    // 1. Check Recent
    const lastDept = localStorage.getItem("currentDept");
    if(lastDept) setRecentDept(lastDept);

    // 2. Auth Check
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if(user) {
            const docSnap = await getDoc(doc(db, "admins", user.uid));
            if(docSnap.exists()) {
                setAdminData({ 
                    name: docSnap.data().name, 
                    photo: docSnap.data().profilePic || user.photoURL 
                });
            }
            fetchDepts();
        } else {
            navigate("/admin-login");
        }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchDepts = async () => {
    try {
      const q = query(collection(db, "departments"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const deptList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDepartments(deptList);
    } catch (error) { console.error("Error:", error); } 
    finally { setLoading(false); }
  };

  const handleCreateDept = async () => {
    if (!newDeptName.trim()) return;
    try {
      await addDoc(collection(db, "departments"), {
        name: newDeptName.toUpperCase(),
        createdAt: serverTimestamp(),
        studentCount: 0 
      });
      fetchDepts();
      setNewDeptName(""); setShowModal(false);
    } catch (error) { alert("Error creating department"); }
  };

  const handleSelectDept = (deptName) => {
    localStorage.setItem("currentDept", deptName);
    navigate("/admin-dashboard");
  };

  const handleGlobalBroadcast = async () => {
    if(!noticeMsg.trim()) return;
    try {
        await addDoc(collection(db, "notices"), {
            message: noticeMsg,
            targetYear: "All Years",
            department: "Global",
            durationLabel: "24 Hours",
            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
            sender: `${adminData.name} (HQ)`,
            senderPic: adminData.photo
        });
        alert("Global Notice Sent! 🌍");
        setNoticeMsg(""); setShowBroadcastModal(false);
    } catch (e) { alert("Failed to send."); }
  };

  const handleLogout = async () => {
    if(window.confirm("Logout?")) {
        await signOut(auth); localStorage.clear(); navigate("/", { replace: true });
    }
  };

  return (
    <div className="super-admin-wrapper">
      
      {/* GLASS NAVBAR */}
      <nav className="super-navbar">
        <div className="brand-box">
            <div className="brand-logo">E</div>
            <h2>EduConnect</h2>
        </div>
        
        <div className="profile-pill" onClick={handleLogout}>
            {adminData.photo ? 
                <img src={adminData.photo} alt="Adm" className="profile-img"/> 
                : <FaUserCircle style={{fontSize:'1.5rem'}}/>
            }
            <span className="profile-name">{adminData.name}</span>
            <FaSignOutAlt style={{fontSize:'0.8rem', opacity:0.7}}/>
        </div>
      </nav>

      <div className="content-container">
        
        {/* HEADER */}
        <header className="selection-header">
            <div>
                <h1>Department</h1>
                <p>Manage your campus faculties.</p>
            </div>
            <button className="global-broadcast-btn" onClick={() => setShowBroadcastModal(true)}>
                <FaBullhorn /> Broadcast
            </button>
        </header>

        {loading ? <p className="loading-txt">Loading...</p> : (
            <>
                {/* 1. WIDGET SECTION (Recent Used) */}
                {recentDept && (
                    <div className="widget-section">
                        <div className="widget-label">Suggested</div>
                        <div className="recent-widget" onClick={() => handleSelectDept(recentDept)}>
                            <div className="rw-info">
                                <h2>{recentDept}</h2>
                                <p>Continue where you left off</p>
                            </div>
                            <div className="rw-arrow"><FaArrowRight /></div>
                        </div>
                    </div>
                )}

                {/* 2. APP GRID (All Depts) */}
                <div className="widget-label">All Faculties</div>
                <div className="ios-grid">
                    
                    {/* Create App Icon */}
                    <div className="app-item" onClick={() => setShowModal(true)}>
                        <div className="app-icon-box add-app-box">
                            <FaPlus className="add-icon"/>
                        </div>
                        <span className="app-label">New Faculty</span>
                    </div>

                    {/* Department App Icons */}
                    {departments.map((dept, index) => {
                        // Random Gradient Assign
                        const gradClass = gradClasses[index % gradClasses.length];
                        const initial = dept.name.charAt(0);

                        return (
                            <div key={dept.id} className="app-item" onClick={() => handleSelectDept(dept.name)}>
                                <div className={`app-icon-box ${gradClass}`}>
                                    <span className="dept-initial">{initial}</span>
                                    {dept.studentCount > 0 && <span className="student-badge">{dept.studentCount}</span>}
                                </div>
                                <span className="app-label">{dept.name}</span>
                            </div>
                        );
                    })}
                </div>
            </>
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="modal-overlay">
            <div className="modal-box">
                <h3>New Faculty</h3>
                <input type="text" placeholder="Department Name" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} autoFocus />
                <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                    <button className="create-btn" onClick={handleCreateDept}>Add</button>
                </div>
            </div>
        </div>
      )}

      {/* BROADCAST MODAL */}
      {showBroadcastModal && (
        <div className="modal-overlay">
            <div className="modal-box">
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                    <h3>Global Notice</h3>
                    <FaTimes style={{cursor:'pointer'}} onClick={()=>setShowBroadcastModal(false)}/>
                </div>
                <textarea 
                    placeholder="Announcement for everyone..." 
                    value={noticeMsg} onChange={(e) => setNoticeMsg(e.target.value)} rows="5"
                    style={{width:'100%', padding:'10px', borderRadius:'10px', marginBottom:'15px'}}
                />
                <button className="create-btn" onClick={handleGlobalBroadcast} style={{width:'100%', display:'flex', justifyContent:'center', gap:'10px'}}>
                    <FaPaperPlane /> Send
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminDeptSelection;