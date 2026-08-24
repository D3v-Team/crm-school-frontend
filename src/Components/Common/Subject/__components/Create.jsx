import { useState } from "react";
import { useCreateSubjectMutation } from "../../../../store/services/subject.api";
import { BookOpen, Plus } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField, { Input } from "../../../Other/UI/FormField/FormField";

export default function Create() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [createSubject, { isLoading }] = useCreateSubjectMutation();

    const handleClose = () => { setOpen(false); setName(""); setError(""); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError("Fan nomi majburiy"); return; }
        try {
            await createSubject({ name: name.trim() }).unwrap();
            Alert("Fan muvaffaqiyatli yaratildi", "success");
            handleClose();
        } catch (err) {
            Alert(err?.data?.message || "Xatolik yuz berdi", "error");
        }
    };

    return (
        <>
            <button className="btn-create" onClick={() => setOpen(true)}>
                <Plus size={15} /> Yaratish
            </button>
            <Modal open={open} onClose={handleClose} title="Yangi fan qo'shish" size="sm">
                <form onSubmit={handleSubmit}>
                    <FormField label="Fan nomi" icon={BookOpen} error={error} valid={!error && !!name}>
                        <Input
                            icon={BookOpen}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Masalan: Matematika"
                            error={error}
                            valid={!error && !!name}
                        />
                    </FormField>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={handleClose}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            {isLoading ? "Saqlanmoqda..." : "Yaratish"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
