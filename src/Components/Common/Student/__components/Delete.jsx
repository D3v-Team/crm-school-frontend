import { useState } from "react";
import { useDeleteStudentMutation } from "../../../../store/services/student.api";
import { Trash, AlertTriangle } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import { getErrorMessage } from "../../../../utils/errors";

/* DELETE /student/:id endi o'quvchini arxivga o'tkazadi (ma'lumotlari saqlanadi). */

export default function Delete({ student }) {
    const [open, setOpen] = useState(false);
    const [deleteStudent, { isLoading }] = useDeleteStudentMutation();

    const handleDelete = async () => {
        try {
            const response = await deleteStudent(student.id).unwrap();
            Alert(response?.message || `${student.full_name} arxivga o'tkazildi`, "success");
            setOpen(false);
        } catch (err) {
            Alert(getErrorMessage(err), "error");
        }
    };

    return (
        <>
            <button className="action-btn action-btn-danger" onClick={() => setOpen(true)} title="O'chirish">
                <Trash size={14} />
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="O'chirishni tasdiqlang" size="sm">
                {/* Warning card */}
                <div
                    style={{
                        background: 'var(--danger-soft)',
                        border: '1px solid var(--danger)',
                        borderRadius: 12,
                        padding: '16px',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        marginBottom: 8,
                    }}
                >
                    <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 4 }}>
                            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{student.full_name}</span> o'quvchini o'chirmoqchisiz.
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            O&apos;quvchi arxivga o&apos;tkaziladi. Ma&apos;lumotlari saqlanadi, kerak bo&apos;lsa arxivdan qaytarish mumkin.
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setOpen(false)} disabled={isLoading}>
                        Bekor qilish
                    </button>
                    <button className="btn-delete" onClick={handleDelete} disabled={isLoading}>
                        {isLoading ? "O'chirilmoqda..." : (
                            <><Trash size={14} /> O'chirish</>
                        )}
                    </button>
                </div>
            </Modal>
        </>
    );
}
