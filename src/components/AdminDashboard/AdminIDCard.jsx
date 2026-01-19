import React, { useState, useEffect, useRef } from "react";
import "./AdminIDCard.css";
import { FaSearch, FaPrint, FaCheckSquare, FaSquare, FaUpload, FaTrash } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const AdminIDCard = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]); 
  const [previewStudent, setPreviewStudent] = useState(null);
  const [principalSign, setPrincipalSign] = useState(null);
  
  const frontRef = useRef(null);
  const backRef = useRef(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(list);
      if(list.length > 0) setPreviewStudent(list[0]);
    };
    fetchStudents();
  }, []);

  // 🔥 NEW ADDRESS FORMAT LOGIC
  const formatAddress = (addr) => {
      if (!addr) return "Pune, Maharashtra"; // Fallback
      if (typeof addr === "string") return addr;
      if (typeof addr === "object") {
          const { at, post, taluka, district, pincode } = addr;
          // Format: At. post (...), Tq.(...), Dist.(...). Pincode-(...)
          return `At. Post ${at || '-'}, Tq. ${taluka || '-'}, Dist. ${district || '-'}. Pincode-${pincode || '-'}`;
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
      if (selectedIds.length === students.length) setSelectedIds([]);
      else setSelectedIds(students.map(s => s.id));
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateBatchPDF = async () => {
    if (selectedIds.length === 0) { alert("Select students first!"); return; }
    if (!principalSign && !window.confirm("⚠️ No Signature! Print anyway?")) return;

    const pdf = new jsPDF('p', 'mm', 'a4'); 
    const batchStudents = students.filter(s => selectedIds.includes(s.id));
    
    const cardsPerPage = 8; const cardWidth = 86; const cardHeight = 54; 
    const marginX = 15; const marginY = 10; const gap = 5;

    // FRONT
    for (let i = 0; i < batchStudents.length; i++) {
        const indexOnPage = i % cardsPerPage;
        if (i > 0 && indexOnPage === 0) pdf.addPage();
        const col = indexOnPage % 2; const row = Math.floor(indexOnPage / 2);
        const x = marginX + (col * (cardWidth + gap)); const y = marginY + (row * (cardHeight + gap));

        setPreviewStudent(batchStudents[i]); await new Promise(r => setTimeout(r, 50)); 
        const canvas = await html2canvas(frontRef.current, { scale: 3, useCORS: true });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, cardWidth, cardHeight);
    }
    
    // BACK
    pdf.addPage();
    for (let i = 0; i < batchStudents.length; i++) {
        const indexOnPage = i % cardsPerPage;
        if (i > 0 && indexOnPage === 0) pdf.addPage();
        const col = indexOnPage % 2; const row = Math.floor(indexOnPage / 2);
        const x = marginX + (col * (cardWidth + gap)); const y = marginY + (row * (cardHeight + gap));

        setPreviewStudent(batchStudents[i]); await new Promise(r => setTimeout(r, 50));
        const canvas = await html2canvas(backRef.current, { scale: 3 });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, cardWidth, cardHeight);
    }

    pdf.save("EduConnect_IDs.pdf");
  };

  return (
    <div className="id-generator-container">
      <div className="id-sidebar">
        <h3>ID Control Panel 🎛️</h3>
        <div className="sign-upload-box">
            <label>Principal Signature</label>
            <div className="upload-btn-wrapper">
                {principalSign ? (
                    <div className="sign-preview-mini">
                        <img src={principalSign} alt="Sign"/>
                        <FaTrash className="trash-icon" onClick={() => setPrincipalSign(null)}/>
                    </div>
                ) : (
                    <>
                        <input type="file" accept="image/*" onChange={handleSignUpload} />
                        <div className="fake-btn"><FaUpload/> Upload PNG</div>
                    </>
                )}
            </div>
        </div>
        <div className="search-box">
            <FaSearch color="#64748b"/>
            <input placeholder="Search Student..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
        </div>
        <div className="bulk-actions">
            <button className="select-all-btn" onClick={selectAll}>
                {selectedIds.length === students.length ? "Deselect All" : "Select All"}
            </button>
            <span>{selectedIds.length} Selected</span>
        </div>
        <div className="student-list-scroll">
            {filteredStudents.map(student => {
                const isSelected = selectedIds.includes(student.id);
                const isActive = previewStudent?.id === student.id;
                return (
                    <div key={student.id} className={`student-item ${isActive ? "viewing" : ""}`} onClick={() => setPreviewStudent(student)}>
                        <div className="checkbox-area" onClick={(e) => { e.stopPropagation(); toggleSelection(student.id); }}>
                            {isSelected ? <FaCheckSquare color="#d946ef"/> : <FaSquare color="#cbd5e1"/>}
                        </div>
                        <img src={student.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="s" />
                        <div className="list-info">
                            <h4>{student.name}</h4>
                            <small>{student.department}</small>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      <div className="id-preview-area">
          <div className="preview-top-bar">
              <h2>Official Card Preview</h2>
              <button className="print-main-btn" onClick={generateBatchPDF} disabled={selectedIds.length === 0}>
                  <FaPrint/> Print Batch ({selectedIds.length})
              </button>
          </div>

          {previewStudent ? (
             <div className="card-display-stage">
                
                {/* --- FRONT SIDE --- */}
                <div className="std-card front" ref={frontRef}>
                    <div className="std-header">
                        <img src="/logo192.png" className="std-logo" alt="Logo"/>
                        <div className="std-college-info">
                            <h1>EDUCONNECT INSTITUTE</h1>
                            <p>OF TECHNOLOGY & SCIENCE</p>
                        </div>
                    </div>
                    <div className="std-body">
                        <div className="std-left-col">
                            <div className="std-photo-box">
                                <img src={previewStudent.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Student"/>
                            </div>
                            <div className="std-sign-box">
                                {principalSign && <img src={principalSign} alt="Principal Sign" />}
                                <span>Principal</span>
                            </div>
                        </div>
                        <div className="std-right-col">
                            <h3 className="std-name">{previewStudent.name}</h3>
                            <div className="std-course-badge">{previewStudent.department} Engg.</div>
                            
                            <div className="std-details-grid">
                                {/* 🔥 Year added here specifically */}
                                <div className="detail-row"><span>Year:</span> <strong>2026-27</strong></div>
                                <div className="detail-row"><span>DOB:</span> <strong>{previewStudent.dob || "N/A"}</strong></div>
                                <div className="detail-row"><span>Blood Grp:</span> <strong>{previewStudent.bloodGroup || "O+"}</strong></div>
                                <div className="detail-row"><span>Contact:</span> <strong>{previewStudent.phone || previewStudent.mobile || "N/A"}</strong></div>
                                
                                {/* 🔥 Address with new format */}
                                <div className="detail-row full-width">
                                    <span>Address:</span> 
                                    <strong>{formatAddress(previewStudent.address)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Footer removed since Year is now in details, or can keep decorative */}
                    <div className="std-footer">www.educonnect.in</div>
                </div>

                {/* --- BACK SIDE --- */}
                <div className="std-card back" ref={backRef}>
                    <div className="std-back-header"><h4>IMPORTANT INSTRUCTIONS</h4></div>
                    <div className="std-back-body">
                        <div className="std-qr-box">
                             <QRCodeCanvas 
                                value={JSON.stringify({
                                    code: previewStudent.rollNo || previewStudent.studentId,
                                    name: previewStudent.name
                                })} 
                                size={65} 
                            />
                            {/* 🔥 Student Code displayed clearly */}
                            <p className="std-code">Student Code: <br/>{previewStudent.rollNo || previewStudent.studentId || "N/A"}</p>
                        </div>
                        <ul className="std-rules">
                            <li>This card is the property of EduConnect.</li>
                            <li>Always wear this card inside the campus.</li>
                            <li>Transfer of this card is strictly prohibited.</li>
                            <li>Report loss of card immediately to admin.</li>
                            <li>If found, please return to College Office.</li>
                        </ul>
                    </div>
                    <div className="std-back-footer">
                        <p>📍 EduConnect Campus, Tech Park, Pune - 411057</p>
                    </div>
                </div>

             </div>
          ) : (
             <div className="empty-state">Select a student</div>
          )}
      </div>
    </div>
  );
};

export default AdminIDCard;