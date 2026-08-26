import { useState, useEffect, useMemo } from 'react';
import { useLazyGetGradesQuery } from '../../../store/services/grades.api';
import { useLazyGetAttendanceQuery } from '../../../store/services/attedance.api';
import Loading from '../../Other/UI/Loadings/Loading';
import { ClipboardList, Award, CheckCircle2, XCircle, Timer, RefreshCw, User } from 'lucide-react';

const fmtLocal = (d) => {
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
};

const gradeColor = (s) => s==null?'var(--text-muted)':s>=80?'var(--success)':s>=60?'var(--warning)':'var(--danger)';
const gradeBg    = (s) => s==null?'var(--input-bg)':s>=80?'var(--success-soft)':s>=60?'var(--warning-soft)':'var(--danger-soft)';

const ATT_MAP = {
    present: { label:'Keldi',    color:'var(--success)', bg:'var(--success-soft)', icon:CheckCircle2 },
    absent:  { label:'Kelmadi',  color:'var(--danger)',  bg:'var(--danger-soft)',  icon:XCircle      },
    late:    { label:'Kechikdi', color:'var(--warning)', bg:'var(--warning-soft)', icon:Timer        },
};

/* ── Child grades card ── */
function ChildCard({ child, dateFrom, dateTo }) {
    const [fetchGrades,   { data: gData,  isLoading: gLoad  }] = useLazyGetGradesQuery();
    const [fetchAtt,      { data: aData,  isLoading: aLoad  }] = useLazyGetAttendanceQuery();

    useEffect(() => {
        if (child.id) {
            fetchGrades({ student_id: child.id, date_from: dateFrom, date_to: dateTo, page:1, limit:200 });
            fetchAtt({ student_id: child.id, date_from: dateFrom, date_to: dateTo, page:1 });
        }
    }, [child.id, dateFrom, dateTo]);

    const gradeRows = useMemo(() => {
        const map = {};
        const recs = gData?.data?.records || [];
        const mine = recs.find(r => r.student_id === child.id);
        mine?.dates?.forEach(de => {
            de.subjects?.forEach(s => {
                const k = `${de.date}__${s.group_schedule_id}`;
                map[k] = { date: de.date, subject: s.subject_name, score: s.score, teacher: s.teacher_name };
            });
        });
        return Object.values(map).sort((a,b) => b.date.localeCompare(a.date));
    }, [gData, child.id]);

    const attRows = useMemo(() => {
        const arr = [];
        const recs = aData?.data?.records || [];
        const mine = recs.find(r => r.student_id === child.id);
        mine?.dates?.forEach(de => {
            de.subjects?.forEach(s => {
                arr.push({ date: de.date, subject: s.subject_name, status: s.status });
            });
        });
        return arr.sort((a,b) => b.date.localeCompare(a.date));
    }, [aData, child.id]);

    // Stats
    const present  = attRows.filter(r=>r.status==='present').length;
    const absent   = attRows.filter(r=>r.status==='absent').length;
    const late     = attRows.filter(r=>r.status==='late').length;
    const marked   = present+absent+late;
    const attPct   = marked>0 ? Math.round(present/marked*100) : null;
    const graded   = gradeRows.filter(r=>r.score!=null);
    const avgGrade = graded.length ? (graded.reduce((s,r)=>s+Number(r.score),0)/graded.length).toFixed(1) : null;

    const [activeTab, setActiveTab] = useState('grades');

    return (
        <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, overflow:'hidden' }}>
            {/* Header */}
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:'var(--accent-soft)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',fontWeight:700,flexShrink:0 }}>
                    {(child.full_name||'?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                    <div style={{ fontSize:'0.95rem',fontWeight:700,color:'var(--text-primary)' }}>{child.full_name}</div>
                    <div style={{ fontSize:'0.78rem',color:'var(--text-muted)',marginTop:2 }}>{child.group?.name||child.group_name||'Guruh belgilanmagan'}</div>
                </div>
                {/* Mini stats */}
                <div style={{ display:'flex', gap:10 }}>
                    {avgGrade!=null && (
                        <div style={{ textAlign:'center' }}>
                            <div style={{ fontSize:'1.1rem',fontWeight:800,color:gradeColor(+avgGrade) }}>{avgGrade}%</div>
                            <div style={{ fontSize:'0.65rem',color:'var(--text-muted)' }}>O'rt. baho</div>
                        </div>
                    )}
                    {attPct!=null && (
                        <div style={{ textAlign:'center' }}>
                            <div style={{ fontSize:'1.1rem',fontWeight:800,color:attPct>=80?'var(--success)':attPct>=50?'var(--warning)':'var(--danger)' }}>{attPct}%</div>
                            <div style={{ fontSize:'0.65rem',color:'var(--text-muted)' }}>Davomat</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--card-border)' }}>
                {[{key:'grades',label:'Baholar',icon:Award},{key:'att',label:'Davomat',icon:ClipboardList}].map(t=>(
                    <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
                        flex:1, padding:'10px 0', border:'none', cursor:'pointer',
                        borderBottom: activeTab===t.key ? '2px solid var(--accent)' : '2px solid transparent',
                        background: activeTab===t.key ? 'var(--accent-soft)' : 'transparent',
                        color: activeTab===t.key ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize:'0.82rem', fontWeight: activeTab===t.key ? 600 : 400,
                        display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                    }}>
                        <t.icon size={14}/>{t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ padding:'16px 20px', maxHeight:300, overflowY:'auto' }}>
                {(gLoad||aLoad) ? <Loading/> : activeTab==='grades' ? (
                    gradeRows.length===0 ? (
                        <div style={{ textAlign:'center',padding:'24px 0',color:'var(--text-muted)',fontSize:'0.82rem' }}>Baholar yo'q</div>
                    ) : (
                        <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                            {gradeRows.slice(0,20).map((r,i)=>(
                                <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:9,background:'var(--input-bg)' }}>
                                    <div>
                                        <div style={{ fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)' }}>{r.subject}</div>
                                        <div style={{ fontSize:'0.68rem',color:'var(--text-muted)' }}>{r.date} {r.teacher?`· ${r.teacher}`:''}</div>
                                    </div>
                                    {r.score!=null ? (
                                        <span style={{ fontSize:'0.82rem',fontWeight:700,padding:'3px 10px',borderRadius:99,background:gradeBg(r.score),color:gradeColor(r.score) }}>
                                            {r.score}%
                                        </span>
                                    ) : <span style={{ fontSize:'0.72rem',color:'var(--text-muted)' }}>—</span>}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    attRows.length===0 ? (
                        <div style={{ textAlign:'center',padding:'24px 0',color:'var(--text-muted)',fontSize:'0.82rem' }}>Davomat yo'q</div>
                    ) : (
                        <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                            {attRows.slice(0,20).map((r,i)=>{
                                const att = ATT_MAP[r.status];
                                return (
                                    <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:9,background:'var(--input-bg)' }}>
                                        <div>
                                            <div style={{ fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)' }}>{r.subject}</div>
                                            <div style={{ fontSize:'0.68rem',color:'var(--text-muted)' }}>{r.date}</div>
                                        </div>
                                        {att ? (
                                            <span style={{ fontSize:'0.72rem',fontWeight:600,padding:'3px 10px',borderRadius:99,background:att.bg,color:att.color,display:'flex',alignItems:'center',gap:4 }}>
                                                <att.icon size={11}/>{att.label}
                                            </span>
                                        ) : <span style={{ color:'var(--text-muted)',fontSize:'0.72rem' }}>—</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

/* ── Main Dashboard ── */
export default function ParentDashboard({ students = [] }) {
    const now = new Date();
    const [dateFrom, setDateFrom] = useState(fmtLocal(new Date(now.getFullYear(), now.getMonth(), 1)));
    const [dateTo,   setDateTo]   = useState(fmtLocal(now));
    const [applied,  setApplied]  = useState({ from: dateFrom, to: dateTo });

    const apply = () => setApplied({ from: dateFrom, to: dateTo });

    if (students.length === 0) return (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-muted)' }}>
            <User size={48} style={{ opacity:.2, margin:'0 auto 12px' }}/>
            <p style={{ fontSize:'0.95rem' }}>Farzandlar biriktirilmagan</p>
        </div>
    );

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Date filter */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end', padding:'14px 18px', background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:12 }}>
                <div>
                    <label style={{ fontSize:'0.72rem',color:'var(--text-muted)',display:'block',marginBottom:4 }}>Dan</label>
                    <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="search-input" style={{ paddingLeft:14,width:155 }}/>
                </div>
                <div>
                    <label style={{ fontSize:'0.72rem',color:'var(--text-muted)',display:'block',marginBottom:4 }}>Gacha</label>
                    <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="search-input" style={{ paddingLeft:14,width:155 }}/>
                </div>
                <button className="search-btn" onClick={apply} style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <RefreshCw size={13}/> Ko'rish
                </button>
            </div>

            {/* Children grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px,1fr))', gap:16 }}>
                {students.map(child => (
                    <ChildCard key={child.id} child={child} dateFrom={applied.from} dateTo={applied.to}/>
                ))}
            </div>
        </div>
    );
}
