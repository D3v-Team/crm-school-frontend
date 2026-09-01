import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLazyGetWeeklyTopicsQuery } from '../../../../../store/services/weekly-topic.api';
import { ListChecks, RefreshCw, Calendar } from 'lucide-react';
import Loading from '../../../../Other/UI/Loadings/Loading';

const DAYS_UZ = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '—';

export default function TopicsTab({ user }) {
    const { id: teacherId } = useParams();
    const [fetchTopics, { data, isLoading, error }] = useLazyGetWeeklyTopicsQuery();

    const now = new Date();
    const mondayOfWeek = (d) => {
        const day = d.getDay() || 7;
        const m = new Date(d);
        m.setDate(d.getDate() - day + 1);
        return m.toISOString().split('T')[0];
    };
    const [weekStart, setWeekStart] = useState(mondayOfWeek(now));

    useEffect(() => {
        if (teacherId) {
            fetchTopics({ teacher_id: teacherId, week_start_date: weekStart });
        }
    }, [teacherId, weekStart]);

    const records = data?.data?.records || [];
    // Also show topics from user prop as fallback
    const userTopics = user?.weekly_topics || [];
    const topics = records.length > 0 ? records : userTopics;

    const prevWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        setWeekStart(d.toISOString().split('T')[0]);
    };
    const nextWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        setWeekStart(d.toISOString().split('T')[0]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:30,height:30,borderRadius:8,background:'var(--accent-soft)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                        <ListChecks size={15} style={{ color:'var(--accent)' }}/>
                    </div>
                    <span style={{ fontSize:'0.875rem',fontWeight:600,color:'var(--text-primary)' }}>Haftalik mavzular</span>
                    {topics.length > 0 && <span style={{ fontSize:'0.72rem',background:'var(--accent-soft)',color:'var(--accent)',padding:'1px 8px',borderRadius:99,fontWeight:600 }}>{topics.length}</span>}
                </div>
                {/* Week navigation */}
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button onClick={prevWeek} style={{ width:30,height:30,borderRadius:8,border:'1.5px solid var(--card-border)',background:'var(--input-bg)',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.82rem',fontWeight:700 }}>‹</button>
                    <div style={{ display:'flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:8,border:'1px solid var(--card-border)',background:'var(--input-bg)' }}>
                        <Calendar size={13} style={{ color:'var(--accent)' }}/>
                        <span style={{ fontSize:'0.78rem',color:'var(--text-primary)',fontWeight:500 }}>{weekStart}</span>
                    </div>
                    <button onClick={nextWeek} style={{ width:30,height:30,borderRadius:8,border:'1.5px solid var(--card-border)',background:'var(--input-bg)',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.82rem',fontWeight:700 }}>›</button>
                    <button onClick={()=>fetchTopics({ teacher_id:teacherId, week_start_date:weekStart })}
                        style={{ width:30,height:30,borderRadius:8,border:'1.5px solid var(--card-border)',background:'var(--input-bg)',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                        <RefreshCw size={13}/>
                    </button>
                </div>
            </div>

            {isLoading ? <Loading/> : error ? (
                <div style={{ color:'var(--danger)',padding:12,background:'var(--danger-soft)',borderRadius:10 }}>Xatolik: {error?.data?.message}</div>
            ) : topics.length === 0 ? (
                <div style={{ textAlign:'center',padding:'40px 0',color:'var(--text-muted)' }}>
                    <ListChecks size={40} style={{ opacity:.2,margin:'0 auto 10px' }}/>
                    <p style={{ fontSize:'0.875rem' }}>Bu hafta uchun mavzular yo'q</p>
                </div>
            ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {topics.map((t, i) => {
                        const sch     = t.group_schedule || {};
                        const group   = sch.group   || t.group   || {};
                        const subject = sch.subject  || t.subject || {};
                        const teacher = sch.teacher  || t.teacher || {};
                        const dayFull = {
                            monday:'Dushanba', tuesday:'Seshanba', wednesday:'Chorshanba',
                            thursday:'Payshanba', friday:'Juma', saturday:'Shanba', sunday:'Yakshanba'
                        }[sch.day_of_week] || sch.day_of_week || '';
                        const fmtTime = (s) => s ? s.slice(0,5) : '';

                        return (
                            <div key={t.id||i} style={{
                                background:'var(--card-bg)', border:'1px solid var(--card-border)',
                                borderRadius:12, overflow:'hidden',
                                transition:'border-color 0.15s, box-shadow 0.15s',
                            }}
                                onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.boxShadow='0 0 0 3px var(--accent-glow)'; }}
                                onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--card-border)'; e.currentTarget.style.boxShadow='none'; }}>

                                {/* Topic text */}
                                <div style={{ padding:'12px 16px', background:'var(--accent-soft)', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'flex-start', gap:10 }}>
                                    <div style={{ width:32,height:32,borderRadius:8,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                                        <ListChecks size={15} style={{ color:'#fff' }}/>
                                    </div>
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{ fontSize:'0.92rem', fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>
                                            {t.topic || '—'}
                                        </div>
                                        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                                            {subject.name && (
                                                <span style={{ fontSize:'0.68rem', fontWeight:600, padding:'2px 8px', borderRadius:6, background:'var(--success-soft)', color:'var(--success)' }}>
                                                    {subject.name}
                                                </span>
                                            )}
                                            {group.name && (
                                                <span style={{ fontSize:'0.68rem', fontWeight:600, padding:'2px 8px', borderRadius:6, background:'var(--accent-soft)', color:'var(--accent)' }}>
                                                    {group.name}
                                                </span>
                                            )}
                                            {dayFull && (
                                                <span style={{ fontSize:'0.68rem', color:'var(--text-muted)', padding:'2px 8px', borderRadius:6, background:'var(--input-bg)', border:'1px solid var(--card-border)' }}>
                                                    {dayFull}
                                                    {sch.start_time && ` · ${fmtTime(sch.start_time)}–${fmtTime(sch.end_time)}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div style={{ padding:'8px 16px', display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
                                    {teacher.full_name && (
                                        <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>
                                            👤 {teacher.full_name}
                                        </span>
                                    )}
                                    {t.week_start_date && (
                                        <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>
                                            📅 {fmtDate(t.week_start_date)} haftasi
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
