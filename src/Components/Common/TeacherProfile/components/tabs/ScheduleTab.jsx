import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLazyGetGroupScheduleByGroupIdQuery } from '../../../../../store/services/group-schedule.api';
import { useLazyGetTeacherGroupsByTeacherIdQuery } from '../../../../../store/services/theacher-group.api';
import {
    useLazyGetGroupWeekTopicsQuery,
    useCreateWeeklyTopicMutation,
    useUpdateWeeklyTopicMutation,
    useDeleteWeeklyTopicMutation,
} from '../../../../../store/services/weekly-topic.api';
import { Clock, BookOpen, User, CalendarDays, CalendarCheck2, Pencil, Check, X, Layers } from 'lucide-react';
import { Alert } from '../../../../Other/UI/Alert/Alert';
import Loading from '../../../../Other/UI/Loadings/Loading';

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_LABELS = { monday:'Dushanba', tuesday:'Seshanba', wednesday:'Chorshanba', thursday:'Payshanba', friday:'Juma', saturday:'Shanba' };
const DAY_SHORT  = { monday:'DU', tuesday:'SE', wednesday:'CH', thursday:'PA', friday:'JU', saturday:'SH' };
const JS_DAY     = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const PALETTE = ['#6366f1','#8b5cf6','#f59e0b','#10b981','#ef4444','#06b6d4'];
const colorFor = (id) => { if(!id) return PALETTE[0]; let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))%PALETTE.length; return PALETTE[h]; };
const fmtTime  = (t) => t ? t.slice(0,5) : '—';
const toMins   = (t) => { const [h,m]=(t||'0:0').split(':').map(Number); return h*60+m; };

const getMondayOf = (date) => {
    const d = new Date(date); const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
};

/* ── Inline topic editor — teacher faqat o'z darsiga ── */
function TopicCell({ item, topicData, weekStart, onSaved }) {
    const userId  = useSelector(s => s.auth?.userId);
    const role    = useSelector(s => s.auth?.role);
    const isTeacher = role === 'teacher';

    // Teacher faqat o'zining darsiga mavzu kira oladi
    const canEdit = isTeacher ? (item.teacher_id === userId) : true;

    const [editing, setEditing] = useState(false);
    const [text, setText]       = useState('');
    const [saving, setSaving]   = useState(false);

    const [createTopic] = useCreateWeeklyTopicMutation();
    const [updateTopic] = useUpdateWeeklyTopicMutation();
    const [deleteTopic] = useDeleteWeeklyTopicMutation();

    const startEdit = () => { setText(topicData?.topic || ''); setEditing(true); };
    const cancel    = () => setEditing(false);

    const save = async () => {
        if (!text.trim()) return cancel();
        setSaving(true);
        try {
            if (topicData?.id) {
                await updateTopic({ id: topicData.id, data: { topic: text.trim() } }).unwrap();
            } else {
                await createTopic({
                    group_schedule_id: item.id,
                    week_start_date: weekStart,
                    topic: text.trim(),
                }).unwrap();
            }
            Alert('Mavzu saqlandi', 'success');
            onSaved();
            setEditing(false);
        } catch (e) {
            Alert(e?.data?.message || 'Xatolik', 'error');
        } finally { setSaving(false); }
    };

    const remove = async () => {
        if (!topicData?.id) return;
        setSaving(true);
        try {
            await deleteTopic(topicData.id).unwrap();
            Alert("Mavzu o'chirildi", 'success');
            onSaved();
        } catch (e) {
            Alert(e?.data?.message || 'Xatolik', 'error');
        } finally { setSaving(false); }
    };

    if (editing) return (
        <div style={{ display:'flex', gap:4, alignItems:'center', marginTop:5 }}>
            <input
                value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter') save(); if(e.key==='Escape') cancel(); }}
                placeholder="Mavzu nomini kiriting..." autoFocus
                style={{ flex:1, padding:'4px 8px', borderRadius:6, fontSize:'0.72rem', border:'1.5px solid var(--accent)', background:'var(--input-bg)', color:'var(--input-text)', outline:'none' }}
            />
            <button onClick={save} disabled={saving} style={{ width:24, height:24, borderRadius:6, border:'none', background:'var(--success)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Check size={12}/>
            </button>
            <button onClick={cancel} style={{ width:24, height:24, borderRadius:6, border:'none', background:'var(--danger-soft)', color:'var(--danger)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <X size={12}/>
            </button>
        </div>
    );

    return (
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:5 }}>
            {topicData?.topic ? (
                <span style={{ fontSize:'0.68rem', color:'var(--text-secondary)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontStyle:'italic' }}>
                    📝 {topicData.topic}
                </span>
            ) : (
                <span style={{ fontSize:'0.68rem', color:'var(--text-muted)', flex:1, fontStyle:'italic', opacity:0.7 }}>
                    {canEdit ? 'Mavzu yo\'q' : '—'}
                </span>
            )}
            {canEdit && (
                <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                    <button onClick={startEdit} title={topicData?.topic ? 'Tahrirlash' : "Mavzu qo'shish"}
                        style={{ width:22, height:22, borderRadius:5, border:'none', background:'var(--accent-soft)', color:'var(--accent)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Pencil size={11}/>
                    </button>
                    {topicData?.id && (
                        <button onClick={remove} disabled={saving} title="O'chirish"
                            style={{ width:22, height:22, borderRadius:5, border:'none', background:'var(--danger-soft)', color:'var(--danger)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <X size={11}/>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ScheduleTab({ user }) {
    const { id: teacherId } = useParams();
    const today    = JS_DAY[new Date().getDay()];
    const weekStart = getMondayOf(new Date());

    /* ── Fetch all teacher groups ── */
    const [fetchGroups, { data: groupsData, isLoading: gl }] = useLazyGetTeacherGroupsByTeacherIdQuery();
    useEffect(() => { if (teacherId) fetchGroups(teacherId); }, [teacherId]);

    const groups = useMemo(() => {
        const d = groupsData?.data;
        if (!d) return [];
        const arr = Array.isArray(d) ? d : (d.records || []);
        return arr;
    }, [groupsData]);

    /* ── Fetch schedules for ALL groups ── */
    const [fetchSchedule] = useLazyGetGroupScheduleByGroupIdQuery();
    const [allSchedules, setAllSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);

    useEffect(() => {
        if (!groups.length) return;
        setLoadingSchedules(true);
        Promise.all(
            groups.map(item => {
                const gid = item.group?.id || item.group_id || item.id;
                return fetchSchedule(gid).then(res => {
                    const records = res?.data?.data || res?.data || [];
                    return Array.isArray(records) ? records : [];
                });
            })
        ).then(results => {
            setAllSchedules(results.flat());
            setLoadingSchedules(false);
        });
    }, [groups.length, teacherId]);

    /* ── Filter: only this teacher's schedules ── */
    const mySchedules = useMemo(() => {
        return allSchedules.filter(s => s.teacher_id === teacherId || s.teacher?.id === teacherId);
    }, [allSchedules, teacherId]);

    /* ── Group by day ── */
    const grouped = useMemo(() => {
        const m = {};
        mySchedules.forEach(item => {
            const d = item.day_of_week;
            if (!m[d]) m[d] = [];
            m[d].push(item);
        });
        Object.keys(m).forEach(d => m[d].sort((a,b) => toMins(a.start_time) - toMins(b.start_time)));
        return m;
    }, [mySchedules]);

    /* ── Topics per group ── */
    const [fetchTopics, { data: topicsData }] = useLazyGetGroupWeekTopicsQuery();
    const [topicMaps, setTopicMaps] = useState({}); // { group_schedule_id → {id, topic} }

    useEffect(() => {
        if (!groups.length) return;
        groups.forEach(item => {
            const gid = item.group?.id || item.group_id || item.id;
            fetchTopics({ group_id: gid, week_start_date: weekStart });
        });
    }, [groups.length, weekStart]);

    useEffect(() => {
        const raw = topicsData?.data?.records || topicsData?.data || [];
        if (!Array.isArray(raw)) return;
        setTopicMaps(prev => {
            const m = { ...prev };
            raw.forEach(t => { if (t.group_schedule_id) m[t.group_schedule_id] = { id: t.id, topic: t.topic }; });
            return m;
        });
    }, [topicsData]);

    const reloadTopics = () => {
        groups.forEach(item => {
            const gid = item.group?.id || item.group_id || item.id;
            fetchTopics({ group_id: gid, week_start_date: weekStart });
        });
    };

    const isLoading = gl || loadingSchedules;

    if (isLoading) return <Loading />;

    if (!mySchedules.length) return (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
            <CalendarDays size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/>
            <p style={{ fontSize:'0.875rem' }}>Jadvallar mavjud emas</p>
        </div>
    );

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:9, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <CalendarDays size={15} style={{ color:'var(--accent)' }}/>
                    </div>
                    <div>
                        <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>Dars jadvali</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Haftalik taqsimot · {mySchedules.length} ta dars</div>
                    </div>
                </div>
                {groups.length > 1 && (
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', background:'var(--input-bg)', padding:'4px 10px', borderRadius:8, border:'1px solid var(--card-border)', display:'flex', alignItems:'center', gap:5 }}>
                        <Layers size={12}/> {groups.length} ta guruh
                    </div>
                )}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:12 }}>
                {DAYS_ORDER.map(day => {
                    const items   = grouped[day] || [];
                    const isToday = day === today;
                    return (
                        <div key={day} style={{
                            borderRadius:14, overflow:'hidden',
                            border: isToday ? '1.5px solid var(--accent)' : '1px solid var(--card-border)',
                            background:'var(--card-bg)',
                            boxShadow: isToday ? '0 0 0 3px var(--accent-glow)' : 'none',
                        }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderBottom:'1px solid var(--card-border)', background: isToday ? 'var(--accent-soft)' : 'transparent' }}>
                                <div style={{ width:28, height:28, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, background: isToday ? 'var(--accent)' : 'var(--input-bg)', color: isToday ? '#fff' : 'var(--text-muted)' }}>
                                    {DAY_SHORT[day]}
                                </div>
                                <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', flex:1 }}>{DAY_LABELS[day]}</span>
                                {isToday && (
                                    <span style={{ fontSize:'0.68rem', fontWeight:600, color:'var(--accent)', background:'var(--accent-soft)', padding:'1px 8px', borderRadius:99, display:'flex', alignItems:'center', gap:3 }}>
                                        <CalendarCheck2 size={10}/> Bugun
                                    </span>
                                )}
                                {items.length > 0 && (
                                    <span style={{ fontSize:'0.68rem', color:'var(--text-muted)', background:'var(--input-bg)', padding:'1px 7px', borderRadius:99 }}>{items.length}</span>
                                )}
                            </div>

                            {items.length === 0 ? (
                                <div style={{ padding:'24px 0', textAlign:'center', color:'var(--text-muted)', fontSize:'0.78rem' }}>Dars yo'q</div>
                            ) : (
                                <div>
                                    {items.map((item, ii) => {
                                        const color   = colorFor(item.subject_id);
                                        const subName = item.subject?.name || item.subject_id?.slice(0,8) || '—';
                                        return (
                                            <div key={item.id || ii} style={{ padding:'10px 14px', borderTop:'1px solid var(--card-border)' }}
                                                onMouseEnter={e=>e.currentTarget.style.background='var(--input-bg)'}
                                                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                                <div style={{ display:'flex', gap:10 }}>
                                                    <div style={{ width:3, borderRadius:99, background:color, alignSelf:'stretch', flexShrink:0, marginTop:2 }}/>
                                                    <div style={{ flex:1, minWidth:0 }}>
                                                        <div style={{ fontSize:'0.72rem', fontWeight:600, color, marginBottom:3, display:'flex', alignItems:'center', gap:4 }}>
                                                            <Clock size={10}/>{fmtTime(item.start_time)}–{fmtTime(item.end_time)}
                                                        </div>
                                                        <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                                                            <BookOpen size={11} style={{ color:'var(--text-muted)', flexShrink:0 }}/>{subName}
                                                        </div>
                                                        {item.group?.name && (
                                                            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
                                                                <User size={10}/>{item.group.name}
                                                            </div>
                                                        )}
                                                        {/* Mavzu satri — teacher o'z darsiga mavzu kirita oladi */}
                                                        <TopicCell
                                                            item={item}
                                                            topicData={topicMaps[item.id] || null}
                                                            weekStart={weekStart}
                                                            onSaved={reloadTopics}
                                                        />
                                                    </div>
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
