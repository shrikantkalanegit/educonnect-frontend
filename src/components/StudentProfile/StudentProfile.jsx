import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentProfile.css"; 
import { 
  FaCamera, FaSignOutAlt, FaUniversity, FaUserGraduate, 
  FaCalendarAlt, FaFileAlt, FaChartPie, FaIdCard, FaCheck, 
  FaTint, FaBirthdayCake, FaPhone, FaMapMarkerAlt, FaEnvelope, FaArrowLeft, FaPen, FaSave, FaTimes
} from "react-icons/fa";

import { auth, db } from "../../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Cropper from "react-easy-crop"; 
import { getCroppedImg } from "../../utils/cropUtils"; 

const StudentProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // 🔥 EDIT MODE STATE

  // Main Data
  const [studentData, setStudentData] = useState({
    name: "Student", email: "", studentId: "", department: "", year: "",
    photo: "", attendance: 0, cgpa: "0.0",
    dob: "", bloodGroup: "", mobile: "", address: ""
  });

  // Form Data (For Editing)
  const [formData, setFormData] = useState({});

  // Cropper State
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  // 1. Fetch Data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) {
              const data = snap.data();
              setStudentData({ ...data, id: user.uid });
              setFormData(data); // Initialize form
            }
        } catch (error) { console.error("Error:", error); }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 3. Save Profile Updates
  const handleSaveProfile = async () => {
    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), formData);
        setStudentData(formData);
        setIsEditing(false);
        alert("Profile Updated Successfully! ✅");
    } catch (error) {
        alert("Error updating profile.");
    }
  };

  // 4. Image Handling
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => { setImageSrc(reader.result); setIsCropping(true); };
      reader.readAsDataURL(file);
    }
  };

  const showCroppedImage = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const localUrl = URL.createObjectURL(croppedBlob);
      setStudentData(prev => ({ ...prev, photo: localUrl }));
      
      const reader = new FileReader();
      reader.readAsDataURL(croppedBlob);
      reader.onloadend = async () => {
          await updateDoc(doc(db, "users", auth.currentUser.uid), { photo: reader.result });
      }
      setIsCropping(false);
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    if(window.confirm("Logging out?")) { await signOut(auth); navigate("/"); }
  };

  if (loading) return <div className="sp-loading">Getting Ready...</div>;

  return (
    <div className="sp-container">
      
      {/* HEADER */}
      <header className="sp-header">
        <div className="header-left">
            <button className="sp-back-btn" onClick={() => navigate(-1)}>
                <FaArrowLeft />
            </button>
            <div className="brand-pill">EduConnect</div>
        </div>
        
        {/* 🔥 EDIT TOGGLE BUTTON */}
        <div className="header-actions">
            {isEditing ? (
                <>
                    <button className="action-pill cancel" onClick={() => { setIsEditing(false); setFormData(studentData); }}>
                        <FaTimes/> Cancel
                    </button>
                    <button className="action-pill save" onClick={handleSaveProfile}>
                        <FaSave/> Save
                    </button>
                </>
            ) : (
                <button className="action-pill edit" onClick={() => setIsEditing(true)}>
                    <FaPen/> Edit Profile
                </button>
            )}
            <button className="logout-pill" onClick={handleLogout}><FaSignOutAlt/></button>
        </div>
      </header>

      <div className="sp-content">
        
        {/* --- 1. DIGITAL ID CARD --- */}
        <div className="digital-id-card">
            <div className="id-header">
                <FaUniversity className="uni-logo" />
                <span>OFFICIAL STUDENT ID</span>
            </div>
            
            <div className="id-body">
                <div className="id-photo-box">
                    <img 
                        src={studentData.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                        alt="Profile" 
                    />
                    {isEditing && (
                        <div className="cam-overlay" onClick={() => fileInputRef.current.click()}>
                            <FaCamera />
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />
                </div>
                
                <div className="id-details">
                    <h2>{studentData.name}</h2>
                    <p className="id-roll">{studentData.studentId}</p>
                    <div className="id-chips">
                        <span>{studentData.department}</span>
                        <span>{studentData.year}</span>
                    </div>
                </div>
            </div>

            {/* EDITABLE FIELDS: DOB & BLOOD */}
            <div className="id-extras">
                <div className="extra-item">
                    <FaBirthdayCake className="extra-icon"/>
                    <div>
                        <small>DOB</small>
                        {isEditing ? (
                            <input 
                                type="date" name="dob" 
                                value={formData.dob || ""} 
                                onChange={handleChange} 
                                className="edit-input-sm"
                            />
                        ) : (
                            <strong>{studentData.dob || "N/A"}</strong>
                        )}
                    </div>
                </div>
                <div className="extra-item">
                    <FaTint className="extra-icon red-tint"/>
                    <div>
                        <small>Blood Group</small>
                        {isEditing ? (
                            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="edit-input-sm">
                                <option value="">Select</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                            </select>
                        ) : (
                            <strong>{studentData.bloodGroup || "N/A"}</strong>
                        )}
                    </div>
                </div>
            </div>

            <div className="id-footer">
                <span>Authorized Student</span>
                <span className="verified-badge"><FaCheck/> Verified</span>
            </div>
        </div>

        {/* --- 2. PERSONAL INFO (Editable) --- */}
        <div className="info-glass-card">
            
            {/* Mobile */}
            <div className="info-row">
                <div className="info-icon"><FaPhone/></div>
                <div className="info-text full-width">
                    <small>Mobile Number</small>
                    {isEditing ? (
                        <input 
                            name="mobile" value={formData.mobile || ""} 
                            onChange={handleChange} placeholder="+91..."
                            className="edit-input"
                        />
                    ) : (
                        <p>{studentData.mobile || "Not Added"}</p>
                    )}
                </div>
            </div>
            
            <div className="info-divider"></div>
            
            {/* Email (Read Only) */}
            <div className="info-row">
                <div className="info-icon"><FaEnvelope/></div>
                <div className="info-text">
                    <small>Email Address (Locked)</small>
                    <p style={{opacity:0.7}}>{studentData.email}</p>
                </div>
            </div>
            
            <div className="info-divider"></div>
            
            {/* Address */}
            <div className="info-row">
                <div className="info-icon"><FaMapMarkerAlt/></div>
                <div className="info-text full-width">
                    <small>Permanent Address</small>
                    {isEditing ? (
                        <textarea 
                            name="address" value={formData.address || ""} 
                            onChange={handleChange} placeholder="Enter full address..."
                            className="edit-textarea" rows="2"
                        />
                    ) : (
                        <p>{typeof studentData.address === 'object' ? "Update Address" : (studentData.address || "Not Added")}</p>
                    )}
                </div>
            </div>
        </div>

        {/* --- 3. LIVE STATS --- */}
        <div className="sp-stats-row">
            <div className="stat-glass-card">
                <div className="stat-ring" style={{background: `conic-gradient(#4ade80 ${studentData.attendance || 0}%, transparent 0)`}}>
                    <div className="inner-ring">
                        <span>{studentData.attendance || 0}%</span>
                    </div>
                </div>
                <p>Attendance</p>
            </div>

            <div className="stat-glass-card">
                <div className="stat-icon-box"><FaUserGraduate/></div>
                <h3>{studentData.cgpa || "0.0"}</h3>
                <p>CGPA</p>
            </div>
        </div>

        {/* --- 4. QUICK ACTIONS --- */}
        <div className="sp-menu-grid">
            <div className="sp-menu-item" onClick={() => alert("Coming Soon!")}>
                <div className="sp-icon blue"><FaCalendarAlt/></div>
                <span>Timetable</span>
            </div>
            <div className="sp-menu-item" onClick={() => alert("Coming Soon!")}>
                <div className="sp-icon purple"><FaFileAlt/></div>
                <span>Results</span>
            </div>
            <div className="sp-menu-item" onClick={() => alert("Coming Soon!")}>
                <div className="sp-icon orange"><FaIdCard/></div>
                <span>Library</span>
            </div>
            <div className="sp-menu-item" onClick={() => alert("Coming Soon!")}>
                <div className="sp-icon green"><FaChartPie/></div>
                <span>Fees</span>
            </div>
        </div>

      </div>

      {/* --- CROPPER --- */}
      {isCropping && (
         <div className="cropper-fullscreen">
            <div className="crop-container">
                <Cropper
                    image={imageSrc} crop={crop} zoom={zoom} aspect={1}
                    onCropChange={setCrop} onZoomChange={setZoom} 
                    onCropComplete={(a, p) => setCroppedAreaPixels(p)} 
                    cropShape="round"
                />
            </div>
            <div className="crop-controls-bar">
                <button onClick={() => setIsCropping(false)} className="crop-btn cancel">Cancel</button>
                <button onClick={showCroppedImage} className="crop-btn save">Set Photo</button>
            </div>
         </div>
      )}

    </div>
  );
};

export default StudentProfile;