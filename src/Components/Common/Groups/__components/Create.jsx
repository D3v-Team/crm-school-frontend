import { useEffect, useState } from "react";
import { useCreateGroupMutation } from "../../../../store/services/group.api";
import { useGetSubjectsQuery } from "../../../../store/services/subject.api";
import { useLazyGetAvailableTeachersQuery } from "../../../../store/services/teacher-subject.api";
import { BookOpen, Calendar, Plus, User } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField, { Input } from "../../../Other/UI/FormField/FormField";

const getRecords = (response) => response?.data?.records || response?.records || response?.data || [];
const getTeachers = (response) => {
    const data = response?.data;
    return Array.isArray(data) ? data : data?.records || response?.teachers || [];
};

export default function Create() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: "", start_date: "", subject_id: "", teacher_id: "" });
    const [errors, setErrors] = useState({});
    const { data: subjectsData, isLoading: subjectsLoading, error: subjectsError } = useGetSubjectsQuery({ page: 1, limit: 200 });
    const [fetchTeachers, { data: teachersData, isLoading: teachersLoading, error: teachersError }] = useLazyGetAvailableTeachersQuery();
    const [createGroup, { isLoading }] = useCreateGroupMutation();
    const subjects = getRecords(subjectsData);
    const teachers = getTeachers(teachersData);

    useEffect(() => {
        if (open && form.subject_id) fetchTeachers({ subject_id: form.subject_id });
    }, [open, form.subject_id, fetchTeachers]);

    const handleClose = () => {
        setOpen(false);
        setForm({ name: "", start_date: "", subject_id: "", teacher_id: "" });
        setErrors({});
    };

    const validate = () => {
        const nextErrors = {};
        if (!form.subject_id) nextErrors.subject_id = "Fan tanlanishi kerak";
        if (!form.teacher_id) nextErrors.teacher_id = "O'qituvchi tanlanishi kerak";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) return;
        const payload = {
            subject_id: form.subject_id,
            teacher_id: form.teacher_id,
            ...(form.name.trim() && { name: form.name.trim() }),
            ...(form.start_date && { start_date: form.start_date }),
        };
        try {
            await createGroup(payload).unwrap();
            Alert("Guruh muvaffaqiyatli yaratildi", "success");
            handleClose();
        } catch (error) {
            Alert(error?.data?.message || "Xatolik yuz berdi", "error");
        }
    };

    return (
        <>
            <button className="btn-create" onClick={() => setOpen(true)}>
                <Plus size={15} /> Yaratish
            </button>
            <Modal open={open} onClose={handleClose} title="Yangi guruh yaratish" size="sm">
                <form onSubmit={handleSubmit}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {subjectsError && <p role="alert" style={{ margin: 0, color: "var(--danger)" }}>{subjectsError?.data?.message || "Fanlarni yuklab bo'lmadi"}</p>}
                        {teachersError && <p role="alert" style={{ margin: 0, color: "var(--danger)" }}>{teachersError?.data?.message || "O'qituvchilarni yuklab bo'lmadi"}</p>}
                        <FormField label="Fan" icon={BookOpen} error={errors.subject_id}>
                            <select
                                className={`field-select${errors.subject_id ? " error" : form.subject_id ? " valid" : ""}`}
                                value={form.subject_id}
                                disabled={subjectsLoading}
                                onChange={(event) => {
                                    setForm((current) => ({ ...current, subject_id: event.target.value, teacher_id: "" }));
                                    setErrors((current) => ({ ...current, subject_id: "", teacher_id: "" }));
                                }}
                            >
                                <option value="">{subjectsLoading ? "Yuklanmoqda..." : "Fanni tanlang"}</option>
                                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="O'qituvchi" icon={User} error={errors.teacher_id}>
                            <select
                                className={`field-select${errors.teacher_id ? " error" : form.teacher_id ? " valid" : ""}`}
                                value={form.teacher_id}
                                disabled={!form.subject_id || teachersLoading}
                                onChange={(event) => {
                                    setForm((current) => ({ ...current, teacher_id: event.target.value }));
                                    setErrors((current) => ({ ...current, teacher_id: "" }));
                                }}
                            >
                                <option value="">{!form.subject_id ? "Avval fan tanlang" : teachersLoading ? "Yuklanmoqda..." : "O'qituvchini tanlang"}</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Guruh nomi (ixtiyoriy)" icon={BookOpen}>
                            <Input
                                icon={BookOpen}
                                name="name"
                                value={form.name}
                                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                placeholder="Bo'sh qoldirilsa avtomatik yaratiladi"
                            />
                        </FormField>
                        <FormField label="Boshlanish sanasi (ixtiyoriy)" icon={Calendar}>
                            <Input
                                icon={Calendar}
                                type="date"
                                name="start_date"
                                value={form.start_date}
                                onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))}
                            />
                        </FormField>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={handleClose}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading || subjectsLoading}>
                            {isLoading ? "Saqlanmoqda..." : "Yaratish"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
