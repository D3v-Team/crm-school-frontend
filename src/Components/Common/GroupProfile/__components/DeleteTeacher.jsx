import { useState } from 'react';
import { useDeleteTeacherGroupMutation } from '../../../../store/services/theacher-group.api';
import { Trash, AlertTriangle } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import Modal from '../../../Other/UI/Modal/Modal';

export default function DeleteTeacherGroup({ teacherGroupId, teacherName, onSuccess }) {
    const [open, setOpen] = useState(false);
    const [deleteTeacherGroup, { isLoading }] = useDeleteTeacherGroupMutation();

    const handleDelete = async () => {
        if (!teacherGroupId) { Alert('ID mavjud emas','error'); return; }
        try {
            await deleteTeacherGroup(teacherGroupId).unwrap();
            Alert(`"${teacherName}" olib tashlandi`,'success');
            if (onSuccess) onSuccess();
            setOpen(false);
        } catch(err){ Alert(err?.data?.message||'Xatolik','error'); }
    };

    return (
        <>
            <button className="action-btn action-btn-danger" onClick={()=>setOpen(true)} title="Olib tashlash"><Trash size={13}/></button>
            <Modal open={open} onClose={()=>setOpen(false)} title="O'qituvchini olib tashlash" size="sm">
                <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'4px 0 8px' }}>
                    <div style={{ width:36,height:36,borderRadius:9,background:'var(--danger-soft)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        <AlertTriangle size={18} style={{ color:'var(--danger)' }}/>
                    </div>
                    <div>
                        <p style={{ fontSize:'0.875rem',color:'var(--text-primary)',marginBottom:4 }}>
                            <strong style={{ color:'var(--danger)' }}>{teacherName}</strong> ni guruhdan olib tashlamoqchisiz.
                        </p>
                        <p style={{ fontSize:'0.78rem',color:'var(--text-muted)' }}>Bu amalni qaytarib bo'lmaydi.</p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={()=>setOpen(false)}>Bekor qilish</button>
                    <button className="btn-delete" onClick={handleDelete} disabled={isLoading}>
                        <Trash size={13}/>{isLoading?"O'chirilmoqda...":"Olib tashlash"}
                    </button>
                </div>
            </Modal>
        </>
    );
}
