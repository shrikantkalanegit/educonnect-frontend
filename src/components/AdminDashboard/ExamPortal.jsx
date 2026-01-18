import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaCloudUploadAlt, FaTrash, FaFilePdf, FaPlus, FaTimes, FaLink, FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { realtimeDb as db } from "../../firebase";
import { ref, push, onValue, remove } from "firebase/database";
import "./ExamPortal.css"; 

const ExamPortal = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Upload Form States
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState("1st Year");
  const [link, setLink] = useState("");

  // Card Gradients (Random look ke liye)
  const cardGradients = [
    "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)"
  ];

  // 1. Fetch Papers
  useEffect(() => {
    const examRef = ref(db, 'exam_papers');
    onValue(examRef, (snapshot) => {
      const data = snapshot.val();
      const loadedExams = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
      setExams(loadedExams);
    });
  }, []);

  // 2. Upload Function
  const handleUpload = async (e) => {
    e.preventDefault();
    if(!title || !link) return alert("Please fill all details!");

    const newPaper = {
        title, subject, year, link,
        date: new Date().toLocaleDateString()
    };

    await push(ref(db, 'exam_papers'), newPaper);
    setShowModal(false);
    setTitle(""); setSubject(""); setLink(""); // Reset
  };

  // 3. Delete Function
  const handleDelete = async (id, e) => {
    e.stopPropagation(); 
    if(window.confirm("Delete this exam paper?")) {
        await remove(ref(db, `exam_papers/${id}`));
    }
  };

  return (
    <div className="exam-portal-container">
      
      {/* HEADER */}
      <header className="ep-header">
        <div>
            <h1>Exam Portal 📝</h1>
            <p>Previous Year Papers & Notes</p>
        </div>
        <button className="ep-back-btn" onClick={() => navigate('/admin-dashboard')}>
          <FaArrowLeft /> Dashboard
        </button>
      </header>

      {/* PAPERS GRID */}
      <div className="ep-grid">
        
        {/* 1. ADD NEW BUTTON */}
        <div className="paper-card add-paper-card" onClick={() => setShowModal(true)}>
            <div className="add-icon-circle"><FaPlus /></div>
            <h3>Upload Paper</h3>
        </div>

        {/* 2. PAPER CARDS */}
        {exams.map((paper, index) => (
            <div key={paper.id} className="paper-card" onClick={() => window.open(paper.link, '_blank')}>
                {/* Decorative Top */}
                <div className="paper-top-strip" style={{background: cardGradients[index % cardGradients.length]}}>
                    <FaFilePdf className="strip-icon" />
                </div>

                <div className="paper-content">
                    <span className="paper-badge">{paper.year}</span>
                    <h4>{paper.title}</h4>
                    <p className="paper-sub">{paper.subject}</p>
                    
                    <div className="paper-meta">
                        <FaCalendarAlt /> {paper.date}
                    </div>
                </div>

                {/* Delete Button */}
                <button className="ep-delete-btn" onClick={(e) => handleDelete(paper.id, e)}>
                    <FaTrash />
                </button>
            </div>
        ))}
      </div>

      {/* UPLOAD MODAL */}
      {showModal && (
        <div className="ep-modal-overlay">
            <div className="ep-modal">
                <div className="ep-modal-head">
                    <h3>Upload New Paper</h3>
                    <FaTimes onClick={() => setShowModal(false)} />
                </div>
                <form onSubmit={handleUpload}>
                    <div className="ep-input-group">
                        <input placeholder="Paper Title (e.g. Mid Sem 2024)" value={title} onChange={e=>setTitle(e.target.value)} required />
                    </div>
                    <div className="ep-row-inputs">
                        <input placeholder="Subject Name" value={subject} onChange={e=>setSubject(e.target.value)} required />
                        <select value={year} onChange={e=>setYear(e.target.value)}>
                            <option>1st Year</option>
                            <option>2nd Year</option>
                            <option>3rd Year</option>
                            <option>4th Year</option>
                        </select>
                    </div>
                    <div className="ep-input-group">
                        <FaLink className="input-icon"/>
                        <input placeholder="PDF Drive Link" value={link} onChange={e=>setLink(e.target.value)} required />
                    </div>
                    
                    <button type="submit" className="ep-upload-btn">
                        <FaCloudUploadAlt /> Publish Now
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default ExamPortal;