import React, { useState, useEffect } from "react";
import "./SubjectPage.css";
// import Navbar from "../Navbar/Navbar"; // Agar aapke paas Navbar hai to uncomment karein
import { useNavigate } from "react-router-dom";
import { FaUsers, FaCircle, FaArrowRight, FaBookReader } from "react-icons/fa";

// 👇 Firebase Imports (Zaroori hain)
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const SubjectPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [studentYear, setStudentYear] = useState("");

  // Random Gradients (Aapka wala Style) 🎨
  const gradients = [
    "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)", // Blue-Purple
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)", // Pinky
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)", // Mint
    "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)", // Sunset
  ];

  useEffect(() => {
    // 1. Check karo Student kaun hai (Login ke waqt save kiya tha)
    const storedName = localStorage.getItem("userName");
    const storedYear = localStorage.getItem("userYear"); // e.g. "1st Year"

    if (!storedName || !storedYear) {
      // Agar login nahi hai to wapas bhejo
      navigate("/"); 
      return;
    }

    setStudentName(storedName);
    setStudentYear(storedYear);

    // 2. Firebase se Sirf "Us Year" ke Subjects lao
    // (Aapka purana logic local storage use kar raha tha, ye database use karega)
    const q = query(
      collection(db, "subjects"),
      where("year", "==", storedYear) // 👈 Filter Logic
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubjects(liveData);
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <>
      {/* <Navbar/> */}
      <div className="subjectpage">
        <header className="welcome-section">
          <h1>Welcome, {studentName} 👋</h1>
          <p>Here are your <strong>{studentYear}</strong> Learning Groups 📚</p>
        </header>
      
        <div className="subjects-container">
          {subjects.length === 0 ? (
            <div className="no-data-msg">
               <h3>📭 No active groups found for {studentYear}.</h3>
               <p>Please contact your Admin/Teacher.</p>
            </div>
          ) : (
            subjects.map((subject, index) => {
              // Color pick logic
              const cardColor = gradients[index % gradients.length];
              
              return (
                <div 
                  key={subject.id} 
                  className="subject-card"
                  onClick={() => navigate(`/student/chat/${subject.name}`)} // Chat room mein bhejo
                >
                  <div className="card-top-accent" style={{background: cardColor}}></div>
                  
                  {/* Icon Bubble */}
                  <div className="card-icon-bubble" style={{background: cardColor}}>
                    {subject.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="card-content-area">
                    <h2>{subject.name}</h2>
                    {/* Agar description nahi hai to default text dikhao */}
                    <p>{subject.desc || "Tap to join the class discussion group."}</p>
                    
                    {/* Stats UI */}
                    <div className="card-meta">
                      <div className="meta-item"><FaUsers /> Group Active</div>
                      <div className="meta-item"><FaCircle style={{color:'#2ecc71', fontSize:'0.6rem'}}/> Online</div>
                    </div>
                  </div>

                  <button className="join-btn">
                    Enter Group <FaArrowRight />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default SubjectPage;