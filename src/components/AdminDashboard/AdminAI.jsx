import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown"; 
import { FaRobot, FaPaperPlane, FaArrowLeft, FaEraser, FaDatabase, FaPlusCircle, FaCloudUploadAlt, FaBrain, FaBolt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./AdminAI.css"; 

// Firebase Import
import { realtimeDb as db } from "../../firebase";
import { ref, onValue, push } from "firebase/database";

// STATIC BRAIN (Backup Data)
const STATIC_BRAIN = [
    { keywords: ["holiday", "rain", "closed", "chutti"], answer: "### 📢 NOTICE: Holiday Declared\n\nDue to heavy rain, the college remains **closed tomorrow**." },
    { keywords: ["exam", "mid-term", "date"], answer: "### 📝 Mid-Term Exam\n\nStarts: **10th Oct**\nTime: **10:00 AM**" },
    { keywords: ["fee", "last date"], answer: "### 💰 Fee Deadline\n\nPlease pay fees by the **30th of this month**." },
    { keywords: ["java", "syllabus"], answer: "**☕ Java Syllabus:**\n- OOPs, Inheritance\n- JDBC & MySQL" }
];

const AdminAI = () => {
  const navigate = useNavigate();
  
  // 🔑 KEY CHANGE: Confirm karein ki ye key sahi hai
  const GEMINI_API_KEY = "AIzaSyBEFhdU4FcXJ9JsFXJuKNwTmoKy1-CzfVw"; 

  const [messages, setMessages] = useState([
    { text: "Hello! I am **EduConnect AI**. 🤖\nConnected to Asia Server. Ask me anything!", sender: "ai" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullKnowledge, setFullKnowledge] = useState(STATIC_BRAIN);
  const [showTeachModal, setShowTeachModal] = useState(false); 
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  
  const chatEndRef = useRef(null);

  // 🔥 1. SYNC DATABASE (Corrected Region URL via firebase.js)
  useEffect(() => {
    if (!db) return;
    const aiRef = ref(db, 'ai_learning_data');
    onValue(aiRef, (snapshot) => {
      const cloudData = snapshot.val();
      if (cloudData) {
        setFullKnowledge([...STATIC_BRAIN, ...Object.values(cloudData)]);
      }
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🧠 2. LOCAL SEARCH
  const findLocalAnswer = (query) => {
    const q = query.toLowerCase();
    for (let i = fullKnowledge.length - 1; i >= 0; i--) {
        const item = fullKnowledge[i];
        if (item.keywords && item.keywords.some(k => q.includes(k.toLowerCase()))) {
            return item.answer;
        }
    }
    return null; 
  };

  // 🌍 3. GOOGLE GEMINI PRO (Stable Version)
  const askGemini = async (query) => {
    try {
      console.log("⚡ Asking Gemini Pro...");
      
      // FIX: Changed model to 'gemini-pro' to avoid 404 Error
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ 
                parts: [{ text: `You are a helpful college assistant. Answer briefly: ${query}` }] 
            }]
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
          console.error("Gemini Error:", data.error);
          return null;
      }

      if (data.candidates && data.candidates[0].content) {
          return data.candidates[0].content.parts[0].text;
      }
      return null;

    } catch (error) {
      console.error("Network Error:", error);
      return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const textToSend = input;
    
    setMessages(prev => [...prev, { text: textToSend, sender: "user" }]);
    setInput(""); 
    setLoading(true);

    // Step 1: Local Check
    let answer = findLocalAnswer(textToSend);
    let source = "local";

    // Step 2: Cloud Check
    if (!answer) {
        const cloudAns = await askGemini(textToSend);
        if (cloudAns) {
            answer = cloudAns;
            source = "cloud";
        }
    }

    setLoading(false);

    if (answer) {
        setMessages(prev => [...prev, { text: answer, sender: "ai", source: source }]);
    } else {
        setMessages(prev => [...prev, { text: "❌ I don't know this yet.\n\nTeach me so I can remember!", sender: "ai", isUnknown: true }]);
    }
  };

  // 💾 TEACH FUNCTION
  const handleTeachAI = async () => {
    if(!newQ || !newA) return;
    const newEntry = {
        keywords: newQ.toLowerCase().split(",").map(k => k.trim()), 
        answer: newA,
        addedAt: Date.now()
    };
    try {
        await push(ref(db, 'ai_learning_data'), newEntry);
        setShowTeachModal(false);
        setNewQ(""); setNewA("");
        setMessages(prev => [...prev, { text: "✅ Saved to Database!", sender: "ai" }]);
    } catch (error) {
        alert("Save Failed! Check Console.");
    }
  };

  return (
    <div className="ai-container">
      <header className="ai-header">
        <button onClick={() => navigate('/admin-dashboard')} className="back-btn-ai">
            <FaArrowLeft />
        </button>
        <h3><FaBolt style={{color: "#f1c40f"}} /> EduConnect AI</h3>
        <button className="clear-btn" onClick={() => setMessages([])} title="Clear Chat">
            <FaEraser />
        </button>
      </header>

      {showTeachModal && (
          <div className="teach-modal">
              <div className="modal-content">
                  <h4>🧠 Teach AI</h4>
                  <input placeholder="Keywords (e.g. sports)" value={newQ} onChange={e => setNewQ(e.target.value)} />
                  <textarea placeholder="Answer (e.g. Next week)" value={newA} onChange={e => setNewA(e.target.value)} />
                  <button onClick={handleTeachAI} className="save-btn"><FaCloudUploadAlt/> Save</button>
                  <button onClick={() => setShowTeachModal(false)} className="close-btn" style={{marginTop:'5px', background:'grey'}}>Cancel</button>
              </div>
          </div>
      )}

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === "user" ? "user-msg" : "ai-msg"}`}>
             {msg.sender === "ai" && <FaRobot className="msg-icon" />}
             <div className="msg-content">
                {msg.source === "local" && <span style={{fontSize:'10px', background:'#00cec9', color:'white', padding:'2px 5px', borderRadius:'4px', marginBottom:'5px', display:'inline-block'}}>Campus DB</span>}
                {msg.source === "cloud" && <span style={{fontSize:'10px', background:'#f1c40f', color:'black', padding:'2px 5px', borderRadius:'4px', marginBottom:'5px', display:'inline-block'}}>Gemini Pro</span>}
                
                <ReactMarkdown>{msg.text}</ReactMarkdown>
                
                {msg.isUnknown && (
                    <button className="teach-btn" onClick={() => { setShowTeachModal(true); }}>
                        <FaPlusCircle /> Teach Me
                    </button>
                )}
             </div>
          </div>
        ))}
        {loading && <div className="loading-dots">Thinking...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <input 
            type="text" 
            placeholder="Ask anything..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={() => handleSend()} disabled={loading}>
            {loading ? "..." : <FaPaperPlane />}
        </button>
      </div>
    </div>
  );
};

export default AdminAI;