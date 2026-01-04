import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase"; 
import { collection, getDocs, query, where, onSnapshot, orderBy } from "firebase/firestore"; 
import { FaQrcode, FaBook, FaTimes, FaArrowLeft, FaUserCheck, FaFileExcel, FaListAlt } from "react-icons/fa"; 
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
  const [attendees, setAttendees] = useState([]); // Live List Data

  // 1. Fetch Subjects (Admin ne jo subjects banaye hain)
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

  // 2. 🟢 STRICT LIVE ATTENDANCE (Subject Wise)
  useEffect(() => {
    // Agar koi subject select nahi hai, to list khali rakho
    if (!selectedSubject) {
        setAttendees([]);
        return;
    }

    const today = new Date().toLocaleDateString();
    
    // 🔥 CORE LOGIC: Sirf Selected Subject ID aur Aaj ki Date match karo
    const q = query(
      collection(db, "attendance_records"),
      where("subjectId", "==", selectedSubject), // 👈 Yeh sabse zaruri filter hai
      where("date", "==", today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort: Jo abhi aaya wo sabse upar
      studentList.sort((a, b) => b.timestamp - a.timestamp);
      
      setAttendees(studentList);
    });

    return () => unsubscribe(); 
  }, [selectedSubject]);

  // 3. 📥 EXCEL REPORT LOGIC (Per Subject)
  const handleDownloadReport = async () => {
    if (!selectedSubject) return;
    
    // Subject ka naam aur Year dhundo file name ke liye
    const subjectObj = subjects.find(s => s.id === selectedSubject);
    const fileName = `${subjectObj.name}_${subjectObj.year || "Gen"}_Report`;

    try {
        // Is Subject ki AAJ TAK ki saari attendance layein
        const q = query(
            collection(db, "attendance_records"),
            where("subjectId", "==", selectedSubject) // 👈 Sirf is subject ka data
        );
        
        const querySnapshot = await getDocs(q);
        
        // Data ko Excel format mein badlo
        const data = querySnapshot.docs.map(doc => {
            const d = doc.data();
            return {
                "Student Name": d.studentName, // Student ka naam
                "Date": d.date,                // Kis din aaya
                "Subject": d.subjectName,      // Kaunsa subject (verification ke liye)
                "Time": d.timestamp?.seconds ? new Date(d.timestamp.seconds * 1000).toLocaleTimeString() : "N/A",
                "Status": "Present"
            };
        });

        if (data.length === 0) {
            alert(`No records found for ${subjectObj.name}`);
            return;
        }

        // Excel Sheet Generate
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
        
        // Download
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        
    } catch (error) {
        console.error("Error downloading report:", error);
        alert("Error downloading report");
    }
  };

  const handleGenerateQR = () => {
    if(!selectedSubject) return;
    const subject = subjects.find(s => s.id === selectedSubject);
    
    // QR Data Secure
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
            <p>Choose a subject to manage specific attendance.</p>
            
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

            <div style={{display: 'flex', gap: '10px'}}>
                <button 
                    className="qr-btn" 
                    onClick={handleGenerateQR}
                    disabled={!selectedSubject}
                >
                    <FaQrcode style={{marginRight: "8px"}}/> 
                    Generate QR
                </button>

                <button 
                    className="qr-btn"
                    style={{background: "#27ae60"}} 
                    onClick={handleDownloadReport}
                    disabled={!selectedSubject}
                >
                    <FaFileExcel style={{marginRight: "8px"}}/> 
                    Download Report
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
                <QRCode 
                    value={qrCodeValue} 
                    size={256} 
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                />
            </div>
            <p className="qr-instruction">
                Students must check "My Attendance" after scanning.
            </p>
        </div>
      )}

      {/* 👇 LIVE LIST SECTION (STRICTLY PER SUBJECT) */}
      {selectedSubject && (
        <div className="attendees-section">
            <div className="list-header">
                {/* Subject Name Header mein dikhayenge taaki confusion na ho */}
                <h3>
                    <FaListAlt /> 
                    {subjects.find(s=>s.id === selectedSubject)?.name} 
                    <span style={{fontSize: "0.8rem", color: "#777", marginLeft: "5px"}}>
                        (Today's List)
                    </span>
                </h3>
                <span className="live-badge">● {attendees.length} Present</span>
            </div>

            {attendees.length === 0 ? (
                <div className="no-data">
                    <p>Waiting for students to scan...</p>
                    <small>Ensure students are scanning the correct Subject QR.</small>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student Name</th>
                                <th>Date</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendees.map((student, index) => (
                                <tr key={student.id}>
                                    <td>{index + 1}</td>
                                    <td style={{fontWeight: "bold", color: "#2c3e50"}}>
                                        {student.studentName}
                                    </td>
                                    <td>{student.date}</td>
                                    <td>
                                        {student.timestamp?.seconds 
                                            ? new Date(student.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                            : "Just now"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      )}

    </div>
  );
};

export default AdminAttendance;