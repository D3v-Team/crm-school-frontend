import { useState, useEffect } from 'react';
import { useAssignParentMutation, useLazyGetStudentsQuery } from '../../../../store/services/student.api';
import { Search, UserPlus, X, User } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import Modal from '../../../Other/UI/Modal/Modal';
import Loading from '../../../Other/UI/Loadings/Loading';

export default function AddChildren({ parentId, onAdd }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState([]);

    const [fetchStudents, { data, isLoading }] = useLazyGetStudentsQuery();
    const [assignParent, { isLoading: isAssigning }] = useAssignParentMutation();

    useEffect(() => {
        if (open) fetchStudents({ limit:100, ...(search && { search }) });
    }, [open, search]);

    useEffect(() => {
        if (data) setStudents((data?.data?.records||[]).filter(s=>!s.parent_id));
    }, [data]);

    const handleClose = () => { setOpen(false); setSearch(''); setStudents([]); };

    const handleAssign = async (studentId) => {
        try {
            await assignParent({ id:studentId, data:{ parent_id:parentId } }).unwrap();
            Alert("O'quvchi biriktirildi",'success');
            if (onAdd) onAdd();
            setStudents(prev=>prev.filter(s=>s.id!==studentId));
        } catch(err){ Alert(err?.data?.message||'Xatolik','error'); }
    };

    if (!parentId) return null;

    const filtered = students.filter(s =>
        s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search)
    );

    return (
        <>
            <button className="action-btn action-btn-success" onClick={()=>setOpen(true)} title="Farzand qo'shish">
                <UserPlus size={14}/>
            </button>
            <Modal open={open} onClose={handleClose} title="Farzand qo'shish" size="md">
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    <div style={{ position:'relative' }}>
                        <Search size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none' }}/>
                        <input type="text" placeholder="Ism yoki telefon bo'yicha..." value={search} onChange={e=>setSearch(e.target.value)}
                            className="search-input" style={{ paddingLeft:38 }}/>
                        {search && <button onClick={()=>setSearch('')} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)' }}><X size={14}/></button>}
                    </div>

                    {isLoading ? <Loading/> : filtered.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)' }}>
                            <User size={36} style={{ opacity:.2, margin:'0 auto 10px' }}/>
                            <p style={{ fontSize:'0.875rem' }}>{search ? "Topilmadi" : "Barcha o'quvchilar biriktirilgan"}</p>
                        </div>
                    ) : (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:8, maxHeight:340, overflowY:'auto' }}>
                            {filtered.map(s => (
                                <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'10px 14px', borderRadius:10, border:'1px solid var(--card-border)', background:'var(--input-bg)' }}
                                    onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--card-border)'}>
                                    <div style={{ minWidth:0 }}>
                                        <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.full_name}</div>
                                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{s.phone||"Telefon yo'q"}</div>
                                    </div>
                                    <button onClick={()=>handleAssign(s.id)} disabled={isAssigning}
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
