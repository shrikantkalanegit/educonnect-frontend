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

      // 1. DATE CHECK
      if (qrData.date !== today) {
        throw new Error(`Date Mismatch!\nQR: ${qrData.date}, You: ${today}`);
      }

      // 2. TIME CHECK
      const qrTime = qrData.generatedAt;
      const currentTime = Date.now();
      const timeDiff = currentTime - qrTime;

      if (timeDiff > 60000) { 
        throw new Error("⚠️ QR Code Expired!\nPlease scan the LIVE code from screen.");
      }
      if (timeDiff < -5000) {
         throw new Error("⚠️ Check your phone time.\nIt seems incorrect.");
      }

      if (!qrData.subjectId || !qrData.valid) throw new Error("Invalid Class QR");

      // 🔥 FETCH CORRECT STUDENT DETAILS (Roll No / Student Code)
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let readableId = "N/A";
      let studentName = localStorage.getItem("userName") || "Student";

      if (userDocSnap.exists()) {
          const uData = userDocSnap.data();
          // Code ko Priority: Roll No -> StudentId -> UID (last option)
          readableId = uData.rollNo || uData.studentId || "N/A"; 
          studentName = uData.name || studentName;
      }

      // 3. MARK ATTENDANCE
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
        studentUid: user.uid, // Technical ID
        studentCode: readableId, // 🔥 READABLE ID (Roll No)
        studentName: studentName,
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