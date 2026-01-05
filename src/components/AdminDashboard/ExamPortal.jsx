import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaCloudUploadAlt, FaTrash, FaFilePdf } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { realtimeDb as db } from "../../firebase";
import { ref, push, onValue, remove } from "firebase/database";
import "./ManageBooks.css"; // Hum wahi CSS use karenge

const ExamPortal = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  
  // Upload Form States
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState("1st Year"); // Default Year
  const [link, setLink] = useState("");

  // 1. Firebase se data lana
  useEffect(() => {
    const examRef = ref(db, 'exam_papers');
    onValue(examRef, (snapshot) => {
      const data = snapshot.val();
      const loadedExams = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
      setExams(loadedExams);
    });
  }, []);

  // 2. Paper Upload karna
  const handleUpload = async (e) => {
    e.preventDefault();
    if(!title || !link) return alert("Please fill all details!");

    const newPaper = {
        title, subject, year, link,
        date: new Date().toLocaleDateString()
    };

    await push(ref(db, 'exam_papers'), newPaper);
    alert("Exam Paper Uploaded Successfully!");
    setTitle(""); setSubject(""); setLink("");
  };

  // 3. Delete karna
  const handleDelete = async (id) => {
    if(window.confirm("Delete this paper?")) {
        await remove(ref(db, `exam_papers/${id}`));
    }
  };

  return (
    <div className="manage-container">
      <header className="manage-header">
        <button onClick={() => navigate('/admin-dashboard')}><FaArrowLeft /></button>
        <h2>Exam Portal (Admin)</h2>
      </header>

      <div className="manage-content">
        {/* LEFT: UPLOAD FORM */}
        <div className="add-book-form">
            <h3><FaCloudUploadAlt /> Upload Paper</h3>
            <form onSubmit={handleUpload}>
                <label style={{fontWeight:'bold'}}>Select Year:</label>
                <select value={year} onChange={e=>setYear(e.target.value)} className="year-select">
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                </select>

                <input placeholder="Paper Title (e.g. Mid-Sem 2024)" value={title} onChange={e=>setTitle(e.target.value)} required />
                <input placeholder="Subject (e.g. Data Structures)" value={subject} onChange={e=>setSubject(e.target.value)} />
                <input placeholder="PDF Link (Google Drive/URL)" value={link} onChange={e=>setLink(e.target.value)} required />
                
                <button type="submit" className="add-btn">Publish Paper</button>
            </form>
        </div>

        {/* RIGHT: LIST OF PAPERS */}
        <div className="book-list-section">
            <h3>Uploaded Papers ({exams.length})</h3>
            <div className="paper-list">
                {exams.map((paper) => (
                    <div key={paper.id} className="paper-item">
                        <div className="paper-icon"><FaFilePdf /></div>
                        <div className="paper-info">
                            <h4>{paper.title}</h4>
                            <span className="badge-year">{paper.year}</span>
                            <p>{paper.subject} • {paper.date}</p>
                            <a href={paper.link} target="_blank" rel="noreferrer">View PDF</a>
                        </div>
                        <button className="delete-btn" onClick={() => handleDelete(paper.id)}><FaTrash /></button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPortal;