import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaBookOpen, FaDownload, FaArrowLeft, FaBook } from "react-icons/fa";
import { db } from "../../firebase"; 
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import "./BooksPage.css";

const BooksPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState([]); // 🔥 No Demo Data
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch Books from Firestore
  useEffect(() => {
    const q = query(collection(db, "library_books"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBooks(fetchedBooks);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenBook = (url) => {
    if (url) window.open(url, "_blank");
    else alert("⚠️ Book file unavailable.");
  };

  return (
    <div className="lib-wrapper-ios">
      
      {/* HEADER */}
      <header className="lib-header-glass">
        <button className="back-btn-glass" onClick={() => navigate('/home')}>
            <FaArrowLeft />
        </button>
        <div className="header-title-box">
            <h1>Digital Library 📚</h1>
            <p>Access official study resources</p>
        </div>
        <div className="header-spacer"></div> {/* For alignment */}
      </header>

      {/* SEARCH */}
      <div className="lib-search-container">
        <div className="lib-search-box">
            <FaSearch className="search-icon"/>
            <input 
                type="text" 
                placeholder="Search by Title or Subject..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* BOOKS GRID */}
      <div className="lib-content-area">
        {loading ? (
            <div className="loading-state">Loading Library...</div>
        ) : filteredBooks.length > 0 ? (
            <div className="lib-grid-ios">
                {filteredBooks.map((book) => (
                    <div key={book.id} className="lib-card-ios">
                        <div className="lib-cover-box">
                            {/* Agar cover image nahi hai to default icon dikhaye */}
                            {book.coverUrl ? (
                                <img src={book.coverUrl} alt={book.title} />
                            ) : (
                                <div className="no-cover"><FaBook /></div>
                            )}
                            <span className="subject-tag">{book.subject}</span>
                        </div>
                        
                        <div className="lib-info-box">
                            <h3>{book.title}</h3>
                            <p className="author-name">By {book.author}</p>
                            
                            <button className="read-btn-ios" onClick={() => handleOpenBook(book.pdfUrl)}>
                                <FaBookOpen /> Read Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="empty-state-ios">
                <h3>No Books Found 🔍</h3>
                <p>Ask admin to upload books for this subject.</p>
            </div>
        )}
      </div>

    </div>
  );
};

export default BooksPage;