import React, { useState, useEffect } from "react";
import "./ManageBooks.css"; 
import { FaArrowLeft, FaTrash, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Firebase
import { realtimeDb as db } from "../../firebase";
import { ref, push, onValue, remove } from "firebase/database";

const ManageBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  
  // Form States
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [link, setLink] = useState(""); 
  const [cover, setCover] = useState(""); 

  // 1. Load Books
  useEffect(() => {
    const booksRef = ref(db, 'library_books');
    onValue(booksRef, (snapshot) => {
      const data = snapshot.val();
      const loadedBooks = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
      setBooks(loadedBooks);
    });
  }, []);

  // 2. Add Book
  const handleAddBook = async (e) => {
    e.preventDefault();
    if(!title || !link) return alert("Title and PDF Link are required!");

    const newBook = {
        title, author, subject, link,
        cover: cover || `https://placehold.co/400x600/2563eb/fff?text=${title.slice(0,10)}`,
        rating: "4.5"
    };

    await push(ref(db, 'library_books'), newBook);
    alert("Book Added Successfully!");
    setTitle(""); setAuthor(""); setSubject(""); setLink(""); setCover("");
  };

  // 3. Delete Book
  const handleDelete = async (id) => {
    if(window.confirm("Delete this book?")) {
        await remove(ref(db, `library_books/${id}`));
    }
  };

  return (
    <div className="manage-container">
      <header className="manage-header">
        <button onClick={() => navigate('/admin-dashboard')}><FaArrowLeft /></button>
        <h2>Manage Library</h2>
      </header>

      <div className="manage-content">
        
        {/* ADD BOOK FORM */}
        <div className="add-book-form">
            <h3><FaPlus /> Add New Book</h3>
            <form onSubmit={handleAddBook}>
                <input placeholder="Book Title" value={title} onChange={e=>setTitle(e.target.value)} required />
                <input placeholder="Author" value={author} onChange={e=>setAuthor(e.target.value)} />
                <input placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} />
                <input placeholder="PDF Link (Drive/URL)" value={link} onChange={e=>setLink(e.target.value)} required />
                <input placeholder="Cover Image URL (Optional)" value={cover} onChange={e=>setCover(e.target.value)} />
                <button type="submit" className="add-btn">Upload Book</button>
            </form>
        </div>

        {/* BOOK LIST */}
        <div className="book-list-section">
            <h3>📚 Current Books ({books.length})</h3>
            <div className="admin-book-grid">
                {books.map(book => (
                    <div key={book.id} className="mini-book-card">
                        <img src={book.cover} alt="cover" />
                        <div className="mini-info">
                            <h4>{book.title}</h4>
                            <p>{book.author}</p>
                            <a href={book.link} target="_blank" rel="noreferrer" className="link-text">View PDF</a>
                        </div>
                        <button className="delete-btn" onClick={() => handleDelete(book.id)}>
                            <FaTrash />
                        </button>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default ManageBooks;