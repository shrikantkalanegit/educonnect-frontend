import React, { useState } from "react";
import "./RegisterPage.css";
import { Link, useNavigate } from 'react-router-dom';

// 👇 IMPORTANT IMPORTS (Inke bina save nahi hoga)
import { auth, db } from "../../firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    studentId: "",
    year: "", 
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 👇 ASLI LOGIC YAHAN HAI
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation
    if (formData.password !== formData.confirmPassword) {
      alert("❌ Password match nahi kar raha!");
      return;
    }
    if (!formData.year) {
      alert("⚠️ Year select karna zaroori hai!");
      return;
    }

    try {
      setLoading(true);
      
      // 🟢 Checkpoint 1
      alert("⏳ Step 1: Account banana shuru...");

      // 2. Authentication (Login ID Create)
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // 🟢 Checkpoint 2
      alert(`✅ Step 2: Login ID ban gayi! (UID: ${user.uid})\nAb Database mein save kar raha hun...`);

      // 3. Database (Data Save)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.fullName, 
        email: formData.email,
        studentId: formData.studentId,
        year: formData.year, // "1st Year", etc.
        role: "student",
        createdAt: new Date()
      });

      // 🟢 Checkpoint 3
      alert("🎉 Step 3: SUCCESS! Data Database mein save ho gaya.");
      
      setLoading(false);
      navigate("/"); // Login page par bhejo

    } catch (error) {
      console.error("Error Details:", error);
      setLoading(false);
      
      // Error Batane wala Logic
      if (error.code === 'auth/email-already-in-use') {
        alert("⚠️ Yeh Email pehle se registered hai. Login karein.");
      } else if (error.code === 'auth/weak-password') {
        alert("⚠️ Password bahut kamzor hai. Kam se kam 6 characters rakhein.");
      } else {
        alert("❌ Error Aaya: " + error.message);
      }
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2>Student Registration 🎓</h2>
        
        <form className="register-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email ID"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="studentId"
            placeholder="Student ID / Roll No"
            value={formData.studentId}
            onChange={handleChange}
            required
          />
          
          <select 
            name="year" 
            value={formData.year} 
            onChange={handleChange} 
            required
            className="year-dropdown"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '15px', width: '100%' }}
          >
            <option value="">Select Year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
          </select>

          <input
            type="password"
            name="password"
            placeholder="Password (Min 6 chars)"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          
          <button type="submit" disabled={loading} style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? "Processing..." : "Register Now"}
          </button>
          
          <p className="login-link">
           Already registered? <Link to="/">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;