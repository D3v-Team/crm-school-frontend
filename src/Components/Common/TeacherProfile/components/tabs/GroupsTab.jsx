import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import Loading from '../../../../Other/UI/Loadings/Loading';
import AddGroup from '../AddGroups';
import DeleteGroup from '../DeleteGroups';
import { useLazyGetTeacherGroupsByTeacherIdQuery } from '../../../../../store/services/theacher-group.api';

export default function GroupsTab() {
    const { id } = useParams();
    const [trigger, { data, isLoading, error }] = useLazyGetTeacherGroupsByTeacherIdQuery();

    useEffect(() => { if (id) trigger(id); }, [id]);
    const refresh = () => { if (id) trigger(id); };

    if (isLoading) return <Loading/>;
    if (error) return <div style={{ color:'var(--danger)', padding:12, background:'var(--danger-soft)', borderRadius:10 }}>Xatolik: {error?.data?.message}</div>;

    const groups = data?.data?.records || (Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);

    return (
        <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Layers size={15} style={{ color:'var(--accent)' }}/>
                    </div>
                    <span style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>Guruhlar</span>
                    {groups.length > 0 && <span style={{ fontSize:'0.72rem', background:'var(--accent-soft)', color:'var(--accent)', padding:'1px 8px', borderRadius:99, fontWeight:600 }}>{groups.length}</span>}
                </div>
                <AddGroup onAdd={refresh}/>
            </div>

            {groups.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
                    <Layers size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/>
                    <p style={{ fontSize:'0.875rem' }}>Guruh biriktirilmagan</p>
                </div>
            ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:10 }}>
                    {groups.map(item => (
                        <div key={item.teacher_group_id||item.id} className="data-card" style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:'12px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                                <div style={{ width:32, height:32, borderRadius:8, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                    <Layers size={14} style={{ color:'var(--accent)' }}/>
                                </div>
                                <div style={{ minWidth:0 }}>
                                    <Link to={`/group/${item.group?.id||item.group_id}`} style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', textDecoration:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}
                                        onMouseEnter={e=>e.target.style.color='var(--accent)'} onMouseLeave={e=>e.target.style.color='var(--text-primary)'}>
                                        {item.group?.name||"Noma'lum"}
                                    </Link>
                                    {item.group?.start_date && (
                                        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>
                                            {new Date(item.group.start_date).toLocaleDateString('uz-UZ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DeleteGroup teacherGroupId={item.teacher_group_id||item.id} groupName={item.group?.name||'Guruh'} onRemove={refresh}/>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
