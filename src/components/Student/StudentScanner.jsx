import React, { useState } from "react";
import QrScanner from "react-qr-scanner"; 
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { FaArrowLeft, FaCamera, FaRedo } from "react-icons/fa";
import "./StudentScanner.css"; 

const StudentScanner = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [message, setMessage] = useState("Scan the QR Code shown by Teacher");
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  // 📸 Handle Scan (FIXED VERSION)
  const handleScan = async (data) => {
    // Agar scanning band hai ya data null hai, to kuch mat karo
    if (!isScanning || !data) return;

    // Library kabhi data.text deti hai, kabhi direct string. Dono handle karein:
    const scannedText = data?.text || data; 

    if (scannedText) {
      console.log("Scanned Data:", scannedText); // Debugging ke liye
      setIsScanning(false); // Camera roko
      setScanResult(scannedText);
      await markAttendance(scannedText);
    }
  };

  const handleError = (err) => {
    console.error("Camera Error:", err);
    setMessage("❌ Camera Error: Check permissions.");
  };

  // 📝 ATTENDANCE LOGIC (SAFE VERSION)
  const markAttendance = async (qrDataString) => {
    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      alert("Please Login First!");
      navigate("/");
      return;
    }

    try {
      // 🛡️ SECURITY CHECK: JSON.parse fail na ho
      let qrData;
      try {
        qrData = JSON.parse(qrDataString);
      } catch (e) {
        console.error("JSON Error:", e);
        setMessage("❌ Invalid QR Code! This is not a class QR.");
        setLoading(false);
        return;
      }

      // Format check: Kya isme subjectId hai?
      if (!qrData.subjectId || !qrData.date) {
        setMessage("❌ Wrong QR Code scanned.");
        setLoading(false);
        return;
      }

      // 2. Date Check
      const today = new Date().toLocaleDateString();
      if (qrData.date !== today) {
        setMessage("❌ Expired QR: This is an old code.");
        setLoading(false);
        return;
      }

      // 3. Duplicate Check
      const attendanceId = `${qrData.subjectId}_${today.replace(/\//g, "-")}_${user.uid}`;
      const attendanceRef = doc(db, "attendance_records", attendanceId);

      const docSnap = await getDoc(attendanceRef);
      if (docSnap.exists()) {
        setMessage(`⚠️ Already Present: ${qrData.subjectName}`);
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

      setMessage(`✅ Attendance Marked: ${qrData.subjectName}`);

    } catch (error) {
      console.error("Firebase Error:", error);
      setMessage("❌ Error saving attendance.");
    } finally {
      setLoading(false);
    }
  };

  // Retry Function
  const handleRetry = () => {
    setScanResult(null);
    setMessage("Scan the QR Code shown by Teacher");
    setIsScanning(true);
  };

  return (
    <div className="scanner-container">
      {/* Header */}
      <header className="scanner-header">
        <button onClick={() => navigate(-1)} className="back-btn"><FaArrowLeft /></button>
        <h3>Scan Attendance</h3>
      </header>

      {/* Camera Area */}
      <div className="camera-box">
        {isScanning ? (
          <QrScanner
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            constraints={{
                video: { facingMode: "environment" } // Back Camera use karne ki koshish karega
            }}
          />
        ) : (
          <div className="scan-stopped">
            <FaCamera size={50} color="#ccc" />
            <p>Scanning Paused</p>
          </div>
        )}
        
        <div className="scan-overlay"></div>
      </div>

      {/* Result Message */}
      <div className={`scan-result ${message.includes("✅") ? "success" : message.includes("❌") ? "error" : "status"}`}>
        <p style={{fontWeight: "bold", fontSize: "1.1rem"}}>
            {loading ? "Processing..." : message}
        </p>
        
        {/* Retry Button */}
        {!isScanning && (
           <button className="retry-btn" onClick={handleRetry}>
             <FaRedo /> Scan Again
           </button>
        )}
      </div>
    </div>
  );
};

export default StudentScanner;