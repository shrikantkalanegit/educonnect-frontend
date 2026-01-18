import React from 'react';
//....ready
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- 1. AUTH COMPONENTS (Public) ---
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import AdminLogin from "./components/AdminLogin/AdminLogin";

// --- 2. STUDENT COMPONENTS ---
import HomePage from './components/HomePage/HomePage'; 
import BooksPage from './components/BooksPage/BooksPage'; 
// import SubjectList from './components/ClassSelection/SubjectList';
import SubjectPage from './components/SubjectPage/SubjectPage';
import StudentProfile from './components/StudentProfile/StudentProfile';
import StudentScanner from "./components/Student/StudentScanner";
import GroupChatPage from './components/SubjectPage/GroupChatPage'; 
import StudentCommunity from './components/Community/StudentCommunity';
import StudentExams from "./components/HomePage/StudentExams";

// --- 3. ADMIN COMPONENTS ---
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import AdminProfile from "./components/AdminDashboard/AdminProfile";
import AdminDeptSelection from "./components/AdminDashboard/AdminDeptSelection";
import AdminStudentManager from "./components/AdminDashboard/AdminStudentManager";
import ManageBooks from "./components/AdminDashboard/ManageBooks"; 
import ExamPortal from "./components/AdminDashboard/ExamPortal";   
import AdminAttendance from "./components/AdminDashboard/AdminAttendance";
import StudentList from "./components/AdminDashboard/StudentList";
import AdminAI from "./components/AdminDashboard/AdminAI";
import StaffRoom from './components/AdminDashboard/StaffRoom';
import CommunitySelection from './components/Community/CommunitySelection';

// --- CLASSROOM COMPONENTS ---
import AdminClassSelection from "./components/ClassSelection/AdminClassSelection";
import ManageSubjects from "./components/ClassSelection/ManageSubjects";

// 👇 SECURITY COMPONENT IMPORT
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          
          {/* ==============================
              🔓 PUBLIC ROUTES (Open for all)
          ============================== */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* ==============================
              🔒 STUDENT PROTECTED ROUTES
              (Access only if role === 'student')
          ============================== */}
          <Route path="/home" element={
            <ProtectedRoute requiredRole="student"> <HomePage /> </ProtectedRoute>
          } />
          <Route path="/homepage" element={
            <ProtectedRoute requiredRole="student"> <HomePage /> </ProtectedRoute>
          } />
          <Route path="/books" element={
            <ProtectedRoute requiredRole="student"> <BooksPage /> </ProtectedRoute>
          } />
          <Route path="/papers" element={
            <ProtectedRoute requiredRole="student"> <StudentExams /> </ProtectedRoute>
          } />
          <Route path="/subject" element={
            <ProtectedRoute requiredRole="student"> <SubjectPage /> </ProtectedRoute>
          } />
          <Route path="/subject/:subjectName" element={
            <ProtectedRoute requiredRole="student"> <GroupChatPage /> </ProtectedRoute>
          } />
          <Route path="/community" element={
            <ProtectedRoute requiredRole="student"> <StudentCommunity /> </ProtectedRoute>
          } />
          <Route path="/student-profile" element={
            <ProtectedRoute requiredRole="student"> <StudentProfile /> </ProtectedRoute>
          } />
          <Route path="/student/scan" element={
            <ProtectedRoute requiredRole="student"> <StudentScanner /> </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute requiredRole="student"> 
              <h2 style={{textAlign:'center', marginTop:'50px'}}>Notifications Coming Soon... 🔔</h2> 
            </ProtectedRoute>
          } />

          {/* ==============================
              🛡️ ADMIN PROTECTED ROUTES
              (Access only if role === 'admin')
          ============================== */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute requiredRole="admin"> <AdminDashboard /> </ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute requiredRole="admin"> <AdminProfile /> </ProtectedRoute>
          } />
          <Route path="/admin/select-dept" element={
            <ProtectedRoute requiredRole="admin"> <AdminDeptSelection /> </ProtectedRoute>
          } />
          
          {/* Note: Students List ke liye aapne do alag components banaye the, 
              maine alag paths de diye hain taaki conflict na ho */}
          <Route path="/admin/manage-access" element={
            <ProtectedRoute requiredRole="admin"> <AdminStudentManager /> </ProtectedRoute>
          } />
          <Route path="/admin/students-list" element={
            <ProtectedRoute requiredRole="admin"> <StudentList /> </ProtectedRoute>
          } />

          <Route path="/admin/manage-books" element={
            <ProtectedRoute requiredRole="admin"> <ManageBooks /> </ProtectedRoute>
          } />
          <Route path="/admin/exams" element={
            <ProtectedRoute requiredRole="admin"> <ExamPortal /> </ProtectedRoute>
          } />
          <Route path="/admin/attendance" element={
            <ProtectedRoute requiredRole="admin"> <AdminAttendance /> </ProtectedRoute>
          } />
          
          {/* Classroom & Subjects */}
          <Route path="/admin/class-selection" element={
            <ProtectedRoute requiredRole="admin"> <AdminClassSelection /> </ProtectedRoute>
          } />
          <Route path="/admin/manage-subjects/:yearId" element={
            <ProtectedRoute requiredRole="admin"> <ManageSubjects /> </ProtectedRoute>
          } />
          
          {/* Community & Tools */}
          <Route path="/admin/community-selection" element={
            <ProtectedRoute requiredRole="admin"> <CommunitySelection /> </ProtectedRoute>
          } />
          <Route path="/admin/ai" element={
            <ProtectedRoute requiredRole="admin"> <AdminAI /> </ProtectedRoute>
          } />
          <Route path="/admin/staff-community" element={
            <ProtectedRoute requiredRole="admin"> <StaffRoom /> </ProtectedRoute>
          } />
          <Route path="/admin/chat/:subjectName" element={
            <ProtectedRoute requiredRole="admin"> <GroupChatPage isAdmin={true} /> </ProtectedRoute>
          } />
          <Route path="/admin/ai-tools" element={
            <ProtectedRoute requiredRole="admin"> 
              <h2 style={{textAlign:'center', marginTop:'50px'}}>AI Tools Coming Soon... 🤖</h2> 
            </ProtectedRoute>
          } />

        </Routes>
      </div>
    </Router>
  );
}

export default App;