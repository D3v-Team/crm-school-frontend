// __components/Delete.jsx
import { useState } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import { useUpdateStudentStatusMutation } from "../../../../store/services/student.api";
import { Archive, ArchiveRestore, AlertTriangle } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";

export default function Delete({ student }) {
    const [open, setOpen] = useState(false);
    const [updateStatus, { isLoading }] = useUpdateStudentStatusMutation();

    const isActive = student?.is_active ?? true;
    const action = isActive ? 'arxivlash' : 'qayta tiklash';
    const newStatus = !isActive;

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleToggle = async () => {
        try {
            await updateStatus({ id: student.id, data: { is_active: newStatus } }).unwrap();
            Alert(`O‘quvchi ${student.full_name} ${action} amalga oshirildi`, "success");
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
                className={`p-2 ${isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors`}
                title={action}
            >
                {isActive ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="sm"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    {isActive ? 'O‘quvchini arxivlash' : 'O‘quvchini qayta tiklash'}
                </DialogHeader>
                <DialogBody className="text-text-secondary">
                    <p className="mb-2">
                        Siz <span className="font-semibold text-text-primary">{student.full_name}</span> o‘quvchini <strong>{action}</strong> ni tasdiqlaysizmi?
                    </p>
                    <p className="text-sm text-yellow-500">
                        {isActive ? 'Arxivlangan o‘quvchi faol ro‘yxatlarda ko‘rinmaydi.' : 'Qayta tiklangandan so‘ng o‘quvchi faol ro‘yxatga qaytadi.'}
                    </p>
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
                        className={`${isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors`}
                        onClick={handleToggle}
                        loading={isLoading}
                        disabled={isLoading}
                    >
                        {isActive ? 'Arxivlash' : 'Qayta tiklash'}
                    </Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}