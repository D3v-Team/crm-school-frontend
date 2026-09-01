import { useEffect, useState } from 'react';
import {
    useGetMyWeekTopicsQuery,
    useCreateWeeklyTopicMutation,
    useUpdateWeeklyTopicMutation,
    useDeleteWeeklyTopicMutation,
} from '../../../../store/services/weekly-topic.api';
import { useLazyGetTeacherGroupsByTeacherIdQuery } from '../../../../store/services/theacher-group.api';
import {
    BookOpen, ChevronLeft, ChevronRight, CalendarDays,
    Layers, Check, X, Pencil, Trash2, Plus, Clock,
} from 'lucide-react';
import Loading from '../../../Other/UI/Loadings/Loading';
import { Alert } from '../../../Other/UI/Alert/Alert';

/* ── helpers ── */
const padZ = (n) => String(n).padStart(2, '0');
const fmt  = (d) => `${d.getFullYear()}-${padZ(d.getMonth()+1)}-${padZ(d.getDate())}`;
const getMondayOf = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    return fmt(d);
};
const getSundayOf = (mondayStr) => {
    const d = new Date(mondayStr);
    d.setDate(d.getDate() + 6);
    return fmt(d);
};
const fmtDisplay = (s) => {
    if (!s) return '';
    const [y, m, dd] = s.split('-');
    return `${dd}.${m}.${y}`;
};
const DAY_NAMES = { 0:'Yak', 1:'Dush', 2:'Sesh', 3:'Chor', 4:'Pay', 5:'Jum', 6:'Shan' };
const DAY_FULL  = { monday:'Dushanba', tuesday:'Seshanba', wednesday:'Chorshanba', thursday:'Payshanba', friday:'Juma', saturday:'Shanba', sunday:'Yakshanba' };

/* ── Inline topic editor per lesson ── */
function TopicRow({ lesson, weekStart, onSaved }) {
    const [editing, setEditing] = useState(false);
    const [text, setText]       = useState('');
    const [saving, setSaving]   = useState(false);

    const [createTopic] = useCreateWeeklyTopicMutation();
    const [updateTopic] = useUpdateWeeklyTopicMutation();
    const [deleteTopic] = useDeleteWeeklyTopicMutation();

    const hasNoTopic = !lesson.topic_id || !lesson.topic;
    const color = hasNoTopic ? 'var(--warning)' : 'var(--accent)';
    const softBg = hasNoTopic ? 'var(--warning-soft)' : 'var(--accent-soft)';

    const startEdit = () => { setText(lesson.topic || ''); setEditing(true); };
    const cancel    = () => setEditing(false);

    const save = async () => {
        if (!text.trim()) return Alert("Mavzu nomini kiriting", 'warning');
        setSaving(true);
        try {
            if (lesson.topic_id) {
                await updateTopic({ id: lesson.topic_id, data: { topic: text.trim() } }).unwrap();
                Alert("Mavzu yangilandi", 'success');
            } else {
                await createTopic({
                    group_schedule_id: lesson.group_schedule_id,
                    week_start_date:   weekStart,
                    topic:             text.trim(),
                }).unwrap();
                Alert("Mavzu qo'shildi", 'success');
            }
            onSaved();
            setEditing(false);
        } catch (e) { Alert(e?.data?.message || 'Xatolik', 'error'); }
        finally { setSaving(false); }
    };

    const remove = async () => {
        if (!lesson.topic_id) return;
        setSaving(true);
        try {
            await deleteTopic(lesson.topic_id).unwrap();
            Alert("Mavzu o'chirildi", 'success');
            onSaved();
        } catch (e) { Alert(e?.data?.message || 'Xatolik', 'error'); }
        finally { setSaving(false); }
    };

    return (
        <div style={{
            background: 'var(--card-bg)',
            border: `1.5px solid ${hasNoTopic ? 'var(--warning)' : 'var(--card-border)'}`,
            borderRadius: 14, overflow: 'hidden',
            transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = hasNoTopic ? 'var(--warning)' : 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = hasNoTopic ? 'var(--warning)' : 'var(--card-border)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background: softBg, borderBottom: editing ? '1px solid var(--card-border)' : 'none' }}>
                <div style={{ width:36, height:36, borderRadius:9, flexShrink:0, background:color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <BookOpen size={16} style={{ color:'#fff' }}/>
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                    {/* Fan + guruh */}
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                        {lesson.subject_name && (
                            <span style={{ fontSize:'0.72rem', fontWeight:700, color, background: softBg, padding:'2px 8px', borderRadius:6, border:`1px solid ${color}`, display:'flex', alignItems:'center', gap:3 }}>
                                <BookOpen size={10}/> {lesson.subject_name}
                            </span>
                        )}
                        {lesson.group_name && (
                            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', background:'var(--input-bg)', padding:'2px 8px', borderRadius:6, border:'1px solid var(--card-border)', display:'flex', alignItems:'center', gap:3 }}>
                                <Layers size={10}/> {lesson.group_name}
                            </span>
                        )}
                        {lesson.day_of_week && (
                            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', background:'var(--input-bg)', padding:'2px 8px', borderRadius:6, border:'1px solid var(--card-border)', display:'flex', alignItems:'center', gap:3 }}>
                                <CalendarDays size={10}/> {DAY_FULL[lesson.day_of_week] || lesson.day_of_week}
                            </span>
                        )}
                    </div>

                    {/* Topic yoki "Mavzu yo'q" */}
                    {!editing && (
                        <div style={{ fontSize:'0.875rem', fontWeight:700, color: hasNoTopic ? 'var(--warning)' : 'var(--text-primary)' }}>
                            {hasNoTopic
                                ? <span style={{ fontStyle:'italic' }}>Mavzu belgilanmagan</span>
                                : lesson.topic
                            }
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!editing && (
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button onClick={startEdit}
                            title={lesson.topic_id ? 'Tahrirlash' : "Mavzu qo'shish"}
                            style={{ width:32, height:32, borderRadius:8, border:'none', background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.15s' }}
                            onMouseEnter={e=>{ e.currentTarget.style.background='var(--accent)'; e.currentTarget.style.color='#fff'; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background='var(--accent-soft)'; e.currentTarget.style.color='var(--accent)'; }}>
                            {lesson.topic_id ? <Pencil size={13}/> : <Plus size={13}/>}
                        </button>
                        {lesson.topic_id && (
                            <button onClick={remove} disabled={saving}
                                title="O'chirish"
                                style={{ width:32, height:32, borderRadius:8, border:'none', background:'var(--danger-soft)', color:'var(--danger)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.15s' }}
                                onMouseEnter={e=>{ e.currentTarget.style.background='var(--danger)'; e.currentTarget.style.color='#fff'; }}
                                onMouseLeave={e=>{ e.currentTarget.style.background='var(--danger-soft)'; e.currentTarget.style.color='var(--danger)'; }}>
                                <Trash2 size={13}/>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Edit form */}
            {editing && (
                <div style={{ padding:'12px 16px', display:'flex', gap:8, alignItems:'flex-start' }}>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); save(); } if (e.key==='Escape') cancel(); }}
                        placeholder="Mavzu nomini kiriting..."
                        rows={2}
                        autoFocus
                        style={{
                            flex:1, padding:'8px 12px', borderRadius:9, fontSize:'0.875rem',
                            border:'1.5px solid var(--accent)', background:'var(--input-bg)',
                            color:'var(--input-text)', outline:'none', resize:'vertical',
                        }}
                    />
                    <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                        <button onClick={save} disabled={saving}
                            style={{ width:34, height:34, borderRadius:8, border:'none', background:'var(--success)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity:saving?0.7:1 }}>
                            <Check size={15}/>
                        </button>
                        <button onClick={cancel}
                            style={{ width:34, height:34, borderRadius:8, border:'none', background:'var(--danger-soft)', color:'var(--danger)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <X size={15}/>
                        </button>
                    </div>
                </div>
            )}

            {/* Lesson dates */}
            {(lesson.lesson_dates||[]).length > 0 && !editing && (
                <div style={{ padding:'8px 16px', display:'flex', flexWrap:'wrap', gap:6, alignItems:'center', borderTop:'1px solid var(--card-border)' }}>
                    <span style={{ fontSize:'0.68rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                        <Clock size={11}/> Dars kunlari:
                    </span>
                    {lesson.lesson_dates.map((date, di) => {
                        const dow = new Date(date).getDay();
                        return (
                            <span key={di} style={{ fontSize:'0.68rem', fontWeight:600, padding:'2px 8px', borderRadius:6, background:'var(--input-bg)', border:'1px solid var(--card-border)', color:'var(--text-primary)', display:'flex', alignItems:'center', gap:3 }}>
                                <span style={{ color:'var(--text-muted)' }}>{DAY_NAMES[dow]}</span>
                                {fmtDisplay(date)}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── Main ── */
export default function TeacherTopics({ teacherId }) {
    const [weekStart, setWeekStart] = useState(getMondayOf(new Date()));
    const [selectedGroupId, setSelectedGroupId] = useState('');

    /* Groups filter */
    const [fetchGroups, { data: groupsData }] = useLazyGetTeacherGroupsByTeacherIdQuery();
    useEffect(() => { if (teacherId) fetchGroups(teacherId); }, [teacherId]);
    const groups = groupsData?.data?.records || groupsData?.data || [];

    /* Topics — /my-week qaytaradi: har bir group_schedule_id uchun alohida qator */
    const { data: topicsData, isLoading, error, refetch } = useGetMyWeekTopicsQuery(
        { week_start_date: weekStart },
        { skip: !teacherId }
    );

    const rawTopics = topicsData?.data?.records || topicsData?.data || [];

    /* Group filter */
    const topics = selectedGroupId
        ? rawTopics.filter(t => t.group_id === selectedGroupId)
        : rawTopics;

    const changeWeek = (dir) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + dir * 7);
        setWeekStart(fmt(d));
    };

    const weekEnd = getSundayOf(weekStart);

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Toolbar */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <button onClick={() => changeWeek(-1)} style={{ width:34, height:34, borderRadius:9, border:'1.5px solid var(--card-border)', background:'var(--input-bg)', color:'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <ChevronLeft size={16}/>
                </button>
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:9, border:'1px solid var(--card-border)', background:'var(--input-bg)', minWidth:210, justifyContent:'center' }}>
                    <CalendarDays size={13} style={{ color:'var(--accent)', flexShrink:0 }}/>
                    <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)' }}>
                        {new Date(weekStart).toLocaleDateString('uz-UZ', { day:'2-digit', month:'long' })}
                        {' – '}
                        {new Date(weekEnd).toLocaleDateString('uz-UZ', { day:'2-digit', month:'long', year:'numeric' })}
                    </span>
                </div>
                <button onClick={() => changeWeek(1)} style={{ width:34, height:34, borderRadius:9, border:'1.5px solid var(--card-border)', background:'var(--input-bg)', color:'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <ChevronRight size={16}/>
                </button>

                {/* Group filter */}
                <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}
                    style={{ padding:'8px 12px', background:'var(--input-bg)', border:'1.5px solid var(--input-border)', borderRadius:9, color:'var(--input-text)', fontSize:'0.82rem', outline:'none', cursor:'pointer', minWidth:160 }}>
                    <option value="">Barcha guruhlar</option>
                    {groups.map(item => { const g = item.group || item; return <option key={g.id} value={g.id}>{g.name}</option>; })}
                </select>

                {/* Stats */}
                {rawTopics.length > 0 && (
                    <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                        <span style={{ fontSize:'0.72rem', fontWeight:600, padding:'5px 10px', borderRadius:99, background:'var(--accent-soft)', color:'var(--accent)' }}>
                            {rawTopics.filter(t => t.topic_id).length}/{rawTopics.length} mavzu
                        </span>
                        {rawTopics.some(t => !t.topic_id) && (
                            <span style={{ fontSize:'0.72rem', fontWeight:600, padding:'5px 10px', borderRadius:99, background:'var(--warning-soft)', color:'var(--warning)' }}>
                                {rawTopics.filter(t => !t.topic_id).length} ta kiritilmagan
                            </span>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div style={{ color:'var(--danger)', padding:12, background:'var(--danger-soft)', borderRadius:10 }}>
                    Xatolik: {error?.data?.message}
                </div>
            )}

            {isLoading ? <Loading/> : topics.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-muted)' }}>
                    <BookOpen size={48} style={{ opacity:.2, margin:'0 auto 12px', display:'block' }}/>
                    <p>Bu hafta darslar topilmadi</p>
                </div>
            ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {topics.map((lesson, i) => (
                        <TopicRow
                            key={lesson.group_schedule_id || i}
                            lesson={lesson}
                            weekStart={weekStart}
                            onSaved={refetch}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
