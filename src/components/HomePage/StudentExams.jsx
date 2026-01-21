import React, { useState, useEffect } from "react";
import { FaFilePdf, FaDownload, FaArrowLeft, FaFilter } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { realtimeDb as db } from "../../firebase"; 
import { ref, onValue } from "firebase/database";
import "./StudentExams.css"; 

const StudentExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [selectedYear, setSelectedYear] = useState("1st Year"); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const examRef = ref(db, 'exam_papers');
    onValue(examRef, (snapshot) => {
      const data = snapshot.val();
      const loaded = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
      setExams(loaded);
      setLoading(false);
    });
  }, []);

  const filteredExams = exams.filter(ex => ex.year === selectedYear);

  return (
    <div className="exam-wrapper-ios">
      
      {/* HEADER */}
      <header className="exam-header-glass">
          <button className="back-btn-glass" onClick={() => navigate('/home')}>
              <FaArrowLeft />
          </button>
          <div className="header-title-box">
              <h1>Exam Portal 📝</h1>
              <p>Previous Year Papers</p>
          </div>
          <div className="header-spacer"></div>
      </header>

      {/* YEAR FILTER TABS */}
      <div className="exam-filter-tabs">
          {["1st Year", "2nd Year", "3rd Year", "4th Year"].map(yr => (
              <button 
                  key={yr} 
                  className={`exam-tab-btn ${selectedYear === yr ? 'active' : ''}`}
                  onClick={() => setSelectedYear(yr)}
              >
                  {yr}
              </button>
          ))}
      </div>

      {/* PAPERS LIST */}
      <div className="exam-content-area">
          {loading ? (
              <div className="loading-state">Fetching Papers...</div>
          ) : filteredExams.length > 0 ? (
              <div className="exam-grid-ios">
                  {filteredExams.map((paper) => (
                      <div key={paper.id} className="exam-card-ios">
                          <div className="exam-icon-box">
                              <FaFilePdf />
                          </div>
                          <div className="exam-info">
                              <h3>{paper.title}</h3>
                              <p className="exam-meta">{paper.subject} • {paper.date}</p>
                          </div>
                          <button className="download-btn-ios" onClick={() => window.open(paper.link, '_blank')}>
                              <FaDownload />
                          </button>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="empty-state-ios">
                  <h3>No Papers Found</h3>
                  <p>No exams uploaded for {selectedYear} yet.</p>
              </div>
          )}
      </div>

    </div>
  );
};

export default StudentExams;