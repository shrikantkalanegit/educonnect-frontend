import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaUserPlus, FaTrash, FaSearch, FaIdCard, FaCheckCircle, FaExclamationCircle, FaEllipsisV, FaBan, FaUnlock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, where, updateDoc } from "firebase/firestore";
import "./AdminStudentManager.css"; 

const AdminStudentManager = () => {
  const navigate = useNavigate();
  
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  
  const [studentsList, setStudentsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 🔥 Menu State
  const [activeMenu, setActiveMenu] = useState(null);

  const currentDept = localStorage.getItem("currentDept");

  useEffect(() => {
    if(!currentDept) return;

    const q = query(
        collection(db, "allowed_students"), 
        where("department", "==", currentDept),
        orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudentsList(list);
    }, (error) => {
        console.error("Error fetching students:", error);
    });

    return () => unsub();
  }, [currentDept]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studentId || !studentName) return alert("Please fill all details!");

    const isDuplicate = studentsList.some(s => s.studentId === studentId.trim().toUpperCase());
    if(isDuplicate) {
        alert("Student ID already exists in whitelist!");
        return;
    }

    try {
        await addDoc(collection(db, "allowed_students"), {
            studentId: studentId.trim().toUpperCase(),
            name: studentName,
            department: currentDept,
            createdAt: serverTimestamp(),
            isRegistered: false,
            isBlocked: false // New Field
        });
        setStudentId(""); setStudentName("");
        alert("✅ Student added to Whitelist!");
    } catch (error) { 
        alert("Error adding student."); 
        console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Remove this student? They won't be able to login.")) {
        await deleteDoc(doc(db, "allowed_students", id));
        setActiveMenu(null);
    }
  };

  // 🔥 Block/Unblock Logic
  const handleBlock = async (student) => {
      const newStatus = !student.isBlocked;
      const action = newStatus ? "Block" : "Unblock";
      
      if(window.confirm(`Are you sure you want to ${action} ${student.name}?`)) {
          await updateDoc(doc(db, "allowed_students", student.id), {
              isBlocked: newStatus
          });
          setActiveMenu(null);
      }
  };

  // Close menu when clicking outside
  useEffect(() => {
      const closeMenu = () => setActiveMenu(null);
      document.addEventListener('click', closeMenu);
      return () => document.removeEventListener('click', closeMenu);
  }, []);

  const filteredStudents = studentsList.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.studentId.includes(searchTerm.toUpperCase())
  );

  return (
    <div className="asm-container">
      <header className="asm-header">
        <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
            <FaArrowLeft /> Dashboard
        </button>
        <div className="header-title">
            <h2>Access Manager</h2>
            <p>Dept: <span className="highlight-dept">{currentDept}</span></p>
        </div>
      </header>

      <div className="asm-content">
        
        {/* ADD FORM */}
        <div className="asm-card add-section">
            <div className="card-header">
                <h3><FaUserPlus /> Whitelist Student</h3>
                <p>Allow student to register.</p>
            </div>
            
            <form onSubmit={handleAddStudent} className="asm-form">
                <div className="input-group">
                    <label>Student ID / Roll No</label>
                    <input 
                        type="text" placeholder="e.g. BCA001" 
                        value={studentId} onChange={(e)=>setStudentId(e.target.value)} 
                        required 
                    />
                </div>
                <div className="input-group">
                    <label>Student Name</label>
                    <input 
                        type="text" placeholder="e.g. Rahul Sharma" 
                        value={studentName} onChange={(e)=>setStudentName(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit" className="add-btn">
                    Authorize ID
                </button>
            </form>
        </div>

        {/* LIST SECTION */}
        <div className="asm-card list-section">
            <div className="list-header">
                <h3>Allowed Students ({filteredStudents.length})</h3>
                <div className="search-box">
                    <FaSearch />
                    <input 
                        placeholder="Search ID or Name..." 
                        value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Std. ID</th> {/* 🔥 Changed Header */}
                            <th>Name</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <tr key={student.id}>
                                <td className="id-col"><FaIdCard /> {student.studentId}</td>
                                
                                {/* 🔥 Name automatically updates via RegisterPage now */}
                                <td className="name-col" style={{opacity: student.isBlocked ? 0.5 : 1}}>
                                    {student.name}
                                    {student.isBlocked && <span className="blocked-tag">BLOCKED</span>}
                                </td>
                                
                                <td>
                                    <span className={`status-badge ${student.isRegistered ? 'reg' : 'pend'}`}>
                                        {student.isRegistered ? <><FaCheckCircle/> Registered</> : <><FaExclamationCircle/> Pending</>}
                                    </span>
                                </td>
                                
                                <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                                    <button className="menu-btn" onClick={() => setActiveMenu(activeMenu === student.id ? null : student.id)}>
                                        <FaEllipsisV />
                                    </button>

                                    {/* 🔥 3-DOT POPUP MENU */}
                                    {activeMenu === student.id && (
                                        <div className="action-menu">
                                            <div className="menu-item" onClick={() => handleBlock(student)}>
                                                {student.isBlocked ? <><FaUnlock/> Unblock</> : <><FaBan/> Block Access</>}
                                            </div>
                                            <div className="menu-item delete" onClick={() => handleDelete(student.id)}>
                                                <FaTrash /> Delete ID
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="no-data">No students found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminStudentManager;