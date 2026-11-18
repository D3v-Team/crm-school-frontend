import { useState } from "react";
import { useUpdateStudentStatusMutation } from "../../../../store/services/student.api";
import { Archive, ArchiveRestore, AlertTriangle } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import { getErrorMessage } from "../../../../utils/errors";

export default function ArchiveStudent({ student }) {
    const [open, setOpen] = useState(false);
    const [updateStatus, { isLoading }] = useUpdateStudentStatusMutation();
    const isActive = student?.is_active ?? true;

    const handleToggle = async () => {
        try {
            const response = await updateStatus({ id: student.id, data: { is_active: !isActive } }).unwrap();
            Alert(response?.message || `${student.full_name} ${isActive ? 'arxivlandi' : 'arxivdan chiqarildi'}`, "success");
            setOpen(false);
        } catch (err) {
            Alert(getErrorMessage(err), "error");
        }
    };

    return (
        <>
            <button
                className="action-btn"
                onClick={() => setOpen(true)}
                title={isActive ? 'Arxivlash' : 'Arxivdan qaytarish'}
                style={{ background: isActive ? 'rgba(245,158,11,0.12)' : 'var(--success-soft)', border: `1.5px solid var(--card-border)`, color: isActive ? '#f59e0b' : 'var(--success)' }}
            >
                {isActive ? <Archive size={14}/> : <ArchiveRestore size={14}/>}
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title={isActive ? "Arxivlashni tasdiqlang" : "Arxivdan qaytarishni tasdiqlang"} size="sm">
                <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'4px 0 8px' }}>
                    <div style={{ width:36,height:36,borderRadius:9,background:'rgba(245,158,11,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        <AlertTriangle size={18} style={{ color:'#f59e0b' }}/>
                    </div>
                    <div>
                        <p style={{ fontSize:'0.875rem',color:'var(--text-primary)',marginBottom:4 }}>
                            <strong>{student.full_name}</strong> {isActive ? 'arxivga o\'tkaziladi' : 'arxivdan qaytariladi'}.
                        </p>
                        <p style={{ fontSize:'0.78rem',color:'var(--text-muted)' }}>
                            {isActive
                                ? "Ma'lumotlari (davomat, baho, to'lov, guruhlari) saqlanadi, kerak bo'lsa arxivdan qaytarish mumkin."
                                : "Faol ro'yxatga va o'z guruhlariga avtomatik qaytadi — qayta biriktirish shart emas."}
                        </p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setOpen(false)}>Bekor qilish</button>
                    <button onClick={handleToggle} disabled={isLoading}
                        style={{ padding:'8px 22px', borderRadius:8, border:'none', background: isActive ? '#f59e0b' : 'var(--success)', color:'#fff', fontSize:'0.875rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                        {isActive ? <Archive size={14}/> : <ArchiveRestore size={14}/>}
                        {isLoading ? 'Saqlanmoqda...' : isActive ? 'Arxivlash' : 'Arxivdan qaytarish'}
                    </button>
                </div>
            </Modal>
        </>
    );
}
