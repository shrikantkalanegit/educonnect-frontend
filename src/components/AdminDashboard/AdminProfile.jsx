import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminProfile.css"; 
import { 
  FaCamera, FaChevronLeft, FaChevronRight, FaTimes, 
  FaShieldAlt, FaBullhorn, FaUserPlus, 
  FaIdBadge, FaCheck 
} from "react-icons/fa";

import { auth, db } from "../../firebase";
import { signOut, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, addDoc, setDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import Cropper from "react-easy-crop"; 
import { getCroppedImg } from "../../utils/cropUtils"; 

const AdminProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ name: "Admin", email: "", role: "Super Admin", photo: "" });

  // --- MODALS ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  // --- FORMS ---
  const [newName, setNewName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  
  // Notice Form
  const [noticeMsg, setNoticeMsg] = useState("");
  const [noticeTarget, setNoticeTarget] = useState("All Years");
  const [customExpiry, setCustomExpiry] = useState(""); 

  // --- CROPPER STATE ---
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null); 
  const [isCropping, setIsCropping] = useState(false);

  // Fetch Data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "admins", user.uid));
        if (snap.exists()) {
          setUserData(snap.data());
          setNewName(snap.data().name);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- IMAGE HANDLING ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels); 
  };

  const showCroppedImage = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const localUrl = URL.createObjectURL(croppedBlob);
      setUserData(prev => ({ ...prev, photo: localUrl }));
      
      const reader = new FileReader();
      reader.readAsDataURL(croppedBlob);
      reader.onloadend = async () => {
          await updateDoc(doc(db, "admins", auth.currentUser.uid), { photo: reader.result });
      }
      setIsCropping(false);
    } catch (e) { console.error(e); }
  };

  // --- ACTIONS ---
  const handleUpdateName = async () => {
    if(!newName.trim()) return;
    await updateDoc(doc(db, "admins", auth.currentUser.uid), { name: newName });
    setUserData({ ...userData, name: newName });
    setShowEditModal(false);
  };

  // 🔥 MAIN FIX: Invite Admin Function
  const handleAddAdmin = async () => {
    if(!newAdminEmail || !newAdminName) return alert("Fill details");
    
    // 1. Email ko clean (lowercase) karo taaki ID match ho sake
    const cleanEmail = newAdminEmail.trim().toLowerCase();

    // 2. addDoc nahi, setDoc use karo aur ID = Email rakho
    await setDoc(doc(db, "allowed_admins", cleanEmail), {
        email: cleanEmail, 
        name: newAdminName, 
        addedBy: userData.email, 
        createdAt: serverTimestamp()
    });

    alert(`Invitation Sent to ${cleanEmail}!`);
    setShowAdminModal(false);
    setNewAdminEmail(""); setNewAdminName("");
  };

  const handleSendNotice = async () => {
    if(!noticeMsg || !customExpiry) return alert("Message & Date required!");
    const expiryDate = new Date(customExpiry);
    const now = new Date();
    
    const diffHours = Math.ceil((expiryDate - now) / (1000 * 60 * 60));
    const durationLabel = diffHours > 24 ? `${Math.ceil(diffHours/24)} Days` : `${diffHours} Hours`;

    await addDoc(collection(db, "notices"), {
        message: noticeMsg, targetYear: noticeTarget, department: localStorage.getItem("currentDept") || "Global",
        sender: userData.name, createdAt: serverTimestamp(), expiresAt: Timestamp.fromDate(expiryDate), durationLabel: durationLabel
    });
    alert("Notice Sent!");
    setShowNoticeModal(false);
    setNoticeMsg(""); setCustomExpiry("");
  };

  const handleLogout = async () => {
    if(window.confirm("Logout?")) {
        await signOut(auth);
        navigate("/");
    }
  };

  if (loading) return <div className="aurora-loading"></div>;

  return (
    <div className="aurora-profile-page">
      
      {/* HEADER */}
      <div className="aurora-nav-header">
        <button className="aurora-back-btn" onClick={() => navigate('/admin-dashboard')}>
            <FaChevronLeft /> Dashboard
        </button>
        <h1>Settings</h1>
        <div style={{width:'50px'}}></div>
      </div>

      <div className="aurora-scroll-content">
        
        {/* PROFILE HEADER */}
        <div className="aurora-profile-header">
            <div className="aurora-avatar-wrapper">
                <img src={userData.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Admin" />
                <button className="aurora-cam-btn" onClick={() => fileInputRef.current.click()}>
                    <FaCamera />
                </button>
                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />
            </div>
            <h2>{userData.name}</h2>
            <p>{userData.role}</p>
            <button className="aurora-edit-pill" onClick={() => setShowEditModal(true)}>Edit Profile</button>
        </div>

        {/* MENU 1 */}
        <div className="aurora-list-group">
            <div className="aurora-list-item" onClick={() => setShowAdminModal(true)}>
                <div className="aurora-icon green"><FaUserPlus /></div>
                <span className="aurora-label">Invite Admin</span>
                <FaChevronRight className="aurora-arrow"/>
            </div>
            <div className="aurora-list-item" onClick={() => setShowNoticeModal(true)}>
                <div className="aurora-icon orange"><FaBullhorn /></div>
                <span className="aurora-label">Campus Update</span>
                <FaChevronRight className="aurora-arrow"/>
            </div>
            <div className="aurora-list-item" onClick={() => navigate('/admin/manage-access')}>
                <div className="aurora-icon purple"><FaShieldAlt /></div>
                <span className="aurora-label">Student Manager</span>
                <FaChevronRight className="aurora-arrow"/>
            </div>
        </div>

        {/* MENU 2 */}
        <div className="aurora-list-group">
            <div className="aurora-list-item" onClick={() => {sendPasswordResetEmail(auth, userData.email); alert("Check Email!");}}>
                <div className="aurora-icon blue"><FaIdBadge /></div>
                <span className="aurora-label">Change Password</span>
                <FaChevronRight className="aurora-arrow"/>
            </div>
        </div>

        {/* LOGOUT */}
        <div className="aurora-list-group">
            <div className="aurora-list-item center-text" onClick={handleLogout}>
                <span className="aurora-label red-text">Log Out</span>
            </div>
        </div>
      </div>

      {/* MODALS */}
      {showEditModal && (
        <div className="glass-modal-overlay">
            <div className="glass-modal">
                <div className="glass-modal-header"><h3>Edit Name</h3><FaTimes onClick={()=>setShowEditModal(false)}/></div>
                <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Full Name" className="glass-input"/>
                <button className="glass-btn-primary" onClick={handleUpdateName}>Save</button>
            </div>
        </div>
      )}

      {showAdminModal && (
        <div className="glass-modal-overlay">
            <div className="glass-modal">
                <div className="glass-modal-header"><h3>Invite Admin</h3><FaTimes onClick={()=>setShowAdminModal(false)}/></div>
                <input placeholder="Name" value={newAdminName} onChange={e=>setNewAdminName(e.target.value)} className="glass-input"/>
                <input placeholder="Email" value={newAdminEmail} onChange={e=>setNewAdminEmail(e.target.value)} className="glass-input"/>
                <button className="glass-btn-primary" onClick={handleAddAdmin}>Send Invite</button>
            </div>
        </div>
      )}

      {showNoticeModal && (
        <div className="glass-modal-overlay">
            <div className="glass-modal">
                <div className="glass-modal-header"><h3>Post Update</h3><FaTimes onClick={()=>setShowNoticeModal(false)}/></div>
                
                <label className="glass-label-sm">Target</label>
                <select value={noticeTarget} onChange={e=>setNoticeTarget(e.target.value)} className="glass-input">
                    <option value="All Years">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                </select>

                <label className="glass-label-sm">Expires On</label>
                <input 
                    type="datetime-local" 
                    className="glass-input"
                    value={customExpiry}
                    onChange={(e) => setCustomExpiry(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)} 
                />

                <label className="glass-label-sm">Message</label>
                <textarea rows="3" placeholder="Type here..." value={noticeMsg} onChange={e=>setNoticeMsg(e.target.value)} className="glass-input"/>
                
                <button className="glass-btn-primary" onClick={handleSendNotice}>Post</button>
            </div>
        </div>
      )}

      {isCropping && (
         <div className="cropper-fullscreen">
            <div className="crop-container">
                <Cropper
                    image={imageSrc} crop={crop} zoom={zoom} aspect={1}
                    onCropChange={setCrop} onZoomChange={setZoom} 
                    onCropComplete={onCropComplete} 
                    cropShape="round"
                />
            </div>
            <div className="crop-controls-bar">
                <button onClick={() => setIsCropping(false)} className="crop-btn cancel">Cancel</button>
                <button onClick={showCroppedImage} className="crop-btn save"><FaCheck/> Done</button>
            </div>
         </div>
      )}

    </div>
  );
};

export default AdminProfile;