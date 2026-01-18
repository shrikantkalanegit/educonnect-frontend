import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, FaPaperPlane, FaPaperclip, FaImage, FaFileAlt, 
  FaBullhorn, FaTimes, FaCheckDouble, FaUserTie, FaEllipsisV, FaTrash, FaPen, FaCheck 
} from "react-icons/fa";
import "./StaffRoom.css";

// Firebase Imports
import { auth, db } from "../../firebase"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const StaffRoom = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  
  // Edit & Menu States
  const [activeMenu, setActiveMenu] = useState(null); // Kis message ka menu khula hai
  const [editingId, setEditingId] = useState(null);   // Kaunsa message edit ho raha hai
  
  const [myData, setMyData] = useState({ name: "Admin", photo: "" });

  // 1. Fetch Current User
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "admins", user.uid));
        if (snap.exists()) {
          setMyData({
            name: snap.data().name,
            photo: snap.data().photo || snap.data().profilePic || ""
          });
        }
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Realtime Messages
  useEffect(() => {
    const q = query(collection(db, "staff_messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(liveMessages);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close menu on outside click
  useEffect(() => {
    const closeMenu = () => setActiveMenu(null);
    if(activeMenu) document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [activeMenu]);

  // 3. Send / Update Message
  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      if (editingId) {
        // --- UPDATE MODE ---
        await updateDoc(doc(db, "staff_messages", editingId), { text: input });
        setEditingId(null);
        alert("Message Updated!");
      } else {
        // --- SEND MODE ---
        await addDoc(collection(db, "staff_messages"), {
            text: input,
            sender: myData.name,
            senderPic: myData.photo,
            type: isUrgent ? "urgent" : "text", 
            createdAt: serverTimestamp(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
      
      setInput("");
      setIsUrgent(false);
      setShowAttachMenu(false);
    } catch (error) { console.error("Error:", error); }
  };

  // 4. Delete Message
  const handleDelete = async (id) => {
      if(window.confirm("Delete this message?")) {
          await deleteDoc(doc(db, "staff_messages", id));
      }
  };

  // 5. Start Editing
  const startEdit = (msg, e) => {
      e.stopPropagation();
      setInput(msg.text);
      setEditingId(msg.id);
      setActiveMenu(null);
  };

  const handleFileUpload = (type) => {
    alert(`${type} upload coming soon!`);
    setShowAttachMenu(false);
  };

  return (
    <div className="staff-container">
      
      {/* HEADER */}
      <header className="staff-header">
        <button className="back-btn-glass" onClick={() => navigate('/admin-dashboard')}>
          <FaArrowLeft />
        </button>
        <div className="header-info">
          <h2>Staff Room</h2>
          <p>Official Discussion Channel</p>
        </div>
        <div className="online-indicator">
            <span className="dot"></span> Live
        </div>
      </header>

      {/* CHAT AREA */}
      <div className="chat-area">
        <div className="chat-start-notice">
            <span>🔒 Professional Workspace</span>
        </div>

        {messages.map((msg) => {
          const isMe = msg.sender === myData.name;
          return (
            <div key={msg.id} className={`message-row ${isMe ? "row-me" : "row-other"}`}>
              
              {!isMe && (
                <div className="chat-avatar">
                    {msg.senderPic ? <img src={msg.senderPic} alt="U" /> : <FaUserTie/>}
                </div>
              )}

              <div className={`message-bubble ${msg.type === 'urgent' ? 'urgent-bubble' : ''}`}>
                {!isMe && <span className="sender-label">{msg.sender}</span>}
                
                {msg.type === 'urgent' && <div className="urgent-badge"><FaBullhorn/> URGENT</div>}
                
                <p>{msg.text}</p>
                
                <div className="msg-bottom">
                    <span className="msg-time">{msg.time}</span>
                    {isMe && <FaCheckDouble className="read-receipt"/>}
                </div>

                {/* --- 3 DOTS MENU (Only for Me) --- */}
                {isMe && (
                    <div className="msg-options">
                        <button 
                            className="dots-btn" 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === msg.id ? null : msg.id);
                            }}
                        >
                            <FaEllipsisV />
                        </button>

                        {activeMenu === msg.id && (
                            <div className="dots-menu">
                                <div onClick={(e) => startEdit(msg, e)}><FaPen/> Edit</div>
                                <div onClick={() => handleDelete(msg.id)} className="delete-opt"><FaTrash/> Delete</div>
                            </div>
                        )}
                    </div>
                )}

              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER */}
      <div className="chat-footer">
        
        {/* Cancel Edit Button */}
        {editingId && (
            <div className="editing-bar">
                <span>Editing Message...</span>
                <FaTimes onClick={() => { setEditingId(null); setInput(""); }} />
            </div>
        )}

        {showAttachMenu && (
            <div className="attach-menu">
                <div className="attach-item" onClick={() => setIsUrgent(!isUrgent)}>
                    <div className={`icon-box ${isUrgent ? 'red-bg' : 'orange-bg'}`}><FaBullhorn/></div>
                    <span>{isUrgent ? "Unmark" : "Urgent"}</span>
                </div>
                <div className="attach-item" onClick={() => handleFileUpload('Document')}>
                    <div className="icon-box blue-bg"><FaFileAlt/></div>
                    <span>File</span>
                </div>
                <div className="attach-item" onClick={() => handleFileUpload('Image')}>
                    <div className="icon-box green-bg"><FaImage/></div>
                    <span>Photo</span>
                </div>
            </div>
        )}

        <div className="input-bar">
            <button 
                className={`attach-btn ${showAttachMenu || isUrgent ? 'active' : ''}`} 
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                disabled={!!editingId} // Disable attach when editing
            >
                {showAttachMenu ? <FaTimes/> : <FaPaperclip/>}
            </button>
            
            <input 
                type="text" 
                placeholder={editingId ? "Edit your message..." : (isUrgent ? "📢 Posting Announcement..." : "Type message...")} 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className={isUrgent ? "urgent-input" : ""}
            />
            
            <button className={`send-btn ${editingId ? 'update-btn' : ''}`} onClick={handleSend}>
                {editingId ? <FaCheck/> : <FaPaperPlane />}
            </button>
        </div>
      </div>

    </div>
  );
};

export default StaffRoom;