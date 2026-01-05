import React, { useState, useEffect } from "react";
import Navbar from "../Navbar/Navbar"; 
import { FaFileAlt, FaDownload, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { realtimeDb as db } from "../../firebase"; 
import { ref, onValue } from "firebase/database";
import "./StudentExams.css"; // 👈 Ab ye apni sahi CSS use karega

const StudentExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [selectedYear, setSelectedYear] = useState("1st Year"); 

  // Firebase se data fetch karna
  useEffect(() => {
    const examRef = ref(db, 'exam_papers');
    onValue(examRef, (snapshot) => {
      const data = snapshot.val();
      const loaded = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
      setExams(loaded);
    });
  }, []);

  // Filter Logic
  const filteredExams = exams.filter(ex => ex.year === selectedYear);

  return (
    <>
      <Navbar />
      <div className="exam-wrapper">
        
        <div className="exam-header">
            <button className="back-btn" onClick={() => navigate('/home')} style={{position:'absolute', left:'20px', background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer'}}>
                <FaArrowLeft />
            </button>
            <div className="header-text">
                <h1>Exam Papers 📝</h1>
                <p>Select your year to view papers.</p>
            </div>
            
            <div className="year-tabs">
                {["1st Year", "2nd Year", "3rd Year", "4th Year"].map(yr => (
                    <button 
                        key={yr} 
                        className={`tab-btn ${selectedYear === yr ? 'active' : ''}`}
                        onClick={() => setSelectedYear(yr)}
                    >
                        {yr}
                    </button>
                ))}
            </div>
        </div>

        <div className="exam-grid">
            {filteredExams.length > 0 ? (
                filteredExams.map((paper) => (
                    <div key={paper.id} className="exam-card">
                        <div className="exam-icon-area">
                            <FaFileAlt className="pdf-icon"/>
                            <span className="exam-subject">{paper.subject}</span>
                        </div>
                        <div className="exam-info">
                            <h3>{paper.title}</h3>
                            <p className="exam-date">Uploaded: {paper.date}</p>
                            
                            <button className="download-btn" onClick={() => window.open(paper.link, '_blank')}>
                                <FaDownload /> Download
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="no-results">
                    <h3>No Papers Found for {selectedYear}</h3>
                </div>
            )}
        </div>

      </div>
    </>
  );
};

export default StudentExams;