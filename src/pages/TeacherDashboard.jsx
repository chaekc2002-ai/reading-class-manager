import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, setDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  Plus, Settings, Trash2, Edit2, Check, X, LogOut, RefreshCw, Users, BookOpen, Award, Hash, Clock, ChevronDown, HelpCircle
} from 'lucide-react';
import './TeacherDashboard.css';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function TeacherDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('classes'); // 'classes' | 'students' | 'overview'
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // New class form
  const [newClassName, setNewClassName] = useState('');

  // New/edit student form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPin, setNewStudentPin] = useState('');
  const [editStudentId, setEditStudentId] = useState(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentPin, setEditStudentPin] = useState('');

  // Book review viewer
  const [viewingStudent, setViewingStudent] = useState(null); // student object

  // Quizzes
  const [classQuizzes, setClassQuizzes] = useState([]);

  // Load classes
  const loadClasses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(list);
      if (list.length > 0 && !selectedClass) setSelectedClass(list[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user, selectedClass]);

  // Load students for selected class
  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const q = query(collection(db, 'students'), where('classId', '==', selectedClass.id));
      const snap = await getDocs(q);
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  }, [selectedClass]);

  // Load quizzes for selected class
  const loadQuizzes = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const q = query(collection(db, 'quizzes'), where('classId', '==', selectedClass.id));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setClassQuizzes(list);
    } catch (e) { console.error(e); }
  }, [selectedClass]);

  useEffect(() => { loadClasses(); }, [user]);
  useEffect(() => { 
    if (selectedClass) {
      loadStudents();
      loadQuizzes();
    }
  }, [selectedClass]);

  // Create class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const classCode = generateCode();
    try {
      const ref = await addDoc(collection(db, 'classes'), {
        teacherId: user.uid,
        className: newClassName.trim(),
        classCode,
        createdAt: new Date().toISOString(),
      });
      const newClass = { id: ref.id, teacherId: user.uid, className: newClassName.trim(), classCode };
      setClasses(prev => [...prev, newClass]);
      setSelectedClass(newClass);
      setNewClassName('');
      setTab('students');
    } catch (e) { console.error(e); }
  };

  // Regenerate class code
  const handleRegenCode = async () => {
    if (!selectedClass) return;
    const newCode = generateCode();
    await updateDoc(doc(db, 'classes', selectedClass.id), { classCode: newCode });
    const updated = { ...selectedClass, classCode: newCode };
    setSelectedClass(updated);
    setClasses(prev => prev.map(c => c.id === selectedClass.id ? updated : c));
  };

  // Add student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || newStudentPin.length !== 4) return;
    try {
      const ref = await addDoc(collection(db, 'students'), {
        classId: selectedClass.id,
        name: newStudentName.trim(),
        pin: newStudentPin,
        xp: 0,
        level: 1,
        books: [],
        createdAt: new Date().toISOString(),
      });
      setStudents(prev => [...prev, { id: ref.id, classId: selectedClass.id, name: newStudentName.trim(), pin: newStudentPin, xp: 0, level: 1 }]);
      setNewStudentName('');
      setNewStudentPin('');
    } catch (e) { console.error(e); }
  };

  // Update student
  const handleUpdateStudent = async (studentId) => {
    if (!editStudentName.trim() || editStudentPin.length !== 4) return;
    await updateDoc(doc(db, 'students', studentId), { name: editStudentName.trim(), pin: editStudentPin });
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, name: editStudentName.trim(), pin: editStudentPin } : s));
    setEditStudentId(null);
  };

  // Delete student
  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    await deleteDoc(doc(db, 'students', studentId));
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleLogout = async () => {
    await onLogout();
    navigate('/');
  };

  return (
    <div className="teacher-dash-root">
      {/* Sidebar */}
      <aside className="teacher-sidebar">
        <div className="sidebar-logo">📚 독서 매니저</div>

        <nav className="sidebar-nav">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
            <Award size={18} /> 개요
          </button>
          <button className={tab === 'classes' ? 'active' : ''} onClick={() => setTab('classes')}>
            <BookOpen size={18} /> 학급 관리
          </button>
          <button className={tab === 'students' ? 'active' : ''} onClick={() => setTab('students')} disabled={!selectedClass}>
            <Users size={18} /> 학생 관리
          </button>
          <button className={tab === 'quizzes' ? 'active' : ''} onClick={() => setTab('quizzes')} disabled={!selectedClass}>
            <HelpCircle size={18} /> 퀴즈 현황
          </button>
        </nav>

        <div className="sidebar-class-list">
          <p className="sidebar-section-title">내 학급</p>
          {classes.map(c => (
            <button
              key={c.id}
              className={`sidebar-class-item ${selectedClass?.id === c.id ? 'active' : ''}`}
              onClick={() => { setSelectedClass(c); setTab('students'); }}
            >
              {c.className}
            </button>
          ))}
        </div>

        <button className="btn-logout-sidebar" onClick={handleLogout}>
          <LogOut size={16} /> 로그아웃
        </button>
      </aside>

      {/* Main */}
      <main className="teacher-main">
        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="dash-panel animate-fade-in">
            <h2 className="panel-title">📊 학급 개요</h2>
            <div className="overview-stats">
              <div className="ov-card">
                <BookOpen size={28} className="ov-icon" />
                <div><span className="ov-val">{classes.length}</span><span className="ov-label">개 학급</span></div>
              </div>
              <div className="ov-card">
                <Users size={28} className="ov-icon" />
                <div><span className="ov-val">{students.length}</span><span className="ov-label">명 (현재 학급)</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {tab === 'classes' && (
          <div className="dash-panel animate-fade-in">
            <h2 className="panel-title">🏫 학급 관리</h2>
            <form className="create-class-form" onSubmit={handleCreateClass}>
              <input
                type="text"
                placeholder="새 학급 이름 (예: 3학년 1반)"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
              />
              <button type="submit" className="btn-primary-sm">
                <Plus size={16} /> 학급 생성
              </button>
            </form>

            <div className="class-cards-grid">
              {classes.map(c => (
                <div key={c.id} className={`class-card ${selectedClass?.id === c.id ? 'selected' : ''}`}
                  onClick={() => { setSelectedClass(c); setTab('students'); }}>
                  <h3>{c.className}</h3>
                  <div className="class-code-display">
                    <Hash size={14} /> {c.classCode}
                  </div>
                  <p className="class-card-hint">클릭하여 학생 관리</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {tab === 'students' && selectedClass && (
          <div className="dash-panel animate-fade-in">
            <div className="students-header">
              <div>
                <h2 className="panel-title">👨‍🎓 {selectedClass.className} 학생 관리</h2>
                <div className="code-row">
                  <span className="code-label">학급 코드:</span>
                  <strong className="code-value">{selectedClass.classCode}</strong>
                  <button className="btn-icon-sm" onClick={handleRegenCode} title="코드 재발급">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Add student form */}
            <form className="add-student-form" onSubmit={handleAddStudent}>
              <input
                type="text"
                placeholder="학생 이름"
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="PIN (4자리)"
                value={newStudentPin}
                maxLength={4}
                onChange={e => setNewStudentPin(e.target.value.replace(/\D/, '').slice(0, 4))}
              />
              <button type="submit" className="btn-primary-sm" disabled={!newStudentName.trim() || newStudentPin.length !== 4}>
                <Plus size={16} /> 추가
              </button>
            </form>

            {/* Student list */}
            <div className="student-table-wrap">
              <table className="student-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>PIN</th>
                    <th>레벨</th>
                    <th>XP</th>
                    <th>도서</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>아직 학생이 없습니다.</td></tr>
                  ) : students.map(s => (
                    <tr key={s.id} className={viewingStudent?.id === s.id ? 'row-active' : ''} style={{ cursor: 'pointer' }} onClick={() => setViewingStudent(viewingStudent?.id === s.id ? null : s)}>
                      <td>
                        {editStudentId === s.id
                          ? <input value={editStudentName} onChange={e => setEditStudentName(e.target.value)} className="edit-input" onClick={e => e.stopPropagation()} />
                          : <strong>{s.name}</strong>}
                      </td>
                      <td>
                        {editStudentId === s.id
                          ? <input value={editStudentPin} onChange={e => setEditStudentPin(e.target.value.replace(/\D/, '').slice(0, 4))} className="edit-input pin-input" maxLength={4} onClick={e => e.stopPropagation()} />
                          : <span className="pin-badge">{'•'.repeat(4)}</span>}
                      </td>
                      <td><span className="lv-badge">LV.{s.level || 1}</span></td>
                      <td>{s.xp || 0} XP</td>
                      <td><span className="book-count-badge">📚 {(s.books || []).length}권</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        {editStudentId === s.id ? (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn-icon-ok" onClick={() => handleUpdateStudent(s.id)}><Check size={14} /></button>
                            <button className="btn-icon-cancel" onClick={() => setEditStudentId(null)}><X size={14} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn-icon-edit" onClick={() => { setEditStudentId(s.id); setEditStudentName(s.name); setEditStudentPin(s.pin); }}>
                              <Edit2 size={14} />
                            </button>
                            <button className="btn-icon-del" onClick={() => handleDeleteStudent(s.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Student book review panel */}
            {viewingStudent && (
              <div className="book-review-panel">
                <div className="review-panel-header">
                  <h3>📚 {viewingStudent.name} 학생의 독서 기록</h3>
                  <button className="btn-icon-cancel" onClick={() => setViewingStudent(null)}><X size={16} /></button>
                </div>
                {(!viewingStudent.books || viewingStudent.books.length === 0) ? (
                  <p className="review-empty">아직 기록한 책이 없습니다.</p>
                ) : (
                  <div className="review-book-list">
                    {viewingStudent.books.map((b, i) => (
                      <div className="review-book-item" key={b.id || i}>
                        <img src={b.cover} alt={b.title} className="review-book-cover" />
                        <div className="review-book-info">
                          <strong className="review-book-title">{b.title}</strong>
                          <span className="review-book-author">{b.author}</span>
                          <span className="review-book-meta"><Clock size={12} /> {b.readTime}분</span>
                          {b.review ? (
                            <div className="review-book-review">
                              <span className="review-label">📝 느낀 점</span>
                              <p>{b.review}</p>
                            </div>
                          ) : (
                            <p className="review-no-review">감상문 없음</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {tab === 'quizzes' && selectedClass && (
          <div className="dash-panel animate-fade-in">
            <div className="students-header">
              <div>
                <h2 className="panel-title">🎯 {selectedClass.className} 퀴즈 현황</h2>
              </div>
            </div>
            
            <div className="class-quizzes-list">
              {classQuizzes.length === 0 ? (
                <p className="review-empty">아직 출제된 퀴즈가 없습니다.</p>
              ) : (
                <div className="teacher-quiz-grid">
                  {classQuizzes.map(quiz => (
                    <div className="teacher-quiz-card" key={quiz.id}>
                      <div className="tq-header">
                        <span className={`quiz-type-badge type-${quiz.type}`}>{quiz.type}</span>
                        <span className="tq-date">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="tq-book-title">📖 {quiz.bookTitle}</h4>
                      <p className="tq-author">출제자: <strong>{quiz.authorName}</strong></p>
                      <div className="tq-content">
                        <p className="tq-question">Q. {quiz.question}</p>
                        <p className="tq-answer">A. {quiz.answer}</p>
                      </div>
                      <div className="tq-footer">
                        <span>도전한 학생 수: <strong>{(quiz.solvedBy || []).length}명</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default TeacherDashboard;
