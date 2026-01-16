import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase"; 
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, getDoc, doc, serverTimestamp, query, orderBy, Timestamp } from "firebase/firestore";
import { FaPlus, FaArrowRight, FaBullhorn, FaUniversity, FaUserFriends, FaSignOutAlt, FaUserCircle, FaPaperPlane, FaTimes } from "react-icons/fa";
import "./AdminDeptSelection.css"; 

const AdminDeptSelection = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false); // Dept Create Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false); // Global Broadcast Modal
  
  const [newDeptName, setNewDeptName] = useState("");
  const [loading, setLoading] = useState(true);

  // Admin Data State
  const [adminData, setAdminData] = useState({ name: "Admin", photo: "" });
  const [noticeMsg, setNoticeMsg] = useState("");

  useEffect(() => {
    // 1. Fetch Admin Profile & Depts
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if(user) {
            // Admin Info Fetch
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

  // 🔥 GLOBAL BROADCAST LOGIC
  const handleGlobalBroadcast = async () => {
    if(!noticeMsg.trim()) return;
    try {
        await addDoc(collection(db, "notices"), {
            message: noticeMsg,
            targetYear: "All Years",
            department: "Global", // 🌍 KEY MAGIC WORD
            durationLabel: "24 Hours",
            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
            sender: `${adminData.name} (HQ)`,
            senderPic: adminData.photo
        });
        alert("Global Notice Sent to ALL Departments! 🌍");
        setNoticeMsg("");
        setShowBroadcastModal(false);
    } catch (e) { alert("Failed to send."); }
  };

  const handleLogout = async () => {
    if(window.confirm("Logout from Super Admin?")) {
        await signOut(auth);
        localStorage.clear();
        navigate("/", { replace: true });
    }
  };

  return (
    <div className="super-admin-wrapper">
      
      <nav className="super-navbar">
        <div className="brand-box">
            <div className="brand-logo">E</div>
            <h2>EduConnect <span className="admin-tag">SUPER ADMIN</span></h2>
        </div>
        
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
            {/* 🔥 Admin Profile Pic Here */}
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                {adminData.photo ? 
                    <img src={adminData.photo} alt="Adm" style={{width:'40px', height:'40px', borderRadius:'50%', objectFit:'cover', border:'2px solid #2563eb'}}/> 
                    : <FaUserCircle style={{fontSize:'2rem', color:'#cbd5e1'}}/>
                }
                <span style={{fontWeight:'bold', color:'#334155'}}>{adminData.name}</span>
            </div>

            <button className="logout-btn-ghost" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
            </button>
        </div>
      </nav>

      <div className="content-container">
        <header className="selection-header">
            <div>
                <h1>Select Faculty 🎓</h1>
                <p>Manage specific departments or control the whole campus.</p>
            </div>
            {/* 🔥 GLOBAL BROADCAST BUTTON */}
            <button className="global-broadcast-btn" onClick={() => setShowBroadcastModal(true)}>
                <FaBullhorn /> Global Broadcast
            </button>
        </header>

        {loading ? <p className="loading-txt">Loading Campus Data...</p> : (
            <div className="dept-grid">
                <div className="dept-card create-card" onClick={() => setShowModal(true)}>
                    <div className="icon-circle add-icon"><FaPlus /></div>
                    <h3>Add Department</h3>
                    <p>Expand your campus</p>
                </div>

                {departments.map((dept) => (
                    <div key={dept.id} className="dept-card glass-card" onClick={() => handleSelectDept(dept.name)}>
                        <div className="card-top">
                            <FaUniversity className="dept-icon"/>
                            <span className="count-badge"><FaUserFriends/> {dept.studentCount || 0}</span>
                        </div>
                        <h3>{dept.name}</h3>
                        <div className="card-footer">
                            <span>Manage Portal</span>
                            <FaArrowRight />
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* CREATE DEPT MODAL */}
      {showModal && (
        <div className="modal-overlay">
            <div className="modal-box">
                <h3>Create New Faculty</h3>
                <input type="text" placeholder="Ex: BCA, CIVIL, ARTS" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} autoFocus />
                <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                    <button className="create-btn" onClick={handleCreateDept}>Create Now</button>
                </div>
            </div>
        </div>
      )}

      {/* 🔥 GLOBAL BROADCAST MODAL */}
      {showBroadcastModal && (
        <div className="modal-overlay">
            <div className="modal-box" style={{maxWidth:'500px'}}>
                <div className="v-modal-head" style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                    <h3>🌍 Global Campus Announcement</h3>
                    <FaTimes style={{cursor:'pointer'}} onClick={()=>setShowBroadcastModal(false)}/>
                </div>
                <p style={{color:'#666', fontSize:'0.9rem', marginBottom:'15px'}}>
                    This notice will be visible to <b>ALL Students & Faculty</b> across every department.
                </p>
                <textarea 
                    placeholder="Type official announcement..." 
                    value={noticeMsg} 
                    onChange={(e) => setNoticeMsg(e.target.value)} 
                    rows="5"
                    style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #ccc', marginBottom:'15px'}}
                />
                <button className="create-btn" onClick={handleGlobalBroadcast} style={{width:'100%', display:'flex', justifyContent:'center', gap:'10px'}}>
                    <FaPaperPlane /> Broadcast Globally
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminDeptSelection;