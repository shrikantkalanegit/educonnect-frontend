import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminProfile.css";
import { 
  FaUserAstronaut, FaCrown, FaCamera, FaArrowLeft, FaTimes, 
  FaShieldAlt, FaHistory, FaIdCard, FaBullhorn, FaSignOutAlt, FaKey, FaUsers, FaGem, FaPaperPlane,
  FaChevronRight 
} from "react-icons/fa";

import { auth, db } from "../../firebase";
import { signOut, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, getCountFromServer, serverTimestamp, Timestamp } from "firebase/firestore";

const AdminProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false); 

  // Forms
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  
  // Notice States
  const [noticeMsg, setNoticeMsg] = useState("");
  const [noticeTarget, setNoticeTarget] = useState("All Years");
  const [noticeDuration, setNoticeDuration] = useState("24");

  const [studentCount, setStudentCount] = useState(0);
  const [adminData, setAdminData] = useState({
    name: "Admin", designation: "Faculty", profilePic: "", role: "Super Admin"
  });
  const [currentDept, setCurrentDept] = useState(""); 
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  const CLOUD_NAME = "dpfz1gq4y"; 
  const UPLOAD_PRESET = "ml_default"; 

  useEffect(() => {
    const dept = localStorage.getItem("currentDept") || "General";
    setCurrentDept(dept);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchAdminData(user.uid);
        await fetchStudentCount();
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchAdminData = async (uid) => {
    const docSnap = await getDoc(doc(db, "admins", uid));
    if (docSnap.exists()) {
      setAdminData(docSnap.data());
      setEditedData(docSnap.data());
    }
  };

  const fetchStudentCount = async () => {
    try {
        const snap = await getCountFromServer(collection(db, "users"));
        setStudentCount(snap.data().count);
    } catch(e) { setStudentCount(0); }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setAdminData(prev => ({ ...prev, profilePic: objectUrl }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET); 
    formData.append("cloud_name", CLOUD_NAME);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) {
        await setDoc(doc(db, "admins", auth.currentUser.uid), { profilePic: data.secure_url }, { merge: true });
      }
    } catch (err) { alert("Photo Upload Error"); }
  };

  const handleSave = async () => {
    await setDoc(doc(db, "admins", auth.currentUser.uid), editedData, { merge: true });
    setAdminData(editedData);
    setIsEditing(false);
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "allowed_admins", newAdminEmail), {
        email: newAdminEmail, name: newAdminName, role: "admin", date: new Date().toISOString()
      });
      alert("VIP Invitation Sent!"); setShowAdminModal(false);
    } catch (e) { alert("Error"); }
  };

  const handleSendNotice = async () => {
    if(!noticeMsg) return alert("Please write a message!");
    const now = new Date();
    let expiryTime = new Date();
    if(noticeDuration === "0.08") expiryTime.setMinutes(now.getMinutes() + 5);
    else expiryTime.setHours(now.getHours() + parseInt(noticeDuration));

    try {
        await addDoc(collection(db, "notices"), {
            message: noticeMsg,
            targetYear: noticeTarget,
            department: currentDept,
            durationLabel: noticeDuration === "0.08" ? "5 Mins" : `${noticeDuration} Hours`,
            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(expiryTime),
            sender: adminData.name,
            senderPic: adminData.profilePic || ""
        });
        alert("Campus Update Broadcasted! 📢");
        setNoticeMsg(""); setShowNoticeModal(false);
    } catch(error) { alert("Failed to send notice."); }
  };

  const MenuItem = ({ icon, label, subtext, onClick, isDestructive, badge }) => (
    <div className={`vip-menu-item ${isDestructive ? 'destructive' : ''}`} onClick={onClick}>
        <div className="vip-icon-box">{icon}</div>
        <div className="vip-menu-text">
            <h4>{label} {badge && <span className="menu-badge">{badge}</span>}</h4>
            <p>{subtext}</p>
        </div>
        <FaChevronRight className="vip-arrow" />
    </div>
  );

  const inputStyle = { width:'100%', padding:'10px', background:'#333', color:'white', border:'1px solid #555', borderRadius:'8px', marginBottom:'15px' };

  if (loading) return <div className="vip-loading">Loading Luxury Profile...</div>;

  return (
    <div className="vip-container">
      <header className="vip-header">
        <button className="vip-back-btn" onClick={() => navigate('/admin-dashboard')}>
            <FaArrowLeft />
        </button>
        <h3>My Profile</h3>
        <div className="vip-spacer"></div>
      </header>

      <div className="vip-card-wrapper">
        <div className="vip-black-card">
            <div className="card-top">
                <FaCrown className="gold-crown" />
                <span className="card-label">VERIFIED ADMIN</span>
            </div>
            
            <div className="card-body">
                <div className="vip-avatar-group">
                    <div className="vip-avatar">
                        {adminData.profilePic ? <img src={adminData.profilePic} alt="Profile" /> : <FaUserAstronaut />}
                    </div>
                    <div className="camera-bubble" onClick={() => fileInputRef.current.click()}>
                        <FaCamera />
                    </div>
                    <input type="file" hidden ref={fileInputRef} onChange={handleImageChange} />
                </div>

                <div className="vip-info">
                    {isEditing ? (
                        <div className="vip-edit-form">
                            <input value={editedData.name} onChange={e=>setEditedData({...editedData, name:e.target.value})} placeholder="Name"/>
                            <input value={editedData.designation} onChange={e=>setEditedData({...editedData, designation:e.target.value})} placeholder="Role"/>
                            <div className="edit-actions">
                                <button className="save-btn" onClick={handleSave}>Save</button>
                                <button className="cancel-btn" onClick={()=>setIsEditing(false)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2>{adminData.name} <FaGem className="verified-icon"/></h2>
                            <p>{adminData.designation}</p>
                            <button className="vip-edit-link" onClick={() => setIsEditing(true)}>Edit Profile Details</button>
                        </>
                    )}
                </div>
            </div>

            <div className="card-footer">
                <div className="c-stat"><span>Students</span><strong>{studentCount}</strong></div>
                <div className="c-stat"><span>Faculty</span><strong>{currentDept}</strong></div>
                <div className="c-stat"><span>Status</span><strong style={{color:'#4ade80'}}>Active</strong></div>
            </div>
        </div>
      </div>

      <div className="vip-menu-section">
        <h3>Management</h3>
        <div className="vip-glass-box">
            {/* 👇 FIXED LINK: Now points to AdminStudentManager (Whitelisting) */}
            <MenuItem 
                icon={<FaUsers />} 
                label="Manage Students" 
                subtext="Add IDs & Whitelist" 
                onClick={() => navigate("/admin/manage-access")} 
            />
            <MenuItem icon={<FaShieldAlt />} label="Add New Admin" subtext="Grant Access" onClick={() => setShowAdminModal(true)} />
            <MenuItem icon={<FaIdCard />} label="ID Card Generator" subtext="Create Digital IDs" badge="New" onClick={() => alert("Coming Soon!")} />
        </div>

        <h3>System & Logs</h3>
        <div className="vip-glass-box">
            <MenuItem icon={<FaHistory />} label="Activity Log" subtext="View recent actions" onClick={() => alert("No recent activity.")} />
            <MenuItem icon={<FaBullhorn />} label="Campus Updates" subtext="Broadcast Notices" onClick={() => setShowNoticeModal(true)} />
        </div>

        <h3>Settings</h3>
        <div className="vip-glass-box">
            <MenuItem icon={<FaKey />} label="Change Password" subtext="Security" onClick={() => {if(auth.currentUser?.email) { sendPasswordResetEmail(auth, auth.currentUser.email); alert("Reset Email Sent!"); }}} />
            <MenuItem 
                icon={<FaSignOutAlt />} label="Sign Out" subtext="Secure Exit" isDestructive={true} 
                onClick={async () => {
                    if(window.confirm("Confirm Logout?")) { 
                        await signOut(auth); localStorage.clear(); navigate("/", { replace: true }); 
                    }
                }} 
            />
        </div>
      </div>

      {showAdminModal && (
        <div className="vip-modal-overlay">
          <div className="vip-modal">
            <div className="v-modal-head"><h3>Invite Admin</h3><FaTimes onClick={()=>setShowAdminModal(false)}/></div>
            <input placeholder="Admin Name" value={newAdminName} onChange={e=>setNewAdminName(e.target.value)} />
            <input placeholder="Email Address" value={newAdminEmail} onChange={e=>setNewAdminEmail(e.target.value)} />
            <button className="vip-modal-btn" onClick={handleAddAdmin}>Send Invite</button>
          </div>
        </div>
      )}

      {showNoticeModal && (
        <div className="vip-modal-overlay">
          <div className="vip-modal">
            <div className="v-modal-head"><h3>📢 Campus Update</h3><FaTimes onClick={()=>setShowNoticeModal(false)}/></div>
            <p className="modal-label">Faculty: <strong>{currentDept}</strong></p>
            <label className="modal-sublabel">Target Audience:</label>
            <select value={noticeTarget} onChange={(e) => setNoticeTarget(e.target.value)} style={inputStyle}>
                <option value="All Years">All Years</option>
                <option value="1st Year">1st Year Only</option>
                <option value="2nd Year">2nd Year Only</option>
                <option value="3rd Year">3rd Year Only</option>
                <option value="4th Year">4th Year Only</option>
            </select>
            <label className="modal-sublabel">Notice Duration (Auto-Delete):</label>
            <select value={noticeDuration} onChange={(e) => setNoticeDuration(e.target.value)} style={inputStyle}>
                <option value="24">24 Hours (Standard)</option>
                <option value="48">2 Days</option>
                <option value="168">1 Week</option>
                <option value="0.08">⚡ 5 Minutes (Testing)</option>
            </select>
            <textarea 
                placeholder="Type your notice here..." value={noticeMsg} onChange={e=>setNoticeMsg(e.target.value)} rows="4" 
                style={{...inputStyle, fontFamily:'inherit'}}
            />
            <button className="vip-modal-btn" onClick={handleSendNotice}>
                <FaPaperPlane style={{marginRight:'8px'}}/> Broadcast Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;