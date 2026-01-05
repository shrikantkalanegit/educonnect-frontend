import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- 1. AUTH COMPONENTS ---
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import AdminLogin from "./components/AdminLogin/AdminLogin";

// --- 2. STUDENT COMPONENTS ---
// 👇 Corrected Imports based on your structure
import HomePage from './components/HomePage/HomePage'; 
import BooksPage from './components/BooksPage/BooksPage'; 
import SubjectList from './components/SubjectPage/SubjectList';
import StudentProfile from './components/StudentProfile/StudentProfile';
import StudentScanner from "./components/Student/StudentScanner";
import GroupChatPage from './components/SubjectPage/GroupChatPage'; 
import StudentCommunity from './components/Community/StudentCommunity';

// 👇 NEW FILE (Ise create karna padega, niche instruction hai)
import StudentExams from "./components/HomePage/StudentExams";

// --- 3. ADMIN COMPONENTS ---
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import AdminProfile from "./components/AdminDashboard/AdminProfile";
import ManageBooks from "./components/AdminDashboard/ManageBooks"; 
import ExamPortal from "./components/AdminDashboard/ExamPortal";   
import AdminAttendance from "./components/AdminDashboard/AdminAttendance";
import StudentList from "./components/AdminDashboard/StudentList";
import AdminAI from "./components/AdminDashboard/AdminAI";
import ClassSelection from './components/ClassSelection/ClassSelection';
import ManageSubjects from './components/ClassSelection/ManageSubjects';
import StaffRoom from './components/AdminDashboard/StaffRoom';
import CommunitySelection from './components/Community/CommunitySelection';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          
          {/* ==============================
              AUTHENTICATION
          ============================== */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* ==============================
              STUDENT ROUTES
          ============================== */}
          {/* 👇 Main Dashboard (HomePage) */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/homepage" element={<HomePage />} /> {/* Duplicate path support */}

          {/* Features */}
          <Route path="/books" element={<BooksPage />} />
          <Route path="/papers" element={<StudentExams />} /> {/* Exam Portal */}
          <Route path="/subject" element={<SubjectList />} />
          <Route path="/subject/:subjectName" element={<GroupChatPage />} />
          <Route path="/community" element={<StudentCommunity />} />
          
          {/* Profile & Tools */}
          <Route path="/student-profile" element={<StudentProfile />} />
          <Route path="/student/scan" element={<StudentScanner />} />


          {/* ==============================
              ADMIN ROUTES
          ============================== */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/profile" element={<AdminProfile />} />

          {/* New Modules */}
          <Route path="/admin/manage-books" element={<ManageBooks />} />
          <Route path="/admin/exams" element={<ExamPortal />} />
          
          {/* Management */}
          <Route path="/admin/students-list" element={<StudentList />} />
          <Route path="/admin/attendance" element={<AdminAttendance />} />
          <Route path="/admin/class-selection" element={<ClassSelection />} />
          <Route path="/admin/manage-subjects/:yearId" element={<ManageSubjects />} />
          <Route path="/admin/community-selection" element={<CommunitySelection />} />
          
          {/* Tools */}
          <Route path="/admin/ai" element={<AdminAI />} />
          <Route path="/admin/staff-community" element={<StaffRoom />} />
          
          {/* Admin Chat View */}
          <Route path="/admin/chat/:subjectName" element={<GroupChatPage isAdmin={true} />} />


          {/* ==============================
              PLACEHOLDERS
          ============================== */}
          <Route path="/notifications" element={<h2 style={{textAlign:'center', marginTop:'50px'}}>Notifications Coming Soon... 🔔</h2>} />
          <Route path="/admin/ai-tools" element={<h2 style={{textAlign:'center', marginTop:'50px'}}>AI Tools Coming Soon... 🤖</h2>} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;