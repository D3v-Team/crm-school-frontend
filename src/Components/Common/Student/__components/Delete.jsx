// __components/Delete.jsx
import { useState } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import { useDeleteStudentMutation } from "../../../../store/services/student.api";
import { Trash, AlertTriangle } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";

export default function Delete({ student }) {
    const [open, setOpen] = useState(false);
    const [deleteStudent, { isLoading }] = useDeleteStudentMutation();

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleDelete = async () => {
        try {
            await deleteStudent(student.id).unwrap();
            Alert(`O‘quvchi ${student.full_name} o‘chirildi`, "success");
            handleClose();
        } catch (error) {
            const errorMessage = error?.data?.message || "Xatolik yuz berdi";
            Alert(errorMessage, "error");
        }
    };

    return (
        <>
            <Button

                onClick={handleOpen}
                className="p-2 bg-red-500 hover:bg-red-600 text-white transition-colors"
                title="O‘chirish"
            >
                <Trash className="w-4 h-4" />
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="sm"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    O‘chirishni tasdiqlang
                </DialogHeader>
                <DialogBody className="text-text-secondary">
                    <p className="mb-2">
                        Siz <span className="font-semibold text-text-primary">{student.full_name}</span> o‘quvchini o‘chirmoqchisiz.
                    </p>
                    <p className="text-sm text-red-400">Bu amalni qaytarib bo‘lmaydi!</p>
                </DialogBody>
                <DialogFooter className="gap-2">
                    <Button
                        variant="text"
                        className="text-text-secondary hover:bg-[var(--accent)]/10 transition-colors"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Bekor qilish
                    </Button>
                    <Button
                        className="bg-red-500 hover:bg-red-600 text-white transition-colors"
                        onClick={handleDelete}
                        loading={isLoading}
                        disabled={isLoading}
                    >
                        O‘chirish
                    </Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}