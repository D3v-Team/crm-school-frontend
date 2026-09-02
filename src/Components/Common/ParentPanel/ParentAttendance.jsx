import { useEffect, useState } from 'react';
import { useLazyGetMyChildrenAttendanceQuery } from '../../../store/services/attedance.api';
import { useLazyGetParentQuery } from '../../../store/services/statistic.api';
import { useLazyGetStudentAttendanceAllQuery } from '../../../store/services/student-attendance.api';
import {
    CalendarDays, Clock, Users, LogIn, LogOut, User,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';

/* ── helpers ── */
const STATUS_STYLE = {
    present: { bg: 'var(--success-soft)', color: 'var(--success)', label: 'Keldi'    },
    absent:  { bg: 'var(--danger-soft)',  color: 'var(--danger)',  label: 'Kelmadi'  },
    late:    { bg: 'var(--warning-soft)', color: 'var(--warning)', label: 'Kechikdi' },
};
const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('uz-UZ') : '—';

const MONTH_LBL = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
const DAY_LBL   = {0:'Yakshanba',1:'Dushanba',2:'Seshanba',3:'Chorshanba',4:'Payshanba',5:'Juma',6:'Shanba'};
function parseDateInfo(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return { day: d.getDate(), month: MONTH_LBL[d.getMonth()], year: d.getFullYear(), weekday: DAY_LBL[d.getDay()], isWeekend: d.getDay() === 0 || d.getDay() === 6 };
}
/* ISO string yoki "HH:MM" ni "HH:MM" ga parse qiladi */
function parseTime(val) {
    if (!val) return '—';
    if (val.includes('T') || val.includes('Z')) {
        const d = new Date(val);
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    return val;
}

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
                        transition: 'all 0.15s',
                        flexShrink: 0,
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

/* ── Yo'qlama (Attendance) tab content per child ── */
function ChildAttendance({ studentData, dateFrom, setDateFrom, dateTo, setDateTo, onLoad }) {
    const [subjectFilter, setSubjectFilter] = useState('all');
    const dates = studentData?.dates || [];

    /* flatten rows */
    const rows = [];
    dates.forEach(de => {
        de.subjects?.forEach(sb => {
            rows.push({
                key: `${de.date}-${sb.group_schedule_id}`,
                date: de.date,
                day_of_week: de.day_of_week,
                subject_name: sb.subject_name || '—',
                teacher_name: sb.teacher_name || '—',
                status: sb.status,
                comment: sb.comment || '',
            });
        });
    });
    rows.sort((a, b) => b.date.localeCompare(a.date));
    const subjects = [...new Set(rows.map(row => row.subject_name).filter(Boolean))].sort();
    const filteredRows = subjectFilter === 'all' ? rows : rows.filter(row => row.subject_name === subjectFilter);

    const counts = { present: 0, absent: 0, late: 0 };
    filteredRows.forEach(r => { if (r.status && counts[r.status] !== undefined) counts[r.status]++; });
    const total = counts.present + counts.absent + counts.late;
    const pct   = total > 0 ? Math.round((counts.present / total) * 100) : null;

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
            </div>

            {/* Stat chips */}
            <div className="student-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                {[
                    { key: 'present', label: 'Keldi',    color: 'var(--success)', bg: 'var(--success-soft)' },
                    { key: 'absent',  label: 'Kelmadi',  color: 'var(--danger)',  bg: 'var(--danger-soft)'  },
                    { key: 'late',    label: 'Kechikdi', color: 'var(--warning)', bg: 'var(--warning-soft)' },
                    ...(pct !== null ? [{ key: 'pct', label: 'Davomat %', color: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)', bg: pct >= 80 ? 'var(--success-soft)' : pct >= 50 ? 'var(--warning-soft)' : 'var(--danger-soft)', val: pct + '%' }] : []),
                ].map(s => (
                    <div key={s.key} style={{ background: 'var(--card-bg)', border: `1px solid var(--card-border)`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: s.color }}>{s.val ?? counts[s.key] ?? 0}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {filteredRows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <CalendarDays size={40} style={{ opacity: .2, margin: '0 auto 10px', display: 'block' }} />
                    <p>Davomat ma'lumotlari topilmadi</p>
                </div>
            ) : (
                <>
                    <div className="responsive-content-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                        {paged.map(r => {
                            const st = STATUS_STYLE[r.status] || { bg: 'var(--input-bg)', color: 'var(--text-muted)', label: '—' };
                            return (
                                <div key={r.key} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{r.subject_name}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{fmtDate(r.date)}</div>
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'right', overflowWrap: 'anywhere' }}>{r.teacher_name}</div>
                                    </div>
                                    <div style={{ background: st.bg, borderRadius: 8, padding: '9px 10px' }}>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Davomat</div>
                                        <div style={{ fontWeight: 700, color: st.color, marginTop: 2 }}>{st.label}</div>
                                    </div>
                                    {r.comment && <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 8, fontSize: '0.75rem', color: 'var(--text-secondary)' }}><strong>Izoh:</strong> {r.comment}</div>}
                                </div>
                            );
                        })}
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

/* ── Kirdi-Chiqdi day card ── */
function DayCard({ record }) {
    const date  = record?.date;
    const times = record?.records || record?.entries || [];
    const df    = parseDateInfo(date);
    const ins   = times.filter(r => r.type === 'IN');
    const outs  = times.filter(r => r.type === 'OUT');

    return (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Date header */}
            <div style={{ background: df.isWeekend ? 'var(--danger-soft)' : 'var(--accent-soft)', borderBottom: '1px solid var(--card-border)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: df.isWeekend ? 'var(--danger)' : 'var(--accent)', lineHeight: 1 }}>{df.day}</span>
                    <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: df.isWeekend ? 'var(--danger)' : 'var(--accent)' }}>{df.month} {df.year}</div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{df.weekday}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: times.length > 0 ? 'var(--success-soft)' : 'var(--input-bg)', color: times.length > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                    <Clock size={9} />{times.length}
                </div>
            </div>
            {/* IN / OUT */}
            <div style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
                <div style={{ flex: 1, background: ins.length > 0 ? 'var(--success-soft)' : 'var(--input-bg)', border: `1px solid ${ins.length > 0 ? 'var(--success)' : 'var(--card-border)'}`, borderRadius: 8, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <LogIn size={11} style={{ color: ins.length > 0 ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: ins.length > 0 ? 'var(--success)' : 'var(--text-muted)' }}>Kirdi</span>
                    </div>
                    {ins.length > 0 ? ins.map((r, i) => (
                        <div key={i} style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '0.02em' }}>{parseTime(r.time)}</div>
                    )) : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</div>}
                </div>
                <div style={{ flex: 1, background: outs.length > 0 ? 'var(--danger-soft)' : 'var(--input-bg)', border: `1px solid ${outs.length > 0 ? 'var(--danger)' : 'var(--card-border)'}`, borderRadius: 8, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <LogOut size={11} style={{ color: outs.length > 0 ? 'var(--danger)' : 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: outs.length > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>Chiqdi</span>
                    </div>
                    {outs.length > 0 ? outs.map((r, i) => (
                        <div key={i} style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--danger)', letterSpacing: '0.02em' }}>{parseTime(r.time)}</div>
                    )) : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</div>}
                </div>
            </div>
        </div>
    );
}

/* ── Kirdi-Chiqdi per child ── */
function ChildEntryExit({ studentId }) {
    const [fetchAll, { data, isLoading }] = useLazyGetStudentAttendanceAllQuery();
    const [page, setPage] = useState(1);
    const LIMIT = 20;

    useEffect(() => { if (studentId) fetchAll({ student_id: studentId }); }, [studentId]);

    /*
     * Normalize any response shape into [{date, records:[{type,time}]}]:
     *  - { status, data: [{date, records}] }
     *  - { status, data: { records: [{date, records}] } }
     *  - { status, data: { data: [{date, records}] } }  (double-wrapped)
     */
    function extractRecords(resp) {
        if (!resp) return [];
        const d = resp?.data ?? resp;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.records)) return d.records;
        if (Array.isArray(d?.data)) return d.data;
        if (Array.isArray(d?.data?.records)) return d.data.records;
        return [];
    }
    const records    = extractRecords(data);
    const totalPages = Math.max(1, Math.ceil(records.length / LIMIT));
    const paged      = records.slice((page - 1) * LIMIT, page * LIMIT);

    if (isLoading) return <Loading />;
    if (records.length === 0) return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <Clock size={40} style={{ opacity: .2, margin: '0 auto 10px', display: 'block' }} />
            <p>Kirdi-chiqdi ma'lumotlari topilmadi</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                {paged.map((record, i) => <DayCard key={record.date || i} record={record} />)}
            </div>
            {totalPages > 1 && (
                <div className="pagination">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Jami {records.length} ta kun</span>
                    <div className="pagination-controls">
                        <button className="page-btn" onClick={() => setPage(1)} disabled={page <= 1}><ChevronsLeft size={15} /></button>
                        <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft size={15} /></button>
                        <span className="page-current">{page}</span>
                        <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><ChevronRight size={15} /></button>
                        <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page >= totalPages}><ChevronsRight size={15} /></button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Section tab bar: Yo'qlama / Kirdi-Chiqdi ── */
function SectionTabBar({ active, onChange }) {
    const tabs = [
        { key: 'attendance', label: "Yo'qlama",     icon: CalendarDays },
        { key: 'entryexit',  label: 'Kirdi-Chiqdi', icon: Clock        },
    ];
    return (
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--input-bg)', borderRadius: 12, border: '1px solid var(--card-border)', marginBottom: 16, width: 'fit-content' }}>
            {tabs.map(t => (
                <button key={t.key} onClick={() => onChange(t.key)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: active === t.key ? 600 : 500,
                    background: active === t.key ? 'var(--accent)' : 'transparent',
                    color: active === t.key ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                }}>
                    <t.icon size={14} />{t.label}
                </button>
            ))}
        </div>
    );
}

/* ── Main export ── */
export default function ParentAttendance() {
    const now = new Date();
    const [section, setSection] = useState('attendance');
    const [dateFrom, setDateFrom] = useState(toISO(new Date(now.getFullYear(), now.getMonth(), 1)));
    const [dateTo,   setDateTo]   = useState(toISO(now));

    const [fetchAtt, { data: attData, isLoading: attLoading, error: attError }] = useLazyGetMyChildrenAttendanceQuery();

    const load = () => fetchAtt({ date_from: dateFrom, date_to: dateTo });
    useEffect(() => { load(); }, []);

    /* children list: [{student_id, full_name, dates}] */
    const children = attData?.data || [];
    const [activeChild, setActiveChild] = useState(null);

    /* auto-select first child once data arrives */
    useEffect(() => {
        if (children.length > 0 && !activeChild) setActiveChild(children[0].student_id);
    }, [children]);

    const activeData = children.find(c => c.student_id === activeChild);

    if (attLoading) return <Loading />;

    if (children.length === 0) return (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }} />
            <p>Farzandlar topilmadi</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Section: Yo'qlama / Kirdi-Chiqdi */}
            <SectionTabBar active={section} onChange={setSection} />

            {/* Per-child tab bar */}
            <ChildTabBar children={children} active={activeChild} onChange={id => { setActiveChild(id); }} />

            {attError && (
                <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10, marginBottom: 12 }}>
                    Xatolik: {attError?.data?.message}
                </div>
            )}

            {section === 'attendance' && activeData && (
                <ChildAttendance
                    studentData={activeData}
                    dateFrom={dateFrom}
                    setDateFrom={setDateFrom}
                    dateTo={dateTo}
                    setDateTo={setDateTo}
                    onLoad={load}
                />
            )}

            {section === 'entryexit' && activeChild && (
                <ChildEntryExit studentId={activeChild} />
            )}
        </div>
    );
}
