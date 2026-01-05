import React, { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { FaArrowLeft, FaRedo } from "react-icons/fa";
import "./StudentScanner.css"; 

const StudentScanner = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Scan the QR Code shown by Teacher");
  const [loading, setLoading] = useState(false);
  const [scanActive, setScanActive] = useState(true);

  // --- HELPER: DATE FORMAT (DD/MM/YYYY) ---
  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const handleScan = async (detectedCodes) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    const rawValue = detectedCodes[0].rawValue;
    if (rawValue && scanActive) {
      setScanActive(false);
      await markAttendance(rawValue);
    }
  };

  const markAttendance = async (qrDataString) => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) { alert("Login First!"); navigate("/"); return; }

    try {
      let qrData;
      try { qrData = JSON.parse(qrDataString); } 
      catch (e) { throw new Error("Invalid QR Code"); }

      const today = getTodayDate(); 

      // 🔍 DEBUGGING CHECK
      if (qrData.date !== today) {
        throw new Error(`Date Mismatch!\nQR Date: ${qrData.date}\nYour Date: ${today}\n\n(Check your phone date settings)`);
      }

      if (!qrData.subjectId || !qrData.valid) throw new Error("Invalid Class QR");

      // ID Construction
      const safeDate = today.replace(/\//g, "-");
      const attendanceId = `${qrData.subjectId}_${safeDate}_${user.uid}`;
      const attendanceRef = doc(db, "attendance_records", attendanceId);
      
      const docSnap = await getDoc(attendanceRef);
      if (docSnap.exists()) {
        setMessage(`⚠️ Already Present: ${qrData.subjectName}`);
        setLoading(false);
        return;
      }

      await setDoc(attendanceRef, {
        studentId: user.uid,
        studentName: localStorage.getItem("userName") || "Student",
        subjectId: qrData.subjectId,
        subjectName: qrData.subjectName,
        date: today,
        timestamp: serverTimestamp(),
        status: "Present"
      });

      setMessage(`✅ Attendance Marked!\n${qrData.subjectName}`);
      setTimeout(() => navigate('/home'), 2000);

    } catch (error) {
      console.error(error);
      setMessage("❌ " + error.message);
      // Agar error aaye to user ko 'Retry' button dikhega
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-container">
      <header className="scanner-header">
        <button onClick={() => navigate('/home')} className="back-btn"><FaArrowLeft /></button>
        <h3>Scan Attendance</h3>
      </header>

      <div className="camera-box">
        {scanActive ? (
            <div className="scanner-wrapper">
                <Scanner 
                    onScan={handleScan} 
                    components={{ audio: false, finder: true }}
                    constraints={{ facingMode: 'environment' }}
                />
            </div>
        ) : (
          <div className="scan-stopped"><p style={{fontSize: '2rem'}}>📸</p><p>Processing...</p></div>
        )}
      </div>

      <div className={`scan-result ${message.includes("✅") ? "success" : "status"}`}>
        <p style={{whiteSpace: "pre-line"}}>{loading ? "Verifying..." : message}</p>
        {!scanActive && !message.includes("✅") && (
           <button className="retry-btn" onClick={() => { setScanActive(true); setMessage("Scanning..."); }}>
             <FaRedo /> Scan Again
           </button>
        )}
      </div>
    </div>
  );
};

export default StudentScanner;