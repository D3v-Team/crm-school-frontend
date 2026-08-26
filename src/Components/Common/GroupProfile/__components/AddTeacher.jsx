import { useState, useEffect } from 'react';
import { useLazyGetUsersQuery } from '../../../../store/services/user.api';
import { useCreateTeacherGroupMutation } from '../../../../store/services/theacher-group.api';
import { UserPlus, Search, X, User } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import Modal from '../../../Other/UI/Modal/Modal';
import Loading from '../../../Other/UI/Loadings/Loading';

export default function AddTeacherToGroup({ groupId, onAdd }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [fetchTeachers, { data, isLoading }] = useLazyGetUsersQuery();
    const [addTeacher, { isLoading: isAdding }] = useCreateTeacherGroupMutation();

    useEffect(() => {
        if (open) fetchTeachers({ role:'teacher', limit:100, ...(search&&{ search }) });
    }, [open, search]);

    useEffect(() => { if (data) setTeachers(data?.data?.records||[]); }, [data]);

    const handleClose = () => { setOpen(false); setSearch(''); setTeachers([]); };

    const handleAdd = async (teacherId) => {
        try {
            await addTeacher({ teacher_id:teacherId, group_id:groupId }).unwrap();
            Alert("O'qituvchi qo'shildi", 'success');
            if (onAdd) onAdd();
            setTeachers(prev=>prev.filter(t=>t.id!==teacherId));
        } catch(err){ Alert(err?.data?.message||'Xatolik','error'); }
    };

    return (
        <>
            <button className="btn-create" style={{ fontSize:'0.78rem', padding:'6px 14px' }} onClick={()=>setOpen(true)}>
                <UserPlus size={14}/> Qo'shish
            </button>
            <Modal open={open} onClose={handleClose} title="O'qituvchi qo'shish" size="md">
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    <div style={{ position:'relative' }}>
                        <Search size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none' }}/>
                        <input type="text" placeholder="Ism yoki username..." value={search} onChange={e=>setSearch(e.target.value)}
                            className="search-input" style={{ paddingLeft:38 }}/>
                        {search && <button onClick={()=>setSearch('')} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)' }}><X size={14}/></button>}
                    </div>
                    {isLoading ? <Loading/> : teachers.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)' }}>
                            <User size={36} style={{ opacity:.2, margin:'0 auto 10px' }}/><p style={{ fontSize:'0.875rem' }}>Topilmadi</p>
                        </div>
                    ) : (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:8, maxHeight:340, overflowY:'auto' }}>
                            {teachers.map(t => (
                                <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'10px 14px', borderRadius:10, border:'1px solid var(--card-border)', background:'var(--input-bg)' }}
                                    onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--card-border)'}>
                                    <div style={{ minWidth:0 }}>
                                        <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.full_name}</div>
                                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{t.username||''}</div>
                                    </div>
                                    <button onClick={()=>handleAdd(t.id)} disabled={isAdding}
                                        style={{ width:30,height:30,borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
                                        <UserPlus size={13}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={handleClose}>Yopish</button>
                </div>
            </Modal>
        </>
    );
}
