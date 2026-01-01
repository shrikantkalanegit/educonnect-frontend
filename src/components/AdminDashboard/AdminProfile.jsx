import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminProfile.css";
import { 
  FaUserShield, FaEdit, FaSave, FaSignOutAlt, FaUsers, 
  FaKey, FaBell, FaChevronRight, FaCamera, FaUserPlus, FaArrowLeft, FaTimes 
} from "react-icons/fa";

import { auth, db } from "../../firebase";
import { signOut, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getCountFromServer } from "firebase/firestore";

const AdminProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");

  const [adminData, setAdminData] = useState({
    name: "Admin User", 
    designation: "Head of Department", 
    phone: "+91 00000 00000", 
    profilePic: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [studentCount, setStudentCount] = useState(0);

  // 👇 Yahan Maine Correction Kiya Hai (Aapka Sahi Preset)
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

  // 📸 Image Upload Logic (Updated)
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET); // ✅ Ab ye sahi 'ml_default' use karega
    formData.append("cloud_name", CLOUD_NAME);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { 
        method: "POST", 
        body: formData 
      });
      
      if (!res.ok) throw new Error("Upload Failed");

      const data = await res.json();
      
      if (data.secure_url) {
        const user = auth.currentUser;
        if (user) {
          // Firestore update
          await setDoc(doc(db, "admins", user.uid), { profilePic: data.secure_url }, { merge: true });
          
          // Local State update
          setAdminData(prev => ({ ...prev, profilePic: data.secure_url }));
          setEditedData(prev => ({ ...prev, profilePic: data.secure_url }));
          
          alert("✅ Profile Photo Updated!");
        }
      }
    } catch (error) { 
        console.error(error);
        alert("❌ Photo upload failed. Check internet or Cloudinary settings."); 
    } finally { 
        setUploading(false); 
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, "admins", user.uid), editedData, { merge: true });
      setAdminData(editedData);
      setIsEditing(false);
      alert("✅ Profile Updated!");
    } catch (error) { alert("❌ Error saving profile."); }
  };

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    if(!newAdminEmail || !newAdminName) return;

    try {
      await setDoc(doc(db, "allowed_admins", newAdminEmail), {
        email: newAdminEmail,
        name: newAdminName,
        role: "admin",
        addedBy: adminData.name,
        date: new Date().toISOString()
      });
      alert(`✅ Invitation Sent!\n\n${newAdminName} can now SignUp as Admin.`);
      setShowAdminModal(false);
      setNewAdminEmail("");
      setNewAdminName("");
    } catch (error) {
      console.error(error);
      alert("❌ Failed: " + error.message);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to Logout?")) {
      await signOut(auth);
      navigate("/");
    }
  };

  const handleResetPassword = async () => {
    const email = auth.currentUser?.email;
    if (email) {
      await sendPasswordResetEmail(auth, email);
      alert(`📧 Reset link sent to ${email}`);
    }
  };

  if (loading) return <div className="admin-loading">Loading Profile...</div>;

  return (
    <div className="profile-container">
      <header className="profile-top-bar">
        {/* Back Button */}
        <button className="back-btn-circle" onClick={() => navigate('/admin-dashboard')}>
            <FaArrowLeft />
        </button>
        <h3>Admin Profile</h3>
      </header>
      
      {/* SECTION A: CARD */}
      <div className="profile-header-card">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {adminData.profilePic ? (
                <img src={adminData.profilePic} alt="Profile" />
            ) : (
                <FaUserShield />
            )}
          </div>
          {/* Camera Icon triggers hidden input */}
          <div className="camera-btn" onClick={() => fileInputRef.current.click()}>
            <FaCamera />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            accept="image/*" 
            onChange={handleImageChange} 
          />
        </div>
        
        <div className="profile-info">
          {isEditing ? (
            <div className="edit-form">
              <input 
                type="text" 
                value={editedData.name} 
                onChange={(e) => setEditedData({...editedData, name: e.target.value})} 
                placeholder="Enter Name" 
              />
              <input 
                type="text" 
                value={editedData.designation} 
                onChange={(e) => setEditedData({...editedData, designation: e.target.value})} 
                placeholder="Designation" 
              />
            </div>
          ) : (
            <>
              <h2>{adminData.name || "Admin"}</h2>
              <p>{adminData.designation || "Faculty Member"}</p>
              {uploading && <small style={{color:'#f1c40f'}}>Uploading Photo...</small>}
            </>
          )}
        </div>

        <button className="edit-btn" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
          {isEditing ? <FaSave /> : <FaEdit />}
        </button>
      </div>

      {/* SECTION B: STATS */}
      <div className="stats-grid">
        <div className="stat-box">
          <FaUsers className="stat-icon color-blue" />
          <div><h3>{studentCount}</h3><span>Total Students</span></div>
        </div>
        <div className="stat-box">
          <FaBell className="stat-icon color-orange" />
          <div><h3>Active</h3><span>System Status</span></div>
        </div>
      </div>

      {/* SECTION C: MENU */}
      <div className="control-menu">
        <h3>System Controls</h3>
        
        <div className="menu-item" onClick={() => setShowAdminModal(true)}>
          <div className="icon-bg green-bg"><FaUserPlus /></div>
          <div className="menu-text"><h4>Add New Admin</h4><p>Authorize another teacher</p></div>
          <FaChevronRight className="arrow" />
        </div>
        
        <div className="menu-item" onClick={() => navigate("/admin/students-list")}>
          <div className="icon-bg blue-bg"><FaUsers /></div>
          <div className="menu-text"><h4>Manage Students</h4><p>View list, block or remove students</p></div>
          <FaChevronRight className="arrow" />
        </div>
        
        <div className="menu-item" onClick={handleResetPassword}>
          <div className="icon-bg yellow-bg"><FaKey /></div>
          <div className="menu-text"><h4>Security</h4><p>Change Admin Password</p></div>
          <FaChevronRight className="arrow" />
        </div>
        
        <div className="menu-item logout-item" onClick={handleLogout}>
          <div className="icon-bg gray-bg"><FaSignOutAlt /></div>
          <div className="menu-text"><h4>Logout</h4><p>Sign out from device</p></div>
        </div>
      </div>

      {/* MODAL */}
      {showAdminModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Admin</h3>
              <button className="close-btn" onClick={() => setShowAdminModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleAddAdminSubmit}>
              <div className="form-group">
                <label>Admin Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Prof. Sharma" 
                  value={newAdminName} 
                  onChange={(e) => setNewAdminName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Admin Email</label>
                <input 
                  type="email" 
                  placeholder="teacher@college.com" 
                  value={newAdminEmail} 
                  onChange={(e) => setNewAdminEmail(e.target.value)} 
                  required 
                />
              </div>
              <p className="modal-note">Note: This will allow this email to Sign Up as an Admin.</p>
              <button type="submit" className="submit-btn">Send Invite</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProfile;