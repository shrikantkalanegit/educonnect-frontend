import React, { useState, useEffect } from "react";
import "./RegisterPage.css";
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from "../../firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs, query, orderBy, where, updateDoc } from "firebase/firestore"; 

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) return alert("❌ Passwords match nahi ho rahe!");
    if (!formData.department || !formData.year) return alert("⚠️ Department aur Year select karna zaroori hai!");

    try {
      setLoading(true);
      const cleanStudentId = formData.studentId.trim().toUpperCase();
      const cleanEmail = formData.email.trim().toLowerCase();

      // 1. Verify Student ID in Database
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

      // 2. Create Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
      const user = userCredential.user;

      // 3. Save User Data
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

      // 4. Mark as Registered
      await updateDoc(doc(db, "allowed_students", allowedDoc.id), {
        isRegistered: true,
        registeredUid: user.uid,
        name: formData.fullName.trim()
      });
      
      alert("✅ Account Successfully Created!");
      navigate("/");

    } catch (error) {
      console.error(error);
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2>Student Registration 🎓</h2>
        <p className="reg-subtitle">Only Verified IDs Allowed</p>
        
        <form className="register-form" onSubmit={handleSubmit}>
          <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email ID" value={formData.email} onChange={handleChange} required />
          
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
            {loading ? "Verifying..." : "Register Securely"}
          </button>
          
          <p className="login-link">Already registered? <Link to="/">Login here</Link></p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;