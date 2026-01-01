import React from "react";
import "./ClassSelection.css";
import { FaGraduationCap, FaArrowLeft, FaEllipsisV } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ClassSelection = () => {
  const navigate = useNavigate();

  const years = [
    { 
      id: "1st-year", title: "1st Year", subtitle: "Beginner",
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Deep Purple
    },
    { 
      id: "2nd-year", title: "2nd Year", subtitle: "Intermediate",
      bg: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)", // Pinkish
    },
    { 
      id: "3rd-year", title: "3rd Year", subtitle: "Advanced",
      bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Cyan Blue
    },
  ];

  return (
    <div className="class-selection-container">
      <header className="selection-header">
        <h1>Select Class</h1>
        <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
          <FaArrowLeft /> Back
        </button>
      </header>

      <div className="years-grid">
        {years.map((year, index) => (
          <div 
            key={index} 
            className="year-card"
            style={{ background: year.bg }}
            onClick={() => navigate(`/admin/manage-subjects/${year.id}`)}
          >
            <div className="card-top">
               <div className="icon-box"><FaGraduationCap /></div>
               <div className="three-dots"><FaEllipsisV /></div>
            </div>

            <div className="card-info">
              <h3>{year.title}</h3>
              <p>{year.subtitle}</p>
            </div>
            
            <div className="bg-circle"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassSelection;