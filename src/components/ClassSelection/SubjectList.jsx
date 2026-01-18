import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ClassSelection.css"; // Reuse shared CSS
import { FaArrowLeft, FaLayerGroup } from "react-icons/fa";
import { db, auth } from "../../firebase"; 
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const SubjectList = () => {
  const { yearId } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState({ dept: "" });

  const gradients = [
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
    "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  ];

  useEffect(() => {
    const fetchSubjects = async () => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) { navigate("/"); return; }
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setStudentInfo({ dept: data.department });

            const q = query(
              collection(db, "subjects"), 
              where("department", "==", data.department), 
              where("year", "==", yearId)             
            );
            const querySnapshot = await getDocs(q);
            setSubjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        } catch (error) { console.error("Error:", error); } 
        finally { setLoading(false); }
      });
    };
    fetchSubjects();
  }, [navigate, yearId]);

  return (
    <div className="class-selection-container">
      <header className="selection-header">
        <h1>{yearId} Apps 📚</h1>
        <p>{studentInfo.dept}</p>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
      </header>

      {loading ? <p style={{textAlign:'center', opacity:0.6}}>Loading Apps...</p> : (
        <div className="years-grid">
          {subjects.length > 0 ? (
            subjects.map((sub, index) => {
              const bgGradient = gradients[index % gradients.length];
              const initial = sub.name.charAt(0).toUpperCase();

              return (
                <div key={sub.id} className="year-app-item" onClick={() => navigate(`/subject/${sub.name}`)}>
                  <div className="year-squircle" style={{background: bgGradient}}>
                    {initial}
                  </div>
                  <span className="year-label">{sub.name}</span>
                </div>
              );
            })
          ) : (
            <div style={{textAlign:'center', gridColumn:'1/-1', color:'#64748b'}}>
              <FaLayerGroup size={40} style={{marginBottom:'10px'}}/>
              <p>No subjects installed for {yearId}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectList;