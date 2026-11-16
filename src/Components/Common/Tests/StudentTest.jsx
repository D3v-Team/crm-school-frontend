import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Clock3, LoaderCircle, Moon, PartyPopper, Send, Sun, X } from 'lucide-react';
import {
    finishPublicAttempt, getPublicTest, savePublicAnswer, startPublicAttempt,
} from '../../../store/services/test.api';
import './tests.css';

const responsePayload = (response) => response?.data ?? response ?? {};
const requestError = (error) => {
    const message = error?.response?.data?.message || error?.data?.message || error?.message;
    return Array.isArray(message) ? message.join(', ') : message || 'Xatolik yuz berdi';
};
const isAlreadyFinished = (error) => {
    const message = requestError(error).toLowerCase();
    return error?.response?.status === 400 && (message.includes('topshirgan') || message.includes('yakunlangan'));
};
const sleep = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
const storageKey = (code) => `student-test:${code}`;
const getSavedSession = (code) => {
    try {
        return JSON.parse(localStorage.getItem(storageKey(code)) || 'null');
    } catch {
        localStorage.removeItem(storageKey(code));
        return null;
    }
};
/* attempt_token — kalit `test:<code>:<student_id>` (TZ 2.4) */
const tokenKey = (code, studentId) => `test:${code}:${studentId}`;
const getAttemptToken = (code, studentId) => {
    try { return localStorage.getItem(tokenKey(code, studentId)) || ''; } catch { return ''; }
};
const setAttemptToken = (code, studentId, token) => {
    try { if (token) localStorage.setItem(tokenKey(code, studentId), token); } catch { /* ignore */ }
};
const removeAttemptToken = (code, studentId) => {
    try { if (studentId) localStorage.removeItem(tokenKey(code, studentId)); } catch { /* ignore */ }
};
const statusOf = (error) => error?.response?.status;
/* 403/409 yoki token umuman yo'q/yaroqsiz bo'lsa (400 "attempt_token ...") — qayta urinish foyda bermaydi */
const isTokenRejected = (error) => {
    const status = statusOf(error);
    if (status === 403 || status === 409) return true;
    return status === 400 && /attempt_token/i.test(requestError(error));
};
const OTHER_DEVICE_MESSAGE = 'Bu test boshqa qurilmada boshlangan. O‘sha qurilmadan davom eting yoki o‘qituvchidan testni qayta ochib berishni so‘rang.';
const INVALID_TOKEN_MESSAGE = 'Test sessiyasi tasdiqlanmadi (token noto‘g‘ri yoki eskirgan). Testni kod orqali qaytadan oching.';
const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

export default function StudentTest() {
    const { code: routeCode } = useParams();
    const navigate = useNavigate();
    const code = (routeCode || '').toUpperCase();
    const [codeInput, setCodeInput] = useState('');
    const [studentTest, setStudentTest] = useState(null);
    const [loading, setLoading] = useState(Boolean(code));
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState('');
    const [studentToConfirm, setStudentToConfirm] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(null);
    const [savingQuestion, setSavingQuestion] = useState('');
    const [answerWarning, setAnswerWarning] = useState('');
    const [finishing, setFinishing] = useState(false);
    const [result, setResult] = useState(null);
    const [confirmFinish, setConfirmFinish] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [sessionInvalid, setSessionInvalid] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const attemptTokenRef = useRef('');
    const answerQueueRef = useRef(Promise.resolve());
    const answersRef = useRef({});
    const finishStartedRef = useRef(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        document.documentElement.classList.toggle('dark', shouldUseDark);
        setIsDark(shouldUseDark);
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    useEffect(() => {
        setCodeInput('');
        setStudentTest(null);
        setAttempt(null);
        setAnswers({});
        answersRef.current = {};
        setCurrentQuestion(0);
        setResult(null);
        setError('');
        setStudentToConfirm(null);
        setRemainingSeconds(null);
        setSessionInvalid(false);
        attemptTokenRef.current = '';
        finishStartedRef.current = false;
        if (!code) {
            setLoading(false);
            return undefined;
        }
        let cancelled = false;
        const loadTest = async () => {
            setLoading(true);
            try {
                const response = await getPublicTest(code);
                const data = responsePayload(response);
                if (cancelled) return;
                setStudentTest(data);
                const saved = getSavedSession(code);
                if (saved?.student_id) {
                    await beginAttempt(code, saved.student_id, cancelled);
                }
            } catch (requestFailure) {
                if (!cancelled) setError(requestFailure?.response?.status === 404 ? 'Test topilmadi yoki yopilgan' : requestError(requestFailure));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadTest();
        return () => { cancelled = true; };
    // beginAttempt is intentionally stable for the current route's resume request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, reloadKey]);

    const beginAttempt = useCallback(async (testCode, studentId, cancelled = false) => {
        setStarting(true);
        setError('');
        try {
            const savedToken = getAttemptToken(testCode, studentId);
            const response = await startPublicAttempt(testCode, studentId, savedToken);
            if (cancelled) return;
            const data = responsePayload(response);
            const attemptToken = data.attempt_token || savedToken;
            // Tokenni darhol saqlaymiz: sahifa yangilansa ham shu qurilmadan davom etiladi
            setAttemptToken(testCode, studentId, attemptToken);
            attemptTokenRef.current = attemptToken;
            setAttempt(data);
            const restoredAnswers = Object.fromEntries((data.answers || []).map((answer) => [answer.question_id, answer.option_id]));
            const saved = getSavedSession(testCode);
            const mergedAnswers = { ...(saved?.answers || {}), ...restoredAnswers };
            setAnswers(mergedAnswers);
            answersRef.current = mergedAnswers;
            setCurrentQuestion(Math.min(saved?.question_index || 0, Math.max((data.questions || []).length - 1, 0)));
            setRemainingSeconds(data.remaining_seconds ?? null);
            localStorage.setItem(storageKey(testCode), JSON.stringify({
                student_id: studentId,
                attempt_id: data.attempt_id,
                question_index: saved?.question_index || 0,
                answers: mergedAnswers,
            }));
        } catch (requestFailure) {
            if (cancelled) return;
            if (statusOf(requestFailure) === 409) {
                // Test boshqa qurilmada boshlangan yoki token yo'qolgan
                localStorage.removeItem(storageKey(testCode));
                removeAttemptToken(testCode, studentId);
                setError(OTHER_DEVICE_MESSAGE);
            } else if (statusOf(requestFailure) === 403) {
                localStorage.removeItem(storageKey(testCode));
                removeAttemptToken(testCode, studentId);
                setError(INVALID_TOKEN_MESSAGE);
            } else if (isAlreadyFinished(requestFailure)) {
                localStorage.removeItem(storageKey(testCode));
                removeAttemptToken(testCode, studentId);
                setError('Siz bu testni allaqachon topshirgansiz. O‘quvchilar ro‘yxatidan boshqa ismni tanlang.');
                setStudentTest((current) => current ? ({
                    ...current,
                    students: (current.students || []).map((student) => student.id === studentId ? { ...student, status: 'finished' } : student),
                }) : current);
            } else {
                setError(requestError(requestFailure));
            }
        } finally {
            if (!cancelled) setStarting(false);
        }
    }, []);

    const goToCode = (event) => {
        event.preventDefault();
        const normalized = codeInput.trim().toUpperCase();
        if (normalized.length !== 6) {
            setError('Test kodi 6 ta belgidan iborat bo‘lishi kerak');
            return;
        }
        navigate(`/tests-students/${normalized}`);
    };

    const chooseStudent = (student) => {
        if (student.status === 'finished') return;
        setStudentToConfirm(student);
    };

    const confirmStudent = async () => {
        if (!studentToConfirm) return;
        const student = studentToConfirm;
        setStudentToConfirm(null);
        localStorage.setItem(storageKey(code), JSON.stringify({ student_id: student.id, answers: {}, question_index: 0 }));
        await beginAttempt(code, student.id);
    };

    const persistAnswer = (questionId, optionId) => {
        const nextAnswers = { ...answersRef.current, [questionId]: optionId };
        answersRef.current = nextAnswers;
        setAnswers(nextAnswers);
        const saved = getSavedSession(code) || {};
        localStorage.setItem(storageKey(code), JSON.stringify({
            ...saved,
            student_id: attempt.student?.id || saved.student_id,
            attempt_id: attempt.attempt_id,
            question_index: currentQuestion,
            answers: nextAnswers,
        }));
        setSavingQuestion(questionId);
        setAnswerWarning('');
        answerQueueRef.current = answerQueueRef.current.then(async () => {
            let lastError;
            for (let retry = 0; retry <= 2; retry += 1) {
                try {
                    await savePublicAnswer(attempt.attempt_id, { question_id: questionId, option_id: optionId }, attemptTokenRef.current);
                    setSavingQuestion((current) => current === questionId ? '' : current);
                    return;
                } catch (requestFailure) {
                    lastError = requestFailure;
                    if (isTokenRejected(requestFailure)) {
                        // Token noto'g'ri — qayta urinish foyda bermaydi
                        setSavingQuestion('');
                        invalidateSession();
                        return;
                    }
                    if (isAlreadyFinished(requestFailure)) {
                        await finishAttempt(true, true);
                        return;
                    }
                    if (retry < 2) await sleep(requestFailure?.response?.status === 429 ? 2200 : 400 * (retry + 1));
                }
            }
            setSavingQuestion('');
            setAnswerWarning(`Javob qurilmada saqlandi, lekin serverga yuborilmadi. Internet tiklangach qayta yuboring. (${requestError(lastError)})`);
        }).catch((queueError) => {
            setSavingQuestion('');
            setAnswerWarning(requestError(queueError));
        });
    };

    const finishAttempt = useCallback(async (automatic = false, skipAnswerQueue = false) => {
        if (!attempt?.attempt_id || finishStartedRef.current) return;
        finishStartedRef.current = true;
        setFinishing(true);
        setError('');
        try {
            if (!skipAnswerQueue) await answerQueueRef.current;
            const pendingAnswers = Object.entries(answersRef.current).map(([question_id, option_id]) => ({ question_id, option_id }));
            const response = await finishPublicAttempt(attempt.attempt_id, pendingAnswers, attemptTokenRef.current);
            const data = responsePayload(response);
            setResult(data);
            setConfirmFinish(false);
            localStorage.removeItem(storageKey(code));
            // Test tugadi — token endi kerak emas
            removeAttemptToken(code, attempt.student?.id || getSavedSession(code)?.student_id);
        } catch (requestFailure) {
            finishStartedRef.current = false;
            if (isTokenRejected(requestFailure)) {
                setConfirmFinish(false);
                invalidateSession();
            } else if (isAlreadyFinished(requestFailure)) {
                setError(requestError(requestFailure));
                localStorage.removeItem(storageKey(code));
                removeAttemptToken(code, attempt.student?.id);
            } else {
                setError(automatic
                    ? `Vaqt tugadi, lekin testni yakunlashda xatolik yuz berdi: ${requestError(requestFailure)}`
                    : requestError(requestFailure));
            }
        } finally {
            setFinishing(false);
        }
    }, [attempt, code]);

    /* 403/409: urinish bu qurilmaga tegishli emas — qayta ochishni taklif qilamiz */
    function invalidateSession() {
        const studentId = attempt?.student?.id || getSavedSession(code)?.student_id;
        removeAttemptToken(code, studentId);
        localStorage.removeItem(storageKey(code));
        attemptTokenRef.current = '';
        setSessionInvalid(true);
    }

    const reopenTest = () => {
        setSessionInvalid(false);
        setAttempt(null);
        setAnswers({});
        answersRef.current = {};
        setError('');
        setRemainingSeconds(null);
        finishStartedRef.current = false;
        setReloadKey((key) => key + 1);
    };

    const hasTimer = remainingSeconds !== null;
    useEffect(() => {
        if (!attempt || result || !hasTimer) return undefined;
        const interval = window.setInterval(() => {
            setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
        }, 1000);
        return () => window.clearInterval(interval);
    }, [attempt, result, hasTimer]);

    useEffect(() => {
        if (remainingSeconds === 0 && attempt && !result) finishAttempt(true);
    }, [remainingSeconds, attempt, result, finishAttempt]);

    const moveQuestion = (index) => {
        const nextIndex = Math.max(0, Math.min(index, (attempt?.questions?.length || 1) - 1));
        setCurrentQuestion(nextIndex);
        const saved = getSavedSession(code) || {};
        localStorage.setItem(storageKey(code), JSON.stringify({ ...saved, question_index: nextIndex, answers: answersRef.current }));
    };

    const currentItem = attempt?.questions?.[currentQuestion];
    const unansweredCount = attempt?.questions?.filter((question) => !answers[question.id]).length || 0;

    if (!code) {
        return (
            <main className="student-test-page">
                <button className="student-theme-toggle" type="button" onClick={toggleTheme} aria-label={isDark ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}>
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <section className="student-test-card student-code-card">
                    <div className="student-brand-mark">T</div>
                    <h1>Testga kirish</h1>
                    <p>O‘qituvchingiz bergan 6 belgili kodni kiriting.</p>
                    {error && <div className="student-error" role="alert">{error}</div>}
                    <form onSubmit={goToCode}>
                        <label htmlFor="student-test-code">Test kodi</label>
                        <input id="student-test-code" autoFocus autoComplete="one-time-code" maxLength={6} value={codeInput} placeholder="K7M2QX" onChange={(event) => { setError(''); setCodeInput(event.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase()); }} />
                        <button className="student-primary-button" type="submit">Kirish <ChevronRight size={21} /></button>
                    </form>
                </section>
            </main>
        );
    }

    if (loading || starting) {
        return <main className="student-test-page"><button className="student-theme-toggle" type="button" onClick={toggleTheme} aria-label={isDark ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</button><div className="student-loading"><LoaderCircle className="tests-spin" size={32} /><span>{starting ? 'Testga ulanmoqda…' : 'Test yuklanmoqda…'}</span></div></main>;
    }

    if (result) {
        const total = result.total_questions ?? attempt?.questions?.length ?? 0;
        const correct = result.correct_count ?? 0;
        const percent = result.percent ?? (total ? Math.round((correct / total) * 100) : 0);
        return (
            <main className="student-test-page">
                <button className="student-theme-toggle" type="button" onClick={toggleTheme} aria-label={isDark ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}>
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <section className="student-test-card student-result-card">
                    <div className="student-result-icon"><PartyPopper size={32} /></div>
                    <p className="student-test-eyebrow">Test yakunlandi</p>
                    <h1>{attempt?.student?.full_name || 'Ajoyib natija!'}</h1>
                    <div className="student-result-score">{correct}<span> / {total}</span></div>
                    <p className="student-result-message">ta savoldan <strong>{correct} ta</strong> to‘g‘ri — <strong>{percent}%</strong></p>
                    <div className="student-result-progress"><span style={{ width: `${Math.min(percent, 100)}%` }} /></div>
                </section>
            </main>
        );
    }

    if (sessionInvalid) {
        return (
            <main className="student-test-page">
                <button className="student-theme-toggle" type="button" onClick={toggleTheme} aria-label={isDark ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}>
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <section className="student-test-card student-error-card">
                    <div className="student-error-mark"><X size={25} /></div>
                    <h1>Javob saqlanmadi</h1>
                    <p role="alert">{INVALID_TOKEN_MESSAGE}</p>
                    <button className="student-primary-button" type="button" onClick={reopenTest}>Testni qaytadan ochish</button>
                </section>
            </main>
        );
    }

    if (!studentTest) {
        return (
            <main className="student-test-page">
                <button className="student-theme-toggle" type="button" onClick={toggleTheme} aria-label={isDark ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}>
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <section className="student-test-card student-error-card">
                    <div className="student-error-mark"><X size={25} /></div>
                    <h1>Testga kirib bo‘lmadi</h1>
                    <p role="alert">{error || 'Test topilmadi yoki yopilgan'}</p>
                    <button className="student-primary-button" type="button" onClick={() => navigate('/tests-students')}>Boshqa kod kiritish</button>
                </section>
            </main>
        );
    }

    if (attempt) {
        return (
            <main className="student-test-page student-test-active">
                <button className="student-theme-toggle" type="button" onClick={toggleTheme} aria-label={isDark ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}>
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <section className="student-quiz-shell">
                    <header className="student-quiz-header">
                        <div className="student-quiz-heading"><span>{attempt.title || studentTest.title}</span><small>{attempt.student?.full_name}</small></div>
                        {remainingSeconds != null && <div className={`student-timer${remainingSeconds <= 60 ? ' is-warning' : ''}`}><Clock3 size={18} /> {formatTime(remainingSeconds)}</div>}
                    </header>
                    <div className="student-quiz-progress">
                        <div><span>Savol {currentQuestion + 1} / {attempt.questions.length}</span><span>{Math.round(((currentQuestion + 1) / attempt.questions.length) * 100)}%</span></div>
                        <div className="student-quiz-progress-track"><span style={{ width: `${((currentQuestion + 1) / attempt.questions.length) * 100}%` }} /></div>
                    </div>
                    <div className="student-question-content">
                        <h1>{currentItem?.text}</h1>
                        <div className="student-answer-list">
                            {(currentItem?.options || []).map((option, index) => (
                                <button key={option.id} className={`student-answer-button${answers[currentItem.id] === option.id ? ' is-selected' : ''}`} type="button" onClick={() => persistAnswer(currentItem.id, option.id)}>
                                    <span className="student-answer-letter">{String.fromCharCode(65 + index)}</span>
                                    <span>{option.text}</span>
                                    {answers[currentItem.id] === option.id && <Check size={19} />}
                                </button>
                            ))}
                        </div>
                        {savingQuestion === currentItem?.id && <p className="student-save-state" role="status">Javob saqlanmoqda…</p>}
                        <div className="student-answered-dots">
                            {attempt.questions.map((question, index) => <button key={question.id} className={`${index === currentQuestion ? 'is-current' : ''}${answers[question.id] ? ' is-answered' : ''}`} type="button" aria-label={`Savol ${index + 1}${answers[question.id] ? ', javob berilgan' : ', javob berilmagan'}`} onClick={() => moveQuestion(index)} />)}
                        </div>
                        {answerWarning && <p className="student-offline-warning" role="status">{answerWarning}</p>}
                    </div>
                    <footer className="student-quiz-footer">
                        <button className="student-secondary-button" type="button" disabled={currentQuestion === 0} onClick={() => moveQuestion(currentQuestion - 1)}><ChevronLeft size={20} /> Oldingi</button>
                        {currentQuestion < attempt.questions.length - 1 ? (
                            <button className="student-primary-button" type="button" onClick={() => moveQuestion(currentQuestion + 1)}>Keyingi <ChevronRight size={20} /></button>
                        ) : (
                            <button className="student-finish-button" type="button" onClick={() => setConfirmFinish(true)} disabled={finishing}><Send size={17} /> Yakunlash</button>
                        )}
                    </footer>
                    {error && <div className="student-error student-inline-error" role="alert">{error}</div>}
                </section>
                {confirmFinish && <div className="student-confirm-backdrop"><section className="student-confirm-card" role="dialog" aria-modal="true" aria-labelledby="student-finish-title">
                    <h2 id="student-finish-title">Testni yakunlaysizmi?</h2>
                    <p>{unansweredCount ? `${unansweredCount} ta savolga javob bermadingiz.` : 'Barcha savollarga javob berdingiz.'} Yakunlashni tasdiqlang.</p>
                {error && <div className="student-error" role="alert">{error}</div>}
                <div><button className="student-secondary-button" type="button" onClick={() => setConfirmFinish(false)}>Davom etish</button><button className="student-finish-button" type="button" disabled={finishing} onClick={() => finishAttempt(false)}>{finishing ? 'Yakunlanmoqda…' : 'Yakunlash'}</button></div>
                </section></div>}
            </main>
        );
    }

    return (
        <main className="student-test-page">
            <button className="student-theme-toggle" type="button" onClick={toggleTheme} aria-label={isDark ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}>
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <section className="student-test-card student-roster-card">
                <button className="student-back-link" type="button" onClick={() => navigate('/tests-students')}><ChevronLeft size={18} /> Kodni o‘zgartirish</button>
                {error && <div className="student-error" role="alert">{error}</div>}
                <p className="student-test-eyebrow">{studentTest.subject_name} · {studentTest.group_name}</p>
                <h1>{studentTest.title}</h1>
                {studentTest.description && <p className="student-test-description">{studentTest.description}</p>}
                <div className="student-test-meta"><span>{studentTest.questions_count} ta savol</span><span>{studentTest.duration_minutes ? `${studentTest.duration_minutes} daqiqa` : 'Vaqt cheklanmagan'}</span></div>
                <h2>Ismingizni tanlang</h2>
                <div className="student-roster-list">
                    {(studentTest.students || []).map((student) => (
                        <button className="student-roster-item" key={student.id} type="button" disabled={student.status === 'finished'} onClick={() => chooseStudent(student)}>
                            <span className="student-avatar">{student.full_name?.trim()?.[0]?.toUpperCase() || '?'}</span>
                            <span>{student.full_name}</span>
                            <small>{student.status === 'finished' ? 'Topshirgan' : student.status === 'in_progress' ? 'Davom ettirish' : 'Boshlash'}</small>
                        </button>
                    ))}
                    {!studentTest.students?.length && <p className="student-no-students">Guruhda o‘quvchilar topilmadi.</p>}
                </div>
            </section>
            {studentToConfirm && <div className="student-confirm-backdrop"><section className="student-confirm-card" role="dialog" aria-modal="true" aria-labelledby="student-confirm-title">
                <div className="student-avatar student-confirm-avatar">{studentToConfirm.full_name?.trim()?.[0]?.toUpperCase() || '?'}</div>
                <h2 id="student-confirm-title">Siz {studentToConfirm.full_name}misiz?</h2>
                <p>Testni boshlash uchun ismingizni tasdiqlang.</p>
                <div><button className="student-secondary-button" type="button" onClick={() => setStudentToConfirm(null)}>Yo‘q</button><button className="student-primary-button" type="button" onClick={confirmStudent}>Ha, bu men</button></div>
            </section></div>}
        </main>
    );
}
