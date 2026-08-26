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
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))',gap:10 }}>
                    {topics.map((t,i) => (
                        <div key={t.id||i} style={{ padding:'14px 16px',borderRadius:12,border:'1px solid var(--card-border)',background:'var(--card-bg)',transition:'border-color 0.15s' }}
                            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--card-border)'}>
                            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                                <div style={{ width:28,height:28,borderRadius:7,background:'var(--accent-soft)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                                    <ListChecks size={13} style={{ color:'var(--accent)' }}/>
                                </div>
                                <span style={{ fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)' }}>
                                    {t.title||t.name||`Mavzu ${i+1}`}
                                </span>
                            </div>
                            {t.description && (
                                <p style={{ fontSize:'0.78rem',color:'var(--text-secondary)',margin:'0 0 8px',lineHeight:1.5 }}>{t.description}</p>
                            )}
                            <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:4 }}>
                                {t.group?.name && <span style={{ fontSize:'0.72rem',padding:'2px 8px',borderRadius:99,background:'var(--accent-soft)',color:'var(--accent)',fontWeight:600 }}>{t.group.name}</span>}
                                {t.subject?.name && <span style={{ fontSize:'0.72rem',padding:'2px 8px',borderRadius:99,background:'var(--success-soft)',color:'var(--success)',fontWeight:600 }}>{t.subject.name}</span>}
                                {t.week_start_date && <span style={{ fontSize:'0.68rem',color:'var(--text-muted)' }}>{fmtDate(t.week_start_date)}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
