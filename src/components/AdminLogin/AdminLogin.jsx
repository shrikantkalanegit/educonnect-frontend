import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css"; 
import { FaUserShield, FaLock, FaEnvelope, FaUser, FaCamera, FaTimes, FaArrowRight } from "react-icons/fa";
import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false); 
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const uploadToCloudinary = async () => {
    if (!image) return ""; 
    const data = new FormData();
    data.append("file", image);
    data.append("upload_preset", "college_app"); 
    data.append("cloud_name", "dpfz1gq4y");     
    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dpfz1gq4y/image/upload", { method: "POST", body: data });
      const fileData = await res.json();
      return fileData.secure_url; 
    } catch (error) { return ""; }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // 🔥 SECURITY FIX: Clean email for Doc ID lookup
    const cleanEmail = formData.email.trim().toLowerCase();
    const { password, name } = formData;

    try {
      if (isSignup) {
        // --- ADMIN REGISTRATION ---
        const allowedRef = doc(db, "allowed_admins", cleanEmail);
        const allowedSnap = await getDoc(allowedRef);

        if (!allowedSnap.exists()) {
          setLoading(false);
          return alert("⛔ ACCESS DENIED!\nYe Email Allowed Admins list mein nahi hai.");
        }

        const profilePicUrl = await uploadToCloudinary();
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        await setDoc(doc(db, "admins", user.uid), {
          name: name, email: cleanEmail, role: "admin",
          profilePic: profilePicUrl, createdAt: new Date().toISOString()
        });

        alert("🎉 Admin Account Created!");
        navigate("/admin/select-dept"); 

      } else {
        // --- ADMIN LOGIN ---
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const adminDoc = await getDoc(doc(db, "admins", userCredential.user.uid));
        
        if (adminDoc.exists()) {
          navigate("/admin/select-dept"); 
        } else {
          auth.signOut();
          alert("❌ Not an Admin Account!");
        }
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) return alert("Email required!");
    try { await sendPasswordResetEmail(auth, resetEmail); alert("Link Sent!"); setShowResetModal(false); }
    catch(e) { alert(e.message); }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="role-switch-header">
          <button className="rs-btn" onClick={() => navigate("/")}>Student</button>
          <button className="rs-btn active">Admin</button>
        </div>

        <div className="admin-icon-circle"><FaUserShield /></div>
        <h2>{isSignup ? "New Admin" : "Admin Portal"}</h2>
        
        <form onSubmit={handleAuth}>
          {isSignup && (
            <>
              <div className="input-group">
                <FaUser className="input-icon" />
                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="input-group" style={{border: "1px dashed #ccc", padding: "5px", borderRadius: "8px"}}>
                <FaCamera className="input-icon" style={{top:"15px"}}/>
                <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} style={{marginLeft:'35px', border:'none'}}/>
              </div>
            </>
          )}

          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input type="email" name="email" placeholder="Official Email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <FaLock className="input-icon" />
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          </div>

          {!isSignup && <div className="forgot-pass-text" onClick={() => setShowResetModal(true)}>Forgot Password?</div>}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Processing..." : (isSignup ? "Create Account" : "Access Dashboard")} <FaArrowRight style={{marginLeft: "8px"}}/>
          </button>
        </form>

        <div className="toggle-link">
          <p onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Already have account? Login" : "New Staff? Create Account"}
          </p>
        </div>
      </div>

      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setShowResetModal(false)}><FaTimes /></button>
            <h3>Reset Password</h3>
            <input type="email" className="modal-input" placeholder="Admin Email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            <button className="login-btn" onClick={handleForgotPassword}>Send Link</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;