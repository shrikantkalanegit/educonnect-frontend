import React from "react";
import "./ClassSelection.css"; // Using Shared CSS
import { FaGraduationCap, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ClassSelection = () => {
  const navigate = useNavigate();

  const years = [
    { id: "1st Year", title: "1st Year", bg: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" },
    { id: "2nd Year", title: "2nd Year", bg: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)" },
    { id: "3rd Year", title: "3rd Year", bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    { id: "4th Year", title: "4th Year", bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  ];

  return (
    <div className="class-selection-container">
      <header className="selection-header">
        <h1>Select Class 🎓</h1>
        <button className="back-btn" onClick={() => navigate('/home')}>
          <FaArrowLeft /> Home
        </button>
      </header>

      <div className="years-grid">
        {years.map((year, index) => (
          <div 
            key={index} 
            className="year-app-item" 
            onClick={() => navigate(`/student/subjects/${year.id}`)}
          >
            <div className="year-squircle" style={{ background: year.bg }}>
               <FaGraduationCap />
            </div>
            <span className="year-label">{year.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassSelection;