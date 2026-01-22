import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTrash, FaPlus, FaBook, FaCloudUploadAlt, FaTimes, FaLink, FaImage } from "react-icons/fa";
import "./ManageBooks.css"; 

// 🔥 FIX: Using Firestore now (matches Student Side)
import { db } from "../../firebase"; 
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";

const ManageBooks = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [books, setBooks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Form States
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [link, setLink] = useState(""); 
  
  // Image Upload States
  const [image, setImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  // Gradients for Book Covers (Fallback if no image)
  const gradients = [
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
  ];

  // 1. Load Books from Firestore (Synced with Student Page)
  useEffect(() => {
    const q = query(collection(db, "library_books"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBooks(loadedBooks);
    });
    return () => unsubscribe();
  }, []);

  // 2. Cloudinary Upload Logic (Photo Upload)
  const uploadToCloudinary = async () => {
    const data = new FormData();
    data.append("file", image);
    data.append("upload_preset", "college_app"); // Same preset as Community
    data.append("cloud_name", "dpfz1gq4y"); 

    try {
        const res = await fetch("https://api.cloudinary.com/v1_1/dpfz1gq4y/image/upload", { method: "POST", body: data });
        const fileData = await res.json();
        return fileData.secure_url;
    } catch (error) { 
        console.error("Upload Error:", error);
        return null; 
    }
  };

  // 3. Add Book Function
  const handleAddBook = async (e) => {
    e.preventDefault();
    if(!title || !link) return alert("Title and PDF Link are required!");

    setUploading(true);
    let coverUrl = "";

    // Agar image select ki hai to upload karo
    if (image) {
        coverUrl = await uploadToCloudinary();
    }

    await addDoc(collection(db, "library_books"), {
        title, author, subject, 
        pdfUrl: link, // Student page uses 'pdfUrl' or 'link', hum dono save kar dete safe side
        link: link,   
        coverUrl: coverUrl, // Image URL form Cloudinary
        createdAt: serverTimestamp()
    });

    setUploading(false);
    setShowModal(false);
    
    // Reset Form
    setTitle(""); setAuthor(""); setSubject(""); setLink(""); 
    setImage(null); setCoverPreview("");
  };

  // 4. Delete Function
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if(window.confirm("Delete this book permanently?")) {
        await deleteDoc(doc(db, "library_books", id));
    }
  };

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setImage(file);
        setCoverPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="manage-container">
      
      {/* HEADER */}
      <header className="manage-header">
        <div>
            <h1>Library Manager 📚</h1>
            <p>Upload & Organize Digital Books</p>
        </div>
        <button className="manage-back-btn" onClick={() => navigate('/admin-dashboard')}>
          <FaArrowLeft /> Dashboard
        </button>
      </header>

      {/* BOOKS GRID */}
      <div className="manage-book-grid">
        
        {/* ADD NEW BUTTON */}
        <div className="book-card add-card" onClick={() => setShowModal(true)}>
            <div className="add-icon-circle"><FaPlus /></div>
            <h3>Add New Book</h3>
        </div>

        {/* BOOK CARDS */}
        {books.map((book, index) => (
            <div key={book.id} className="book-card" onClick={() => window.open(book.link, '_blank')}>
                <div 
                    className="book-cover-preview"
                    style={{ 
                        background: book.coverUrl ? `url(${book.coverUrl}) center/cover` : gradients[index % gradients.length] 
                    }}
                >
                    {!book.coverUrl && <span className="book-initial">{book.title?.charAt(0)}</span>}
                    <div className="delete-badge" onClick={(e) => handleDelete(book.id, e)}>
                        <FaTrash />
                    </div>
                </div>
                <div className="book-details">
                    <h4>{book.title}</h4>
                    <p>{book.author || "Unknown Author"}</p>
                    <span className="book-sub-tag">{book.subject || "General"}</span>
                </div>
            </div>
        ))}
      </div>

      {/* UPLOAD MODAL */}
      {showModal && (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-header">
                    <h3>Upload Book</h3>
                    <FaTimes onClick={() => setShowModal(false)} />
                </div>
                
                <form onSubmit={handleAddBook}>
                    
                    {/* Image Upload Area */}
                    <div 
                        className="cover-upload-area" 
                        onClick={() => fileInputRef.current.click()}
                        style={{
                            height: '120px', 
                            background: '#f8fafc', 
                            border: '2px dashed #cbd5e1', 
                            borderRadius: '12px',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            marginBottom: '15px',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                    >
                        {coverPreview ? (
                            <img src={coverPreview} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                        ) : (
                            <div style={{textAlign:'center', color:'#64748b'}}>
                                <FaImage size={24} />
                                <p style={{margin:'5px 0 0', fontSize:'0.8rem'}}>Tap to Upload Cover</p>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                    </div>

                    <div className="input-group">
                        <FaBook className="input-icon"/>
                        <input placeholder="Book Title" value={title} onChange={e=>setTitle(e.target.value)} required />
                    </div>
                    
                    <div className="input-group">
                        <FaLink className="input-icon"/>
                        <input placeholder="PDF Drive Link" value={link} onChange={e=>setLink(e.target.value)} required />
                    </div>
                    
                    <div className="row-inputs">
                        <input placeholder="Author Name" value={author} onChange={e=>setAuthor(e.target.value)} />
                        <input placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} />
                    </div>
                    
                    <button type="submit" className="upload-btn" disabled={uploading}>
                        {uploading ? "Uploading..." : <><FaCloudUploadAlt /> Add to Library</>}
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default ManageBooks;