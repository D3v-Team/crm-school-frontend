import { useState } from 'react';
import { useUnassignParentMutation } from '../../../store/services/student.api';
import { UserX, AlertTriangle } from 'lucide-react';
import { Alert } from '../../Other/UI/Alert/Alert';
import Modal from '../../Other/UI/Modal/Modal';

export default function UnassignParent({ studentId, parentName, onSuccess }) {
    const [open, setOpen] = useState(false);
    const [unassign, { isLoading }] = useUnassignParentMutation();

    const handle = async () => {
        try {
            await unassign(studentId).unwrap();
            Alert("Ota-ona ajratildi", "success");
            if (onSuccess) onSuccess();
            setOpen(false);
        } catch (err) {
            Alert(err?.data?.message || "Xatolik", "error");
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:'1.5px solid var(--danger)', background:'var(--danger-soft)', color:'var(--danger)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}
                title="Ota-onani ajratish"
            >
                <UserX size={13}/> Ajratish
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="Ota-onani ajratish" size="sm">
                <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'4px 0 8px' }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:'var(--danger-soft)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <AlertTriangle size={18} style={{ color:'var(--danger)' }}/>
                    </div>
                    <div>
                        <p style={{ fontSize:'0.875rem', color:'var(--text-primary)', marginBottom:4 }}>
                            <strong style={{ color:'var(--danger)' }}>{parentName}</strong> ota-onani bu o'quvchidan ajratmoqchisiz.
                        </p>
                        <p style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Bu amal qaytarib bo'linadi — kerak bo'lsa qayta biriktirish mumkin.</p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setOpen(false)}>Bekor qilish</button>
                    <button className="btn-delete" onClick={handle} disabled={isLoading}>
                        <UserX size={13}/> {isLoading ? 'Ajratilmoqda...' : 'Ajratish'}
                    </button>
                </div>
            </Modal>
        </>
    );
}
