import { useState } from "react";
import { useUpdateStudentStatusMutation } from "../../../../store/services/student.api";
import { Archive, ArchiveRestore, AlertTriangle } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";

export default function ArchiveStudent({ student }) {
    const [open, setOpen] = useState(false);
    const [updateStatus, { isLoading }] = useUpdateStudentStatusMutation();
    const isActive = student?.is_active ?? true;

    const handleToggle = async () => {
        try {
            await updateStatus({ id: student.id, data: { is_active: !isActive } }).unwrap();
            Alert(`${student.full_name} ${isActive ? 'arxivlandi' : 'qayta tiklandi'}`, "success");
            setOpen(false);
        } catch (err) {
            Alert(err?.data?.message || "Xatolik", "error");
        }
    };

    return (
        <>
            <button
                className="action-btn"
                onClick={() => setOpen(true)}
                title={isActive ? 'Arxivlash' : 'Qayta tiklash'}
                style={{ background: isActive ? 'rgba(245,158,11,0.12)' : 'var(--success-soft)', border: `1.5px solid var(--card-border)`, color: isActive ? '#f59e0b' : 'var(--success)' }}
            >
                {isActive ? <Archive size={14}/> : <ArchiveRestore size={14}/>}
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title={isActive ? "Arxivlashni tasdiqlang" : "Qayta tiklashni tasdiqlang"} size="sm">
                <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'4px 0 8px' }}>
                    <div style={{ width:36,height:36,borderRadius:9,background:'rgba(245,158,11,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        <AlertTriangle size={18} style={{ color:'#f59e0b' }}/>
                    </div>
                    <div>
                        <p style={{ fontSize:'0.875rem',color:'var(--text-primary)',marginBottom:4 }}>
                            <strong>{student.full_name}</strong> {isActive ? 'arxivlanadi' : 'qayta tiklanadi'}.
                        </p>
                        <p style={{ fontSize:'0.78rem',color:'var(--text-muted)' }}>
                            {isActive ? 'Arxivlangan o\'quvchi faol ro\'yxatlarda ko\'rinmaydi.' : 'Faol ro\'yxatga qaytadi.'}
                        </p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setOpen(false)}>Bekor qilish</button>
                    <button onClick={handleToggle} disabled={isLoading}
                        style={{ padding:'8px 22px', borderRadius:8, border:'none', background: isActive ? '#f59e0b' : 'var(--success)', color:'#fff', fontSize:'0.875rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                        {isActive ? <Archive size={14}/> : <ArchiveRestore size={14}/>}
                        {isLoading ? 'Saqlanmoqda...' : isActive ? 'Arxivlash' : 'Qayta tiklash'}
                    </button>
                </div>
            </Modal>
        </>
    );
}
