import React from "react";
import "../ClassSelection/ClassSelection.css"; // Reuse App CSS
import { FaUsers, FaArrowLeft, FaHashtag, FaUserGraduate } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CommunitySelection = () => {
  const navigate = useNavigate();

  const communities = [
    { id: "1st-year-community", title: "1st Year", color: "#9c27b0" },
    { id: "2nd-year-community", title: "2nd Year", color: "#3f51b5" },
    { id: "3rd-year-community", title: "3rd Year", color: "#009688" },
    { id: "4th-year-community", title: "4th Year", color: "#e67e22", icon: <FaUserGraduate/> },
  ];

  return (
    <div className="class-selection-container">
      <header className="selection-header">
        <h1>Community Apps 🌍</h1>
        <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
          <FaArrowLeft /> Dashboard
        </button>
      </header>

      <div className="years-grid">
        {communities.map((item) => (
          <div key={item.id} className="year-app-item" onClick={() => navigate(`/admin/chat/${item.id}`)}>
            <div className="year-squircle" style={{background: item.color}}>
              {item.icon ? item.icon : <FaUsers />}
            </div>
            <span className="year-label">{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunitySelection;