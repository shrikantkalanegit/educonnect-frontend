import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CommunityProfile.css"; 
import { 
  FaArrowLeft, FaCog, FaSearch, FaCamera, FaTimes, FaEye, FaLock, FaGlobe, FaStar, FaHeart
} from "react-icons/fa";

import { auth, db } from "../../firebase"; 
import { doc, getDoc, updateDoc, collection, query, where, getDocs, arrayUnion, arrayRemove, orderBy } from "firebase/firestore";

const CommunityProfile = () => {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  
  // Refs
  const storyInputRef = useRef(null);
  const profileImageInputRef = useRef(null);

  // --- STATES ---
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isEditing, setIsEditing] = useState(false);
  
  // Data States
  const [myPosts, setMyPosts] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [storyViewers, setStoryViewers] = useState([]); // List of viewers
  const [viewingStoryId, setViewingStoryId] = useState(null); // Currently open story stats

  // Edit States
  const [editBio, setEditBio] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [previewProfileUrl, setPreviewProfileUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Search & Tabs
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState("posts"); 

  // --- 1. FETCH PROFILE & POSTS ---
  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        // A. User Details
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const data = userSnap.data();
            setUserProfile(data);
            setEditBio(data.bio || "");
            setEditUsername(data.username || `@${data.name.split(' ')[0].toLowerCase()}`);
            setStats({
                followers: data.followers?.length || 0,
                following: data.following?.length || 0,
                posts: 0 // Will update below
            });
            // Load Stories (Mock for now, assume array in DB)
            setMyStories(data.stories || []);
        }

        // B. Fetch MY POSTS (🔥 FIX: Posts Showing Logic)
        const q = query(
            collection(db, "community_posts"), 
            where("uid", "==", currentUser.uid),
            orderBy("createdAt", "desc")
        );
        const postSnap = await getDocs(q);
        const postsList = postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setMyPosts(postsList);
        setStats(prev => ({ ...prev, posts: postsList.length }));
      }
    };
    fetchData();
  }, [currentUser]);

  // --- 2. SEARCH & FOLLOW (Keeping logic same) ---
  const handleSearch = async (text) => {
      setSearchQuery(text);
      if(text.length > 2) {
          const q = query(collection(db, "users"), where("name", ">=", text), where("name", "<=", text + '\uf8ff'));
          const snap = await getDocs(q);
          setSearchResults(snap.docs.map(d => ({uid: d.id, ...d.data()})).filter(u => u.uid !== currentUser.uid));
      } else { setSearchResults([]); }
  };

  const handleFollowToggle = async (targetUserId, isFollowing) => {
      if(!currentUser) return;
      const myRef = doc(db, "users", currentUser.uid);
      const targetRef = doc(db, "users", targetUserId);
      if (isFollowing) {
          await updateDoc(myRef, { following: arrayRemove(targetUserId) });
          await updateDoc(targetRef, { followers: arrayRemove(currentUser.uid) });
          setUserProfile(prev => ({ ...prev, following: prev.following.filter(id => id !== targetUserId) }));
      } else {
          await updateDoc(myRef, { following: arrayUnion(targetUserId) });
          await updateDoc(targetRef, { followers: arrayUnion(currentUser.uid) });
          setUserProfile(prev => ({ ...prev, following: [...(prev.following || []), targetUserId] }));
      }
  };

  // --- 3. STORY LOGIC (Privacy + Viewers) ---
  const handleStoryUpload = (e) => {
      const file = e.target.files[0];
      if(!file) return;

      const privacy = window.confirm("Post to Close Friends Only? 🌟") ? "close_friends" : "public";
      
      // Simulation of Upload
      const newStory = {
          id: Date.now(),
          img: URL.createObjectURL(file), // Real app me Cloudinary URL hoga
          viewers: [], // Empty initially
          privacy: privacy,
          createdAt: new Date()
      };

      setMyStories([newStory, ...myStories]);
      // Here you would also updateDoc(db, 'users', uid, { stories: arrayUnion(newStory) })
      alert(`Story added! Visible to: ${privacy === 'public' ? 'Everyone 🌍' : 'Close Friends ⭐'}`);
  };

  const openStoryStats = (story) => {
      // Mock Viewers Data (Real app me DB se fetch hoga)
      const mockViewers = [
          { name: "Rahul", img: "https://i.pravatar.cc/150?img=3" },
          { name: "Priya", img: "https://i.pravatar.cc/150?img=5" },
          { name: "Amit", img: "https://i.pravatar.cc/150?img=8" }
      ];
      setStoryViewers(mockViewers); 
      setViewingStoryId(story.id);
  };

  // --- 4. PROFILE UPDATE ---
  const handleImageSelect = (e) => {
      const file = e.target.files[0];
      if(file) { setNewProfileImage(file); setPreviewProfileUrl(URL.createObjectURL(file)); }
  };

  // Cloudinary Upload helper (Reusable)
  const uploadToCloudinary = async (file) => {
    const data = new FormData(); data.append("file", file); data.append("upload_preset", "college_app"); data.append("cloud_name", "dpfz1gq4y");
    try { const res = await fetch("https://api.cloudinary.com/v1_1/dpfz1gq4y/image/upload", { method: "POST", body: data }); const d = await res.json(); return d.secure_url; } catch (e) { return null; }
  };

  const handleSave = async () => {
      if(!currentUser) return;
      setUploading(true);
      let finalPhotoUrl = userProfile.photo;
      if(newProfileImage) {
          const url = await uploadToCloudinary(newProfileImage);
          if(url) finalPhotoUrl = url;
      }
      await updateDoc(doc(db, "users", currentUser.uid), { bio: editBio, username: editUsername, photo: finalPhotoUrl });
      setUserProfile(prev => ({...prev, bio: editBio, username: editUsername, photo: finalPhotoUrl}));
      setIsEditing(false); setUploading(false);
  };

  // --- 5. RENDER COMPONENTS ---
  const UserCard = ({ user }) => {
      const isFollowing = userProfile?.following?.includes(user.uid);
      return (
          <div className="user-card-item">
              <img src={user.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="profile" />
              <div className="user-text"><h4>{user.name}</h4><small>{user.department}</small></div>
              <button className={`follow-btn ${isFollowing ? 'following' : ''}`} onClick={() => handleFollowToggle(user.uid, isFollowing)}>{isFollowing ? "Following" : "Follow"}</button>
          </div>
      );
  };

  if (!userProfile) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="comm-profile-container">
      
      {/* HEADER */}
      <header className="cp-header">
        <div className="header-left"><button onClick={() => navigate(-1)}><FaArrowLeft /></button><h3 className="header-title">{userProfile.username}</h3></div>
        <div className="header-right"><button onClick={() => setShowSearch(!showSearch)}>{showSearch ? <FaTimes /> : <FaSearch />}</button><button className="settings-btn"><FaCog /></button></div>
      </header>

      {showSearch && (
          <div className="search-section">
              <input placeholder="Search..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} autoFocus />
              <div className="search-results">{searchResults.map(u => <UserCard key={u.uid} user={u} />)}</div>
          </div>
      )}

      {/* --- STORIES SECTION --- */}
      <div className="stories-scroll">
          <div className="story-circle add-story" onClick={() => storyInputRef.current.click()}>
              <div className="plus-icon"><FaCamera/></div><span>Add</span>
          </div>
          <input type="file" ref={storyInputRef} hidden accept="image/*" onChange={handleStoryUpload} />

          {/* MY STORIES */}
          {myStories.map((s, i) => (
              <div key={i} className="story-circle" onClick={() => openStoryStats(s)}>
                  <div className={`ring active ${s.privacy === 'close_friends' ? 'green-ring' : ''}`}>
                    <img src={s.img} alt="story" />
                  </div>
                  <span>{s.privacy === 'close_friends' ? 'CF' : 'You'}</span>
              </div>
          ))}
      </div>

      {/* --- STORY VIEWERS POPUP --- */}
      {viewingStoryId && (
          <div className="viewers-modal-overlay" onClick={() => setViewingStoryId(null)}>
              <div className="viewers-modal" onClick={e => e.stopPropagation()}>
                  <div className="vm-header">
                      <h4>Story Views <FaEye/></h4>
                      <button onClick={() => setViewingStoryId(null)}><FaTimes/></button>
                  </div>
                  <div className="vm-list">
                      {storyViewers.map((v, i) => (
                          <div key={i} className="viewer-item">
                              <img src={v.img} alt="v" />
                              <span>{v.name} viewed your story</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- PROFILE INFO --- */}
      <div className="cp-info-section">
          <div className="cp-avatar-box">
             {isEditing ? (
                 <div className="avatar-edit-wrapper" onClick={() => profileImageInputRef.current.click()}>
                    <img src={previewProfileUrl || userProfile.photo} alt="Edit" style={{opacity: uploading ? 0.5 : 1}}/>
                    <div className="edit-overlay"><FaCamera /></div>
                    <input type="file" ref={profileImageInputRef} hidden onChange={handleImageSelect} accept="image/*"/>
                 </div>
             ) : (
                 <img src={userProfile.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Me" />
             )}
          </div>
          <div className="cp-stats-row">
              <div className="stat-box"><strong>{stats.posts}</strong><span>Posts</span></div>
              <div className="stat-box"><strong>{stats.followers}</strong><span>Followers</span></div>
              <div className="stat-box"><strong>{stats.following}</strong><span>Following</span></div>
          </div>
      </div>

      {/* BIO */}
      <div className="cp-bio-section">
          {isEditing ? (
              <div className="edit-mode">
                  <input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="@username"/>
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Write a bio..." />
                  <div className="edit-actions">
                      <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                      <button className="save-btn" onClick={handleSave}>{uploading ? "Saving..." : "Save"}</button>
                  </div>
              </div>
          ) : (
              <>
                  <h2 className="real-name">{userProfile.name}</h2>
                  <p className="bio-text">{userProfile.bio || "Student at EduConnect 🎓"}</p>
                  <div className="action-buttons"><button className="edit-profile-btn" onClick={() => setIsEditing(true)}>Edit Profile</button></div>
              </>
          )}
      </div>

      {/* TABS */}
      <div className="cp-tabs">
          <button className={activeTab==="posts"?"active":""} onClick={()=>setActiveTab("posts")}>Posts</button>
          <button className={activeTab==="tagged"?"active":""} onClick={()=>setActiveTab("tagged")}>Saved</button>
      </div>

      {/* 🔥 POSTS GRID (NOW WORKING) */}
      <div className="cp-grid">
          {activeTab === "posts" && myPosts.length > 0 ? (
              <div className="posts-grid-layout">
                  {myPosts.map(post => (
                      <div key={post.id} className="grid-post-item">
                          {post.imageUrl ? (
                              <img src={post.imageUrl} alt="post" />
                          ) : (
                              <div className="text-post-preview">
                                  <p>{post.text.substring(0, 50)}...</p>
                              </div>
                          )}
                          <div className="post-overlay">
                              <span><FaHeart/> {post.likes?.length || 0}</span>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="empty-state"><p>📸 No posts yet</p></div>
          )}
      </div>

    </div>
  );
};

export default CommunityProfile;