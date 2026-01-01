import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ManageSubjects.css";
import { FaPlus, FaTrash, FaArrowLeft, FaBookOpen } from "react-icons/fa";

// 👇 Firebase Imports
import { db, auth } from "../../firebase";
import { 
  collection, addDoc, deleteDoc, doc, 
  onSnapshot, query, where, serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ManageSubjects = () => {
  const { yearId } = useParams(); // URL se milega (e.g., "1st Year")
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // 1️⃣ Check Karo Kaun Admin Login Hai
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        navigate("/admin-login"); // Agar login nahi hai to bhaga do
      }
    });
    return () => unsubAuth();
  }, [navigate]);

  // 2️⃣ Sirf USI Admin ke Subjects Lao (Filter Logic)
  useEffect(() => {
    if (!currentUser) return;

    // QUERY: Year match hona chahiye + Banane wala (createdBy) Current User hona chahiye
    const q = query(
      collection(db, "subjects"),
      where("year", "==", yearId),
      where("createdBy", "==", currentUser.uid) // 👈 YE HAI MAIN MAGIC
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subjectData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubjects(subjectData);
    });

    return () => unsubscribe();
  }, [yearId, currentUser]);

  // 3️⃣ Naya Subject Add Karte Waqt 'Owner' ka Thappa Lagao
  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;
    if (!currentUser) return alert("Please Login First!");

    try {
      await addDoc(collection(db, "subjects"), {
        name: newSubject,
        year: yearId,
        createdBy: currentUser.uid, // 👈 Save kiya ki kisne banaya
        createdAt: serverTimestamp(),
        icon: "📚" // Default Icon
      });
      setNewSubject("");
      setShowModal(false);
    } catch (error) {
      console.error("Error adding subject:", error);
      alert("Error adding subject");
    }
  };

  // 4️⃣ Delete Subject
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      await deleteDoc(doc(db, "subjects", id));
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
          <h2>Manage {yearId} Subjects</h2>
          <p>Your Personal Subject Groups</p>
        </div>
      </header>

      {/* Grid */}
      <div className="subjects-grid">
        
        {/* Add New Button Card */}
        <div className="subject-card add-card" onClick={() => setShowModal(true)}>
          <div className="icon-box add-icon"><FaPlus /></div>
          <h3>Create New Group</h3>
        </div>

        {/* Existing Subjects List */}
        {subjects.map((sub) => (
          <div key={sub.id} className="subject-card">
            <div className="card-top">
              <div className="icon-box"><FaBookOpen /></div>
              <button className="delete-btn" onClick={() => handleDelete(sub.id)}>
                <FaTrash />
              </button>
            </div>
            <h3>{sub.name}</h3>
            <p className="admin-tag">Created by You</p>
            <button className="open-chat-btn" onClick={() => navigate(`/admin/chat/${sub.name}`)}>
              Open Chat &rarr;
            </button>
          </div>
        ))}
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Subject</h3>
            <input 
              type="text" 
              placeholder="Enter Subject Name (e.g. Java)" 
              value={newSubject} 
              onChange={(e) => setNewSubject(e.target.value)} 
              autoFocus
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="save-btn" onClick={handleAddSubject}>Create Group</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageSubjects;