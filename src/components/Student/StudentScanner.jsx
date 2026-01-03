import React, { useState } from "react";
import QrScanner from "react-qr-scanner"; 
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { FaArrowLeft, FaCamera, FaRedo } from "react-icons/fa";
import "./StudentScanner.css"; 

const StudentScanner = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Scan the QR Code shown by Teacher");
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  // 📸 DEBUG SCAN HANDLE
  const handleScan = async (data) => {
    // 1. Agar data null hai (camera hawa mein hai), to ignore karo
    if (!data) return;

    // 2. Agar hum pehle hi process kar rahe hain, to ruk jao
    if (!isScanning) return;

    // 🛑 STOP SCANNING IMMEDIATELY
    setIsScanning(false);

    // 🔍 DEBUG ALERT: Mobile screen par dikhao ki kya scan hua
    // (Isse hume pata chalega ki code sahi scan ho raha hai ya nahi)
    const rawText = data?.text || data; // Library kabhi object deti hai kabhi text
    // alert(`🔍 DEBUG: Scanned! \nData: ${rawText}`); 

    if (rawText) {
      await markAttendance(rawText);
    } else {
        alert("❌ Error: Empty Data Scanned");
        setIsScanning(true); // Retry
    }
  };

  const handleError = (err) => {
    console.error("Camera Error:", err);
    alert(`📷 Camera Error: ${err.message || err}`);
    setMessage("❌ Camera Error: Please allow permissions.");
  };

  // 📝 ATTENDANCE LOGIC
  const markAttendance = async (qrDataString) => {
    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      alert("⚠️ Error: User not logged in!");
      navigate("/");
      return;
    }

    try {
      // 1. Parsing Try Karo
      let qrData;
      try {
        qrData = JSON.parse(qrDataString);
      } catch (e) {
        alert(`❌ JSON Error: QR Code sahi format mein nahi hai.\nScanned: ${qrDataString}`);
        setLoading(false);
        setIsScanning(true); // Wapas scanning chalu karo
        return;
      }

      // 2. Data Check
      if (!qrData.subjectId || !qrData.date) {
        alert("❌ Invalid QR: Isme Subject ID nahi hai.");
        setLoading(false);
        setIsScanning(true);
        return;
      }

      // 3. Date Check
      const today = new Date().toLocaleDateString();
      if (qrData.date !== today) {
        alert(`❌ Expired QR!\nQR Date: ${qrData.date}\nToday: ${today}`);
        setLoading(false);
        setIsScanning(true);
        return;
      }

      // 4. Duplicate Check
      const attendanceId = `${qrData.subjectId}_${today.replace(/\//g, "-")}_${user.uid}`;
      const attendanceRef = doc(db, "attendance_records", attendanceId);

      const docSnap = await getDoc(attendanceRef);
      if (docSnap.exists()) {
        alert(`⚠️ Already Present!\nAapne ${qrData.subjectName} ki attendance pehle hi laga di hai.`);
        setMessage(`⚠️ Already Marked: ${qrData.subjectName}`);
        setLoading(false);
        return; 
      }

      // 5. Firebase Save
      await setDoc(attendanceRef, {
        studentId: user.uid,
        studentName: user.displayName || "Student",
        subjectId: qrData.subjectId,
        subjectName: qrData.subjectName,
        date: today,
        timestamp: serverTimestamp(),
        status: "Present"
      });

      alert(`✅ SUCCESS!\nAttendance Marked for ${qrData.subjectName}`);
      setMessage(`✅ Attendance Marked: ${qrData.subjectName}`);

    } catch (error) {
      console.error("Firebase Error:", error);
      alert("❌ Firebase Error: " + error.message);
      setMessage("❌ Error saving attendance.");
      setIsScanning(true);
    } finally {
      setLoading(false);
    }
  };

  // Retry Button Logic
  const handleRetry = () => {
    setMessage("Scan the QR Code shown by Teacher");
    setIsScanning(true);
  };

  return (
    <div className="scanner-container">
      <header className="scanner-header">
        <button onClick={() => navigate(-1)} className="back-btn"><FaArrowLeft /></button>
        <h3>Scan Attendance</h3>
      </header>

      <div className="camera-box">
        {isScanning ? (
          <QrScanner
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            // Constraints hata diye hain taaki default camera le (safe mode)
          />
        ) : (
          <div className="scan-stopped">
            <FaCamera size={50} color="#ccc" />
            <p>Processing / Paused</p>
          </div>
        )}
        <div className="scan-overlay"></div>
      </div>

      <div className={`scan-result ${message.includes("✅") ? "success" : message.includes("❌") ? "error" : "status"}`}>
        <p style={{fontWeight: "bold", fontSize: "1.1rem"}}>
            {loading ? "Processing..." : message}
        </p>
        
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