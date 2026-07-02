import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';
import { BookOpen, ArrowLeft } from 'lucide-react';
import './TeacherAuth.css';

function TeacherAuth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const saveTeacherProfile = async (user, displayName) => {
    const teacherRef = doc(db, 'teachers', user.uid);
    const snap = await getDoc(teacherRef);
    if (!snap.exists()) {
      await setDoc(teacherRef, {
        name: displayName || user.displayName || '선생님',
        email: user.email,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await saveTeacherProfile(cred.user);
      navigate('/teacher-dashboard');
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('이름을 입력해 주세요.'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await saveTeacherProfile(cred.user, name);
      navigate('/teacher-dashboard');
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await saveTeacherProfile(cred.user);
      navigate('/teacher-dashboard');
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const getFriendlyError = (code) => {
    const msgs = {
      'auth/user-not-found': '등록된 이메일이 없습니다.',
      'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
      'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
      'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
      'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
      'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
      'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
    };
    return msgs[code] || '오류가 발생했습니다. 다시 시도해 주세요.';
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <button className="btn-back" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> 뒤로
        </button>

        <div className="auth-logo">
          <BookOpen size={28} />
        </div>
        <h1 className="auth-title">교사 {tab === 'login' ? '로그인' : '회원가입'}</h1>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setError(''); }}>로그인</button>
          <button className={tab === 'signup' ? 'active' : ''} onClick={() => { setTab('signup'); setError(''); }}>회원가입</button>
        </div>

        <form onSubmit={tab === 'login' ? handleEmailLogin : handleEmailSignup} className="auth-form">
          {tab === 'signup' && (
            <div className="form-field">
              <label>이름</label>
              <input type="text" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className="form-field">
            <label>이메일</label>
            <input type="email" placeholder="teacher@school.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>비밀번호</label>
            <input type="password" placeholder={tab === 'signup' ? '6자 이상 입력' : '비밀번호 입력'} value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn-auth-primary" disabled={loading}>
            {loading ? '처리 중...' : (tab === 'login' ? '로그인' : '회원가입')}
          </button>
        </form>

        <div className="auth-divider"><span>또는</span></div>

        <button className="btn-google" onClick={handleGoogle} disabled={loading}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
          Google로 {tab === 'login' ? '로그인' : '가입'}하기
        </button>
      </div>
    </div>
  );
}

export default TeacherAuth;
