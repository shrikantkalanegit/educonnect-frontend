import React, { useState, useEffect } from "react";
import "./AdminStudentManager.css"; // 👈 New Premium CSS
import { FaUserPlus, FaTrash, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";

const AdminStudentManager = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [validStudents, setValidStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 Current Department (Jo Admin ne select kiya hai)
  const currentDept = localStorage.getItem("currentDept");

  useEffect(() => {
    if (!currentDept) {
        navigate("/admin/select-dept");
        return;
    }
    fetchValidStudents();
  }, [currentDept, navigate]);

  // 1. Fetch Existing Allowed IDs for Current Dept
  const fetchValidStudents = async () => {
    try {
        // IDs ko 'Newest First' order mein layenge
        const q = query(
          collection(db, "allowed_students"), 
          where("department", "==", currentDept),
          orderBy("createdAt", "desc") 
        );
        const snap = await getDocs(q);
        setValidStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
        console.error("Error fetching students:", error);
    }
  };

  // 2. Add New Student ID
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    try {
      setLoading(true);
      // Check duplicate in list
      const duplicate = validStudents.find(s => s.studentId === studentId.toUpperCase());
      if(duplicate) {
          alert("⚠️ Yeh Student ID pehle se list mein hai!");
          setLoading(false);
          return;
      }

      await addDoc(collection(db, "allowed_students"), {
        studentId: studentId.toUpperCase(),
        department: currentDept, // Auto-select current faculty
        isRegistered: false, // Abhi account nahi banaya
        createdAt: new Date() // Sorting ke liye
      });

      setStudentId("");
      fetchValidStudents(); // Refresh list
      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Error adding ID");
      setLoading(false);
    }
  };

  // 3. Delete ID
  const handleDelete = async (docId) => {
    if(window.confirm("Is Student ID ko delete karna chahte hain?")) {
        await deleteDoc(doc(db, "allowed_students", docId));
        fetchValidStudents();
    }
  };

  return (
    <div className="std-manager-wrapper">
      
      {/* HEADER */}
      <header className="std-page-header">
        <button className="back-btn-std" onClick={() => navigate('/admin-dashboard')}>
            <FaArrowLeft />
        </button>
        <div>
            <h1>Manage Student Access</h1>
            <p>Add valid IDs for <span className="highlight-dept">{currentDept}</span> Faculty</p>
        </div>
      </header>

      <div className="std-manager-grid">
        
        {/* LEFT: ADD FORM CARD */}
        <div className="std-card">
            <h3><FaUserPlus /> Add New ID</h3>
            <form onSubmit={handleAddStudent} className="std-form">
                
                <div className="std-input-group">
                    <label>Faculty (Locked)</label>
                    <input type="text" value={currentDept} disabled />
                </div>

                <div className="std-input-group">
                    <label>Student ID / Roll No</label>
                    <input 
                        type="text" 
                        placeholder="Ex: BCA-2026-001" 
                        value={studentId} 
                        onChange={(e) => setStudentId(e.target.value)}
                        required 
                        autoFocus
                    />
                </div>

                <button type="submit" disabled={loading} className="add-btn-std">
                    {loading ? "Adding..." : "Add to Allowed List"}
                </button>
            </form>
        </div>

        {/* RIGHT: LIST CARD */}
        <div className="std-card">
            <h3>Valid Student List ({validStudents.length})</h3>
            
            <div className="table-container">
                {validStudents.length > 0 ? (
                    <table className="std-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {validStudents.map((st) => (
                                <tr key={st.id}>
                                    <td><strong>{st.studentId}</strong></td>
                                    <td>
                                        {st.isRegistered ? 
                                            <span className="status-badge status-success">Registered ✅</span> : 
                                            <span className="status-badge status-pending">Pending ⏳</span>
                                        }
                                    </td>
                                    <td>
                                        <button className="delete-btn-std" onClick={() => handleDelete(st.id)} title="Delete">
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>
                        <p>No IDs found. Students cannot register yet.</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminStudentManager;