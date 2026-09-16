import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLazyGetAttendanceQuery, useBulkAttendanceMutation } from '../../../../store/services/attedance.api';
import { useLazyGetGradesQuery, useBulkGradeMutation } from '../../../../store/services/grades.api';
import { Check, X, Clock, Save, BookOpen, Info, CalendarOff } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import Loading from '../../../Other/UI/Loadings/Loading';
import Modal from '../../../Other/UI/Modal/Modal';

const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
const JS_DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const STATUS_STYLE = {
    present: { bg:'var(--success-soft)', color:'var(--success)', border:'var(--success)' },
    absent:  { bg:'var(--danger-soft)',  color:'var(--danger)',  border:'var(--danger)'  },
    late:    { bg:'var(--warning-soft)', color:'var(--warning)', border:'var(--warning)' },
};
const padZ       = (n)=>String(n).padStart(2,'0');
const fmtLocal   = (d)=>`${d.getFullYear()}-${padZ(d.getMonth()+1)}-${padZ(d.getDate())}`;
const parseLocal = (s)=>{ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
const dayNameOf  = (s)=>JS_DAY_NAMES[parseLocal(s).getDay()];
const monthRange = (y,m)=>({ from:fmtLocal(new Date(y,m-1,1)), to:fmtLocal(new Date(y,m,0)) });
const fmtTime    = (t)=>t?t.slice(0,5):'—';
const scoreColor = (s)=>s==null?'var(--text-muted)':s>=80?'var(--success)':s>=60?'var(--warning)':'var(--danger)';
const scoreBg    = (s)=>s==null?'var(--input-bg)':s>=80?'var(--success-soft)':s>=60?'var(--warning-soft)':'var(--danger-soft)';
const DAY_SHORT  = {monday:'Du',tuesday:'Se',wednesday:'Ch',thursday:'Pa',friday:'Ju',saturday:'Sh',sunday:'Ya'};
const STATUS_LABELS = {present:'Keldi',absent:'Kelmadi',late:'Kechikdi'};
const STATUS_ICONS  = {present:Check,absent:X,late:Clock};

/* ── Small status button (for table / non-teacher) ── */
function StatusBtn({ value, current, onClick, compact }) {
    const Icon = STATUS_ICONS[value];
    const st   = STATUS_STYLE[value];
    const active = current === value;
    const sz = compact ? 20 : 24;
    return (
        <button onClick={onClick} title={STATUS_LABELS[value]}
            style={{ width:sz, height:sz, borderRadius:5,
                border:`1.5px solid ${active?st.border:'var(--card-border)'}`,
                background:active?st.bg:'var(--input-bg)',
                color:active?st.color:'var(--text-muted)',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', transition:'all 0.12s', padding:0, flexShrink:0 }}>
            <Icon size={compact?10:12}/>
        </button>
    );
}

/* ── Large status button (for teacher card layout) ── */
function BigStatusBtn({ value, current, onClick }) {
    const Icon = STATUS_ICONS[value];
    const st   = STATUS_STYLE[value];
    const active = current === value;
    return (
        <button onClick={onClick}
            style={{
                flex:1, padding:'10px 6px', borderRadius:10,
                border:`2px solid ${active ? st.border : 'var(--card-border)'}`,
                background: active ? st.bg : 'var(--input-bg)',
                color: active ? st.color : 'var(--text-muted)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:5, cursor:'pointer', transition:'all 0.15s',
                fontWeight: active ? 700 : 500, fontSize:'0.74rem',
                boxShadow: active ? `0 0 0 3px ${st.border}33` : 'none',
            }}
            onMouseEnter={e=>{ if(!active){ e.currentTarget.style.borderColor=st.border; e.currentTarget.style.color=st.color; e.currentTarget.style.background=st.bg+'66'; } }}
            onMouseLeave={e=>{ if(!active){ e.currentTarget.style.borderColor='var(--card-border)'; e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='var(--input-bg)'; } }}>
            <Icon size={18}/>
            {STATUS_LABELS[value]}
        </button>
    );
}

/* ── Comment+Grade modal ── */
function InfoModal({ open, onClose, entry, merged, onSave }) {
    const [status,   setStatus]   = useState('');
    const [attCmt,   setAttCmt]   = useState('');
    const [score,    setScore]    = useState('');
    const [gradeCmt, setGradeCmt] = useState('');
    const [saving,   setSaving]   = useState(false);

    useEffect(() => {
        if (open && entry) {
            setStatus(entry.status||'');
            setAttCmt(entry.att_comment||'');
            setScore(entry.score!=null ? String(entry.score) : '');
            setGradeCmt(entry.grade_comment||'');
        }
    }, [open, entry]);

    const handleSave = async () => {
        setSaving(true);
        try { await onSave({ status, att_comment:attCmt, score, grade_comment:gradeCmt }); onClose(); }
        finally { setSaving(false); }
    };

    const scoreNum = score !== '' ? Number(score) : null;

    return (
        <Modal open={open} onClose={onClose} title="Davomat / Baho" size="sm">
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>
                    <strong style={{color:'var(--text-primary)'}}>{entry?.studentName}</strong>
                    {' · '}{entry?.date}
                    {entry?.subjectName && <span style={{marginLeft:6,color:'var(--accent)',fontWeight:600}}>{entry.subjectName}</span>}
                    {entry?.lessonNumber && <span style={{marginLeft:4,fontSize:'0.68rem',color:'var(--text-muted)'}}>#{entry.lessonNumber}</span>}
                </div>

                {/* Davomat */}
                <div>
                    <label style={{fontSize:'0.72rem',color:'var(--text-muted)',fontWeight:600,display:'block',marginBottom:6}}>Davomat holati</label>
                    <div style={{display:'flex',gap:8}}>
                        {['present','absent','late'].map(v => {
                            const st = STATUS_STYLE[v]; const active = status === v;
                            return (
                                <button key={v} onClick={()=>setStatus(status===v?'':v)}
                                    style={{flex:1,padding:'8px 0',borderRadius:9,
                                        border:`1.5px solid ${active?st.border:'var(--card-border)'}`,
                                        background:active?st.bg:'var(--input-bg)',
                                        color:active?st.color:'var(--text-secondary)',
                                        fontSize:'0.78rem',fontWeight:active?700:400,cursor:'pointer',transition:'all 0.12s'}}>
                                    {STATUS_LABELS[v]}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <label style={{fontSize:'0.72rem',color:'var(--text-muted)',fontWeight:600,display:'block',marginBottom:4}}>Davomat izohi</label>
                    <textarea value={attCmt} onChange={e=>setAttCmt(e.target.value)} rows={2}
                        placeholder="Izoh..." className="search-input" style={{paddingLeft:14,height:'auto',resize:'vertical'}}/>
                </div>

                {/* Baho — merged holatda */}
                {merged && <>
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
                        <label style={{fontSize:'0.72rem',color:'var(--text-muted)',fontWeight:600,display:'block',marginBottom:4}}>Baho izohi</label>
                        <textarea value={gradeCmt} onChange={e=>setGradeCmt(e.target.value)} rows={2}
                            placeholder="Izoh..." className="search-input" style={{paddingLeft:14,height:'auto',resize:'vertical'}}/>
                    </div>
                </>}
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

/* ══════════════════════════════════════════════════════════════
   TEACHER — bugungi kun uchun TABLE layout
══════════════════════════════════════════════════════════════ */
function TeacherTodayLayout({
    todaySubs, historyStudents, getStatus, getScore, getAttComment, getGradeComment,
    setPendingField, pending, pKey, merged, saving, saveAll, hasPending, isFetching,
}) {
    const todayStr  = fmtLocal(new Date());
    const today     = parseLocal(todayStr);
    const dayName   = DAY_SHORT[dayNameOf(todayStr)];
    const monthName = MONTHS_UZ[today.getMonth()];
    const dateLabel = `${today.getDate()} ${monthName}, ${today.getFullYear()} — ${dayName}`;

    return (
        <div style={{display:'flex',flexDirection:'column',gap:20,position:'relative'}}>
            {isFetching && (
                <div style={{position:'absolute',inset:0,background:'var(--card-bg)',opacity:0.6,zIndex:10,
                    borderRadius:12,display:'flex',alignItems:'flex-start',justifyContent:'center',
                    paddingTop:60,pointerEvents:'all'}}>
                    <Loading/>
                </div>
            )}

            {/* ── Page header ── */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                flexWrap:'wrap',gap:10,padding:'14px 18px',borderRadius:14,
                background:'var(--card-bg)',border:'1px solid var(--card-border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:42,height:42,borderRadius:12,background:'var(--accent-soft)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        border:'1.5px solid var(--card-border)',flexShrink:0}}>
                        <Check size={20} style={{color:'var(--accent)'}}/>
                    </div>
                    <div>
                        <div style={{fontSize:'0.95rem',fontWeight:700,color:'var(--text-primary)',lineHeight:1.2}}>
                            Bugungi davomat
                        </div>
                        <div style={{fontSize:'0.76rem',color:'var(--text-muted)',marginTop:2}}>{dateLabel}</div>
                    </div>
                </div>
                {hasPending && (
                    <button onClick={saveAll} disabled={saving}
                        style={{display:'flex',alignItems:'center',gap:7,padding:'10px 22px',borderRadius:11,
                            border:'none',background:'var(--accent)',color:'#fff',fontSize:'0.85rem',
                            fontWeight:700,cursor:saving?'not-allowed':'pointer',opacity:saving?0.7:1,
                            boxShadow:'0 2px 10px var(--accent-glow)'}}>
                        <Save size={15}/>{saving?'Saqlanmoqda...':`Saqlash (${Object.keys(pending).length})`}
                    </button>
                )}
            </div>

            {/* ── Per-subject tables ── */}
            {todaySubs.map((sb) => {
                const schId        = sb.group_schedule_id;
                const subjectLabel = sb.subject_name || '';
                const lessonLabel  = sb.lesson_number ? `${sb.lesson_number}-dars` : '';
                const timeLabel    = sb.start_time ? `${fmtTime(sb.start_time)} – ${fmtTime(sb.end_time)}` : '';

                return (
                    <div key={schId} style={{borderRadius:14,border:'1px solid var(--card-border)',overflow:'hidden',background:'var(--card-bg)'}}>

                        {/* Subject header row */}
                        <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 18px',
                            background:'var(--accent-soft)',borderBottom:'1px solid var(--card-border)'}}>
                            <BookOpen size={15} style={{color:'var(--accent)',flexShrink:0}}/>
                            <span style={{fontWeight:700,fontSize:'0.88rem',color:'var(--accent)'}}>{subjectLabel}</span>
                            {lessonLabel && (
                                <span style={{fontSize:'0.72rem',color:'var(--text-muted)',fontWeight:500,
                                    padding:'2px 8px',borderRadius:6,background:'var(--card-bg)',
                                    border:'1px solid var(--card-border)'}}>
                                    {lessonLabel}
                                </span>
                            )}
                            {timeLabel && (
                                <span style={{display:'flex',alignItems:'center',gap:4,fontSize:'0.75rem',
                                    color:'var(--text-muted)',padding:'2px 10px',borderRadius:6,
                                    background:'var(--card-bg)',border:'1px solid var(--card-border)',
                                    marginLeft:4,whiteSpace:'nowrap'}}>
                                    <Clock size={11}/>{timeLabel}
                                </span>
                            )}
                            <span style={{marginLeft:'auto',fontSize:'0.72rem',color:'var(--text-muted)',
                                padding:'2px 10px',borderRadius:6,background:'var(--card-bg)',
                                border:'1px solid var(--card-border)',whiteSpace:'nowrap'}}>
                                {historyStudents.length} o'quvchi
                            </span>
                        </div>

                        {/* Table */}
                        <div style={{overflowX:'auto'}}>
                            <table style={{width:'100%',borderCollapse:'collapse'}}>
                                <colgroup>
                                    <col style={{width:42}}/>
                                    <col style={{width:'18%',minWidth:150}}/>
                                    <col style={{width: merged ? '40%' : '55%'}}/>
                                    {merged && <col style={{width:'27%',minWidth:200}}/>}
                                </colgroup>
                                <thead>
                                    <tr style={{background:'var(--input-bg)',borderBottom:'2px solid var(--card-border)'}}>
                                        <th style={{padding:'10px 12px',textAlign:'center',fontSize:'0.68rem',
                                            fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',
                                            letterSpacing:'0.05em',borderRight:'1px solid var(--card-border)'}}>
                                            #
                                        </th>
                                        <th style={{padding:'10px 16px',textAlign:'left',fontSize:'0.68rem',
                                            fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',
                                            letterSpacing:'0.05em',borderRight:'1px solid var(--card-border)'}}>
                                            O'quvchi
                                        </th>
                                        <th style={{padding:'10px 16px',textAlign:'center',fontSize:'0.68rem',
                                            fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',
                                            letterSpacing:'0.05em',
                                            borderRight: merged ? '1px solid var(--card-border)' : 'none'}}>
                                            Davomat
                                        </th>
                                        {merged && (
                                            <th style={{padding:'10px 16px',textAlign:'center',fontSize:'0.68rem',
                                                fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',
                                                letterSpacing:'0.05em'}}>
                                                Baho
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyStudents.map((s, idx) => {
                                        const curStatus    = getStatus(s.id, todayStr, schId);
                                        const curScore     = getScore(s.id, todayStr, schId);
                                        const curAttCmt    = getAttComment(s.id, todayStr, schId);
                                        const curGradeCmt  = getGradeComment(s.id, todayStr, schId);
                                        const scoreNum     = curScore !== '' ? Number(curScore) : null;
                                        const hasChg       = pending[pKey(s.id, todayStr, schId)] !== undefined;
                                        const isAbsent     = curStatus === 'absent';
                                        const activeSt     = STATUS_STYLE[curStatus];
                                        const rowBg        = hasChg
                                            ? 'var(--warning-soft)'
                                            : activeSt ? activeSt.bg + '28' : 'transparent';

                                        return (
                                            <tr key={s.id} style={{
                                                borderBottom: idx < historyStudents.length-1 ? '1px solid var(--card-border)' : 'none',
                                                background: rowBg,
                                                transition:'background 0.15s',
                                            }}>
                                                {/* # */}
                                                <td style={{padding:'14px 12px',textAlign:'center',verticalAlign:'top',
                                                    borderRight:'1px solid var(--card-border)',
                                                    fontSize:'0.78rem',fontWeight:700,color:'var(--text-muted)'}}>
                                                    {idx+1}
                                                </td>

                                                {/* Name + status badge */}
                                                <td style={{padding:'14px 16px',verticalAlign:'top',
                                                    borderRight:'1px solid var(--card-border)'}}>
                                                    <div style={{fontWeight:600,fontSize:'0.87rem',
                                                        color:'var(--text-primary)',
                                                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                                        {s.full_name}
                                                    </div>
                                                    {activeSt && (()=>{
                                                        const SIcon = STATUS_ICONS[curStatus];
                                                        return (
                                                            <div style={{marginTop:5,display:'inline-flex',
                                                                alignItems:'center',gap:4,fontSize:'0.68rem',
                                                                fontWeight:700,color:activeSt.color,
                                                                padding:'3px 8px',borderRadius:5,
                                                                background:activeSt.bg,
                                                                border:`1px solid ${activeSt.border}`}}>
                                                                <SIcon size={10}/>
                                                                {STATUS_LABELS[curStatus]}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>

                                                {/* Attendance: buttons + comment input below */}
                                                <td style={{padding:'10px 14px',verticalAlign:'top',
                                                    borderRight: merged ? '1px solid var(--card-border)' : 'none'}}>
                                                    {/* Status buttons */}
                                                    <div style={{display:'flex',gap:8}}>
                                                        {['present','absent','late'].map(v => {
                                                            const st     = STATUS_STYLE[v];
                                                            const active = curStatus === v;
                                                            const Icon   = STATUS_ICONS[v];
                                                            return (
                                                                <button key={v}
                                                                    onClick={()=>setPendingField(s.id,todayStr,schId,{status:curStatus===v?null:v})}
                                                                    style={{
                                                                        flex:1,minWidth:0,
                                                                        padding:'9px 8px',borderRadius:10,
                                                                        border:`2px solid ${active?st.border:'var(--card-border)'}`,
                                                                        background: active ? st.bg : 'var(--input-bg)',
                                                                        color: active ? st.color : 'var(--text-muted)',
                                                                        display:'flex',alignItems:'center',
                                                                        justifyContent:'center',gap:7,
                                                                        cursor:'pointer',transition:'all 0.14s',
                                                                        fontWeight: active ? 700 : 500,
                                                                        fontSize:'0.82rem',whiteSpace:'nowrap',
                                                                        boxShadow: active ? `0 0 0 3px ${st.border}22` : 'none',
                                                                    }}
                                                                    onMouseEnter={e=>{ if(!active){
                                                                        e.currentTarget.style.borderColor=st.border;
                                                                        e.currentTarget.style.background=st.bg+'55';
                                                                        e.currentTarget.style.color=st.color;
                                                                    }}}
                                                                    onMouseLeave={e=>{ if(!active){
                                                                        e.currentTarget.style.borderColor='var(--card-border)';
                                                                        e.currentTarget.style.background='var(--input-bg)';
                                                                        e.currentTarget.style.color='var(--text-muted)';
                                                                    }}}>
                                                                    <Icon size={15}/>{STATUS_LABELS[v]}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    {/* Attendance comment input — always visible */}
                                                    <input
                                                        type="text"
                                                        value={curAttCmt}
                                                        onChange={e=>setPendingField(s.id,todayStr,schId,{att_comment:e.target.value})}
                                                        placeholder="Izoh (ixtiyoriy)..."
                                                        style={{
                                                            marginTop:8,width:'100%',padding:'7px 10px',
                                                            border:'1.5px solid var(--input-border)',borderRadius:8,
                                                            background:'var(--input-bg)',color:'var(--input-text)',
                                                            fontSize:'0.78rem',outline:'none',boxSizing:'border-box',
                                                            transition:'border-color 0.14s',
                                                        }}
                                                        onFocus={e=>e.target.style.borderColor='var(--accent)'}
                                                        onBlur={e=>e.target.style.borderColor='var(--input-border)'}
                                                    />
                                                </td>

                                                {/* Score + grade comment — merged only */}
                                                {merged && (
                                                    <td style={{padding:'10px 14px',verticalAlign:'top'}}>
                                                        {/* Score input + % badge */}
                                                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                                                            <input
                                                                type="number" min={0} max={100}
                                                                value={curScore}
                                                                disabled={isAbsent}
                                                                onChange={e=>setPendingField(s.id,todayStr,schId,{score:e.target.value})}
                                                                placeholder={isAbsent ? '—' : '0–100'}
                                                                style={{
                                                                    flex:1,padding:'9px 10px',textAlign:'center',
                                                                    border:`2px solid ${
                                                                        isAbsent ? 'var(--card-border)'
                                                                        : scoreNum!=null ? scoreColor(scoreNum)
                                                                        : 'var(--input-border)'}`,
                                                                    borderRadius:10,
                                                                    background: isAbsent ? 'var(--input-bg)' : scoreNum!=null ? scoreBg(scoreNum) : 'var(--input-bg)',
                                                                    color: isAbsent ? 'var(--text-muted)' : scoreNum!=null ? scoreColor(scoreNum) : 'var(--input-text)',
                                                                    fontSize:'0.95rem',fontWeight:700,outline:'none',
                                                                    cursor: isAbsent ? 'not-allowed' : 'text',
                                                                    opacity: isAbsent ? 0.45 : 1,
                                                                    transition:'all 0.14s',
                                                                }}
                                                            />
                                                            {!isAbsent && scoreNum!=null && (
                                                                <span style={{fontSize:'0.78rem',fontWeight:700,
                                                                    color:scoreColor(scoreNum),whiteSpace:'nowrap',
                                                                    padding:'5px 9px',borderRadius:8,
                                                                    background:scoreBg(scoreNum),
                                                                    border:`1.5px solid ${scoreColor(scoreNum)}`}}>
                                                                    {scoreNum}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Grade comment input */}
                                                        {!isAbsent && (
                                                            <input
                                                                type="text"
                                                                value={curGradeCmt}
                                                                onChange={e=>setPendingField(s.id,todayStr,schId,{grade_comment:e.target.value})}
                                                                placeholder="Baho izohi..."
                                                                style={{
                                                                    marginTop:8,width:'100%',padding:'7px 10px',
                                                                    border:'1.5px solid var(--input-border)',borderRadius:8,
                                                                    background:'var(--input-bg)',color:'var(--input-text)',
                                                                    fontSize:'0.78rem',outline:'none',boxSizing:'border-box',
                                                                    transition:'border-color 0.14s',
                                                                }}
                                                                onFocus={e=>e.target.style.borderColor='var(--accent)'}
                                                                onBlur={e=>e.target.style.borderColor='var(--input-border)'}
                                                            />
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function AttendanceTab({
    groupId:groupIdProp, students=[], merged:mergedProp=false,
    groupSubjects=[], teacherSubjectId=null, scheduleRecords:scheduleRecordsProp=[],
}) {
    const params    = useParams();
    const groupId   = groupIdProp || params.id;
    const role      = useSelector(s=>s.auth?.role);
    const isTeacher = role === 'teacher';
    const merged    = mergedProp;

    const now = new Date();
    const [selYear,  setSelYear]  = useState(now.getFullYear());
    const [selMonth, setSelMonth] = useState(now.getMonth()+1);
    const { from:dateFrom, to:dateTo } = monthRange(selYear, selMonth);

    const [selSubjectId,  setSelSubjectId]  = useState('');
    const [selScheduleId, setSelScheduleId] = useState('');
    const activeSubjectId  = isTeacher ? teacherSubjectId : (selSubjectId||null);
    const activeScheduleId = selScheduleId||null;

    const [fetchAtt,   {data:attData,    isLoading:attLoading,   isFetching:attFetching,   error:attError}] = useLazyGetAttendanceQuery();
    const [fetchGrades,{data:gradesData, isLoading:gradesLoading,isFetching:gradesFetching}]                = useLazyGetGradesQuery();
    const [bulkAtt]   = useBulkAttendanceMutation();
    const [bulkGrade] = useBulkGradeMutation();

    const load = useCallback(()=>{
        if (!groupId) return;
        fetchAtt({group_id:groupId, date_from:dateFrom, date_to:dateTo, page:1, limit:100,
            ...(activeSubjectId  && {subject_id:activeSubjectId}),
            ...(activeScheduleId && {group_schedule_id:activeScheduleId}),
        });
        if (merged) fetchGrades({group_id:groupId, date_from:dateFrom, date_to:dateTo, page:1, limit:100,
            ...(activeSubjectId  && {subject_id:activeSubjectId}),
            ...(activeScheduleId && {group_schedule_id:activeScheduleId}),
        });
    },[groupId,dateFrom,dateTo,merged,activeSubjectId,activeScheduleId]);

    useEffect(()=>{ load(); },[load]);

    const [attLocal,    setAttLocal]    = useState(null);
    const [gradesLocal, setGradesLocal] = useState(null);
    useEffect(()=>{ if(attData)    setAttLocal(attData);    },[attData]);
    useEffect(()=>{ if(gradesData) setGradesLocal(gradesData); },[gradesData]);

    const todayStr = fmtLocal(new Date());

    const allDates = useMemo(()=>{
        const dates=[]; let cur=parseLocal(dateFrom); const end=parseLocal(dateTo);
        while(cur<=end){ dates.push(fmtLocal(cur)); cur.setDate(cur.getDate()+1); }
        const idx=dates.indexOf(todayStr);
        if (idx<=0) return dates;
        return [...dates.slice(0,idx).reverse(), ...dates.slice(idx)];
    },[dateFrom,dateTo,todayStr]);

    const attRecords    = attLocal?.data?.records    || [];
    const gradesRecords = gradesLocal?.data?.records || [];

    const attMap = useMemo(()=>{
        const m={};
        attRecords.forEach(s=>{ m[s.student_id]={};
            s.dates?.forEach(de=>{ m[s.student_id][de.date]={};
                (de.subjects||[]).forEach(sb=>{ m[s.student_id][de.date][sb.group_schedule_id]={attendance_id:sb.attendance_id,status:sb.status,comment:sb.comment}; });
            });
        });
        return m;
    },[attRecords]);

    const gradesMap = useMemo(()=>{
        const m={};
        gradesRecords.forEach(s=>{ m[s.student_id]={};
            s.dates?.forEach(de=>{ m[s.student_id][de.date]={};
                (de.subjects||[]).forEach(sb=>{ m[s.student_id][de.date][sb.group_schedule_id]={grade_id:sb.grade_id,score:sb.score,comment:sb.comment}; });
            });
        });
        return m;
    },[gradesRecords]);

    const dateSubjectsTemplate = useMemo(()=>{
        const m={};
        attRecords.forEach(s=>{ s.dates?.forEach(de=>{ if(!m[de.date]) m[de.date]=(de.subjects||[]).map(sb=>({
            group_schedule_id:sb.group_schedule_id, subject_name:sb.subject_name,
            lesson_number:sb.lesson_number, start_time:sb.start_time, end_time:sb.end_time, subject_id:sb.subject_id,
        })); }); });
        return m;
    },[attRecords]);

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
    },[dateSubjectsTemplate, scheduleRecordsProp]);

    const subjectHasMultiSameDay = useMemo(()=>{
        const result={};
        const bySubDay={};
        scheduleRecordsProp.forEach(s=>{
            if(!s.subject_id||!s.day_of_week) return;
            const key=`${s.subject_id}__${s.day_of_week}`;
            bySubDay[key]=(bySubDay[key]||0)+1;
        });
        Object.entries(bySubDay).forEach(([key,cnt])=>{
            if(cnt>=2){ const sid=key.split('__')[0]; result[sid]=true; }
        });
        Object.values(dateSubjectsTemplate).forEach(subs=>{
            const countBySub={};
            subs.forEach(sb=>{ if(!sb.subject_id) return; countBySub[sb.subject_id]=(countBySub[sb.subject_id]||0)+1; });
            Object.entries(countBySub).forEach(([sid,cnt])=>{ if(cnt>=2) result[sid]=true; });
        });
        return result;
    },[scheduleRecordsProp,dateSubjectsTemplate]);

    const filteredSubjectSchedules = useMemo(()=>subjectSchedules,[subjectSchedules,subjectHasMultiSameDay,scheduleRecordsProp,dateSubjectsTemplate]);

    /* Teacher uchun faqat bugungi kun; admin uchun barcha ko'rinadigan kunlar o'suvchi tartibda */
    const visibleDates = useMemo(()=>{
        if (isTeacher) {
            return allDates.filter(d => d === todayStr && dateSubjectsTemplate[d]?.length > 0);
        }
        /* Admin: faqat dars bor kunlar, o'suvchi tartib (1,2,3...31) */
        return Object.keys(dateSubjectsTemplate)
            .filter(d => dateSubjectsTemplate[d]?.length > 0)
            .sort();
    },[allDates,dateSubjectsTemplate,isTeacher,todayStr]);

    const historyStudents = useMemo(()=>attRecords.map(r=>({id:r.student_id,full_name:r.full_name})),[attRecords]);

    /* Pending */
    const [pending, setPending] = useState({});
    const pKey = (sid,date,schId)=>`${sid}|${date}|${schId}`;

    const getPending      = (sid,date,schId)=>pending[pKey(sid,date,schId)]||{};
    const getStatus       = (sid,date,schId)=>{ const p=getPending(sid,date,schId); return p.status!==undefined?p.status:attMap[sid]?.[date]?.[schId]?.status||null; };
    const getScore        = (sid,date,schId)=>{ const p=getPending(sid,date,schId); if(p.score!==undefined) return p.score; const sc=gradesMap[sid]?.[date]?.[schId]?.score; return sc!=null?String(sc):''; };
    const getAttComment   = (sid,date,schId)=>{ const p=getPending(sid,date,schId); return p.att_comment!==undefined?p.att_comment:(attMap[sid]?.[date]?.[schId]?.comment||''); };
    const getGradeComment = (sid,date,schId)=>{ const p=getPending(sid,date,schId); return p.grade_comment!==undefined?p.grade_comment:(gradesMap[sid]?.[date]?.[schId]?.comment||''); };
    const setPendingField = (sid,date,schId,fields)=>{
        const k=pKey(sid,date,schId);
        setPending(prev=>({...prev,[k]:{...prev[k],...fields}}));
    };

    /* Info modal */
    const [infoEntry, setInfoEntry] = useState(null);
    const openInfo = (sid,full_name,date,sb)=>{
        const schId=sb.group_schedule_id;
        setInfoEntry({
            sid, studentName:full_name, date, schId,
            subjectName:sb.subject_name, lessonNumber:sb.lesson_number,
            status:getStatus(sid,date,schId)||(attMap[sid]?.[date]?.[schId]?.status)||'',
            att_comment:(getPending(sid,date,schId).att_comment)??(attMap[sid]?.[date]?.[schId]?.comment||''),
            score:getScore(sid,date,schId),
            grade_comment:(getPending(sid,date,schId).grade_comment)??(gradesMap[sid]?.[date]?.[schId]?.comment||''),
        });
    };

    const handleInfoSave = async ({status,att_comment,score,grade_comment})=>{
        if (!infoEntry) return;
        const {sid,date,schId}=infoEntry;
        setPendingField(sid,date,schId,{status,att_comment,score,grade_comment});
    };

    /* Bulk save */
    const [saving, setSaving] = useState(false);
    const saveAll = async ()=>{
        const entries=Object.entries(pending);
        if (!entries.length) return Alert("O'zgarish yo'q",'info');
        setSaving(true); let ok=0, fail=0;
        const attGroups={}, gradeGroups={};
        entries.forEach(([k,v])=>{
            const [sid,date,schId]=k.split('|');
            if (v.status!==undefined||v.att_comment!==undefined) {
                const gk=`${date}|${schId}`;
                if (!attGroups[gk]) attGroups[gk]={date,schId,records:[]};
                attGroups[gk].records.push({student_id:sid,status:v.status||null,...(v.att_comment&&{comment:v.att_comment})});
            }
            if (merged && (v.score!==undefined||v.grade_comment!==undefined) && v.score!=='') {
                const n=Number(v.score);
                if (!isNaN(n)&&n>=0&&n<=100) {
                    const gk=`${date}|${schId}`;
                    if (!gradeGroups[gk]) gradeGroups[gk]={date,schId,records:[]};
                    gradeGroups[gk].records.push({student_id:sid,score:n,...(v.grade_comment&&{comment:v.grade_comment})});
                }
            }
        });
        for (const {date,schId,records} of Object.values(attGroups)) {
            try { await bulkAtt({group_schedule_id:schId,date,records}).unwrap(); ok+=records.length; }
            catch(e){ console.error('att bulk',e?.data?.message||e); fail+=records.length; }
        }
        for (const {date,schId,records} of Object.values(gradeGroups)) {
            try { await bulkGrade({group_schedule_id:schId,date,records}).unwrap(); ok+=records.length; }
            catch(e){ console.error('grade bulk',e?.data?.message||e); fail+=records.length; }
        }
        setPending({}); setSaving(false);
        if (fail>0) Alert(`${ok} ta saqlandi, ${fail} ta xato`,'warning');
        else Alert(`${ok} ta o'zgarish saqlandi`,'success');
        load();
    };

    const hasPending   = Object.keys(pending).length > 0;
    const isLoading    = attLoading || (merged && gradesLoading);
    const isFetching   = attFetching || (merged && gradesFetching);
    const tableWrapRef = useRef(null);

    /* Admin: jadval bugungiga scroll */
    useEffect(()=>{
        if (isTeacher) return;
        if (!tableWrapRef.current||!allDates.length) return;
        const idx=allDates.indexOf(todayStr); if(idx<=0) return;
        tableWrapRef.current.scrollLeft=150+idx*90-10;
    },[allDates.length,todayStr,isTeacher]);

    const yearOptions=[]; for(let y=now.getFullYear()-3;y<=now.getFullYear()+1;y++) yearOptions.push(y);

    if (isLoading && !isFetching) return <Loading/>;
    if (attError) return <div style={{color:'var(--danger)',padding:12,background:'var(--danger-soft)',borderRadius:10}}>Xatolik: {attError?.data?.message}</div>;

    /* ── Teacher render ── */
    if (isTeacher) {
        const todaySubs = dateSubjectsTemplate[todayStr] || [];

        /* Bugun dars yo'q */
        if (!attLoading && !isFetching && todaySubs.length === 0) {
            return (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px',gap:16,textAlign:'center'}}>
                    <div style={{width:64,height:64,borderRadius:16,background:'var(--input-bg)',border:'1.5px solid var(--card-border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <CalendarOff size={30} style={{color:'var(--text-muted)',opacity:0.5}}/>
                    </div>
                    <div>
                        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>Bugun dars yo'q</div>
                        <div style={{fontSize:'0.82rem',color:'var(--text-muted)'}}>
                            {fmtLocal(new Date())} kuni uchun jadvalda dars topilmadi
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <>
                <TeacherTodayLayout
                    todaySubs={todaySubs}
                    historyStudents={historyStudents}
                    getStatus={getStatus}
                    getScore={getScore}
                    getAttComment={getAttComment}
                    getGradeComment={getGradeComment}
                    setPendingField={setPendingField}
                    pending={pending}
                    pKey={pKey}
                    merged={merged}
                    saving={saving}
                    saveAll={saveAll}
                    hasPending={hasPending}
                    isFetching={isFetching}
                />
                <InfoModal
                    open={!!infoEntry}
                    onClose={()=>setInfoEntry(null)}
                    entry={infoEntry}
                    merged={merged}
                    onSave={handleInfoSave}
                />
            </>
        );
    }

    /* ── Admin / non-teacher render (jadval ko'rinishi) ── */
    return (
        <div style={{display:'flex',flexDirection:'column',gap:14,position:'relative'}}>
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

                {groupSubjects.length>0 && (
                    <select className="search-select" value={selSubjectId}
                        onChange={e=>{ setSelSubjectId(e.target.value); setSelScheduleId(''); setPending({}); }}
                        style={{minWidth:130}}>
                        <option value="">Barcha fanlar</option>
                        {groupSubjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                )}

                {activeSubjectId && subjectHasMultiSameDay[activeSubjectId] && (filteredSubjectSchedules[activeSubjectId]||[]).length>1 && (
                    <select className="search-select" value={selScheduleId}
                        onChange={e=>{ setSelScheduleId(e.target.value); setPending({}); }}
                        style={{minWidth:150}}>
                        <option value="">Barcha darslar</option>
                        {(filteredSubjectSchedules[activeSubjectId]||[]).map(sc=>(
                            <option key={sc.id} value={sc.id}>{sc.label}</option>
                        ))}
                    </select>
                )}

                {hasPending && (
                    <button onClick={saveAll} disabled={saving}
                        style={{display:'flex',alignItems:'center',gap:6,marginLeft:'auto',padding:'8px 16px',borderRadius:9,border:'none',background:'var(--accent)',color:'#fff',fontSize:'0.82rem',fontWeight:600,cursor:saving?'not-allowed':'pointer',opacity:saving?0.7:1}}>
                        <Save size={14}/>{saving?'Saqlanmoqda...':`Saqlash (${Object.keys(pending).length})`}
                    </button>
                )}
            </div>

            {/* Table */}
            {historyStudents.length===0 ? (
                <div style={{textAlign:'center',padding:'40px 0',color:'var(--text-muted)'}}>
                    <BookOpen size={40} style={{opacity:.2,margin:'0 auto 10px'}}/><p>Fan tanlang yoki o'quvchilar topilmadi</p>
                </div>
            ) : (
                <div ref={tableWrapRef} style={{overflowX:'auto',borderRadius:12,border:'1px solid var(--card-border)',background:'var(--card-bg)'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.82rem'}}>
                        <thead>
                            <tr style={{background:'var(--accent-soft)'}}>
                                <th style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'var(--accent)',fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.06em',whiteSpace:'nowrap',position:'sticky',left:0,background:'var(--accent-soft)',zIndex:2}}>O'quvchi</th>
                                {visibleDates.map(d=>{
                                    const isToday=d===todayStr, isSun=dayNameOf(d)==='sunday';
                                    return (
                                        <th key={d} style={{padding:'10px 6px',textAlign:'center',fontWeight:700,
                                            color:isToday?'#fff':isSun?'var(--danger)':'var(--accent)',
                                            fontSize:'0.7rem',whiteSpace:'nowrap',minWidth:merged?110:82,
                                            background:isToday?'var(--accent)':'var(--accent-soft)',
                                            borderLeft:'1px solid var(--card-border)'}}>
                                            {parseLocal(d).toLocaleDateString('uz-UZ',{day:'2-digit',month:'2-digit'})}
                                            {isToday
                                                ? <span style={{fontSize:'0.58rem',display:'block',opacity:0.85}}>Bugun</span>
                                                : <div style={{fontSize:'0.62rem',fontWeight:400,color:isSun?'var(--danger)':'var(--text-muted)'}}>{DAY_SHORT[dayNameOf(d)]}</div>}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {historyStudents.map(s=>(
                                <tr key={s.id} style={{borderTop:'1px solid var(--card-border)'}}>
                                    <td style={{padding:'8px 14px',fontWeight:600,color:'var(--text-primary)',position:'sticky',left:0,background:'var(--card-bg)',zIndex:1,whiteSpace:'nowrap'}}>
                                        <Link to={`/student/${s.id}`} style={{color:'inherit',textDecoration:'none'}}
                                            onMouseEnter={e=>e.target.style.color='var(--accent)'}
                                            onMouseLeave={e=>e.target.style.color='inherit'}>{s.full_name}</Link>
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
                                                        const curStatus=getStatus(s.id,d,schId);
                                                        const hasChg=pending[pKey(s.id,d,schId)]!==undefined;
                                                        const curScore=getScore(s.id,d,schId);
                                                        const scoreNum=curScore!==''?Number(curScore):null;
                                                        const hasSt=!!STATUS_STYLE[curStatus];
                                                        const compact=merged;
                                                        return (
                                                            <div key={schId} className="group-profile-subject-card" style={{
                                                                display:'flex',flexDirection:'column',gap:3,
                                                                padding:'4px 5px',borderRadius:7,
                                                                background:hasChg?'var(--warning-soft)':hasSt?STATUS_STYLE[curStatus].bg+'40':'transparent',
                                                                border:`1px solid ${hasChg?'var(--warning)':hasSt?STATUS_STYLE[curStatus].border:'var(--card-border)'}`,
                                                                minWidth:compact?100:75,
                                                            }}>
                                                                <div className="group-profile-subject-name" style={{fontSize:'0.68rem',fontWeight:600,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                                                                    {sb.subject_name}{multi?` #${sb.lesson_number}`:''}
                                                                </div>
                                                                <div className="group-profile-attendance-actions" style={{display:'flex',alignItems:'center',gap:5}}>
                                                                    {['present','absent','late'].map(v=>(
                                                                        <StatusBtn key={v} value={v} current={curStatus} compact={compact}
                                                                            onClick={()=>setPendingField(s.id,d,schId,{status:curStatus===v?null:v})}/>
                                                                    ))}
                                                                    <button onClick={()=>openInfo(s.id,s.full_name,d,sb)}
                                                                        title="Izoh / Baho"
                                                                        style={{width:compact?20:22,height:compact?20:22,borderRadius:5,border:'1px solid var(--card-border)',
                                                                            background:'var(--input-bg)',color:'var(--text-muted)',
                                                                            display:'flex',alignItems:'center',justifyContent:'center',
                                                                            cursor:'pointer',padding:0,flexShrink:0,
                                                                        }}
                                                                        onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-soft)';e.currentTarget.style.color='var(--accent)';}}
                                                                        onMouseLeave={e=>{e.currentTarget.style.background='var(--input-bg)';e.currentTarget.style.color='var(--text-muted)';}}>
                                                                        <Info size={compact?10:11}/>
                                                                    </button>
                                                                </div>
                                                                {merged && (
                                                                    <input type="number" min={0} max={100} value={curScore}
                                                                        onChange={e=>setPendingField(s.id,d,schId,{score:e.target.value})}
                                                                        placeholder="%"
                                                                        style={{width:'100%',padding:'2px 4px',
                                                                            border:`1px solid ${scoreNum!=null?scoreColor(scoreNum):'var(--input-border)'}`,
                                                                            borderRadius:4,background:scoreNum!=null?scoreBg(scoreNum):'var(--input-bg)',
                                                                            color:scoreNum!=null?scoreColor(scoreNum):'var(--input-text)',
                                                                            fontSize:'0.68rem',outline:'none',textAlign:'center'}}
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

            <InfoModal
                open={!!infoEntry}
                onClose={()=>setInfoEntry(null)}
                entry={infoEntry}
                merged={merged}
                onSave={handleInfoSave}
            />
        </div>
    );
}
