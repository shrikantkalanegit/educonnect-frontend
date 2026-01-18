import React, { useState, useEffect } from "react";
import "./SubjectPage.css";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaCircle, FaArrowRight } from "react-icons/fa";
import { db, auth } from "../../firebase";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const SubjectPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [studentInfo, setStudentInfo] = useState({ name: "", dept: "", year: "" });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Cards Gradients
  const gradients = [
    "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  ];

  useEffect(() => {
    const fetchStudentData = async () => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) { navigate("/"); return; }
        
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // 🔥 SAFETY CHECK: Agar Department ya Year missing hai to Query mat chalao
            if (!data.department || !data.year) {
                console.error("Profile Incomplete: Department or Year is missing.");
                setErrorMsg("⚠️ Your profile is incomplete (Department/Year missing). Please update your profile.");
                setLoading(false);
                return; // Yahan se wapas laut jao, query mat run karo
            }

            setStudentInfo({ name: data.name, dept: data.department, year: data.year });

            // Ab confirm hai ki data.department aur data.year undefined nahi hain
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
    <div className="subjectpage">
      <header className="welcome-section">
        <h1>My Classroom 📚</h1>
        {/* Sirf tab dikhao jab info available ho */}
        {studentInfo.dept && <p>Faculty: <strong>{studentInfo.dept}</strong> • Year: <strong>{studentInfo.year}</strong></p>}
      </header>
    
      {loading ? (
        <p style={{textAlign:'center', marginTop:'50px'}}>Loading Subjects...</p>
      ) : errorMsg ? (
        <div className="no-data-msg">
            <h3 style={{color:'red'}}>{errorMsg}</h3>
        </div>
      ) : (
        <div className="subjects-container">
          {subjects.length === 0 ? (
            <div className="no-data-msg">
               <h3>🚫 No subjects found!</h3>
               <p>Your admin hasn't added subjects for {studentInfo.year} yet.</p>
            </div>
          ) : (
            subjects.map((subject, index) => {
              const cardColor = gradients[index % gradients.length];
              return (
                <div 
                  key={subject.id} 
                  className="subject-card"
                  onClick={() => navigate(`/subject/${subject.name}`)}
                >
                  <div className="card-top-accent" style={{background: cardColor}}></div>
                  <div className="card-icon-bubble" style={{background: cardColor}}>
                    {subject.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="card-content-area">
                    <h2>{subject.name}</h2>
                    <p>Tap to enter live classroom</p>
                    <div className="card-meta">
                      <div className="meta-item"><FaUsers /> Active</div>
                      <div className="meta-item"><FaCircle style={{color:'#2ecc71', fontSize:'0.6rem'}}/> Online</div>
                    </div>
                  </div>
                  <button className="join-btn">Enter Class <FaArrowRight /></button>
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