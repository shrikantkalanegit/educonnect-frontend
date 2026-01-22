import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminAssignments.css";
import { FaArrowLeft, FaPlus, FaTrash, FaCheckCircle, FaClipboardList, FaBookOpen, FaCalendarAlt } from "react-icons/fa";
import { db, auth } from "../../firebase"; 
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, orderBy, serverTimestamp, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const AdminAssignments = () => {
  const navigate = useNavigate();
  const currentDept = localStorage.getItem("currentDept") || "Computer Engineering"; 
  const [currentUser, setCurrentUser] = useState(null);

  // --- 1. SUBJECT DATA ---
  const subjectsData = {
    "1st Year": ["Engineering Maths I", "Engineering Physics", "Basic Electrical", "Engineering Mechanics", "Other"],
    "2nd Year": ["Data Structures", "Discrete Maths", "Digital Logic", "COA", "Python Programming", "Other"],
    "3rd Year": ["Database Mgmt (DBMS)", "Operating Systems", "Computer Networks", "Theory of Computation", "Web Development", "Other"],
    "4th Year": ["Artificial Intelligence", "Cloud Computing", "Information Security", "Project Phase I", "Other"]
  };

  // States
  const [selectedYear, setSelectedYear] = useState("1st Year");
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState({}); 
  
  const [selectedAssignment, setSelectedAssignment] = useState(null); 
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New Assignment Form States
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState(""); 
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");

  // 🔥 0. AUTH CHECK (User ID lene ke liye)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
        if (user) setCurrentUser(user);
        else navigate("/");
    });
    return () => unsub();
  }, [navigate]);

  // 🔥 1. FETCH ASSIGNMENTS (Sirf Current User ne banaye hue)
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
        collection(db, "assignments"), 
        where("department", "==", currentDept),
        where("year", "==", selectedYear),
        where("createdBy", "==", currentUser.uid), // 👈 SIRF MERA DATA DIKHAO
        orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
        setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSelectedAssignment(null); 
    });
    return () => unsub();
  }, [selectedYear, currentDept, currentUser]);

  // 2. FETCH STUDENTS (Department ke hisab se)
  useEffect(() => {
    const q = query(
        collection(db, "users"), 
        where("role", "==", "student"),
        where("department", "==", currentDept),
        where("year", "==", selectedYear)
    );
    const unsub = onSnapshot(q, (snap) => {
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedYear, currentDept]);

  // 3. FETCH SUBMISSIONS
  useEffect(() => {
    if (!selectedAssignment) return;
    const q = query(collection(db, "submissions"), where("assignmentId", "==", selectedAssignment.id));
    const unsub = onSnapshot(q, (snap) => {
        const subMap = {};
        snap.docs.forEach(doc => { subMap[doc.data().studentUid] = true; });
        setSubmissions(subMap);
    });
    return () => unsub();
  }, [selectedAssignment]);

  // --- CREATE ASSIGNMENT LOGIC ---
  const handleCreateAssignment = async () => {
      const finalSubject = selectedSubject === "Other" ? customSubject : selectedSubject;

      if (!finalSubject || !newTitle || !newDate) {
          alert("⚠️ Please fill Subject, Topic, and Due Date!");
          return;
      }
      
      await addDoc(collection(db, "assignments"), {
          subject: finalSubject, 
          title: newTitle,       
          description: newDesc,
          dueDate: newDate,
          department: currentDept,
          year: selectedYear,
          createdBy: currentUser.uid, // 👈 ID SAVE KARO
          createdAt: serverTimestamp()
      });

      setShowCreateModal(false); 
      setNewTitle(""); setNewDesc(""); setNewDate(""); setSelectedSubject(""); setCustomSubject("");
  };

  const handleDeleteAssignment = async (id) => {
      if (window.confirm("Delete this assignment?")) {
          await deleteDoc(doc(db, "assignments", id));
          if (selectedAssignment?.id === id) setSelectedAssignment(null);
      }
  };

  const toggleStudentSubmission = async (student) => {
      if (!selectedAssignment) return;
      const subId = `${selectedAssignment.id}_${student.id}`;
      const subRef = doc(db, "submissions", subId);

      if (submissions[student.id]) {
          await deleteDoc(subRef); 
      } else {
          await setDoc(subRef, { 
              assignmentId: selectedAssignment.id,
              studentUid: student.id,
              studentName: student.name,
              department: currentDept,
              year: selectedYear,
              status: "Completed",
              submittedAt: serverTimestamp(),
              method: "Manual_Check_By_Admin"
          });
      }
  };

  return (
    <div className="assign-wrapper-ios">
      <header className="assign-header-glass">
          <div className="header-left">
            <button className="back-btn-glass" onClick={() => navigate('/admin-dashboard')}>
                <FaArrowLeft />
            </button>
            <div className="header-titles">
                <h1>Assignments 📝</h1>
                <p>Manage Tasks for <strong>{currentDept}</strong></p>
            </div>
          </div>
          <div className="year-pills">
              {["1st Year", "2nd Year", "3rd Year", "4th Year"].map(yr => (
                  <button key={yr} className={`pill-btn ${selectedYear === yr ? "active" : ""}`} onClick={() => setSelectedYear(yr)}>
                      {yr}
                  </button>
              ))}
          </div>
      </header>

      <div className="assign-body">
          <div className="assign-panel list-panel">
              <div className="panel-top">
                  <h3>Tasks ({assignments.length})</h3>
                  <button className="add-task-btn" onClick={() => setShowCreateModal(true)}>
                      <FaPlus/> New
                  </button>
              </div>
              
              <div className="tasks-container">
                  {assignments.length > 0 ? (
                      assignments.map(assign => (
                          <div 
                            key={assign.id} 
                            className={`task-item ${selectedAssignment?.id === assign.id ? 'selected' : ''}`}
                            onClick={() => setSelectedAssignment(assign)}
                          >
                              <div className="task-icon"><FaBookOpen /></div>
                              <div className="task-details">
                                  <span className="task-subject">{assign.subject}</span>
                                  <h4>{assign.title}</h4>
                                  <small><FaCalendarAlt/> Due: {assign.dueDate}</small>
                              </div>
                              <button className="delete-task-btn" onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assign.id); }}>
                                  <FaTrash/>
                              </button>
                          </div>
                      ))
                  ) : (
                      <div className="empty-placeholder">No assignments yet 📂</div>
                  )}
              </div>
          </div>

          <div className="assign-panel check-panel">
              {selectedAssignment ? (
                  <>
                      <div className="panel-top">
                          <div>
                              <h3>{selectedAssignment.subject}</h3>
                              <p>{selectedAssignment.title}</p>
                          </div>
                          <span className="progress-badge">
                              {Object.keys(submissions).length} / {students.length} Done
                          </span>
                      </div>

                      <div className="students-list">
                          {students.length > 0 ? (
                              students.map(student => (
                                  <div key={student.id} className="student-row" onClick={() => toggleStudentSubmission(student)}>
                                      <div className={`checkbox-circle ${submissions[student.id] ? 'checked' : ''}`}>
                                          {submissions[student.id] && <FaCheckCircle/>}
                                      </div>
                                      <div className="student-info">
                                          <h5>{student.name}</h5>
                                          <small>{student.studentId || "ID: N/A"}</small>
                                      </div>
                                  </div>
                              ))
                          ) : (
                              <div className="empty-placeholder">No students in {selectedYear} 🎓</div>
                          )}
                      </div>
                  </>
              ) : (
                  <div className="no-selection-view">
                      <div className="big-icon"><FaClipboardList/></div>
                      <h3>Select an Assignment</h3>
                      <p>Click on a task from the left to track student submissions.</p>
                  </div>
              )}
          </div>
      </div>

      {showCreateModal && (
          <div className="modal-overlay-glass">
              <div className="modal-card">
                  <h3>Create Assignment</h3>
                  <p>For: <strong>{selectedYear}</strong> • {currentDept}</p>
                  
                  <label>Subject</label>
                  <select 
                    value={selectedSubject} 
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="modal-input"
                  >
                      <option value="">-- Select Subject --</option>
                      {subjectsData[selectedYear]?.map((sub, i) => (
                          <option key={i} value={sub}>{sub}</option>
                      ))}
                  </select>

                  {selectedSubject === "Other" && (
                      <input 
                        type="text" 
                        placeholder="Enter Custom Subject Name..." 
                        className="modal-input"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                      />
                  )}

                  <label>Assignment Topic / Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Unit 1: Introduction Notes" 
                    className="modal-input"
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                  />

                  <div className="input-row">
                      <div className="half-input">
                        <label>Due Date</label>
                        <input type="date" className="modal-input" value={newDate} onChange={e => setNewDate(e.target.value)} />
                      </div>
                  </div>
                  
                  <textarea 
                    placeholder="Description (Optional instructions)..." 
                    className="modal-input"
                    rows="3"
                    value={newDesc} 
                    onChange={e => setNewDesc(e.target.value)} 
                  />

                  <div className="modal-footer">
                      <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                      <button className="save-btn" onClick={handleCreateAssignment}>Assign Task</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminAssignments;