// ScheduleCreate.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import { Clock } from "lucide-react";
import { useGetSubjectsQuery } from "../../../../store/services/subject.api";
import { useLazyGetUsersQuery } from "../../../../store/services/user.api";
import { useCreateGroupScheduleMutation } from "../../../../store/services/group-schedule.api";
import { Alert } from "../../../Other/UI/Alert/Alert";

const DAYS_OF_WEEK = [
    { value: "monday", label: "Dushanba" },
    { value: "tuesday", label: "Seshanba" },
    { value: "wednesday", label: "Chorshanba" },
    { value: "thursday", label: "Payshanba" },
    { value: "friday", label: "Juma" },
    { value: "saturday", label: "Shanba" },
    { value: "sunday", label: "Yakshanba" },
];

export default function ScheduleCreate({ onAdd }) {
    const { id: groupId } = useParams();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        subject_id: "",
        teacher_id: "",
        day_of_week: "monday",
        start_time: "",
        end_time: "",
    });
    const [errors, setErrors] = useState({});
    const [teachers, setTeachers] = useState([]);

    const { data: subjectsData, isLoading: subjectsLoading } = useGetSubjectsQuery({ limit: 100 });
    const [fetchTeachers, { data: teachersData, isLoading: teachersLoading }] = useLazyGetUsersQuery();
    const [createSchedule, { isLoading }] = useCreateGroupScheduleMutation();

    const subjects = subjectsData?.data?.records || [];

    useEffect(() => {
        if (open) {
            fetchTeachers({ role: 'teacher', limit: 100 });
        }
    }, [open, fetchTeachers]);

    useEffect(() => {
        if (teachersData) {
            const records = teachersData?.data?.records || [];
            setTeachers(records);
        }
    }, [teachersData]);

    const handleOpen = () => {
        setOpen(true);
        setForm({
            subject_id: "",
            teacher_id: "",
            day_of_week: "monday",
            start_time: "",
            end_time: "",
        });
        setErrors({});
    };
    const handleClose = () => {
        setOpen(false);
        setErrors({});
        setTeachers([]);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.subject_id) newErrors.subject_id = "Fan tanlanishi kerak";
        if (!form.teacher_id) newErrors.teacher_id = "O‘qituvchi tanlanishi kerak";
        if (!form.day_of_week) newErrors.day_of_week = "Kun tanlanishi kerak";
        if (!form.start_time) newErrors.start_time = "Boshlanish vaqti majburiy";
        if (!form.end_time) newErrors.end_time = "Tugash vaqti majburiy";
        if (form.start_time && form.end_time && form.start_time >= form.end_time) {
            newErrors.end_time = "Tugash vaqti boshlanish vaqtidan kechroq bo‘lishi kerak";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await createSchedule({
                group_id: groupId,
                subject_id: form.subject_id,
                teacher_id: form.teacher_id,
                day_of_week: form.day_of_week,
                start_time: form.start_time,
                end_time: form.end_time,
            }).unwrap();
            Alert("Dars jadvaliga muvaffaqiyatli qo‘shildi", "success");
            if (onAdd) onAdd();
            handleClose();
        } catch (error) {
            const errorMessage = error?.data?.message || "Xatolik yuz berdi";
            Alert(errorMessage, "error");
            setErrors({ api: errorMessage });
        }
    };

    return (
        <>
            <Button
                className="bg-accent hover:bg-accent-hover text-white transition-colors flex items-center gap-2"
                onClick={handleOpen}
            >
                <Clock size={16} /> Dars qo‘shish
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="md"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary">
                    Yangi dars qo‘shish
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Fan</label>
                            <select
                                name="subject_id"
                                value={form.subject_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors ${errors.subject_id ? "border-red-500" : ""}`}
                                disabled={subjectsLoading}
                            >
                                <option value="">Fanni tanlang</option>
                                {subjectsLoading ? (
                                    <option disabled>Yuklanmoqda...</option>
                                ) : subjects.length === 0 ? (
                                    <option disabled>Fanlar topilmadi</option>
                                ) : (
                                    subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            {errors.subject_id && <p className="text-red-500 text-xs mt-1">{errors.subject_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">O‘qituvchi</label>
                            <select
                                name="teacher_id"
                                value={form.teacher_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors ${errors.teacher_id ? "border-red-500" : ""}`}
                                disabled={teachersLoading}
                            >
                                <option value="">O‘qituvchini tanlang</option>
                                {teachersLoading ? (
                                    <option disabled>Yuklanmoqda...</option>
                                ) : teachers.length === 0 ? (
                                    <option disabled>O‘qituvchilar topilmadi</option>
                                ) : (
                                    teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.full_name}
                                        </option>
                                    ))
                                )}
                            </select>
                            {errors.teacher_id && <p className="text-red-500 text-xs mt-1">{errors.teacher_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Kun</label>
                            <select
                                name="day_of_week"
                                value={form.day_of_week}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors ${errors.day_of_week ? "border-red-500" : ""}`}
                            >
                                {DAYS_OF_WEEK.map((day) => (
                                    <option key={day.value} value={day.value}>
                                        {day.label}
                                    </option>
                                ))}
                            </select>
                            {errors.day_of_week && <p className="text-red-500 text-xs mt-1">{errors.day_of_week}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Boshlanish vaqti</label>
                                <input
                                    type="time"
                                    name="start_time"
                                    value={form.start_time}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors ${errors.start_time ? "border-red-500" : ""}`}
                                />
                                {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Tugash vaqti</label>
                                <input
                                    type="time"
                                    name="end_time"
                                    value={form.end_time}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors ${errors.end_time ? "border-red-500" : ""}`}
                                />
                                {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time}</p>}
                            </div>
                        </div>
                    </DialogBody>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="text"
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Bekor qilish
                        </Button>
                        <Button
                            type="submit"
                            className="bg-accent hover:bg-accent-hover text-white transition-colors"
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            Qo‘shish
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </>
    );
}