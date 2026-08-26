import { useParams, NavLink } from 'react-router-dom';
import { useLazyGetTeacherGroupsByGroupIdQuery } from '../../../../store/services/theacher-group.api';
import { useLazyGetTeacherSubjectsByTeacherIdQuery } from '../../../../store/services/teacher-subject.api';
import { useEffect, useState } from 'react';
import { Users, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import AddTeacherToGroup from './AddTeacher';
import DeleteTeacherGroup from './DeleteTeacher';
import Loading from '../../../Other/UI/Loadings/Loading';

/* Per-teacher subjects badge list */
function TeacherSubjects({ teacherId }) {
    const [open, setOpen] = useState(false);
    const [fetch, { data, isLoading }] = useLazyGetTeacherSubjectsByTeacherIdQuery();

    useEffect(() => {
        if (teacherId) fetch(teacherId);
    }, [teacherId]);

    const subjects = data?.data || [];

    if (isLoading) return (
        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Yuklanmoqda...</div>
    );

    if (!subjects.length) return (
        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontStyle:'italic' }}>Fan biriktirilmagan</div>
    );

    return (
        <div style={{ marginTop:6 }}>
            <button
                onClick={() => setOpen(p => !p)}
                style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'var(--accent)', fontSize:'0.72rem', fontWeight:600, padding:0 }}
            >
                <BookOpen size={11}/>
                {subjects.length} ta fan
                {open ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
            </button>
            {open && (
                <div style={{ marginTop:6, display:'flex', flexWrap:'wrap', gap:4 }}>
                    {subjects.map(item => (
                        <span key={item.teacher_subject_id || item.id}
                            style={{ fontSize:'0.68rem', fontWeight:600, padding:'2px 8px', borderRadius:99, background:'var(--accent-soft)', color:'var(--accent)' }}>
                            {item.subject?.name || '—'}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function TeachersTab() {
    const { id: groupId } = useParams();
    const [trigger, { data, isLoading, error }] = useLazyGetTeacherGroupsByGroupIdQuery();

    useEffect(() => { if (groupId) trigger(groupId); }, [groupId]);
    const refresh = () => { if (groupId) trigger(groupId); };

    const teachers = data?.data?.records || data?.data || [];

    if (isLoading) return <Loading/>;
    if (error) return (
        <div style={{ color:'var(--danger)', padding:12, background:'var(--danger-soft)', borderRadius:10 }}>
            Xatolik: {error?.data?.message}
        </div>
    );

    return (
        <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:30,height:30,borderRadius:8,background:'var(--accent-soft)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                        <Users size={15} style={{ color:'var(--accent)' }}/>
                    </div>
                    <span style={{ fontSize:'0.875rem',fontWeight:600,color:'var(--text-primary)' }}>O'qituvchilar</span>
                    {teachers.length > 0 && (
                        <span style={{ fontSize:'0.72rem',background:'var(--accent-soft)',color:'var(--accent)',padding:'1px 8px',borderRadius:99,fontWeight:600 }}>
                            {teachers.length}
                        </span>
                    )}
                </div>
                <AddTeacherToGroup groupId={groupId} onAdd={refresh}/>
            </div>

            {teachers.length === 0 ? (
                <div style={{ textAlign:'center',padding:'40px 0',color:'var(--text-muted)' }}>
                    <Users size={40} style={{ opacity:.2,margin:'0 auto 10px' }}/>
                    <p style={{ fontSize:'0.875rem' }}>O'qituvchi biriktirilmagan</p>
                </div>
            ) : (
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))',gap:12 }}>
                    {teachers.map(item => (
                        <div key={item.id} style={{
                            padding:'14px 16px', borderRadius:12,
                            border:'1px solid var(--card-border)', background:'var(--card-bg)',
                            transition:'border-color 0.15s',
                        }}
                            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--card-border)'}>
                            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:10 }}>
                                <div style={{ display:'flex',alignItems:'center',gap:10,minWidth:0,flex:1 }}>
                                    {/* Avatar initials */}
                                    <div style={{ width:38,height:38,borderRadius:10,background:'var(--accent-soft)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.9rem',flexShrink:0 }}>
                                        {(item.teacher?.full_name||'?').charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ minWidth:0 }}>
                                        {/* Name — link to teacher profile */}
                                        <NavLink to={`/teacher/${item.teacher?.id || item.teacher_id}`}
                                            style={{ fontSize:'0.875rem',fontWeight:600,color:'var(--text-primary)',textDecoration:'none',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}
                                            onMouseEnter={e=>e.target.style.color='var(--accent)'}
                                            onMouseLeave={e=>e.target.style.color='var(--text-primary)'}>
                                            {item.teacher?.full_name || "Noma'lum"}
                                        </NavLink>
                                        <div style={{ fontSize:'0.72rem',color:'var(--text-muted)',marginTop:1 }}>
                                            {item.teacher?.username || ''}
                                            {item.teacher?.phone && (
                                                <span style={{ marginLeft:6 }}>· {item.teacher.phone}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <DeleteTeacherGroup
                                    teacherGroupId={item.id}
                                    teacherName={item.teacher?.full_name}
                                    onSuccess={refresh}
                                />
                            </div>
                            {/* Teacher subjects */}
                            {item.teacher?.id && <TeacherSubjects teacherId={item.teacher.id}/>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
