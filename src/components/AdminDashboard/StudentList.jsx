import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentList.css";
import { FaArrowLeft, FaSearch, FaUserGraduate, FaTrash, FaEnvelope } from "react-icons/fa";

// 👇 Database Imports
import { db } from "../../firebase";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";

const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      
      const studentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setStudents(studentData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching students:", error);
      setLoading(false);
    }
  };

  const handleDelete = async (studentId, studentName) => {
    if (window.confirm(`⚠️ Warning: Are you sure you want to remove ${studentName}?`)) {
      try {
        await deleteDoc(doc(db, "users", studentId));
        setStudents(students.filter(s => s.id !== studentId));
        alert("✅ Student removed successfully.");
      } catch (error) {
        console.error("Delete Error:", error);
        alert("❌ Error removing student.");
      }
    }
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="student-list-container">
      <header className="list-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <h2>Manage Students ({filteredStudents.length})</h2>
      </header>

      <div className="search-box-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="list-body">
        {loading ? (
          <p className="loading-text">Loading Records...</p>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <FaUserGraduate style={{fontSize:'3rem', color:'#ccc'}}/>
            <p>No students found.</p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student.id} className="student-card">
              <div className="student-avatar">
                {student.name ? student.name.charAt(0).toUpperCase() : "S"}
              </div>
              <div className="student-info">
                <h4>{student.name || "Unknown Student"}</h4>
                <p><FaEnvelope className="tiny-icon"/> {student.email}</p>
                <span className="course-badge">
                  {student.course || "General"} • {student.year || "1st"} Year
                </span>
              </div>
              <button className="remove-btn" onClick={() => handleDelete(student.id, student.name)}>
                <FaTrash />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentList;