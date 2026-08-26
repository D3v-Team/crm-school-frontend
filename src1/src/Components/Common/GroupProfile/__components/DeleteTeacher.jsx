// DeleteTeacherGroup.jsx
import { useState } from 'react';
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from '@material-tailwind/react';
import { Trash, AlertTriangle } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useDeleteTeacherGroupMutation } from '../../../../store/services/theacher-group.api';

export default function DeleteTeacherGroup({ teacherGroupId, teacherName, onSuccess }) {
    const [open, setOpen] = useState(false);
    const [deleteTeacherGroup, { isLoading }] = useDeleteTeacherGroupMutation();

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleDelete = async () => {
        if (!teacherGroupId) {
            Alert('Teacher group id mavjud emas', 'error');
            return;
        }
        try {
            await deleteTeacherGroup(teacherGroupId).unwrap();
            Alert(`O‘qituvchi "${teacherName}" guruhdan olib tashlandi`, 'success');
            if (onSuccess) onSuccess();
            handleClose();
        } catch (err) {
            Alert(err?.data?.message || 'Xatolik yuz berdi', 'error');
        }
    };

    return (
        <>
            <Button
                size="sm"
                variant="text"
                className="text-red-500 hover:bg-red-500/10 p-1 min-w-[36px] h-8 rounded-lg"
                onClick={handleOpen}
                disabled={isLoading || !teacherGroupId}
                title={teacherGroupId ? `Olib tashlash — ${teacherName || ''}` : 'ID mavjud emas'}
            >
                <Trash size={16} />
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="sm"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    O‘qituvchini olib tashlash
                </DialogHeader>
                <DialogBody className="text-text-secondary">
                    <p className="mb-2">
                        Siz <span className="font-semibold text-text-primary">{teacherName}</span> ni guruhdan olib tashlamoqchisiz?
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