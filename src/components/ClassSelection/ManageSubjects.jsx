import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ManageSubjects.css"; 
import { FaPlus, FaTrash, FaArrowLeft, FaBook, FaComments } from "react-icons/fa";
import { db } from "../../firebase";
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from "firebase/firestore";

const ManageSubjects = () => {
  const { yearId } = useParams(); 
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const currentDept = localStorage.getItem("currentDept");

  useEffect(() => {
    if (!currentDept) { navigate("/admin/select-dept"); return; }
    fetchSubjects();
  }, [yearId, currentDept]);

  const fetchSubjects = async () => {
    const q = query(collection(db, "subjects"), where("department", "==", currentDept), where("year", "==", yearId));
    const snap = await getDocs(q);
    setSubjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleAdd = async () => {
    if (!newSubject.trim()) return;
    await addDoc(collection(db, "subjects"), {
      name: newSubject, year: yearId, department: currentDept, createdAt: serverTimestamp()
    });
    setNewSubject(""); setShowModal(false); fetchSubjects();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this subject?")) {
      await deleteDoc(doc(db, "subjects", id)); fetchSubjects();
    }
  };

  return (
    <div className="manage-sub-container">
      <header className="sub-header">
        <button className="back-circle-btn" onClick={() => navigate("/admin/class-selection")}>
          <FaArrowLeft />
        </button>
        <div>
          <h2>{yearId} Subjects</h2>
          <p>{currentDept}</p>
        </div>
      </header>

      <div className="subjects-grid">
        <div className="add-card" onClick={() => setShowModal(true)}>
          <div className="add-icon"><FaPlus /></div>
          <h3>Add Subject</h3>
        </div>

        {subjects.map((sub) => (
          <div key={sub.id} className="subject-card">
            <div className="card-top">
              <FaBook className="sub-icon"/>
              <button className="delete-btn" onClick={() => handleDelete(sub.id)}><FaTrash /></button>
            </div>
            <h3>{sub.name}</h3>
            <button className="open-chat-btn" onClick={() => navigate(`/admin/chat/${sub.name}`)}>
              <FaComments style={{marginRight:'8px'}}/> Open Chat
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>New Subject</h3>
            <input type="text" placeholder="e.g. Java" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
            <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleAdd}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSubjects;