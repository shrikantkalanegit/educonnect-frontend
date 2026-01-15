import React from "react";
import "./CommunitySelection.css";
import { FaUsers, FaArrowLeft, FaComments, FaUserGraduate } from "react-icons/fa";
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
      desc: "Network for juniors.", 
      color: "#009688", // Teal
      iconBg: "linear-gradient(135deg, #4db6ac 0%, #00695c 100%)"
    },
    // 👇 ADDED 4TH YEAR HERE
    { 
      id: "4th-year-community", 
      title: "4th Year Hub", 
      desc: "Final year projects & placement talk.", 
      color: "#e67e22", // Orange
      iconBg: "linear-gradient(135deg, #f39c12 0%, #d35400 100%)",
      icon: <FaUserGraduate /> // Special Icon for Seniors
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
            onClick={() => navigate(`/admin/chat/${item.id}`)} 
          >
            <div className="comm-icon" style={{background: item.iconBg}}>
              {item.icon ? item.icon : <FaUsers />}
            </div>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
            
            <button className="comm-btn" style={{borderColor: item.color, color: item.color}}>
                Enter Hub <FaComments style={{marginLeft:'5px'}}/>
            </button>

            {/* Decoration */}
            <div className="decor-circle" style={{background: item.color}}></div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default CommunitySelection;