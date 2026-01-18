import React, { useState, useEffect } from "react";
import "./SubjectPage.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBookOpen, FaChalkboardTeacher, FaArrowRight, FaLayerGroup } from "react-icons/fa";
import { db, auth } from "../../firebase";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const SubjectPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [studentInfo, setStudentInfo] = useState({ name: "", dept: "", year: "" });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Aurora Theme Gradients
  const gradients = [
    "linear-gradient(135deg, #a855f7 0%, #d8b4fe 100%)", // Purple
    "linear-gradient(135deg, #3b82f6 0%, #93c5fd 100%)", // Blue
    "linear-gradient(135deg, #f97316 0%, #fdba74 100%)", // Orange
    "linear-gradient(135deg, #22c55e 0%, #86efac 100%)", // Green
    "linear-gradient(135deg, #ef4444 0%, #fca5a5 100%)", // Red
  ];

  useEffect(() => {
    const fetchStudentData = async () => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) { navigate("/"); return; }
        
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Safety Check
            if (!data.department || !data.year) {
                setErrorMsg("⚠️ Profile incomplete. Please contact admin.");
                setLoading(false);
                return;
            }

            setStudentInfo({ name: data.name, dept: data.department, year: data.year });

            // Fetch Subjects
            const q = query(
              collection(db, "subjects"),
              where("department", "==", data.department),
              where("year", "==", data.year)
            );

            onSnapshot(q, (snapshot) => {
              setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
              setLoading(false);
            });
          } else {
              setErrorMsg("User data not found.");
              setLoading(false);
          }
        } catch (error) { 
            console.error("Error:", error); 
            setLoading(false); 
        }
      });
    };
    fetchStudentData();
  }, [navigate]);

  return (
    <div className="sub-wrapper">
      
      {/* HEADER */}
      <header className="sub-header">
        <button className="back-btn-glass" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
        </button>
        <div className="header-text">
            <h1>My Classroom</h1>
            {studentInfo.dept && <p>{studentInfo.dept} • {studentInfo.year}</p>}
        </div>
        <div style={{width: 45}}></div> {/* Spacer for alignment */}
      </header>
    
      {loading ? (
        <div className="loading-glass">Loading Subjects...</div>
      ) : errorMsg ? (
        <div className="no-data-glass">
            <h3>🚫 Access Denied</h3>
            <p>{errorMsg}</p>
        </div>
      ) : (
        <div className="sub-grid">
          {subjects.length === 0 ? (
            <div className="no-data-glass">
               <h3>📭 No Classes Yet</h3>
               <p>Subjects have not been added for your batch.</p>
            </div>
          ) : (
            subjects.map((subject, index) => {
              const bgGradient = gradients[index % gradients.length];
              return (
                <div 
                  key={subject.id} 
                  className="sub-card"
                  onClick={() => navigate(`/subject/${subject.name}`)}
                >
                  
                  {/* Decorative Background Icon */}
                  <div className="bg-decor-icon"><FaLayerGroup/></div>

                  <div className="card-top">
                    <div className="sub-icon-box" style={{background: bgGradient}}>
                        {subject.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="sub-badge">Live Class</span>
                  </div>

                  <div className="card-mid">
                    <h2>{subject.name}</h2>
                    <p className="teacher-name"><FaChalkboardTeacher/> Class Faculty</p>
                  </div>

                  <div className="card-footer">
                    <span>View Materials</span>
                    <button className="open-btn">
                        Open <FaArrowRight/>
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectPage;