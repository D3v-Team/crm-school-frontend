import { useEffect, useState } from 'react';
import { useLazyGetMyChildrenAttendanceQuery } from '../../../store/services/attedance.api';
import { useLazyGetParentQuery } from '../../../store/services/statistic.api';
import { useLazyGetStudentAttendanceAllQuery } from '../../../store/services/student-attendance.api';
import {
    Users, CalendarDays, Check, X, Clock,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    ArrowLeft, RefreshCw,
} from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';

const STATUS_STYLE = {
    present: { bg: 'var(--success-soft)', color: 'var(--success)', label: 'Keldi'    },
    absent:  { bg: 'var(--danger-soft)',  color: 'var(--danger)',  label: 'Kelmadi'  },
    late:    { bg: 'var(--warning-soft)', color: 'var(--warning)', label: 'Kechikdi' },
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '—';
const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function TabBar({ active, onChange }) {
    const tabs = [
        { key: 'attendance', label: "Yo'qlama",    icon: CalendarDays },
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

/* ─── Attendance tab: /api/attendance/my-children ─── */
function AttendanceTab() {
    const now = new Date();
    const [dateFrom, setDateFrom] = useState(toISO(new Date(now.getFullYear(), now.getMonth(), 1)));
    const [dateTo,   setDateTo]   = useState(toISO(now));
    const [fetchAtt, { data, isLoading, error }] = useLazyGetMyChildrenAttendanceQuery();

    useEffect(() => { fetchAtt({ date_from: dateFrom, date_to: dateTo }); }, []);

    const load = () => fetchAtt({ date_from: dateFrom, date_to: dateTo });

    /* Flatten: [{student_id, full_name, dates:[{date, subjects:[{...}]}]}] */
    const records = data?.data?.records || data?.data || [];

    /* Build flat rows */
    const rows = [];
    records.forEach(student => {
        student.dates?.forEach(de => {
            de.subjects?.forEach(sb => {
                rows.push({
                    key:          `${student.student_id}-${de.date}-${sb.group_schedule_id}`,
                    student_name: student.full_name,
                    date:         de.date,
                    subject_name: sb.subject_name || '—',
                    teacher_name: sb.teacher_name || '—',
                    status:       sb.status,
                    comment:      sb.comment || '',
                });
            });
        });
    });
    rows.sort((a, b) => b.date.localeCompare(a.date));

    const LIMIT = 20;
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(rows.length / LIMIT));
    const paged = rows.slice((page - 1) * LIMIT, page * LIMIT);

    const counts = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {});

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
                
            </div>

            {/* Stat chips */}
            {rows.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {(['present', 'absent', 'late']).map(key => {
                        const st = STATUS_STYLE[key];
                        return (
                            <div key={key} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: st.color }}>{counts[key] || 0}</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{st.label}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {error && <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10 }}>Xatolik: {error?.data?.message}</div>}

            {isLoading ? <Loading /> : rows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <CalendarDays size={40} style={{ opacity: .2, margin: '0 auto 10px', display: 'block' }} />
                    <p>Davomat ma'lumotlari topilmadi</p>
                </div>
            ) : (
                <>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>№</th><th>O'quvchi</th><th>Sana</th>
                                    <th>Fan</th><th>O'qituvchi</th><th>Holat</th><th>Izoh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((r, i) => {
                                    const st = STATUS_STYLE[r.status] || { bg: 'var(--input-bg)', color: 'var(--text-muted)', label: r.status };
                                    return (
                                        <tr key={r.key}>
                                            <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{(page - 1) * LIMIT + i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{fmtDate(r.date)}</td>
                                            <td>{r.subject_name}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{r.teacher_name}</td>
                                            <td>
                                                {r.status ? (
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: st.bg, color: st.color }}>
                                                        {st.label}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{r.comment || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination">
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Jami {rows.length} ta yozuv</span>
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

/* ─── Entry/Exit tab: child list → /api/student-attendance/all?student_id= ─── */
function ChildDetail({ student, onBack }) {
    const [fetchAll, { data, isLoading }] = useLazyGetStudentAttendanceAllQuery();
    const [page, setPage] = useState(1);
    const LIMIT = 15;

    useEffect(() => {
        if (student?.id) fetchAll({ student_id: student.id });
    }, [student?.id]);

    const records = data?.data?.records || data?.data || [];
    const totalPages = Math.max(1, Math.ceil(records.length / LIMIT));
    const paged = records.slice((page - 1) * LIMIT, page * LIMIT);
    const counts = records.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {});

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button onClick={onBack} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--input-bg)', border: '1.5px solid var(--card-border)',
                borderRadius: 9, padding: '6px 14px', cursor: 'pointer',
                fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, alignSelf: 'flex-start',
            }}>
                <ArrowLeft size={14} /> Orqaga
            </button>

            {/* Student card */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                    {(student?.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{student?.full_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{student?.group?.name || '—'} · {student?.phone || '—'}</div>
                </div>
            </div>

            {/* Stat chips */}
            {records.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {(['present', 'absent', 'late']).map(key => {
                        const st = STATUS_STYLE[key];
                        return (
                            <div key={key} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: st.color }}>{counts[key] || 0}</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{st.label}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isLoading ? <Loading /> : records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <Clock size={40} style={{ opacity: .2, margin: '0 auto 10px', display: 'block' }} />
                    <p>Yo'q</p>
                </div>
            ) : (
                <>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr><th>№</th><th>Sana</th><th>Fan</th><th>Holat</th><th>Izoh</th></tr>
                            </thead>
                            <tbody>
                                {paged.map((r, i) => {
                                    const st = STATUS_STYLE[r.status] || { bg: 'var(--input-bg)', color: 'var(--text-muted)', label: r.status };
                                    return (
                                        <tr key={r.id || i}>
                                            <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{(page - 1) * LIMIT + i + 1}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(r.date)}</td>
                                            <td>{r.subject?.name || r.subject_name || '—'}</td>
                                            <td><span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: st.bg, color: st.color }}>{r.status ? st.label : 'Yo\'q'}</span></td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{r.comment || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination">
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Jami {records.length}</span>
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

function EntryExitTab() {
    const now = new Date();
    const [fetchParent, { data: parentData, isLoading: cl }] = useLazyGetParentQuery();
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        fetchParent({ year: now.getFullYear(), month: now.getMonth() + 1 });
    }, []);

    // /api/statistic/parent qaytaradi: [{student_id, full_name, group, ...}]
    const children = (parentData?.data || []).map(c => ({
        id: c.student_id,
        full_name: c.full_name,
        group: { name: c.group },
        phone: c.phone || null,
    }));

    if (selected) return <ChildDetail student={selected} onBack={() => setSelected(null)} />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {cl ? <Loading /> : children.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <Users size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }} />
                    <p>Farzandlar topilmadi</p>
                </div>
            ) : (
                <>
     
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>№</th><th>To'liq ism</th><th>Guruh</th><th>Ko'rish</th>
                                </tr>
                            </thead>
                            <tbody>
                                {children.map((child, i) => (
                                    <tr key={child.id}>
                                        <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>
                                                    {(child.full_name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                {child.full_name}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{child.group?.name || '—'}</td>
                                   
                                        <td>
                                            <button className="btn-create" style={{ padding: '5px 12px', fontSize: '0.78rem', gap: 5 }}
                                                onClick={() => setSelected(child)}>
                                                <Clock size={13} /> Ko'rish
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

/* ─── Main page ─── */
export default function ParentAttendance() {
    const [tab, setTab] = useState('attendance');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TabBar active={tab} onChange={setTab} />
            {tab === 'attendance' && <AttendanceTab />}
            {tab === 'entryexit'  && <EntryExitTab />}
        </div>
    );
}
