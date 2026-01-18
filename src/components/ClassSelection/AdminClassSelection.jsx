import React from "react";
import "./AdminClassSelection.css"; 
import { FaGraduationCap, FaArrowLeft, FaEllipsisV } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AdminClassSelection = () => {
  const navigate = useNavigate();
  const currentDept = localStorage.getItem("currentDept") || "Department";

  const years = [
    { id: "1st Year", title: "1st Year", bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { id: "2nd Year", title: "2nd Year", bg: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)" },
    { id: "3rd Year", title: "3rd Year", bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    { id: "4th Year", title: "4th Year", bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  ];

  return (
    <div className="class-selection-container">
      <header className="selection-header">
        <div>
            <h1>Select Class</h1>
            <p>Managing: <b>{currentDept}</b></p>
        </div>
        <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
          <FaArrowLeft /> Dashboard
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
              <p>Manage Subjects</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminClassSelection;