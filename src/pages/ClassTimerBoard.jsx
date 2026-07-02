import React, { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import './ClassTimerBoard.css';

const MOCK_STUDENTS = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: `${i + 1}번 학생`,
  seconds: 0,
  isRunning: false,
}));

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return { m, s };
}

function ClassTimerBoard() {
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock tick for global time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Tick active timers
  useEffect(() => {
    const interval = setInterval(() => {
      setStudents(prev => 
        prev.map(st => 
          st.isRunning ? { ...st, seconds: st.seconds + 1 } : st
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTimer = (id) => {
    setStudents(prev => 
      prev.map(st => 
        st.id === id ? { ...st, isRunning: !st.isRunning } : st
      )
    );
  };

  return (
    <div className="timer-board animate-fade-in">
      <header className="board-header">
        <div className="title-section">
          <h1 className="board-title">학급 타이머 보드</h1>
          <p className="board-subtitle">학급 코드: 1234</p>
        </div>
        <div className="time-display">
          {currentTime.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
        </div>
      </header>

      <div className="timer-grid">
        {students.map(student => {
          const { m, s } = formatTime(student.seconds);
          return (
            <div className="timer-card" key={student.id}>
              <div className="card-header">
                <span className="student-name">{student.name}</span>
                <span className="icon-clock">🕒</span>
              </div>
              <div className="time-read">
                <span className="time-number">{m}</span>
                <span className="time-unit">분</span>
                <span className="time-number">{s}</span>
                <span className="time-unit">초</span>
              </div>
              <button 
                className={`btn-toggle ${student.isRunning ? 'btn-stop' : 'btn-start'}`}
                onClick={() => toggleTimer(student.id)}
              >
                {student.isRunning ? (
                  <><Square size={16} fill="currentColor" /> 정지</>
                ) : (
                  <><Play size={16} fill="currentColor" /> 시작</>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ClassTimerBoard;
