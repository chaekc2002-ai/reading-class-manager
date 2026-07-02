import React from 'react';
import { Users, Settings, Award, BookOpen } from 'lucide-react';
import './TeacherDashboard.css';

const MOCK_STUDENTS = [
  { id: 1, name: '지민', level: 3, xp: 1250, books: 15, quizzes: 5 },
  { id: 2, name: '민수', level: 2, xp: 850, books: 10, quizzes: 2 },
  { id: 3, name: '수진', level: 4, xp: 1800, books: 22, quizzes: 8 },
  { id: 4, name: '동현', level: 1, xp: 300, books: 3, quizzes: 0 },
];

const MOCK_ACTIVITIES = [
  { id: 1, text: '수진 학생이 "나미야 잡화점의 기적" 독서 감상문을 작성했습니다.', time: '10분 전' },
  { id: 2, text: '지민 학생이 "해리 포터와 마법사의 돌" 객관식 퀴즈를 출제했습니다.', time: '1시간 전' },
  { id: 3, text: '민수 학생이 레벨 2로 레벨업 했습니다!', time: '2시간 전' },
];

function TeacherDashboard() {
  return (
    <div className="teacher-dashboard animate-fade-in">
      <header className="dashboard-header">
        <div>
          <h2>👨‍🏫 교사 대시보드</h2>
          <p>학급의 독서 현황을 한눈에 확인하세요.</p>
        </div>
        <div className="class-code-badge">
          <span>참여 코드</span>
          <strong>1234</strong>
        </div>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <Users className="stat-icon" size={32} />
          <div className="stat-info">
            <span className="stat-label">총 학생 수</span>
            <span className="stat-value">24명</span>
          </div>
        </div>
        <div className="stat-card">
          <BookOpen className="stat-icon" size={32} />
          <div className="stat-info">
            <span className="stat-label">이번 달 읽은 책</span>
            <span className="stat-value">128권</span>
          </div>
        </div>
        <div className="stat-card">
          <Award className="stat-icon" size={32} />
          <div className="stat-info">
            <span className="stat-label">평균 레벨</span>
            <span className="stat-value">LV. 2.4</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section students-list">
          <div className="section-header">
            <h3>학생 현황</h3>
            <button className="btn-icon"><Settings size={18} /></button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>레벨</th>
                <th>경험치(XP)</th>
                <th>읽은 책</th>
                <th>출제한 퀴즈</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_STUDENTS.map(student => (
                <tr key={student.id}>
                  <td><strong>{student.name}</strong></td>
                  <td><span className="level-badge-small">LV.{student.level}</span></td>
                  <td>{student.xp} XP</td>
                  <td>{student.books}권</td>
                  <td>{student.quizzes}개</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="dashboard-section activity-feed">
          <div className="section-header">
            <h3>최근 활동</h3>
          </div>
          <div className="feed-list">
            {MOCK_ACTIVITIES.map(activity => (
              <div className="feed-item" key={activity.id}>
                <div className="feed-dot"></div>
                <div className="feed-content">
                  <p>{activity.text}</p>
                  <span className="feed-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default TeacherDashboard;
