import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./GroupChatPage.css";
import { 
  FaArrowLeft, FaPaperPlane, FaPaperclip, FaTrash, 
  FaSmile, FaFilePdf, FaFileAlt, FaVideo, FaDownload, FaTimes, FaEllipsisV, FaPen
} from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import { db, auth } from "../../firebase"; 
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, where, updateDoc 
} from "firebase/firestore";

const GroupChatPage = ({ isAdmin = false }) => {
  const { subjectName } = useParams();
  const navigate = useNavigate();
  
  // 🔥 FIX: Scroll Ref ke liye
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null); // Container Ref

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // File Upload States
  const [selectedFile, setSelectedFile] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(null);     
  const [uploading, setUploading] = useState(false);      

  // Menu States
  const [menuVisible, setMenuVisible] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const longPressTimer = useRef(null);

  const storedName = localStorage.getItem("userName");
  const user = auth.currentUser;
  const currentUser = isAdmin ? "Admin (Teacher)" : (storedName || "Student");
  const currentUid = user?.uid;
  const userPhoto = user?.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const CLOUD_NAME = "dpfz1gq4y"; 
  const UPLOAD_PRESET = "college_app"; 

  // --- 1. FETCH MESSAGES (Realtime) ---
  useEffect(() => {
    if (!subjectName) return;

    // 🔥 Query Update
    const q = query(
        collection(db, "messages"), 
        where("room", "==", subjectName),
        orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(liveMessages);
    });

    return () => unsubscribe();
  }, [subjectName]);

  // 🔥 FIX: Auto Scroll whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // --- 2. SEND MESSAGE ---
  const handleSend = async () => {
    if (selectedFile) { await uploadAndSendFile(); return; }
    if (input.trim()) {
      if (editingMsg) {
        await updateDoc(doc(db, "messages", editingMsg.id), { text: input });
        setEditingMsg(null);
      } else {
        await sendMessageToDB(input, "text");
      }
      setInput("");
      setShowEmojiPicker(false);
    }
  };

  const sendMessageToDB = async (content, type, fileName = "") => {
    try {
      await addDoc(collection(db, "messages"), { 
        text: content,
        fileName: fileName,
        sender: currentUser,
        uid: currentUid, 
        photo: userPhoto,
        role: isAdmin ? "admin" : "student",
        type: type,
        room: subjectName, 
        createdAt: serverTimestamp(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      // Scroll immediately after send trigger
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 100);
    } catch (err) { console.error(err); }
  };

  // --- 3. ACTIONS ---
  const handleDelete = async (msgId) => {
    if (window.confirm("Delete this message?")) {
      await deleteDoc(doc(db, "messages", msgId)); 
      setMenuVisible(null);
    }
  };

  const handleEditInit = (msg) => {
    setEditingMsg(msg);
    setInput(msg.text);
    setMenuVisible(null);
    fileInputRef.current.focus();
  };

  // --- 4. RENDER CONTENT ---
  const renderMessageContent = (msg) => {
    if (msg.type === "image") return <img src={msg.text} alt="sent" className="chat-image" />;
    if (msg.type === "file") return (
        <a href={msg.text} target="_blank" rel="noopener noreferrer" className="chat-file-link">
          <div className="file-icon"><FaFileAlt /></div>
          <div className="file-info"><span>{msg.fileName}</span><small>Download <FaDownload/></small></div>
        </a>
    );
    return <span>{msg.text}</span>;
  };

  // --- 5. LONG PRESS (Mobile) ---
  const handleTouchStart = (msgId) => {
    longPressTimer.current = setTimeout(() => setMenuVisible(msgId), 800);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // --- FILE UPLOAD LOGIC (Optimized) ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        setSelectedFile(file);
        if (file.type.startsWith("image/")) setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadAndSendFile = async () => {
      if (!selectedFile) return;
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", UPLOAD_PRESET); 
      formData.append("cloud_name", CLOUD_NAME);
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.secure_url) {
            let type = selectedFile.type.startsWith("image/") ? "image" : "file";
            await sendMessageToDB(data.secure_url, type, selectedFile.name);
            setSelectedFile(null); setPreviewUrl(null);
        }
      } catch (e) { alert("Upload Failed"); }
      setUploading(false);
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <button className="back-btn" onClick={() => navigate(-1)}><FaArrowLeft /></button>
        <div className="group-info">
          <div className="group-icon">{subjectName.charAt(0).toUpperCase()}</div>
          <div className="group-details"><h3>{subjectName}</h3><p>● Live</p></div>
        </div>
      </header>

      <div className="chat-body" ref={chatContainerRef} onClick={() => setMenuVisible(null)}>
        {messages.map((msg) => {
          const isMe = msg.uid === currentUid;
          const showMenu = menuVisible === msg.id;
          const canDelete = isAdmin || isMe;
          const canEdit = isMe && msg.type === "text";

          return (
            <div 
                key={msg.id} 
                className={`message-row ${isMe ? "my-message" : "other-message"}`}
                onTouchStart={() => handleTouchStart(msg.id)} 
                onTouchEnd={handleTouchEnd}
            >
              {/* 🔥 Profile Pic Logic (Positioned via CSS) */}
              {!isMe && (
                  <div className="avatar-wrapper">
                    <img src={msg.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} className="chat-avatar" alt="u" />
                  </div>
              )}

              <div className="bubble-wrapper">
                {/* Name inside Bubble logic handled in CSS/Structure */}
                <div className="message-bubble">
                    {!isMe && <div className="sender-name">{msg.sender}</div>}
                    {renderMessageContent(msg)}
                    <span className="msg-time">{msg.time}</span>
                </div>

                {/* 3 Dots Menu */}
                {canDelete && (
                    <div className="msg-options">
                        <FaEllipsisV className="dots-icon" onClick={(e) => { e.stopPropagation(); setMenuVisible(msg.id); }} />
                        {showMenu && (
                            <div className="pop-up-menu">
                                {canEdit && <div onClick={() => handleEditInit(msg)}><FaPen/> Edit</div>}
                                <div onClick={() => handleDelete(msg.id)} className="delete-opt"><FaTrash/> Delete</div>
                            </div>
                        )}
                    </div>
                )}
              </div>
            </div>
          );
        })}
        {/* 🔥 Dummy Div for Scroll */}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><FaSmile /></button>
        <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={handleFileSelect} />
        <button className="icon-btn" onClick={() => fileInputRef.current.click()}><FaPaperclip /></button>
        
        {editingMsg && <span className="editing-badge">Editing... <FaTimes onClick={()=>{setEditingMsg(null); setInput("")}}/></span>}

        <input 
            value={input} onChange={e => setInput(e.target.value)} 
            placeholder={selectedFile ? "File selected..." : "Type a message..."} 
            onKeyPress={e => e.key === 'Enter' && handleSend()}
        />
        <button className="send-btn" onClick={handleSend}><FaPaperPlane /></button>
      </div>
      
      {selectedFile && (
         <div className="file-preview-box">
            <span>{selectedFile.name}</span>
            <button onClick={()=>setSelectedFile(null)}>Cancel</button>
         </div>
      )}
      {showEmojiPicker && <div className="emoji-picker-container"><EmojiPicker onEmojiClick={(e)=>setInput(prev=>prev+e.emoji)}/></div>}
    </div>
  );
};

export default GroupChatPage;