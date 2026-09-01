import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLazyGetGradesQuery, useCreateGradeMutation, useUpdateGradeMutation } from '../../../../store/services/grades.api';
import { useLazyGetGroupScheduleByGroupIdQuery } from '../../../../store/services/group-schedule.api';
import { Save, BookOpen } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import Loading from '../../../Other/UI/Loadings/Loading';

const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
const JS_DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_SHORT = { monday:'Du', tuesday:'Se', wednesday:'Ch', thursday:'Pa', friday:'Ju', saturday:'Sh', sunday:'Ya' };

const padZ = (n) => String(n).padStart(2,'0');
const fmtLocal  = (d) => `${d.getFullYear()}-${padZ(d.getMonth()+1)}-${padZ(d.getDate())}`;
const parseLocal = (s) => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
const dayNameOf  = (dateStr) => JS_DAY_NAMES[parseLocal(dateStr).getDay()];
const monthRange = (year, month) => ({
    from: fmtLocal(new Date(year, month-1, 1)),
    to:   fmtLocal(new Date(year, month, 0)),
});
const scoreColor = (s) => s==null?'var(--text-muted)':s>=80?'var(--success)':s>=60?'var(--warning)':'var(--danger)';
const scoreBg    = (s) => s==null?'var(--input-bg)':s>=80?'var(--success-soft)':s>=60?'var(--warning-soft)':'var(--danger-soft)';

export default function GradesTab({
    students: studentsProp = [],
    groupSubjects = [],
    teacherSubjectId = null,
    scheduleRecords: scheduleRecordsProp = [],
}) {
    const { id: groupId } = useParams();
    const role = useSelector(s => s.auth?.role);
    const isTeacher = role === 'teacher';

    /* ── Agar scheduleRecords prop bo'sh bo'lsa, o'zi yuklab oladi ── */
    const [fetchSchedule, { data: scheduleApiData }] = useLazyGetGroupScheduleByGroupIdQuery();
    useEffect(() => {
        if (groupId && (!scheduleRecordsProp || scheduleRecordsProp.length === 0)) {
            fetchSchedule(groupId);
        }
    }, [groupId, scheduleRecordsProp?.length]);

    const scheduleRecords = useMemo(() => {
        if (Array.isArray(scheduleRecordsProp) && scheduleRecordsProp.length > 0) return scheduleRecordsProp;
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

    const [fetchGrades, { data, isLoading, error }] = useLazyGetGradesQuery();
    const [createGrade] = useCreateGradeMutation();
    const [updateGrade] = useUpdateGradeMutation();

    const load = useCallback(() => {
        if (groupId) fetchGrades({
            group_id: groupId, date_from: dateFrom, date_to: dateTo, page:1, limit:100,
            ...(activeSubjectId && { subject_id: activeSubjectId }),
        });
    }, [groupId, dateFrom, dateTo, activeSubjectId]);

    useEffect(() => { load(); }, [load]);

    const [localData, setLocalData] = useState(null);
    useEffect(() => { if (data) setLocalData(data); }, [data]);

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
            const schId = s.id || s.schedule_id || s.group_schedule_id;
            if (!s.day_of_week || !schId) return;
            if (!m[s.day_of_week]) m[s.day_of_week] = [];
            m[s.day_of_week].push({
                schedule_id:  schId,
                subject_id:   s.subject_id,
                subject_name: s.subject?.name || s.subject_name || '—',
            });
        });
        return m;
    }, [scheduleRecords, activeSubjectId]);

    /* ── gradesMap: { student_id → { date → { schedule_id → {grade_id, score} } } } ── */
    const records = localData?.data?.records || [];
    const gradesMap = useMemo(() => {
        const m = {};
        records.forEach(s => {
            if (!s.student_id) return;
            m[s.student_id] = { full_name: s.full_name };
            s.dates?.forEach(de => {
                if (!m[s.student_id].dates) m[s.student_id].dates = {};
                m[s.student_id].dates[de.date] = {};
                (de.subjects||[]).forEach(sb => {
                    m[s.student_id].dates[de.date][sb.group_schedule_id] = {
                        grade_id: sb.grade_id,
                        score:    sb.score,
                    };
                });
            });
        });
        return m;
    }, [records]);

    /* ── Students ── */
    const students = useMemo(() => {
        if (records.length > 0) return records.map(r=>({ id:r.student_id, full_name:r.full_name }));
        return studentsProp.map(s=>({ id:s.id, full_name:s.full_name }));
    }, [records, studentsProp]);

    /* ── Pending: key = `student|date|schedule_id` ── */
    const [pending, setPending] = useState({});
    const pKey = (sid, date, schId) => `${sid}|${date}|${schId}`;

    const getScore = (sid, date, schId) => {
        const k = pKey(sid, date, schId);
        if (pending[k] !== undefined) return pending[k];
        const sc = gradesMap[sid]?.dates?.[date]?.[schId]?.score;
        return sc != null ? String(sc) : '';
    };

    /* ── Save ── */
    const [saving, setSaving] = useState(false);
    const saveAll = async () => {
        const entries = Object.entries(pending);
        if (!entries.length) return Alert("O'zgarish yo'q", 'info');
        setSaving(true);
        let ok=0, fail=0;
        const errors = [];
        for (const [k, scoreVal] of entries) {
            const [sid, date, schId] = k.split('|');
            if (!schId || schId === 'undefined' || String(schId).startsWith('temp-')) {
                errors.push(`Noto'g'ri jadval ID: ${schId}`);
                fail++; continue;
            }
            const n = Number(scoreVal);
            if (isNaN(n) || n < 0 || n > 100) { fail++; continue; }
            const existing = gradesMap[sid]?.dates?.[date]?.[schId];
            try {
                if (existing?.grade_id) {
                    await updateGrade({ id:existing.grade_id, data:{ score:n } }).unwrap();
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
        setPending({});
        setSaving(false);
        if (fail > 0) {
            const uniqueErrors = [...new Set(errors)];
            Alert(`${ok} ta saqlandi, ${fail} ta xato: ${uniqueErrors.join('; ')}`, 'warning');
        } else {
            Alert(`${ok} ta baho saqlandi`, 'success');
        }
        load();
    };

    const hasPending = Object.keys(pending).length > 0;

    /* scroll to today */
    const tableWrapRef = useRef(null);
    useEffect(() => {
        if (!tableWrapRef.current || !allDates.length) return;
        const idx = allDates.indexOf(todayStr);
        if (idx <= 0) return;
        tableWrapRef.current.scrollLeft = 150 + idx * 90 - 10;
    }, [allDates.length, todayStr]);

    const yearOptions = [];
    for (let y=now.getFullYear()-3; y<=now.getFullYear()+1; y++) yearOptions.push(y);

    if (isLoading) return <Loading/>;
    if (error) return <div style={{color:'var(--danger)',padding:12,background:'var(--danger-soft)',borderRadius:10}}>Xatolik</div>;

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
            {students.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
                    <BookOpen size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/>
                    <p>Fan tanlang yoki o'quvchilar topilmadi</p>
                </div>
            ) : (
                <div ref={tableWrapRef} style={{ overflowX:'auto', borderRadius:12, border:'1px solid var(--card-border)', background:'var(--card-bg)' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
                        <thead>
                            <tr style={{ background:'var(--accent-soft)' }}>
                                <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'var(--accent)', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.06em', position:'sticky', left:0, background:'var(--accent-soft)', zIndex:2 }}>O'quvchi</th>
                                {allDates.map(d => {
                                    const dayName = dayNameOf(d);
                                    if (!(dayScheduleMap[dayName]||[]).length) return null;
                                    const isToday = d === todayStr;
                                    const isSun   = dayName === 'sunday';
                                    return (
                                        <th key={d} style={{
                                            padding:'10px 6px', textAlign:'center', fontWeight:700,
                                            color:isToday?'#fff':isSun?'var(--danger)':'var(--accent)',
                                            fontSize:'0.7rem', minWidth:80, whiteSpace:'nowrap',
                                            background:isToday?'var(--accent)':'var(--accent-soft)',
                                        }}>
                                            {parseLocal(d).toLocaleDateString('uz-UZ',{day:'2-digit',month:'2-digit'})}
                                            {isToday
                                                ? <span style={{fontSize:'0.58rem',display:'block',opacity:0.85}}>Bugun</span>
                                                : <div style={{fontSize:'0.62rem',fontWeight:400,color:isSun?'var(--danger)':'var(--text-muted)'}}>{DAY_SHORT[dayName]}</div>
                                            }
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => (
                                <tr key={s.id} style={{ borderTop:'1px solid var(--card-border)' }}>
                                    <td style={{ padding:'8px 14px', fontWeight:600, color:'var(--text-primary)', position:'sticky', left:0, background:'var(--card-bg)', zIndex:1, whiteSpace:'nowrap' }}>
                                        {isTeacher
                                            ? <span>{s.full_name}</span>
                                            : <Link to={`/student/${s.id}`} style={{color:'inherit',textDecoration:'none'}}
                                                onMouseEnter={e=>e.target.style.color='var(--accent)'}
                                                onMouseLeave={e=>e.target.style.color='inherit'}>
                                                {s.full_name}
                                              </Link>
                                        }
                                    </td>
                                    {allDates.map(d => {
                                        const dayName = dayNameOf(d);
                                        const daySchs = dayScheduleMap[dayName] || [];
                                        if (!daySchs.length) return null;
                                        const isToday = d === todayStr;
                                        return (
                                            <td key={d} style={{ padding:'4px 3px', verticalAlign:'top', background:isToday?'var(--accent-soft)':undefined }}>
                                                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                                    {daySchs.map((sch, si) => {
                                                        const schId   = sch.schedule_id;
                                                        const curScore= getScore(s.id, d, schId);
                                                        const hasChg  = pending[pKey(s.id, d, schId)] !== undefined;
                                                        const scoreNum= curScore !== '' ? Number(curScore) : null;
                                                        return (
                                                            <div key={schId||si} style={{
                                                                display:'flex', flexDirection:'column', gap:2,
                                                                padding:'4px 5px', borderRadius:7,
                                                                background:hasChg?'var(--warning-soft)':'transparent',
                                                                border:`1px solid ${hasChg?'var(--warning)':'var(--card-border)'}`,
                                                            }}>
                                                                <div style={{fontSize:'0.6rem',color:'var(--text-muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:70}}>
                                                                    {sch.subject_name}
                                                                </div>
                                                                <input type="number" min={0} max={100}
                                                                    value={curScore}
                                                                    onChange={e=>setPending(prev=>({...prev,[pKey(s.id,d,schId)]:e.target.value}))}
                                                                    placeholder="—"
                                                                    style={{
                                                                        width:'100%', padding:'3px 5px',
                                                                        border:`1.5px solid ${scoreNum!=null?scoreColor(scoreNum):'var(--input-border)'}`,
                                                                        borderRadius:6,
                                                                        background:scoreNum!=null?scoreBg(scoreNum):'var(--input-bg)',
                                                                        color:scoreNum!=null?scoreColor(scoreNum):'var(--input-text)',
                                                                        fontSize:'0.78rem', fontWeight:600, outline:'none', textAlign:'center',
                                                                    }}
                                                                />
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
