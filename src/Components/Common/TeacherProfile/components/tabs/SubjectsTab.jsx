import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import AddSubject from '../AddSubject';
import DeleteSubject from '../DeleteSubject';
import { useLazyGetTeacherSubjectsByTeacherIdQuery } from '../../../../../store/services/teacher-subject.api';
import Loading from '../../../../Other/UI/Loadings/Loading';

export default function SubjectsTab() {
    const { id } = useParams();
    const [trigger, { data, isLoading, error }] = useLazyGetTeacherSubjectsByTeacherIdQuery();

    useEffect(() => { if (id) trigger(id); }, [id]);
    const refresh = () => { if (id) trigger(id); };

    if (isLoading) return <Loading/>;
    if (error) return <div style={{ color:'var(--danger)', padding:12, background:'var(--danger-soft)', borderRadius:10 }}>Xatolik: {error?.data?.message}</div>;

    const subjects = data?.data || [];

    return (
        <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <BookOpen size={15} style={{ color:'var(--accent)' }}/>
                    </div>
                    <span style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>Fanlar</span>
                    {subjects.length > 0 && <span style={{ fontSize:'0.72rem', background:'var(--accent-soft)', color:'var(--accent)', padding:'1px 8px', borderRadius:99, fontWeight:600 }}>{subjects.length}</span>}
                </div>
                <AddSubject onAdd={refresh}/>
            </div>

            {subjects.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
                    <BookOpen size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/>
                    <p style={{ fontSize:'0.875rem' }}>Fan biriktirilmagan</p>
                    <p style={{ fontSize:'0.78rem', marginTop:4 }}>Qo'shish tugmasini bosing</p>
                </div>
            ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:10 }}>
                    {subjects.map(item => (
                        <div key={item.teacher_subject_id} className="data-card" style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:'12px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                                <div style={{ width:32, height:32, borderRadius:8, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                    <BookOpen size={14} style={{ color:'var(--accent)' }}/>
                                </div>
                                <div style={{ minWidth:0 }}>
                                    <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                        {item.subject?.name||"Noma'lum"}
                                    </div>
                                    {item.subject?.createdAt && (
                                        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>
                                            {new Date(item.subject.createdAt).toLocaleDateString('uz-UZ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DeleteSubject teacherSubjectId={item.teacher_subject_id} subjectName={item.subject?.name||'Fan'} onRemove={refresh}/>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
