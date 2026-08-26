import { useEffect, useState } from 'react';
import { useLazyGetTeacherQuery } from '../../../../store/services/statistic.api';
import { useLazyGetTeacherGroupsByTeacherIdQuery } from '../../../../store/services/theacher-group.api';
import { useLazyGetGradesQuery } from '../../../../store/services/grades.api';
import { useLazyGetGroupScheduleByTeacherQuery } from '../../../../store/services/group-schedule.api';
import {
    Layers, BookOpen, Users, CalendarDays,
    Star, CheckCircle, TrendingUp, Clock,
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

function StatCard({ icon: Icon, label, value, color, large }) {
    return (
        <div style={{
            background: 'var(--card-bg)',
            border: `1.5px solid ${color}33`,
            borderRadius: 16,
            padding: large ? '22px 24px' : '16px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: 'var(--shadow-sm)',
            transition: 'box-shadow 0.15s, border-color 0.15s',
        }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 0 3px ${color}22`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}33`; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
        >
            <div style={{
                width: large ? 56 : 44, height: large ? 56 : 44,
                borderRadius: 14, background: color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <Icon size={large ? 24 : 20} style={{ color }} />
            </div>
            <div>
                <div style={{ fontSize: large ? '2rem' : '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
            </div>
        </div>
    );
}

export default function TeacherDashboard({ teacherId }) {
    const now = new Date();
    const todayKey = JS_DAY[now.getDay()];
    const [year,  setYear]  = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    const [fetchStats,    { data: statsData,    isLoading: sl }] = useLazyGetTeacherQuery();
    const [fetchGroups,   { data: groupsData,   isLoading: gl }] = useLazyGetTeacherGroupsByTeacherIdQuery();
    const [fetchGrades,   { data: gradesData                  }] = useLazyGetGradesQuery();
    const [fetchSchedule, { data: scheduleData               }] = useLazyGetGroupScheduleByTeacherQuery();

    const fmtDate = (d) => {
        const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
        return `${y}-${m}-${dd}`;
    };

    useEffect(() => {
        if (!teacherId) return;
        fetchGroups(teacherId);
        fetchSchedule({ teacherId, date: fmtDate(now) });
    }, [teacherId]);

    useEffect(() => {
        if (!teacherId) return;
        fetchStats({ year, month });
        const firstDay = `${year}-${String(month).padStart(2,'0')}-01`;
        const lastDate = new Date(year, month, 0);
        const lastDay  = `${year}-${String(month).padStart(2,'0')}-${String(lastDate.getDate()).padStart(2,'0')}`;
        fetchGrades({ teacher_id: teacherId, date_from: firstDay, date_to: lastDay, limit: 500 });
    }, [year, month, teacherId]);

    const stats  = statsData?.data  || {};
    const groups = groupsData?.data?.records || groupsData?.data || [];

    /* today schedule */
    const allSchedule = scheduleData?.data?.records || scheduleData?.data || [];
    const todaySchedule = allSchedule
        .filter(s => s.day_of_week === todayKey)
        .sort((a,b) => toMins(a.start_time) - toMins(b.start_time));

    /* per-group avg grade from /api/grade */
    const gradeRecords = gradesData?.data?.records || [];
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
        { icon: Users,        label: "Jami o'quvchilar",  value: stats.total_students    ?? (groups.reduce((s,g)=>(s+(g.group?.students?.length??0)),0) || '—'), color: '#3b82f6' },
        { icon: Layers,       label: 'Guruhlar soni',      value: stats.total_groups      ?? groups.length,                                                     color: '#8b5cf6' },
        { icon: CalendarDays, label: 'Bugungi darslar',    value: todaySchedule.length,                                                                          color: '#f59e0b' },
        { icon: CheckCircle,  label: 'Davomat foizi',      value: stats.attendance_rate  != null ? `${stats.attendance_rate}%`  : '—',                           color: '#10b981' },
        { icon: Star,         label: "O'rtacha baho",      value: stats.avg_grade        != null ? `${stats.avg_grade}%`        : '—',                           color: '#06b6d4' },
        { icon: TrendingUp,   label: 'Jami darslar (oy)', value: stats.total_lessons     ?? '—',                                                                  color: '#f43f5e' },
    ].filter(c => c.value !== '—');

    if (sl || gl) return <Loading />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                    {kpiCards.map((c,i) => <StatCard key={i} {...c} large={i < 2} />)}
                </div>
            )}

            {/* ── Today schedule + groups — two column ── */}
            <div style={{ display: 'grid', gridTemplateColumns: todaySchedule.length > 0 ? '1fr 1.6fr' : '1fr', gap: 16 }}>

                {/* Today schedule */}
                {todaySchedule.length > 0 && (
                    <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--accent)', borderRadius: 18, padding: '20px 22px', boxShadow: '0 0 0 3px var(--accent-glow)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CalendarDays size={16} style={{ color: '#fff' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Bugungi darslar
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>
                                    {DAY_LABELS[todayKey] || 'Yakshanba'}
                                </div>
                            </div>
                            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                                {todaySchedule.length} ta
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {todaySchedule.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--accent-soft)', border: '1px solid var(--card-border)' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Clock size={15} style={{ color: '#fff' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)' }}>
                                            {item.start_time} – {item.end_time}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.subject?.name || '—'}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Layers size={10} /> {item.group?.name || '—'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Groups */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 18, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers size={16} style={{ color: 'var(--accent)' }} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Mening guruhlarim
                        </span>
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
                                const studentCount = group?.students?.length ?? group?.student_count ?? null;

                                return (
                                    <div key={item.id} style={{
                                        padding: '14px 16px', borderRadius: 14,
                                        background: 'var(--input-bg)', border: '1.5px solid var(--card-border)',
                                        transition: 'border-color 0.15s',
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
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

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
                            return (
                                <div key={g.group_id || i} style={{ background: 'var(--input-bg)', borderRadius: 14, padding: '14px 18px', border: '1px solid var(--card-border)' }}>
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
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
