import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase"; 
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore"; 
import { FaQrcode, FaBook, FaTimes, FaArrowLeft, FaUserCheck } from "react-icons/fa";
import QRCode from "react-qr-code"; 
import "./AdminAttendance.css"; 

const AdminAttendance = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  
  // QR & Attendance States
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [attendees, setAttendees] = useState([]); // 👈 Isme students ki list aayegi

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

  // 2. 🟢 LIVE ATTENDANCE LISTENER (Jaise hi subject select ho)
  useEffect(() => {
    if (!selectedSubject) return;

    const today = new Date().toLocaleDateString();
    
    // Query: Attendance collection mein jao -> Subject ID match karo -> Date match karo
    const q = query(
      collection(db, "attendance_records"),
      where("subjectId", "==", selectedSubject),
      where("date", "==", today)
    );

    // Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by time (Latest first)
      // Note: Hum JS mein sort kar rahe hain taaki Firebase Index error na aaye
      studentList.sort((a, b) => b.timestamp - a.timestamp);
      
      setAttendees(studentList);
    });

    return () => unsubscribe(); // Cleanup
  }, [selectedSubject]);

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
      
      <header className="page-header-bar">
        <button className="back-btn-circle" onClick={() => navigate('/admin-dashboard')}>
            <FaArrowLeft />
        </button>
        <h2>Smart Attendance Panel</h2>
      </header>
      
      {loading && <p style={{textAlign:"center"}}>Loading Subjects...</p>}

      {/* SECTION 1: QR GENERATOR */}
      {!loading && !showQR && (
        <div className="attendance-card highlight-card">
            <h3><FaBook /> Select Subject</h3>
            <p>Choose a subject to see today's attendance & Generate QR.</p>
            
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

      {/* SECTION 2: QR DISPLAY */}
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
        </div>
      )}

      {/* SECTION 3: 📋 LIVE STUDENT LIST */}
      {selectedSubject && (
        <div className="attendees-section">
            <div className="list-header">
                <h3><FaUserCheck /> Live Attendance ({attendees.length})</h3>
                <span className="live-badge">● Live Updates</span>
            </div>

            {attendees.length === 0 ? (
                <p className="no-data">No students have scanned yet.</p>
            ) : (
                <div className="table-responsive">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student Name</th>
                                <th>Status</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendees.map((student, index) => (
                                <tr key={student.id}>
                                    <td>{index + 1}</td>
                                    <td style={{fontWeight: "bold"}}>{student.studentName}</td>
                                    <td>
                                        <span className="status-badge present">Present</span>
                                    </td>
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