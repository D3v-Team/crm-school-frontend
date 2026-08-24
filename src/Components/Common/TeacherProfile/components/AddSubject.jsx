import { useState } from "react";
import { useCreateTeacherSubjectMutation } from "../../../../store/services/teacher-subject.api";
import { useGetSubjectsQuery } from "../../../../store/services/subject.api";
import { Plus } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField from "../../../Other/UI/FormField/FormField";
import { useParams } from "react-router-dom";

export default function AddSubject({ onAdd }) {
    const [open, setOpen] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [error, setError] = useState("");
    const { id } = useParams();

    const { data: subjectsData, isLoading: subjectsLoading } = useGetSubjectsQuery({ limit: 100 });
    const [createTeacherSubject, { isLoading }] = useCreateTeacherSubjectMutation();

    const subjects = subjectsData?.data?.records || [];

    const handleClose = () => { setOpen(false); setSelectedSubjectId(""); setError(""); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSubjectId) { setError("Fan tanlanishi kerak"); return; }
        try {
            await createTeacherSubject({ teacher_id: id, subject_id: selectedSubjectId }).unwrap();
            Alert("Fan muvaffaqiyatli biriktirildi", "success");
            if (onAdd) onAdd();
            handleClose();
        } catch (err) {
            Alert(err?.data?.message || "Xatolik yuz berdi", "error");
        }
    };

    return (
        <>
            <button className="btn-create" onClick={() => setOpen(true)}>
                <Plus size={14} /> Qo'shish
            </button>
            <Modal open={open} onClose={handleClose} title="Fan biriktirish" size="sm">
                <form onSubmit={handleSubmit}>
                    <FormField label="Fan" error={error}>
                        <select
                            className={`field-select no-icon${error ? ' error' : selectedSubjectId ? ' valid' : ''}`}
                            value={selectedSubjectId}
                            onChange={e => { setSelectedSubjectId(e.target.value); setError(""); }}
                            disabled={subjectsLoading}
                        >
                            <option value="">Fan tanlang</option>
                            {subjectsLoading && <option disabled>Yuklanmoqda...</option>}
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </FormField>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={handleClose}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            {isLoading ? "Saqlanmoqda..." : "Biriktirish"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
