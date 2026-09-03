import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLazyGetGradesQuery, useBulkGradeMutation } from '../../../../store/services/grades.api';
import { Save, BookOpen, Info, Check } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import Loading from '../../../Other/UI/Loadings/Loading';
import Modal from '../../../Other/UI/Modal/Modal';

const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
const JS_DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_SHORT = {monday:'Du',tuesday:'Se',wednesday:'Ch',thursday:'Pa',friday:'Ju',saturday:'Sh',sunday:'Ya'};

const padZ = (n)=>String(n).padStart(2,'0');
const fmtLocal  = (d)=>`${d.getFullYear()}-${padZ(d.getMonth()+1)}-${padZ(d.getDate())}`;
const parseLocal = (s)=>{ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
const dayNameOf  = (s)=>JS_DAY_NAMES[parseLocal(s).getDay()];
const monthRange = (y,m)=>({ from:fmtLocal(new Date(y,m-1,1)), to:fmtLocal(new Date(y,m,0)) });
const fmtTime    = (t)=>t?t.slice(0,5):'—';
const scoreColor = (s)=>s==null?'var(--text-muted)':s>=80?'var(--success)':s>=60?'var(--warning)':'var(--danger)';
const scoreBg    = (s)=>s==null?'var(--input-bg)':s>=80?'var(--success-soft)':s>=60?'var(--warning-soft)':'var(--danger-soft)';

/* ── Grade info modal ── */
function GradeInfoModal({ open, onClose, entry, onSave }) {
    const [score,   setScore]   = useState('');
    const [comment, setComment] = useState('');
    const [saving,  setSaving]  = useState(false);

    useEffect(()=>{ if(open&&entry){ setScore(entry.score!=null?String(entry.score):''); setComment(entry.comment||''); } },[open,entry]);

    const handleSave = async ()=>{
        setSaving(true);
        try { await onSave({score,comment}); onClose(); } finally { setSaving(false); }
    };
    const scoreNum = score!==''?Number(score):null;

    return (
        <Modal open={open} onClose={onClose} title="Baho" size="sm">
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>
                    <strong style={{color:'var(--text-primary)'}}>{entry?.studentName}</strong>
                    {' · '}{entry?.date}
                    {entry?.subjectName && <span style={{marginLeft:6,color:'var(--accent)',fontWeight:600}}>{entry.subjectName}</span>}
                    {entry?.lessonNumber && <span style={{marginLeft:4,fontSize:'0.68rem',color:'var(--text-muted)'}}>#{entry.lessonNumber}</span>}
                </div>
                <div>
                    <label style={{fontSize:'0.72rem',color:'var(--text-muted)',fontWeight:600,display:'block',marginBottom:4}}>Baho (0–100%)</label>
                    <input type="number" min={0} max={100} value={score} onChange={e=>setScore(e.target.value)}
                        placeholder="—" className="search-input"
                        style={{paddingLeft:14,
                            border:`1.5px solid ${scoreNum!=null?scoreColor(scoreNum):'var(--input-border)'}`,
                            background:scoreNum!=null?scoreBg(scoreNum):'var(--input-bg)',
                            color:scoreNum!=null?scoreColor(scoreNum):'var(--input-text)'}}/>
                    {scoreNum!=null && <div style={{marginTop:4,fontSize:'0.72rem',fontWeight:700,color:scoreColor(scoreNum)}}>{scoreNum}%</div>}
                </div>
                <div>
                    <label style={{fontSize:'0.72rem',color:'var(--text-muted)',fontWeight:600,display:'block',marginBottom:4}}>Izoh (ixtiyoriy)</label>
                    <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={2}
                        placeholder="Izoh..." className="search-input" style={{paddingLeft:14,height:'auto',resize:'vertical'}}/>
                </div>
            </div>
            <div className="modal-footer">
                <button className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                <button className="btn-submit" onClick={handleSave} disabled={saving}>
                    <Check size={14}/>{saving?'Saqlanmoqda...':'Saqlash'}
                </button>
            </div>
        </Modal>
    );
}

export default function GradesTab({
    students:studentsProp=[], groupSubjects=[], teacherSubjectId=null, scheduleRecords:scheduleRecordsProp=[],
}) {
    const { id:groupId } = useParams();
    const role = useSelector(s=>s.auth?.role);
    const isTeacher = role==='teacher';

    const now = new Date();
    const [selYear,  setSelYear]  = useState(now.getFullYear());
    const [selMonth, setSelMonth] = useState(now.getMonth()+1);
    const { from:dateFrom, to:dateTo } = monthRange(selYear,selMonth);

    const [selSubjectId,  setSelSubjectId]  = useState('');
    const [selScheduleId, setSelScheduleId] = useState('');
    const activeSubjectId  = isTeacher ? teacherSubjectId : (selSubjectId||null);
    const activeScheduleId = selScheduleId||null;

    const [fetchGrades, { data, isLoading, isFetching, error }] = useLazyGetGradesQuery();
    const [bulkGrade] = useBulkGradeMutation();

    const load = useCallback(()=>{
        if (!groupId) return;
        fetchGrades({group_id:groupId,date_from:dateFrom,date_to:dateTo,page:1,limit:100,
            ...(activeSubjectId  && {subject_id:activeSubjectId}),
            ...(activeScheduleId && {group_schedule_id:activeScheduleId}),
        });
    },[groupId,dateFrom,dateTo,activeSubjectId,activeScheduleId]);

    useEffect(()=>{ load(); },[load]);

    const [localData, setLocalData] = useState(null);
    useEffect(()=>{ if(data) setLocalData(data); },[data]);

    const records = localData?.data?.records || [];

    const gradesMap = useMemo(()=>{
        const m={};
        records.forEach(s=>{ if(!s.student_id) return;
            m[s.student_id]={full_name:s.full_name,dateMap:{}};
            s.dates?.forEach(de=>{ m[s.student_id].dateMap[de.date]={};
                (de.subjects||[]).forEach(sb=>{ m[s.student_id].dateMap[de.date][sb.group_schedule_id]={grade_id:sb.grade_id,score:sb.score,comment:sb.comment}; });
            });
        });
        return m;
    },[records]);

    const dateSubjectsTemplate = useMemo(()=>{
        const m={};
        records.forEach(s=>{ s.dates?.forEach(de=>{ if(!m[de.date]) m[de.date]=(de.subjects||[]).map(sb=>({
            group_schedule_id:sb.group_schedule_id,subject_name:sb.subject_name,
            lesson_number:sb.lesson_number,start_time:sb.start_time,end_time:sb.end_time,subject_id:sb.subject_id,
        })); }); });
        return m;
    },[records]);

    /* Unique schedules per subject — scheduleRecordsProp dan ham olish */
    const subjectSchedules = useMemo(()=>{
        const m={};
        Object.values(dateSubjectsTemplate).forEach(subs=>{ subs.forEach(sb=>{
            if(!sb.subject_id) return;
            if(!m[sb.subject_id]) m[sb.subject_id]=[];
            if(!m[sb.subject_id].find(x=>x.id===sb.group_schedule_id))
                m[sb.subject_id].push({ id:sb.group_schedule_id, label:`${sb.lesson_number||''}. ${fmtTime(sb.start_time)}–${fmtTime(sb.end_time)}` });
        }); });
        scheduleRecordsProp.forEach(s=>{
            const sid=s.subject_id; if(!sid) return;
            const id=s.id||s.schedule_id; if(!id) return;
            if(!m[sid]) m[sid]=[];
            if(!m[sid].find(x=>x.id===id))
                m[sid].push({ id, label:`${fmtTime(s.start_time)}–${fmtTime(s.end_time)}` });
        });
        return m;
    },[dateSubjectsTemplate,scheduleRecordsProp]);

    /* Bir kunda 2+ dars bo'lgan subjectlar — scheduleRecordsProp asosida (stable, filtdan ta'sirlanmaydi).
       day_of_week bo'yicha grouplab, bir kunda 2+ schedule bo'lsa true. */
    const subjectHasMultiSameDay = useMemo(()=>{
        const result={};
        // 1. scheduleRecordsProp dan (haftalik jadval — stable)
        const bySubDay={};
        scheduleRecordsProp.forEach(s=>{
            if(!s.subject_id||!s.day_of_week) return;
            const key=`${s.subject_id}__${s.day_of_week}`;
            bySubDay[key]=(bySubDay[key]||0)+1;
        });
        Object.entries(bySubDay).forEach(([key,cnt])=>{
            if(cnt>=2){ const sid=key.split('__')[0]; result[sid]=true; }
        });
        // 2. dateSubjectsTemplate dan ham (API data bo'lsa aniqroq)
        Object.values(dateSubjectsTemplate).forEach(subs=>{
            const countBySub={};
            subs.forEach(sb=>{ if(!sb.subject_id) return; countBySub[sb.subject_id]=(countBySub[sb.subject_id]||0)+1; });
            Object.entries(countBySub).forEach(([sid,cnt])=>{ if(cnt>=2) result[sid]=true; });
        });
        return result;
    },[scheduleRecordsProp,dateSubjectsTemplate]);

    /* Bir kunda bir nechta dars bo'lsa ham, faning boshqa kunlardagi darslarini saqlaymiz. */
    const filteredSubjectSchedules = useMemo(()=>{
        return subjectSchedules;
    },[subjectSchedules,subjectHasMultiSameDay,scheduleRecordsProp,dateSubjectsTemplate]);

    const todayStr = fmtLocal(new Date());
    const allDates = useMemo(()=>{
        const dates=[]; let cur=parseLocal(dateFrom); const end=parseLocal(dateTo);
        while(cur<=end){ dates.push(fmtLocal(cur)); cur.setDate(cur.getDate()+1); }
        const idx=dates.indexOf(todayStr);
        if(idx<=0) return dates;
        return [...dates.slice(0,idx).reverse(), ...dates.slice(idx)];
    },[dateFrom,dateTo,todayStr]);

    const visibleDates = useMemo(()=>allDates.filter(d=>dateSubjectsTemplate[d]?.length>0),[allDates,dateSubjectsTemplate]);

    const students = useMemo(()=>{
        if(records.length>0) return records.map(r=>({id:r.student_id,full_name:r.full_name}));
        return studentsProp.map(s=>({id:s.id,full_name:s.full_name}));
    },[records,studentsProp]);

    /* Pending */
    const [pending, setPending] = useState({});
    const pKey = (sid,date,schId)=>`${sid}|${date}|${schId}`;

    const getScore = (sid,date,schId)=>{
        const k=pKey(sid,date,schId);
        if(pending[k]?.score!==undefined) return pending[k].score;
        const sc=gradesMap[sid]?.dateMap?.[date]?.[schId]?.score;
        return sc!=null?String(sc):'';
    };

    /* Info modal */
    const [infoEntry, setInfoEntry] = useState(null);
    const openInfo = (sid,full_name,date,sb)=>{
        const schId=sb.group_schedule_id;
        const p=pending[pKey(sid,date,schId)]||{};
        setInfoEntry({
            sid,studentName:full_name,date,schId,
            subjectName:sb.subject_name,lessonNumber:sb.lesson_number,
            score:p.score!==undefined?p.score:(gradesMap[sid]?.dateMap?.[date]?.[schId]?.score!=null?String(gradesMap[sid].dateMap[date][schId].score):''),
            comment:p.comment!==undefined?p.comment:(gradesMap[sid]?.dateMap?.[date]?.[schId]?.comment||''),
        });
    };
    const handleInfoSave = ({score,comment})=>{
        if(!infoEntry) return Promise.resolve();
        const {sid,date,schId}=infoEntry;
        setPending(prev=>({...prev,[pKey(sid,date,schId)]:{...prev[pKey(sid,date,schId)],score,comment}}));
        return Promise.resolve();
    };

    /* Bulk save */
    const [saving, setSaving] = useState(false);
    const saveAll = async ()=>{
        const entries=Object.entries(pending);
        if(!entries.length) return Alert("O'zgarish yo'q",'info');
        setSaving(true); let ok=0,fail=0;
        const groups={};
        entries.forEach(([k,v])=>{
            const [sid,date,schId]=k.split('|');
            if(v.score===''||v.score===undefined) return;
            const n=Number(v.score);
            if(isNaN(n)||n<0||n>100) return;
            const gk=`${date}|${schId}`;
            if(!groups[gk]) groups[gk]={date,schId,records:[]};
            groups[gk].records.push({student_id:sid,score:n,...(v.comment&&{comment:v.comment})});
        });
        for(const {date,schId,records} of Object.values(groups)){
            try{ await bulkGrade({group_schedule_id:schId,date,records}).unwrap(); ok+=records.length; }
            catch(e){ console.error(e?.data?.message||e); fail+=records.length; }
        }
        setPending({}); setSaving(false);
        if(fail>0) Alert(`${ok} ta saqlandi, ${fail} ta xato`,'warning');
        else Alert(`${ok} ta baho saqlandi`,'success');
        load();
    };

    const hasPending = Object.keys(pending).length>0;
    const tableWrapRef = useRef(null);
    useEffect(()=>{
        if(!tableWrapRef.current||!allDates.length) return;
        const idx=allDates.indexOf(todayStr); if(idx<=0) return;
        tableWrapRef.current.scrollLeft=150+idx*90-10;
    },[allDates.length,todayStr]);

    const yearOptions=[]; for(let y=now.getFullYear()-3;y<=now.getFullYear()+1;y++) yearOptions.push(y);

    if(isLoading && !isFetching) return <Loading/>;
    if(error) return <div style={{color:'var(--danger)',padding:12,background:'var(--danger-soft)',borderRadius:10}}>Xatolik</div>;

    return (
        <div style={{display:'flex',flexDirection:'column',gap:14,position:'relative'}}>
            {/* Re-fetch loading overlay */}
            {isFetching && (
                <div style={{position:'absolute',inset:0,background:'var(--card-bg)',opacity:0.6,zIndex:10,borderRadius:12,display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:48,pointerEvents:'all'}}>
                    <Loading/>
                </div>
            )}
            {/* Toolbar */}
            <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
                <select className="search-select" value={selYear} onChange={e=>setSelYear(+e.target.value)}>
                    {yearOptions.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                <select className="search-select" value={selMonth} onChange={e=>setSelMonth(+e.target.value)}>
                    {MONTHS_UZ.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                </select>

                {!isTeacher && groupSubjects.length>0 && (
                    <select className="search-select" value={selSubjectId}
                        onChange={e=>{ setSelSubjectId(e.target.value); setSelScheduleId(''); setPending({}); }}
                        style={{minWidth:130}}>
                        <option value="">Barcha fanlar</option>
                        {groupSubjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                )}

                {/* Bir kunda 2+ dars bo'lsa schedule select ko'rinadi */}
                {!isTeacher && activeSubjectId && subjectHasMultiSameDay[activeSubjectId] && (filteredSubjectSchedules[activeSubjectId]||[]).length>1 && (
                    <select className="search-select" value={selScheduleId}
                        onChange={e=>{ setSelScheduleId(e.target.value); setPending({}); }}
                        style={{minWidth:150}}>
                        <option value="">Barcha darslar</option>
                        {(filteredSubjectSchedules[activeSubjectId]||[]).map(sc=>(
                            <option key={sc.id} value={sc.id}>{sc.label}</option>
                        ))}
                    </select>
                )}

                {isTeacher && teacherSubjectId && groupSubjects.length>0 && (
                    <span style={{fontSize:'0.78rem',color:'var(--accent)',fontWeight:600,display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:9,background:'var(--accent-soft)',border:'1px solid var(--card-border)'}}>
                        <BookOpen size={13}/>{groupSubjects.find(s=>s.id===teacherSubjectId)?.name||'Fan'}
                    </span>
                )}

                {hasPending && (
                    <button onClick={saveAll} disabled={saving}
                        style={{display:'flex',alignItems:'center',gap:6,marginLeft:'auto',padding:'8px 16px',borderRadius:9,border:'none',background:'var(--accent)',color:'#fff',fontSize:'0.82rem',fontWeight:600,cursor:saving?'not-allowed':'pointer',opacity:saving?0.7:1}}>
                        <Save size={14}/>{saving?'Saqlanmoqda...':`Saqlash (${Object.keys(pending).length})`}
                    </button>
                )}
            </div>

            {/* Table */}
            {students.length===0 ? (
                <div style={{textAlign:'center',padding:'40px 0',color:'var(--text-muted)'}}>
                    <BookOpen size={40} style={{opacity:.2,margin:'0 auto 10px'}}/><p>Fan tanlang yoki o'quvchilar topilmadi</p>
                </div>
            ) : (
                <div ref={tableWrapRef} style={{overflowX:'auto',borderRadius:12,border:'1px solid var(--card-border)',background:'var(--card-bg)'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.82rem'}}>
                        <thead>
                            <tr style={{background:'var(--accent-soft)'}}>
                                <th style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'var(--accent)',fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.06em',position:'sticky',left:0,background:'var(--accent-soft)',zIndex:2}}>O'quvchi</th>
                                {visibleDates.map(d=>{
                                    const isToday=d===todayStr, isSun=dayNameOf(d)==='sunday';
                                    return (
                                        <th key={d} style={{padding:'10px 6px',textAlign:'center',fontWeight:700,
                                            color:isToday?'#fff':isSun?'var(--danger)':'var(--accent)',
                                            fontSize:'0.7rem',whiteSpace:'nowrap',minWidth:82,
                                            background:isToday?'var(--accent)':'var(--accent-soft)',
                                            borderLeft:'1px solid var(--card-border)'}}>
                                            {parseLocal(d).toLocaleDateString('uz-UZ',{day:'2-digit',month:'2-digit'})}
                                            {isToday?<span style={{fontSize:'0.58rem',display:'block',opacity:0.85}}>Bugun</span>
                                                :<div style={{fontSize:'0.62rem',fontWeight:400,color:isSun?'var(--danger)':'var(--text-muted)'}}>{DAY_SHORT[dayNameOf(d)]}</div>}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s=>(
                                <tr key={s.id} style={{borderTop:'1px solid var(--card-border)'}}>
                                    <td style={{padding:'8px 14px',fontWeight:600,color:'var(--text-primary)',position:'sticky',left:0,background:'var(--card-bg)',zIndex:1,whiteSpace:'nowrap'}}>
                                        {isTeacher?<span>{s.full_name}</span>
                                            :<Link to={`/student/${s.id}`} style={{color:'inherit',textDecoration:'none'}}
                                                onMouseEnter={e=>e.target.style.color='var(--accent)'}
                                                onMouseLeave={e=>e.target.style.color='inherit'}>{s.full_name}</Link>}
                                    </td>
                                    {visibleDates.map(d=>{
                                        const subs=dateSubjectsTemplate[d]||[];
                                        const isToday=d===todayStr;
                                        const multi=subs.length>1;
                                        return (
                                            <td key={d} style={{padding:'4px 3px',verticalAlign:'top',
                                                background:isToday?'var(--accent-soft)':undefined,
                                                borderLeft:'1px solid var(--card-border)'}}>
                                                <div style={{display:'flex',flexDirection:'column',gap:3}}>
                                                    {subs.map(sb=>{
                                                        const schId=sb.group_schedule_id;
                                                        const curScore=getScore(s.id,d,schId);
                                                        const hasChg=pending[pKey(s.id,d,schId)]!==undefined;
                                                        const scoreNum=curScore!==''?Number(curScore):null;
                                                        return (
                                                            <div key={schId} style={{display:'flex',flexDirection:'column',gap:2,padding:'4px 5px',borderRadius:7,
                                                                background:hasChg?'var(--warning-soft)':scoreNum!=null?scoreBg(scoreNum):'transparent',
                                                                border:`1px solid ${hasChg?'var(--warning)':scoreNum!=null?scoreColor(scoreNum):'var(--card-border)'}`}}>
                                                                {/* Fan nomi */}
                                                                <div style={{fontSize:'0.58rem',fontWeight:600,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                                                                    {sb.subject_name}{multi?` #${sb.lesson_number}`:''}
                                                                </div>
                                                                <div style={{display:'flex',alignItems:'center',gap:3}}>
                                                                    {/* Score input */}
                                                                    <input type="number" min={0} max={100} value={curScore}
                                                                        onChange={e=>setPending(prev=>({...prev,[pKey(s.id,d,schId)]:{...prev[pKey(s.id,d,schId)],score:e.target.value}}))}
                                                                        placeholder="—"
                                                                        style={{flex:1,minWidth:0,padding:'2px 4px',
                                                                            border:`1px solid ${scoreNum!=null?scoreColor(scoreNum):'var(--input-border)'}`,
                                                                            borderRadius:4,background:scoreNum!=null?scoreBg(scoreNum):'var(--input-bg)',
                                                                            color:scoreNum!=null?scoreColor(scoreNum):'var(--input-text)',
                                                                            fontSize:'0.72rem',fontWeight:600,outline:'none',textAlign:'center'}}
                                                                    />
                                                                    {/* Info btn */}
                                                                    <button onClick={()=>openInfo(s.id,s.full_name,d,sb)}
                                                                        title="Izoh"
                                                                        style={{width:20,height:20,borderRadius:4,border:'1px solid var(--card-border)',
                                                                            background:'var(--input-bg)',color:'var(--text-muted)',
                                                                            display:'flex',alignItems:'center',justifyContent:'center',
                                                                            cursor:'pointer',padding:0,flexShrink:0}}
                                                                        onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-soft)';e.currentTarget.style.color='var(--accent)';}}
                                                                        onMouseLeave={e=>{e.currentTarget.style.background='var(--input-bg)';e.currentTarget.style.color='var(--text-muted)';}}>
                                                                        <Info size={11}/>
                                                                    </button>
                                                                </div>
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

            {/* Grade Info modal */}
            <GradeInfoModal
                open={!!infoEntry}
                onClose={()=>setInfoEntry(null)}
                entry={infoEntry}
                onSave={handleInfoSave}
            />
        </div>
    );
}
