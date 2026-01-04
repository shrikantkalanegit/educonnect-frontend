import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminProfile.css";
import { 
  FaUserShield, FaEdit, FaSignOutAlt, FaUsers, 
  FaKey, FaUserPlus, FaArrowLeft, FaTimes, FaCamera, FaCheckCircle 
} from "react-icons/fa";

import { auth, db } from "../../firebase";
import { signOut, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getCountFromServer } from "firebase/firestore";

const AdminProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");

  const [adminData, setAdminData] = useState({
    name: "Admin", 
    designation: "Faculty", 
    profilePic: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [studentCount, setStudentCount] = useState(0);

  // CLOUDINARY CONFIG
  const CLOUD_NAME = "dpfz1gq4y"; 
  const UPLOAD_PRESET = "ml_default"; 

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchAdminData(user.uid);
        await fetchStudentCount();
      } else {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  const fetchAdminData = async (uid) => {
    const docRef = doc(db, "admins", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setAdminData(docSnap.data());
      setEditedData(docSnap.data());
    } else {
      setEditedData(adminData);
    }
    setLoading(false);
  };

  const fetchStudentCount = async () => {
    try {
      const coll = collection(db, "users");
      const snapshot = await getCountFromServer(coll);
      setStudentCount(snapshot.data().count);
    } catch (err) { setStudentCount(0); }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET); 
    formData.append("cloud_name", CLOUD_NAME);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) {
        const user = auth.currentUser;
        await setDoc(doc(db, "admins", user.uid), { profilePic: data.secure_url }, { merge: true });
        setAdminData(prev => ({ ...prev, profilePic: data.secure_url }));
      }
    } catch (error) { alert("Upload Failed"); } 
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, "admins", user.uid), editedData, { merge: true });
    setAdminData(editedData);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    if (window.confirm("Logout?")) {
      await signOut(auth);
      navigate("/");
    }
  };

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "allowed_admins", newAdminEmail), {
        email: newAdminEmail, name: newAdminName, role: "admin", date: new Date().toISOString()
      });
      alert("Invitation Sent!");
      setShowAdminModal(false);
    } catch (error) { alert("Error: " + error.message); }
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="insta-container">
      {/* 1. TOP BAR */}
      <header className="insta-header">
        <button onClick={() => navigate('/admin-dashboard')}><FaArrowLeft /></button>
        <h3>{adminData.name || "admin_user"}</h3>
        <div style={{width: 24}}></div> {/* Spacer for alignment */}
      </header>

      {/* 2. PROFILE HEADER SECTION */}
      <div className="insta-profile-section">
        <div className="insta-row">
          {/* Avatar (Left) */}
          <div className="insta-avatar" onClick={() => fileInputRef.current.click()}>
            {adminData.profilePic ? <img src={adminData.profilePic} alt="profile" /> : <FaUserShield className="default-icon"/>}
            <div className="plus-icon"><FaCamera /></div>
            <input type="file" ref={fileInputRef} hidden onChange={handleImageChange} />
          </div>

          {/* Stats (Right) */}
          <div className="insta-stats">
            <div className="stat-item">
              <span className="stat-num">{studentCount}</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat-item">
              <span className="stat-num" style={{color:'#2ecc71'}}>Active</span>
              <span className="stat-label">System</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">Admin</span>
              <span className="stat-label">Role</span>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="insta-bio">
            {isEditing ? (
                <>
                    <input className="edit-input" value={editedData.name} onChange={e => setEditedData({...editedData, name: e.target.value})} placeholder="Name" />
                    <input className="edit-input" value={editedData.designation} onChange={e => setEditedData({...editedData, designation: e.target.value})} placeholder="Designation" />
                </>
            ) : (
                <>
                    <h4>{adminData.name}</h4>
                    <p>{adminData.designation}</p>
                    <p className="bio-link">educonnect.admin</p>
                </>
            )}
        </div>

        {/* Action Button */}
        <div className="insta-actions">
            {isEditing ? (
                <button className="insta-btn primary" onClick={handleSave}>Save Profile</button>
            ) : (
                <button className="insta-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
            )}
            <button className="insta-btn" onClick={() => setShowAdminModal(true)}>Add Admin</button>
        </div>
      </div>

      {/* 3. MENU LIST (Highlights Style) */}
      <div className="insta-menu-list">
        <div className="menu-item" onClick={() => navigate("/admin/students-list")}>
            <div className="icon-circle"><FaUsers /></div>
            <span>Manage Students</span>
        </div>
        
        <div className="menu-item" onClick={() => {
            const email = auth.currentUser?.email;
            if(email) { sendPasswordResetEmail(auth, email); alert("Reset Link Sent!"); }
        }}>
            <div className="icon-circle"><FaKey /></div>
            <span>Reset Password</span>
        </div>

        <div className="menu-item logout" onClick={handleLogout}>
            <div className="icon-circle red"><FaSignOutAlt /></div>
            <span>Log Out</span>
        </div>
      </div>

      {/* MODAL */}
      {showAdminModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>New Admin Access</h4>
              <FaTimes onClick={() => setShowAdminModal(false)} />
            </div>
            <form onSubmit={handleAddAdminSubmit}>
              <input placeholder="Name" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} required />
              <input placeholder="Email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} required />
              <button type="submit" className="save-btn">Send Invite</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;