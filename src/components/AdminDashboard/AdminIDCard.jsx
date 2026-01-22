import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import "./AdminIDCard.css";
import { FaSearch, FaPrint, FaCheckSquare, FaSquare, FaUpload, FaTrash, FaArrowLeft, FaIdCard } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { db, auth } from "../../firebase"; 
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

const AdminIDCard = () => {
  const navigate = useNavigate();
  // 🔥 GET DEPARTMENT FROM LOCAL STORAGE
  const currentDept = localStorage.getItem("currentDept");

  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]); 
  const [previewStudent, setPreviewStudent] = useState(null);
  const [principalSign, setPrincipalSign] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Year Filter Logic
  const [selectedYear, setSelectedYear] = useState("All");

  const frontRef = useRef(null);
  const backRef = useRef(null);

  // 1. DATA FETCH
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const user = auth.currentUser;
      if (!user) { navigate("/"); return; }

      if (!currentDept) {
          alert("⚠️ Please select a Department first!");
          navigate("/admin-dashboard");
          return;
      }

      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (!adminDoc.exists()) { navigate("/home"); return; }
        setIsAdmin(true);

        // 🔥 FILTER BY DEPARTMENT HERE
        const q = query(
            collection(db, "users"), 
            where("role", "==", "student"),
            where("department", "==", currentDept) // 👈 SIRF MERE DEPARTMENT KE STUDENTS
        );
        
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(list);
        if(list.length > 0) setPreviewStudent(list[0]);

      } catch (error) { console.error("Error:", error); }
    };
    checkAuthAndFetch();
  }, [navigate, currentDept]);

  const formatAddress = (addr) => {
      if (!addr) return "Pune, Maharashtra";
      if (typeof addr === "string") return addr;
      if (typeof addr === "object") {
          const { at, post, taluka, district, pincode } = addr;
          return `At. ${at}, ${taluka}, ${district} - ${pincode}`;
      }
      return "N/A";
  };

  const handleSignUpload = (e) => {
      const file = e.target.files[0];
      if(file) setPrincipalSign(URL.createObjectURL(file)); 
  };

  const toggleSelection = (id) => {
      if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
      else setSelectedIds([...selectedIds, id]);
  };

  const selectAll = () => {
      if (selectedIds.length === filteredStudents.length) setSelectedIds([]);
      else setSelectedIds(filteredStudents.map(s => s.id));
  };

  // Filter Logic (Search + Year)
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.rollNo && s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesYear = selectedYear === "All" || s.year === selectedYear;
    return matchesSearch && matchesYear;
  });

  // Print Logic
  const generateBatchPDF = async () => {
    if (selectedIds.length === 0) { alert("Select students first!"); return; }
    if (!principalSign && !window.confirm("⚠️ No Signature! Print anyway?")) return;

    const pdf = new jsPDF('p', 'mm', 'a4'); 
    
    const cardWidth = 86; const cardHeight = 54; 
    const marginX = 15; const marginY = 10; const gap = 5;
    const cardsPerPage = 8; 

    const batchStudents = students.filter(s => selectedIds.includes(s.id));

    for (let i = 0; i < batchStudents.length; i++) {
        const indexOnPage = i % cardsPerPage;
        if (i > 0 && indexOnPage === 0) pdf.addPage();
        
        const col = indexOnPage % 2; 
        const row = Math.floor(indexOnPage / 2);
        const x = marginX + (col * (cardWidth + gap)); 
        const y = marginY + (row * (cardHeight + gap));

        setPreviewStudent(batchStudents[i]); await new Promise(r => setTimeout(r, 50)); 
        const canvas = await html2canvas(frontRef.current, { scale: 3, useCORS: true });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, cardWidth, cardHeight);
    }
    
    pdf.save(`ID_Cards_${currentDept}_Batch.pdf`);
  };

  if (!isAdmin) return null; 

  const getStudentCode = (std) => {
      if(!std) return "N/A";
      return std.rollNo || std.studentId || std.id?.substring(0, 6).toUpperCase();
  };

  return (
    <div className="id-generator-wrapper">
      
      {/* SIDEBAR */}
      <div className="id-sidebar-panel">
        <div className="sidebar-header">
            <button onClick={() => navigate('/admin-dashboard')} className="back-icon-btn"><FaArrowLeft/></button>
            <div>
                <h3>ID Panel</h3>
                <small style={{color:'#64748b', fontSize:'0.8rem'}}>{currentDept}</small>
            </div>
        </div>

        <div className="upload-section">
            <div className="upload-box-dashed" onClick={() => document.getElementById('sign-upload').click()}>
                {principalSign ? (
                    <div className="preview-sign"><img src={principalSign} alt="Sign"/><FaTrash onClick={(e)=>{e.stopPropagation(); setPrincipalSign(null)}}/></div>
                ) : (
                    <div className="upload-placeholder"><FaUpload/> <span>Upload Sign</span></div>
                )}
                <input id="sign-upload" type="file" hidden accept="image/*" onChange={handleSignUpload} />
            </div>
        </div>

        <div className="filter-section">
            <div className="year-tabs-scroll">
                {["All", "1st Year", "2nd Year", "3rd Year", "4th Year"].map(yr => (
                    <button key={yr} className={`year-pill ${selectedYear === yr ? 'active' : ''}`} onClick={() => setSelectedYear(yr)}>
                        {yr === "All" ? "All" : yr.split(" ")[0]}
                    </button>
                ))}
            </div>
            <div className="search-bar-modern">
                <FaSearch className="search-ico"/>
                <input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
            </div>
        </div>

        <div className="list-header-row">
            <span className="count-badge">{filteredStudents.length} Students</span>
            <button className="select-all-text" onClick={selectAll}>
                {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? "Unselect" : "Select All"}
            </button>
        </div>

        <div className="student-list-container">
            {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                    const isSelected = selectedIds.includes(student.id);
                    const isActive = previewStudent?.id === student.id;
                    return (
                        <div key={student.id} className={`student-row-item ${isActive ? "active-row" : ""}`} onClick={() => setPreviewStudent(student)}>
                            <div className="checkbox-wrapper" onClick={(e) => { e.stopPropagation(); toggleSelection(student.id); }}>
                                {isSelected ? <FaCheckSquare className="chk-checked"/> : <FaSquare className="chk-empty"/>}
                            </div>
                            <img src={student.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="s" />
                            <div className="row-info">
                                <h4>{student.name}</h4>
                                <p>{student.department}</p>
                            </div>
                        </div>
                    );
                })
            ) : <div className="no-data-msg">No Students in {currentDept} ({selectedYear})</div>}
        </div>
      </div>

      {/* PREVIEW STAGE */}
      <div className="id-preview-stage">
          <div className="stage-header">
              <h2>Card Preview</h2>
              <button className="print-btn-primary" onClick={generateBatchPDF} disabled={selectedIds.length === 0}>
                  <FaPrint/> Print ({selectedIds.length})
              </button>
          </div>

          {previewStudent ? (
             <div className="card-canvas-wrapper">
                
                {/* FRONT CARD */}
                <div className="std-card front" ref={frontRef}>
                    <div className="std-header">
                        <img src="/logo192.png" className="std-logo" alt="L"/>
                        <div className="std-college-info">
                            <h1>EDUCONNECT INSTITUTE</h1>
                            <p>OF TECHNOLOGY & SCIENCE</p>
                        </div>
                    </div>
                    <div className="std-body">
                        <div className="std-left-col">
                            <div className="std-photo-box">
                                <img src={previewStudent.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="S"/>
                            </div>
                            <div className="std-sign-box">
                                {principalSign && <img src={principalSign} alt="Sign" />}
                                <span>Principal</span>
                            </div>
                        </div>
                        <div className="std-right-col">
                            <h3 className="std-name">{previewStudent.name}</h3>
                            <div className="std-course-badge">
                                {previewStudent.department} - {previewStudent.year || "N/A"}
                            </div>
                            <div className="std-details-grid">
                                <div className="detail-row"><span>ID:</span> <strong>{getStudentCode(previewStudent)}</strong></div>
                                <div className="detail-row"><span>DOB:</span> <strong>{previewStudent.dob || "N/A"}</strong></div>
                                <div className="detail-row"><span>Blood:</span> <strong>{previewStudent.bloodGroup || "O+"}</strong></div>
                                <div className="detail-row"><span>Phone:</span> <strong>{previewStudent.mobile || "N/A"}</strong></div>
                                <div className="detail-row full-width">
                                    <span>Add:</span> <strong>{formatAddress(previewStudent.address).substring(0, 35)}...</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="std-footer">www.educonnect.in</div>
                </div>

                {/* BACK CARD */}
                <div className="std-card back" ref={backRef}>
                    <div className="std-back-header"><h4>TERMS & CONDITIONS</h4></div>
                    <div className="std-back-body">
                        <div className="std-qr-box" style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'2px'}}>
                             <QRCodeCanvas 
                                value={`ID: ${getStudentCode(previewStudent)}\nName: ${previewStudent.name}`} 
                                size={60} 
                            />
                            <p style={{
                                margin: '3px 0 0 0', 
                                fontSize: '0.55rem', 
                                fontWeight: '700', 
                                color: '#000', 
                                textAlign: 'center',
                                lineHeight: '1.2'
                            }}>
                                S.Code:<br/>{getStudentCode(previewStudent)}
                            </p>
                        </div>
                        
                        <ul className="std-rules">
                            <li>Card is non-transferable.</li>
                            <li>Wear inside campus mandatory.</li>
                            <li>Report loss immediately.</li>
                            <li>If found return to office.</li>
                        </ul>
                    </div>
                    <div className="std-back-footer"><p>📍Edu-Connect MGM college Nande , 431605</p></div>
                </div>

             </div>
          ) : (
             <div className="empty-selection"><FaIdCard className="big-icon"/><h3>Select Student</h3></div>
          )}
      </div>
    </div>
  );
};

export default AdminIDCard;