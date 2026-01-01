import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./GroupChatPage.css";
import { 
  FaArrowLeft, FaPaperPlane, FaPaperclip, FaTrash, 
  FaSmile, FaFilePdf, FaFileAlt, FaVideo, FaDownload, FaTimes 
} from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";

import { db } from "../../firebase"; 
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc 
} from "firebase/firestore";

const GroupChatPage = ({ isAdmin = false }) => {
  const { subjectName } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // 👇 NEW STATES FOR PREVIEW
  const [selectedFile, setSelectedFile] = useState(null); // File jo select hui
  const [previewUrl, setPreviewUrl] = useState(null);     // Image preview ke liye
  const [uploading, setUploading] = useState(false);      // Loading state

  const storedName = localStorage.getItem("userName");
  const currentUser = isAdmin ? "Admin (Teacher)" : (storedName || "Student");

  // 👇 SETTINGS
  const CLOUD_NAME = "dpfz1gq4y"; 
  const UPLOAD_PRESET = "college_app"; 

  useEffect(() => {
    if (!subjectName) return;
    const q = query(collection(db, "subjects", subjectName, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [subjectName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 1. FILE SELECT KARNA (Upload nahi, sirf Preview) ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // State mein file save karo
    setSelectedFile(file);

    // Agar Image hai to Preview banao
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null); // PDF/Video ka preview nahi, sirf icon dikhayenge
    }
  };

  // --- 2. SELECTED FILE KO HATANA (Cancel) ---
  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = ""; // Input reset
  };

  // --- 3. FINAL SEND BUTTON LOGIC 🚀 ---
  const handleSend = async () => {
    // Case A: Agar File Select hui hai -> Pehle Upload karo
    if (selectedFile) {
      await uploadAndSendFile();
      return;
    }

    // Case B: Sirf Text hai -> Direct bhej do
    if (input.trim()) {
      await sendMessageToDB(input, "text");
      setInput("");
      setShowEmojiPicker(false);
    }
  };

  // --- 4. UPLOAD LOGIC (Send dabane par chalega) ---
  const uploadAndSendFile = async () => {
    if (!selectedFile) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("upload_preset", UPLOAD_PRESET); 
    formData.append("cloud_name", CLOUD_NAME);
    
    // PDF vs Image logic
    let resourceType = "raw"; 
    if (selectedFile.type.startsWith("image/")) resourceType = "image";
    else if (selectedFile.type.startsWith("video/")) resourceType = "video";

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.secure_url) {
        // DB Type determine karo
        let msgType = "file";
        if (resourceType === "image") msgType = "image";
        else if (resourceType === "video") msgType = "video";

        await sendMessageToDB(data.secure_url, msgType, selectedFile.name);
        clearSelection(); // Upload hone ke baad preview hata do
      } else {
        alert("❌ Upload Failed!");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      alert("❌ Internet Error.");
    } finally {
      setUploading(false);
    }
  };

  const sendMessageToDB = async (content, type, fileName = "") => {
    try {
      await addDoc(collection(db, "subjects", subjectName, "messages"), {
        text: content,
        fileName: fileName,
        sender: currentUser,
        role: isAdmin ? "admin" : "student",
        type: type,
        createdAt: serverTimestamp(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (msgId) => {
    if (window.confirm("Delete this message?")) {
      await deleteDoc(doc(db, "subjects", subjectName, "messages", msgId));
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.type === "image") return <img src={msg.text} alt="sent" className="chat-image" />;
    else if (msg.type === "video") return <video src={msg.text} controls className="chat-video" />;
    else if (msg.type === "file") {
      const isPdf = msg.fileName && msg.fileName.toLowerCase().endsWith(".pdf");
      return (
        <a href={msg.text} target="_blank" rel="noopener noreferrer" className="chat-file-link">
          <div className="file-icon">{isPdf ? <FaFilePdf color="#e74c3c"/> : <FaFileAlt color="#3498db"/>}</div>
          <div className="file-info"><span>{msg.fileName}</span><small>Download <FaDownload/></small></div>
        </a>
      );
    }
    return <span>{msg.text}</span>;
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <button className="back-btn" onClick={() => navigate(-1)}><FaArrowLeft /></button>
        <div className="group-info">
          <div className="group-icon">{subjectName.charAt(0).toUpperCase()}</div>
          <div className="group-details"><h3>{subjectName}</h3><p>● Live Classroom</p></div>
        </div>
      </header>

      <div className="chat-body" onClick={() => setShowEmojiPicker(false)}>
        {messages.map((msg) => {
          const isMe = msg.sender === currentUser;
          return (
            <div key={msg.id} className={`message-row ${isMe ? "my-message" : "other-message"}`}>
              {!isMe && <span className="sender-name">{msg.sender}</span>}
              <div className="message-bubble">
                {renderMessageContent(msg)}
                <div className="msg-meta"><span className="msg-time">{msg.time}</span></div>
              </div>
              {(isMe || isAdmin) && <button className="delete-btn" onClick={() => handleDelete(msg.id)}><FaTrash /></button>}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {showEmojiPicker && (
        <div className="emoji-picker-container">
          <EmojiPicker onEmojiClick={(e) => setInput(prev => prev + e.emoji)} height={350} width="100%" />
        </div>
      )}

      {/* 👇 PREVIEW SECTION (Jab file select hogi tab dikhega) */}
      {selectedFile && (
        <div className="file-preview-box">
          <div className="preview-content">
            {selectedFile.type.startsWith("image/") ? (
              <img src={previewUrl} alt="Preview" className="preview-img" />
            ) : (
              <div className="preview-doc">
                <FaFileAlt size={30} color="#555" />
                <span>{selectedFile.name}</span>
              </div>
            )}
          </div>
          <button className="cancel-preview-btn" onClick={clearSelection}>
            <FaTimes />
          </button>
        </div>
      )}

      {uploading && <div className="upload-loader">🚀 Sending File...</div>}

      <div className="chat-footer">
        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}>
          <FaSmile />
        </button>
        
        <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileSelect} accept="image/*,video/*,.pdf,.doc,.docx" />
        <button className="icon-btn" onClick={() => fileInputRef.current.click()}><FaPaperclip /></button>

        <input
          type="text" 
          placeholder={selectedFile ? `File: ${selectedFile.name}` : "Type a message..."} 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!!selectedFile} // Agar file select hai to text mat likhne do (WhatsApp style)
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="send-btn" onClick={handleSend}><FaPaperPlane /></button>
      </div>
    </div>
  );
};

export default GroupChatPage;