import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLazyGetTeacherQuery } from '../../../../store/services/statistic.api';
import { useLazyGetGroupsQuery } from '../../../../store/services/group.api';
import { useLazyGetGradesQuery } from '../../../../store/services/grades.api';
import { useLazyGetGroupScheduleByTeacherQuery } from '../../../../store/services/group-schedule.api';
import {
    Layers, BookOpen, Users, CalendarDays,
    Star, CheckCircle, TrendingUp, ClipboardCheck, ChevronRight,
} from 'lucide-react';
import Loading from '../../../Other/UI/Loadings/Loading';

const MONTHS = [
    'Yanvar','Fevral','Mart','Aprel','May','Iyun',
    'Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr',
];
const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_LABELS = {
    monday:'Dushanba', tuesday:'Seshanba', wednesday:'Chorshanba',
    thursday:'Payshanba', friday:'Juma', saturday:'Shanba',
};
const JS_DAY = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const getRecords = (response) => {
    const result = response?.data ?? response;
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.records)) return result.records;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.data?.records)) return result.data.records;
    return [];
};

const scoreColor = (v) => v >= 80 ? 'var(--success)' : v >= 60 ? 'var(--warning)' : 'var(--danger)';
const scoreBg    = (v) => v >= 80 ? 'var(--success-soft)' : v >= 60 ? 'var(--warning-soft)' : 'var(--danger-soft)';
const toMins     = (t) => { const [h,m] = (t||'0:0').split(':').map(Number); return h*60+m; };

function ProgressBar({ value, color }) {
    return (
        <div style={{ height: 8, borderRadius: 99, background: 'var(--input-bg)', overflow: 'hidden', marginTop: 6 }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(100, value||0)}%`, background: color, transition: 'width 0.5s' }} />
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, to }) {
    return (
        <NavLink to={to} aria-label={`${label}: ${value}`} style={{ display: 'block', color: 'inherit', textDecoration: 'none', borderRadius: 16 }}>
            <div style={{
                background: 'var(--card-bg)',
                border: `1.5px solid ${color}33`,
                borderRadius: 16,
                padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: 'var(--shadow-sm)',
                transition: 'box-shadow 0.15s, border-color 0.15s',
                minWidth: 0,
                cursor: 'pointer',
            }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 0 3px ${color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}33`; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
                <div style={{
                    width: 44, height: 44,
                    borderRadius: 12, background: color + '18', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={20} style={{ color }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                    <div style={{
                        fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4,
                        wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.3,
                    }}>{label}</div>
                </div>
            </div>
        </NavLink>
    );
}

const LESSON_STATE = {
    now:   { label: 'Hozir davom etmoqda', color: 'var(--success)', bg: 'var(--success-soft)' },
    next:  { label: 'Keyingi dars',        color: 'var(--accent)',  bg: 'var(--accent-soft)'  },
    later: { label: 'Kutilmoqda',          color: 'var(--text-muted)', bg: 'var(--input-bg)'  },
    done:  { label: 'Tugagan',             color: 'var(--text-muted)', bg: 'var(--input-bg)'  },
};

/* Bugungi dars kartochkasi — bosilsa shu darsning yo'qlama va baho oynasi ochiladi */
function TodayLessonCard({ lesson, state }) {
    const meta = LESSON_STATE[state];
    const groupId = lesson.group?.id || lesson.group_id;
    const to = groupId ? `/group/${groupId}?lesson=${lesson.id}` : '/teacher/schedule';
    return (
        <NavLink to={to} className={`teacher-lesson-card is-${state}`} aria-label={`${lesson.group?.name || ''} ${lesson.subject?.name || ''} — yo'qlama va baho`}>
            <div className="teacher-lesson-time">
                <strong>{lesson.start_time?.slice(0,5)}</strong>
                <span>{lesson.end_time?.slice(0,5)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <span className="teacher-lesson-badge" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                <div className="teacher-lesson-group">{lesson.group?.name || '—'}</div>
                <div className="teacher-lesson-subject"><BookOpen size={11} /> {lesson.subject?.name || 'Fan belgilanmagan'}</div>
            </div>
            <span className="teacher-lesson-cta"><ClipboardCheck size={16} /> <span>Yo&apos;qlama va baho</span><ChevronRight size={16} /></span>
        </NavLink>
    );
}

export default function TeacherDashboard({ teacherId }) {
    const now = new Date();
    const todayKey = JS_DAY[now.getDay()];
    const [year,  setYear]  = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    const [fetchStats,    { data: statsData,    isLoading: sl }] = useLazyGetTeacherQuery();
    const [fetchGroups,   { data: groupsData,   isLoading: gl }] = useLazyGetGroupsQuery();
    const [fetchGrades,   { data: gradesData                  }] = useLazyGetGradesQuery();
    const [fetchSchedule, { data: scheduleData, isLoading: scheduleLoading, error: scheduleError }] = useLazyGetGroupScheduleByTeacherQuery();

    useEffect(() => {
        if (!teacherId) return;
        fetchGroups({ teacher_id: teacherId, page: 1, limit: 200 });
        fetchSchedule(teacherId);
    }, [teacherId, fetchGroups, fetchSchedule]);

    useEffect(() => {
        if (!teacherId) return;
        fetchStats({ year, month });
        const firstDay = `${year}-${String(month).padStart(2,'0')}-01`;
        const lastDate = new Date(year, month, 0);
        const lastDay  = `${year}-${String(month).padStart(2,'0')}-${String(lastDate.getDate()).padStart(2,'0')}`;
        fetchGrades({ teacher_id: teacherId, date_from: firstDay, date_to: lastDay, limit: 500 });
    }, [year, month, teacherId, fetchGrades, fetchStats]);

    const stats  = statsData?.data  || {};
    const groups = getRecords(groupsData);

    /* today schedule */
    const allSchedule = getRecords(scheduleData);
    const todaySchedule = allSchedule
        .filter(s => String(s.day_of_week || '').toLowerCase() === todayKey && !s.archived_at)
        .sort((a,b) => toMins(a.start_time) - toMins(b.start_time));

    /* Dars holati: hozir / keyingi / tugagan / kutilmoqda */
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const nextLesson = todaySchedule.find(lesson => toMins(lesson.start_time) > nowMins);
    const lessonState = (lesson) => {
        const start = toMins(lesson.start_time);
        const end = toMins(lesson.end_time);
        if (nowMins >= start && nowMins < end) return 'now';
        if (nowMins >= end) return 'done';
        return lesson === nextLesson ? 'next' : 'later';
    };

    /* per-group avg grade from /api/grade */
    const gradeRecords = getRecords(gradesData);
    const gradeByGroup = gradeRecords.reduce((acc, r) => {
        const gid = r.group_id || r.group?.id;
        if (!gid) return acc;
        if (!acc[gid]) acc[gid] = { sum: 0, count: 0 };
        if (r.score != null) { acc[gid].sum += Number(r.score); acc[gid].count += 1; }
        return acc;
    }, {});

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
    const byGroup = stats.by_group || stats.groups || [];

    const kpiCards = [
        { icon: Users,        label: "Jami o'quvchilar",  value: stats.total_students    ?? (groups.reduce((s,g)=>(s+(g.students_count ?? g.students?.length ?? 0)),0) || '—'), color: '#3b82f6', to: '/teacher/groups' },
        { icon: Layers,       label: 'Guruhlar soni',      value: stats.total_groups      ?? groups.length,                                                       color: '#8b5cf6', to: '/teacher/groups' },
        { icon: CalendarDays, label: 'Bugungi darslar',    value: todaySchedule.length,                                                                            color: '#f59e0b', to: '/teacher/schedule' },
        { icon: CheckCircle,  label: 'Davomat foizi',      value: stats.attendance_rate  != null ? `${stats.attendance_rate}%`  : '—',                             color: '#10b981', to: '/teacher/groups' },
        { icon: Star,         label: "O'rtacha baho",      value: stats.avg_grade        != null ? `${stats.avg_grade}%`        : '—',                             color: '#06b6d4', to: '/teacher/groups' },
        { icon: TrendingUp,   label: 'Jami darslar (oy)', value: stats.total_lessons     ?? '—',                                                                    color: '#f43f5e', to: '/teacher/schedule' },
    ].filter(c => c.value !== '—');

    if (sl || gl) return <Loading />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── Today schedule + groups — responsive ── */}
            <div className="teacher-dash-grid" style={{ display: 'grid', gap: 16 }}>

                {/* Today schedule */}
                <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--accent)', borderRadius: 18, padding: '20px 22px', boxShadow: '0 0 0 3px var(--accent-glow)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CalendarDays size={16} style={{ color: '#fff' }} />
                            </div>
                            <NavLink to="/teacher/schedule" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Bugungi darslar
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>
                                    {DAY_LABELS[todayKey] || 'Yakshanba'}
                                </div>
                            </div>
                            </NavLink>
                            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                                {todaySchedule.length} ta
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {scheduleLoading ? (
                                <Loading />
                            ) : scheduleError ? (
                                <div role="alert" style={{ color: 'var(--danger)', padding: 10, background: 'var(--danger-soft)', borderRadius: 9, fontSize: '0.78rem' }}>
                                    Bugungi darslarni yuklab bo&apos;lmadi: {scheduleError?.data?.message || 'Xatolik'}
                                </div>
                            ) : todaySchedule.length === 0 ? (
                                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    Bugun jadval bo&apos;yicha dars yo&apos;q
                                </div>
                            ) : todaySchedule.map((lesson, index) => (
                                <TodayLessonCard key={lesson.id || index} lesson={lesson} state={lessonState(lesson)} />
                            ))}
                        </div>
                </div>

                {/* Groups */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 18, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers size={16} style={{ color: 'var(--accent)' }} />
                        </div>
                        <NavLink to="/teacher/groups" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
                            Mening guruhlarim
                        </NavLink>
                        {groups.length > 0 && (
                            <span style={{ fontSize: '0.72rem', background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                                {groups.length}
                            </span>
                        )}
                    </div>
                    {groups.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                            <Layers size={36} style={{ opacity: .2, margin: '0 auto 8px', display: 'block' }} />
                            <p style={{ fontSize: '0.875rem' }}>Guruhlar topilmadi</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {groups.map(item => {
                                const group   = item.group   || item;
                                const subject = item.subject || group.subject;
                                const gid     = group?.id;
                                const gStats  = gradeByGroup[gid];
                                const avgGrade = gStats?.count > 0 ? Math.round(gStats.sum / gStats.count) : null;
                                const studentCount = group?.students_count ?? group?.students?.length ?? group?.student_count ?? null;

                                return (
                                    <NavLink key={gid || item.id} to={gid ? `/group/${gid}` : '/teacher/groups'} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{
                                        padding: '14px 16px', borderRadius: 14,
                                        background: 'var(--input-bg)', border: '1.5px solid var(--card-border)',
                                        transition: 'border-color 0.15s',
                                        cursor: 'pointer',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: avgGrade != null ? 10 : 0 }}>
                                            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, flexShrink: 0, border: '2px solid var(--card-border)' }}>
                                                {(group?.name || 'GR').slice(0,2).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {group?.name || '—'}
                                                </div>
                                                <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                                                    {subject?.name && (
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                            <BookOpen size={10} /> {subject.name}
                                                        </span>
                                                    )}
                                                    {studentCount != null && (
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                            <Users size={10} /> {studentCount} ta
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {avgGrade != null && (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 2 }}>
                                                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Star size={10} /> O'rtacha baho
                                                    </span>
                                                    <span style={{ fontWeight: 700, color: scoreColor(avgGrade) }}>{avgGrade}%</span>
                                                </div>
                                                <ProgressBar value={avgGrade} color={scoreColor(avgGrade)} />
                                            </div>
                                        )}
                                    </div>
                                    </NavLink>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Statistika (pastda: o'qituvchi uchun asosiysi — bugungi darslar) ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Statistika</span>
            </div>
            {/* ── Filter bar ── */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
                padding: '12px 16px', background: 'var(--card-bg)',
                border: '1px solid var(--card-border)', borderRadius: 12 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginRight: 4 }}>Statistika davri:</span>
                <select value={year} onChange={e => setYear(+e.target.value)}
                    style={{ padding:'8px 14px', background:'var(--input-bg)', border:'1.5px solid var(--input-border)', borderRadius:9, color:'var(--input-text)', fontSize:'0.82rem', outline:'none', cursor:'pointer' }}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={month} onChange={e => setMonth(+e.target.value)}
                    style={{ padding:'8px 14px', background:'var(--input-bg)', border:'1.5px solid var(--input-border)', borderRadius:9, color:'var(--input-text)', fontSize:'0.82rem', outline:'none', cursor:'pointer' }}>
                    {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
            </div>

            {/* ── KPI cards ── */}
            {kpiCards.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                    {kpiCards.map(c => <StatCard key={c.label} {...c} />)}
                </div>
            )}

            {/* ── Per-group stats from /api/statistic/teacher ── */}
            {byGroup.length > 0 && (
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 18, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Guruhlar bo'yicha statistika — {MONTHS[month-1]} {year}
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                        {byGroup.map((g, i) => {
                            const att = g.attendance_rate ?? g.attendance ?? null;
                            const avg = g.avg_grade ?? g.average_grade ?? null;
                            const groupId = g.group_id || g.group?.id || g.id;
                            return (
                                <NavLink key={groupId || i} to={groupId ? `/group/${groupId}` : '/teacher/groups'} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                                <div style={{ background: 'var(--input-bg)', borderRadius: 14, padding: '14px 18px', border: '1px solid var(--card-border)', cursor: 'pointer' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                                        {g.group_name || g.name || '—'}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {att != null && (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 2 }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Davomat</span>
                                                    <span style={{ fontWeight: 700, color: scoreColor(att) }}>{att}%</span>
                                                </div>
                                                <ProgressBar value={att} color={scoreColor(att)} />
                                            </div>
                                        )}
                                        {avg != null && (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 2 }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>O'rtacha baho</span>
                                                    <span style={{ fontWeight: 700, color: scoreColor(avg) }}>{avg}%</span>
                                                </div>
                                                <ProgressBar value={avg} color={scoreColor(avg)} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
