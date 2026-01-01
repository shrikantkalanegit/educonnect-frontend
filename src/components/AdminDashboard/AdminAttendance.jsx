import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 👈 Navigation Import
import { db } from "../../firebase"; 
import { collection, getDocs } from "firebase/firestore"; 
import { FaQrcode, FaBook, FaTimes, FaArrowLeft } from "react-icons/fa"; // 👈 Arrow Icon Import
import QRCode from "react-qr-code"; 
import "./AdminAttendance.css"; 

const AdminAttendance = () => {
  const navigate = useNavigate(); // 👈 Hook initialize
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  
  // QR Data State
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "subjects"));
        const subList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() 
        }));
        setSubjects(subList);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const handleGenerateQR = () => {
    if(!selectedSubject) return;
    
    const subject = subjects.find(s => s.id === selectedSubject);
    
    const qrData = JSON.stringify({
        subjectId: subject.id,
        subjectName: subject.name,
        year: subject.year || "All",
        date: new Date().toLocaleDateString(), 
        generatedAt: new Date().toISOString()
    });

    setQrCodeValue(qrData);
    setShowQR(true);
  };

  const closeQR = () => {
    setShowQR(false);
    setQrCodeValue("");
  };

  return (
    <div className="attendance-container">
      
      {/* 👇 1. HEADER WITH BACK BUTTON */}
      <header className="page-header-bar">
        <button className="back-btn-circle" onClick={() => navigate('/admin-dashboard')}>
            <FaArrowLeft />
        </button>
        <h2>Smart Attendance Panel</h2>
      </header>
      
      {loading && <p style={{textAlign:"center"}}>Loading Subjects...</p>}

      {!loading && !showQR && (
        <div className="attendance-card highlight-card">
            <h3><FaBook /> Select Subject</h3>
            <p>Choose a subject to generate today's live QR Code.</p>
            
            <select 
                className="subject-dropdown"
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
            >
                <option value="">-- Select Subject --</option>
                {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                        {sub.name} {sub.year ? `(${sub.year})` : ""}
                    </option>
                ))}
            </select>

            <button 
                className="qr-btn" 
                onClick={handleGenerateQR}
                disabled={!selectedSubject}
            >
                <FaQrcode style={{marginRight: "8px"}}/> 
                Generate Live QR
            </button>
        </div>
      )}

      {showQR && (
        <div className="attendance-card qr-display-card">
            <div className="qr-header">
                <h3>Scan to Mark Attendance</h3>
                <button className="close-btn-icon" onClick={closeQR}><FaTimes /></button>
            </div>
            
            <div className="qr-box">
                <QRCode 
                    value={qrCodeValue} 
                    size={256} 
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                />
            </div>

            <p className="qr-instruction">
                Subject: <strong>{subjects.find(s=>s.id === selectedSubject)?.name}</strong> <br/>
                Date: {new Date().toLocaleDateString()}
            </p>
            
            <p className="warning-text">⚠️ Do not close this screen until everyone scans.</p>
            
            <button className="qr-btn" style={{background: "#e74c3c"}} onClick={closeQR}>
                Stop Attendance
            </button>
        </div>
      )}

    </div>
  );
};

export default AdminAttendance;