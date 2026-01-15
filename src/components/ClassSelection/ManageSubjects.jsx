import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ManageSubjects.css"; // CSS same rahegi
import { FaPlus, FaTrash, FaArrowLeft, FaBookOpen, FaComments } from "react-icons/fa";

// Firebase Imports
import { db } from "../../firebase";
import { 
  collection, addDoc, deleteDoc, doc, 
  getDocs, query, where, serverTimestamp 
} from "firebase/firestore";

const ManageSubjects = () => {
  const { yearId } = useParams(); // URL se Year milega (e.g. "1st Year")
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 Current Faculty (BCA, BCS...)
  const currentDept = localStorage.getItem("currentDept");

  useEffect(() => {
    if (!currentDept) {
        navigate("/admin/select-dept");
        return;
    }
    fetchSubjects();
  }, [yearId, currentDept]);

  // 🔥 1. Subjects Fetch (Filter: Dept + Year)
  const fetchSubjects = async () => {
    try {
        const q = query(
            collection(db, "subjects"),
            where("department", "==", currentDept), // ✅ Sirf is Faculty ke
            where("year", "==", yearId)             // ✅ Sirf is Year ke
        );
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubjects(list);
    } catch (error) {
        console.error("Error:", error);
    }
  };

  // 🔥 2. Add Subject (Save with Dept)
  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;

    try {
      setLoading(true);
      
      // Check Duplicate
      const exists = subjects.some(s => s.name.toLowerCase() === newSubject.toLowerCase());
      if(exists) { alert("Subject already exists!"); setLoading(false); return; }

      await addDoc(collection(db, "subjects"), {
        name: newSubject,
        year: yearId,
        department: currentDept, // ✅ IMP: Attendance ke liye zaroori
        createdAt: serverTimestamp(),
        icon: "📚"
      });
      
      setNewSubject("");
      setShowModal(false);
      fetchSubjects(); // Refresh
    } catch (error) {
      console.error("Error adding subject:", error);
    }
    setLoading(false);
  };

  // 3. Delete Subject
  const handleDelete = async (id) => {
    if (window.confirm("Delete this subject & chat group?")) {
      await deleteDoc(doc(db, "subjects", id));
      fetchSubjects();
    }
  };

  return (
    <div className="manage-sub-container">
      
      {/* Header */}
      <header className="sub-header">
        <button className="back-circle-btn" onClick={() => navigate("/admin/class-selection")}>
          <FaArrowLeft />
        </button>
        <div>
          <h2>{yearId} Subjects ({currentDept})</h2>
          <p>Manage Curriculum & Chat Groups</p>
        </div>
      </header>

      {/* Grid Cards (Wapas aa gaye!) */}
      <div className="subjects-grid">
        
        {/* Add Button Card */}
        <div className="subject-card add-card" onClick={() => setShowModal(true)}>
          <div className="icon-box add-icon"><FaPlus /></div>
          <h3>Create Subject</h3>
        </div>

        {/* Existing Subjects Cards */}
        {subjects.map((sub) => (
          <div key={sub.id} className="subject-card">
            <div className="card-top">
              <div className="icon-box"><FaBookOpen /></div>
              <button className="delete-btn" onClick={() => handleDelete(sub.id)}>
                <FaTrash />
              </button>
            </div>
            
            <h3>{sub.name}</h3>
            <p className="admin-tag">{sub.department} • {sub.year}</p>
            
            {/* 👇 CHAT BUTTON IS BACK! */}
            <button className="open-chat-btn" onClick={() => navigate(`/admin/chat/${sub.name}`)}>
              <FaComments style={{marginRight:'8px'}}/> Open Chat
            </button>
          </div>
        ))}
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Subject</h3>
            <p>For {yearId} - {currentDept}</p>
            <input 
              type="text" 
              placeholder="Enter Subject Name (e.g. C++)" 
              value={newSubject} 
              onChange={(e) => setNewSubject(e.target.value)} 
              autoFocus
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="save-btn" onClick={handleAddSubject} disabled={loading}>
                {loading ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageSubjects;