import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase"; 
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore"; 
import { FaQrcode, FaBook, FaTimes, FaArrowLeft, FaFileExcel, FaListAlt, FaSync } from "react-icons/fa"; 
import QRCode from "react-qr-code"; 
import * as XLSX from "xlsx"; 
import "./AdminAttendance.css"; 

const AdminAttendance = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [attendees, setAttendees] = useState([]); 

  // --- HELPER: FIXED DATE (DD/MM/YYYY) ---
  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  // 1. Fetch Subjects
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

  // 2. LIVE ATTENDANCE LIST
  useEffect(() => {
    if (!selectedSubject) {
        setAttendees([]);
        return;
    }
    const today = getTodayDate();
    
    const q = query(
      collection(db, "attendance_records"),
      where("subjectId", "==", selectedSubject),
      where("date", "==", today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort: Latest first
      studentList.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setAttendees(studentList);
    });
    return () => unsubscribe(); 
  }, [selectedSubject]);

  // 3. GENERATE QR (With Random ID to force update)
  const handleGenerateQR = () => {
    if(!selectedSubject) return;
    const subject = subjects.find(s => s.id === selectedSubject);
    
    // 🔥 UNIQUE ID added so QR image changes every time
    const uniqueSessionId = Date.now(); 

    const qrData = JSON.stringify({
        subjectId: subject.id,
        subjectName: subject.name,
        date: getTodayDate(), // Must match Student's date
        sessionId: uniqueSessionId, // Forces QR to look different
        valid: true
    });

    setQrCodeValue(qrData);
    setShowQR(true);
  };

  const closeQR = () => {
    setShowQR(false);
    setQrCodeValue("");
  };

  // 4. DOWNLOAD REPORT
  const handleDownloadReport = async () => {
    if (!selectedSubject) return;
    const subjectObj = subjects.find(s => s.id === selectedSubject);
    try {
        const q = query(collection(db, "attendance_records"), where("subjectId", "==", selectedSubject));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
            "Name": doc.data().studentName,
            "Date": doc.data().date,
            "Time": doc.data().timestamp?.seconds ? new Date(doc.data().timestamp.seconds * 1000).toLocaleTimeString() : "N/A"
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `${subjectObj.name}_Report.xlsx`);
    } catch (e) { alert("Error downloading report"); }
  };

  return (
    <div className="attendance-container">
      <header className="page-header-bar">
        <button className="back-btn-circle" onClick={() => navigate('/admin-dashboard')}><FaArrowLeft /></button>
        <h2>Smart Attendance Panel</h2>
      </header>
      
      {!loading && !showQR && (
        <div className="attendance-card highlight-card">
            <h3><FaBook /> Select Subject</h3>
            <select className="subject-dropdown" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="">-- Select Subject --</option>
                {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name} {sub.year ? `(${sub.year})` : ""}</option>
                ))}
            </select>
            <div style={{display: 'flex', gap: '10px'}}>
                <button className="qr-btn" onClick={handleGenerateQR} disabled={!selectedSubject}>
                    <FaQrcode style={{marginRight: "8px"}}/> Generate QR
                </button>
                <button className="qr-btn" style={{background: "#27ae60"}} onClick={handleDownloadReport} disabled={!selectedSubject}>
                    <FaFileExcel style={{marginRight: "8px"}}/> Report
                </button>
            </div>
        </div>
      )}

      {showQR && (
        <div className="attendance-card qr-display-card">
            <div className="qr-header">
                <h3>Scan for {subjects.find(s=>s.id === selectedSubject)?.name}</h3>
                <button className="close-btn-icon" onClick={closeQR}><FaTimes /></button>
            </div>
            <div className="qr-box">
                <QRCode value={qrCodeValue} size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
            </div>
            <button className="qr-btn" onClick={handleGenerateQR} style={{marginTop:'10px', background:'#f39c12'}}>
                <FaSync /> Refresh QR
            </button>
        </div>
      )}

      {selectedSubject && (
        <div className="attendees-section">
            <div className="list-header">
                <h3><FaListAlt /> Attendance List ({getTodayDate()})</h3>
                <span className="live-badge">🔴 {attendees.length} Present</span>
            </div>
            <div className="table-responsive">
                <table className="attendance-table">
                    <thead><tr><th>#</th><th>Name</th><th>Time</th></tr></thead>
                    <tbody>
                        {attendees.map((st, i) => (
                            <tr key={st.id}>
                                <td>{i+1}</td>
                                <td><b>{st.studentName}</b></td>
                                <td>{st.timestamp?.seconds ? new Date(st.timestamp.seconds*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "Just now"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;