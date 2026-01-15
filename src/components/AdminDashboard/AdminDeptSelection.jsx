import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase"; // 👈 Auth import
import { signOut } from "firebase/auth"; // 👈 SignOut import
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";
import { FaPlus, FaArrowRight, FaBullhorn, FaUniversity, FaUserFriends, FaSignOutAlt } from "react-icons/fa";
import "./AdminDeptSelection.css"; 

const AdminDeptSelection = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const q = query(collection(db, "departments"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const deptList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDepartments(deptList);
      } catch (error) { console.error("Error:", error); } 
      finally { setLoading(false); }
    };
    fetchDepts();
  }, []);

  const handleCreateDept = async () => {
    if (!newDeptName.trim()) return;
    try {
      const docRef = await addDoc(collection(db, "departments"), {
        name: newDeptName.toUpperCase(),
        createdAt: serverTimestamp(),
        studentCount: 0 
      });
      setDepartments([{ id: docRef.id, name: newDeptName.toUpperCase(), studentCount: 0 }, ...departments]);
      setNewDeptName(""); setShowModal(false);
    } catch (error) { alert("Error creating department"); }
  };

  const handleSelectDept = (deptName) => {
    localStorage.setItem("currentDept", deptName);
    navigate("/admin-dashboard");
  };

  // 🔥 SECURE LOGOUT LOGIC
  const handleLogout = async () => {
    if(window.confirm("Logout from Admin Panel?")) {
        await signOut(auth);
        localStorage.clear();
        navigate("/", { replace: true });
    }
  };

  return (
    <div className="super-admin-wrapper">
      
      <nav className="super-navbar">
        <div className="brand-box">
            <div className="brand-logo">E</div>
            <h2>EduConnect <span className="admin-tag">SUPER ADMIN</span></h2>
        </div>
        {/* 👇 UPDATED LOGOUT BUTTON */}
        <button className="logout-btn-ghost" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
        </button>
      </nav>

      <div className="content-container">
        <header className="selection-header">
            <div>
                <h1>Welcome Back, Admin 👋</h1>
                <p>Select a Faculty to manage or broadcast a campus-wide notice.</p>
            </div>
            <button className="global-broadcast-btn" onClick={() => alert("Coming Soon!")}>
                <FaBullhorn /> Global Broadcast
            </button>
        </header>

        {loading ? <p className="loading-txt">Loading Campus Data...</p> : (
            <div className="dept-grid">
                <div className="dept-card create-card" onClick={() => setShowModal(true)}>
                    <div className="icon-circle add-icon"><FaPlus /></div>
                    <h3>Add Department</h3>
                    <p>Expand your campus</p>
                </div>

                {departments.map((dept) => (
                    <div key={dept.id} className="dept-card glass-card" onClick={() => handleSelectDept(dept.name)}>
                        <div className="card-top">
                            <FaUniversity className="dept-icon"/>
                            <span className="count-badge"><FaUserFriends/> {dept.studentCount || 0}</span>
                        </div>
                        <h3>{dept.name}</h3>
                        <div className="card-footer">
                            <span>Manage Portal</span>
                            <FaArrowRight />
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
            <div className="modal-box">
                <h3>Create New Faculty</h3>
                <input type="text" placeholder="Ex: BCA, CIVIL, ARTS" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} autoFocus />
                <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                    <button className="create-btn" onClick={handleCreateDept}>Create Now</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeptSelection;