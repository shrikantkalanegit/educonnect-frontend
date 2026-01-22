import React, { useState, useEffect } from "react";
import "./LoginPage.css";
import { FaUserGraduate, FaEnvelope, FaLock, FaArrowRight, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase"; 
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; 

const LoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => { localStorage.clear(); }, []);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if(userData.role === 'admin') {
           setError("⛔ Admins please use Admin Portal.");
           auth.signOut();
        } else {
           navigate("/homepage");
        }
      } else {
        setError("⚠️ User data not found.");
        auth.signOut();
      }
    } catch (err) { setError("❌ Incorrect Email or Password."); } 
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) return alert("Enter email!");
    try { await sendPasswordResetEmail(auth, resetEmail); alert("Link Sent!"); setShowResetModal(false); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="role-switch">
          <button className="role-btn active">Student</button>
          <button className="role-btn" onClick={() => navigate("/admin-login")}>Admin</button>
        </div>

        <div className="login-header">
          <div className="icon-circle"><FaUserGraduate /></div>
          <h2>Student Login</h2>
          <p>Access your dashboard</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-field">
            <FaEnvelope className="field-icon" />
            <input type="email" name="email" placeholder="Email" value={credentials.email} onChange={handleChange} required />
          </div>
          <div className="input-field">
            <FaLock className="field-icon" />
            <input type="password" name="password" placeholder="Password" value={credentials.password} onChange={handleChange} required />
          </div>
          <div className="forgot-pass-link" onClick={() => setShowResetModal(true)}>Forgot Password?</div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Checking..." : "Login"} <FaArrowRight />
          </button>
        </form>

        <p className="bottom-text">New Student? <span onClick={() => navigate("/register")}>Create Account</span></p>
      </div>

      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setShowResetModal(false)}><FaTimes /></button>
            <h3>Reset Password</h3>
            <input type="email" className="modal-input" placeholder="Email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            <button className="modal-btn" onClick={handleForgotPassword}>Send Link</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;