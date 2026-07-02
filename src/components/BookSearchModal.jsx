import React, { useState } from 'react';
import { Search, X, BookOpen, Clock, PenTool } from 'lucide-react';
import './BookSearchModal.css';

const MOCK_BOOKS = [
  { id: 1, title: '어린 왕자', author: '앙투안 드 생텍쥐페리', cover: 'https://via.placeholder.com/80x120?text=Book+1' },
  { id: 2, title: '해리 포터와 마법사의 돌', author: 'J.K. 롤링', cover: 'https://via.placeholder.com/80x120?text=Book+2' },
  { id: 3, title: '나미야 잡화점의 기적', author: '히가시노 게이고', cover: 'https://via.placeholder.com/80x120?text=Book+3' },
];

function BookSearchModal({ isOpen, onClose, onSave }) {
  const [step, setStep] = useState('search'); // 'search' | 'record'
  const [query, setQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  
  // Record states
  const [readTime, setReadTime] = useState('');
  const [review, setReview] = useState('');

  const [results, setResults] = useState(MOCK_BOOKS);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
      const data = await response.json();
      
      if (data.items) {
        const parsed = data.items.map(item => ({
          id: item.id,
          title: item.volumeInfo.title || '제목 없음',
          author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : '작자 미상',
          cover: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : 'https://via.placeholder.com/80x120?text=No+Cover',
        }));
        setResults(parsed);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Failed to fetch books", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setStep('record');
  };

  const handleSave = () => {
    onSave({
      ...selectedBook,
      readTime: parseInt(readTime, 10) || 0,
      review,
      date: new Date().toISOString()
    });
    // Reset and close
    setStep('search');
    setQuery('');
    setResults(MOCK_BOOKS);
    setSelectedBook(null);
    setReadTime('');
    setReview('');
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content">
        <button className="btn-close" onClick={onClose}><X size={24} /></button>
        
        {step === 'search' && (
          <div className="step-search">
            <h2 className="modal-title">어떤 책을 읽었나요?</h2>
            <form className="search-bar" onSubmit={handleSearch}>
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="책 제목을 검색하고 엔터를 누르세요" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </form>

            <div className="search-results">
              <p className="results-title">{query ? '검색 결과' : '추천 도서'}</p>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>검색 중...</div>
              ) : results.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>검색 결과가 없습니다.</div>
              ) : (
                <div className="book-list">
                  {results.map(book => (
                    <div className="book-item" key={book.id} onClick={() => handleSelectBook(book)}>
                      <img src={book.cover} alt={book.title} className="book-cover" />
                      <div className="book-info">
                        <div className="book-title">{book.title}</div>
                        <div className="book-author">{book.author}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'record' && selectedBook && (
          <div className="step-record">
            <h2 className="modal-title">독서 기록 남기기</h2>
            <div className="selected-book-card">
              <img src={selectedBook.cover} alt={selectedBook.title} className="selected-cover" />
              <div className="selected-info">
                <div className="selected-title">{selectedBook.title}</div>
                <div className="selected-author">{selectedBook.author}</div>
              </div>
            </div>

            <div className="record-form">
              <div className="form-group">
                <label><Clock size={18} /> 독서 시간 (분)</label>
                <input 
                  type="number" 
                  placeholder="예: 30" 
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label><PenTool size={18} /> 독서 감상문</label>
                <textarea 
                  placeholder="책을 읽고 느낀 점이나 기억에 남는 문장을 자유롭게 적어보세요!"
                  rows={4}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                ></textarea>
              </div>
              <button className="btn-save" onClick={handleSave}>기록 저장하고 경험치 얻기! 🌟</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookSearchModal;
