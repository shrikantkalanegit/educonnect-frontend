import React from "react";
import "./CommunitySelection.css";
import { FaUsers, FaArrowLeft, FaComments } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CommunitySelection = () => {
  const navigate = useNavigate();

  const communities = [
    { 
      id: "1st-year-community", 
      title: "1st Year Hub", 
      desc: "General discussion for freshers.", 
      color: "#9c27b0", // Purple
      iconBg: "linear-gradient(135deg, #ba68c8 0%, #8e24aa 100%)"
    },
    { 
      id: "2nd-year-community", 
      title: "2nd Year Hub", 
      desc: "Hangout for sophomores.", 
      color: "#3f51b5", // Indigo
      iconBg: "linear-gradient(135deg, #7986cb 0%, #303f9f 100%)"
    },
    { 
      id: "3rd-year-community", 
      title: "3rd Year Hub", 
      desc: "Network for final years.", 
      color: "#009688", // Teal
      iconBg: "linear-gradient(135deg, #4db6ac 0%, #00695c 100%)"
    },
  ];

  return (
    <div className="community-container">
      
      {/* Header */}
      <header className="comm-header">
        <div>
          <h1>Student Community</h1>
          <p>Connect with everyone in your year.</p>
        </div>
        <button className="comm-back-btn" onClick={() => navigate('/admin-dashboard')}>
          <FaArrowLeft /> Dashboard
        </button>
      </header>

      {/* Cards Grid */}
      <div className="comm-grid">
        {communities.map((item, index) => (
          <div 
            key={index} 
            className="comm-card"
            onClick={() => navigate(`/admin/chat/${item.id}`)} // Reusing Chat Page
          >
            <div className="comm-icon" style={{background: item.iconBg}}>
              <FaUsers />
            </div>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
            
            <button className="comm-btn">Enter Hub <FaComments /></button>

            {/* Decoration */}
            <div className="decor-circle" style={{background: item.color}}></div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default CommunitySelection;