import { useParams, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetStudentByIdQuery } from "../../../store/services/student.api";
import { useLazyGetPaymentsQuery } from "../../../store/services/payment.api";
import { useLazyGetAttendanceQuery } from "../../../store/services/attedance.api";
import { useLazyGetGradesQuery } from "../../../store/services/grades.api";
import { useLazyGetStudentAttendanceAllQuery } from "../../../store/services/student-attendance.api";
import Loading from "../../Other/UI/Loadings/Loading";
import AddPayment from "./AddPayment";
import EditPayment from "./EditPayment";
import DeletePayment from "./DeletePayment";
import FaceActions from "./FaceActions";
import UnassignParent from "./UnassignParent";
import {
    User, Phone, Users, DollarSign, Calendar,
    CheckCircle, XCircle, CreditCard,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    RefreshCw, ClipboardList, ExternalLink, MessageCircle, MessageCircleOff,
    ArrowLeft, Camera as CameraIcon,
} from "lucide-react";

/* ── constants ── */
const MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const METHOD_LABELS = { cash:"Naqd", card:"Karta", transfer:"Pul o'tkazmasi", bank_account:"Bank hisobi" };
const ATTENDANCE_MAP = {
    present: { label: "Keldi",    color: 'var(--success)',  bg: 'var(--success-soft)' },
    absent:  { label: "Kelmadi",  color: 'var(--danger)',   bg: 'var(--danger-soft)'  },
    late:    { label: "Kechikdi", color: 'var(--warning)',  bg: 'var(--warning-soft)' },
};
const fmt = (v) => v != null ? Number(v).toLocaleString("ru-RU") + " so'm" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";
const fmtLocal = (date) => {
    const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), dd = String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
};

/* ── Tab component ── */
function Tabs({ tabs, active, onChange }) {
    return (
        <div style={{ display:'flex', gap:4, padding:'4px', background:'var(--input-bg)', borderRadius:12, border:'1px solid var(--card-border)', marginBottom:20, overflowX:'auto' }}>
            {tabs.map(t => (
                <button key={t.key} onClick={() => onChange(t.key)} style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:'8px 16px', borderRadius:9, border:'none', cursor:'pointer',
                    fontSize:'0.82rem', fontWeight: active===t.key ? 600 : 500,
                    background: active===t.key ? 'var(--accent)' : 'transparent',
                    color: active===t.key ? '#fff' : 'var(--text-secondary)',
                    transition:'all 0.15s', whiteSpace:'nowrap',
                }}>
                    <t.icon size={14}/>{t.label}
                </button>
            ))}
        </div>
    );
}

/* ── Payments tab ── */
function PaymentsTab({ studentId, requiredAmount, showAddButton = true }) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth()+1);
    const [page, setPage] = useState(1);
    const [trigger, { data, isLoading, error }] = useLazyGetPaymentsQuery();
    const load = () => trigger({ student_id: studentId, year, month, page, limit: 8 });

    useEffect(() => { if (studentId) load(); }, [studentId, year, month, page]);

    const payments = data?.data?.records || [];
    const pg = data?.data?.pagination || {};
    const totalPages = pg.total_pages || 1;
    const currentPage = pg.currentPage || 1;
    const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

    return (
        <div>
            {/* filter + add */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', marginBottom:16 }}>
                <select
                    style={{ padding:'8px 14px', background:'var(--input-bg)', border:'1.5px solid var(--input-border)', borderRadius:9, color:'var(--input-text)', fontSize:'0.82rem', outline:'none', cursor:'pointer' }}
                    value={year} onChange={e => { setYear(+e.target.value); setPage(1); }}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                    style={{ padding:'8px 14px', background:'var(--input-bg)', border:'1.5px solid var(--input-border)', borderRadius:9, color:'var(--input-text)', fontSize:'0.82rem', outline:'none', cursor:'pointer' }}
                    value={month} onChange={e => { setMonth(+e.target.value); setPage(1); }}>
                    {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <div style={{ marginLeft:'auto' }}>
                    {showAddButton && <AddPayment requiredAmount={requiredAmount} onAdd={load} />}
                </div>
            </div>

            {isLoading && <Loading />}
            {error && <div style={{ color:'var(--danger)', padding:12, background:'var(--danger-soft)', borderRadius:10 }}>Xatolik</div>}

            {!isLoading && !error && (
                payments.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text-muted)' }}>
                        <CreditCard size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/>
                        <p>To'lovlar mavjud emas</p>
                    </div>
                ) : (
                    <>
                        <div className="data-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>№</th>
                                        <th>To'langan</th>
                                        <th>Kerakli</th>
                                        <th>Davr</th>
                                        <th>Usul</th>
                                        <th>Chegirma</th>
                                        <th>Sana</th>
                                        <th>Izoh</th>
                                        <th>Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p, i) => (
                                        <tr key={p.id}>
                                            <td style={{ color:'var(--text-muted)', fontSize:'0.78rem', fontFamily:'monospace' }}>
                                                {(currentPage - 1) * 8 + i + 1}
                                            </td>
                                            <td style={{ color:'var(--success)', fontWeight:700 }}>
                                                {fmt(p.paid_amount)}
                                            </td>
                                            <td style={{ color:'var(--text-secondary)' }}>
                                                {fmt(p.required_amount)}
                                            </td>
                                            <td style={{ color:'var(--text-secondary)', whiteSpace:'nowrap' }}>
                                                {p.year}/{String(p.month).padStart(2,'0')}
                                            </td>
                                            <td>
                                                <span style={{ fontSize:'0.72rem', fontWeight:600, padding:'2px 10px', borderRadius:99, background:'var(--success-soft)', color:'var(--success)', whiteSpace:'nowrap' }}>
                                                    {METHOD_LABELS[p.method] || p.method}
                                                </span>
                                            </td>
                                            <td style={{ color: p.discount_percent > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                                                {p.discount_percent > 0 ? `${p.discount_percent}%` : '—'}
                                            </td>
                                            <td style={{ fontSize:'0.78rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                                                {fmtDate(p.createdAt)}
                                            </td>
                                            <td style={{ color:'var(--text-muted)', fontSize:'0.78rem', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                {p.comment || '—'}
                                            </td>
                                            <td>
                                                <div style={{ display:'flex', gap:6 }}>
                                                    <EditPayment payment={p} onUpdate={load} />
                                                    <DeletePayment paymentId={p.id} onDelete={load} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="pagination" style={{ marginTop:14 }}>
                                <span/>
                                <div className="pagination-controls">
                                    <button className="page-btn" onClick={() => setPage(1)} disabled={currentPage<=1}><ChevronsLeft size={14}/></button>
                                    <button className="page-btn" onClick={() => setPage(p=>p-1)} disabled={currentPage<=1}><ChevronLeft size={14}/></button>
                                    <span className="page-current">{currentPage}</span>
                                    <button className="page-btn" onClick={() => setPage(p=>p+1)} disabled={currentPage>=totalPages}><ChevronRight size={14}/></button>
                                    <button className="page-btn" onClick={() => setPage(totalPages)} disabled={currentPage>=totalPages}><ChevronsRight size={14}/></button>
                                </div>
                            </div>
                        )}
                    </>
                )
            )}
        </div>
    );
}

/* ── Attendance & Grades tab ── */
function AttendanceTab({ studentId }) {
    const now = new Date();
    const [dateFrom, setDateFrom] = useState(fmtLocal(new Date(now.getFullYear(), now.getMonth(), 1)));
    const [dateTo, setDateTo]   = useState(fmtLocal(now));
    const [subjectFilter, setSubjectFilter] = useState('all');

    const [fetchAtt, { data: attData, isLoading: attLoading }] = useLazyGetAttendanceQuery();
    const [fetchGrades, { data: gradesData, isLoading: gradesLoading }] = useLazyGetGradesQuery();

    const load = () => {
        if (!studentId) return;
        fetchAtt({ student_id: studentId, date_from: dateFrom, date_to: dateTo, page:1 });
        fetchGrades({ student_id: studentId, date_from: dateFrom, date_to: dateTo, page:1 });
    };
    useEffect(() => { load(); }, [studentId, dateFrom, dateTo]);

    const isLoading = attLoading || gradesLoading;

    const rows = useMemo(() => {
        const map = {};
        const attRecs = attData?.data?.records || [];
        const myAtt = attRecs.find(r => r.student_id === studentId);
        myAtt?.dates?.forEach(de => {
            de.subjects?.forEach(s => {
                const k = `${de.date}__${s.group_schedule_id}`;
                map[k] = { ...map[k], date: de.date, subject_name: s.subject_name, teacher_name: s.teacher_name, status: s.status, att_comment: s.comment||'' };
            });
        });
        const gradeRecs = gradesData?.data?.records || [];
        const myGrades = gradeRecs.find(r => r.student_id === studentId);
        myGrades?.dates?.forEach(de => {
            de.subjects?.forEach(s => {
                const k = `${de.date}__${s.group_schedule_id}`;
                map[k] = { ...map[k], date: de.date, subject_name: s.subject_name || map[k]?.subject_name, teacher_name: s.teacher_name || map[k]?.teacher_name, grade: s.score, grade_comment: s.comment||'' };
            });
        });
        return Object.values(map).sort((a,b) => b.date.localeCompare(a.date));
    }, [attData, gradesData, studentId]);

    const stats = useMemo(() => {
        const filteredRows = subjectFilter === 'all'
            ? rows
            : rows.filter(r => r.subject_name === subjectFilter);
        const present = filteredRows.filter(r=>r.status==='present').length;
        const absent  = filteredRows.filter(r=>r.status==='absent').length;
        const late    = filteredRows.filter(r=>r.status==='late').length;
        const marked  = present+absent+late;
        const pct     = marked > 0 ? Math.round(present/marked*100) : null;
        const graded  = filteredRows.filter(r=>r.grade!=null);
        const avg     = graded.length ? (graded.reduce((s,r)=>s+Number(r.grade),0)/graded.length).toFixed(1) : null;
        return { present, absent, late, pct, avg };
    }, [rows, subjectFilter]);

    const subjects = useMemo(() => (
        [...new Set(rows.map(row => row.subject_name).filter(Boolean))].sort()
    ), [rows]);
    const filteredRows = subjectFilter === 'all'
        ? rows
        : rows.filter(row => row.subject_name === subjectFilter);

    return (
        <div>
            {/* Filter */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end', marginBottom:16 }}>
                <div>
                    <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Dan</label>
                    <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
                        style={{ padding:'8px 12px', background:'var(--input-bg)', border:'1.5px solid var(--input-border)', borderRadius:9, color:'var(--input-text)', fontSize:'0.82rem', outline:'none', width:155 }}/>
                </div>
                <div>
                    <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Gacha</label>
                    <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
                        style={{ padding:'8px 12px', background:'var(--input-bg)', border:'1.5px solid var(--input-border)', borderRadius:9, color:'var(--input-text)', fontSize:'0.82rem', outline:'none', width:155 }}/>
                </div>
                <div>
                    <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Fan</label>
                    <select value={subjectFilter} onChange={e=>setSubjectFilter(e.target.value)}
                        style={{ padding:'8px 12px', background:'var(--input-bg)', border:'1.5px solid var(--input-border)', borderRadius:9, color:'var(--input-text)', fontSize:'0.82rem', outline:'none', minWidth:170 }}>
                        <option value="all">Barcha fanlar</option>
                        {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                </div>
                <button onClick={load} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 16px', borderRadius:9, border:'none', background:'var(--accent)', color:'#fff', fontSize:'0.82rem', fontWeight:600, cursor:'pointer' }}>
                    Ko'rish
                </button>
            </div>

            {/* Stats */}
            <div className="student-stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0, 1fr))', gap:10, marginBottom:16 }}>
                {[
                    { label:'Keldi', val:stats.present, color:'var(--success)' },
                    { label:'Kelmadi', val:stats.absent, color:'var(--danger)' },
                    { label:'Kechikdi', val:stats.late, color:'var(--warning)' },
                    { label:'O\'rtacha baho', val: stats.avg ?? '—', color:'var(--accent)' },
                    { label:'Davomat %', val: stats.pct != null ? stats.pct+'%' : '—', color: stats.pct >= 80 ? 'var(--success)' : stats.pct >= 50 ? 'var(--warning)' : 'var(--danger)' },
                ].map((s,i) => (
                    <div key={i} style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                        <div style={{ fontSize:'1.1rem', fontWeight:700, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {isLoading && <Loading/>}
            {!isLoading && (
                        filteredRows.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
                        <ClipboardList size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/>
                        <p>Ma'lumot topilmadi</p>
                    </div>
                ) : (
                    <div className="responsive-content-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12 }}>
                        {filteredRows.map((r, i) => {
                            const att = ATTENDANCE_MAP[r.status];
                            const gradeNum = r.grade != null ? Number(r.grade) : null;
                            const gradeColor = gradeNum == null ? 'var(--text-muted)' : gradeNum>=80?'var(--success)':gradeNum>=60?'var(--warning)':'var(--danger)';
                            return (
                                <div key={`${r.date}-${r.subject_name}-${i}`} style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:12, padding:14, display:'flex', flexDirection:'column', gap:10 }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight:700, color:'var(--text-primary)' }}>{r.subject_name || 'Fan ko\'rsatilmagan'}</div>
                                            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:3 }}>{fmtDate(r.date)}</div>
                                        </div>
                                        <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', textAlign:'right' }}>{r.teacher_name || '—'}</div>
                                    </div>
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                        <div style={{ background:att?.bg || 'var(--input-bg)', borderRadius:8, padding:'8px 10px' }}>
                                            <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Davomat</div>
                                            <div style={{ fontWeight:700, color:att?.color || 'var(--text-muted)', marginTop:2 }}>{att?.label || '—'}</div>
                                        </div>
                                        <div style={{ background:'var(--input-bg)', borderRadius:8, padding:'8px 10px' }}>
                                            <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Baho</div>
                                            <div style={{ fontWeight:700, color:gradeColor, marginTop:2 }}>{gradeNum != null ? `${gradeNum}%` : '—'}</div>
                                        </div>
                                    </div>
                                    {(r.att_comment || r.grade_comment) && (
                                        <div style={{ borderTop:'1px solid var(--card-border)', paddingTop:8, display:'flex', flexDirection:'column', gap:5 }}>
                                            {r.att_comment && <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}><strong>Davomat izohi:</strong> {r.att_comment}</div>}
                                            {r.grade_comment && <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}><strong>Baho izohi:</strong> {r.grade_comment}</div>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
}

/* ── Entry/Exit tab — card layout ── */
const MONTH_LABELS_ST = [
    'Yanvar','Fevral','Mart','Aprel','May','Iyun',
    'Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr',
];
const DAY_LABELS_ST = {
    0:'Yakshanba',1:'Dushanba',2:'Seshanba',3:'Chorshanba',
    4:'Payshanba',5:'Juma',6:'Shanba',
};

/* ISO string yoki "HH:MM" ni "HH:MM" ga parse qiladi */
function parseTimeSt(val) {
    if (!val) return '—';
    if (val.includes('T') || val.includes('Z')) {
        const d = new Date(val);
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    return val;
}

function fmtDateSt(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return {
        day: d.getDate(),
        month: MONTH_LABELS_ST[d.getMonth()],
        year: d.getFullYear(),
        weekday: DAY_LABELS_ST[d.getDay()],
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
    };
}

function StudentDayCard({ record }) {
    // Support both `records` and `entries` field names from backend
    const date  = record?.date;
    const times = record?.records || record?.entries || [];
    const df    = fmtDateSt(date);
    const ins   = times.filter(r => r.type === 'IN');
    const outs  = times.filter(r => r.type === 'OUT');

    return (
        <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 12,
            overflow: 'hidden',
        }}>
            {/* Date header */}
            <div style={{
                background: df.isWeekend ? 'var(--danger-soft)' : 'var(--accent-soft)',
                borderBottom: '1px solid var(--card-border)',
                padding: '8px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: df.isWeekend ? 'var(--danger)' : 'var(--accent)', lineHeight: 1 }}>
                        {df.day}
                    </span>
                    <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: df.isWeekend ? 'var(--danger)' : 'var(--accent)' }}>{df.month}</div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{df.weekday}</div>
                    </div>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    fontSize: '0.62rem', fontWeight: 600,
                    padding: '2px 7px', borderRadius: 99,
                    background: times.length > 0 ? 'var(--success-soft)' : 'var(--input-bg)',
                    color: times.length > 0 ? 'var(--success)' : 'var(--text-muted)',
                }}>
                    <CameraIcon size={9} />{times.length}
                </div>
            </div>

            {/* IN / OUT */}
            <div style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
                {/* Kirdi */}
                <div style={{
                    flex: 1,
                    background: ins.length > 0 ? 'var(--success-soft)' : 'var(--input-bg)',
                    border: `1px solid ${ins.length > 0 ? 'var(--success)' : 'var(--card-border)'}`,
                    borderRadius: 8, padding: '6px 8px',
                    display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={11} style={{ color: ins.length > 0 ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: ins.length > 0 ? 'var(--success)' : 'var(--text-muted)' }}>Kirdi</span>
                    </div>
                    {ins.length > 0 ? ins.map((r, i) => (
                        <div key={i} style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '0.02em' }}>
                            {parseTimeSt(r.time)}
                        </div>
                    )) : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</div>}
                </div>

                {/* Chiqdi */}
                <div style={{
                    flex: 1,
                    background: outs.length > 0 ? 'var(--danger-soft)' : 'var(--input-bg)',
                    border: `1px solid ${outs.length > 0 ? 'var(--danger)' : 'var(--card-border)'}`,
                    borderRadius: 8, padding: '6px 8px',
                    display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={11} style={{ color: outs.length > 0 ? 'var(--danger)' : 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: outs.length > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>Chiqdi</span>
                    </div>
                    {outs.length > 0 ? outs.map((r, i) => (
                        <div key={i} style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--danger)', letterSpacing: '0.02em' }}>
                            {parseTimeSt(r.time)}
                        </div>
                    )) : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</div>}
                </div>
            </div>
        </div>
    );
}

function EntryExitTab({ studentId }) {
    const [page, setPage] = useState(1);
    const LIMIT = 20;
    const [fetchAll, { data, isLoading }] = useLazyGetStudentAttendanceAllQuery();

    useEffect(() => { if (studentId) fetchAll({ student_id: studentId }); }, [studentId]);

    /*
     * Normalize any response shape into [{date, records:[{type,time}]}].
     * axiosBaseQuery wraps: hook.data = { status, data: [...] }
     * So hook.data?.data is the actual array (or object with .records).
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
    // Debug: uncomment to check response in console
    // if (data && records.length === 0) console.warn('[EntryExitTab] raw data:', JSON.stringify(data));
    const totalPages = Math.max(1, Math.ceil(records.length / LIMIT));
    const paged      = records.slice((page-1)*LIMIT, page*LIMIT);

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {isLoading ? <Loading/> : records.length===0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
                    <CameraIcon size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/>
                    <p>Kirdi-chiqdi ma'lumotlari topilmadi</p>
                </div>
            ) : (
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: 8,
                    }}>
                        {paged.map((record, i) => (
                            <StudentDayCard key={record.date || i} record={record} />
                        ))}
                    </div>
                    {totalPages>1 && (
                        <div className="pagination">
                            <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Jami {records.length} ta kun</span>
                            <div className="pagination-controls">
                                <button className="page-btn" onClick={()=>setPage(1)} disabled={page<=1}><ChevronsLeft size={15}/></button>
                                <button className="page-btn" onClick={()=>setPage(p=>p-1)} disabled={page<=1}><ChevronLeft size={15}/></button>
                                <span className="page-current">{page}</span>
                                <button className="page-btn" onClick={()=>setPage(p=>p+1)} disabled={page>=totalPages}><ChevronRight size={15}/></button>
                                <button className="page-btn" onClick={()=>setPage(totalPages)} disabled={page>=totalPages}><ChevronsRight size={15}/></button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ── Parent info tab ── */
function ParentInfo({ student, onRefetch }) {
    const parent = student?.parent;
    if (!parent) return (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
            <Users size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/>
            <p style={{ fontSize:'0.875rem' }}>Ota-ona biriktirilmagan</p>
        </div>
    );

    const botConnected = !!parent.chat_id;

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:14, padding:'18px 20px' }}>
                {/* Header — avatar + name + profile link */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, marginBottom:16, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ width:52,height:52,borderRadius:14,background:'var(--accent-soft)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',fontWeight:700,flexShrink:0 }}>
                            {(parent.full_name||'?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <NavLink to={`/parent/${parent.id}`} style={{ fontSize:'1rem',fontWeight:700,color:'var(--text-primary)',textDecoration:'none',display:'flex',alignItems:'center',gap:6 }}
                                onMouseEnter={e=>e.currentTarget.style.color='var(--accent)'}
                                onMouseLeave={e=>e.currentTarget.style.color='var(--text-primary)'}>
                                {parent.full_name}
                                <ExternalLink size={13} style={{ opacity:.6 }}/>
                            </NavLink>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                                <div style={{ fontSize:'0.72rem',color:'var(--text-muted)' }}>Ota-ona</div>
                                {botConnected ? (
                                    <span style={{ fontSize:'0.68rem',fontWeight:600,padding:'1px 7px',borderRadius:99,background:'var(--success-soft)',color:'var(--success)',display:'flex',alignItems:'center',gap:3 }}>
                                        <MessageCircle size={10}/> Bot ulangan
                                    </span>
                                ) : (
                                    <span style={{ fontSize:'0.68rem',fontWeight:600,padding:'1px 7px',borderRadius:99,background:'var(--danger-soft)',color:'var(--danger)',display:'flex',alignItems:'center',gap:3 }}>
                                        <MessageCircleOff size={10}/> Bot ulanmagan
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Unassign button */}
                    <UnassignParent studentId={student.id} parentName={parent.full_name} onSuccess={onRefetch}/>
                </div>

                {/* Info grid */}
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12 }}>
                    {[
                        { label:'Telefon', value:parent.phone },
                        { label:'Username', value:parent.username },
                        { label:'Chat ID', value:parent.chat_id },
                    ].filter(i=>i.value).map(({ label,value }) => (
                        <div key={label} style={{ background:'var(--input-bg)', borderRadius:9, padding:'10px 12px' }}>
                            <div style={{ fontSize:'0.68rem',color:'var(--text-muted)',marginBottom:3 }}>{label}</div>
                            <div style={{ fontSize:'0.875rem',fontWeight:500,color:'var(--text-primary)' }}>{value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function StudentProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, error, refetch } = useGetStudentByIdQuery(id, { skip: !id });
    const [tab, setTab] = useState('payments');
    const student = data?.data || data;
    const is_payment = useSelector(s => s.auth.is_payment);

    if (isLoading) return <Loading/>;
    if (error) return (
        <div style={{ background:'var(--danger-soft)', border:'1px solid var(--danger)', color:'var(--danger)', padding:16, borderRadius:12 }}>
            Xatolik: {error?.data?.message}
        </div>
    );
    if (!student) return null;

    const initials = (student.full_name||"?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();

    const tabDefs = [
        { key:'payments',   label:"To'lovlar",         icon: CreditCard   },
        { key:'attendance', label:"Davomat va baholar", icon: ClipboardList },
        { key:'parent',     label:"Ota-ona",            icon: Users        },
        { key:'entryexit',  label:"Kirdi-Chiqdi",       icon: CameraIcon   },
    ];

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><User size={18}/></span>
                    O'quvchi profili
                </div>
                <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--input-bg)', border:'1.5px solid var(--card-border)', borderRadius:9, padding:'7px 14px', cursor:'pointer', fontSize:'0.78rem', color:'var(--text-secondary)', fontWeight:600 }}>
                    <ArrowLeft size={14}/> Orqaga
                </button>
            </div>

            {/* Info card */}
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, padding:'20px 24px', marginBottom:16 }}>
                {/* Top row: avatar + name + face actions (top-right) */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap', marginBottom:16 }}>
                    <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                        <div style={{ width:64, height:64, borderRadius:16, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', fontWeight:700, border:'2px solid var(--card-border)', flexShrink:0 }}>
                            {initials}
                        </div>
                        <div>
                            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                                <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-primary)', margin:0 }}>
                                    {student.full_name}
                                </h2>
                                {/* Status badge */}
                                <span style={{
                                    display:'inline-flex', alignItems:'center', gap:4,
                                    fontSize:'0.72rem', fontWeight:600, padding:'3px 10px', borderRadius:99,
                                    background: student.is_active ? 'var(--success-soft)' : 'var(--danger-soft)',
                                    color: student.is_active ? 'var(--success)' : 'var(--danger)',
                                }}>
                                    {student.is_active
                                        ? <><CheckCircle size={11}/> Faol</>
                                        : <><XCircle size={11}/> Nofaol</>
                                    }
                                </span>
                            </div>
                            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                                {student.school?.name || ''}
                            </div>
                        </div>
                    </div>

                    {/* Face actions — top right of card */}
                    <FaceActions
                        studentId={id}
                        studentName={student.full_name}
                        hasFace={!!student.hikvision_code}
                    />
                </div>

                {/* Meta info grid */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:14 }}>
                    {[
                        { icon:Phone,      label:'Telefon',    value:student.phone },
                        { icon:DollarSign, label:"To'lov",     value: student.price ? fmt(student.price) : null },
                        { icon:Users,      label:'Guruh',      value:student.group?.name || student.group_name },
                        { icon:User,       label:'Ota-ona',    value:student.parent?.full_name },
                        { icon:Calendar,   label:"Qo'shilgan", value:fmtDate(student.createdAt) },
                    ].filter(m => m.value).map(({ icon:Icon, label, value }) => (
                        <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:28, height:28, borderRadius:7, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Icon size={13} style={{ color:'var(--accent)' }}/>
                            </div>
                            <div>
                                <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{label}</div>
                                <div style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--text-primary)' }}>{value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, padding:'20px 24px' }}>
                <Tabs tabs={tabDefs} active={tab} onChange={setTab} />
                {tab === 'payments'   && <PaymentsTab studentId={id} requiredAmount={student.price} showAddButton={is_payment} />}
                {tab === 'attendance' && <AttendanceTab studentId={id} />}
                {tab === 'parent'     && <ParentInfo student={student} onRefetch={refetch} />}
                {tab === 'entryexit'  && <EntryExitTab studentId={id} />}
            </div>
        </div>
    );
}
