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

    if (formData.password !== formData.confirmPassword) {
      alert("❌ Passwords match nahi ho rahe!"); return;
    }
    if (!formData.department || !formData.year) {
      alert("⚠️ Department aur Year select karna zaroori hai!"); return;
    }

    try {
      setLoading(true);

      const q = query(
        collection(db, "allowed_students"), 
        where("studentId", "==", formData.studentId.toUpperCase()), 
        where("department", "==", formData.department) 
      );
      
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("⛔ ACCESS DENIED! \nAapka Student ID database mein nahi mila.");
        setLoading(false);
        return;
      }

      const allowedDoc = querySnapshot.docs[0];
      
      // Check Block Status
      if (allowedDoc.data().isBlocked) {
          alert("⛔ Your ID is BLOCKED by Admin. Contact College.");
          setLoading(false);
          return;
      }

      if (allowedDoc.data().isRegistered) {
         alert("⚠️ Yeh Student ID pehle se register ho chuka hai! Login karein.");
         setLoading(false);
         return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.fullName, 
        email: formData.email,
        studentId: formData.studentId.toUpperCase(),
        department: formData.department,
        year: formData.year,
        role: "student",
        createdAt: new Date()
      });

      // 🔥 UPDATE: Allowed list mein bhi naya naam save karo
      await updateDoc(doc(db, "allowed_students", allowedDoc.id), {
        isRegistered: true,
        registeredUid: user.uid,
        name: formData.fullName // 👈 Ye line add ki hai taki Admin panel me updated naam dikhe
      });
      
      setLoading(false);
      alert("✅ Account Successfully Created! Welcome to EduConnect.");
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
        <p style={{textAlign:'center', color:'#666', fontSize:'0.9rem', marginBottom:'20px'}}>Only Verified IDs Allowed</p>
        
        <form className="register-form" onSubmit={handleSubmit}>
          <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email ID" value={formData.email} onChange={handleChange} required />
          
          <input 
            type="text" 
            name="studentId" 
            placeholder="Student ID / Roll No (Ex: BCA001)" 
            value={formData.studentId} 
            onChange={handleChange} 
            required 
            style={{textTransform: 'uppercase'}} 
          />
          
          <select name="department" value={formData.department} onChange={handleChange} required className="register-dropdown">
            <option value="">-- Select Faculty --</option>
            {departmentList.length > 0 ? (
                departmentList.map((dept, index) => (<option key={index} value={dept}>{dept}</option>))
            ) : <option disabled>Loading...</option>}
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
            {loading ? "Verifying ID..." : "Register Securely"}
          </button>
          
          <p className="login-link">Already registered? <Link to="/">Login here</Link></p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;