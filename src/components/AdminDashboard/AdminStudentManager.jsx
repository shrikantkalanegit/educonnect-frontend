import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaUserPlus, FaTrash, FaSearch, FaIdCard, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, where } from "firebase/firestore";
import "./AdminStudentManager.css"; 

const AdminStudentManager = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentsList, setStudentsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const currentDept = localStorage.getItem("currentDept");

  useEffect(() => {
    if(!currentDept) return;
    const q = query(
        collection(db, "allowed_students"), 
        where("department", "==", currentDept),
        orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
        setStudentsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [currentDept]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studentId || !studentName) return alert("Please fill all details!");
    const isDuplicate = studentsList.some(s => s.studentId === studentId.trim());
    if(isDuplicate) { alert("Student ID already exists!"); return; }

    try {
        await addDoc(collection(db, "allowed_students"), {
            studentId: studentId.trim(),
            name: studentName,
            department: currentDept,
            createdAt: serverTimestamp(),
            isRegistered: false 
        });
        setStudentId(""); setStudentName("");
        alert("✅ Student Whitelisted!");
    } catch (error) { alert("Error adding student."); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Remove this student from whitelist?")) {
        await deleteDoc(doc(db, "allowed_students", id));
    }
  };

  const filteredStudents = studentsList.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.includes(searchTerm)
  );

  return (
    <div className="asm-container">
      <header className="asm-header">
        <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
            <FaArrowLeft /> Dashboard
        </button>
        <div className="header-title">
            <h2>Access Control</h2>
            <p>Dept: <span className="highlight-dept">{currentDept}</span></p>
        </div>
      </header>

      <div className="asm-content">
        {/* ADD FORM */}
        <div className="asm-card add-section">
            <div className="card-header">
                <h3><FaUserPlus /> Whitelist Student</h3>
                <p>Add Student ID so they can register.</p>
            </div>
            <form onSubmit={handleAddStudent} className="asm-form">
                <div className="input-group">
                    <label>Student ID (Roll No)</label>
                    <input type="text" placeholder="e.g. CS-2024-001" value={studentId} onChange={(e)=>setStudentId(e.target.value)} required />
                </div>
                <div className="input-group">
                    <label>Full Name</label>
                    <input type="text" placeholder="e.g. Rahul Sharma" value={studentName} onChange={(e)=>setStudentName(e.target.value)} required />
                </div>
                <button type="submit" className="add-btn">Authorize Student</button>
            </form>
        </div>

        {/* LIST SECTION */}
        <div className="asm-card list-section">
            <div className="list-header">
                <h3>Allowed Students ({filteredStudents.length})</h3>
                <div className="search-box">
                    <FaSearch />
                    <input placeholder="Search ID or Name..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                </div>
            </div>
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr><th>ID Card</th><th>Name</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <tr key={student.id}>
                                <td className="id-col"><FaIdCard /> {student.studentId}</td>
                                <td className="name-col">{student.name}</td>
                                <td>
                                    <span className={`status-badge ${student.isRegistered ? 'reg' : 'pend'}`}>
                                        {student.isRegistered ? <><FaCheckCircle/> Registered</> : <><FaExclamationCircle/> Pending</>}
                                    </span>
                                </td>
                                <td>
                                    <button className="del-btn" onClick={() => handleDelete(student.id)}><FaTrash /></button>
                                </td>
                            </tr>
                        )) : <tr><td colSpan="4" className="no-data">No students found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStudentManager;