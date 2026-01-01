import React, { useState, useEffect } from "react";
import "./LoginPage.css";
import { FaUserGraduate, FaEnvelope, FaLock, FaArrowRight, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase"; 
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; 

const LoginPage = () => {
  const navigate = useNavigate();
  
  // Sirf Student Credentials rakhenge
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- FORGOT PASSWORD STATES ---
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    // Purana session clear
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userYear");
  }, []);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError("");
  };

  // --- LOGIN LOGIC (ONLY STUDENT) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const user = userCredential.user;
      
      // Check karo ki ye Student hai ya nahi
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Agar galti se Admin yahan login karne ki koshish kare
        if(userData.role === 'admin') {
           setError("⚠️ Admins please use the Admin Portal tab.");
           setLoading(false);
           return;
        }

        localStorage.setItem("userRole", "student");
        localStorage.setItem("userName", userData.name);
        localStorage.setItem("userYear", userData.year);
        navigate("/homepage");
      } else {
        setError("⚠️ User data not found.");
      }
    } catch (err) {
      console.error(err);
      setError("❌ Incorrect Email or Password.");
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD ---
  const handleForgotPassword = async () => {
    if (!resetEmail) {
      alert("⚠️ Please enter your email first!");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert("✅ Password Reset Link Sent! Check your Email.");
      setShowResetModal(false);
      setResetEmail("");
    } catch (error) {
      alert("❌ Error: " + error.message);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        
        {/* 👇 UPDATED ROLE SWITCH (Redirects to Admin Page) */}
        <div className="role-switch">
          <button className="role-btn active">Student</button>
          
          {/* Admin click karte hi naye secure page par jayega */}
          <button 
            className="role-btn" 
            onClick={() => navigate("/admin-login")}
          >
            Admin
          </button>
        </div>

        {/* Header */}
        <div className="login-header">
          <div className="icon-circle"><FaUserGraduate /></div>
          <h2>Student Login</h2>
          <p>Access your study materials</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-field">
            <FaEnvelope className="field-icon" />
            <input 
              type="email" 
              name="email" 
              placeholder="Student Email" 
              value={credentials.email} 
              onChange={handleChange} 
              required
            />
          </div>
          
          <div className="input-field">
            <FaLock className="field-icon" />
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={credentials.password} 
              onChange={handleChange} 
              required
            />
          </div>

          <div className="forgot-pass-link" onClick={() => setShowResetModal(true)}>
            Forgot Password?
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Checking..." : "Login"} <FaArrowRight />
          </button>
        </form>

        <p style={{marginTop: '20px', fontSize: '0.9rem', color: '#555'}}>
          New Student? <span onClick={() => navigate("/register")} style={{color: '#667eea', cursor: 'pointer', fontWeight: 'bold'}}>Create Account</span>
        </p>

      </div>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setShowResetModal(false)}><FaTimes /></button>
            <h3>Reset Password 🔒</h3>
            <p>Enter your email to receive a reset link.</p>
            <input 
              type="email" 
              className="modal-input"
              placeholder="Enter your registered email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <button className="modal-btn" onClick={handleForgotPassword}>Send Link</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage;