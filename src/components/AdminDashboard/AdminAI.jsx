import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown"; 
import { FaRobot, FaPaperPlane, FaArrowLeft, FaEraser, FaPlusCircle, FaCloudUploadAlt, FaBolt, FaDatabase } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./AdminAI.css"; 

// Firebase Import
import { realtimeDb as db } from "../../firebase";
import { ref, onValue, push } from "firebase/database";

// 🧠 STATIC BRAIN (Basic College Data)
const STATIC_BRAIN = [
    { keywords: ["hi", "hello", "hey"], answer: "Hello! 👋 I am your Campus Assistant. Ask me about exams, fees, or holidays." },
    { keywords: ["holiday", "chutti", "leave", "closed"], answer: "### 🗓️ Holiday Status\nCheck the **Notice Board** on Dashboard for official holiday updates." },
    { keywords: ["exam", "paper", "date sheet", "schedule"], answer: "### 📝 Exam Update\nMid-terms usually happen in **October**. Finals in **March**. Check the 'Exams' tab." },
    { keywords: ["fee", "money", "payment", "deadline"], answer: "### 💰 Fee Info\nPlease pay your semester fees before the **30th**. Late fees may apply!" },
    { keywords: ["admin", "contact", "principal"], answer: "**📞 Contact Admin:**\nOffice Hours: 10 AM - 4 PM\nEmail: admin@college.edu" },
    { keywords: ["java", "python", "c++", "subject"], answer: "For syllabus and notes, please visit the **Manage Subjects** section." },
    { keywords: ["who are you", "bot", "ai"], answer: "I am a **Self-Learning System** made for EduConnect. 🤖" }
];

const AdminAI = () => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    { text: "Hello! 🤖\nI am running on **Campus Server Mode**. Ask me anything.", sender: "ai" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 🧠 Full Knowledge (Static + Firebase)
  const [fullKnowledge, setFullKnowledge] = useState(STATIC_BRAIN);
  
  // Teach Modal
  const [showTeachModal, setShowTeachModal] = useState(false); 
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  
  const chatEndRef = useRef(null);

  // 🔥 1. SYNC DATABASE (Learning from Firebase)
  useEffect(() => {
    if (!db) return;
    const aiRef = ref(db, 'ai_learning_data');
    onValue(aiRef, (snapshot) => {
      const cloudData = snapshot.val();
      if (cloudData) {
        // Firebase data ko array mein convert karke merge karo
        const learnedData = Object.values(cloudData);
        setFullKnowledge([...STATIC_BRAIN, ...learnedData]);
      }
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🧠 2. SMART SEARCH (Fuzzy Logic)
  const findBestAnswer = (query) => {
    const q = query.toLowerCase();
    
    // Reverse loop taaki Latest seekha hua pehle mile
    for (let i = fullKnowledge.length - 1; i >= 0; i--) {
        const item = fullKnowledge[i];
        
        // Agar keywords match karein
        if (item.keywords && item.keywords.some(k => q.includes(k.toLowerCase()))) {
            return item.answer;
        }
    }
    return null; 
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const textToSend = input;
    
    setMessages(prev => [...prev, { text: textToSend, sender: "user" }]);
    setInput(""); 
    setLoading(true);

    // Thoda fake delay taaki user ko lage bot soch raha hai
    setTimeout(() => {
        const answer = findBestAnswer(textToSend);
        setLoading(false);

        if (answer) {
            setMessages(prev => [...prev, { text: answer, sender: "ai", source: "db" }]);
        } else {
            // Agar answer nahi mila to Teach Mode Offer karo
            setMessages(prev => [...prev, { 
                text: `❌ Sorry, I don't know about "**${textToSend}**" yet.\n\nTeach me this answer so I can help next time! 👇`, 
                sender: "ai", 
                isUnknown: true,
                failedQuery: textToSend 
            }]);
        }
    }, 600);
  };

  // 💾 TEACH FUNCTION (Firebase mein save karega)
  const handleTeachAI = async () => {
    if(!newQ || !newA) return alert("Please fill both fields!");
    
    const newEntry = {
        keywords: newQ.toLowerCase().split(",").map(k => k.trim()), // Comma separated keywords
        answer: newA,
        addedAt: Date.now()
    };

    try {
        await push(ref(db, 'ai_learning_data'), newEntry);
        setShowTeachModal(false);
        setNewQ(""); setNewA("");
        setMessages(prev => [...prev, { text: "✅ Thanks! I have learned this now.", sender: "ai" }]);
    } catch (error) {
        alert("Save Failed! Check Internet.");
    }
  };

  // Auto-fill keywords when opening modal
  const openTeachModal = (query) => {
      setNewQ(query);
      setShowTeachModal(true);
  };

  return (
    <div className="ai-container">
      <header className="ai-header">
        <button onClick={() => navigate('/admin-dashboard')} className="back-btn-ai">
            <FaArrowLeft />
        </button>
        <h3><FaBolt style={{color: "#f1c40f"}} /> Campus Bot <span style={{fontSize:'0.7rem', opacity:0.7}}>(Offline Mode)</span></h3>
        <button className="clear-btn" onClick={() => setMessages([])} title="Clear Chat">
            <FaEraser />
        </button>
      </header>

      {/* TEACH MODAL */}
      {showTeachModal && (
          <div className="teach-modal-overlay">
              <div className="teach-modal-content">
                  <h4>🧠 Teach New Topic</h4>
                  <p>Keywords (separated by comma):</p>
                  <input 
                    placeholder="e.g. sports, cricket, ground" 
                    value={newQ} 
                    onChange={e => setNewQ(e.target.value)} 
                    className="tm-input"
                  />
                  <p>What should I reply?</p>
                  <textarea 
                    placeholder="e.g. The sports ground is open from 4 PM." 
                    value={newA} 
                    onChange={e => setNewA(e.target.value)} 
                    className="tm-textarea"
                  />
                  <div className="tm-actions">
                    <button onClick={handleTeachAI} className="save-btn"><FaCloudUploadAlt/> Save</button>
                    <button onClick={() => setShowTeachModal(false)} className="close-btn">Cancel</button>
                  </div>
              </div>
          </div>
      )}

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === "user" ? "user-msg" : "ai-msg"}`}>
             {msg.sender === "ai" && <FaRobot className="msg-icon" />}
             
             <div className="msg-content">
                {/* Source Badge */}
                {msg.source === "db" && (
                    <span className="source-badge"><FaDatabase/> Campus DB</span>
                )}
                
                <ReactMarkdown>{msg.text}</ReactMarkdown>
                
                {/* Agar AI ko nahi pata, to Teach Button dikhao */}
                {msg.isUnknown && (
                    <button className="teach-btn" onClick={() => openTeachModal(msg.failedQuery)}>
                        <FaPlusCircle /> Teach Me Answer
                    </button>
                )}
             </div>
          </div>
        ))}
        {loading && <div className="loading-dots">Searching database...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <input 
            type="text" 
            placeholder="Type 'Exam', 'Holiday', 'Fee'..." 
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