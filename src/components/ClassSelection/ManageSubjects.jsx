import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ManageSubjects.css"; 
import { FaPlus, FaTrash, FaArrowLeft, FaBook, FaComments, FaLayerGroup } from "react-icons/fa";
import { db, auth } from "../../firebase";
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ManageSubjects = () => {
  const { yearId } = useParams(); 
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  
  const currentDept = localStorage.getItem("currentDept");

  // 1. AUTH CHECK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
            setCurrentUser(user);
        } else {
            navigate("/");
        }
    });
    return () => unsub();
  }, [navigate]);

  // 2. FETCH SUBJECTS (Only Created By Me)
  useEffect(() => {
    if (!currentUser || !currentDept) return; // Wait for user & dept
    
    const fetchSubjects = async () => {
      try {
        const q = query(
            collection(db, "subjects"), 
            where("department", "==", currentDept), 
            where("year", "==", yearId),
            where("createdBy", "==", currentUser.uid) // 🔥 SECURITY: Sirf mera data
        );
        const snap = await getDocs(q);
        setSubjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    fetchSubjects();
  }, [yearId, currentDept, currentUser]);

  // 3. CREATE SUBJECT
  const handleAdd = async () => {
    if (!newSubject.trim()) return;
    
    await addDoc(collection(db, "subjects"), {
      name: newSubject, 
      year: yearId, 
      department: currentDept,
      createdBy: currentUser.uid, // 🔥 SECURITY: ID Save karo
      createdAt: serverTimestamp()
    });

    setNewSubject(""); 
    setShowModal(false); 
    
    // Refresh List Manually (for instant update)
    const q = query(
        collection(db, "subjects"), 
        where("department", "==", currentDept), 
        where("year", "==", yearId),
        where("createdBy", "==", currentUser.uid)
    );
    const snap = await getDocs(q);
    setSubjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // 4. DELETE SUBJECT
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this subject group?")) {
      await deleteDoc(doc(db, "subjects", id)); 
      setSubjects(prev => prev.filter(sub => sub.id !== id));
    }
  };

  // Gradients for UI
  const gradients = [
    "linear-gradient(135deg, #a855f7 0%, #d8b4fe 100%)", 
    "linear-gradient(135deg, #3b82f6 0%, #93c5fd 100%)", 
    "linear-gradient(135deg, #f97316 0%, #fdba74 100%)", 
    "linear-gradient(135deg, #22c55e 0%, #86efac 100%)"
  ];

  return (
    <div className="manage-sub-container">
      
      <header className="sub-header">
        <button className="back-circle-btn" onClick={() => navigate("/admin/class-selection")}>
          <FaArrowLeft />
        </button>
        <div>
          <h2>{yearId} Subjects</h2>
          <p>Managing: <strong>{currentDept}</strong></p>
        </div>
      </header>

      <div className="subjects-grid">
        {/* ADD CARD */}
        <div className="add-card" onClick={() => setShowModal(true)}>
          <div className="add-icon"><FaPlus /></div>
          <h3>Create Group</h3>
        </div>

        {/* SUBJECT CARDS */}
        {subjects.map((sub, index) => (
          <div key={sub.id} className="subject-card">
            
            <div className="card-top">
              <div className="sub-icon-box" style={{background: gradients[index % gradients.length]}}>
                  {sub.name.charAt(0).toUpperCase()}
              </div>
              <button className="delete-btn" onClick={(e) => handleDelete(sub.id, e)}>
                  <FaTrash />
              </button>
            </div>

            <div className="card-body">
                <h3>{sub.name}</h3>
                <span className="admin-tag">Admin: Me</span>
            </div>

            <button className="open-chat-btn" onClick={() => navigate(`/admin/chat/${sub.name}`)}>
              <FaComments style={{marginRight:'8px'}}/> Open Chat
            </button>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>New Subject Group</h3>
            <p>For {yearId} • {currentDept}</p>
            <input 
                type="text" 
                placeholder="Subject Name (e.g. Java Programming)" 
                value={newSubject} 
                onChange={(e) => setNewSubject(e.target.value)} 
            />
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