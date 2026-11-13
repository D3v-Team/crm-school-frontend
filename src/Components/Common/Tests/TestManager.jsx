/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { useSelector } from 'react-redux';
import { QRCodeSVG } from 'qrcode.react';
import {
    ArrowLeft, Check, ChevronLeft, ChevronRight, ClipboardCheck, Clock3,
    Copy, Eye, Link, LoaderCircle, Pencil, Plus, RefreshCw, RotateCcw,
    Trash2, X,
} from 'lucide-react';
import {
    createTest, deleteTest, deleteTestAttempt, getTest, getTestAttempt,
    getTestResults, getTests, updateTest,
} from '../../../store/services/test.api';
import $api from '../../../store/api';
import './tests.css';

const extractData = (response) => response?.data ?? response ?? {};
const extractRecords = (response) => {
    const data = extractData(response);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.data?.records)) return data.data.records;
    return Array.isArray(data.data) ? data.data : [];
};
const errorMessage = (error) => {
    const message = error?.response?.data?.message || error?.data?.message || error?.message;
    return Array.isArray(message) ? message.join(', ') : message || 'Xatolik yuz berdi';
};
const newQuestion = () => ({
    text: '',
    options: [{ text: '', is_correct: true }, { text: '', is_correct: false }],
});
const toForm = (test) => ({
    group_id: test?.group?.id || test?.group_id || '',
    subject_id: test?.subject?.id || test?.subject_id || '',
    title: test?.title || '',
    description: test?.description || '',
    duration_minutes: test?.duration_minutes ?? '',
    is_active: test?.is_active ?? true,
    questions: test?.questions?.map((question) => ({
        text: question.text || '',
        options: (question.options || []).map((option) => ({
            text: option.text || '',
            is_correct: Boolean(option.is_correct),
        })),
    })) || [newQuestion()],
});
const unwrapTest = (response) => extractData(response);
const fullName = (student) => student?.full_name || '—';
const dateText = (date) => date ? new Date(date).toLocaleString('uz-UZ') : '—';

function Modal({ title, children, onClose, wide = false }) {
    return (
        <div className="tests-modal-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
        }}>
            <section className={`tests-modal${wide ? ' tests-modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
                <header className="tests-modal-header">
                    <h2>{title}</h2>
                    <button className="tests-icon-button" type="button" onClick={onClose} aria-label="Yopish"><X size={18} /></button>
                </header>
                {children}
            </section>
        </div>
    );
}

function TestEditor({ initial, groups, subjects, optionsLoading, onCancel, onSave }) {
    const [form, setForm] = useState(initial || toForm(null));
    const [originalQuestions] = useState(JSON.stringify(initial ? toForm(initial).questions : []));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const editing = Boolean(initial?.id);
    const selectedGroup = groups.find((group) => String(group.id) === String(form.group_id))
        || (editing ? initial?.group : null);
    const inheritedSubject = selectedGroup?.subject?.id || selectedGroup?.subject_id || "";
    const inheritedSubjectName = selectedGroup?.subject?.name
        || subjects.find((subject) => String(subject.id) === String(inheritedSubject))?.name;

    const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const updateQuestion = (index, updater) => change('questions', form.questions.map((question, i) => i === index ? updater(question) : question));
    const updateOption = (questionIndex, optionIndex, updater) => updateQuestion(questionIndex, (question) => ({
        ...question,
        options: question.options.map((option, i) => i === optionIndex ? updater(option) : option),
    }));

    const validate = () => {
        if (!form.group_id) return 'Guruhni tanlang';
        if (!inheritedSubject && !form.subject_id) return 'Fanni tanlang';
        if (!form.title.trim() || form.title.length > 255) return 'Test nomini kiriting (ko‘pi bilan 255 belgi)';
        if (form.description.length > 2000) return 'Izoh 2000 belgidan oshmasligi kerak';
        if (form.duration_minutes !== '' && (Number(form.duration_minutes) < 1 || Number(form.duration_minutes) > 300)) {
            return 'Vaqt 1 dan 300 daqiqagacha bo‘lishi kerak';
        }
        if (form.questions.length < 1 || form.questions.length > 100) return 'Testda 1–100 ta savol bo‘lishi kerak';
        for (let index = 0; index < form.questions.length; index += 1) {
            const question = form.questions[index];
            if (!question.text.trim() || question.text.length > 2000) return `${index + 1}-savol matnini kiriting (ko‘pi bilan 2000 belgi)`;
            if (question.options.length < 2 || question.options.length > 6) return `${index + 1}-savolda 2–6 ta variant bo‘lishi kerak`;
            if (question.options.some((option) => !option.text.trim())) return `${index + 1}-savolning barcha variantlarini to‘ldiring`;
            if (question.options.filter((option) => option.is_correct).length !== 1) return `${index + 1}-savolda bitta to‘g‘ri javobni belgilang`;
        }
        return '';
    };

    const submit = async (event) => {
        event.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }
        setSaving(true);
        setError('');
        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || null,
            duration_minutes: form.duration_minutes === '' ? null : Number(form.duration_minutes),
            is_active: form.is_active,
        };
        const serializedQuestions = JSON.stringify(form.questions);
        if (!editing) {
            payload.group_id = form.group_id;
            if (!inheritedSubject) payload.subject_id = form.subject_id;
            payload.questions = form.questions;
        } else if (serializedQuestions !== originalQuestions) {
            payload.questions = form.questions;
        }
        try {
            const response = editing
                ? await updateTest(initial.id, payload)
                : await createTest(payload);
            await onSave(response, !editing);
        } catch (requestError) {
            setError(errorMessage(requestError));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="tests-editor" onSubmit={submit}>
            {error && <div className="tests-alert tests-alert-error" role="alert">{error}</div>}
            {!editing && (
                <div className="tests-form-grid">
                    <label className="tests-field">
                        <span>Guruh <b>*</b></span>
                        <select value={form.group_id} onChange={(event) => {
                            const nextGroup = groups.find((group) => String(group.id) === String(event.target.value));
                            setForm((current) => ({ ...current, group_id: event.target.value, subject_id: nextGroup?.subject?.id || nextGroup?.subject_id || "" }));
                        }} required>
                            <option value="">Guruhni tanlang</option>
                            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                        </select>
                    </label>
                    {inheritedSubject ? (
                        <div className="tests-readonly"><span>Fan (guruhdan olinadi)</span><strong>{inheritedSubjectName || 'Fan'}</strong></div>
                    ) : (
                        <label className="tests-field">
                            <span>Fan <b>*</b></span>
                            <select value={form.subject_id} onChange={(event) => change('subject_id', event.target.value)} required>
                                <option value="">Fanni tanlang</option>
                                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                            </select>
                        </label>
                    )}
                </div>
            )}
            {editing && (
                <div className="tests-form-grid">
                    <div className="tests-readonly"><span>Guruh</span><strong>{initial.group?.name || '—'}</strong></div>
                    <div className="tests-readonly"><span>Fan</span><strong>{initial.subject?.name || '—'}</strong></div>
                </div>
            )}
            {optionsLoading && <p className="tests-muted">Guruh va fanlar yuklanmoqda…</p>}
            {!editing && (!groups.length || !subjects.length) && !optionsLoading && (
                <div className="tests-alert tests-alert-warning">Test yaratish uchun guruh va fan biriktirilgan bo‘lishi kerak.</div>
            )}
            <div className="tests-form-grid">
                <label className="tests-field tests-field-full">
                    <span>Test nomi <b>*</b></span>
                    <input maxLength={255} value={form.title} onChange={(event) => change('title', event.target.value)} required />
                </label>
                <label className="tests-field tests-field-full">
                    <span>Izoh</span>
                    <textarea maxLength={2000} rows={3} value={form.description} onChange={(event) => change('description', event.target.value)} />
                </label>
                <label className="tests-field">
                    <span>Vaqt (daqiqa)</span>
                    <input type="number" min="1" max="300" placeholder="Cheklanmagan" value={form.duration_minutes} onChange={(event) => change('duration_minutes', event.target.value)} />
                    <small>Bo‘sh qoldirilsa, vaqt cheklanmaydi.</small>
                </label>
                <label className="tests-toggle">
                    <input type="checkbox" checked={form.is_active} onChange={(event) => change('is_active', event.target.checked)} />
                    <span>Test ochiq bo‘lsin</span>
                </label>
            </div>
            <div className="tests-questions-title">
                <h3>Savollar <span>{form.questions.length}</span></h3>
                <button type="button" className="tests-button tests-button-secondary" disabled={form.questions.length >= 100} onClick={() => change('questions', [...form.questions, newQuestion()])}>
                    <Plus size={16} /> Savol qo‘shish
                </button>
            </div>
            <div className="tests-question-list">
                {form.questions.map((question, questionIndex) => (
                    <article className="tests-question-card" key={`question-${questionIndex}`}>
                        <div className="tests-question-heading">
                            <strong>Savol {questionIndex + 1}</strong>
                            <div className="tests-question-controls">
                                <button type="button" className="tests-icon-button" title="Yuqoriga" disabled={questionIndex === 0} onClick={() => {
                                    const next = [...form.questions];
                                    [next[questionIndex - 1], next[questionIndex]] = [next[questionIndex], next[questionIndex - 1]];
                                    change('questions', next);
                                }}>↑</button>
                                <button type="button" className="tests-icon-button" title="Pastga" disabled={questionIndex === form.questions.length - 1} onClick={() => {
                                    const next = [...form.questions];
                                    [next[questionIndex + 1], next[questionIndex]] = [next[questionIndex], next[questionIndex + 1]];
                                    change('questions', next);
                                }}>↓</button>
                                <button type="button" className="tests-icon-button tests-icon-danger" title="O‘chirish" disabled={form.questions.length <= 1} onClick={() => change('questions', form.questions.filter((_, i) => i !== questionIndex))}>
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                        <label className="tests-field">
                            <span>Savol matni <b>*</b></span>
                            <textarea maxLength={2000} rows={2} value={question.text} onChange={(event) => updateQuestion(questionIndex, (current) => ({ ...current, text: event.target.value }))} />
                        </label>
                        <div className="tests-options">
                            {question.options.map((option, optionIndex) => (
                                <div className="tests-option-row" key={`option-${questionIndex}-${optionIndex}`}>
                                    <input type="radio" name={`correct-${questionIndex}`} aria-label="To‘g‘ri javob" checked={option.is_correct} onChange={() => updateQuestion(questionIndex, (current) => ({
                                        ...current,
                                        options: current.options.map((item, i) => ({ ...item, is_correct: i === optionIndex })),
                                    }))} />
                                    <input className="tests-option-input" value={option.text} maxLength={500} placeholder={`Variant ${optionIndex + 1}`} onChange={(event) => updateOption(questionIndex, optionIndex, (current) => ({ ...current, text: event.target.value }))} />
                                    <button type="button" className="tests-icon-button tests-icon-danger" title="Variantni o‘chirish" disabled={question.options.length <= 2} onClick={() => {
                                        const remaining = question.options.filter((_, i) => i !== optionIndex);
                                        if (!remaining.some((item) => item.is_correct)) remaining[0].is_correct = true;
                                        updateQuestion(questionIndex, (current) => ({ ...current, options: remaining }));
                                    }}><X size={15} /></button>
                                </div>
                            ))}
                            <button type="button" className="tests-inline-button" disabled={question.options.length >= 6} onClick={() => updateQuestion(questionIndex, (current) => ({
                                ...current,
                                options: [...current.options, { text: '', is_correct: false }],
                            }))}><Plus size={14} /> Variant qo‘shish</button>
                        </div>
                        <p className="tests-hint"><Check size={13} /> Radio orqali to‘g‘ri javobni belgilang</p>
                    </article>
                ))}
            </div>
            <footer className="tests-form-actions">
                <button className="tests-button tests-button-secondary" type="button" onClick={onCancel}>Bekor qilish</button>
                <button className="tests-button tests-button-primary" type="submit" disabled={saving || (!editing && (!groups.length || !subjects.length))}>
                    {saving ? <LoaderCircle className="tests-spin" size={16} /> : <Check size={16} />}
                    {saving ? 'Saqlanmoqda…' : editing ? 'Saqlash' : 'Test yaratish'}
                </button>
            </footer>
        </form>
    );
}

function AttemptDetails({ attempt, loading, error, onRetry, onClose }) {
    if (loading) return <Modal title="O‘quvchi natijasi" onClose={onClose}><div className="tests-loading"><LoaderCircle className="tests-spin" /> Yuklanmoqda…</div></Modal>;
    if (error || !attempt) return <Modal title="O‘quvchi natijasi" onClose={onClose}><div className="tests-modal-body"><div className="tests-alert tests-alert-error">{error || 'Natija topilmadi'}</div></div></Modal>;
    return (
        <Modal title={fullName(attempt.student)} onClose={onClose} wide>
            <div className="tests-modal-body">
                <div className="tests-result-banner">
                    <strong>{attempt.correct_count ?? '—'} / {attempt.total_questions ?? '—'}</strong>
                    <span>{attempt.percent ?? 0}% to‘g‘ri</span>
                    <span>{dateText(attempt.finished_at)}</span>
                </div>
                <div className="tests-attempt-questions">
                    {(attempt.questions || []).map((question, index) => (
                        <article key={question.id} className="tests-attempt-question">
                            <h3>{index + 1}. {question.text}</h3>
                            <ul>
                                {(question.options || []).map((option) => {
                                    const selected = question.selected_option_id === option.id;
                                    const isCorrect = option.is_correct;
                                    return (
                                        <li key={option.id} className={isCorrect ? 'is-correct' : selected ? 'is-wrong' : ''}>
                                            <span>{option.text}</span>
                                            {isCorrect && <b>To‘g‘ri javob</b>}
                                            {selected && !isCorrect && <b>O‘quvchi tanladi</b>}
                                            {selected && isCorrect && <b>Tanlangan javob</b>}
                                        </li>
                                    );
                                })}
                                {!question.selected_option_id && <li className="is-unanswered">Javob berilmagan</li>}
                            </ul>
                        </article>
                    ))}
                </div>
                <footer className="tests-form-actions">
                    <button className="tests-button tests-button-danger" type="button" onClick={onRetry}><RotateCcw size={15} /> Qayta topshirishga ruxsat</button>
                    <button className="tests-button tests-button-secondary" type="button" onClick={onClose}>Yopish</button>
                </footer>
            </div>
        </Modal>
    );
}

export default function TestManager() {
    const auth = useSelector((state) => state.auth);
    const role = auth?.role || Cookies.get('role');
    const userId = auth?.userId || Cookies.get('userId') || Cookies.get('us_nesw');
    const isTeacher = role === 'teacher';
    const [view, setView] = useState('list');
    const [tests, setTests] = useState([]);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [filters, setFilters] = useState({ group_id: '', subject_id: '' });
    const [groups, setGroups] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [choicesLoading, setChoicesLoading] = useState(true);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState('');
    const [notice, setNotice] = useState(null);
    const [editingTest, setEditingTest] = useState(null);
    const [createdCode, setCreatedCode] = useState('');
    const [selectedTest, setSelectedTest] = useState(null);
    const [qrTest, setQrTest] = useState(null);
    const [results, setResults] = useState(null);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [resultsError, setResultsError] = useState('');
    const [attemptModal, setAttemptModal] = useState({ id: '', data: null, loading: false, error: '' });
    const [confirm, setConfirm] = useState(null);
    const [busy, setBusy] = useState(false);

    const loadList = useCallback(async (nextPage = page, nextFilters = filters) => {
        setListLoading(true);
        setListError('');
        try {
            const response = await getTests({
                page: nextPage,
                limit: 30,
                ...(nextFilters.group_id && { group_id: nextFilters.group_id }),
                ...(nextFilters.subject_id && { subject_id: nextFilters.subject_id }),
            });
            const data = extractData(response);
            setTests(data.records || data.data?.records || []);
            setPagination(data.pagination || data.data?.pagination || {});
        } catch (error) {
            setListError(errorMessage(error));
        } finally {
            setListLoading(false);
        }
    }, [filters, page]);

    useEffect(() => { loadList(page, filters); }, [page, filters, loadList]);

    useEffect(() => {
        let cancelled = false;
        const loadChoices = async () => {
            setChoicesLoading(true);
            try {
                const requests = isTeacher && userId
                    ? [
                        $api.get('/group', { params: { page: 1, limit: 100, teacher_id: userId } }).then((response) => response.data),
                        $api.get(`/teacher-subject/by-teacher/${userId}`).then((response) => response.data),
                    ]
                    : [
                        $api.get('/group', { params: { page: 1, limit: 100 } }).then((response) => response.data),
                        $api.get('/subject', { params: { page: 1, limit: 100 } }).then((response) => response.data),
                    ];
                const [groupResponse, subjectResponse] = await Promise.all(requests);
                if (cancelled) return;
                const groupItems = extractRecords(groupResponse).filter((item) => item.id);
                const subjectItems = extractRecords(subjectResponse).map((item) => item.subject || item).filter((item) => item.id);
                setGroups(groupItems);
                setSubjects(subjectItems);
            } catch (error) {
                if (!cancelled) setNotice({ type: 'error', text: errorMessage(error) });
            } finally {
                if (!cancelled) setChoicesLoading(false);
            }
        };
        loadChoices();
        return () => { cancelled = true; };
    }, [isTeacher, userId]);

    const loadResults = useCallback(async (testId) => {
        setResultsLoading(true);
        setResultsError('');
        try {
            const response = await getTestResults(testId);
            setResults(unwrapTest(response));
        } catch (error) {
            setResultsError(errorMessage(error));
        } finally {
            setResultsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view !== 'results' || !selectedTest?.id) return undefined;
        const interval = window.setInterval(() => loadResults(selectedTest.id), 12000);
        return () => window.clearInterval(interval);
    }, [view, selectedTest, loadResults]);

    const startCreate = () => {
        setEditingTest(null);
        setCreatedCode('');
        setView('form');
    };

    const startEdit = async (test) => {
        setListError('');
        try {
            const response = await getTest(test.id);
            setEditingTest({ ...unwrapTest(response), id: test.id });
            setView('form');
        } catch (error) {
            setNotice({ type: 'error', text: errorMessage(error) });
        }
    };

    const startResults = (test) => {
        setSelectedTest(test);
        setView('results');
        loadResults(test.id);
    };

    const handleSave = async (response, isNew) => {
        if (isNew) {
            const data = extractData(response);
            const code = data.code || data.data?.code || '';
            setCreatedCode(code);
            setEditingTest(null);
            setPage(1);
            setNotice({ type: 'success', text: 'Test yaratildi' });
            await loadList(1, filters);
        } else {
            setNotice({ type: 'success', text: 'Test saqlandi' });
            setView('list');
            await loadList(page, filters);
        }
    };

    const copyText = async (text, successMessage) => {
        try {
            await navigator.clipboard.writeText(text);
            setNotice({ type: 'success', text: successMessage });
        } catch {
            setNotice({ type: 'error', text: 'Nusxalash amalga oshmadi' });
        }
    };

    const copyLink = (code) => copyText(`${window.location.origin}/tests-students/${code}`, 'Havola nusxalandi');

    const toggleActive = async (test) => {
        setBusy(true);
        try {
            await updateTest(test.id, { is_active: !test.is_active });
            setNotice({ type: 'success', text: test.is_active ? 'Test yopildi' : 'Test ochildi' });
            await loadList(page, filters);
        } catch (error) {
            setNotice({ type: 'error', text: errorMessage(error) });
        } finally {
            setBusy(false);
        }
    };

    const confirmAction = async () => {
        if (!confirm) return;
        setBusy(true);
        try {
            if (confirm.type === 'delete-test') {
                await deleteTest(confirm.id);
                setNotice({ type: 'success', text: 'Test o‘chirildi' });
                await loadList(page, filters);
            } else if (confirm.type === 'delete-attempt') {
                await deleteTestAttempt(confirm.id);
                setAttemptModal({ id: '', data: null, loading: false, error: '' });
                await loadResults(selectedTest.id);
                setNotice({ type: 'success', text: 'O‘quvchiga testni qayta topshirishga ruxsat berildi' });
            }
        } catch (error) {
            setNotice({ type: 'error', text: errorMessage(error) });
        } finally {
            setConfirm(null);
            setBusy(false);
        }
    };

    const openAttempt = async (attemptId) => {
        setAttemptModal({ id: attemptId, data: null, loading: true, error: '' });
        try {
            const response = await getTestAttempt(attemptId);
            setAttemptModal({ id: attemptId, data: unwrapTest(response), loading: false, error: '' });
        } catch (error) {
            setAttemptModal({ id: attemptId, data: null, loading: false, error: errorMessage(error) });
        }
    };

    const pageCount = pagination.total_pages || 1;
    const resultSummary = results?.summary || {};
    const resultRecords = results?.records || [];
    const studentLink = useMemo(() => createdCode ? `${window.location.origin}/tests-students/${createdCode}` : '', [createdCode]);

    return (
        <div className="tests-page">
            {notice && <div className={`tests-toast tests-toast-${notice.type}`} role="status">{notice.text}<button type="button" onClick={() => setNotice(null)} aria-label="Yopish"><X size={14} /></button></div>}
            {view === 'form' ? (
                <>
                    <div className="tests-page-heading">
                        <button className="tests-back-button" type="button" onClick={() => { setView('list'); setCreatedCode(''); }}><ArrowLeft size={17} /> Testlar</button>
                        <h1>{editingTest ? 'Testni tahrirlash' : 'Yangi test'}</h1>
                    </div>
                    {!createdCode ? (
                        <TestEditor key={editingTest?.id || 'new-test'} initial={editingTest} groups={groups} subjects={subjects} optionsLoading={choicesLoading} onCancel={() => setView('list')} onSave={handleSave} />
                    ) : (
                        <section className="tests-created-card">
                            <div className="tests-created-icon"><Check size={28} /></div>
                            <h2>Test yaratildi!</h2>
                            <p>O‘quvchilarga kod yoki havolani yuboring.</p>
                            <div className="tests-created-code">{createdCode}</div>
                            <div className="tests-created-actions">
                                <button className="tests-button tests-button-primary" type="button" onClick={() => copyText(createdCode, 'Kod nusxalandi')}><Copy size={16} /> Kodni nusxalash</button>
                                <button className="tests-button tests-button-secondary" type="button" onClick={() => copyText(studentLink, 'Havola nusxalandi')}><Link size={16} /> Havolani nusxalash</button>
                            </div>
                            {studentLink && <QRCodeSVG value={studentLink} size={180} level="M" />}
                            <button className="tests-inline-button" type="button" onClick={() => { setCreatedCode(''); setView('list'); }}>Testlar ro‘yxatiga qaytish</button>
                        </section>
                    )}
                </>
            ) : view === 'results' ? (
                <>
                    <div className="tests-page-heading tests-results-heading">
                        <div>
                            <button className="tests-back-button" type="button" onClick={() => setView('list')}><ArrowLeft size={17} /> Testlar</button>
                            <h1>{results?.test?.title || selectedTest?.title || 'Test natijalari'}</h1>
                            <p>Kod: <strong>{results?.test?.code || selectedTest?.code}</strong></p>
                        </div>
                        <button className="tests-button tests-button-secondary" type="button" disabled={resultsLoading} onClick={() => loadResults(selectedTest.id)}>
                            <RefreshCw size={16} className={resultsLoading ? 'tests-spin' : ''} /> Yangilash
                        </button>
                    </div>
                    {resultsError && <div className="tests-alert tests-alert-error">{resultsError}</div>}
                    <div className="tests-summary-grid">
                        {[
                            ['Jami o‘quvchilar', resultSummary.students_count ?? 0, 'blue'],
                            ['Topshirgan', resultSummary.finished_count ?? 0, 'green'],
                            ['Topshirmoqda', resultSummary.in_progress_count ?? 0, 'orange'],
                            ['Boshlamagan', resultSummary.not_started_count ?? 0, 'gray'],
                            ['O‘rtacha natija', `${resultSummary.average_percent ?? 0}%`, 'purple'],
                        ].map(([label, value, color]) => <div className={`tests-summary-card summary-${color}`} key={label}><span>{label}</span><strong>{value}</strong></div>)}
                    </div>
                    <div className="tests-section-heading"><h2>O‘quvchilar natijalari</h2><span>12 soniyada yangilanadi</span></div>
                    <div className="tests-table-wrap">
                        <table className="tests-table">
                            <thead><tr><th>O‘quvchi</th><th>Holati</th><th>Boshlagan vaqt</th><th>Tugatgan vaqt</th><th>Natija</th><th>Ball</th></tr></thead>
                            <tbody>
                                {resultsLoading && !results && <tr><td className="tests-empty" colSpan="6">Yuklanmoqda…</td></tr>}
                                {!resultsLoading && !resultRecords.length && <tr><td className="tests-empty" colSpan="6">Hali natijalar mavjud emas</td></tr>}
                                {resultRecords.map((record) => (
                                    <tr key={record.student_id}>
                                        <td className="tests-student-name">{fullName(record)}</td>
                                        <td><span className={`tests-status status-${record.status}`}>{record.status === 'finished' ? 'Topshirgan' : record.status === 'in_progress' ? 'Topshirmoqda' : 'Boshlamagan'}</span></td>
                                        <td>{dateText(record.started_at)}</td>
                                        <td>{dateText(record.finished_at)}</td>
                                        <td>{record.correct_count == null ? '—' : `${record.correct_count} / ${record.total_questions}`}</td>
                                        <td>
                                            {record.status === 'finished' ? (
                                                <button className="tests-score-link" type="button" onClick={() => openAttempt(record.attempt_id)}>{record.percent}% <Eye size={14} /></button>
                                            ) : record.status === 'in_progress' ? '—' : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {results?.test?.duration_minutes && <p className="tests-muted"><Clock3 size={14} /> Ajratilgan vaqt: {results.test.duration_minutes} daqiqa</p>}
                </>
            ) : (
                <>
                    <div className="tests-page-heading tests-list-heading">
                        <div className="tests-title-wrap"><span className="tests-title-icon"><ClipboardCheck size={21} /></span><div><h1>Testlar</h1><p>O‘quvchilar uchun bilim sinovlarini boshqaring</p></div></div>
                        <button className="tests-button tests-button-primary" type="button" onClick={startCreate}><Plus size={17} /> Test yaratish</button>
                    </div>
                    <div className="tests-filters">
                        <label><span>Guruh</span><select value={filters.group_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, group_id: event.target.value })); }}><option value="">Barcha guruhlar</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
                        <label><span>Fan</span><select value={filters.subject_id} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, subject_id: event.target.value })); }}><option value="">Barcha fanlar</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
                        <button className="tests-button tests-button-secondary tests-refresh" type="button" disabled={listLoading} onClick={() => loadList(page, filters)}><RefreshCw size={15} className={listLoading ? 'tests-spin' : ''} /> Yangilash</button>
                    </div>
                    {listError && <div className="tests-alert tests-alert-error">{listError}</div>}
                    <div className="tests-table-wrap">
                        <table className="tests-table">
                            <thead><tr><th>Test nomi</th><th>Guruh</th><th>Fan</th><th>Savollar</th><th>Topshirgan</th><th>Vaqt</th><th>Holat</th><th>Kod</th><th>Sana</th><th>Amallar</th></tr></thead>
                            <tbody>
                                {listLoading && <tr><td className="tests-empty" colSpan="10">Yuklanmoqda…</td></tr>}
                                {!listLoading && !tests.length && <tr><td className="tests-empty" colSpan="10">Testlar topilmadi</td></tr>}
                                {!listLoading && tests.map((test) => (
                                    <tr key={test.id}>
                                        <td className="tests-test-title">{test.title}</td>
                                        <td>{test.group?.name || '—'}</td>
                                        <td>{test.subject?.name || '—'}</td>
                                        <td>{test.questions_count ?? '—'}</td>
                                        <td>{test.finished_count ?? 0}</td>
                                        <td>{test.duration_minutes ? `${test.duration_minutes} daq.` : 'Cheklanmagan'}</td>
                                        <td><span className={`tests-status ${test.is_active ? 'status-open' : 'status-closed'}`}>{test.is_active ? 'Ochiq' : 'Yopiq'}</span></td>
                                        <td><button className="tests-code-button" type="button" title="Kod va QR" onClick={() => setQrTest(test)}>{test.code}</button></td>
                                        <td>{dateText(test.createdAt || test.created_at)}</td>
                                        <td>
                                            <div className="tests-row-actions">
                                                <button className="tests-icon-button" type="button" title="Havolani nusxalash" onClick={() => copyLink(test.code)}><Link size={15} /></button>
                                                <button className="tests-icon-button" type="button" title={test.is_active ? 'Testni yopish' : 'Testni ochish'} disabled={busy} onClick={() => toggleActive(test)}>{test.is_active ? <X size={15} /> : <Check size={15} />}</button>
                                                <button className="tests-icon-button" type="button" title="Natijalar" onClick={() => startResults(test)}><Eye size={15} /></button>
                                                <button className="tests-icon-button" type="button" title="Tahrirlash" onClick={() => startEdit(test)}><Pencil size={15} /></button>
                                                <button className="tests-icon-button tests-icon-danger" type="button" title="O‘chirish" onClick={() => setConfirm({ type: 'delete-test', id: test.id, title: test.title })}><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="tests-pagination">
                        <span>Jami: {pagination.total_count ?? tests.length}</span>
                        <div>
                            <button className="tests-icon-button" disabled={page <= 1 || listLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="Oldingi sahifa"><ChevronLeft size={17} /></button>
                            <span>{pagination.currentPage || page} / {pageCount}</span>
                            <button className="tests-icon-button" disabled={page >= pageCount || listLoading} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} aria-label="Keyingi sahifa"><ChevronRight size={17} /></button>
                        </div>
                    </div>
                </>
            )}
            {qrTest && view === 'list' && (
                <Modal title={`Test kodi: ${qrTest.code}`} onClose={() => setQrTest(null)}>
                    <div className="tests-modal-body tests-qr-content">
                        <p>{qrTest.title}</p>
                        <QRCodeSVG value={`${window.location.origin}/tests-students/${qrTest.code}`} size={220} level="M" />
                        <div className="tests-created-actions">
                            <button className="tests-button tests-button-primary" type="button" onClick={() => copyText(qrTest.code, 'Kod nusxalandi')}><Copy size={15} /> Kodni nusxalash</button>
                            <button className="tests-button tests-button-secondary" type="button" onClick={() => copyLink(qrTest.code)}><Link size={15} /> Havolani nusxalash</button>
                        </div>
                    </div>
                </Modal>
            )}
            {attemptModal.id && <AttemptDetails attempt={attemptModal.data} loading={attemptModal.loading} error={attemptModal.error} onClose={() => setAttemptModal({ id: '', data: null, loading: false, error: '' })} onRetry={() => setConfirm({ type: 'delete-attempt', id: attemptModal.id, title: fullName(attemptModal.data?.student) })} />}
            {confirm && (
                <Modal title={confirm.type === 'delete-test' ? 'Testni o‘chirish' : 'Qayta topshirishga ruxsat'} onClose={() => setConfirm(null)}>
                    <div className="tests-modal-body">
                        <p>{confirm.type === 'delete-test'
                            ? <><strong>{confirm.title}</strong> va uning savollari hamda barcha natijalari o‘chadi. Davom etasizmi?</>
                            : <><strong>{confirm.title}</strong> natijasi o‘chadi va o‘quvchi testni qaytadan topshira oladi. Davom etasizmi?</>}</p>
                        <div className="tests-form-actions">
                            <button type="button" className="tests-button tests-button-secondary" onClick={() => setConfirm(null)}>Bekor qilish</button>
                            <button type="button" className="tests-button tests-button-danger" disabled={busy} onClick={confirmAction}>{busy ? 'Bajarilmoqda…' : 'Tasdiqlash'}</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
