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
import { Clock, User, BookOpen, Trash2, Plus, CalendarDays, Users, Hourglass, CalendarCheck2, RefreshCw } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import Modal from '../../../Other/UI/Modal/Modal';
import Loading from '../../../Other/UI/Loadings/Loading';

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_LABELS = { monday:'Dushanba', tuesday:'Seshanba', wednesday:'Chorshanba', thursday:'Payshanba', friday:'Juma', saturday:'Shanba' };
const DAY_SHORT  = { monday:'DU', tuesday:'SE', wednesday:'CH', thursday:'PA', friday:'JU', saturday:'SH' };
const JS_DAY = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const PALETTE = [
    { dot:'bg-sky-500',    chip:'bg-sky-500/10 text-sky-600' },
    { dot:'bg-violet-500', chip:'bg-violet-500/10 text-violet-600' },
    { dot:'bg-amber-500',  chip:'bg-amber-500/10 text-amber-600' },
    { dot:'bg-emerald-500',chip:'bg-emerald-500/10 text-emerald-600' },
    { dot:'bg-rose-500',   chip:'bg-rose-500/10 text-rose-600' },
    { dot:'bg-cyan-500',   chip:'bg-cyan-500/10 text-cyan-600' },
];
const colorFor = (id) => { if(!id) return PALETTE[0]; let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))%PALETTE.length; return PALETTE[h]; };
const toMins = (t) => { const [h,m]=(t||'0:0').split(':').map(Number); return h*60+m; };
const groupByDay = (records) => {
    const g = records.filter(i=>i.day_of_week!=='sunday').reduce((acc,i)=>{ const d=i.day_of_week; if(!acc[d])acc[d]=[]; acc[d].push(i); return acc; },{});
    Object.values(g).forEach(list=>list.sort((a,b)=>toMins(a.start_time)-toMins(b.start_time)));
    return g;
};
const EMPTY = { subject_id:'', teacher_id:'', day_of_week:'monday', start_time:'', end_time:'' };

export default function ScheduleTab({ groupId: groupIdProp }) {
    const params = useParams();
    const groupId = groupIdProp || params.id;
    const today = JS_DAY[new Date().getDay()];
    const role = useSelector(s => s.auth?.role);
    const isTeacher = role === 'teacher';

    const [trigger, { isLoading, error, refetch }] = useLazyGetGroupScheduleByGroupIdQuery();
    const [deleteSchedule, { isLoading: isDeleting }] = useDeleteGroupScheduleMutation();
    const [createSchedule, { isLoading: isCreating }] = useCreateGroupScheduleMutation();
    const { data: subjectsData, isLoading: subjectsLoading } = useGetSubjectsQuery({ limit:100 });
    const [fetchTeachers, { data: teachersData, isLoading: teachersLoading }] = useLazyGetUsersQuery();

    const [scheduleMap, setScheduleMap] = useState({});
    const [subjectsMap, setSubjectsMap] = useState({});
    const [teachersMap, setTeachersMap] = useState({});
    const subjects = subjectsData?.data?.records || [];
    const teachers  = teachersData?.data?.records || [];

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});

    useEffect(() => { if (groupId) fetchTeachers({ role:'teacher', limit:100 }); }, [groupId]);
    useEffect(() => { if (subjectsData) setSubjectsMap((subjectsData?.data?.records||[]).reduce((a,s)=>({...a,[s.id]:s.name}),{})); }, [subjectsData]);
    useEffect(() => { if (teachersData) setTeachersMap((teachersData?.data?.records||[]).reduce((a,t)=>({...a,[t.id]:t.full_name}),{})); }, [teachersData]);

    // Single fetch — use the lazy query result directly
    const [rawData, setRawData] = useState(null);
    useEffect(() => {
        if (!groupId) return;
        trigger(groupId).then(res => {
            const records = res?.data?.data || res?.data || [];
            setRawData(records);
        });
    }, [groupId]);
    useEffect(() => {
        if (rawData) setScheduleMap(groupByDay(Array.isArray(rawData) ? rawData : []));
    }, [rawData]);

    const stats = useMemo(() => {
        const all = Object.values(scheduleMap).flat();
        const totalMins = all.reduce((s,i)=>s+Math.max(0,toMins(i.end_time)-toMins(i.start_time)),0);
        return { count:all.length, hours:Math.round(totalMins/60*10)/10, teacherCount:new Set(all.map(i=>i.teacher_id)).size };
    }, [scheduleMap]);

    const handleDelete = async (item) => {
        if (isDeleting) return;
        const day = item.day_of_week;
        setScheduleMap(prev=>({ ...prev, [day]:(prev[day]||[]).filter(i=>i.id!==item.id) }));
        try {
            await deleteSchedule(item.id).unwrap();
            Alert(`"${subjectsMap[item.subject_id]||'Dars'}" o'chirildi`, 'success');
            trigger(groupId).then(res=>{ const r=res?.data?.data||res?.data||[]; setRawData(r); });
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
        if (form.start_time && form.end_time && form.start_time >= form.end_time) e.end_time="Tugash vaqti boshlanish vaqtidan kechroq bo'lishi kerak";
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
            trigger(groupId).then(res=>{ const r=res?.data?.data||res?.data||[]; setRawData(r); });
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
            {stats.count > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10 }}>
                    {[
                        { icon:BookOpen, label:'dars / hafta', val:stats.count, color:'#3b82f6' },
                        { icon:Hourglass, label:'umumiy yuklama', val:`${stats.hours} soat`, color:'#f59e0b' },
                        { icon:Users, label:"o'qituvchi", val:stats.teacherCount, color:'#10b981' },
                    ].map((c,i)=>(
                        <div key={i} style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
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
                    const items = scheduleMap[day] || [];
                    const isToday = day === today;
                    return (
                        <div key={day} style={{ borderRadius:14, overflow:'hidden', border: isToday ? '1.5px solid var(--accent)' : '1px solid var(--card-border)', background:'var(--card-bg)', boxShadow: isToday ? '0 0 0 3px var(--accent-glow)' : 'none' }}>
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
                                <button onClick={()=>{ setForm({...EMPTY,day_of_week:day}); setErrors({}); setOpen(true); }} style={{ width:26, height:26, borderRadius:7, border:'none', background:'transparent', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                                    onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-soft)';e.currentTarget.style.color='var(--accent)';}}
                                    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-muted)';}}>
                                    <Plus size={14}/>
                                </button>
                                )}
                            </div>
                            {items.length === 0 ? (
                                isTeacher ? (
                                    <div style={{ padding:'28px 0', textAlign:'center', color:'var(--text-muted)', fontSize:'0.72rem' }}>
                                        Dars yo'q
                                    </div>
                                ) : (
                                <button onClick={()=>{ setForm({...EMPTY,day_of_week:day}); setErrors({}); setOpen(true); }} style={{ width:'100%', padding:'28px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)' }}
                                    onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-soft)';e.currentTarget.style.color='var(--accent)';}}
                                    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-muted)';}}>
                                    <Plus size={16}/><span style={{ fontSize:'0.72rem' }}>Dars qo'shish</span>
                                </button>
                                )
                            ) : (
                                <div>
                                    {items.map(item => {
                                        const c = colorFor(item.subject_id);
                                        return (
                                            <div key={item.id} style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, padding:'10px 14px', borderTop:'1px solid var(--card-border)' }}
                                                className="group"
                                                onMouseEnter={e=>{e.currentTarget.style.background='var(--input-bg)'; const btn=e.currentTarget.querySelector('.del-btn'); if(btn) btn.style.opacity='1';}}
                                                onMouseLeave={e=>{e.currentTarget.style.background='transparent'; const btn=e.currentTarget.querySelector('.del-btn'); if(btn) btn.style.opacity='0';}}>                                                <div style={{ display:'flex', gap:10, minWidth:0 }}>
                                                    <div style={{ width:3, borderRadius:99, background: c.dot.includes('sky')?'#0ea5e9':c.dot.includes('violet')?'#8b5cf6':c.dot.includes('amber')?'#f59e0b':c.dot.includes('emerald')?'#10b981':c.dot.includes('rose')?'#f43f5e':'#06b6d4', flexShrink:0, alignSelf:'stretch' }}/>
                                                    <div>
                                                        <div style={{ fontSize:'0.72rem', fontWeight:600, color:'var(--accent)', marginBottom:3 }}>
                                                            <Clock size={10} style={{ display:'inline', marginRight:4 }}/>{item.start_time}–{item.end_time}
                                                        </div>
                                                        <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', marginBottom:2 }}>
                                                            {subjectsMap[item.subject_id] || item.subject_id?.slice(0,8)}
                                                        </div>
                                                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                                                            <User size={11}/>{teachersMap[item.teacher_id] || item.teacher_id?.slice(0,8)}
                                                        </div>
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
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Modal */}
            <Modal open={open} onClose={()=>setOpen(false)} title="Yangi dars qo'shish" size="sm">
                <form onSubmit={handleSubmit}>
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        <div>
                            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Fan</label>
                            <select className={`field-select no-icon${errors.subject_id?' error':''}`} value={form.subject_id} onChange={e=>setForm(p=>({...p,subject_id:e.target.value}))} disabled={subjectsLoading}>
                                <option value="">Fan tanlang</option>
                                {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {errors.subject_id && <span style={{ fontSize:'0.72rem', color:'var(--danger)' }}>{errors.subject_id}</span>}
                        </div>
                        <div>
                            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>O'qituvchi</label>
                            <select className={`field-select no-icon${errors.teacher_id?' error':''}`} value={form.teacher_id} onChange={e=>setForm(p=>({...p,teacher_id:e.target.value}))} disabled={teachersLoading}>
                                <option value="">O'qituvchi tanlang</option>
                                {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
                            </select>
                            {errors.teacher_id && <span style={{ fontSize:'0.72rem', color:'var(--danger)' }}>{errors.teacher_id}</span>}
                        </div>
                        <div>
                            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Kun</label>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                                {DAYS_ORDER.map(d=>(
                                    <button key={d} type="button" onClick={()=>setForm(p=>({...p,day_of_week:d}))} style={{ padding:'8px', borderRadius:9, border:`1.5px solid ${form.day_of_week===d?'var(--accent)':'var(--card-border)'}`, background: form.day_of_week===d?'var(--accent)':'var(--input-bg)', color: form.day_of_week===d?'#fff':'var(--text-secondary)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
                                        {DAY_SHORT[d]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                            <div>
                                <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Boshlanish</label>
                                <input type="time" value={form.start_time} onChange={e=>setForm(p=>({...p,start_time:e.target.value}))} className={`search-input${errors.start_time?' border-danger':''}`} style={{ paddingLeft:14 }}/>
                                {errors.start_time && <span style={{ fontSize:'0.72rem', color:'var(--danger)' }}>{errors.start_time}</span>}
                            </div>
                            <div>
                                <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Tugash</label>
                                <input type="time" value={form.end_time} onChange={e=>setForm(p=>({...p,end_time:e.target.value}))} className={`search-input${errors.end_time?' border-danger':''}`} style={{ paddingLeft:14 }}/>
                                {errors.end_time && <span style={{ fontSize:'0.72rem', color:'var(--danger)' }}>{errors.end_time}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={()=>setOpen(false)}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isCreating}><Plus size={14}/>{isCreating?'Saqlanmoqda...':'Qo\'shish'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
