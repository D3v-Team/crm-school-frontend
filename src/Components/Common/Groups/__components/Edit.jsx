/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useUpdateGroupMutation } from "../../../../store/services/group.api";
import { useGetSubjectsQuery } from "../../../../store/services/subject.api";
import { useLazyGetAvailableTeachersQuery } from "../../../../store/services/teacher-subject.api";
import { useGetUsersQuery } from "../../../../store/services/user.api";
import { BookOpen, Calendar, Pencil, User, UserCheck } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField, { Input } from "../../../Other/UI/FormField/FormField";
import { getErrorMessage } from "../../../../utils/errors";

const dateValue = (date) => date ? String(date).split("T")[0] : "";
const getRecords = (response) => response?.data?.records || response?.records || response?.data || [];
const getTeachers = (response) => {
    const data = response?.data;
    return Array.isArray(data) ? data : data?.records || response?.teachers || [];
};

/**
 * Guruhni tahrirlash.
 * variant="assign" — "Rahbarni tayinlang" tugmasi (rahbari arxivlangan guruh uchun, TZ 6).
 * Fani bo'sh eski sinfda o'qituvchi fanga bog'lanmagan holda tanlanadi (sinf rahbari):
 * ro'yxat — barcha faol o'qituvchilar (GET /user?role=teacher).
 */
export default function Edit({ group, variant = "icon" }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: "", start_date: "", subject_id: "", teacher_id: "" });
    const [errors, setErrors] = useState({});
    const { data: subjectsData, isLoading: subjectsLoading, error: subjectsError } = useGetSubjectsQuery({ page: 1, limit: 200 });
    const [fetchTeachers, { data: teachersData, isLoading: teachersLoading, isFetching: teachersFetching, error: teachersError }] = useLazyGetAvailableTeachersQuery();
    const [updateGroup, { isLoading }] = useUpdateGroupMutation();
    // Fan tanlanmagan bo'lsa (eski sinf) — barcha faol o'qituvchilar
    const { data: allTeachersData, isFetching: allTeachersFetching, error: allTeachersError } = useGetUsersQuery(
        { role: "teacher", limit: 200 },
        { skip: !open || Boolean(form.subject_id) },
    );
    const subjects = getRecords(subjectsData);
    const bySubject = Boolean(form.subject_id);
    const teachers = bySubject ? getTeachers(teachersData) : (allTeachersData?.data?.records || []);
    const teacherListFetching = bySubject ? teachersFetching : allTeachersFetching;
    const teacherListReady = bySubject ? Boolean(teachersData) : Boolean(allTeachersData);
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

    /* Tanlangan o'qituvchi ro'yxatda yo'q bo'lsa (fanga biriktirilmagan yoki arxivlangan) — tozalaymiz,
       aks holda select ko'rinishda bo'sh, qiymatda esa eski (arxivdagi) o'qituvchi qolib ketadi. */
    useEffect(() => {
        if (!open || teacherListFetching || !teacherListReady) return;
        if (form.teacher_id && !teachers.some((teacher) => String(teacher.id) === String(form.teacher_id))) {
            setForm((current) => ({ ...current, teacher_id: "" }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, teachersData, allTeachersData, teacherListFetching, bySubject]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const nextErrors = {};
        if (changedAssignment && !form.teacher_id) nextErrors.teacher_id = "O'qituvchi tanlanishi kerak";
        // Fanni faqat fani bor guruhda bo'shatib bo'lmaydi; eski sinfda fansiz rahbar tayinlash mumkin
        if (changedAssignment && originalSubjectId && !form.subject_id) nextErrors.subject_id = "Fan tanlanishi kerak";
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
            Alert(getErrorMessage(error), "error");
        }
    };

    return (
        <>
            {variant === "assign" ? (
                <button type="button" onClick={() => setOpen(true)} title="Yangi rahbar (o'qituvchi) tayinlash"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", borderRadius: 7, border: "1px solid var(--accent)", background: "var(--accent-soft)", color: "var(--accent)", cursor: "pointer", whiteSpace: "nowrap" }}>
                    <UserCheck size={11} /> Rahbarni tayinlang
                </button>
            ) : (
                <button className="action-btn action-btn-primary" onClick={() => setOpen(true)} title="Tahrirlash">
                    <Pencil size={14} />
                </button>
            )}
            <Modal open={open} onClose={() => setOpen(false)} title={variant === "assign" ? "Rahbarni tayinlash" : "Guruhni tahrirlash"} size="sm">
                <form onSubmit={handleSubmit}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {subjectsError && <p role="alert" style={{ margin: 0, color: "var(--danger)" }}>{subjectsError?.data?.message || "Fanlarni yuklab bo'lmadi"}</p>}
                        {(bySubject ? teachersError : allTeachersError) && <p role="alert" style={{ margin: 0, color: "var(--danger)" }}>{getErrorMessage(bySubject ? teachersError : allTeachersError, "O'qituvchilarni yuklab bo'lmadi")}</p>}
                        <FormField label="Fan" icon={BookOpen} error={errors.subject_id}>
                            <select
                                className={`field-select${errors.subject_id ? " error" : ""}`}
                                value={form.subject_id}
                                disabled={subjectsLoading}
                                onChange={(event) => {
                                    // O'qituvchi saqlanadi; yangi fanga biriktirilmagan bo'lsa quyidagi effekt tozalaydi
                                    setForm((current) => ({ ...current, subject_id: event.target.value }));
                                    setErrors((current) => ({ ...current, subject_id: "", teacher_id: "" }));
                                }}
                            >
                                <option value="" disabled={!!originalSubjectId}>{originalSubjectId ? "Fanni tanlang" : "Fan belgilanmagan"}</option>
                                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label={bySubject ? "O'qituvchi" : "O'qituvchi (sinf rahbari)"} icon={User} error={errors.teacher_id}>
                            <select
                                className={`field-select${errors.teacher_id ? " error" : ""}`}
                                value={form.teacher_id}
                                disabled={bySubject ? teachersLoading : !allTeachersData}
                                onChange={(event) => {
                                    setForm((current) => ({ ...current, teacher_id: event.target.value }));
                                    setErrors((current) => ({ ...current, teacher_id: "" }));
                                }}
                            >
                                <option value="">{teacherListFetching && !teachers.length ? "Yuklanmoqda..." : "O'qituvchini tanlang"}</option>
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
                                {bySubject
                                    ? "O'qituvchi yoki fan o'zgarsa, guruh dars jadvali ham avtomatik yangilanadi."
                                    : "Sinf rahbari almashtiriladi: oldingi rahbarning amaldagi darslari yangi o'qituvchiga o'tadi, boshqa fan o'qituvchilarining darslari o'zgarmaydi."}
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
