import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../services/firebase';

// ProtectedRoute for teacher (Firebase Auth)
export function TeacherRoute({ user, loading, children }) {
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>로딩 중...</div>;
  if (!user && !auth.currentUser) return <Navigate to="/" replace />;
  return children;
}

// ProtectedRoute for student (sessionStorage)
export function StudentRoute({ studentSession, children }) {
  if (!studentSession) return <Navigate to="/" replace />;
  return children;
}
