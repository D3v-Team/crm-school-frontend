// EditPayment.jsx
import { useState, useEffect } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Select, Option } from "@material-tailwind/react";
import { Pencil } from "lucide-react";
import { useUpdatePaymentMutation } from "../../../../store/services/payment.api";
import { Alert } from "../../../Other/UI/Alert/Alert";

const PAYMENT_METHODS = [
    { value: "cash", label: "Naqd" },
    { value: "card", label: "Karta" },
    { value: "transfer", label: "Pul o‘tkazmasi" },
    { value: "bank_account", label: "Bank hisobi" },
];

const formatNumber = (value) => {
    if (!value) return "";
    const num = Number(String(value).replace(/\s/g, ""));
    if (isNaN(num)) return value;
    return num.toLocaleString("ru-RU");
};

const parseNumber = (value) => {
    if (!value) return "";
    return String(value).replace(/\s/g, "");
};

export default function EditPayment({ payment, onUpdate }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        paid_amount: "",
        required_amount: "",
        discount_percent: "",
        method: "cash",
        comment: "",
    });
    const [displayPaid, setDisplayPaid] = useState("");
    const [errors, setErrors] = useState({});

    const [updatePayment, { isLoading }] = useUpdatePaymentMutation();

    useEffect(() => {
        if (open && payment) {
            const paid = payment.paid_amount || "";
            const required = payment.required_amount || "";
            const discount = payment.discount_percent || "";
            const method = payment.method || "cash";
            const comment = payment.comment || "";

            setForm({
                paid_amount: parseNumber(paid),
                required_amount: parseNumber(required),
                discount_percent: discount,
                method,
                comment,
            });
            setDisplayPaid(formatNumber(paid));
            setErrors({});
        }
    }, [open, payment]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "paid_amount") {
            const cleaned = parseNumber(value);
            setForm(prev => ({ ...prev, paid_amount: cleaned }));
            setDisplayPaid(formatNumber(cleaned));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSelectChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const newErrors = {};
        const paid = Number(form.paid_amount);
        if (!form.paid_amount || isNaN(paid) || paid <= 0) {
            newErrors.paid_amount = "To‘langan summa majburiy va musbat bo‘lishi kerak";
        }
        const required = Number(form.required_amount);
        if (!form.required_amount || isNaN(required) || required <= 0) {
            newErrors.required_amount = "Kerakli summa majburiy va musbat bo‘lishi kerak";
        }
        if (form.discount_percent && (isNaN(Number(form.discount_percent)) || Number(form.discount_percent) < 0 || Number(form.discount_percent) > 100)) {
            newErrors.discount_percent = "Chegirma 0-100 orasida bo‘lishi kerak";
        }
        if (!form.method) newErrors.method = "To‘lov usuli tanlanishi kerak";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            paid_amount: Number(form.paid_amount),
            required_amount: Number(form.required_amount),
            method: form.method,
            ...(form.discount_percent && { discount_percent: Number(form.discount_percent) }),
            ...(form.comment && { comment: form.comment }),
        };

        try {
            await updatePayment({ id: payment.id, data: payload }).unwrap();
            Alert("To‘lov muvaffaqiyatli yangilandi", "success");
            if (onUpdate) onUpdate();
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
                onClick={handleOpen}
                className="p-2 bg-accent hover:bg-accent-hover text-white transition-colors"
                title="Tahrirlash"
            >
                <Pencil className="w-4 h-4" />
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="md"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary">
                    To‘lovni tahrirlash
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">To‘langan summa</label>
                                <input
                                    type="text"
                                    name="paid_amount"
                                    value={displayPaid}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className={`w-full px-4 py-2.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors ${errors.paid_amount ? "border-red-500" : ""}`}
                                />
                                {errors.paid_amount && <p className="text-red-500 text-xs mt-1">{errors.paid_amount}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Kerakli summa</label>
                                <div className="w-full px-4 py-2.5 rounded-lg border-2 bg-input-bg/50 border-input-border text-text-primary">
                                    {formatNumber(form.required_amount) || "—"} so‘m
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Chegirma (%)</label>
                            <input
                                type="number"
                                name="discount_percent"
                                value={form.discount_percent}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                                max="100"
                                className={`w-full px-4 py-2.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors ${errors.discount_percent ? "border-red-500" : ""}`}
                            />
                            {errors.discount_percent && <p className="text-red-500 text-xs mt-1">{errors.discount_percent}</p>}
                        </div>

                        <div>
                            <Select
                                label="To‘lov usuli"
                                value={form.method}
                                onChange={(val) => handleSelectChange("method", val)}
                                className="!bg-input-bg !border-input-border text-input-text"
                                labelProps={{ className: "text-text-secondary" }}
                            >
                                {PAYMENT_METHODS.map((method) => (
                                    <Option key={method.value} value={method.value}>
                                        {method.label}
                                    </Option>
                                ))}
                            </Select>
                            {errors.method && <p className="text-red-500 text-xs mt-1">{errors.method}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Izoh</label>
                            <textarea
                                name="comment"
                                value={form.comment}
                                onChange={handleChange}
                                rows="2"
                                placeholder="Qo‘shimcha ma'lumot..."
                                className="w-full px-4 py-2.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none transition-colors"
                            />
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
                            Yangilash
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </>
    );
}