import React, { useState } from "react";
import "./RegisterPage.css";
import { Link, useNavigate } from 'react-router-dom';

// 👇 1. Firebase ki zaroori cheezein import ki (Aapke snippet wali)
import { auth, db } from "../../firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form ka data store karne ke liye
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    studentId: "",
    year: "", 
    password: "",
    confirmPassword: "",
  });

  // Input change hone par data update karo
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 👇 2. Main Logic Yahan Hai (Aapke snippet jaisa)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check Password
    if (formData.password !== formData.confirmPassword) {
      alert("❌ Passwords match nahi ho rahe!");
      return;
    }
    if (!formData.year) {
      alert("⚠️ Please Year select karein!");
      return;
    }

    try {
      setLoading(true); // Button disable

      // --- STEP A: Authentication (User Login Banana) ---
      // (Ye wahi line hai jo aapne bheji thi)
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      console.log("User registered:", user.uid);

      // --- STEP B: Firestore Database (Data Save Karna) ---
      // (Ye wahi logic hai setDoc wala)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.fullName, 
        email: formData.email,
        studentId: formData.studentId,
        year: formData.year, // e.g., "1st Year"
        role: "student",     // Role student set kiya
        createdAt: new Date()
      });

      console.log("Data saved to Firestore!");
      
      setLoading(false);
      alert("✅ Account ban gaya! Ab Login karein.");
      navigate("/"); // Login page par bhej do

    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
      alert("❌ Error: " + error.message);
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
            style={{ padding: '10px', marginBottom: '10px', width: '100%' }}
          >
            <option value="">Select Year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
          </select>

          <input
            type="password"
            name="password"
            placeholder="Password"
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
            {loading ? "Creating Account..." : "Register"}
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