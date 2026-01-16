import React, { useState, useEffect } from "react";
import "./RegisterPage.css";
import { Link, useNavigate } from 'react-router-dom';

// 👇 Firestore Imports update kiye hain
import { auth, db } from "../../firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // 🔥 State for Dynamic Departments
  const [departmentList, setDepartmentList] = useState([]);

  // Form ka data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    studentId: "",
    department: "", // 👈 New Field
    year: "", 
    password: "",
    confirmPassword: "",
  });

  // 1. 🔥 Fetch Departments from Firebase on Load
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const q = query(collection(db, "departments"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const depts = querySnapshot.docs.map(doc => doc.data().name);
        setDepartmentList(depts);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("❌ Passwords match nahi ho rahe!");
      return;
    }
    // Validation for Dept & Year
    if (!formData.department) {
      alert("⚠️ Please Department (Faculty) select karein!");
      return;
    }
    if (!formData.year) {
      alert("⚠️ Please Year select karein!");
      return;
    }

    try {
      setLoading(true);

      // A. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // B. Save to Firestore (With Department)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.fullName, 
        email: formData.email,
        studentId: formData.studentId,
        department: formData.department, // ✅ Linked to Admin's Department
        year: formData.year,
        role: "student",
        createdAt: new Date()
      });
      
      setLoading(false);
      alert("✅ Account Successfully Created! Login Now.");
      navigate("/");

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
          
          {/* 🔥 DYNAMIC DEPARTMENT DROPDOWN */}
          <select 
            name="department" 
            value={formData.department} 
            onChange={handleChange} 
            required
            className="register-dropdown"
          >
            <option value="">-- Select Faculty/Department --</option>
            {departmentList.length > 0 ? (
              departmentList.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))
            ) : (
              <option value="" disabled>Loading Faculties...</option>
            )}
          </select>

          {/* YEAR DROPDOWN */}
          <select 
            name="year" 
            value={formData.year} 
            onChange={handleChange} 
            required
            className="register-dropdown"
          >
            <option value="">-- Select Year --</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
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
          
          <button type="submit" disabled={loading} className="reg-btn">
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