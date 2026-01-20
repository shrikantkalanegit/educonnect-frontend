import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase"; 
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore"; 
import { FaQrcode, FaArrowLeft, FaFileExcel, FaListAlt, FaSync, FaGraduationCap, FaBook, FaChevronRight } from "react-icons/fa"; 
import QRCode from "react-qr-code"; 
import * as XLSX from "xlsx"; 
import "./AdminAttendance.css"; 

const AdminAttendance = () => {
  const navigate = useNavigate();
  const currentDept = localStorage.getItem("currentDept");

  const [step, setStep] = useState(0); 
  const [selectedYear, setSelectedYear] = useState(""); 
  const [selectedSubject, setSelectedSubject] = useState(null); 
  const [subjectsList, setSubjectsList] = useState([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [attendees, setAttendees] = useState([]); 

  const years = [
    { id: "1st Year", title: "1st Year", bg: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" },
    { id: "2nd Year", title: "2nd Year", bg: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)" },
    { id: "3rd Year", title: "3rd Year", bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    { id: "4th Year", title: "4th Year", bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  ];

  const fetchSubjects = async (year) => {
    setLoadingSub(true);
    try {
      const q = query(
          collection(db, "subjects"), 
          where("department", "==", currentDept),
          where("year", "==", year)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjectsList(list);
      setStep(1); 
    } catch (error) { console.error(error); } 
    finally { setLoadingSub(false); }
  };

  useEffect(() => {
    if (step !== 2 || !selectedSubject) return;
    const getTodayDate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };
    const q = query(collection(db, "attendance_records"), where("subjectId", "==", selectedSubject.id), where("date", "==", getTodayDate()));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        liveData.sort((a, b) => b.timestamp - a.timestamp);
        setAttendees(liveData);
    });
    return () => unsubscribe();
  }, [step, selectedSubject]);

  const generateDynamicQR = useCallback(() => {
    if (!selectedSubject) return;
    const d = new Date();
    const todayStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    const qrData = JSON.stringify({
        subjectId: selectedSubject.id, subjectName: selectedSubject.name, date: todayStr, generatedAt: Date.now(), department: currentDept, valid: true
    });
    setQrCodeValue(qrData);
  }, [selectedSubject, currentDept]);

  useEffect(() => {
    let interval;
    if (step === 2) { generateDynamicQR(); interval = setInterval(generateDynamicQR, 3000); }
    return () => clearInterval(interval);
  }, [step, generateDynamicQR]);

  // 🔥 EXPORT REPORT FIX (Correct Headers & Data)
  const handleDownloadReport = async () => {
    try {
        const q = query(collection(db, "attendance_records"), where("subjectId", "==", selectedSubject.id));
        const snap = await getDocs(q);
        
        const data = snap.docs.map(doc => {
            const d = doc.data();
            return {
                "Student Name": d.studentName,
                "Student Code": d.studentCode || "N/A", // 🔥 Correct ID Field
                "Date": d.date,
                "Time": d.timestamp?.seconds ? new Date(d.timestamp.seconds * 1000).toLocaleTimeString() : "N/A"
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `${selectedSubject.name}_Attendance.xlsx`);
    } catch (e) { alert("Error generating report"); }
  };

  // --- RENDER ---
  if (step === 0) {
    return (
        <div className="attend-container">
            <header className="attend-header">
                <div><h1>Select Year</h1><p>Attendance • {currentDept}</p></div>
                <button className="attend-back-btn" onClick={() => navigate('/admin-dashboard')}><FaArrowLeft /> Dashboard</button>
            </header>
            <div className="attend-list-wrapper">
                <div className="attend-glass-list">
                    {years.map((y) => (
                        <div key={y.id} className="attend-list-item" onClick={() => { setSelectedYear(y.id); fetchSubjects(y.id); }}>
                            <div className="list-icon-box" style={{background: y.bg}}><FaGraduationCap /></div>
                            <div className="list-info"><h3>{y.title}</h3><p>Tap to proceed</p></div>
                            <FaChevronRight className="list-arrow"/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  }

  if (step === 1) {
    return (
        <div className="attend-container">
            <header className="attend-header">
                <div><h1>Select Subject</h1><p>{selectedYear} • {currentDept}</p></div>
                <button className="attend-back-btn" onClick={() => setStep(0)}><FaArrowLeft /> Back</button>
            </header>
            <div className="attend-list-wrapper">
                {loadingSub ? <div className="loading-txt">Fetching Subjects...</div> : (
                    <div className="attend-glass-list">
                        {subjectsList.length > 0 ? subjectsList.map((sub, index) => (
                            <div key={sub.id} className="attend-list-item" onClick={() => { setSelectedSubject(sub); setStep(2); }}>
                                <div className="list-icon-box" style={{background: index % 2 === 0 ? '#4facfe' : '#f093fb'}}>
                                    <FaBook />
                                </div>
                                <div className="list-info"><h3>{sub.name}</h3><p>Start Session</p></div>
                                <FaChevronRight className="list-arrow"/>
                            </div>
                        )) : (
                            <div className="no-data-msg">No subjects found.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
  }

  // STEP 2: DASHBOARD
  return (
    <div className="attend-dashboard-wrapper">
      <header className="dash-header">
        <button className="dash-back-btn" onClick={() => setStep(1)}><FaArrowLeft /></button>
        <div>
            <h2>{selectedSubject?.name}</h2>
            <div className="live-status"><FaSync className="spin-icon"/> Live</div>
        </div>
        <button className="report-btn" onClick={handleDownloadReport}><FaFileExcel /> Export</button>
      </header>

      <div className="dash-content">
        <div className="qr-section">
            <div className="qr-card">
                <h3>Scan to Mark</h3>
                <div className="qr-box">
                    <QRCode value={qrCodeValue} size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                </div>
                <div className="qr-hint">Auto-refreshes every 3s</div>
            </div>
        </div>

        <div className="list-section">
            <div className="list-header-simple">
                <h3><FaListAlt /> Present Students</h3>
                <span className="count-badge">{attendees.length}</span>
            </div>
            <div className="attendees-list">
                {attendees.length > 0 ? attendees.map((st, i) => (
                    <div key={st.id} className="attendee-row">
                        <span className="row-idx">{i+1}</span>
                        <div className="row-info">
                            <h4>{st.studentName}</h4>
                            {/* 🔥 Display Correct Code Here */}
                            <p style={{fontSize:'0.8rem', color:'#64748b'}}>
                                {st.studentCode || st.studentId || "ID N/A"}
                            </p>
                        </div>
                        <span className="row-time">
                            {st.timestamp?.seconds ? new Date(st.timestamp.seconds*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "Just now"}
                        </span>
                    </div>
                )) : (
                    <div className="empty-state" style={{padding:'40px', textAlign:'center', color:'#64748b'}}>
                        Waiting for scans... 📷
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;