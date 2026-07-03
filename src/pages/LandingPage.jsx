import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
import { teacherGuide, studentGuide } from '../data/userGuides';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [modalContent, setModalContent] = useState({ isOpen: false, title: '', text: '' });

  const openPolicyModal = async (type) => {
    try {
      if (type === 'guide_teacher') {
        setModalContent({ isOpen: true, title: '이용 안내 (교사용)', text: teacherGuide });
        return;
      }
      if (type === 'guide_student') {
        setModalContent({ isOpen: true, title: '이용 안내 (학생용)', text: studentGuide });
        return;
      }

      const url = type === 'terms' ? '/TERMS_OF_SERVICE.md' : '/PRIVACY_POLICY.md';
      const title = type === 'terms' ? '이용약관' : '개인정보처리방침';
      const res = await fetch(url);
      const text = await res.text();
      setModalContent({ isOpen: true, title, text });
    } catch (error) {
      console.error(error);
      setModalContent({ isOpen: true, title: '오류', text: '문서를 불러올 수 없습니다.' });
    }
  };

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
          <h1 className="landing-title">독서꾸믈</h1>
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
            <span></span>
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
            <button onClick={() => openPolicyModal('guide_teacher')} className="footer-link-btn">이용 안내 (교사)</button>
            <span className="divider">|</span>
            <button onClick={() => openPolicyModal('guide_student')} className="footer-link-btn">이용 안내 (학생)</button>
            <span className="divider">|</span>
            <button onClick={() => openPolicyModal('terms')} className="footer-link-btn">이용약관</button>
            <span className="divider">|</span>
            <button onClick={() => openPolicyModal('privacy')} className="footer-link-btn">개인정보처리방침</button>
          </div>
          <p>개인정보책임자: 채관철 교사 (서울장위초등학교) | 문의: 02-942-1772</p>
          <p>&copy; 2026 독서꾸믈. All rights reserved.</p>
        </div>
      </div>

      {modalContent.isOpen && (
        <div className="policy-modal-overlay" onClick={() => setModalContent({ ...modalContent, isOpen: false })}>
          <div className="policy-modal" onClick={e => e.stopPropagation()}>
            <div className="policy-modal-header">
              <h2>{modalContent.title}</h2>
              <button className="policy-modal-close" onClick={() => setModalContent({ ...modalContent, isOpen: false })}>&times;</button>
            </div>
            <div className="policy-modal-body">
              <pre>{modalContent.text}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
