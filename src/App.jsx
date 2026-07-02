import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { TeacherRoute, StudentRoute } from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import TeacherAuth from './pages/TeacherAuth';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentLogin from './pages/StudentLogin';
import StudentHome from './pages/StudentHome';
import QuizHub from './pages/QuizHub';

import './index.css';

function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [studentSession, setStudentSession] = useState(() => {
    const saved = sessionStorage.getItem('student_session');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleStudentLogin = (session) => {
    setStudentSession(session);
  };

  const handleStudentLogout = () => {
    sessionStorage.removeItem('student_session');
    setStudentSession(null);
  };

  const handleTeacherLogout = async () => {
    await signOut(auth);
  };

  return (
    <Router>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Teacher Auth */}
        <Route path="/teacher-auth" element={
          firebaseUser ? <Navigate to="/teacher-dashboard" replace /> : <TeacherAuth />
        } />

        {/* Teacher Dashboard (protected) */}
        <Route path="/teacher-dashboard" element={
          <TeacherRoute user={firebaseUser} loading={authLoading}>
            <TeacherDashboard user={firebaseUser} onLogout={handleTeacherLogout} />
          </TeacherRoute>
        } />

        {/* Student Login */}
        <Route path="/student-login" element={
          studentSession ? <Navigate to="/student-home" replace /> : <StudentLogin onStudentLogin={handleStudentLogin} />
        } />

        {/* Student Home (protected) */}
        <Route path="/student-home" element={
          <StudentRoute studentSession={studentSession}>
            <StudentHome studentSession={studentSession} onLogout={handleStudentLogout} />
          </StudentRoute>
        } />

        {/* Quiz (student protected) */}
        <Route path="/quiz" element={
          <StudentRoute studentSession={studentSession}>
            <QuizHub studentSession={studentSession} />
          </StudentRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
