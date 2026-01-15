import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase"; 
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore"; 
import { FaQrcode, FaBook, FaTimes, FaArrowLeft, FaFileExcel, FaListAlt, FaSync, FaFilter } from "react-icons/fa"; 
import QRCode from "react-qr-code"; 
import * as XLSX from "xlsx"; 
import "./AdminAttendance.css"; 

const AdminAttendance = () => {
  const navigate = useNavigate();
  
  // 🔥 Filter States
  const [selectedYear, setSelectedYear] = useState(""); // Pehle Year select karein
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [attendees, setAttendees] = useState([]); 
  
  const currentDept = localStorage.getItem("currentDept");

  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  // 🔥 1. Subjects tabhi fetch karein jab Year select ho
  useEffect(() => {
    const fetchSubjects = async () => {
      if(!currentDept || !selectedYear) {
          setSubjects([]); // Clear list if no year
          return;
      }
      
      setLoading(true);
      try {
        // Query: Dept match karo AND Year match karo
        const q = query(
            collection(db, "subjects"), 
            where("department", "==", currentDept),
            where("year", "==", selectedYear)
        );
        
        const querySnapshot = await getDocs(q);
        const subList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubjects(subList);
      } catch (error) { console.error("Error fetching subjects:", error); } 
      finally { setLoading(false); }
    };
    fetchSubjects();
  }, [currentDept, selectedYear]);

  // 🔥 2. Attendees Real-time Listener
  useEffect(() => {
    if (!selectedSubject) {
        setAttendees([]);
        return;
    }

    const todayStr = getTodayDate();
    // Listening to attendance_records collection
    const q = query(
        collection(db, "attendance_records"),
        where("subjectId", "==", selectedSubject),
        where("date", "==", todayStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by time (latest top)
        liveData.sort((a, b) => b.timestamp - a.timestamp);
        setAttendees(liveData);
    });

    return () => unsubscribe();
  }, [selectedSubject]);

  // QR Logic
  const generateDynamicQR = useCallback(() => {
    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) return;

    const qrData = JSON.stringify({
        subjectId: subject.id,
        subjectName: subject.name,
        date: getTodayDate(),
        generatedAt: Date.now(),
        department: currentDept,
        valid: true
    });
    setQrCodeValue(qrData);
  }, [selectedSubject, subjects, currentDept]);

  useEffect(() => {
    let interval;
    if (showQR && selectedSubject) {
        generateDynamicQR(); 
        interval = setInterval(() => { generateDynamicQR(); }, 3000); 
    }
    return () => clearInterval(interval);
  }, [showQR, selectedSubject, generateDynamicQR]);

  const handleDownloadReport = async () => {
    if (!selectedSubject) return;
    const subjectObj = subjects.find(s => s.id === selectedSubject);
    try {
        const q = query(collection(db, "attendance_records"), where("subjectId", "==", selectedSubject));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
            "Name": doc.data().studentName,
            "ID": doc.data().studentId || "N/A",
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
        <h2>Attendance Panel <span style={{fontSize:'0.8rem', background:'#e2e8f0', padding:'2px 8px', borderRadius:'5px'}}>{currentDept}</span></h2>
      </header>
      
      {!showQR && (
        <div className="attendance-card highlight-card">
            <h3><FaFilter /> Filter Classes</h3>
            
            {/* 1. YEAR SELECTOR */}
            <label style={{display:'block', marginBottom:'5px', color:'#666', fontSize:'0.9rem'}}>Select Year First:</label>
            <select 
                className="subject-dropdown" 
                value={selectedYear} 
                onChange={(e) => { setSelectedYear(e.target.value); setSelectedSubject(""); }}
                style={{marginBottom:'15px'}}
            >
                <option value="">-- Select Year --</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
            </select>

            {/* 2. SUBJECT SELECTOR (Only if Year selected) */}
            {selectedYear && (
                <>
                    <label style={{display:'block', marginBottom:'5px', color:'#666', fontSize:'0.9rem'}}>Select Subject:</label>
                    {loading ? <p>Loading subjects...</p> : (
                        <select className="subject-dropdown" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                            <option value="">-- Select Subject --</option>
                            {subjects.length > 0 ? (
                                subjects.map((sub) => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))
                            ) : (
                                <option disabled>No subjects found for {selectedYear}</option>
                            )}
                        </select>
                    )}
                </>
            )}

            {/* ACTION BUTTONS */}
            <div style={{display: 'flex', gap: '10px'}}>
                <button className="qr-btn" onClick={() => setShowQR(true)} disabled={!selectedSubject}>
                    <FaQrcode style={{marginRight: "8px"}}/> Live QR Mode
                </button>
                <button className="qr-btn" style={{background: "#27ae60"}} onClick={handleDownloadReport} disabled={!selectedSubject}>
                    <FaFileExcel style={{marginRight: "8px"}}/> Report
                </button>
            </div>
        </div>
      )}

      {/* QR DISPLAY */}
      {showQR && (
        <div className="attendance-card qr-display-card">
             <div className="qr-header">
                <h3>{subjects.find(s=>s.id === selectedSubject)?.name} ({selectedYear})</h3>
                <button className="close-btn-icon" onClick={() => setShowQR(false)}><FaTimes /></button>
            </div>
            <div className="qr-box">
                <QRCode value={qrCodeValue} size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
            </div>
            <div style={{marginTop: '15px', color: '#e67e22', fontWeight: 'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                 <FaSync className="spin-icon"/> Auto-refreshing for security...
            </div>
        </div>
      )}

      {/* LIVE LIST */}
      {selectedSubject && (
        <div className="attendees-section">
            <div className="list-header">
                <h3><FaListAlt /> Live List ({getTodayDate()})</h3>
                <span className="live-badge">🔴 {attendees.length} Present</span>
            </div>
             <div className="table-responsive">
                <table className="attendance-table">
                    <thead><tr><th>#</th><th>Name</th><th>Student ID</th><th>Time</th></tr></thead>
                    <tbody>
                        {attendees.map((st, i) => (
                            <tr key={st.id}>
                                <td>{i+1}</td>
                                <td><b>{st.studentName}</b></td>
                                <td>{st.studentId || "-"}</td>
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