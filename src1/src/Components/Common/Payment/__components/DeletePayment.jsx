// DeletePayment.jsx
import { useState } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import { useDeletePaymentMutation } from "../../../store/services/payment.api";
import { Trash2, AlertTriangle, Trash } from "lucide-react";
import { Alert } from "../../Other/UI/Alert/Alert";

export default function DeletePayment({ paymentId, onDelete }) {
    const [open, setOpen] = useState(false);
    const [deletePayment, { isLoading }] = useDeletePaymentMutation();

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleDelete = async () => {
        try {
            await deletePayment(paymentId).unwrap();
            Alert("To‘lov muvaffaqiyatli o‘chirildi", "success");
            if (onDelete) onDelete(); // обновляем список
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
                    To‘lovni o‘chirishni tasdiqlang
                </DialogHeader>
                <DialogBody className="text-text-secondary">
                    <p className="mb-2">
                        Ushbu to‘lov yozuvini o‘chirmoqchimisiz?
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