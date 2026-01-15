import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css"; 
import { FaUserShield, FaLock, FaEnvelope, FaUser, FaCamera, FaTimes, FaArrowRight } from "react-icons/fa"; // Icons updated

import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AdminLogin = () => {
  const navigate = useNavigate();
  
  const [isSignup, setIsSignup] = useState(false); 
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  
  // 📸 Image State (Preserved)
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔥 FORGOT PASSWORD STATES (New)
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ☁️ CLOUDINARY UPLOAD FUNCTION (Preserved)
  const uploadToCloudinary = async () => {
    if (!image) return ""; 

    const data = new FormData();
    data.append("file", image);
    data.append("upload_preset", "ml_default"); 
    data.append("cloud_name", "dpfz1gq4y");     

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dpfz1gq4y/image/upload", {
        method: "POST",
        body: data
      });
      const fileData = await res.json();
      return fileData.secure_url; 
    } catch (error) {
      console.error("Image Upload Error:", error);
      alert("Photo upload failed!");
      return "";
    }
  };

  // 🔥 FORGOT PASSWORD LOGIC (New)
  const handleForgotPassword = async () => {
    if (!resetEmail) {
      alert("⚠️ Please enter your Admin Email first!");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert("✅ Reset Link Sent to your Email!");
      setShowResetModal(false);
      setResetEmail("");
    } catch (error) {
      alert("❌ Error: " + error.message);
    }
  };

  // --- AUTH LOGIC ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { email, password, name } = formData;

    try {
      if (isSignup) {
        // 🟢 SIGN UP LOGIC
        const allowedRef = doc(db, "allowed_admins", email);
        const allowedSnap = await getDoc(allowedRef);

        if (!allowedSnap.exists()) {
          alert("⛔ ACCESS DENIED!\n\nAap Admin nahi ban sakte. Kripya Super Admin se contact karein.");
          setLoading(false);
          return;
        }

        const profilePicUrl = await uploadToCloudinary();

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "admins", user.uid), {
          name: name,
          email: email,
          role: "admin",
          profilePic: profilePicUrl,
          createdAt: new Date().toISOString()
        });

        alert("🎉 Admin Account Created Successfully!");
        navigate("/admin/select-dept"); // New Flow

      } else {
        // 🔵 LOGIN LOGIC
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const adminDoc = await getDoc(doc(db, "admins", userCredential.user.uid));
        
        if (adminDoc.exists()) {
          navigate("/admin/select-dept"); // New Flow
        } else {
          alert("❌ Ye Admin Account nahi hai!");
          auth.signOut(); 
        }
      }

    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        alert("⚠️ Ye Email pehle se registered hai! Login karein.");
      } else {
        alert("❌ Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        
        {/* 👇 ROLE SWITCHER (Back to Student) */}
        <div className="role-switch-header">
          <button className="rs-btn" onClick={() => navigate("/")}>Student</button>
          <button className="rs-btn active">Admin</button>
        </div>

        <div className="admin-icon-circle"><FaUserShield /></div>
        <h2>{isSignup ? "New Admin Registration" : "Admin Portal"}</h2>
        <p className="subtitle">{isSignup ? "Secure Staff Onboarding" : "Authorized Personnel Only"}</p>

        <form onSubmit={handleAuth}>
          {isSignup && (
            <>
              <div className="input-group">
                <FaUser className="input-icon" />
                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
              </div>
              
              {/* Image Input (Preserved) */}
              <div className="input-group" style={{border: "1px dashed #ccc", padding: "5px", background: "#f9f9f9", borderRadius: "8px"}}>
                <FaCamera className="input-icon" style={{color: "#666", top: "15px"}}/>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  style={{border: "none", outline: "none", paddingLeft: "10px", width: "90%"}}
                />
              </div>
            </>
          )}

          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input type="email" name="email" placeholder="Official Email ID" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <FaLock className="input-icon" />
            <input type="password" name="password" placeholder="Secure Password" value={formData.password} onChange={handleChange} required />
          </div>

          {/* 🔥 FORGOT PASSWORD LINK */}
          {!isSignup && (
            <div className="forgot-pass-text" onClick={() => setShowResetModal(true)}>
                Forgot Password?
            </div>
          )}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Processing..." : (isSignup ? "Create Admin Account" : "Access Dashboard")} <FaArrowRight style={{marginLeft: "8px"}}/>
          </button>
        </form>

        <div className="toggle-link">
          <p onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Already have an account? Login" : "New Staff Member? Create Account"}
          </p>
        </div>
      </div>

      {/* 🔥 FORGOT PASSWORD MODAL */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setShowResetModal(false)}><FaTimes /></button>
            <h3 style={{color:'#2c3e50'}}>Reset Password 🔐</h3>
            <p style={{color:'#666'}}>Enter your official admin email.</p>
            <input 
              type="email" 
              className="modal-input"
              placeholder="admin@college.edu"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <button className="login-btn" onClick={handleForgotPassword}>Send Reset Link</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLogin;