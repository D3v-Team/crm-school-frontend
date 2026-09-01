import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    useLazyGetAttendanceQuery,
    useCreateAttendanceMutation,
    useUpdateAttendanceMutation,
} from '../../../../store/services/attedance.api';
import {
    useLazyGetGradesQuery,
    useCreateGradeMutation,
    useUpdateGradeMutation,
} from '../../../../store/services/grades.api';
import { useLazyGetGroupScheduleByGroupIdQuery } from '../../../../store/services/group-schedule.api';
import { Check, X, Clock, Save, BookOpen } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import Loading from '../../../Other/UI/Loadings/Loading';

/* ── constants ── */
const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
const JS_DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const STATUS_STYLE = {
    present: { bg:'var(--success-soft)', color:'var(--success)', border:'var(--success)' },
    absent:  { bg:'var(--danger-soft)',  color:'var(--danger)',  border:'var(--danger)'  },
    late:    { bg:'var(--warning-soft)', color:'var(--warning)', border:'var(--warning)' },
};
const padZ = (n) => String(n).padStart(2,'0');
const fmtLocal = (d) => `${d.getFullYear()}-${padZ(d.getMonth()+1)}-${padZ(d.getDate())}`;
const parseLocal = (s) => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
const dayNameOf  = (dateStr) => JS_DAY_NAMES[parseLocal(dateStr).getDay()];
const monthRange = (year, month) => ({
    from: fmtLocal(new Date(year, month-1, 1)),
    to:   fmtLocal(new Date(year, month, 0)),
});
const scoreColor = (s) => s==null?'var(--text-muted)':s>=80?'var(--success)':s>=60?'var(--warning)':'var(--danger)';
const scoreBg    = (s) => s==null?'var(--input-bg)':s>=80?'var(--success-soft)':s>=60?'var(--warning-soft)':'var(--danger-soft)';

const DAY_SHORT = { monday:'Du', tuesday:'Se', wednesday:'Ch', thursday:'Pa', friday:'Ju', saturday:'Sh', sunday:'Ya' };

function StatusBtn({ value, current, onClick }) {
    const icons = { present: Check, absent: X, late: Clock };
    const Icon = icons[value];
    const st = STATUS_STYLE[value];
    const active = current === value;
    return (
        <button onClick={onClick}
            title={value==='present'?'Keldi':value==='absent'?'Kelmadi':'Kechikdi'}
            style={{
                width:24, height:24, borderRadius:6,
                border:`1.5px solid ${active?st.border:'var(--card-border)'}`,
                background:active?st.bg:'var(--input-bg)',
                color:active?st.color:'var(--text-muted)',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', transition:'all 0.12s', flexShrink:0, padding:0,
            }}>
            <Icon size={12}/>
        </button>
    );
}

export default function AttendanceTab({
    groupId: groupIdProp, students = [], merged: mergedProp = false,
    groupSubjects = [], teacherSubjectId = null, scheduleRecords: scheduleRecordsProp = [],
}) {
    const params  = useParams();
    const groupId = groupIdProp || params.id;
    const role    = useSelector(s => s.auth?.role);
    const userId  = useSelector(s => s.auth?.userId);
    const isTeacher = role === 'teacher';

    /* ── Agar scheduleRecords prop bo'sh bo'lsa, o'zi yuklab oladi ── */
    const [fetchSchedule, { data: scheduleApiData }] = useLazyGetGroupScheduleByGroupIdQuery();
    useEffect(() => {
        if (groupId && (!scheduleRecordsProp || scheduleRecordsProp.length === 0)) {
            fetchSchedule(groupId);
        }
    }, [groupId, scheduleRecordsProp?.length]);

    const scheduleRecords = useMemo(() => {
        /* Prop kelgan bo'lsa ishlatamiz */
        if (Array.isArray(scheduleRecordsProp) && scheduleRecordsProp.length > 0) return scheduleRecordsProp;
        /* Aks holda o'zidan fetch qilingan ma'lumot */
        if (!scheduleApiData) return [];
        const raw = scheduleApiData;
        if (Array.isArray(raw)) return raw;
        const d = raw?.data;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.records)) return d.records;
        if (Array.isArray(d?.data)) return d.data;
        if (Array.isArray(d?.data?.records)) return d.data.records;
        return [];
    }, [scheduleRecordsProp, scheduleApiData]);

    const now = new Date();
    const [selYear,  setSelYear]  = useState(now.getFullYear());
    const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
    const { from: dateFrom, to: dateTo } = monthRange(selYear, selMonth);

    const [selSubjectId, setSelSubjectId] = useState('');
    const activeSubjectId = isTeacher ? teacherSubjectId : (selSubjectId || null);
    const merged = mergedProp;

    /* ── Fetch ── */
    const [fetchAtt, { data: attData, isLoading: attLoading, error: attError }] = useLazyGetAttendanceQuery();
    const [createAttendance] = useCreateAttendanceMutation();
    const [updateAttendance] = useUpdateAttendanceMutation();
    const [fetchGrades, { data: gradesData, isLoading: gradesLoading }] = useLazyGetGradesQuery();
    const [createGrade] = useCreateGradeMutation();
    const [updateGrade] = useUpdateGradeMutation();

    const load = useCallback(() => {
        if (!groupId) return;
        fetchAtt({ group_id:groupId, date_from:dateFrom, date_to:dateTo, page:1, limit:100,
            ...(activeSubjectId && { subject_id:activeSubjectId }) });
        if (merged) fetchGrades({ group_id:groupId, date_from:dateFrom, date_to:dateTo, page:1, limit:100,
            ...(activeSubjectId && { subject_id:activeSubjectId }) });
    }, [groupId, dateFrom, dateTo, merged, activeSubjectId]);

    useEffect(() => { load(); }, [load]);

    const [attLocal,    setAttLocal]    = useState(null);
    const [gradesLocal, setGradesLocal] = useState(null);
    useEffect(() => { if (attData)    setAttLocal(attData);    }, [attData]);
    useEffect(() => { if (gradesData) setGradesLocal(gradesData); }, [gradesData]);

    /* ── allDates ── */
    const todayStr = fmtLocal(new Date());
    const allDates = useMemo(() => {
        const dates=[]; let cur=parseLocal(dateFrom); const end=parseLocal(dateTo);
        while(cur<=end){ dates.push(fmtLocal(cur)); cur.setDate(cur.getDate()+1); }
        return dates;
    }, [dateFrom, dateTo]);

    /* ── Schedule: kun → [{schedule_id, subject_id, subject_name}] ── */
    const dayScheduleMap = useMemo(() => {
        const m = {};
        const filtered = activeSubjectId
            ? scheduleRecords.filter(s => s.subject_id === activeSubjectId)
            : scheduleRecords;
        filtered.forEach(s => {
            // schedule_id uchun barcha mumkin bo'lgan field nomlarini tekshiramiz
            const schId = s.id || s.schedule_id || s.group_schedule_id;
            if (!s.day_of_week || !schId) return; // id yo'q bo'lsa skip
            if (!m[s.day_of_week]) m[s.day_of_week] = [];
            m[s.day_of_week].push({
                schedule_id:  schId,
                subject_id:   s.subject_id,
                subject_name: s.subject?.name || s.subject_name || '—',
            });
        });
        return m;
    }, [scheduleRecords, activeSubjectId]);

    /* ── API records dan lookup ── */
    const attRecords    = attLocal?.data?.records    || [];
    const gradesRecords = gradesLocal?.data?.records || [];

    /* attMap:   { student_id → { date → { schedule_id → {attendance_id, status} } } } */
    const attMap = useMemo(() => {
        const m = {};
        attRecords.forEach(s => {
            m[s.student_id] = {};
            s.dates?.forEach(de => {
                m[s.student_id][de.date] = {};
                (de.subjects||[]).forEach(sb => {
                    m[s.student_id][de.date][sb.group_schedule_id] = {
                        attendance_id: sb.attendance_id,
                        status:        sb.status,
                    };
                });
            });
        });
        return m;
    }, [attRecords]);

    /* gradesMap: { student_id → { date → { schedule_id → {grade_id, score} } } } */
    const gradesMapData = useMemo(() => {
        const m = {};
        gradesRecords.forEach(s => {
            m[s.student_id] = {};
            s.dates?.forEach(de => {
                m[s.student_id][de.date] = {};
                (de.subjects||[]).forEach(sb => {
                    m[s.student_id][de.date][sb.group_schedule_id] = {
                        grade_id: sb.grade_id,
                        score:    sb.score,
                    };
                });
            });
        });
        return m;
    }, [gradesRecords]);

    /* ── Students list — faqat API response dan ── */
    const historyStudents = useMemo(() => {
        return attRecords.map(r => ({ id: r.student_id, full_name: r.full_name }));
    }, [attRecords]);

    /* ── Pending: key = `student|date|schedule_id` ── */
    const [pending, setPending] = useState({});
    const pKey = (sid, date, schId) => `${sid}|${date}|${schId}`;

    const getStatus = (sid, date, schId) => {
        const k = pKey(sid, date, schId);
        if (pending[k]?.status !== undefined) return pending[k].status;
        return attMap[sid]?.[date]?.[schId]?.status || null;
    };
    const getScore = (sid, date, schId) => {
        const k = pKey(sid, date, schId);
        if (pending[k]?.score !== undefined) return pending[k].score;
        const sc = gradesMapData[sid]?.[date]?.[schId]?.score;
        return sc != null ? String(sc) : '';
    };

    const onStatus = (sid, date, schId, val) => {
        const k = pKey(sid, date, schId);
        const existing = attMap[sid]?.[date]?.[schId];
        setPending(prev => ({ ...prev, [k]: {
            ...prev[k], sid, date, schId,
            status: val,
            attendance_id: existing?.attendance_id || null,
        }}));
    };
    const onScore = (sid, date, schId, val) => {
        const k = pKey(sid, date, schId);
        const exG = gradesMapData[sid]?.[date]?.[schId];
        const exA = attMap[sid]?.[date]?.[schId];
        setPending(prev => ({ ...prev, [k]: {
            ...prev[k], sid, date, schId,
            score: val,
            grade_id: exG?.grade_id || null,
            attendance_id: exA?.attendance_id || null,
        }}));
    };

    /* ── Save ── */
    const [saving, setSaving] = useState(false);
    const saveAll = async () => {
        const entries = Object.values(pending);
        if (!entries.length) return Alert("O'zgarish yo'q", 'info');
        setSaving(true);
        let ok=0, fail=0;
        const errors = [];
        for (const ch of entries) {
            const { sid, date, schId } = ch;
            // schId bo'sh, undefined yoki temp bo'lsa skip
            if (!schId || schId === 'undefined' || String(schId).startsWith('temp-')) {
                errors.push(`Noto'g'ri jadval ID: ${schId}`);
                fail++; continue;
            }

            if (ch.status !== undefined) {
                try {
                    if (ch.attendance_id) {
                        await updateAttendance({ id:ch.attendance_id, data:{ status:ch.status } }).unwrap();
                    } else {
                        await createAttendance({ student_id:sid, group_schedule_id:schId, date, status:ch.status }).unwrap();
                    }
                    ok++;
                } catch(e) {
                    const msg = e?.data?.message || e?.message || 'Xatolik';
                    errors.push(msg);
                    console.error('[Attendance] err:', msg, { sid, date, schId });
                    fail++;
                }
            }

            if (merged && ch.score !== undefined && ch.score !== '') {
                const n = Number(ch.score);
                if (!isNaN(n) && n>=0 && n<=100) {
                    try {
                        if (ch.grade_id) {
                            await updateGrade({ id:ch.grade_id, data:{ score:n } }).unwrap();
                        } else {
                            await createGrade({ student_id:sid, group_schedule_id:schId, date, score:n }).unwrap();
                        }
                        ok++;
                    } catch(e) {
                        const msg = e?.data?.message || e?.message || 'Xatolik';
                        errors.push(msg);
                        console.error('[Grade] err:', msg, { sid, date, schId });
                        fail++;
                    }
                }
            }
        }
        setPending({});
        setSaving(false);
        if (fail > 0) {
            const uniqueErrors = [...new Set(errors)];
            Alert(`${ok} ta saqlandi, ${fail} ta xato: ${uniqueErrors.join('; ')}`, 'warning');
        } else {
            Alert(`${ok} ta o'zgarish saqlandi`, 'success');
        }
        load();
    };

    const hasPending = Object.keys(pending).length > 0;
    const isLoading  = attLoading || (merged && gradesLoading);

    /* scroll to today */
    const tableWrapRef = useRef(null);
    useEffect(() => {
        if (!tableWrapRef.current || !allDates.length) return;
        const idx = allDates.indexOf(todayStr);
        if (idx <= 0) return;
        const colW = merged ? 130 : 90;
        tableWrapRef.current.scrollLeft = 150 + idx * colW - 10;
    }, [allDates.length, todayStr, merged]);

    const yearOptions = [];
    for (let y=now.getFullYear()-3; y<=now.getFullYear()+1; y++) yearOptions.push(y);

    if (isLoading) return <Loading/>;
    if (attError)  return <div style={{color:'var(--danger)',padding:12,background:'var(--danger-soft)',borderRadius:10}}>Xatolik: {attError?.data?.message}</div>;

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Toolbar */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
                <select className="search-select" value={selYear} onChange={e=>setSelYear(+e.target.value)}>
                    {yearOptions.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                <select className="search-select" value={selMonth} onChange={e=>setSelMonth(+e.target.value)}>
                    {MONTHS_UZ.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                </select>

                {!isTeacher && groupSubjects.length > 0 && (
                    <select className="search-select" value={selSubjectId}
                        onChange={e=>{ setSelSubjectId(e.target.value); setPending({}); }}
                        style={{ minWidth:130 }}>
                        <option value="">Barcha fanlar</option>
                        {groupSubjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                )}
                {isTeacher && teacherSubjectId && groupSubjects.length > 0 && (
                    <span style={{ fontSize:'0.78rem', color:'var(--accent)', fontWeight:600, display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:9, background:'var(--accent-soft)', border:'1px solid var(--card-border)' }}>
                        <BookOpen size={13}/>{groupSubjects.find(s=>s.id===teacherSubjectId)?.name||'Fan'}
                    </span>
                )}

                {hasPending && (
                    <button onClick={saveAll} disabled={saving}
                        style={{ display:'flex', alignItems:'center', gap:6, marginLeft:'auto', padding:'8px 16px', borderRadius:9, border:'none', background:'var(--accent)', color:'#fff', fontSize:'0.82rem', fontWeight:600, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
                        <Save size={14}/>{saving?'Saqlanmoqda...':`Saqlash (${Object.keys(pending).length})`}
                    </button>
                )}
            </div>

            {/* Table */}
            {historyStudents.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
                    <BookOpen size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/>
                    <p>Fan tanlang yoki o'quvchilar topilmadi</p>
                </div>
            ) : (
                <div ref={tableWrapRef} style={{ overflowX:'auto', borderRadius:12, border:'1px solid var(--card-border)', background:'var(--card-bg)' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
                        <thead>
                            <tr style={{ background:'var(--accent-soft)' }}>
                                <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'var(--accent)', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', position:'sticky', left:0, background:'var(--accent-soft)', zIndex:2 }}>
                                    O'quvchi
                                </th>
                                {allDates.map(d => {
                                    const dayName = dayNameOf(d);
                                    const isSun   = dayName === 'sunday';
                                    const isToday = d === todayStr;
                                    /* Jadvalda bu kun dars bormi? */
                                    const hasDaySchedule = (dayScheduleMap[dayName]||[]).length > 0;
                                    if (!hasDaySchedule) return null; // dars yo'q kunni ko'rsatma
                                    return (
                                        <th key={d} style={{
                                            padding:'10px 6px', textAlign:'center', fontWeight:700,
                                            color: isToday?'#fff':isSun?'var(--danger)':'var(--accent)',
                                            fontSize:'0.7rem', minWidth:merged?120:80, whiteSpace:'nowrap',
                                            background: isToday?'var(--accent)':'var(--accent-soft)',
                                        }}>
                                            {parseLocal(d).toLocaleDateString('uz-UZ',{day:'2-digit',month:'2-digit'})}
                                            {isToday
                                                ? <span style={{ fontSize:'0.58rem', display:'block', opacity:0.85 }}>Bugun</span>
                                                : <div style={{ fontSize:'0.62rem', fontWeight:400, color:isSun?'var(--danger)':'var(--text-muted)' }}>{DAY_SHORT[dayName]}</div>
                                            }
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {historyStudents.map(s => (
                                <tr key={s.id} style={{ borderTop:'1px solid var(--card-border)' }}>
                                    {/* Name */}
                                    <td style={{ padding:'8px 14px', fontWeight:600, color:'var(--text-primary)', position:'sticky', left:0, background:'var(--card-bg)', zIndex:1, whiteSpace:'nowrap' }}>
                                        {isTeacher
                                            ? <span>{s.full_name}</span>
                                            : <Link to={`/student/${s.id}`} style={{ color:'inherit', textDecoration:'none' }}
                                                onMouseEnter={e=>e.target.style.color='var(--accent)'}
                                                onMouseLeave={e=>e.target.style.color='inherit'}>
                                                {s.full_name}
                                              </Link>
                                        }
                                    </td>
                                    {/* Date cells — jadval asosida */}
                                    {allDates.map(d => {
                                        const dayName  = dayNameOf(d);
                                        const daySchs  = dayScheduleMap[dayName] || [];
                                        if (!daySchs.length) return null;
                                        const isToday  = d === todayStr;
                                        return (
                                            <td key={d} style={{ padding:'4px 3px', verticalAlign:'top', background: isToday?'var(--accent-soft)':undefined }}>
                                                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                                    {daySchs.map((sch, si) => {
                                                        const schId    = sch.schedule_id;
                                                        const curStatus= getStatus(s.id, d, schId);
                                                        const curScore = getScore(s.id, d, schId);
                                                        const hasChg   = pending[pKey(s.id, d, schId)] !== undefined;
                                                        const scoreNum = curScore !== '' ? Number(curScore) : null;
                                                        return (
                                                            <div key={schId||si} style={{
                                                                display:'flex', flexDirection:'column', gap:3,
                                                                padding:'4px 5px', borderRadius:7,
                                                                background: hasChg?'var(--warning-soft)':'transparent',
                                                                border:`1px solid ${hasChg?'var(--warning)':'var(--card-border)'}`,
                                                            }}>
                                                                {/* Fan nomi */}
                                                                <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:merged?110:70 }}>
                                                                    {sch.subject_name}
                                                                </div>
                                                                {/* Status buttons */}
                                                                <div style={{ display:'flex', gap:3 }}>
                                                                    {['present','absent','late'].map(v=>(
                                                                        <StatusBtn key={v} value={v} current={curStatus}
                                                                            onClick={()=>onStatus(s.id, d, schId, curStatus===v?null:v)}/>
                                                                    ))}
                                                                </div>
                                                                {/* Score input — merged holatda */}
                                                                {merged && (
                                                                    <input type="number" min={0} max={100}
                                                                        value={curScore}
                                                                        onChange={e=>onScore(s.id, d, schId, e.target.value)}
                                                                        placeholder="%"
                                                                        style={{
                                                                            width:'100%', padding:'2px 4px',
                                                                            border:`1px solid ${scoreNum!=null?scoreColor(scoreNum):'var(--input-border)'}`,
                                                                            borderRadius:5,
                                                                            background:scoreNum!=null?scoreBg(scoreNum):'var(--input-bg)',
                                                                            color:scoreNum!=null?scoreColor(scoreNum):'var(--input-text)',
                                                                            fontSize:'0.7rem', outline:'none', textAlign:'center',
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
