import React, { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner"; // 👈 New Modern Library
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

  // 📸 NEW SCAN LOGIC
  const handleScan = async (detectedCodes) => {
    // Library returns an array, we take the first one
    if (!detectedCodes || detectedCodes.length === 0) return;
    
    const rawValue = detectedCodes[0].rawValue;
    
    if (rawValue && scanActive) {
      setScanActive(false); // Stop scanning immediately
      // alert(`🔍 DEBUG: Scanned! \n${rawValue}`); // Testing ke liye
      await markAttendance(rawValue);
    }
  };

  const handleError = (error) => {
    console.error(error);
    setMessage("❌ Camera Error: Check Permissions");
  };

  // 📝 ATTENDANCE LOGIC
  const markAttendance = async (qrDataString) => {
    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      alert("Please Login First!");
      navigate("/");
      return;
    }

    try {
      // 1. Parse JSON
      let qrData;
      try {
        qrData = JSON.parse(qrDataString);
      } catch (e) {
        alert("❌ Invalid QR Code (Not JSON)");
        setScanActive(true); // Retry
        setLoading(false);
        return;
      }

      // 2. Data Validation
      const today = new Date().toLocaleDateString();
      if (!qrData.subjectId || !qrData.date) {
        alert("❌ Wrong QR Code");
        setScanActive(true);
        setLoading(false);
        return;
      }

      if (qrData.date !== today) {
        alert("❌ QR Code Expired (Old Date)");
        setScanActive(true);
        setLoading(false);
        return;
      }

      // 3. Check Duplicate
      const attendanceId = `${qrData.subjectId}_${today.replace(/\//g, "-")}_${user.uid}`;
      const attendanceRef = doc(db, "attendance_records", attendanceId);
      const docSnap = await getDoc(attendanceRef);

      if (docSnap.exists()) {
        setMessage(`⚠️ Already Present: ${qrData.subjectName}`);
        alert(`⚠️ You have already marked attendance for ${qrData.subjectName}`);
        setLoading(false);
        return;
      }

      // 4. Save to Firebase
      await setDoc(attendanceRef, {
        studentId: user.uid,
        studentName: user.displayName || "Student",
        subjectId: qrData.subjectId,
        subjectName: qrData.subjectName,
        date: today,
        timestamp: serverTimestamp(),
        status: "Present"
      });

      setMessage(`✅ Success! Marked for ${qrData.subjectName}`);
      alert(`✅ ATTENDANCE MARKED!\nSubject: ${qrData.subjectName}`);

    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
      setScanActive(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-container">
      <header className="scanner-header">
        <button onClick={() => navigate(-1)} className="back-btn"><FaArrowLeft /></button>
        <h3>Scan Attendance</h3>
      </header>

      <div className="camera-box">
        {scanActive ? (
            <div className="scanner-wrapper">
                <Scanner 
                    onScan={handleScan} 
                    onError={handleError}
                    components={{
                        audio: false, // Beep sound off
                        finder: true  // Red box dikhayega
                    }}
                    constraints={{
                        facingMode: 'environment' // Back Camera
                    }}
                />
            </div>
        ) : (
          <div className="scan-stopped">
            <p>✅ Scanning Complete</p>
          </div>
        )}
      </div>

      <div className={`scan-result ${message.includes("Success") || message.includes("✅") ? "success" : "status"}`}>
        <p>{loading ? "Processing..." : message}</p>
        
        {!scanActive && (
           <button className="retry-btn" onClick={() => { setScanActive(true); setMessage("Scanning..."); }}>
             <FaRedo /> Scan Again
           </button>
        )}
      </div>
    </div>
  );
};

export default StudentScanner;