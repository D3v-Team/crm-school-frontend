// AddSubject.jsx
import { useState } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Select, Option } from "@material-tailwind/react";
import { useCreateTeacherSubjectMutation } from "../../../../store/services/teacher-subject.api";
import { useGetSubjectsQuery } from "../../../../store/services/subject.api";
import { BookOpen, Plus } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import { useParams } from "react-router-dom";

export default function AddSubject({ onAdd }) {
    const [open, setOpen] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [errors, setErrors] = useState({});
    const { id } = useParams();


    const { data: subjectsData, isLoading: subjectsLoading } = useGetSubjectsQuery({ limit: 100 });
    const [createTeacherSubject, { isLoading }] = useCreateTeacherSubjectMutation();

    const subjects = subjectsData?.data?.records || [];

    const handleOpen = () => {
        setOpen(true);
        setSelectedSubjectId("");
        setErrors({});
    };
    const handleClose = () => {
        setOpen(false);
        setSelectedSubjectId("");
        setErrors({});
    };

    const validate = () => {
        const newErrors = {};
        if (!selectedSubjectId) newErrors.subject = "Fan tanlanishi kerak";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await createTeacherSubject({
                teacher_id: id,
                subject_id: selectedSubjectId,
            }).unwrap();
            Alert("Fan o‘qituvchiga muvaffaqiyatli biriktirildi", "success");
            if (onAdd) onAdd(); // обновляем список
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
                className="bg-accent hover:bg-accent-hover text-white transition-colors flex items-center gap-1"
                onClick={handleOpen}
                size="sm"
            >
                <Plus size={16} /> Qo‘shish
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="sm"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary">
                    O‘qituvchiga fan biriktirish
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        <div>
                            <Select
                                label="Fan"
                                value={selectedSubjectId}
                                onChange={(val) => setSelectedSubjectId(val)}
                                className="!bg-input-bg !border-input-border text-input-text"
                                labelProps={{ className: "text-text-secondary" }}
                                disabled={subjectsLoading}
                            >
                                {subjectsLoading ? (
                                    <Option value="" disabled>Yuklanmoqda...</Option>
                                ) : subjects.length === 0 ? (
                                    <Option value="" disabled>Fanlar topilmadi</Option>
                                ) : (
                                    subjects.map((subject) => (
                                        <Option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </Option>
                                    ))
                                )}
                            </Select>
                            {errors.subject && (
                                <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
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
                            Biriktirish
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </>
    );
}