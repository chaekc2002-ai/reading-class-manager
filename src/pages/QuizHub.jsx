import React, { useState } from 'react';
import { BookOpen, CheckCircle, HelpCircle, Trophy } from 'lucide-react';
import './QuizHub.css';

const MOCK_QUIZZES = [
  { id: 1, bookTitle: '어린 왕자', author: '민수', type: 'OX', question: '어린 왕자가 살던 별의 이름은 B-612이다.', answer: 'O', solved: false },
  { id: 2, bookTitle: '해리 포터와 마법사의 돌', author: '지민', type: '객관식', question: '해리 포터의 지팡이 심으로 들어간 깃털의 주인이 아닌 것은?', options: ['불사조', '유니콘', '용', '페가수스'], answer: 3, solved: false },
  { id: 3, bookTitle: '나미야 잡화점의 기적', author: '수진', type: '단답형', question: '나미야 잡화점 주인 할아버지의 이름은?', answer: '나미야 유지', solved: true },
];

function QuizHub({ setXp }) {
  const [quizzes, setQuizzes] = useState(MOCK_QUIZZES);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  const handleOpenQuiz = (quiz) => {
    if (quiz.solved) return;
    setSelectedQuiz(quiz);
    setUserAnswer('');
    setFeedback(null);
  };

  const handleSubmit = () => {
    let isCorrect = false;
    if (selectedQuiz.type === '객관식') {
      isCorrect = parseInt(userAnswer) === selectedQuiz.answer;
    } else {
      isCorrect = userAnswer === selectedQuiz.answer;
    }
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
      if (setXp) setXp(prev => prev + 20); // 퀴즈 정답 시 20 XP 증가
      setTimeout(() => {
        setQuizzes(quizzes.map(q => q.id === selectedQuiz.id ? { ...q, solved: true } : q));
        setSelectedQuiz(null);
      }, 1500);
    }
  };

  return (
    <div className="quiz-hub animate-fade-in">
      <header className="hub-header">
        <div className="hub-title-wrapper">
          <HelpCircle size={32} className="title-icon" />
          <h2>독서 퀴즈 허브</h2>
        </div>
        <p>친구들이 낸 퀴즈를 맞추고 추가 경험치를 획득하세요!</p>
      </header>

      <div className="quiz-grid">
        {quizzes.map(quiz => (
          <div className={`quiz-card ${quiz.solved ? 'solved' : ''}`} key={quiz.id} onClick={() => handleOpenQuiz(quiz)}>
            <div className="quiz-header">
              <span className="quiz-type">{quiz.type}</span>
              {quiz.solved && <CheckCircle className="icon-solved" size={20} />}
            </div>
            <h3 className="quiz-book-title">📖 {quiz.bookTitle}</h3>
            <p className="quiz-author">출제자: {quiz.author}</p>
            {quiz.solved ? (
              <div className="quiz-status-msg">이미 정답을 맞췄어요! (+20 XP)</div>
            ) : (
              <button className="btn-solve">도전하기</button>
            )}
          </div>
        ))}
      </div>

      {selectedQuiz && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal">
            <h3>{selectedQuiz.bookTitle} 퀴즈</h3>
            <p className="question-text">Q. {selectedQuiz.question}</p>
            
            <div className="answer-section">
              {selectedQuiz.type === 'OX' && (
                <div className="ox-buttons">
                  <button className={`btn-ox ${userAnswer === 'O' ? 'selected' : ''}`} onClick={() => setUserAnswer('O')}>O</button>
                  <button className={`btn-ox ${userAnswer === 'X' ? 'selected' : ''}`} onClick={() => setUserAnswer('X')}>X</button>
                </div>
              )}
              {selectedQuiz.type === '객관식' && (
                <div className="mcq-options">
                  {selectedQuiz.options.map((opt, i) => (
                    <button 
                      key={i} 
                      className={`btn-mcq ${userAnswer === i.toString() ? 'selected' : ''}`}
                      onClick={() => setUserAnswer(i.toString())}
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
                  onChange={(e) => setUserAnswer(e.target.value)}
                />
              )}
            </div>

            {feedback && (
              <div className={`feedback-msg ${feedback}`}>
                {feedback === 'correct' ? '🎉 정답입니다! +20 XP' : '😢 아쉽네요, 다시 도전해 보세요!'}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setSelectedQuiz(null)}>닫기</button>
              <button className="btn-submit" onClick={handleSubmit}>정답 확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizHub;
