import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaUserPlus, FaTrash, FaSearch, FaIdCard, FaCheckCircle, FaExclamationCircle, FaBan, FaUnlock } from "react-icons/fa";
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
  const [loading, setLoading] = useState(true);
  
  const currentDept = localStorage.getItem("currentDept");

  // 1. SAFE DATA FETCHING
  useEffect(() => {
    if(!currentDept) return;

    let unsub = null; 

    try {
        const q = query(
            collection(db, "allowed_students"), 
            where("department", "==", currentDept),
            orderBy("createdAt", "desc")
        );

        unsub = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudentsList(list);
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            setLoading(false);
        });

    } catch (err) {
        console.error("Query Error:", err);
        setLoading(false);
    }

    return () => {
        if(unsub) unsub(); // Cleanup to prevent White Screen Error
    };
  }, [currentDept]);

  // 2. Add Student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studentId || !studentName) return alert("Please fill all details!");

    const isDuplicate = studentsList.some(s => s.studentId === studentId.trim().toUpperCase());
    if(isDuplicate) return alert("Student ID already exists!");

    try {
        await addDoc(collection(db, "allowed_students"), {
            studentId: studentId.trim().toUpperCase(),
            name: studentName,
            department: currentDept,
            createdAt: serverTimestamp(),
            isRegistered: false,
            isBlocked: false 
        });
        setStudentId(""); setStudentName("");
    } catch (error) { alert("Error adding student."); }
  };

  // 3. Actions
  const handleDelete = async (id) => {
    if(window.confirm("Delete this student ID?")) {
        await deleteDoc(doc(db, "allowed_students", id));
    }
  };

  const handleBlock = async (student) => {
      const newStatus = !student.isBlocked;
      if(window.confirm(`Confirm ${newStatus ? "BLOCK" : "UNBLOCK"} for ${student.name}?`)) {
          await updateDoc(doc(db, "allowed_students", student.id), { isBlocked: newStatus });
      }
  };

  const filteredStudents = studentsList.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.studentId.includes(searchTerm.toUpperCase())
  );

  return (
    <div className="asm-container">
      
      {/* HEADER */}
      <header className="asm-header">
        {/* 🔥 Fixed Back Button: Go back in history */}
        <button className="back-circle-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
        </button>
        <div className="header-title">
            <h2>Student Manager</h2>
            <span className="dept-badge">{currentDept}</span>
        </div>
        <div style={{width:40}}></div>
      </header>

      <div className="asm-content-wrapper">
        
        {/* TOP: ADD STUDENT BAR (Horizontal) */}
        <div className="asm-glass-card add-bar">
            <div className="add-bar-left">
                <h3><FaUserPlus /> Authorize ID</h3>
            </div>
            <form onSubmit={handleAddStudent} className="add-form-inline">
                <input 
                    placeholder="ID (e.g. BCA01)" 
                    value={studentId} onChange={(e)=>setStudentId(e.target.value)} 
                    className="glass-input-sm" required 
                />
                <input 
                    placeholder="Student Name" 
                    value={studentName} onChange={(e)=>setStudentName(e.target.value)} 
                    className="glass-input-sm" required 
                />
                <button type="submit" className="glass-btn-primary sm-btn">Add</button>
            </form>
        </div>

        {/* BOTTOM: LIST SECTION (Table) */}
        <div className="asm-list-section">
            
            <div className="list-toolbar">
                <h3>Total Students: {filteredStudents.length}</h3>
                <div className="asm-search-bar">
                    <FaSearch />
                    <input 
                        placeholder="Search..." 
                        value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* GLASS TABLE (List View) */}
            <div className="glass-table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="text-center">Loading Data...</td></tr>
                        ) : filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <tr key={student.id} className={student.isBlocked ? "row-blocked" : ""}>
                                    <td className="id-cell"><FaIdCard/> {student.studentId}</td>
                                    <td className="name-cell">{student.name}</td>
                                    <td>
                                        {student.isRegistered ? 
                                            <span className="badge reg"><FaCheckCircle/> Active</span> : 
                                            <span className="badge pend"><FaExclamationCircle/> Pending</span>
                                        }
                                        {student.isBlocked && <span className="badge blk">BLOCKED</span>}
                                    </td>
                                    <td className="action-cell">
                                        <button className="icon-btn" onClick={() => handleBlock(student)} title="Block/Unblock">
                                            {student.isBlocked ? <FaUnlock className="text-green"/> : <FaBan className="text-orange"/>}
                                        </button>
                                        <button className="icon-btn delete" onClick={() => handleDelete(student.id)} title="Delete">
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" className="text-center">No students found.</td></tr>
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