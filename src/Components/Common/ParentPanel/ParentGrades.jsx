import { useEffect, useState } from 'react';
import { useLazyGetMyChildrenGradesQuery } from '../../../store/services/grades.api';
import { BookOpen, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';

/* ── helpers ── */
const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('uz-UZ') : '—';
const scoreColor = (s) => s == null ? 'var(--text-muted)'   : s >= 80 ? 'var(--success)'      : s >= 60 ? 'var(--warning)'      : 'var(--danger)';
const scoreBg    = (s) => s == null ? 'var(--input-bg)'     : s >= 80 ? 'var(--success-soft)'  : s >= 60 ? 'var(--warning-soft)'  : 'var(--danger-soft)';

/* ── Child tab bar ── */
function ChildTabBar({ children, active, onChange }) {
    return (
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--input-bg)', borderRadius: 12, border: '1px solid var(--card-border)', marginBottom: 20, overflowX: 'auto', flexShrink: 0 }}>
            {children.map((child) => {
                const isActive = active === child.student_id;
                return (
                    <button key={child.student_id} onClick={() => onChange(child.student_id)} style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                        fontSize: '0.82rem', fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap',
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        transition: 'all 0.15s', flexShrink: 0,
                    }}>
                        <div style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                            background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--accent-soft)',
                            color: isActive ? '#fff' : 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 700,
                        }}>
                            {(child.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                        {child.full_name}
                    </button>
                );
            })}
        </div>
    );
}

/* ── Grades content for one child ── */
function ChildGrades({ studentData, dateFrom, setDateFrom, dateTo, setDateTo, onLoad }) {
    const [subjectFilter, setSubjectFilter] = useState('all');
    const dates = studentData?.dates || [];

    const rows = [];
    dates.forEach(de => {
        de.subjects?.forEach(sb => {
            rows.push({
                key:          `${de.date}-${sb.group_schedule_id}`,
                date:         de.date,
                subject_name: sb.subject_name || '—',
                teacher_name: sb.teacher_name || '—',
                score:        sb.score,
                comment:      sb.comment || '',
            });
        });
    });
    rows.sort((a, b) => b.date.localeCompare(a.date));
    const subjects = [...new Set(rows.map(row => row.subject_name).filter(Boolean))].sort();
    const filteredRows = subjectFilter === 'all' ? rows : rows.filter(row => row.subject_name === subjectFilter);

    const graded  = filteredRows.filter(r => r.score != null);
    const avg     = graded.length ? Math.round(graded.reduce((s, r) => s + Number(r.score), 0) / graded.length) : null;

    const LIMIT = 20;
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / LIMIT));
    const paged = filteredRows.slice((page - 1) * LIMIT, page * LIMIT);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filter */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
                <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Dan</label>
                    <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                        className="search-input" style={{ paddingLeft: 14, width: 150 }} />
                </div>
                <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Gacha</label>
                    <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                        className="search-input" style={{ paddingLeft: 14, width: 150 }} />
                </div>
                <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Fan</label>
                    <select value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setPage(1); }} className="search-select" style={{ minWidth: 170 }}>
                        <option value="all">Barcha fanlar</option>
                        {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                </div>
                <button onClick={onLoad} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 16px', borderRadius: 9, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                    Ko'rish
                </button>

                {avg != null && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: scoreBg(avg), border: `1px solid ${scoreColor(avg)}` }}>
                        <BookOpen size={14} style={{ color: scoreColor(avg) }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: scoreColor(avg) }}>
                            O'rtacha: {avg}%
                        </span>
                    </div>
                )}
            </div>

            {/* Stats */}
            {filteredRows.length > 0 && (
                <div className="student-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                    {[
                        { label: "Jami darslar", val: filteredRows.length,    color: 'var(--accent)',   bg: 'var(--accent-soft)'   },
                        { label: "Baholangan",   val: graded.length,  color: 'var(--success)',  bg: 'var(--success-soft)'  },
                        { label: "Baholanmagan", val: filteredRows.length - graded.length, color: 'var(--text-muted)', bg: 'var(--input-bg)' },
                        ...(avg != null ? [{ label: "O'rtacha baho", val: avg + '%', color: scoreColor(avg), bg: scoreBg(avg) }] : []),
                    ].map((s, i) => (
                        <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: s.color }}>{s.val}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {filteredRows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <BookOpen size={40} style={{ opacity: .2, margin: '0 auto 10px', display: 'block' }} />
                    <p>Baholar topilmadi</p>
                </div>
            ) : (
                <>
                    <div className="responsive-content-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                        {paged.map((r, i) => (
                            <div key={r.key} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{r.subject_name}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{fmtDate(r.date)}</div>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'right', overflowWrap: 'anywhere' }}>{r.teacher_name}</div>
                                </div>
                                <div style={{ background: scoreBg(r.score), borderRadius: 8, padding: '9px 10px' }}>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Baho</div>
                                    <div style={{ fontWeight: 700, color: scoreColor(r.score), marginTop: 2 }}>{r.score != null ? `${r.score}%` : '—'}</div>
                                </div>
                                {r.comment && <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 8, fontSize: '0.75rem', color: 'var(--text-secondary)' }}><strong>Izoh:</strong> {r.comment}</div>}
                            </div>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination">
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Jami {filteredRows.length} ta yozuv</span>
                            <div className="pagination-controls">
                                <button className="page-btn" onClick={() => setPage(1)} disabled={page <= 1}><ChevronsLeft size={15} /></button>
                                <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft size={15} /></button>
                                <span className="page-current">{page}</span>
                                <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><ChevronRight size={15} /></button>
                                <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page >= totalPages}><ChevronsRight size={15} /></button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ── Main export ── */
export default function ParentGrades() {
    const now = new Date();
    const [dateFrom, setDateFrom] = useState(toISO(new Date(now.getFullYear(), now.getMonth(), 1)));
    const [dateTo,   setDateTo]   = useState(toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)));

    const [fetchGrades, { data, isLoading, error }] = useLazyGetMyChildrenGradesQuery();

    const load = () => fetchGrades({ date_from: dateFrom, date_to: dateTo });
    useEffect(() => { load(); }, []);

    /* children list: [{student_id, full_name, dates}] */
    const children = data?.data || [];
    const [activeChild, setActiveChild] = useState(null);

    useEffect(() => {
        if (children.length > 0 && !activeChild) setActiveChild(children[0].student_id);
    }, [children]);

    const activeData = children.find(c => c.student_id === activeChild);

    if (isLoading) return <Loading />;

    if (error) return (
        <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10 }}>
            Xatolik: {error?.data?.message}
        </div>
    );

    if (children.length === 0) return (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }} />
            <p>Farzandlar topilmadi</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Per-child tab bar */}
            <ChildTabBar children={children} active={activeChild} onChange={setActiveChild} />

            {/* Content for active child */}
            {activeData && (
                <ChildGrades
                    studentData={activeData}
                    dateFrom={dateFrom}
                    setDateFrom={setDateFrom}
                    dateTo={dateTo}
                    setDateTo={setDateTo}
                    onLoad={load}
                />
            )}
        </div>
    );
}
