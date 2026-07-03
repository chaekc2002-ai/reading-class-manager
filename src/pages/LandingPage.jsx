import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  return (
    <div className="landing-root">
      <div className="landing-bg">
        <div className="bg-blob blob1"></div>
        <div className="bg-blob blob2"></div>
        <div className="bg-blob blob3"></div>
      </div>

      <div className="landing-center">
        {/* Logo & Title */}
        <div className="landing-logo">
          <div className="logo-icon-wrap">
            <BookOpen size={40} strokeWidth={1.5} />
          </div>
          <h1 className="landing-title">독서 클래스 매니저</h1>
          <p className="landing-subtitle">교사와 학생이 함께 만들어 가는 독서 여정 📚</p>
        </div>

        {/* Role Selection Card */}
        <div className="role-cards">
          <button
            className={`role-card teacher ${hovered === 'teacher' ? 'elevated' : ''}`}
            onClick={() => navigate('/teacher-auth')}
            onMouseEnter={() => setHovered('teacher')}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="role-card-icon teacher-icon">
              <GraduationCap size={48} strokeWidth={1.5} />
            </div>
            <h2>교사로 시작하기</h2>
            <p>학급을 개설하고 학생들의 독서 활동을 관리하세요.</p>
            <div className="role-card-arrow">→</div>
          </button>

          <div className="role-divider">
            <span>또는</span>
          </div>

          <button
            className={`role-card student ${hovered === 'student' ? 'elevated' : ''}`}
            onClick={() => navigate('/student-login')}
            onMouseEnter={() => setHovered('student')}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="role-card-icon student-icon">
              <Users size={48} strokeWidth={1.5} />
            </div>
            <h2>학생으로 시작하기</h2>
            <p>학급 코드를 입력하고 독서 기록을 시작하세요.</p>
            <div className="role-card-arrow">→</div>
          </button>
        </div>

        <div className="landing-footer">
          <div className="footer-links">
            <a href="/TERMS_OF_SERVICE.md" target="_blank" rel="noopener noreferrer">이용약관</a>
            <span className="divider">|</span>
            <a href="/PRIVACY_POLICY.md" target="_blank" rel="noopener noreferrer">개인정보처리방침</a>
          </div>
          <p>개인정보책임자: 채관철 교사 (서울장위초등학교) | 문의: 02-942-1772</p>
          <p>&copy; 2026 독서꾸믈. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
