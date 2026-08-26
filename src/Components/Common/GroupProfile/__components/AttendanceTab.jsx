import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    useLazyGetAttendanceQuery,
    useCreateAttendanceMutation,
    useUpdateAttendanceMutation,
} from '../../../../store/services/attedance.api';
import { Clock, CalendarDays, Check, X, RefreshCw, ChevronLeft, ChevronRight, History, User, BookOpen } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import Modal from '../../../Other/UI/Modal/Modal';
import Loading from '../../../Other/UI/Loadings/Loading';

const STATUS_MAP = { present:'Keldi', absent:'Kelmadi', late:'Kechikdi' };
const STATUS_STYLE = {
    present: { bg:'var(--success-soft)', color:'var(--success)' },
    absent:  { bg:'var(--danger-soft)',  color:'var(--danger)'  },
    late:    { bg:'var(--warning-soft)', color:'var(--warning)' },
};
const ATTENDANCE_OPTIONS = [
    { value:'present', label:'Keldi',    icon:Check, style:STATUS_STYLE.present },
    { value:'absent',  label:'Kelmadi',  icon:X,     style:STATUS_STYLE.absent  },
    { value:'late',    label:'Kechikdi', icon:Clock,  style:STATUS_STYLE.late   },
];
const DAY_LABELS = { monday:'Dushanba', tuesday:'Seshanba', wednesday:'Chorshanba', thursday:'Payshanba', friday:'Juma', saturday:'Shanba', sunday:'Yakshanba' };

const fmtLocal = (d) => { const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; };
const parseLocal = (s) => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };

export default function AttendanceTab({ groupId: groupIdProp, students = [] }) {
    const params = useParams();
    const groupId = groupIdProp || params.id;
    const role = useSelector(s => s.auth?.role);
    const isTeacher = role === 'teacher';
    const [fetchHistory, { data, isLoading, error }] = useLazyGetAttendanceQuery();
    const [createAttendance] = useCreateAttendanceMutation();
    const [updateAttendance] = useUpdateAttendanceMutation();

    const [dateFrom, setDateFrom] = useState(fmtLocal(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
    const [dateTo,   setDateTo]   = useState(fmtLocal(new Date(new Date().getFullYear(), new Date().getMonth()+1, 0)));
    const [localData, setLocalData] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [modalStatus, setModalStatus] = useState('');
    const [modalComment, setModalComment] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (groupId) fetchHistory({ group_id: groupId, date_from: dateFrom, date_to: dateTo, page: 1, limit: 100 });
    }, [groupId, dateFrom, dateTo]);

    useEffect(() => { if (data) setLocalData(data); }, [data]);

    const records = localData?.data?.records || [];
    const allDates = useMemo(() => {
        const dates = []; let cur = parseLocal(dateFrom); const end = parseLocal(dateTo);
        while (cur <= end) { dates.push(fmtLocal(cur)); cur.setDate(cur.getDate()+1); }
        return dates;
    }, [dateFrom, dateTo]);

    const studentMap = useMemo(() => {
        const map = {};
        records.forEach(s => {
            map[s.student_id] = { full_name: s.full_name, dates: {} };
            s.dates?.forEach(de => {
                map[s.student_id].dates[de.date] = (de.subjects||[]).map(sb => ({ subject_id:sb.subject_id, name:sb.subject_name, status:sb.status, attendance_id:sb.attendance_id, group_schedule_id:sb.group_schedule_id, teacher_name:sb.teacher_name, comment:sb.comment||'' }));
            });
            allDates.forEach(d => { if (!map[s.student_id].dates[d]) map[s.student_id].dates[d] = []; });
        });
        return map;
    }, [records, allDates]);

    const historyStudents = records.length > 0 ? records.map(r=>({ id:r.student_id, full_name:r.full_name })) : students.map(s=>({ id:s.id, full_name:s.full_name }));

    const openModal = (studentId, date, idx) => {
        const sd = studentMap[studentId]; if (!sd) return;
        const subjects = sd.dates[date]||[]; if (idx >= subjects.length) return;
        const s = subjects[idx];
        setSelected({ studentId, studentName:sd.full_name, date, idx, subjectName:s.name, teacherName:s.teacher_name, status:s.status, attendanceId:s.attendance_id, groupScheduleId:s.group_schedule_id, comment:s.comment||'' });
        setModalStatus(s.status||''); setModalComment(s.comment||''); setModalOpen(true);
    };

    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            const { studentId, date, idx, attendanceId, groupScheduleId } = selected;
            let res;
            if (attendanceId) res = await updateAttendance({ id:attendanceId, data:{ status:modalStatus, comment:modalComment } }).unwrap();
            else res = await createAttendance({ student_id:studentId, group_schedule_id:groupScheduleId, date, status:modalStatus||'present', comment:modalComment }).unwrap();
            setLocalData(prev => {
                if (!prev) return prev;
                const nd = JSON.parse(JSON.stringify(prev));
                for (const rec of nd.data.records) {
                    if (rec.student_id === studentId) {
                        for (const de of rec.dates) {
                            if (de.date === date) { const sb = de.subjects[idx]; if (sb) { sb.status=modalStatus; sb.comment=modalComment; if (!attendanceId&&res?.id) sb.attendance_id=res.id; } }
                        }
                    }
                }
                return nd;
            });
            Alert("Saqlandi", 'success');
            setModalOpen(false);
        } catch (err) { Alert(err?.data?.message||'Xatolik', 'error'); }
        finally { setSaving(false); }
    };

    if (isLoading) return <Loading/>;
    if (error) return <div style={{ color:'var(--danger)', padding:12, background:'var(--danger-soft)', borderRadius:10 }}>Xatolik: {error?.data?.message}</div>;

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Filter */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end' }}>
                <div>
                    <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Dan</label>
                    <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);}} className="search-input" style={{ paddingLeft:14, width:150 }}/>
                </div>
                <div>
                    <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Gacha</label>
                    <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);}} className="search-input" style={{ paddingLeft:14, width:150 }}/>
                </div>
             
            </div>

            {/* Table */}
            {historyStudents.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}><Clock size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/><p>O'quvchilar topilmadi</p></div>
            ) : (
                <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid var(--card-border)', background:'var(--card-bg)' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
                        <thead>
                            <tr style={{ background:'var(--accent-soft)' }}>
                                <th style={{ padding:'11px 16px', textAlign:'left', fontWeight:700, color:'var(--accent)', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', position:'sticky', left:0, background:'var(--accent-soft)', zIndex:2 }}>O'quvchi</th>
                                {allDates.map(d => {
                                    const day = parseLocal(d).toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();
                                    return (
                                        <th key={d} style={{ padding:'11px 10px', textAlign:'center', fontWeight:700, color: day==='sunday'?'var(--danger)':'var(--accent)', fontSize:'0.72rem', minWidth:110, whiteSpace:'nowrap' }}>
                                            {parseLocal(d).toLocaleDateString('uz-UZ',{day:'2-digit',month:'2-digit'})}
                                            <div style={{ fontSize:'0.65rem', fontWeight:400, color:'var(--text-muted)' }}>{DAY_LABELS[day]?.slice(0,3)}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {historyStudents.map(s => {
                                const sd = studentMap[s.id];
                                return (
                                    <tr key={s.id} style={{ borderTop:'1px solid var(--card-border)' }}
                                        onMouseEnter={e=>e.currentTarget.style.background='var(--accent-soft)'}
                                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                        <td style={{ padding:'10px 16px', fontWeight:600, color:'var(--text-primary)', position:'sticky', left:0, background:'var(--card-bg)', zIndex:1 }}>
                                            {isTeacher ? (
                                                <span>{s.full_name}</span>
                                            ) : (
                                                <Link to={`/student/${s.id}`} style={{ color:'inherit', textDecoration:'none' }}
                                                    onMouseEnter={e=>e.target.style.color='var(--accent)'}
                                                    onMouseLeave={e=>e.target.style.color='inherit'}>
                                                    {s.full_name}
                                                </Link>
                                            )}
                                        </td>
                                        {allDates.map(d => {
                                            const subjects = sd?.dates?.[d] || [];
                                            if (!subjects.length) return <td key={d} style={{ padding:'10px', textAlign:'center', color:'var(--text-muted)', fontSize:'0.72rem' }}>—</td>;
                                            return (
                                                <td key={d} style={{ padding:'6px 10px' }}>
                                                    <div style={{ display:'flex', flexDirection:'column', gap:3, alignItems:'center' }}>
                                                        {subjects.map((sb, idx) => {
                                                            const st = STATUS_STYLE[sb.status];
                                                            return (
                                                                <button key={idx} onClick={() => openModal(s.id, d, idx)}
                                                                    style={{ fontSize:'0.68rem', fontWeight:600, padding:'2px 8px', borderRadius:6, border:`1px solid ${st?.color||'var(--card-border)'}`, background:st?.bg||'var(--input-bg)', color:st?.color||'var(--text-muted)', cursor:'pointer', whiteSpace:'nowrap', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis' }}
                                                                    title={`${sb.name}: ${STATUS_MAP[sb.status]||'—'}`}>
                                                                    {idx+1}. {sb.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected?.subjectName || 'Davomat'} size="sm">
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', display:'flex', flexWrap:'wrap', gap:12 }}>
                        {selected?.teacherName && <span><User size={12} style={{ display:'inline', marginRight:4 }}/>{selected.teacherName}</span>}
                        <span><CalendarDays size={12} style={{ display:'inline', marginRight:4 }}/>{selected?.date && parseLocal(selected.date).toLocaleDateString('uz-UZ')}</span>
                        <span>O'quvchi: <strong style={{ color:'var(--text-primary)' }}>{selected?.studentName}</strong></span>
                    </div>
                    <div>
                        <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Holat</label>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                            {ATTENDANCE_OPTIONS.map(opt => {
                                const active = modalStatus === opt.value;
                                return (
                                    <button key={opt.value} onClick={() => setModalStatus(opt.value)}
                                        style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, border:`1.5px solid ${active ? opt.style.color : 'var(--card-border)'}`, background: active ? opt.style.bg : 'var(--input-bg)', color: active ? opt.style.color : 'var(--text-secondary)', cursor:'pointer', fontSize:'0.82rem', fontWeight: active ? 600 : 400 }}>
                                        <opt.icon size={14}/>{opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Izoh</label>
                        <textarea value={modalComment} onChange={e=>setModalComment(e.target.value)} rows={2} placeholder="Qo'shimcha ma'lumot..." className="search-input" style={{ paddingLeft:14, height:'auto', resize:'vertical' }}/>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setModalOpen(false)}>Bekor qilish</button>
                    <button className="btn-submit" onClick={handleSave} disabled={saving}>
                        <Check size={14}/>{saving ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
