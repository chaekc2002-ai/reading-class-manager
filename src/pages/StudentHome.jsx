import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Star, BookOpen, Clock, ChevronRight, LogOut, Play, Square } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import BookSearchModal from '../components/BookSearchModal';
import './StudentHome.css';

function StudentHome({ studentSession, onLogout }) {
  const navigate = useNavigate();
  const { studentId, name, className } = studentSession || {};

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [books, setBooks] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Personal timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const XP_PER_LEVEL = 500;
  const currentXp = xp % XP_PER_LEVEL;
  const progress = (currentXp / XP_PER_LEVEL) * 100;

  // Load student data from Firestore
  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'students', studentId));
        if (snap.exists()) {
          const data = snap.data();
          setXp(data.xp || 0);
          setLevel(data.level || 1);
          setBooks(data.books || []);
        }
      } catch (e) { console.error(e); }
      finally { setIsLoaded(true); }
    };
    load();
  }, [studentId]);

  // Persist XP & books to Firestore
  useEffect(() => {
    if (!isLoaded || !studentId) return;
    const newLevel = Math.floor(xp / XP_PER_LEVEL) + 1;
    setLevel(newLevel);
    updateDoc(doc(db, 'students', studentId), { xp, level: newLevel, books }).catch(console.error);
  }, [xp, books, isLoaded]);

  // Personal timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const handleTimerStop = () => {
    setTimerRunning(false);
    const minutesRead = Math.floor(timerSeconds / 60);
    if (minutesRead > 0) {
      setXp(prev => prev + minutesRead);
    }
    setTimerSeconds(0);
  };

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSaveBook = (bookData) => {
    setBooks(prev => [{ ...bookData, id: Date.now() }, ...prev]);
    setXp(prev => prev + 50);
  };

  const handleLogout = () => {
    if (timerRunning) handleTimerStop();
    onLogout();
    navigate('/');
  };

  return (
    <div className="student-home animate-fade-in">
      {/* Header */}
      <header className="sh-header">
        <div>
          <h2>안녕, <strong className="highlight">{name}</strong> 학생! 👋</h2>
          <p className="subtitle">📚 {className}</p>
        </div>
        <button className="btn-logout-student" onClick={handleLogout}>
          <LogOut size={16} /> 로그아웃
        </button>
      </header>

      {/* Profile + XP */}
      <section className="profile-section">
        <div className="level-badge">
          <Star className="star-icon" fill="currentColor" size={24} />
          <span>LV. {level}</span>
        </div>
        <div className="xp-section" style={{ flex: 1 }}>
          <div className="xp-header">
            <span className="xp-title">경험치</span>
            <span className="xp-text">{currentXp} / {XP_PER_LEVEL} XP</span>
          </div>
          <div className="progress-bg">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="xp-hint">다음 레벨까지 <strong>{XP_PER_LEVEL - currentXp} XP</strong> 남았어요!</p>
        </div>
      </section>

      {/* Personal Timer */}
      <section className="personal-timer-section">
        <div className="timer-card">
          <div className="timer-label">
            <Clock size={18} />
            <span>개인 독서 타이머 <em>(1분 = +1 XP)</em></span>
          </div>
          <div className="timer-display">{formatTime(timerSeconds)}</div>
          <div className="timer-controls">
            {!timerRunning ? (
              <button className="btn-timer-start" onClick={() => setTimerRunning(true)}>
                <Play size={18} /> 시작
              </button>
            ) : (
              <button className="btn-timer-stop" onClick={handleTimerStop}>
                <Square size={18} /> 정지 및 저장
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="actions-section">
        <button className="action-btn primary" onClick={() => setIsModalOpen(true)}>
          <PlusCircle size={28} />
          <span className="btn-text">새로운 책 기록하기</span>
          <span className="btn-subtext">+50 XP</span>
        </button>
        <Link to="/quiz" className="action-btn secondary" style={{ textDecoration: 'none' }}>
          <BookOpen size={28} />
          <span className="btn-text">독서 퀴즈 풀기</span>
          <span className="btn-subtext">+20 XP</span>
        </Link>
      </section>

      {/* Recent Books */}
      <section className="books-section">
        <div className="section-header">
          <h3>내가 읽은 책 <span className="count">{books.length}</span></h3>
          <button className="btn-more">전체보기 <ChevronRight size={16} /></button>
        </div>
        {books.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} className="empty-icon" />
            <p>아직 기록한 책이 없어요.<br />첫 번째 책을 등록해 보세요!</p>
          </div>
        ) : (
          <div className="books-grid">
            {books.map((b) => (
              <div className="book-card" key={b.id}>
                <img src={b.cover} alt={b.title} className="book-card-cover" />
                <div className="book-card-info">
                  <h4 className="book-card-title">{b.title}</h4>
                  <div className="book-meta">
                    <span className="meta-item"><Clock size={14} /> {b.readTime}분</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <BookSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBook}
      />
    </div>
  );
}

export default StudentHome;
