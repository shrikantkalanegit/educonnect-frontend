import React, { useState } from "react";
import "./BooksPage.css";
import Navbar from "../Navbar/Navbar"; 
import { FaSearch, FaBook, FaExternalLinkAlt, FaDownload } from "react-icons/fa";

const BooksPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // --- 📚 REAL BOOKS DATA ---
  // Yahan "link" mein aap apni PDF ki URL daalein
  const booksData = [
    { 
      id: 1, 
      title: "Core Java Complete", 
      author: "Horstmann", 
      subject: "Java", 
      size: "12 MB",
      // Sample PDF Link (Testing ke liye)
      link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" 
    },
    { 
      id: 2, 
      title: "Data Structures (DSA)", 
      author: "Robert Lafore", 
      subject: "DSA", 
      size: "15 MB",
      link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    { 
      id: 3, 
      title: "React JS Handbook", 
      author: "Facebook Team", 
      subject: "Web Dev", 
      size: "5 MB",
      link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    { 
      id: 4, 
      title: "Operating System Concepts", 
      author: "Galvin", 
      subject: "OS", 
      size: "22 MB",
      link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
  ];

  // --- FILTER LOGIC ---
  const filteredBooks = booksData.filter((book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- 🟢 OPEN BOOK FUNCTION ---
  const handleOpenBook = (url) => {
    if (url) {
      window.open(url, "_blank"); // New Tab mein khulega
    } else {
      alert("Link not available yet!");
    }
  };

  return (
    <>
      <Navbar />

      <div className="books-page-container">
        
        {/* HEADER */}
        <div className="books-header">
          <h1>Digital Library 📖</h1>
          <p>Read & Download official study material.</p>
          
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search books (e.g. Java, DSA)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* BOOKS GRID */}
        <div className="books-grid">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <div key={book.id} className="book-card">
                
                <div className="book-cover">
                  <FaBook className="cover-icon" />
                </div>
                
                <div className="book-info">
                  <span className="subject-tag">{book.subject}</span>
                  <h3>{book.title}</h3>
                  <p className="author">By {book.author}</p>
                </div>

                <div className="book-footer">
                  <span className="file-size">{book.size}</span>
                  
                  {/* 👇 YE BUTTON AB KAAM KAREGA */}
                  <button className="read-btn" onClick={() => handleOpenBook(book.link)}>
                    <FaExternalLinkAlt /> Open / Download
                  </button>
                </div>

              </div>
            ))
          ) : (
            <div className="no-results">
              <h3>No books found.</h3>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default BooksPage;