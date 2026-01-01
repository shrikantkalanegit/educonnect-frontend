import React, { useEffect, useState } from "react";
import "./SubjectList.css";
import Navbar from "../Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { FaBookReader, FaComments, FaArrowRight, FaSearch } from "react-icons/fa";
import { db } from "../../firebase"; 
import { collection, query, where, getDocs } from "firebase/firestore";

const SubjectList = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentYear, setStudentYear] = useState("");

  useEffect(() => {
    const fetchStudentSubjects = async () => {
      // 1. Student ka Year nikalo (Jo Login ke waqt save kiya tha)
      const storedYear = localStorage.getItem("userYear"); // e.g., "1st Year"
      setStudentYear(storedYear || "Unknown Year");

      if (!storedYear) {
        alert("⚠️ User Year not found! Please login again.");
        setLoading(false);
        return;
      }

      // 2. Year Format Convert Karo (Matching ke liye)
      // Student "1st Year" bolta hai, par Admin "1st-year" save karta hai.
      let dbYearFormat = storedYear.toLowerCase().replace(" ", "-"); 
      // Example: "1st Year" -> "1st-year"
      
      try {
        // 3. Database se Query karo
        const q = query(
          collection(db, "subjects"), 
          where("year", "==", dbYearFormat) // Sirf student ke year wale subjects
        );

        const querySnapshot = await getDocs(q);
        const fetchedSubjects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSubjects(fetchedSubjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentSubjects();
  }, []);

  return (
    <>
      <Navbar />
      
      <div className="subject-page-container">
        
        {/* Header Section */}
        <div className="subject-header">
          <h1>My Classrooms 🎓</h1>
          <p>Showing groups for <strong>{studentYear}</strong></p>
        </div>

        {/* Loading State */}
        {loading && <p className="loading-text">Loading your classes...</p>}

        {/* Subjects Grid */}
        {!loading && (
          <div className="subject-grid">
            {subjects.length > 0 ? (
              subjects.map((sub) => (
                <div key={sub.id} className="subject-card">
                  
                  <div className="card-icon-bg">
                    <FaBookReader />
                  </div>
                  
                  <div className="card-info">
                    <h3>{sub.name}</h3>
                    <p>Join discussion & notes</p>
                  </div>

                  <button 
                    className="join-btn" 
                    onClick={() => navigate(`/subject/${sub.name}`)}
                  >
                    Enter Class <FaArrowRight />
                  </button>
                  
                </div>
              ))
            ) : (
              <div className="no-classes">
                <h3>No classes found! 😕</h3>
                <p>Admin hasn't created any groups for {studentYear} yet.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
};

export default SubjectList;