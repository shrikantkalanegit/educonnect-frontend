import React, { useState } from "react";
import "./BooksPage.css";
import Navbar from "../Navbar/Navbar"; 
import { FaSearch, FaBookOpen, FaDownload, FaStar, FaBookmark, FaBook } from "react-icons/fa";

const BooksPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // 📚 FIXED DATA (Ab Images aur PDF Links 100% chalenge)
  const booksData = [
    { 
      id: 1, 
      title: "Core Java: Fundamentals", 
      author: "Cay S. Horstmann", 
      subject: "Java", 
      rating: "4.8",
      // 👇 Reliable Image Link
      cover: "https://placehold.co/400x600/2c3e50/fff?text=Java+Book",
      // 👇 Sample Working PDF Link (Testing ke liye)
      link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" 
    },
    { 
      id: 2, 
      title: "Data Structures & Algo", 
      author: "Narasimha Karumanchi", 
      subject: "DSA", 
      rating: "4.9",
      cover: "https://placehold.co/400x600/e74c3c/fff?text=DSA+Algo",
      link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    { 
      id: 3, 
      title: "React JS: Up & Running", 
      author: "Stoyan Stefanov", 
      subject: "Web Dev", 
      rating: "4.7",
      cover: "https://placehold.co/400x600/61dafb/000?text=React+JS",
      link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    { 
      id: 4, 
      title: "Operating System Concepts", 
      author: "Abraham Silberschatz", 
      subject: "OS", 
      rating: "4.5",
      cover: "https://placehold.co/400x600/f1c40f/000?text=OS+Concepts",
      link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    { 
      id: 5, 
      title: "Clean Code", 
      author: "Robert C. Martin", 
      subject: "Software Eng.", 
      rating: "5.0", 
      cover: "https://placehold.co/400x600/8e44ad/fff?text=Clean+Code",
      link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    { 
      id: 6, 
      title: "Database System Concepts", 
      author: "Korth & Sudarshan", 
      subject: "DBMS", 
      rating: "4.6", 
      cover: "https://placehold.co/400x600/27ae60/fff?text=DBMS",
      link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    }
  ];

  const filteredBooks = booksData.filter((book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🟢 FUNCTION: Open PDF
  const handleOpenBook = (url) => {
    if (url && url !== "#") {
        window.open(url, "_blank"); // New Tab mein PDF kholega
    } else {
        alert("⚠️ This book file is not uploaded yet.");
    }
  };

  // 🔴 FUNCTION: Agar Image Fail ho jaye to Fallback dikhaye
  const handleImageError = (e) => {
    e.target.src = "https://placehold.co/400x600/ccc/555?text=No+Cover";
  };

  return (
    <>
      <Navbar />

      <div className="library-wrapper">
        <div className="library-header">
          <div className="header-text">
            <h1>Digital Library 📚</h1>
            <p>Read official books instantly.</p>
          </div>
          
          <div className="lib-search-box">
            <FaSearch className="lib-search-icon" />
            <input 
              type="text" 
              placeholder="Search books..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="lib-grid">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <div key={book.id} className="lib-card">
                
                <div className="lib-cover">
                  {/* Image with Error Handling */}
                  <img 
                    src={book.cover} 
                    alt={book.title} 
                    onError={handleImageError} 
                  />
                  <div className="rating-pill">
                    <FaStar className="star-icon" /> {book.rating}
                  </div>
                </div>
                
                <div className="lib-info">
                  <span className="lib-subject">{book.subject}</span>
                  <h3 title={book.title}>{book.title}</h3>
                  <p className="lib-author">By {book.author}</p>
                  
                  <div className="lib-actions">
                    <button className="btn-read" onClick={() => handleOpenBook(book.link)}>
                       <FaBookOpen /> Read PDF
                    </button>
                    <button className="btn-save" title="Download">
                       <FaDownload />
                    </button>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="lib-no-results">
              <h3>No books found matching "{searchTerm}"</h3>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default BooksPage;