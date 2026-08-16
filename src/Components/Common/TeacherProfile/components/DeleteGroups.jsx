// DeleteGroup.jsx
import { useState } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import { Trash, AlertTriangle } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import { useDeleteTeacherGroupMutation } from "../../../../store/services/theacher-group.api";

export default function DeleteGroup({ teacherGroupId, groupName, onRemove }) {
    const [open, setOpen] = useState(false);
    const [deleteTeacherGroup, { isLoading }] = useDeleteTeacherGroupMutation();

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleDelete = async () => {
        try {
            await deleteTeacherGroup(teacherGroupId).unwrap();
            Alert(`Guruh "${groupName}" o‘qituvchidan olib tashlandi`, "success");
            if (onRemove) onRemove(); // обновляем список
            handleClose();
        } catch (error) {
            const errorMessage = error?.data?.message || "Xatolik yuz berdi";
            Alert(errorMessage, "error");
        }
    };

    return (
        <>
            <Button
                className="p-2 bg-red-500 hover:bg-red-600 text-white transition-colors"
                onClick={handleOpen}
                title="O‘chirish"
            >
                <Trash className="w-5 h-5" />
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="sm"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    Olib tashlashni tasdiqlang
                </DialogHeader>
                <DialogBody className="text-text-secondary">
                    <p className="mb-2">
                        Siz <span className="font-semibold text-text-primary">{groupName}</span> guruhini o‘qituvchidan olib tashlamoqchisiz.
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
                        Olib tashlash
                    </Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}