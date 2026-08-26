import { useMemo } from 'react';
import { Clock, BookOpen, User, CalendarDays, CalendarCheck2 } from 'lucide-react';

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_LABELS = { monday:'Dushanba', tuesday:'Seshanba', wednesday:'Chorshanba', thursday:'Payshanba', friday:'Juma', saturday:'Shanba' };
const DAY_SHORT  = { monday:'DU', tuesday:'SE', wednesday:'CH', thursday:'PA', friday:'JU', saturday:'SH' };
const JS_DAY = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const PALETTE_COLORS = ['#6366f1','#8b5cf6','#f59e0b','#10b981','#ef4444','#06b6d4'];
const colorFor = (id) => { if(!id)return PALETTE_COLORS[0]; let h=0; for(let i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))%PALETTE_COLORS.length; return PALETTE_COLORS[h]; };
const fmtTime = (t) => t ? t.slice(0,5) : '—';
const toMins  = (t) => { const [h,m]=(t||'0:0').split(':').map(Number); return h*60+m; };

export default function ScheduleTab({ user }) {
    const schedules = user?.group_schedules || [];
    const today = JS_DAY[new Date().getDay()];

    const subjectsMap = useMemo(() => {
        const m={};
        (user?.teacher_subjects||[]).forEach(s=>{ m[s.subject_id]=s.name; });
        return m;
    }, [user]);

    const grouped = useMemo(() => {
        const m={};
        schedules.forEach(item=>{ const d=item.day_of_week; if(!m[d])m[d]=[]; m[d].push(item); });
        Object.keys(m).forEach(d=>m[d].sort((a,b)=>toMins(a.start_time)-toMins(b.start_time)));
        return m;
    }, [schedules]);

    const totalSchedules = schedules.length;

    if (totalSchedules === 0) {
        return (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
                <CalendarDays size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/>
                <p style={{ fontSize:'0.875rem' }}>Jadvallar mavjud emas</p>
            </div>
        );
    }

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32,height:32,borderRadius:9,background:'var(--accent-soft)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <CalendarDays size={15} style={{ color:'var(--accent)' }}/>
                </div>
                <div>
                    <div style={{ fontSize:'0.875rem',fontWeight:600,color:'var(--text-primary)' }}>Dars jadvali</div>
                    <div style={{ fontSize:'0.72rem',color:'var(--text-muted)' }}>Haftalik taqsimot · {totalSchedules} ta dars</div>
                </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:12 }}>
                {DAYS_ORDER.map(day => {
                    const items = grouped[day] || [];
                    const isToday = day === today;
                    return (
                        <div key={day} style={{
                            borderRadius:14, overflow:'hidden',
                            border: isToday ? '1.5px solid var(--accent)' : '1px solid var(--card-border)',
                            background: 'var(--card-bg)',
                            boxShadow: isToday ? '0 0 0 3px var(--accent-glow)' : 'none',
                        }}>
                            {/* Day header */}
                            <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderBottom:'1px solid var(--card-border)',background:isToday?'var(--accent-soft)':'transparent' }}>
                                <div style={{ width:28,height:28,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:700,background:isToday?'var(--accent)':'var(--input-bg)',color:isToday?'#fff':'var(--text-muted)',flexShrink:0 }}>
                                    {DAY_SHORT[day]}
                                </div>
                                <span style={{ fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)' }}>{DAY_LABELS[day]}</span>
                                {isToday && <span style={{ fontSize:'0.68rem',fontWeight:600,color:'var(--accent)',background:'var(--accent-soft)',padding:'1px 8px',borderRadius:99,display:'flex',alignItems:'center',gap:3 }}><CalendarCheck2 size={10}/>Bugun</span>}
                                {items.length > 0 && !isToday && <span style={{ fontSize:'0.68rem',color:'var(--text-muted)',background:'var(--input-bg)',padding:'1px 7px',borderRadius:99,marginLeft:'auto' }}>{items.length}</span>}
                            </div>

                            {items.length === 0 ? (
                                <div style={{ padding:'24px 0',textAlign:'center',color:'var(--text-muted)',fontSize:'0.78rem' }}>Dars yo'q</div>
                            ) : (
                                <div>
                                    {items.map(item => {
                                        const color = colorFor(item.subject_id);
                                        const subName = subjectsMap[item.subject_id] || (item.subject?.name) || item.subject_id?.slice(0,8);
                                        return (
                                            <div key={item.id} style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',borderTop:'1px solid var(--card-border)' }}
                                                onMouseEnter={e=>e.currentTarget.style.background='var(--input-bg)'}
                                                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                                <div style={{ width:3,borderRadius:99,background:color,alignSelf:'stretch',flexShrink:0,marginTop:2 }}/>
                                                <div>
                                                    <div style={{ fontSize:'0.72rem',fontWeight:600,color:color,marginBottom:3,display:'flex',alignItems:'center',gap:4 }}>
                                                        <Clock size={10}/>{fmtTime(item.start_time)}–{fmtTime(item.end_time)}
                                                    </div>
                                                    <div style={{ fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)',display:'flex',alignItems:'center',gap:5 }}>
                                                        <BookOpen size={11} style={{ color:'var(--text-muted)',flexShrink:0 }}/>{subName}
                                                    </div>
                                                    {item.group?.name && (
                                                        <div style={{ fontSize:'0.72rem',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:4,marginTop:2 }}>
                                                            <User size={10}/>{item.group.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
