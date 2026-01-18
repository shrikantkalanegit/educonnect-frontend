import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import "./StudentCommunity.css"; 
import { 
  FaArrowLeft, FaTrash, FaPaperPlane, FaUserTie, FaCheckCircle, 
  FaImage, FaTimes, FaGlobe, FaGraduationCap, FaHeart, FaRegHeart, FaComment
} from "react-icons/fa";

import { auth, db } from "../../firebase"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, deleteDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const AdminCommunity = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [adminData, setAdminData] = useState({ name: "Faculty", photo: "" });
  const [activeTab, setActiveTab] = useState("Global");

  // Image & Comments State
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
        if(user) {
            const snap = await getDoc(doc(db, "admins", user.uid));
            if(snap.exists()) setAdminData(snap.data());
        }
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "community_posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = all.filter(post => activeTab === "Global" ? post.channel === "Global" : (post.year === activeTab || post.channel === activeTab));
      setPosts(filtered);
    });
    return () => unsubscribe();
  }, [activeTab]);

  // Fetch Comments
  useEffect(() => {
    if(!activeCommentId) return;
    const q = query(collection(db, `community_posts/${activeCommentId}/comments`), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => setComments(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => unsub();
  }, [activeCommentId]);

  // Cloudinary Upload (Copy same logic)
  const uploadToCloudinary = async () => {
      const data = new FormData();
      data.append("file", image);
      data.append("upload_preset", "college_app"); 
      data.append("cloud_name", "dpfz1gq4y"); 
      try {
          const res = await fetch("https://api.cloudinary.com/v1_1/dpfz1gq4y/image/upload", { method: "POST", body: data });
          const fileData = await res.json();
          return fileData.secure_url;
      } catch (error) { return null; }
  };

  const handlePost = async () => {
    if ((!newPost.trim() && !image)) return;
    setUploading(true);
    let imageUrl = "";
    if (image) imageUrl = await uploadToCloudinary();

    await addDoc(collection(db, "community_posts"), {
      text: newPost, imageUrl: imageUrl, sender: adminData.name, senderPic: adminData.photo, uid: auth.currentUser.uid, role: "admin", channel: activeTab, year: activeTab === "Global" ? "All" : activeTab, likes: [], commentCount: 0, createdAt: serverTimestamp(), time: new Date().toLocaleDateString()
    });
    setNewPost(""); setImage(null); setPreviewUrl(""); setUploading(false);
  };

  const handleSendComment = async (postId) => {
      if(!newComment.trim()) return;
      await addDoc(collection(db, `community_posts/${postId}/comments`), {
          text: newComment, sender: adminData.name, uid: auth.currentUser.uid, createdAt: serverTimestamp()
      });
      const postRef = doc(db, "community_posts", postId);
      await updateDoc(postRef, { commentCount: (comments.length + 1) });
      setNewComment("");
  };

  // ADMIN DELETE (Post & Comment)
  const handleDeletePost = async (id) => { if(window.confirm("⚠️ Admin: Delete Post?")) await deleteDoc(doc(db, "community_posts", id)); };
  
  const handleDeleteComment = async (postId, commentId) => {
      if(window.confirm("⚠️ Admin: Delete Comment?")) {
          await deleteDoc(doc(db, `community_posts/${postId}/comments`, commentId));
      }
  };

  return (
    <div className="stu-comm-container" style={{background: 'linear-gradient(135deg, #f0f9ff 0%, #cbebff 100%)'}}>
      <header className="comm-header-glass">
        <button className="back-btn-glass" onClick={() => navigate('/admin-dashboard')} style={{position:'absolute', left:'20px'}}>⬅</button>
        <h1>Campus Feed 🛡️</h1>
        <p>Moderating: <strong>{activeTab}</strong></p>
      </header>

      <div className="hub-tabs">
          {["Global", "1st Year", "2nd Year", "3rd Year", "4th Year"].map(tab => (
              <button key={tab} className={`tab-btn ${activeTab===tab?"active":""}`} onClick={()=>setActiveTab(tab)}>
                  {tab === "Global" ? <FaGlobe/> : <FaGraduationCap/>} {tab}
              </button>
          ))}
      </div>

      <div className="comm-feed-area">
         <div className="create-post-glass" style={{border: '2px solid #a855f7'}}>
            {previewUrl && <div className="image-preview-box"><img src={previewUrl} alt="Preview"/><FaTimes className="remove-img" onClick={()=>{setImage(null); setPreviewUrl("")}}/></div>}
            <div className="cp-input-row">
                <div style={{color:'#a855f7', fontSize:'1.5rem'}}><FaUserTie/></div>
                <input placeholder={`Post official update in ${activeTab}...`} value={newPost} onChange={(e) => setNewPost(e.target.value)} disabled={uploading}/>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e)=>{if(e.target.files[0]){setImage(e.target.files[0]); setPreviewUrl(URL.createObjectURL(e.target.files[0]));}}} />
                <button className="attach-icon-btn" onClick={() => fileInputRef.current.click()}><FaImage/></button>
                <button className="send-icon-btn" onClick={handlePost} style={{background:'#a855f7'}}><FaPaperPlane/></button>
            </div>
         </div>

         <div className="posts-list">
            {posts.map((post) => (
                <div key={post.id} className="feed-card-glass" style={{borderColor: post.role==='admin' ? '#a855f7' : ''}}>
                    <div className="post-header">
                        <div className="poster-info">
                            <img src={post.senderPic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="U" />
                            <div>
                                <h4>{post.sender} {post.role==='admin' && <span className="teacher-badge"><FaCheckCircle/> Faculty</span>}</h4>
                                <small>{post.time} • {post.channel}</small>
                            </div>
                        </div>
                        <FaTrash className="delete-icon" style={{color:'red'}} onClick={()=>handleDeletePost(post.id)}/>
                    </div>
                    
                    <div className="post-body">
                        <p>{post.text}</p>
                        {post.imageUrl && <img src={post.imageUrl} alt="Post" className="post-image" />}
                    </div>

                    <div className="post-footer">
                        <div className="action-btn"><FaHeart/> {post.likes?.length || 0}</div>
                        <button className="action-btn" onClick={() => setActiveCommentId(activeCommentId === post.id ? null : post.id)}>
                            <FaComment/> <span>{post.commentCount || 0}</span>
                        </button>
                    </div>

                    {/* ADMIN COMMENT SECTION */}
                    {activeCommentId === post.id && (
                        <div className="comment-section">
                            <div className="comment-list">
                                {comments.map(c => (
                                    <div key={c.id} className="comment-bubble" style={{display:'flex', justifyContent:'space-between'}}>
                                        <div><strong>{c.sender}: </strong> {c.text}</div>
                                        <FaTrash size={10} color="red" style={{cursor:'pointer'}} onClick={()=>handleDeleteComment(post.id, c.id)}/>
                                    </div>
                                ))}
                            </div>
                            <div className="comment-input-row">
                                <input placeholder="Reply as Admin..." value={newComment} onChange={(e)=>setNewComment(e.target.value)} />
                                <button onClick={()=>handleSendComment(post.id)} style={{background:'#a855f7'}}><FaPaperPlane/></button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default AdminCommunity;