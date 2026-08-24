import { useState } from "react";
import { useDeleteGroupMutation } from "../../../../store/services/group.api";
import { Trash, AlertTriangle } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";

export default function Delete({ group }) {
    const [open, setOpen] = useState(false);
    const [deleteGroup, { isLoading }] = useDeleteGroupMutation();

    const handleDelete = async () => {
        try {
            await deleteGroup(group.id).unwrap();
            Alert(`"${group.name}" o'chirildi`, "success");
            setOpen(false);
        } catch (err) {
            Alert(err?.data?.message || "Xatolik yuz berdi", "error");
        }
    };

    return (
        <>
            <button className="action-btn action-btn-danger" onClick={() => setOpen(true)} title="O'chirish">
                <Trash size={14} />
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="O'chirishni tasdiqlang" size="sm">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '4px 0 8px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                            <strong style={{ color: 'var(--danger)' }}>{group.name}</strong> guruhini o'chirmoqchisiz.
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Bu amalni qaytarib bo'lmaydi.</p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setOpen(false)}>Bekor qilish</button>
                    <button className="btn-delete" onClick={handleDelete} disabled={isLoading}>
                        <Trash size={14} /> {isLoading ? "O'chirilmoqda..." : "O'chirish"}
                    </button>
                </div>
            </Modal>
        </>
    );
}
