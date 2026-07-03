import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { BookOpen, ArrowLeft, Hash, User, Lock } from 'lucide-react';
import './StudentLogin.css';

function StudentLogin({ onStudentLogin }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('code'); // 'code' | 'student'
  const [classCode, setClassCode] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const q = query(collection(db, 'classes'), where('classCode', '==', classCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError('학급 코드를 찾을 수 없습니다. 다시 확인해 주세요.');
        setLoading(false);
        return;
      }
      const classDoc = snap.docs[0];
      setClassInfo({ id: classDoc.id, ...classDoc.data() });

      // fetch students in this class
      const studentsSnap = await getDocs(query(collection(db, 'students'), where('classId', '==', classDoc.id)));
      setStudentList(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStep('student');
    } catch (err) {
      setError('오류가 발생했습니다. 다시 시도해 주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedStudent) { setError('학생을 선택해 주세요.'); return; }
    if (pin.length !== 4) { setError('PIN은 4자리 숫자입니다.'); return; }

    if (selectedStudent.pin !== pin) {
      setError('PIN이 올바르지 않습니다. 다시 확인해 주세요.');
      return;
    }

    // Store student session
    sessionStorage.setItem('student_session', JSON.stringify({
      studentId: selectedStudent.id,
      name: selectedStudent.name,
      classId: classInfo.id,
      className: classInfo.className,
    }));

    onStudentLogin({
      studentId: selectedStudent.id,
      name: selectedStudent.name,
      classId: classInfo.id,
      className: classInfo.className,
    });
    navigate('/student-home');
  };

  return (
    <div className="student-login-root">
      <div className="student-auth-card">
        <button className="btn-back-student" onClick={() => step === 'code' ? navigate('/') : setStep('code')}>
          <ArrowLeft size={18} /> {step === 'code' ? '처음으로' : '학급 코드 재입력'}
        </button>

        <div className="student-auth-logo">
          <BookOpen size={28} />
        </div>
        <h1 className="student-auth-title">학생 로그인</h1>

        {step === 'code' && (
          <>
            <p className="student-auth-sub">선생님께 받은 학급 코드를 입력해 주세요.</p>
            <form onSubmit={handleCodeSubmit} className="student-form">
              <div className="student-input-wrap">
                <Hash size={20} className="input-icon" />
                <input
                  id="classCode"
                  name="classCode"
                  aria-label="학급 코드"
                  type="text"
                  placeholder="학급 코드 (예: ABC123)"
                  value={classCode}
                  onChange={e => setClassCode(e.target.value)}
                  maxLength={8}
                  autoFocus
                  className="student-input"
                />
              </div>
              {error && <p className="student-error">{error}</p>}
              <button type="submit" className="btn-student-primary" disabled={loading || !classCode.trim()}>
                {loading ? '확인 중...' : '학급 찾기 →'}
              </button>
            </form>
          </>
        )}

        {step === 'student' && (
          <>
            <div className="class-badge">
              <span className="class-badge-name">📚 {classInfo?.className}</span>
              <span className="class-badge-code">{classCode.toUpperCase()}</span>
            </div>
            <p className="student-auth-sub">내 이름을 선택하고 PIN을 입력하세요.</p>

            <form onSubmit={handleStudentLogin} className="student-form">
              <div className="student-list">
                {studentList.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>등록된 학생이 없습니다.</p>
                ) : (
                  studentList.map(st => (
                    <button
                      type="button"
                      key={st.id}
                      className={`student-list-item ${selectedStudent?.id === st.id ? 'selected' : ''}`}
                      onClick={() => { setSelectedStudent(st); setPin(''); setError(''); }}
                    >
                      <User size={16} />
                      {st.name}
                    </button>
                  ))
                )}
              </div>

              {selectedStudent && (
                <div className="student-input-wrap" style={{ marginTop: '1rem' }}>
                  <Lock size={20} className="input-icon" />
                  <input
                    id="pin"
                    name="pin"
                    aria-label="PIN 번호"
                    type="password"
                    inputMode="numeric"
                    placeholder="4자리 PIN 번호"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/, '').slice(0, 4))}
                    maxLength={4}
                    autoFocus
                    className="student-input"
                  />
                </div>
              )}

              {error && <p className="student-error">{error}</p>}
              <button type="submit" className="btn-student-primary" disabled={!selectedStudent || pin.length !== 4}>
                입장하기 →
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default StudentLogin;
