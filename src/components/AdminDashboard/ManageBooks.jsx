import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTrash, FaPlus, FaBook, FaCloudUploadAlt, FaTimes, FaLink } from "react-icons/fa";
import { realtimeDb as db } from "../../firebase";
import { ref, push, onValue, remove } from "firebase/database";
import "./ManageBooks.css"; 

const ManageBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Form States
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [link, setLink] = useState(""); 
  const [cover, setCover] = useState(""); 

  // Gradients for Book Covers (agar image na ho)
  const gradients = [
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
  ];

  // 1. Load Books
  useEffect(() => {
    const booksRef = ref(db, 'library_books');
    onValue(booksRef, (snapshot) => {
      const data = snapshot.val();
      const loadedBooks = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
      setBooks(loadedBooks);
    });
  }, []);

  // 2. Add Book Function
  const handleAddBook = async (e) => {
    e.preventDefault();
    if(!title || !link) return alert("Title and PDF Link are required!");

    const newBook = {
        title, author, subject, link, cover,
        uploadedAt: new Date().toLocaleDateString()
    };

    await push(ref(db, 'library_books'), newBook);
    setShowModal(false);
    // Reset Form
    setTitle(""); setAuthor(""); setSubject(""); setLink(""); setCover("");
  };

  // 3. Delete Function
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if(window.confirm("Delete this book permanently?")) {
        await remove(ref(db, `library_books/${id}`));
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
        
        {/* 1. ADD NEW BUTTON */}
        <div className="book-card add-card" onClick={() => setShowModal(true)}>
            <div className="add-icon-circle"><FaPlus /></div>
            <h3>Add New Book</h3>
        </div>

        {/* 2. BOOK CARDS */}
        {books.map((book, index) => (
            <div key={book.id} className="book-card" onClick={() => window.open(book.link, '_blank')}>
                <div 
                    className="book-cover-preview"
                    style={{ background: book.cover ? `url(${book.cover}) center/cover` : gradients[index % gradients.length] }}
                >
                    {!book.cover && <span className="book-initial">{book.title.charAt(0)}</span>}
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
                    <input className="full-input" placeholder="Cover Image URL (Optional)" value={cover} onChange={e=>setCover(e.target.value)} />
                    
                    <button type="submit" className="upload-btn">
                        <FaCloudUploadAlt /> Add to Library
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default ManageBooks;