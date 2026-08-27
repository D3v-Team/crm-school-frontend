import { useEffect, useState } from 'react';
import {
    useGetMyWeekTopicsQuery,
    useCreateWeeklyTopicMutation,
    useDeleteWeeklyTopicMutation,
} from '../../../../store/services/weekly-topic.api';
import { useLazyGetTeacherGroupsByTeacherIdQuery } from '../../../../store/services/theacher-group.api';
import { useLazyGetTeacherSubjectsByTeacherIdQuery } from '../../../../store/services/teacher-subject.api';
import {
    BookOpen, Plus, Trash2, ChevronLeft, ChevronRight,
    CalendarDays, Layers, X, Check,
} from 'lucide-react';
import Loading from '../../../Other/UI/Loadings/Loading';
import Modal from '../../../Other/UI/Modal/Modal';
import { Alert } from '../../../Other/UI/Alert/Alert';

/* ── helpers ── */
const fmt = (d) => {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};
const getMondayOf = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return fmt(d);
};
const getSundayOf = (mondayStr) => {
    const d = new Date(mondayStr);
    d.setDate(d.getDate() + 6);
    return fmt(d);
};
const fmtDisplay = (s) => {
    if (!s) return '';
    const [y, m, dd] = s.split('-');
    return `${dd}.${m}.${y}`;
};
const DAY_NAMES = { 0: 'Yak', 1: 'Dush', 2: 'Sesh', 3: 'Chor', 4: 'Pay', 5: 'Jum', 6: 'Shan' };

/* ── Create modal ── */
function CreateTopicModal({ open, onClose, teacherId, weekStart, onCreated }) {
    const [fetchGroups, { data: groupsData, isLoading: gl }] = useLazyGetTeacherGroupsByTeacherIdQuery();
    const [fetchSubjects, { data: subjectsData, isLoading: sl }] = useLazyGetTeacherSubjectsByTeacherIdQuery();
    const [createTopic, { isLoading: saving }] = useCreateWeeklyTopicMutation();

    const [form, setForm] = useState({ group_id: '', subject_id: '', topic: '', week_start_date: weekStart });

    useEffect(() => {
        if (open && teacherId) {
            fetchGroups(teacherId);
            fetchSubjects(teacherId);
            setForm({ group_id: '', subject_id: '', topic: '', week_start_date: weekStart });
        }
    }, [open, teacherId]);

    // sync week when it changes
    useEffect(() => {
        setForm(prev => ({ ...prev, week_start_date: weekStart }));
    }, [weekStart]);

    const groups   = groupsData?.data?.records   || groupsData?.data   || [];
    const subjects = subjectsData?.data?.records || subjectsData?.data || [];

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleSave = async () => {
        if (!form.group_id)   return Alert("Guruhni tanlang", 'warning');
        if (!form.subject_id) return Alert("Fanni tanlang",   'warning');
        if (!form.topic.trim()) return Alert("Mavzu nomini kiriting", 'warning');
        try {
            await createTopic({
                group_id:        form.group_id,
                subject_id:      form.subject_id,
                topic:           form.topic.trim(),
                week_start_date: form.week_start_date,
            }).unwrap();
            Alert("Mavzu qo'shildi", 'success');
            onCreated();
            onClose();
        } catch (e) {
            Alert(e?.data?.message || "Xatolik yuz berdi", 'error');
        }
    };

    const selectStyle = {
        padding: '10px 14px',
        background: 'var(--input-bg)',
        border: '1.5px solid var(--input-border)',
        borderRadius: 9,
        color: 'var(--input-text)',
        fontSize: '0.82rem',
        outline: 'none',
        cursor: 'pointer',
        width: '100%',
    };
    const inputStyle = {
        ...selectStyle,
        resize: 'none',
    };

    return (
        <Modal open={open} onClose={onClose} title="Yangi mavzu qo'shish" size="sm">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Week */}
                <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                        Hafta boshlanishi
                    </label>
                    <input
                        type="date"
                        value={form.week_start_date}
                        onChange={e => set('week_start_date', getMondayOf(new Date(e.target.value)))}
                        style={{ ...inputStyle }}
                    />
                </div>

                {/* Group */}
                <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                        Guruh <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    {gl ? <Loading /> : (
                        <select value={form.group_id} onChange={e => set('group_id', e.target.value)} style={selectStyle}>
                            <option value="">— Guruhni tanlang —</option>
                            {groups.map(item => {
                                const g = item.group || item;
                                return <option key={g.id} value={g.id}>{g.name}</option>;
                            })}
                        </select>
                    )}
                </div>

                {/* Subject */}
                <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                        Fan <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    {sl ? <Loading /> : (
                        <select value={form.subject_id} onChange={e => set('subject_id', e.target.value)} style={selectStyle}>
                            <option value="">— Fanni tanlang —</option>
                            {subjects.map(item => {
                                const s = item.subject || item;
                                return <option key={s.id} value={s.id}>{s.name}</option>;
                            })}
                        </select>
                    )}
                </div>

                {/* Topic name */}
                <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                        Mavzu nomi <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <textarea
                        rows={3}
                        value={form.topic}
                        onChange={e => set('topic', e.target.value)}
                        placeholder="Mavzu nomini kiriting..."
                        style={inputStyle}
                    />
                </div>
            </div>

            <div className="modal-footer">
                <button className="btn-cancel" onClick={onClose}>
                    <X size={14} /> Bekor qilish
                </button>
                <button className="btn-submit" onClick={handleSave} disabled={saving}>
                    <Check size={14} /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
            </div>
        </Modal>
    );
}

/* ── Delete confirm modal ── */
function DeleteConfirmModal({ open, onClose, topicName, onConfirm, saving }) {
    return (
        <Modal open={open} onClose={onClose} title="Mavzuni o'chirish" size="sm">
            <div style={{ padding: '4px 0 8px', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-primary)' }}>"{topicName}"</strong> mavzusini o'chirishni tasdiqlaysizmi?
                Bu amalni qaytarib bo'lmaydi.
            </div>
            <div className="modal-footer">
                <button className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                <button
                    onClick={onConfirm}
                    disabled={saving}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 18px', borderRadius: 9, border: 'none',
                        background: saving ? 'var(--input-bg)' : 'var(--danger)',
                        color: saving ? 'var(--text-muted)' : '#fff',
                        fontSize: '0.82rem', fontWeight: 600,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                    }}>
                    <Trash2 size={14} /> {saving ? "O'chirilmoqda..." : "O'chirish"}
                </button>
            </div>
        </Modal>
    );
}

/* ── Main component ── */
export default function TeacherTopics({ teacherId }) {
    const [weekStart, setWeekStart] = useState(getMondayOf(new Date()));
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, topic }
    const [deleting, setDeleting] = useState(false);

    /* Teacher groups for filter select */
    const [fetchGroups, { data: groupsData }] = useLazyGetTeacherGroupsByTeacherIdQuery();
    useEffect(() => { if (teacherId) fetchGroups(teacherId); }, [teacherId]);
    const groups = groupsData?.data?.records || groupsData?.data || [];

    /* Topics */
    const { data: topicsData, isLoading, error, refetch } = useGetMyWeekTopicsQuery(
        { week_start_date: weekStart },
        { skip: !teacherId }
    );
    const [deleteWeeklyTopic] = useDeleteWeeklyTopicMutation();

    const rawTopics = topicsData?.data?.records || topicsData?.data || [];
    const topics = selectedGroupId
        ? rawTopics.filter(t => t.group_id === selectedGroupId)
        : rawTopics;

    const changeWeek = (dir) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + dir * 7);
        setWeekStart(fmt(d));
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteWeeklyTopic(deleteTarget.id).unwrap();
            Alert("Mavzu o'chirildi", 'success');
            setDeleteTarget(null);
            refetch();
        } catch (e) {
            Alert(e?.data?.message || "Xatolik", 'error');
        } finally {
            setDeleting(false);
        }
    };

    const weekEnd = getSundayOf(weekStart);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* ── Toolbar ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* Week nav */}
                <button onClick={() => changeWeek(-1)} style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={16} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9, border: '1px solid var(--card-border)', background: 'var(--input-bg)', minWidth: 210, justifyContent: 'center' }}>
                    <CalendarDays size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {new Date(weekStart).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long' })}
                        {' – '}
                        {new Date(weekEnd).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                </div>
                <button onClick={() => changeWeek(1)} style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={16} />
                </button>

                {/* Group filter */}
                <select
                    value={selectedGroupId}
                    onChange={e => setSelectedGroupId(e.target.value)}
                    style={{ padding: '8px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--input-border)', borderRadius: 9, color: 'var(--input-text)', fontSize: '0.82rem', outline: 'none', cursor: 'pointer', minWidth: 160 }}>
                    <option value="">Barcha guruhlar</option>
                    {groups.map(item => {
                        const g = item.group || item;
                        return <option key={g.id} value={g.id}>{g.name}</option>;
                    })}
                </select>

                {/* Add button */}
                <button
                    onClick={() => setCreateOpen(true)}
                    className="btn-create"
                    style={{ marginLeft: 'auto' }}>
                    <Plus size={15} /> Mavzu qo'shish
                </button>
            </div>

            {error && (
                <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10 }}>
                    Xatolik: {error?.data?.message}
                </div>
            )}

            {/* ── Topics list ── */}
            {isLoading ? <Loading /> : topics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <BookOpen size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ marginBottom: 16 }}>Bu hafta mavzu yo'q</p>
                    <button onClick={() => setCreateOpen(true)} className="btn-create">
                        <Plus size={14} /> Mavzu qo'shish
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topics.map((topic, i) => {
                        const hasNoTopic  = !topic.topic_id || !topic.topic;
                        const lessonDates = topic.lesson_dates || [];

                        return (
                            <div key={topic.group_id + '-' + (topic.topic_id || i)} style={{
                                background: 'var(--card-bg)',
                                border: `1.5px solid ${hasNoTopic ? 'var(--warning)' : 'var(--card-border)'}`,
                                borderRadius: 14,
                                overflow: 'hidden',
                                transition: 'border-color 0.15s, box-shadow 0.15s',
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = hasNoTopic ? 'var(--warning)' : 'var(--accent)';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = hasNoTopic ? 'var(--warning)' : 'var(--card-border)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}>

                                {/* Header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 18px',
                                    background: hasNoTopic ? 'var(--warning-soft)' : 'var(--accent-soft)',
                                    borderBottom: lessonDates.length > 0 ? '1px solid var(--card-border)' : 'none',
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                                        background: hasNoTopic ? 'var(--warning)' : 'var(--accent)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <BookOpen size={16} style={{ color: '#fff' }} />
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                            {hasNoTopic
                                                ? <span style={{ color: 'var(--warning)', fontStyle: 'italic' }}>Mavzu belgilanmagan</span>
                                                : topic.topic
                                            }
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {topic.group_name && (
                                                <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', background: 'var(--input-bg)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--card-border)' }}>
                                                    <Layers size={10} /> {topic.group_name}
                                                </span>
                                            )}
                                            {topic.subject_name && (
                                                <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4, color: hasNoTopic ? 'var(--warning)' : 'var(--accent)', background: hasNoTopic ? 'var(--warning-soft)' : 'var(--accent-soft)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--card-border)' }}>
                                                    <BookOpen size={10} /> {topic.subject_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delete btn — only if topic exists */}
                                    {topic.topic_id && (
                                        <button
                                            onClick={() => setDeleteTarget({ id: topic.topic_id, topic: topic.topic })}
                                            title="O'chirish"
                                            style={{
                                                width: 32, height: 32, borderRadius: 8, border: 'none', flexShrink: 0,
                                                background: 'var(--danger-soft)', color: 'var(--danger)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-soft)'; e.currentTarget.style.color = 'var(--danger)'; }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Lesson dates */}
                                {lessonDates.length > 0 && (
                                    <div style={{ padding: '10px 18px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <CalendarDays size={12} /> Dars kunlari:
                                        </span>
                                        {lessonDates.map((date, di) => {
                                            const dayOfWeek = new Date(date).getDay();
                                            return (
                                                <span key={di} style={{
                                                    fontSize: '0.72rem', fontWeight: 600,
                                                    padding: '3px 10px', borderRadius: 7,
                                                    background: 'var(--input-bg)',
                                                    border: '1px solid var(--card-border)',
                                                    color: 'var(--text-primary)',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                }}>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{DAY_NAMES[dayOfWeek]}</span>
                                                    {fmtDisplay(date)}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Modals ── */}
            <CreateTopicModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                teacherId={teacherId}
                weekStart={weekStart}
                onCreated={refetch}
            />

            <DeleteConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                topicName={deleteTarget?.topic || ''}
                onConfirm={handleDelete}
                saving={deleting}
            />
        </div>
    );
}
