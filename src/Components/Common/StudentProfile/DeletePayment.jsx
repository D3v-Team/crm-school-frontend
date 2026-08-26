import { useState } from "react";
import { Trash, AlertTriangle } from "lucide-react";
import { useDeletePaymentMutation } from "../../../store/services/payment.api";
import { Alert } from "../../Other/UI/Alert/Alert";
import Modal from "../../Other/UI/Modal/Modal";

export default function DeletePayment({ paymentId, onDelete }) {
    const [open, setOpen] = useState(false);
    const [deletePayment, { isLoading }] = useDeletePaymentMutation();

    const handleDelete = async () => {
        try {
            await deletePayment(paymentId).unwrap();
            Alert("To'lov o'chirildi", "success");
            if (onDelete) onDelete();
            setOpen(false);
        } catch (err) {
            Alert(err?.data?.message || "Xatolik", "error");
        }
    };

    return (
        <>
            <button className="action-btn action-btn-danger" onClick={() => setOpen(true)} title="O'chirish"><Trash size={13} /></button>
            <Modal open={open} onClose={() => setOpen(false)} title="To'lovni o'chirish" size="sm">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '4px 0 8px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>Ushbu to'lov yozuvini o'chirmoqchimisiz?</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Bu amalni qaytarib bo'lmaydi.</p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setOpen(false)}>Bekor qilish</button>
                    <button className="btn-delete" onClick={handleDelete} disabled={isLoading}>
                        <Trash size={13} /> {isLoading ? "O'chirilmoqda..." : "O'chirish"}
                    </button>
                </div>
            </Modal>
        </>
    );
}
