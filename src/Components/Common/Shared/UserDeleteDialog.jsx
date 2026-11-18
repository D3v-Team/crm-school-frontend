/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Layers, Trash } from "lucide-react";
import Modal from "../../Other/UI/Modal/Modal";
import { Alert } from "../../Other/UI/Alert/Alert";
import { useDeleteUserMutation } from "../../../store/services/user.api";
import { getErrorMessage, getErrorStatus } from "../../../utils/errors";

/* O'chirish endi arxivlash: foydalanuvchi tizimdan chiqariladi, tarix saqlanadi. */
export const USER_DELETE_NOTICE = "Foydalanuvchi tizimdan chiqariladi va ro'yxatlardan yo'qoladi. Uning davomat va baho tarixi saqlanadi.";

/* Guruhi bor o'qituvchini backend o'chirmaydi: 400 "Bu o'qituvchiga N ta guruh biriktirilgan: ..." */
const isTeacherHasGroups = (error) =>
    getErrorStatus(error) === 400 && /guruh biriktirilgan/i.test(getErrorMessage(error, ""));

/**
 * Foydalanuvchini o'chirish (arxivlash) tasdiqlash oynasi.
 * Props: user, onClose(deleted: boolean), subject — "o'qituvchini", "ota-onani"..., extra — qo'shimcha ogohlantirish.
 */
export default function UserDeleteDialog({ user, onClose, subject = "foydalanuvchini", extra = null }) {
    const navigate = useNavigate();
    const [deleteUser, { isLoading }] = useDeleteUserMutation();
    const [blockedMessage, setBlockedMessage] = useState("");

    const handleDelete = async () => {
        try {
            const response = await deleteUser(user.id).unwrap();
            Alert(response?.message || `${user.full_name} o'chirildi`, "success");
            onClose(true);
        } catch (error) {
            if (isTeacherHasGroups(error)) {
                setBlockedMessage(getErrorMessage(error));
                return;
            }
            Alert(getErrorMessage(error), "error");
        }
    };

    const goToGroups = () => {
        onClose(false);
        navigate(`/ad/groups?teacher_id=${encodeURIComponent(user.id)}`);
    };

    if (blockedMessage) {
        return (
            <Modal open onClose={() => onClose(false)} title="O'qituvchini o'chirib bo'lmaydi" size="sm">
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "4px 0 8px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--warning-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <AlertTriangle size={18} style={{ color: "var(--warning)" }} />
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0, whiteSpace: "pre-line" }}>{blockedMessage}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => onClose(false)}>Yopish</button>
                    <button className="btn-submit" onClick={goToGroups}>
                        <Layers size={14} /> Guruhlarga o&apos;tish
                    </button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal open onClose={() => !isLoading && onClose(false)} title="O'chirishni tasdiqlang" size="sm">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "4px 0 8px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--danger-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AlertTriangle size={18} style={{ color: "var(--danger)" }} />
                </div>
                <div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: "0 0 4px" }}>
                        <strong style={{ color: "var(--danger)" }}>{user.full_name}</strong> {subject} o&apos;chirmoqchisiz.
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>{USER_DELETE_NOTICE}</p>
                    {extra}
                </div>
            </div>
            <div className="modal-footer">
                <button className="btn-cancel" onClick={() => onClose(false)} disabled={isLoading}>Bekor qilish</button>
                <button className="btn-delete" onClick={handleDelete} disabled={isLoading}>
                    <Trash size={14} /> {isLoading ? "O'chirilmoqda..." : "O'chirish"}
                </button>
            </div>
        </Modal>
    );
}

/* Jadval qatori uchun: axlat qutisi tugmasi + dialog */
export function UserDeleteButton({ user, subject, extra }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button className="action-btn action-btn-danger" onClick={() => setOpen(true)} title="O'chirish">
                <Trash size={14} />
            </button>
            {open && <UserDeleteDialog user={user} subject={subject} extra={extra} onClose={() => setOpen(false)} />}
        </>
    );
}
