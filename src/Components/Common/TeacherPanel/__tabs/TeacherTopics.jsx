import { useEffect, useState } from 'react';
import { useLazyGetMyWeekTopicsQuery } from '../../../../store/services/weekly-topic.api';
import { useLazyGetTeacherGroupsByTeacherIdQuery } from '../../../../store/services/theacher-group.api';
import { BookOpen, CalendarDays, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import Loading from '../../../Other/UI/Loadings/Loading';

const fmtDate = (d) => {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};
const getMondayOf = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return fmtDate(d);
};
const fmtDisplayDate = (s) => {
    if (!s) return '';
    const [y, m, dd] = s.split('-');
    return `${dd}.${m}.${y}`;
};
const DAY_NAMES = {
    0: 'Yak', 1: 'Dush', 2: 'Sesh', 3: 'Chor', 4: 'Pay', 5: 'Jum', 6: 'Shan',
};

export default function TeacherTopics({ teacherId }) {
    const [weekStart, setWeekStart] = useState(getMondayOf(new Date()));
    const [selectedGroupId, setSelectedGroupId] = useState('');

    const [fetchGroups, { data: groupsData, isLoading: gl }] = useLazyGetTeacherGroupsByTeacherIdQuery();
    const [fetchTopics, { data: topicsData, isLoading: tl, error }] = useLazyGetMyWeekTopicsQuery();

    useEffect(() => {
        if (teacherId) fetchGroups(teacherId);
    }, [teacherId]);

    useEffect(() => {
        if (teacherId) fetchTopics({ week_start_date: weekStart });
    }, [teacherId, weekStart]);

    const groups = groupsData?.data?.records || groupsData?.data || [];

    /* API response: [{group_id, group_name, subject_id, subject_name, lesson_dates, topic_id, topic}] */
    const rawTopics = topicsData?.data?.records || topicsData?.data || [];
    const topics = rawTopics.filter(t =>
        !selectedGroupId || t.group_id === selectedGroupId
    );

    const changeWeek = (weeks) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + weeks * 7);
        setWeekStart(fmtDate(d));
    };
    const weekEnd = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 6);
        return fmtDate(d);
    };

    const filterSel = {
        padding: '9px 12px', background: 'var(--input-bg)',
        border: '1.5px solid var(--input-border)', borderRadius: 9,
        color: 'var(--input-text)', fontSize: '0.82rem',
        outline: 'none', cursor: 'pointer',
    };

    if (gl) return <Loading />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* ── Header bar ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => changeWeek(-1)} style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: 200, textAlign: 'center' }}>
                    {new Date(weekStart).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long' })}
                    {' – '}
                    {new Date(weekEnd()).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => changeWeek(1)} style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={16} />
                </button>
                <select style={{ ...filterSel, minWidth: 160 }} value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}>
                    <option value="">Barcha guruhlar</option>
                    {groups.map(item => {
                        const g = item.group || item;
                        return <option key={g.id} value={g.id}>{g.name}</option>;
                    })}
                </select>
            </div>

            {error && (
                <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10 }}>
                    Xatolik: {error?.data?.message}
                </div>
            )}

            {/* ── Topics list ── */}
            {tl ? <Loading /> : topics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <BookOpen size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }} />
                    <p>Bu hafta mavzu yo'q</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topics.map((topic, i) => {
                        const hasNoTopic = !topic.topic_id || !topic.topic;
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
                                }}
                            >
                                {/* Top bar */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 18px',
                                    background: hasNoTopic ? 'var(--warning-soft)' : 'var(--accent-soft)',
                                    borderBottom: '1px solid var(--card-border)',
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                                        background: hasNoTopic ? 'var(--warning)' : 'var(--accent)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <BookOpen size={16} style={{ color: '#fff' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {hasNoTopic
                                                ? <span style={{ color: 'var(--warning)', fontStyle: 'italic' }}>Mavzu yo'q</span>
                                                : topic.topic
                                            }
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                                            {/* Group badge */}
                                            {topic.group_name && (
                                                <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', background: 'var(--input-bg)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--card-border)' }}>
                                                    <Layers size={10} /> {topic.group_name}
                                                </span>
                                            )}
                                            {/* Subject badge */}
                                            {topic.subject_name && (
                                                <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4, color: hasNoTopic ? 'var(--warning)' : 'var(--accent)', background: hasNoTopic ? 'var(--warning-soft)' : 'var(--accent-soft)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--card-border)' }}>
                                                    <BookOpen size={10} /> {topic.subject_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Lesson dates */}
                                {lessonDates.length > 0 && (
                                    <div style={{ padding: '10px 18px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
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
                                                    {fmtDisplayDate(date)}
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
        </div>
    );
}
