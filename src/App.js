import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- 1. Auth Components (Login/Register) ---
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
// import RegisterPage from "./components/LoginPage/RegisterPage";
import AdminLogin from "./components/AdminLogin/AdminLogin";

// --- 2. Student Components ---
import HomePage from './components/HomePage/HomePage';
import SubjectList from './components/SubjectPage/SubjectList';
import StudentProfile from './components/StudentProfile/StudentProfile';
import StudentScanner from "./components/Student/StudentScanner";
// import Navbar from './components/Navbar/Navbar'; 
import SubjectPage from './components/SubjectPage/SubjectPage';
import BooksPage from './components/BooksPage/BooksPage';
import GroupChatPage from './components/SubjectPage/GroupChatPage'; // Chat Page
import StudentCommunity from './components/Community/StudentCommunity';

// --- 3. Admin Components ---
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import ClassSelection from './components/ClassSelection/ClassSelection';
import ManageSubjects from './components/ClassSelection/ManageSubjects';
import StaffRoom from './components/AdminDashboard/StaffRoom';
import CommunitySelection from './components/Community/CommunitySelection';
import AdminAI from "./components/AdminDashboard/AdminAI";
//Administrator Profile 
import AdminProfile from "./components/AdminDashboard/AdminProfile";
import StudentList from "./components/AdminDashboard/StudentList";
// import AdminAttendance from "./components/Admin/AdminAttendance";
// 👇 App.js me path aise change karein
import AdminAttendance from "./components/AdminDashboard/AdminAttendance";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          
          {/* ==============================
              AUTHENTICATION ROUTES
          ============================== */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* <Route path="/register" element={<RegisterPage />} /> */}
          <Route path="/admin-login" element={<AdminLogin />} />


          {/* ==============================
              STUDENT ROUTES
          ============================== */}
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/subject" element={<SubjectList />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/student-profile" element={<StudentProfile />} />
          <Route path="/student/scan" element={<StudentScanner />} />
          
          {/* Student Chat (URL example: /subject/java) */}
          <Route path="/subject/:subjectName" element={<GroupChatPage />} />


          {/* ==============================
              ADMIN ROUTES
          ============================== */}
          {/* 1. Main Dashboard */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />

          {/* 2. Class Management Flow */}
          <Route path="/admin/class-selection" element={<ClassSelection />} />
          <Route path="/admin/manage-subjects/:yearId" element={<ManageSubjects />} />
          
          {/* 3. Community Flow (New) */}
          <Route path="/admin/community-selection" element={<CommunitySelection />} />

          {/* 4. Staff Room (VIP Chat) */}
          <Route path="/admin/staff-community" element={<StaffRoom />} />

          {/* 5. Admin Chat Access (Reusable Chat Page) */}
          {/* isAdmin={true} pass karne se page ko pata chalta hai ki Admin aaya hai */}
          <Route path="/admin/chat/:subjectName" element={<GroupChatPage isAdmin={true} />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/students-list" element={<StudentList />} />
          {/* <Route path="/admin/attendance" element={<AdminAttendance />} /> */}
          <Route path="/admin/attendance" element={<AdminAttendance />} />
          <Route path="/admin/ai" element={<AdminAI />} />


          {/* ==============================
              PLACEHOLDERS (Coming Soon)
          ============================== */}
          <Route path="/community" element={<StudentCommunity />} />
          <Route path="/papers" element={<h2 style={{textAlign:'center', marginTop:'50px'}}>Exam Papers Coming Soon... 📄</h2>} />
          <Route path="/profile" element={<h2 style={{textAlign:'center', marginTop:'50px'}}>User Profile Coming Soon... 👤</h2>} />
          <Route path="/notifications" element={<h2 style={{textAlign:'center', marginTop:'50px'}}>Notifications Coming Soon... 🔔</h2>} />
          <Route path="/admin/ai-tools" element={<h2 style={{textAlign:'center', marginTop:'50px'}}>AI Tools Coming Soon... 🤖</h2>} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;