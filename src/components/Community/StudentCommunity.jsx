import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar"; 
import { FaUsers, FaUniversity, FaHashtag } from "react-icons/fa";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import "./StudentCommunity.css"; 

const StudentCommunity = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setUserData(snap.data());
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) return <div style={{textAlign:'center', marginTop:'50px', color:'#64748b'}}>Loading Apps...</div>;
  if (!userData) return <div style={{textAlign:'center', marginTop:'50px'}}>Please Login first.</div>;

  // Dynamic IDs
  const classHubID = `${userData.department}-${userData.year}-Hub`; 
  const deptHubID = `${userData.department}-General-Hub`;           

  return (
    <>
      <Navbar />
      <div className="stu-comm-container">
        
        <header className="stu-comm-header">
            <h1>Communities 🌍</h1>
            <p>Join the discussion channels.</p>
        </header>

        <div className="stu-comm-grid">
            
            {/* APP 1: CLASS BATCH */}
            <div className="app-item" onClick={() => navigate(`/subject/${classHubID}`)}>
                <div className="app-squircle" style={{background: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)'}}>
                    <FaUsers />
                    {/* Fake Notification Badge */}
                    <div className="notif-badge">3</div>
                </div>
                <span className="app-label">{userData.year} Batch</span>
            </div>

            {/* APP 2: DEPARTMENT HUB */}
            <div className="app-item" onClick={() => navigate(`/subject/${deptHubID}`)}>
                <div className="app-squircle" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
                    <FaUniversity />
                </div>
                <span className="app-label">{userData.department} HQ</span>
            </div>

            {/* APP 3: TRENDING (Optional) */}
            <div className="app-item" onClick={() => alert("Global Channel Coming Soon!")}>
                <div className="app-squircle" style={{background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}}>
                    <FaHashtag />
                </div>
                <span className="app-label">Trending</span>
            </div>

        </div>
      </div>
    </>
  );
};

export default StudentCommunity;