import React, { useState } from 'react';
import { PlusCircle, Star, BookOpen, Clock, ChevronRight } from 'lucide-react';
import BookSearchModal from '../components/BookSearchModal';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import './StudentHome.css';

function StudentHome({ xp, setXp }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  React.useEffect(() => {
    const loadBooks = async () => {
      try {
        const snap = await getDoc(doc(db, 'global', 'booksData'));
        if (snap.exists()) {
          setBooks(snap.data().items);
        } else {
          setBooks([
            { id: 99, title: '어린 왕자', author: '앙투안 드 생텍쥐페리', cover: 'https://via.placeholder.com/80x120?text=Book+1', readTime: 120, review: '정말 감동적이다.', date: '2026-07-01' }
          ]);
        }
      } catch (e) {
        console.error("Firebase load books error:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadBooks();
  }, []);

  React.useEffect(() => {
    if (!isLoaded) return;
    setDoc(doc(db, 'global', 'booksData'), { items: books });
  }, [books, isLoaded]);
  
  const xpMax = 500;
  const level = Math.floor(xp / xpMax) + 1;
  const currentXp = xp % xpMax;
  const progress = (currentXp / xpMax) * 100;

  const handleSaveBook = (bookData) => {
    setBooks([{ ...bookData, id: Date.now() }, ...books]);
    // add 50 XP per book record
    setXp(prev => prev + 50);
  };

  return (
    <div className="student-home animate-fade-in">
      {/* Header section */}
      <section className="profile-section">
        <div className="profile-info">
          <h2>안녕, <strong className="highlight">지민</strong> 학생! 👋</h2>
          <p className="subtitle">오늘도 즐거운 독서 시간 가져볼까요?</p>
        </div>
        <div className="level-badge">
          <Star className="star-icon" fill="currentColor" size={24} />
          <span>LV. {level}</span>
        </div>
      </section>

      {/* XP Bar */}
      <section className="xp-section">
        <div className="xp-header">
          <span className="xp-title">내 경험치</span>
          <span className="xp-text">{currentXp} / {xpMax} XP (총 {xp} XP)</span>
        </div>
        <div className="progress-bg">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="xp-hint">다음 레벨까지 <strong>{xpMax - currentXp} XP</strong> 남았어요! 책을 한 권 더 읽어볼까요?</p>
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
            <p>아직 기록한 책이 없어요.<br/>첫 번째 책을 등록해 보세요!</p>
          </div>
        ) : (
          <div className="books-grid">
            {books.map((b) => (
              <div className="book-card" key={b.id}>
                <img src={b.cover} alt={b.title} className="book-card-cover" />
                <div className="book-card-info">
                  <h4 className="book-card-title">{b.title}</h4>
                  <div className="book-meta">
                    <span className="meta-item"><Clock size={14}/> {b.readTime}분</span>
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
