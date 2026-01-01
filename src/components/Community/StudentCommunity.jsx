import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar"; 
import { FaCircleNotch } from "react-icons/fa";

const StudentCommunity = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Student ka Year pata karo
    const rawYear = localStorage.getItem("userYear") || "1st Year"; 
    
    // 👇 MAGIC FIX: "1st Year" ko "1st-year" mein badalna
    // Replace space with hyphen and make lowercase
    const formattedYear = rawYear.replace(/ /g, "-").toLowerCase();

    // 2. Ab ID bilkul Admin jaisi banegi: "1st-year-community"
    const communityId = `${formattedYear}-community`; 

    // 3. Redirect karo
    const timer = setTimeout(() => {
     navigate(`/subject/${communityId}`, { replace: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      <Navbar />
      <div style={{
        height: '80vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
        
        {/* Loading Animation */}
        <div style={{
          fontSize: '3rem', 
          color: '#9c27b0', 
          animation: 'spin 1s linear infinite'
        }}>
          <FaCircleNotch />
        </div>

        <h2 style={{color: '#333', marginTop: '20px'}}>Connecting to your Community...</h2>
        <p style={{color: '#777'}}>Matching you with your batchmates.</p>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default StudentCommunity;