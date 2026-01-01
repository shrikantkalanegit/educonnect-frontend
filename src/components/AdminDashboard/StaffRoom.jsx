import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPaperPlane, FaCrown, FaShieldAlt, FaUserTie } from "react-icons/fa";
import "./StaffRoom.css";

// 👇 Firebase Imports
import { db } from "../../firebase"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

const StaffRoom = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  
  // Admin ka naam nikalo (ya default 'Admin' rakho)
  const adminName = localStorage.getItem("userName") || "Admin Authority";

  // 👇 1. REALTIME DATABASE LISTENER
  useEffect(() => {
    // Database se "staff_messages" collection padho
    const q = query(collection(db, "staff_messages"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(liveMessages);
    });

    return () => unsubscribe();
  }, []);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 👇 2. SEND MESSAGE TO FIREBASE
  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      await addDoc(collection(db, "staff_messages"), {
        text: input,
        sender: adminName,
        role: "admin", // Sirf admin hi hai yahan
        createdAt: serverTimestamp(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setInput("");
    } catch (error) {
      console.error("Error sending VIP message:", error);
    }
  };

  return (
    <div className="staff-room-container">
      
      {/* HEADER */}
      <header className="staff-header">
        <button className="staff-back-btn" onClick={() => navigate('/admin-dashboard')}>
          <FaArrowLeft />
        </button>
        
        <div className="vip-badge">
          <FaCrown className="crown-icon" />
        </div>

        <div className="room-title">
          <h2>STAFF ROOM <span className="vip-tag">PRO</span></h2>
          <p><FaShieldAlt style={{marginRight:'5px'}}/> End-to-End Encrypted • Management Only</p>
        </div>
      </header>

      {/* CHAT BODY */}
      <div className="staff-body">
        {messages.length === 0 && (
          <div className="welcome-vip">
            <FaCrown className="big-crown" />
            <h3>Welcome to the Boardroom</h3>
            <p>This channel is restricted to administrators.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender === adminName;
          return (
            <div key={msg.id} className={`staff-row ${isMe ? "row-me" : "row-other"}`}>
              {/* Sender Name (Other) */}
              {!isMe && <div className="sender-avatar"><FaUserTie /></div>}
              
              <div className="staff-bubble">
                {!isMe && <span className="sender-name">{msg.sender}</span>}
                <p className="msg-text">{msg.text}</p>
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER */}
      <div className="staff-footer">
        <div className="input-glass-wrapper">
          <input 
            type="text" 
            placeholder="Type a confidential message..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <button className="vip-send-btn" onClick={handleSend}>
            <FaPaperPlane />
          </button>
        </div>
      </div>

    </div>
  );
};

export default StaffRoom;