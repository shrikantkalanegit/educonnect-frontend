import React from "react";
import { useNavigate } from "react-router-dom";
import "./ClassSelection.css"; 
import { FaArrowLeft, FaLaptopCode, FaCogs, FaDraftingCompass, FaAtom, FaMicroscope, FaFlask } from "react-icons/fa";

const ClassSelection = () => {
  const navigate = useNavigate();

  // Demo Subject Groups (Backend se bhi aa sakta hai)
  const subjectGroups = [
    { id: 1, title: "Computer Science", sub: "B.Tech / BCA", icon: <FaLaptopCode/>, color: "blue" },
    { id: 2, title: "Mechanical Engg", sub: "B.Tech / Diploma", icon: <FaCogs/>, color: "orange" },
    { id: 3, title: "Civil Engineering", sub: "B.Tech / Diploma", icon: <FaDraftingCompass/>, color: "green" },
    { id: 4, title: "Physics Major", sub: "B.Sc / M.Sc", icon: <FaAtom/>, color: "purple" },
    { id: 5, title: "Biology / Medical", sub: "MBBS / B.Sc", icon: <FaMicroscope/>, color: "red" },
    { id: 6, title: "Chemistry", sub: "B.Sc / Research", icon: <FaFlask/>, color: "cyan" },
  ];

  return (
    <div className="class-wrapper">
      
      {/* HEADER */}
      <header className="class-header">
        <button className="back-btn-glass" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
        </button>
        <div className="header-text">
            <h1>Select Department</h1>
            <p>Choose a subject group to proceed</p>
        </div>
        <div style={{width: 45}}></div> {/* Spacer for center alignment */}
      </header>

      {/* CONTENT GRID */}
      <div className="class-grid">
        {subjectGroups.map((group) => (
            <div key={group.id} className={`class-card ${group.color}-card`} onClick={() => alert(`Selected: ${group.title}`)}>
                <div className="card-icon-bg">{group.icon}</div>
                <div className="card-content">
                    <div className="icon-box">{group.icon}</div>
                    <h3>{group.title}</h3>
                    <p>{group.sub}</p>
                    <button className="enter-btn">Enter Class &rarr;</button>
                </div>
            </div>
        ))}
      </div>

    </div>
  );
};

export default ClassSelection;