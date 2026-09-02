import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    useLazyGetGroupScheduleByGroupIdQuery,
    useDeleteGroupScheduleMutation,
    useCreateGroupScheduleMutation,
} from '../../../../store/services/group-schedule.api';
import { useGetSubjectsQuery } from '../../../../store/services/subject.api';
import { useLazyGetUsersQuery } from '../../../../store/services/user.api';
import { useLazyGetAvailableTeachersQuery } from '../../../../store/services/teacher-subject.api';
import {
    useLazyGetGroupWeekTopicsQuery,
    useCreateWeeklyTopicMutation,
    useUpdateWeeklyTopicMutation,
    useDeleteWeeklyTopicMutation,
} from '../../../../store/services/weekly-topic.api';
import {
    Clock, User, BookOpen, Trash2, Plus, CalendarDays,
    Users, Hourglass, Pencil, Check, X,
} from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import Modal from '../../../Other/UI/Modal/Modal';
import Loading from '../../../Other/UI/Loadings/Loading';

/* ── constants ── */
const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_LABELS = { monday:'Dushanba', tuesday:'Seshanba', wednesday:'Chorshanba', thursday:'Payshanba', friday:'Juma', saturday:'Shanba' };
const DAY_SHORT  = { monday:'DU', tuesday:'SE', wednesday:'CH', thursday:'PA', friday:'JU', saturday:'SH' };
const JS_DAY     = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const fmtTime = (t) => t ? t.slice(0, 5) : '—';
const toMins  = (t) => { const [h,m]=(t||'0:0').split(':').map(Number); return h*60+m; };

const PALETTE_COLORS = ['#6366f1','#8b5cf6','#f59e0b','#10b981','#ef4444','#06b6d4'];
const colorFor = (id) => {
    if (!id) return PALETTE_COLORS[0];
    let h = 0; for (let i = 0; i < id.length; i++) h = (h*31+id.charCodeAt(i)) % PALETTE_COLORS.length;
    return PALETTE_COLORS[h];
};

const groupByDay = (records) => {
    const g = records.filter(i=>i.day_of_week!=='sunday').reduce((acc,i)=>{ const d=i.day_of_week; if(!acc[d])acc[d]=[]; acc[d].push(i); return acc; },{});
    Object.values(g).forEach(list=>list.sort((a,b)=>toMins(a.start_time)-toMins(b.start_time)));
    return g;
};

const getMondayOf = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
};

const EMPTY = { subject_id:'', teacher_id:'', day_of_week:'monday', start_time:'', end_time:'' };

/* ── Fan tanlanganda available teacherlarni ko'rsatadi ── */
function AvailableTeacherSelect({ subjectId, groupId, value, onChange, error }) {
    const [fetch, { data, isLoading }] = useLazyGetAvailableTeachersQuery();

    useEffect(() => {
        if (subjectId && groupId) fetch({ subject_id: subjectId, group_id: groupId });
    }, [subjectId, groupId]);

    const teachers = data?.data || data?.teachers || data || [];
    const arr = Array.isArray(teachers) ? teachers : [];

    /* Auto-select if only 1 teacher available */
    useEffect(() => {
        if (!isLoading && arr.length === 1) {
            const id = arr[0].id || arr[0].teacher_id || arr[0].user?.id;
            if (id && value !== id) onChange(id);
        }
    }, [arr, isLoading]);

    /* If only 1 teacher, show as read-only label */
    if (!isLoading && subjectId && arr.length === 1) {
        const t = arr[0];
        const name = t.full_name || t.teacher?.full_name || t.user?.full_name || '—';
        return (
            <div>
                <div style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: `1.5px solid ${error ? 'var(--danger)' : 'var(--success)'}`,
                    background: 'var(--input-bg)', color: 'var(--input-text)',
                    fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8,
                    boxSizing: 'border-box',
                }}>
                    <User size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>{name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--success)', marginLeft: 'auto' }}>avtomatik tanlandi</span>
                </div>
                {error && <span style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>{error}</span>}
            </div>
        );
    }

    return (
        <div>
            <select
                className={`field-select no-icon${error ? ' error' : ''}`}
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={isLoading || !subjectId}
            >
                <option value="">{!subjectId ? 'Avval fan tanlang' : isLoading ? 'Yuklanmoqda...' : arr.length === 0 ? "O'qituvchi topilmadi" : "O'qituvchi tanlang"}</option>
                {arr.map(t => {
                    const id   = t.id || t.teacher_id || t.user?.id;
                    const name = t.full_name || t.teacher?.full_name || t.user?.full_name || '—';
                    return <option key={id} value={id}>{name}</option>;
                })}
            </select>
            {error && <span style={{ fontSize:'0.72rem', color:'var(--danger)' }}>{error}</span>}
        </div>
    );
}

/* ── Inline topic editor ── */
function TopicCell({ item, topicData, canEdit, groupId, weekStart, onSaved }) {
    const [editing, setEditing] = useState(false);
    const [text, setText]       = useState('');
    const [saving, setSaving]   = useState(false);

    const [createTopic] = useCreateWeeklyTopicMutation();
    const [updateTopic] = useUpdateWeeklyTopicMutation();
    const [deleteTopic] = useDeleteWeeklyTopicMutation();

    const existing = topicData; // { id, topic } or null

    const startEdit = () => {
        setText(existing?.topic || '');
        setEditing(true);
    };
    const cancel = () => setEditing(false);

    const save = async () => {
        if (!text.trim()) return cancel();
        setSaving(true);
        try {
            if (existing?.id) {
                await updateTopic({ id: existing.id, data: { topic: text.trim() } }).unwrap();
            } else {
                await createTopic({
                    group_schedule_id: item.id,
                    week_start_date:   weekStart,
                    topic:             text.trim(),
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
        if (!existing?.id) return;
        setSaving(true);
        try {
            await deleteTopic(existing.id).unwrap();
            Alert("Mavzu o'chirildi", 'success');
            onSaved();
        } catch (e) {
            Alert(e?.data?.message || 'Xatolik', 'error');
        } finally { setSaving(false); }
    };

    if (editing) {
        return (
            <div style={{ display:'flex', gap:4, alignItems:'center', marginTop:4 }}>
                <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key==='Enter') save(); if (e.key==='Escape') cancel(); }}
                    placeholder="Mavzu nomini kiriting..."
                    autoFocus
                    style={{
                        flex:1, padding:'4px 8px', borderRadius:6, fontSize:'0.72rem',
                        border:'1.5px solid var(--accent)', background:'var(--input-bg)',
                        color:'var(--input-text)', outline:'none',
                    }}
                />
                <button onClick={save} disabled={saving} style={{ width:24, height:24, borderRadius:6, border:'none', background:'var(--success)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Check size={12}/>
                </button>
                <button onClick={cancel} style={{ width:24, height:24, borderRadius:6, border:'none', background:'var(--danger-soft)', color:'var(--danger)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <X size={12}/>
                </button>
            </div>
        );
    }

    return (
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
            {existing?.topic ? (
                <span style={{ fontSize:'0.68rem', color:'var(--text-secondary)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontStyle:'italic' }}>
                    📝 {existing.topic}
                </span>
            ) : (
                <span style={{ fontSize:'0.68rem', color:'var(--text-muted)', flex:1, fontStyle:'italic', opacity:0.7 }}>
                    Mavzu yo'q
                </span>
            )}
            {canEdit && (
                <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                    <button onClick={startEdit}
                        title={existing?.topic ? 'Tahrirlash' : "Mavzu qo'shish"}
                        style={{ width:22, height:22, borderRadius:5, border:'none', background:'var(--accent-soft)', color:'var(--accent)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Pencil size={11}/>
                    </button>
                    {existing?.id && (
                        <button onClick={remove} disabled={saving}
                            title="Mavzuni o'chirish"
                            style={{ width:22, height:22, borderRadius:5, border:'none', background:'var(--danger-soft)', color:'var(--danger)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <X size={11}/>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ScheduleTab({ groupId: groupIdProp }) {
    const params  = useParams();
    const groupId = groupIdProp || params.id;
    const today   = JS_DAY[new Date().getDay()];
    const role    = useSelector(s => s.auth?.role);
    const userId  = useSelector(s => s.auth?.userId);
    const isTeacher = role === 'teacher';

    /* ── Schedule fetch ── */
    const [trigger, { isLoading, error }] = useLazyGetGroupScheduleByGroupIdQuery();
    const [deleteSchedule, { isLoading: isDeleting }] = useDeleteGroupScheduleMutation();
    const [createSchedule, { isLoading: isCreating }] = useCreateGroupScheduleMutation();

    /* ── Subjects + teachers for add modal ── */
    const { data: subjectsData, isLoading: subjectsLoading } = useGetSubjectsQuery({ limit:100 });
    const [fetchTeachers, { data: teachersData, isLoading: teachersLoading }] = useLazyGetUsersQuery();

    const [scheduleMap, setScheduleMap] = useState({});
    const [subjectsMap, setSubjectsMap] = useState({});
    const [teachersMap, setTeachersMap] = useState({});
    const subjects = subjectsData?.data?.records || [];
    const teachers = teachersData?.data?.records || [];

    const [open, setOpen]   = useState(false);
    const [form, setForm]   = useState(EMPTY);
    const [errors, setErrors] = useState({});

    /* ── Weekly topic fetch ── */
    const weekStart = getMondayOf(new Date());
    const [fetchTopics, { data: topicsData }] = useLazyGetGroupWeekTopicsQuery();
    const loadTopics = () => {
        if (groupId) fetchTopics({ group_id: groupId, week_start_date: weekStart });
    };

    /* topicMap: { group_schedule_id → { id, topic } } */
    const topicMap = useMemo(() => {
        const raw = topicsData?.data?.records || topicsData?.data || [];
        const m = {};
        raw.forEach(t => {
            if (t.group_schedule_id) m[t.group_schedule_id] = { id: t.id, topic: t.topic };
        });
        return m;
    }, [topicsData]);

    /* ── Load data ── */
    const [rawData, setRawData] = useState(null);
    const loadSchedule = () => {
        if (!groupId) return;
        trigger(groupId).then(res => {
            // axiosBaseQuery: hook result = { data: { status, data: [...] } }
            const d = res?.data?.data ?? res?.data;
            const records = Array.isArray(d) ? d
                : Array.isArray(d?.records) ? d.records
                : [];
            setRawData(records);
        });
    };

    useEffect(() => { if (groupId) fetchTeachers({ role:'teacher', limit:200 }); }, [groupId]);
    useEffect(() => { if (subjectsData) setSubjectsMap((subjectsData?.data?.records||[]).reduce((a,s)=>({...a,[s.id]:s.name}),{})); }, [subjectsData]);
    useEffect(() => { if (teachersData) setTeachersMap((teachersData?.data?.records||[]).reduce((a,t)=>({...a,[t.id]:t.full_name}),{})); }, [teachersData]);
    useEffect(() => { loadSchedule(); loadTopics(); }, [groupId]);
    useEffect(() => { if (rawData) setScheduleMap(groupByDay(Array.isArray(rawData) ? rawData : [])); }, [rawData]);

    /* ── Stats ── */
    const stats = useMemo(() => {
        const all = Object.values(scheduleMap).flat();
        const totalMins = all.reduce((s,i)=>s+Math.max(0,toMins(i.end_time)-toMins(i.start_time)),0);
        return { count:all.length, hours:Math.round(totalMins/60*10)/10, teacherCount:new Set(all.map(i=>i.teacher_id)).size };
    }, [scheduleMap]);

    /* ── Handlers ── */
    const handleDelete = async (item) => {
        if (isDeleting) return;
        const day = item.day_of_week;
        setScheduleMap(prev=>({ ...prev, [day]:(prev[day]||[]).filter(i=>i.id!==item.id) }));
        try {
            await deleteSchedule(item.id).unwrap();
            Alert(`"${subjectsMap[item.subject_id]||'Dars'}" o'chirildi`, 'success');
            loadSchedule();
        } catch (err) {
            setScheduleMap(prev=>{ const l=[...(prev[day]||[]),item].sort((a,b)=>toMins(a.start_time)-toMins(b.start_time)); return {...prev,[day]:l}; });
            Alert(err?.data?.message||'Xatolik','error');
        }
    };

    const validate = () => {
        const e={};
        if (!form.subject_id) e.subject_id='Fan tanlanishi kerak';
        if (!form.teacher_id) e.teacher_id="O'qituvchi tanlanishi kerak";
        if (!form.start_time) e.start_time='Boshlanish vaqti majburiy';
        if (!form.end_time)   e.end_time='Tugash vaqti majburiy';
        if (form.start_time && form.end_time && form.start_time >= form.end_time)
            e.end_time="Tugash vaqti boshlanish vaqtidan kechroq bo'lishi kerak";
        setErrors(e); return !Object.keys(e).length;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        const tempId = `temp-${Date.now()}`;
        const tempItem = { id:tempId, group_id:groupId, ...form };
        setScheduleMap(prev=>{ const l=[...(prev[form.day_of_week]||[]),tempItem].sort((a,b)=>toMins(a.start_time)-toMins(b.start_time)); return {...prev,[form.day_of_week]:l}; });
        setOpen(false);
        try {
            const res = await createSchedule({ group_id:groupId, ...form }).unwrap();
            const saved = res?.data || res;
            if (saved) {
                const fi = {...saved, id:saved.id||tempId, day_of_week:saved.day_of_week||form.day_of_week};
                setScheduleMap(prev=>{ const day=fi.day_of_week; const l=(prev[day]||[]).map(i=>i.id===tempId?fi:i); if(!l.some(i=>i.id===fi.id))l.push(fi); l.sort((a,b)=>toMins(a.start_time)-toMins(b.start_time)); return {...prev,[day]:l}; });
            }
            Alert("Dars jadvaliga qo'shildi",'success');
            loadSchedule();
        } catch (err) {
            setScheduleMap(prev=>({ ...prev, [form.day_of_week]:(prev[form.day_of_week]||[]).filter(i=>i.id!==tempId) }));
            Alert(err?.data?.message||'Xatolik','error');
        }
    };

    if (isLoading) return <Loading/>;
    if (error) return <div style={{ color:'var(--danger)', padding:12, background:'var(--danger-soft)', borderRadius:10 }}>Xatolik: {error?.data?.message}</div>;

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <CalendarDays size={18} style={{ color:'var(--accent)' }}/>
                    </div>
                    <div>
                        <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>Dars jadvali</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Haftalik dars taqsimoti</div>
                    </div>
                </div>
                {!isTeacher && (
                    <button className="btn-create" onClick={()=>{ setForm(EMPTY); setErrors({}); setOpen(true); }}>
                        <Plus size={14}/> Dars qo'shish
                    </button>
                )}
            </div>

            {/* Stats */}
            {stats.count > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
                    {[
                        { icon:BookOpen,  label:'dars / hafta',     val:stats.count,              color:'#3b82f6' },
                        { icon:Hourglass, label:'umumiy yuklama',   val:`${stats.hours} soat`,    color:'#f59e0b' },
                        { icon:Users,     label:"o'qituvchi",       val:stats.teacherCount,        color:'#10b981' },
                    ].map((c,i)=>(
                        <div key={i} style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                            <div style={{ width:34, height:34, borderRadius:9, background:c.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <c.icon size={16} style={{ color:c.color }}/>
                            </div>
                            <div>
                                <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--text-primary)' }}>{c.val}</div>
                                <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{c.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Weekly grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
                {DAYS_ORDER.map(day => {
                    const items   = scheduleMap[day] || [];
                    const isToday = day === today;
                    return (
                        <div key={day} style={{
                            borderRadius:14, overflow:'hidden',
                            border: isToday ? '1.5px solid var(--accent)' : '1px solid var(--card-border)',
                            background:'var(--card-bg)',
                            boxShadow: isToday ? '0 0 0 3px var(--accent-glow)' : 'none',
                        }}>
                            {/* Day header */}
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--card-border)', background: isToday ? 'var(--accent-soft)' : 'transparent' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                    <div style={{ width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, background: isToday ? 'var(--accent)' : 'var(--input-bg)', color: isToday ? '#fff' : 'var(--text-muted)' }}>
                                        {DAY_SHORT[day]}
                                    </div>
                                    <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)' }}>{DAY_LABELS[day]}</span>
                                    {isToday && <span style={{ fontSize:'0.68rem', fontWeight:600, color:'var(--accent)', background:'var(--accent-soft)', padding:'1px 8px', borderRadius:99 }}>Bugun</span>}
                                    {items.length > 0 && <span style={{ fontSize:'0.68rem', color:'var(--text-muted)', background:'var(--input-bg)', padding:'1px 7px', borderRadius:99 }}>{items.length}</span>}
                                </div>
                                {!isTeacher && (
                                    <button onClick={()=>{ setForm({...EMPTY,day_of_week:day}); setErrors({}); setOpen(true); }}
                                        style={{ width:26, height:26, borderRadius:7, border:'none', background:'transparent', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                                        onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-soft)';e.currentTarget.style.color='var(--accent)';}}
                                        onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-muted)';}}>
                                        <Plus size={14}/>
                                    </button>
                                )}
                            </div>

                            {/* Items */}
                            {items.length === 0 ? (
                                isTeacher ? (
                                    <div style={{ padding:'28px 0', textAlign:'center', color:'var(--text-muted)', fontSize:'0.72rem' }}>Dars yo'q</div>
                                ) : (
                                    <button onClick={()=>{ setForm({...EMPTY,day_of_week:day}); setErrors({}); setOpen(true); }}
                                        style={{ width:'100%', padding:'28px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)' }}
                                        onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-soft)';e.currentTarget.style.color='var(--accent)';}}
                                        onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-muted)';}}>
                                        <Plus size={16}/><span style={{ fontSize:'0.72rem' }}>Dars qo'shish</span>
                                    </button>
                                )
                            ) : (
                                <div>
                                    {items.map(item => {
                                        const color = colorFor(item.subject_id);
                                        const subName = subjectsMap[item.subject_id] || item.subject?.name || item.subject_id?.slice(0,8);
                                        const teacherName = item.teacher?.full_name || teachersMap[item.teacher_id] || '—';
                                        const topicD = topicMap[item.id] || null;

                                        /* Teacher faqat o'z darsiga mavzu kira oladi */
                                        const canEditTopic = isTeacher
                                            ? (item.teacher_id === userId)
                                            : true; // admin/super_admin hammaga

                                        return (
                                            <div key={item.id} style={{ padding:'10px 14px', borderTop:'1px solid var(--card-border)' }}
                                                onMouseEnter={e=>{e.currentTarget.style.background='var(--input-bg)'; const btn=e.currentTarget.querySelector('.del-btn'); if(btn)btn.style.opacity='1';}}
                                                onMouseLeave={e=>{e.currentTarget.style.background='transparent'; const btn=e.currentTarget.querySelector('.del-btn'); if(btn)btn.style.opacity='0';}}>
                                                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                                                    <div style={{ display:'flex', gap:10, minWidth:0, flex:1 }}>
                                                        <div style={{ width:3, borderRadius:99, background:color, flexShrink:0, alignSelf:'stretch', marginTop:2 }}/>
                                                        <div style={{ minWidth:0, flex:1 }}>
                                                            <div style={{ fontSize:'0.72rem', fontWeight:600, color, marginBottom:3, display:'flex', alignItems:'center', gap:4 }}>
                                                                <Clock size={10}/>{fmtTime(item.start_time)}–{fmtTime(item.end_time)}
                                                            </div>
                                                            <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', marginBottom:2 }}>
                                                                {subName}
                                                            </div>
                                                            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                                                                <User size={11}/>{teacherName}
                                                            </div>
                                                            {/* Mavzu satri */}
                                                            <TopicCell
                                                                item={item}
                                                                topicData={topicD}
                                                                canEdit={canEditTopic}
                                                                groupId={groupId}
                                                                weekStart={weekStart}
                                                                onSaved={loadTopics}
                                                            />
                                                        </div>
                                                    </div>
                                                    {!isTeacher && (
                                                        <button className="del-btn" onClick={()=>handleDelete(item)} disabled={isDeleting}
                                                            style={{ width:26, height:26, borderRadius:7, border:'none', background:'transparent', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'all 0.15s', flexShrink:0 }}
                                                            onMouseEnter={e=>{e.currentTarget.style.background='var(--danger-soft)';e.currentTarget.style.color='var(--danger)';}}
                                                            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-muted)';}}>
                                                            <Trash2 size={13}/>
                                                        </button>
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

            {/* Add schedule modal */}
            <Modal open={open} onClose={()=>setOpen(false)} title="Yangi dars qo'shish" size="sm">
                <form onSubmit={handleSubmit}>
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        <div>
                            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Fan</label>
                            <select className={`field-select no-icon${errors.subject_id?' error':''}`}
                                value={form.subject_id} onChange={e=>setForm(p=>({...p,subject_id:e.target.value, teacher_id:''}))} disabled={subjectsLoading}>
                                <option value="">Fan tanlang</option>
                                {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {errors.subject_id && <span style={{ fontSize:'0.72rem', color:'var(--danger)' }}>{errors.subject_id}</span>}
                        </div>
                        <div>
                            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>O'qituvchi</label>
                            <AvailableTeacherSelect
                                subjectId={form.subject_id}
                                groupId={groupId}
                                value={form.teacher_id}
                                onChange={v => setForm(p=>({...p, teacher_id:v}))}
                                error={errors.teacher_id}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Kun</label>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                                {DAYS_ORDER.map(d=>(
                                    <button key={d} type="button" onClick={()=>setForm(p=>({...p,day_of_week:d}))}
                                        style={{ padding:'8px', borderRadius:9, border:`1.5px solid ${form.day_of_week===d?'var(--accent)':'var(--card-border)'}`, background:form.day_of_week===d?'var(--accent)':'var(--input-bg)', color:form.day_of_week===d?'#fff':'var(--text-secondary)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
                                        {DAY_SHORT[d]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                            <div>
                                <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Boshlanish</label>
                                <input type="time" value={form.start_time} onChange={e=>setForm(p=>({...p,start_time:e.target.value}))} className="search-input" style={{ paddingLeft:14 }}/>
                                {errors.start_time && <span style={{ fontSize:'0.72rem', color:'var(--danger)' }}>{errors.start_time}</span>}
                            </div>
                            <div>
                                <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Tugash</label>
                                <input type="time" value={form.end_time} onChange={e=>setForm(p=>({...p,end_time:e.target.value}))} className="search-input" style={{ paddingLeft:14 }}/>
                                {errors.end_time && <span style={{ fontSize:'0.72rem', color:'var(--danger)' }}>{errors.end_time}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={()=>setOpen(false)}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isCreating}>
                            <Plus size={14}/>{isCreating?'Saqlanmoqda...':'Qo\'shish'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
