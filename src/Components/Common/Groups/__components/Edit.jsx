/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useUpdateGroupMutation } from "../../../../store/services/group.api";
import { useGetSubjectsQuery } from "../../../../store/services/subject.api";
import { useLazyGetAvailableTeachersQuery } from "../../../../store/services/teacher-subject.api";
import { BookOpen, Calendar, Pencil, User } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField, { Input } from "../../../Other/UI/FormField/FormField";

const dateValue = (date) => date ? String(date).split("T")[0] : "";
const getRecords = (response) => response?.data?.records || response?.records || response?.data || [];
const getTeachers = (response) => {
    const data = response?.data;
    return Array.isArray(data) ? data : data?.records || response?.teachers || [];
};

export default function Edit({ group }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: "", start_date: "", subject_id: "", teacher_id: "" });
    const [errors, setErrors] = useState({});
    const { data: subjectsData, isLoading: subjectsLoading, error: subjectsError } = useGetSubjectsQuery({ page: 1, limit: 200 });
    const [fetchTeachers, { data: teachersData, isLoading: teachersLoading, error: teachersError }] = useLazyGetAvailableTeachersQuery();
    const [updateGroup, { isLoading }] = useUpdateGroupMutation();
    const subjects = getRecords(subjectsData);
    const teachers = getTeachers(teachersData);
    const originalSubjectId = group?.subject_id || group?.subject?.id || "";
    const originalTeacherId = group?.teacher_id || group?.teacher?.id || "";
    const changedAssignment = form.subject_id !== originalSubjectId || form.teacher_id !== originalTeacherId;

    useEffect(() => {
        if (!open || !group) return;
        setForm({
            name: group.name || "",
            start_date: dateValue(group.start_date),
            subject_id: group.subject_id || group.subject?.id || "",
            teacher_id: group.teacher_id || group.teacher?.id || "",
        });
        setErrors({});
    }, [open, group]);

    useEffect(() => {
        if (open && form.subject_id) fetchTeachers({ subject_id: form.subject_id });
    }, [open, form.subject_id, fetchTeachers]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const nextErrors = {};
        if (changedAssignment && !form.teacher_id) nextErrors.teacher_id = "O'qituvchi tanlanishi kerak";
        if (changedAssignment && !form.subject_id) nextErrors.subject_id = "Fan tanlanishi kerak";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        const data = {};
        if (form.name.trim() && form.name.trim() !== (group.name || "")) data.name = form.name.trim();
        if (form.start_date !== dateValue(group.start_date) && form.start_date) data.start_date = form.start_date;
        if (form.subject_id && form.subject_id !== originalSubjectId) data.subject_id = form.subject_id;
        if (form.teacher_id && form.teacher_id !== originalTeacherId) data.teacher_id = form.teacher_id;

        if (!Object.keys(data).length) {
            setOpen(false);
            return;
        }

        try {
            await updateGroup({ id: group.id, data }).unwrap();
            Alert("Guruh muvaffaqiyatli yangilandi", "success");
            setOpen(false);
        } catch (error) {
            Alert(error?.data?.message || "Xatolik yuz berdi", "error");
        }
    };

    return (
        <>
            <button className="action-btn action-btn-primary" onClick={() => setOpen(true)} title="Tahrirlash">
                <Pencil size={14} />
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="Guruhni tahrirlash" size="sm">
                <form onSubmit={handleSubmit}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {subjectsError && <p role="alert" style={{ margin: 0, color: "var(--danger)" }}>{subjectsError?.data?.message || "Fanlarni yuklab bo'lmadi"}</p>}
                        {teachersError && <p role="alert" style={{ margin: 0, color: "var(--danger)" }}>{teachersError?.data?.message || "O'qituvchilarni yuklab bo'lmadi"}</p>}
                        <FormField label="Fan" icon={BookOpen} error={errors.subject_id}>
                            <select
                                className={`field-select${errors.subject_id ? " error" : ""}`}
                                value={form.subject_id}
                                disabled={subjectsLoading}
                                onChange={(event) => {
                                    setForm((current) => ({ ...current, subject_id: event.target.value, teacher_id: "" }));
                                    setErrors((current) => ({ ...current, subject_id: "", teacher_id: "" }));
                                }}
                            >
                                <option value="">Fan belgilanmagan</option>
                                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="O'qituvchi" icon={User} error={errors.teacher_id}>
                            <select
                                className={`field-select${errors.teacher_id ? " error" : ""}`}
                                value={form.teacher_id}
                                disabled={!form.subject_id || teachersLoading}
                                onChange={(event) => {
                                    setForm((current) => ({ ...current, teacher_id: event.target.value }));
                                    setErrors((current) => ({ ...current, teacher_id: "" }));
                                }}
                            >
                                <option value="">{form.subject_id ? "O'qituvchini tanlang" : "Avval fan tanlang"}</option>
                                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Guruh nomi (ixtiyoriy)" icon={BookOpen}>
                            <Input icon={BookOpen} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                        </FormField>
                        <FormField label="Boshlanish sanasi (ixtiyoriy)" icon={Calendar}>
                            <Input icon={Calendar} type="date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} />
                        </FormField>
                        {changedAssignment && (
                            <p style={{ margin: 0, color: "var(--warning)", fontSize: "0.78rem" }}>
                                O&apos;qituvchi yoki fan o&apos;zgarsa, guruh dars jadvali ham avtomatik yangilanadi.
                            </p>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading || subjectsLoading}>
                            {isLoading ? "Saqlanmoqda..." : "Yangilash"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
