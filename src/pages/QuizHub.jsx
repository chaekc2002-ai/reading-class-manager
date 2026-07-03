import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, query, where, getDocs, addDoc, updateDoc, doc, arrayUnion, getDoc, deleteDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  HelpCircle, PlusCircle, CheckCircle, BookOpen, ArrowLeft, Send, Trophy, Settings, Trash2
} from 'lucide-react';
import './QuizHub.css';

function QuizHub({ studentSession }) {
  const navigate = useNavigate();
  const { studentId, name, classId } = studentSession || {};

  const [tab, setTab] = useState('solve'); // 'solve' | 'create'

  // --- Solve tab state ---
  const [quizzes, setQuizzes] = useState([]);
  const [quizLoading, setQuizLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'
  const [submitting, setSubmitting] = useState(false);

  // --- Create tab state ---
  const [myBooks, setMyBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [quizType, setQuizType] = useState('OX'); // 'OX' | '객관식' | '단답형'
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [mcqAnswer, setMcqAnswer] = useState(null); // 0~3 index
  const [creating, setCreating] = useState(false);
  const [createDone, setCreateDone] = useState(false);

  // Load class quizzes
  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      setQuizLoading(true);
      try {
        const q = query(collection(db, 'quizzes'), where('classId', '==', classId));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // 최신순 정렬
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setQuizzes(list);
      } catch (e) { console.error(e); }
      finally { setQuizLoading(false); }
    };
    load();
  }, [classId]);

  // Load my books
  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      setBooksLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'students', studentId));
        if (docSnap.exists()) {
          setMyBooks(docSnap.data().books || []);
        }
      } catch (e) { console.error(e); }
      finally { setBooksLoading(false); }
    };
    load();
  }, [studentId]);

  // 내가 만든 퀴즈 제외한 다른 학생 퀴즈
  const othersQuizzes = quizzes.filter(q => q.authorId !== studentId);
  const myQuizzes = quizzes.filter(q => q.authorId === studentId);
  const solvedQuizzes = othersQuizzes.filter(q => (q.solvedBy || []).includes(studentId));
  const unsolvedQuizzes = othersQuizzes.filter(q => !(q.solvedBy || []).includes(studentId));

  const handleDeleteMyQuiz = async (quizId) => {
    if (!window.confirm("이 퀴즈를 정말 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, 'quizzes', quizId));
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleOpenQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setUserAnswer('');
    setFeedback(null);
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer && userAnswer !== 0) return;
    setSubmitting(true);
    let isCorrect = false;

    if (selectedQuiz.type === 'OX') {
      isCorrect = userAnswer === selectedQuiz.answer;
    } else if (selectedQuiz.type === '객관식') {
      isCorrect = parseInt(userAnswer) === selectedQuiz.answer;
    } else {
      // 단답형: 공백 제거 후 비교
      isCorrect = userAnswer.trim() === selectedQuiz.answer.trim();
    }

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      try {
        // solvedBy 배열에 studentId 추가
        await updateDoc(doc(db, 'quizzes', selectedQuiz.id), {
          solvedBy: arrayUnion(studentId)
        });
        // XP +20 (students 문서 업데이트)
        const studentSnap = await getDoc(doc(db, 'students', studentId));
        if (studentSnap.exists()) {
          const data = studentSnap.data();
          const newXp = (data.xp || 0) + 20;
          const newLevel = Math.floor(newXp / 500) + 1;
          await updateDoc(doc(db, 'students', studentId), { xp: newXp, level: newLevel });
        }
        // 로컬 상태 업데이트
        setQuizzes(prev => prev.map(q =>
          q.id === selectedQuiz.id
            ? { ...q, solvedBy: [...(q.solvedBy || []), studentId] }
            : q
        ));
      } catch (e) { console.error(e); }
      setTimeout(() => {
        setSelectedQuiz(null);
      }, 1800);
    }
    setSubmitting(false);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!selectedBook) {
      alert("퀴즈를 낼 책을 선택해주세요.");
      return;
    }
    if (!question.trim()) {
      alert("질문을 작성해주세요.");
      return;
    }
    if (quizType === '객관식' && options.some(o => !o.trim())) {
      alert("모든 객관식 보기를 입력해주세요.");
      return;
    }
    if (quizType === '객관식' && mcqAnswer === null) {
      alert("객관식 정답 번호를 선택해주세요.");
      return;
    }
    if (quizType !== '객관식' && !answer.trim()) {
      alert("정답을 입력하거나 선택해주세요.");
      return;
    }

    setCreating(true);
    try {
      const quizData = {
        classId: classId || 'unknown',
        authorId: studentId || 'unknown',
        authorName: name || 'unknown',
        bookTitle: selectedBook.title || '',
        bookCover: selectedBook.cover || '',
        type: quizType,
        question: question.trim(),
        solvedBy: [],
        createdAt: new Date().toISOString(),
      };

      if (quizType === 'OX') {
        quizData.answer = answer;
      } else if (quizType === '객관식') {
        quizData.options = options.map(o => o.trim());
        quizData.answer = mcqAnswer;
      } else {
        quizData.answer = answer.trim();
      }

      const ref = await addDoc(collection(db, 'quizzes'), quizData);
      setQuizzes(prev => [{ id: ref.id, ...quizData }, ...prev]);
      setCreateDone(true);

      // 폼 초기화
      setSelectedBook(null);
      setQuestion('');
      setAnswer('');
      setOptions(['', '', '', '']);
      setMcqAnswer(null);
      setQuizType('OX');
      setTimeout(() => setCreateDone(false), 3000);

      // XP +20 (students 문서 업데이트)
      if (studentId) {
        const studentSnap = await getDoc(doc(db, 'students', studentId));
        if (studentSnap.exists()) {
          const data = studentSnap.data();
          const newXp = (data.xp || 0) + 20;
          const newLevel = Math.floor(newXp / 500) + 1;
          await updateDoc(doc(db, 'students', studentId), { xp: newXp, level: newLevel });
        }
      }
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  return (
    <div className="quiz-hub animate-fade-in">
      <header className="hub-header">
        <button className="btn-back-hub" onClick={() => navigate('/student-home')}>
          <ArrowLeft size={18} /> 돌아가기
        </button>
        <div className="hub-title-wrapper">
          <HelpCircle size={28} className="title-icon" />
          <h2>독서 퀴즈 허브</h2>
        </div>
        <p className="hub-sub">친구들의 퀴즈를 풀고, 나만의 퀴즈를 출제해 보세요!</p>
      </header>

      {/* Tabs */}
      <div className="quiz-tabs">
        <button className={tab === 'solve' ? 'active' : ''} onClick={() => setTab('solve')}>
          <Trophy size={16} /> 친구 퀴즈 풀기
          {unsolvedQuizzes.length > 0 && <span className="badge">{unsolvedQuizzes.length}</span>}
        </button>
        <button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>
          <PlusCircle size={16} /> 퀴즈 출제하기
        </button>
        <button className={tab === 'manage' ? 'active' : ''} onClick={() => setTab('manage')}>
          <Settings size={16} /> 나의 퀴즈 관리
        </button>
      </div>

      {/* ===== SOLVE TAB ===== */}
      {tab === 'solve' && (
        <div className="tab-content">
          {quizLoading ? (
            <div className="empty-msg">퀴즈를 불러오는 중...</div>
          ) : othersQuizzes.length === 0 ? (
            <div className="empty-msg">
              <HelpCircle size={40} />
              <p>아직 친구들이 만든 퀴즈가 없어요.<br />먼저 퀴즈를 출제해 보세요!</p>
            </div>
          ) : (
            <>
              {/* 미풀이 */}
              {unsolvedQuizzes.length > 0 && (
                <div className="quiz-section">
                  <h3 className="quiz-section-title">🎯 도전 가능한 퀴즈 ({unsolvedQuizzes.length})</h3>
                  <div className="quiz-grid">
                    {unsolvedQuizzes.map(quiz => (
                      <div className="quiz-card" key={quiz.id} onClick={() => handleOpenQuiz(quiz)}>
                        {quiz.bookCover && <img src={quiz.bookCover} alt="" className="quiz-card-cover" />}
                        <div className="quiz-card-body">
                          <span className={`quiz-type-badge type-${quiz.type}`}>{quiz.type}</span>
                          <h4 className="quiz-book-title">📖 {quiz.bookTitle}</h4>
                          <p className="quiz-card-author">출제: {quiz.authorName}</p>
                          <button className="btn-solve">도전하기 →</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 풀이 완료 */}
              {solvedQuizzes.length > 0 && (
                <div className="quiz-section">
                  <h3 className="quiz-section-title">✅ 완료한 퀴즈 ({solvedQuizzes.length})</h3>
                  <div className="quiz-grid">
                    {solvedQuizzes.map(quiz => (
                      <div className="quiz-card solved" key={quiz.id}>
                        {quiz.bookCover && <img src={quiz.bookCover} alt="" className="quiz-card-cover" />}
                        <div className="quiz-card-body">
                          <span className={`quiz-type-badge type-${quiz.type}`}>{quiz.type}</span>
                          <h4 className="quiz-book-title">📖 {quiz.bookTitle}</h4>
                          <p className="quiz-card-author">출제: {quiz.authorName}</p>
                          <div className="solved-badge"><CheckCircle size={14} /> 정답 완료 +20 XP</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== CREATE TAB ===== */}
      {tab === 'create' && (
        <div className="tab-content">
          {createDone && (
            <div className="create-success">🎉 퀴즈가 등록되었습니다! 친구들이 풀 수 있어요.</div>
          )}

          {booksLoading ? (
            <div className="empty-msg">내 독서 기록을 불러오는 중...</div>
          ) : myBooks.length === 0 ? (
            <div className="empty-msg">
              <BookOpen size={40} />
              <p>읽은 책이 없어요.<br />먼저 독서 기록을 남기고 퀴즈를 출제해 보세요!</p>
            </div>
          ) : (
            <form className="create-form" onSubmit={handleCreateQuiz}>
              {/* 1. 책 선택 */}
              <div className="create-section">
                <h3 className="create-section-title">1. 어떤 책에 대한 퀴즈인가요?</h3>
                <div className="book-select-grid">
                  {myBooks.map((b, i) => (
                    <div
                      key={b.id || i}
                      className={`book-select-card ${selectedBook?.title === b.title ? 'selected' : ''}`}
                      onClick={() => setSelectedBook(b)}
                    >
                      <img src={b.cover} alt={b.title} className="book-sel-cover" />
                      <p className="book-sel-title">{b.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedBook && (
                <>
                  {/* 2. 퀴즈 유형 */}
                  <div className="create-section">
                    <h3 className="create-section-title">2. 퀴즈 유형을 선택하세요</h3>
                    <div className="type-buttons">
                      {['OX', '객관식', '단답형'].map(t => (
                        <button
                          type="button"
                          key={t}
                          className={`btn-type ${quizType === t ? 'active' : ''}`}
                          onClick={() => { setQuizType(t); setAnswer(''); setMcqAnswer(null); }}
                        >
                          {t === 'OX' ? '⭕❌ OX 퀴즈' : t === '객관식' ? '📝 객관식' : '✏️ 단답형'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. 질문 */}
                  <div className="create-section">
                    <h3 className="create-section-title">3. 질문을 작성하세요</h3>
                    <textarea
                      className="question-input"
                      placeholder="예) 어린 왕자가 처음으로 방문한 별의 왕은 무엇을 원했나요?"
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>

                  {/* 4. 정답 */}
                  <div className="create-section">
                    <h3 className="create-section-title">4. 정답을 입력하세요</h3>

                    {quizType === 'OX' && (
                      <div className="ox-select">
                        <button type="button" className={`btn-ox-create ${answer === 'O' ? 'selected' : ''}`} onClick={() => setAnswer('O')}>⭕ O</button>
                        <button type="button" className={`btn-ox-create ${answer === 'X' ? 'selected' : ''}`} onClick={() => setAnswer('X')}>❌ X</button>
                      </div>
                    )}

                    {quizType === '객관식' && (
                      <div className="mcq-create">
                        {options.map((opt, i) => (
                          <div key={i} className="mcq-option-row">
                            <button
                              type="button"
                              className={`btn-mcq-num ${mcqAnswer === i ? 'correct' : ''}`}
                              onClick={() => setMcqAnswer(i)}
                              title="정답으로 지정"
                            >
                              {mcqAnswer === i ? '✅' : `${i + 1}`}
                            </button>
                            <input
                              className="mcq-option-input"
                              placeholder={`보기 ${i + 1}`}
                              value={opt}
                              onChange={e => {
                                const arr = [...options];
                                arr[i] = e.target.value;
                                setOptions(arr);
                              }}
                              required
                            />
                          </div>
                        ))}
                        <p className="mcq-hint">번호를 클릭하면 정답으로 지정됩니다.</p>
                      </div>
                    )}

                    {quizType === '단답형' && (
                      <input
                        className="short-answer-input"
                        placeholder="정답을 입력하세요"
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        required
                      />
                    )}
                  </div>

                  <button type="submit" className="btn-create-submit" disabled={creating}>
                    <Send size={16} /> {creating ? '등록 중...' : '퀴즈 등록하기'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      )}

      {/* ===== MANAGE TAB ===== */}
      {tab === 'manage' && (
        <div className="tab-content">
          {quizLoading ? (
            <div className="empty-msg">퀴즈를 불러오는 중...</div>
          ) : myQuizzes.length === 0 ? (
            <div className="empty-msg">
              <Settings size={40} />
              <p>내가 출제한 퀴즈가 없습니다.</p>
            </div>
          ) : (
            <div className="quiz-section">
              <h3 className="quiz-section-title">🔧 나의 퀴즈 ({myQuizzes.length})</h3>
              <div className="quiz-grid">
                {myQuizzes.map(quiz => (
                  <div className="quiz-card" key={quiz.id}>
                    {quiz.bookCover && <img src={quiz.bookCover} alt="" className="quiz-card-cover" />}
                    <div className="quiz-card-body">
                      <span className={`quiz-type-badge type-${quiz.type}`}>{quiz.type}</span>
                      <h4 className="quiz-book-title">📖 {quiz.bookTitle}</h4>
                      <p className="quiz-card-author">도전한 친구: {(quiz.solvedBy || []).length}명</p>
                      <button className="btn-solve" style={{ background: '#ef4444' }} onClick={(e) => { e.stopPropagation(); handleDeleteMyQuiz(quiz.id); }}>
                        <Trash2 size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 삭제하기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== SOLVE MODAL ===== */}
      {selectedQuiz && (
        <div className="quiz-modal-overlay" onClick={e => { if (e.target === e.currentTarget && !feedback) setSelectedQuiz(null); }}>
          <div className="quiz-modal">
            <div className="quiz-modal-header">
              <span className={`quiz-type-badge type-${selectedQuiz.type}`}>{selectedQuiz.type}</span>
              <p className="modal-book-title">📖 {selectedQuiz.bookTitle}</p>
              <p className="modal-author">출제자: {selectedQuiz.authorName}</p>
            </div>

            <p className="question-text">Q. {selectedQuiz.question}</p>

            <div className="answer-section">
              {selectedQuiz.type === 'OX' && (
                <div className="ox-buttons">
                  <button className={`btn-ox ${userAnswer === 'O' ? 'selected' : ''}`} onClick={() => !feedback && setUserAnswer('O')}>⭕ O</button>
                  <button className={`btn-ox ${userAnswer === 'X' ? 'selected' : ''}`} onClick={() => !feedback && setUserAnswer('X')}>❌ X</button>
                </div>
              )}
              {selectedQuiz.type === '객관식' && (
                <div className="mcq-options">
                  {(selectedQuiz.options || []).map((opt, i) => (
                    <button
                      key={i}
                      className={`btn-mcq ${userAnswer === i.toString() ? 'selected' : ''}`}
                      onClick={() => !feedback && setUserAnswer(i.toString())}
                    >
                      {i + 1}. {opt}
                    </button>
                  ))}
                </div>
              )}
              {selectedQuiz.type === '단답형' && (
                <input
                  type="text"
                  className="input-short-answer"
                  placeholder="정답을 입력하세요"
                  value={userAnswer}
                  onChange={e => !feedback && setUserAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !feedback && handleSubmitAnswer()}
                />
              )}
            </div>

            {feedback && (
              <div className={`feedback-msg ${feedback}`}>
                {feedback === 'correct' ? '🎉 정답입니다! +20 XP' : '😢 틀렸어요! 다시 도전해 보세요.'}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setSelectedQuiz(null)}>닫기</button>
              {!feedback && (
                <button
                  className="btn-submit"
                  onClick={handleSubmitAnswer}
                  disabled={submitting || (!userAnswer && userAnswer !== 0)}
                >
                  정답 확인
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizHub;
