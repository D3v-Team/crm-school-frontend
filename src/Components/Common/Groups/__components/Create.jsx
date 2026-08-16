import { useState, useEffect } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import { useCreateGroupMutation } from "../../../../store/services/group.api";
import { useLazyGetUsersQuery } from "../../../../store/services/user.api";
import { BookOpen, Calendar, Users } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";

export default function Create() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        name: "",
        start_date: "",
        homeroom_teacher_id: "",
    });
    const [errors, setErrors] = useState({});
    const [teachers, setTeachers] = useState([]);

    const [createGroup, { isLoading }] = useCreateGroupMutation();
    const [fetchTeachers, { data: teachersData, isLoading: teachersLoading }] = useLazyGetUsersQuery();

    const todayDate = () => new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (open) {
            // Set sensible default date for new groups to today
            setForm((prev) => ({ ...prev, start_date: prev.start_date || todayDate() }));
            if (teachers.length === 0) fetchTeachers({ role: 'teacher', limit: 100 });
        }
    }, [open, fetchTeachers]);

    useEffect(() => {
        if (teachersData) {
            console.log("[Create] teachersData:", teachersData);
            let records = [];
            if (Array.isArray(teachersData.data?.records)) records = teachersData.data.records;
            else if (Array.isArray(teachersData.records)) records = teachersData.records;
            else if (Array.isArray(teachersData.data)) records = teachersData.data;
            setTeachers(records);
        }
    }, [teachersData]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setForm({
            name: "",
            start_date: "",
            homeroom_teacher_id: "",
        });
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = "Guruh nomi majburiy";
        if (!form.start_date) newErrors.start_date = "Boshlanish sanasi majburiy";
        if (!form.homeroom_teacher_id) newErrors.homeroom_teacher_id = "Sinf rahbari tanlanishi kerak";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await createGroup({
                name: form.name.trim(),
                start_date: form.start_date,
                homeroom_teacher_id: form.homeroom_teacher_id,
            }).unwrap();
            Alert("Guruh muvaffaqiyatli yaratildi", "success");
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
                className="bg-accent hover:bg-accent-hover text-white transition-colors"
                onClick={handleOpen}
            >
                Yaratish
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="sm"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary">
                    Yangi guruh yaratish
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        {/* Название группы */}
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary z-10" />
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Guruh nomi (masalan: 5-A)"
                                className={`
                                    w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                                    bg-input-bg border-input-border text-input-text 
                                    placeholder:text-input-placeholder
                                    focus:border-accent focus:outline-none transition-colors
                                    ${errors.name ? "border-red-500" : ""}
                                    ${!errors.name && form.name ? "border-green-500" : ""}
                                `}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Дата начала */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary z-10" />
                            <input
                                type="date"
                                name="start_date"
                                value={form.start_date}
                                onChange={handleChange}
                                className={`
                                    w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                                    bg-input-bg border-input-border text-input-text 
                                    focus:border-accent focus:outline-none transition-colors
                                    ${errors.start_date ? "border-red-500" : ""}
                                    ${!errors.start_date && form.start_date ? "border-green-500" : ""}
                                `}
                            />
                            {errors.start_date && (
                                <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>
                            )}
                        </div>

                        {/* Sinf rahbari - нативный select */}
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary z-10" />
                            <select
                                name="homeroom_teacher_id"
                                value={form.homeroom_teacher_id}
                                onChange={handleChange}
                                className={`
                                    w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                                    bg-input-bg border-input-border text-input-text 
                                    focus:border-accent focus:outline-none transition-colors appearance-none
                                    ${errors.homeroom_teacher_id ? "border-red-500" : ""}
                                    ${!errors.homeroom_teacher_id && form.homeroom_teacher_id ? "border-green-500" : ""}
                                `}
                                disabled={teachersLoading}
                            >
                                <option value="">Sinf rahbarini tanlang</option>
                                {teachersLoading ? (
                                    <option value="" disabled>Yuklanmoqda...</option>
                                ) : teachers.length === 0 ? (
                                    <option value="" disabled>O‘qituvchilar topilmadi</option>
                                ) : (
                                    teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.full_name}
                                        </option>
                                    ))
                                )}
                            </select>
                            {errors.homeroom_teacher_id && (
                                <p className="text-red-500 text-xs mt-1">{errors.homeroom_teacher_id}</p>
                            )}
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
                            Yaratish
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </>
    );
}