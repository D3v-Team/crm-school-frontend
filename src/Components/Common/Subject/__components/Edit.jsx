import { useState, useEffect } from "react";
import { useUpdateSubjectMutation } from "../../../../store/services/subject.api";
import { BookOpen, Pencil } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField, { Input } from "../../../Other/UI/FormField/FormField";

export default function Edit({ subject }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [updateSubject, { isLoading }] = useUpdateSubjectMutation();

    useEffect(() => {
        if (open && subject) { setName(subject.name || ""); setError(""); }
    }, [open, subject]);

    const handleClose = () => { setOpen(false); setError(""); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError("Fan nomi majburiy"); return; }
        try {
            await updateSubject({ id: subject.id, data: { name: name.trim() } }).unwrap();
            Alert("Fan muvaffaqiyatli yangilandi", "success");
            handleClose();
        } catch (err) {
            Alert(err?.data?.message || "Xatolik yuz berdi", "error");
        }
    };

    return (
        <>
            <button className="action-btn action-btn-primary" onClick={() => setOpen(true)} title="Tahrirlash">
                <Pencil size={14} />
            </button>
            <Modal open={open} onClose={handleClose} title="Fanni tahrirlash" size="sm">
                <form onSubmit={handleSubmit}>
                    <FormField label="Fan nomi" icon={BookOpen} error={error} valid={!error && !!name}>
                        <Input
                            icon={BookOpen}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Fan nomi"
                            error={error}
                            valid={!error && !!name}
                        />
                    </FormField>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={handleClose}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            {isLoading ? "Saqlanmoqda..." : "Yangilash"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
