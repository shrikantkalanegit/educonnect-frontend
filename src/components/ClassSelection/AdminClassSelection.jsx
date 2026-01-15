import React from "react";
import "./AdminClassSelection.css"; // Hum purana CSS wapas use karenge
import { FaGraduationCap, FaArrowLeft, FaEllipsisV } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AdminClassSelection = () => {
  const navigate = useNavigate();
  const currentDept = localStorage.getItem("currentDept");

  // Cards ka Data
  const years = [
    { 
      id: "1st Year", title: "1st Year", subtitle: "Beginner",
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
    },
    { 
      id: "2nd Year", title: "2nd Year", subtitle: "Intermediate",
      bg: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)", 
    },
    { 
      id: "3rd Year", title: "3rd Year", subtitle: "Advanced",
      bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", 
    },
    { 
      id: "4th Year", title: "4th Year", subtitle: "Final Year",
      bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", 
    },
  ];

  return (
    <div className="class-selection-container">
      <header className="selection-header">
        <div>
            <h1>Select Class</h1>
            <p style={{color: '#666'}}>Faculty: <b>{currentDept}</b></p>
        </div>
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
            // 👇 CLICK karne par andar subjects wale page par jayega
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

export default AdminClassSelection;