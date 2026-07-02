import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ClassTimerBoard from './pages/ClassTimerBoard';
import StudentHome from './pages/StudentHome';
import QuizHub from './pages/QuizHub';
import TeacherDashboard from './pages/TeacherDashboard';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './services/firebase';
import './index.css';

function App() {
  const [xp, setXp] = useState(350);
  const [students, setStudents] = useState(Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: i === 0 ? '지민' : `${i + 1}번 학생`,
    seconds: 0,
    isRunning: false,
  })));
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        const xpSnap = await getDoc(doc(db, 'global', 'xpData'));
        if (xpSnap.exists()) setXp(xpSnap.data().value);
        
        const timerSnap = await getDoc(doc(db, 'global', 'timerData'));
        if (timerSnap.exists()) {
          const parsed = timerSnap.data().students;
          setStudents(parsed.map(st => ({ ...st, isRunning: false })));
        }
      } catch (e) {
        console.error("Firebase load error:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Persist state to Firebase
  useEffect(() => {
    if (!isLoaded) return;
    setDoc(doc(db, 'global', 'xpData'), { value: xp });
  }, [xp, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    setDoc(doc(db, 'global', 'timerData'), { students });
  }, [students, isLoaded]);

  // Tick active timers globally
  useEffect(() => {
    const interval = setInterval(() => {
      setStudents(prev => {
        const nextStudents = prev.map(st => 
          st.isRunning ? { ...st, seconds: st.seconds + 1 } : st
        );
        
        // 지민(id: 1)의 타이머가 실행 중이고, 60초(1분)가 경과할 때마다 경험치(XP) 1 증가
        const jimin = nextStudents.find(st => st.id === 1);
        if (jimin && jimin.isRunning && jimin.seconds > 0 && jimin.seconds % 60 === 0) {
          setXp(currentXp => currentXp + 1); // 1분당 1 XP 획득
        }
        
        return nextStudents;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="app-container">
        <nav style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/" style={{ fontWeight: 600 }}>학생 홈</Link>
          <Link to="/quiz" style={{ fontWeight: 600 }}>독서 퀴즈 허브</Link>
          <Link to="/timer" style={{ fontWeight: 600 }}>학급 타이머 보드</Link>
          <Link to="/teacher" style={{ fontWeight: 600, marginLeft: 'auto', color: 'var(--secondary)' }}>교사 대시보드</Link>
        </nav>
        <Routes>
          <Route path="/" element={<StudentHome xp={xp} setXp={setXp} />} />
          <Route path="/timer" element={<ClassTimerBoard students={students} setStudents={setStudents} setXp={setXp} />} />
          <Route path="/quiz" element={<QuizHub setXp={setXp} />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
