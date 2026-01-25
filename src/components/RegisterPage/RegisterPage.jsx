import React, { useState, useEffect, useRef } from "react";
import "./RegisterPage.css";
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from "../../firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs, query, orderBy, where, updateDoc } from "firebase/firestore"; 
import emailjs from '@emailjs/browser'; // 🔥 IMPORT EMAILJS

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);

  // --- OTP STATES ---
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [allowedDocId, setAllowedDocId] = useState(null); // Database ID store karne ke liye

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    studentId: "",
    department: "",
    year: "", 
    password: "",
    confirmPassword: "",
  });

  // Fetch Departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const q = query(collection(db, "departments"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        setDepartmentList(querySnapshot.docs.map(doc => doc.data().name));
      } catch (error) { console.error("Error:", error); }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔥 STEP 1: VALIDATE & SEND OTP
  const handleInitiateRegistration = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) return alert("❌ Passwords match nahi ho rahe!");
    if (!formData.department || !formData.year) return alert("⚠️ Department aur Year select karna zaroori hai!");

    try {
      setLoading(true);
      const cleanStudentId = formData.studentId.trim().toUpperCase();
      
      // 1. Check in 'allowed_students'
      const q = query(
        collection(db, "allowed_students"), 
        where("studentId", "==", cleanStudentId), 
        where("department", "==", formData.department) 
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setLoading(false);
        return alert("⛔ ACCESS DENIED! \nAapka Student ID database mein nahi mila.");
      }

      const allowedDoc = querySnapshot.docs[0];
      const allowedData = allowedDoc.data();
      
      if (allowedData.isBlocked) {
          setLoading(false);
          return alert("⛔ Your ID is BLOCKED by Admin.");
      }
      if (allowedData.isRegistered) {
         setLoading(false);
         return alert("⚠️ Yeh Student ID pehle se register ho chuka hai!");
      }

      // Store Document ID for later
      setAllowedDocId(allowedDoc.id);

      // 2. GENERATE OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      // 3. SEND EMAIL via EmailJS
      const emailParams = {
          to_name: formData.fullName,
          to_email: formData.email,
          otp_code: otp,
      };

      // ⚠️ REPLACE WITH YOUR EMAILJS SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY
      await emailjs.send('service_pw0etax','template_mfc699v', emailParams, '2TNW2dw-Ia5Mp4mVX');

      setLoading(false);
      setShowOtpModal(true); // Open OTP Modal
      alert(`✅ OTP sent to ${formData.email}. Please verify!`);

    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("❌ OTP Send Failed: " + error.message);
    }
  };

  // 🔥 STEP 2: VERIFY OTP & CREATE ACCOUNT
  const handleVerifyAndRegister = async () => {
      if (enteredOtp !== generatedOtp) {
          return alert("❌ Invalid OTP! Please try again.");
      }

      try {
          setLoading(true);
          const cleanEmail = formData.email.trim().toLowerCase();
          const cleanStudentId = formData.studentId.trim().toUpperCase();

          // 1. Create User in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
          const user = userCredential.user;

          // 2. Save User Data in Firestore
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: formData.fullName.trim(), 
            email: cleanEmail,
            studentId: cleanStudentId,
            department: formData.department,
            year: formData.year,
            role: "student",
            createdAt: new Date().toISOString()
          });

          // 3. Mark ID as Registered
          await updateDoc(doc(db, "allowed_students", allowedDocId), {
            isRegistered: true,
            registeredUid: user.uid,
            name: formData.fullName.trim()
          });

          setLoading(false);
          setShowOtpModal(false);
          alert("🎉 Registration Successful! Welcome.");
          navigate("/");

      } catch (error) {
          console.error(error);
          setLoading(false);
          alert("❌ Registration Error: " + error.message);
      }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2>Student Registration 🎓</h2>
        <p className="reg-subtitle">Email Verification Required</p>
        
        <form className="register-form" onSubmit={handleInitiateRegistration}>
          <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email ID (OTP will be sent here)" value={formData.email} onChange={handleChange} required />
          
          <input 
            type="text" name="studentId" placeholder="Student ID / Roll No" 
            value={formData.studentId} onChange={handleChange} required style={{textTransform: 'uppercase'}} 
          />
          
          <select name="department" value={formData.department} onChange={handleChange} required className="register-dropdown">
            <option value="">-- Select Faculty --</option>
            {departmentList.map((dept, i) => <option key={i} value={dept}>{dept}</option>)}
          </select>

          <select name="year" value={formData.year} onChange={handleChange} required className="register-dropdown">
            <option value="">-- Select Year --</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>

          <input type="password" name="password" placeholder="Password (Min 6 chars)" value={formData.password} onChange={handleChange} required />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
          
          <button type="submit" disabled={loading} className="reg-btn">
            {loading ? "Processing..." : "Get OTP & Register"}
          </button>
          
          <p className="login-link">Already registered? <Link to="/">Login here</Link></p>
        </form>
      </div>

      {/* 🔥 OTP MODAL */}
      {showOtpModal && (
          <div className="modal-overlay">
              <div className="modal-box">
                  <h3>Verify Email 📧</h3>
                  <p>Enter the 6-digit OTP sent to <b>{formData.email}</b></p>
                  
                  <input 
                    type="text" 
                    placeholder="Enter OTP" 
                    className="otp-input"
                    value={enteredOtp}
                    maxLength="6"
                    onChange={(e) => setEnteredOtp(e.target.value)}
                  />
                  
                  <div className="modal-actions">
                      <button className="cancel-btn" onClick={() => setShowOtpModal(false)}>Cancel</button>
                      <button className="create-btn" onClick={handleVerifyAndRegister} disabled={loading}>
                          {loading ? "Creating Account..." : "Verify & Submit"}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

export default RegisterPage;