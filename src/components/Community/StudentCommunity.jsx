import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentCommunity.css"; 
// Navbar Import Removed ✅
import { 
  FaHeart, FaRegHeart, FaComment, FaPaperPlane, 
  FaUniversity, FaUsers, FaGlobe, FaTrash, FaImage, FaTimes
} from "react-icons/fa";

import { auth, db } from "../../firebase"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const StudentCommunity = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [activeTab, setActiveTab] = useState("Global"); 

  // Image Upload State
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  // Comments State
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // 1. Fetch User Data
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setUserData({ ...snap.data(), uid: user.uid });
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Fetch Posts
  useEffect(() => {
    const q = query(collection(db, "community_posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 3. Fetch Comments
  useEffect(() => {
      if(!activeCommentId) return;
      const q = query(collection(db, `community_posts/${activeCommentId}/comments`), orderBy("createdAt", "asc"));
      const unsub = onSnapshot(q, (snap) => {
          setComments(snap.docs.map(d => ({id: d.id, ...d.data()})));
      });
      return () => unsub();
  }, [activeCommentId]);

  // Handle Image Selection
  const handleImageChange = (e) => {
      const file = e.target.files[0];
      if(file) {
          setImage(file);
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  // Cloudinary Upload
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

  // Create Post
  const handlePost = async () => {
    if ((!newPost.trim() && !image) || !userData) return;
    setUploading(true);
    let imageUrl = "";
    if (image) imageUrl = await uploadToCloudinary();

    let channelName = "Global";
    if (activeTab === "Class") channelName = userData.year; 
    if (activeTab === "Department") channelName = userData.department;

    await addDoc(collection(db, "community_posts"), {
        text: newPost,
        imageUrl: imageUrl,
        sender: userData.name,
        senderPic: userData.photo || "",
        uid: userData.uid,
        role: "student",
        channel: channelName, 
        year: userData.year,
        likes: [],
        commentCount: 0,
        createdAt: serverTimestamp(),
        time: new Date().toLocaleDateString()
    });
    setNewPost(""); setImage(null); setPreviewUrl(""); setUploading(false);
  };

  // Actions
  const handleLike = async (post) => {
    const postRef = doc(db, "community_posts", post.id);
    const isLiked = post.likes?.includes(userData.uid);
    if (isLiked) await updateDoc(postRef, { likes: arrayRemove(userData.uid) });
    else await updateDoc(postRef, { likes: arrayUnion(userData.uid) });
  };

  const handleDelete = async (id) => {
      if(window.confirm("Delete Post?")) await deleteDoc(doc(db, "community_posts", id));
  };

  // Comment Logic
  const handleSendComment = async (postId) => {
      if(!newComment.trim()) return;
      await addDoc(collection(db, `community_posts/${postId}/comments`), {
          text: newComment, sender: userData.name, uid: userData.uid, createdAt: serverTimestamp()
      });
      const postRef = doc(db, "community_posts", postId);
      await updateDoc(postRef, { commentCount: (comments.length + 1) });
      setNewComment("");
  };

  // Render Text with Mentions
  const renderText = (text) => {
      return text.split(" ").map((word, i) => {
          if(word.startsWith("@")) return <span key={i} className="mention-text">{word} </span>;
          return word + " ";
      });
  };

  const filteredPosts = posts.filter(p => {
      if (activeTab === "Global") return p.channel === "Global";
      if (activeTab === "Class") return p.channel === userData?.year || p.year === userData?.year;
      if (activeTab === "Department") return p.channel === userData?.department;
      return false;
  });

  if (!userData) return <div className="loading-screen">Loading...</div>;

  return (
    // Navbar component removed from here ✅
    <div className="stu-comm-container">
      
      {/* HEADER */}
      <header className="comm-header-glass custom-header-layout">
          <button className="back-btn-glass" onClick={() => navigate('/homepage')}>⬅</button>
          
          <div className="header-title-box">
              <h1>Student Forum 🌍</h1>
              <p>Connect • Share • Discuss</p>
          </div>

          {/* Profile Button */}
          <div className="header-profile-pic-container" onClick={() => navigate('/student/community-profile')}>
               <img src={userData.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Profile" />
          </div>
      </header>

      <div className="hub-tabs">
          {["Global", "Department", "Class"].map(tab => (
              <button key={tab} className={`tab-btn ${activeTab===tab?"active":""}`} onClick={()=>setActiveTab(tab)}>
                  {tab === "Global" ? <FaGlobe/> : tab === "Class" ? <FaUsers/> : <FaUniversity/>} {tab}
              </button>
          ))}
      </div>

      <div className="comm-feed-area">
          {/* Create Post */}
          <div className="create-post-glass">
              {previewUrl && <div className="image-preview-box"><img src={previewUrl} alt="Preview"/><FaTimes className="remove-img" onClick={()=>{setImage(null); setPreviewUrl("")}}/></div>}
              <div className="cp-input-row">
                  <img src={userData.photo} className="cp-avatar" alt="Me"/>
                  <input placeholder={`Post in ${activeTab}... (@Mention supported)`} value={newPost} onChange={(e) => setNewPost(e.target.value)} disabled={uploading}/>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                  <button className="attach-icon-btn" onClick={() => fileInputRef.current.click()}><FaImage/></button>
                  <button className="send-icon-btn" onClick={handlePost} disabled={uploading}><FaPaperPlane/></button>
              </div>
          </div>

          {/* Posts */}
          <div className="posts-list">
              {filteredPosts.map((post) => {
                  const isLiked = post.likes?.includes(userData.uid);
                  const isMe = post.uid === userData.uid;

                  return (
                      <div key={post.id} className={`feed-card-glass ${post.role==="admin" ? "teacher-post" : ""}`}>
                          <div className="post-header">
                              <div className="poster-info">
                                  <img src={post.senderPic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="U" />
                                  <div>
                                      <h4>{post.sender} {post.role==="admin" && <span className="teacher-badge">Faculty</span>}</h4>
                                      <small>{post.time} • {post.channel}</small>
                                  </div>
                              </div>
                              {isMe && <FaTrash className="delete-icon" onClick={()=>handleDelete(post.id)}/>}
                          </div>

                          <div className="post-body">
                              <p>{renderText(post.text)}</p>
                              {post.imageUrl && <img src={post.imageUrl} alt="Post" className="post-image" />}
                          </div>

                          <div className="post-footer">
                              <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={() => handleLike(post)}>
                                  {isLiked ? <FaHeart/> : <FaRegHeart/>} <span>{post.likes?.length || 0}</span>
                              </button>
                              <button className="action-btn" onClick={() => setActiveCommentId(activeCommentId === post.id ? null : post.id)}>
                                  <FaComment/> <span>{post.commentCount || 0}</span>
                              </button>
                          </div>

                          {/* COMMENT SECTION */}
                          {activeCommentId === post.id && (
                              <div className="comment-section">
                                  <div className="comment-list">
                                      {comments.map(c => (
                                          <div key={c.id} className="comment-bubble">
                                              <strong>{c.sender}: </strong> {renderText(c.text)}
                                          </div>
                                      ))}
                                  </div>
                                  <div className="comment-input-row">
                                      <input placeholder="Add a comment..." value={newComment} onChange={(e)=>setNewComment(e.target.value)} />
                                      <button onClick={()=>handleSendComment(post.id)}><FaPaperPlane/></button>
                                  </div>
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      </div>
    </div>
  );
};

export default StudentCommunity;