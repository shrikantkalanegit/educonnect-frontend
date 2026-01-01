import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Back button ke liye
import { auth, db } from "../../firebase"; 
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore"; 
import "./StudentProfile.css"; 
import { FaCamera, FaUserEdit, FaEnvelope, FaGraduationCap, FaIdBadge, FaArrowLeft, FaSave, FaTimes } from "react-icons/fa";

const StudentProfile = () => {
  const navigate = useNavigate(); // Navigation hook
  const user = auth.currentUser;
  
  // --- STATES ---
  const [photoURL, setPhotoURL] = useState("https://cdn-icons-png.flaticon.com/512/149/149071.png");
  const [name, setName] = useState("Student Name");
  const [bio, setBio] = useState("Code, Create, Innovate.");
  
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Edit Mode ON/OFF karne ke liye

  // --- DATA LOAD ---
  useEffect(() => {
    if (user) {
      setPhotoURL(user.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png");
      setName(user.displayName || "Student Name");
      
      // Database se Bio aur extra details lana
      const fetchUserData = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
           const data = docSnap.data();
           if(data.bio) setBio(data.bio);
        }
      }
      fetchUserData();
    }
  }, [user]);

  // --- CLOUDINARY UPLOAD ---
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);

    const cloudName = "dpfz1gq4y"; 
    const uploadPreset = "ml_default"; 

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);
    data.append("cloud_name", cloudName);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST", body: data,
      });
      
      if (!res.ok) throw new Error("Upload Failed. Check Cloudinary Preset (Must be Unsigned)");

      const cloudData = await res.json();
      const newPhotoURL = cloudData.secure_url;

      // Firebase Update
      await updateProfile(user, { photoURL: newPhotoURL });
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { photoURL: newPhotoURL }, { merge: true });

      setPhotoURL(newPhotoURL);
      alert("Profile Pic Updated! 🎉");
    } catch (error) {
      console.error(error);
      alert("❌ Photo Upload Error: Cloudinary Settings check karein (Unsigned Preset).");
    }
    setLoading(false);
  };

  // --- SAVE PROFILE ---
  const handleSaveProfile = async () => {
    if(!user) return;
    setLoading(true);
    try {
        // 1. Auth Profile Update (Name)
        await updateProfile(user, { displayName: name });

        // 2. Firestore Update (Bio & Name)
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { 
            displayName: name,
            bio: bio 
        }, { merge: true }); // 'merge: true' zaroori hai taki baki data delete na ho

        setIsEditing(false);
        alert("Profile Updated Successfully! ✅");
    } catch (error) {
        console.error(error);
        alert("Error updating profile.");
    }
    setLoading(false);
  };

  return (
    <div className="profile-container">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>

      <div className="profile-wrapper">
        
        {/* --- COVER PHOTO HEADER --- */}
        <div className="profile-cover">
            {/* 🔙 BACK BUTTON */}
            <button className="back-btn-float" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Back
            </button>
            
            <div className="profile-pic-container">
                <img src={photoURL} alt="Profile" className="profile-pic" />
                
                {/* Camera Icon - Sirf tab dikhega jab Edit Mode OFF ho ya ON ho (Hamesha dikha sakte hain) */}
                <label htmlFor="fileInput" className="cam-icon">
                    <FaCamera />
                </label>
                <input 
                    type="file" id="fileInput" 
                    style={{ display: "none" }} 
                    onChange={handleImageChange} accept="image/*"
                />
            </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="profile-content">
            
            <div className="info-header">
                {isEditing ? (
                    // ✏️ EDIT MODE
                    <>
                        <input 
                            type="text" 
                            className="edit-input name-input" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                        />
                        <textarea 
                            className="edit-textarea" 
                            rows="2"
                            value={bio} 
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </>
                ) : (
                    // 👀 VIEW MODE
                    <>
                        <h1>{name}</h1>
                        <p className="role-text">Student • TYBSC-CS</p> 
                        <p className="bio-text">"{bio}"</p>
                    </>
                )}
            </div>

            <hr className="divider" />

            <div className="details-grid">
                <div className="detail-item">
                    <div className="icon-badge blue"><FaEnvelope /></div>
                    <div>
                        <label>Email ID</label>
                        <h4>{user?.email}</h4>
                    </div>
                </div>

                <div className="detail-item">
                    <div className="icon-badge purple"><FaGraduationCap /></div>
                    <div>
                        <label>Course</label>
                        <h4>Computer Science</h4>
                    </div>
                </div>

                <div className="detail-item">
                    <div className="icon-badge green"><FaIdBadge /></div>
                    <div>
                        <label>Student ID</label>
                        <h4>#STU-{user?.uid?.slice(0,6).toUpperCase()}</h4>
                    </div>
                </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="action-buttons">
                {isEditing ? (
                    <div style={{display: 'flex', gap: '10px'}}>
                        <button className="save-btn" style={{flex:1}} onClick={handleSaveProfile}>
                            <FaSave /> Save
                        </button>
                        <button className="cancel-btn" style={{flex:1}} onClick={() => setIsEditing(false)}>
                            <FaTimes /> Cancel
                        </button>
                    </div>
                ) : (
                    <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                        <FaUserEdit /> Edit Profile
                    </button>
                )}
                
                {loading && <p style={{color: "#3498db", fontSize:"0.8rem", textAlign: "center"}}>Processing...</p>}
            </div>

        </div>
      </div>
    </div>
  );
};

export default StudentProfile;