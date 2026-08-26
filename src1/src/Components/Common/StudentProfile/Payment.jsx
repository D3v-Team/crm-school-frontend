// Payment.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Select, Option } from "@material-tailwind/react";
import { BanknoteArrowDown } from "lucide-react";
import { useCreatePaymentMutation } from "../../../store/services/payment.api";
import { Alert } from "../../Other/UI/Alert/Alert";

const PAYMENT_METHODS = [
    { value: "cash", label: "Naqd" },
    { value: "card", label: "Karta" },
    { value: "transfer", label: "Pul o‘tkazmasi" },
    { value: "bank_account", label: "Bank hisobi" },
];

const MONTHS = [
    { value: 1, label: "Yanvar" },
    { value: 2, label: "Fevral" },
    { value: 3, label: "Mart" },
    { value: 4, label: "Aprel" },
    { value: 5, label: "May" },
    { value: 6, label: "Iyun" },
    { value: 7, label: "Iyul" },
    { value: 8, label: "Avgust" },
    { value: 9, label: "Sentyabr" },
    { value: 10, label: "Oktyabr" },
    { value: 11, label: "Noyabr" },
    { value: 12, label: "Dekabr" },
];

const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
        years.push(y);
    }
    return years;
};

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

export default function Payment({ requiredAmount }) {
    const { id: studentId } = useParams();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        paid_amount: "",
        required_amount: "",
        discount_percent: "",
        method: "cash",
        comment: "",
    });
    const [displayPaid, setDisplayPaid] = useState("");
    const [displayRequired, setDisplayRequired] = useState("");
    const [errors, setErrors] = useState({});

    const [createPayment, { isLoading }] = useCreatePaymentMutation();

    useEffect(() => {
        const raw = requiredAmount || "";
        const cleaned = parseNumber(raw);
        setForm(prev => ({ ...prev, required_amount: cleaned }));
        setDisplayRequired(formatNumber(cleaned));
    }, [requiredAmount]);

    const handleOpen = () => {
        if (!studentId) {
            Alert("Student ID topilmadi", "error");
            return;
        }
        setOpen(true);
        const defaultRequired = requiredAmount || "";
        const cleaned = parseNumber(defaultRequired);
        setForm({
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            paid_amount: "",
            required_amount: cleaned,
            discount_percent: "",
            method: "cash",
            comment: "",
        });
        setDisplayPaid("");
        setDisplayRequired(formatNumber(cleaned));
        setErrors({});
    };

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
        if (!studentId) newErrors.student_id = "Student ID topilmadi";
        if (!form.year || isNaN(Number(form.year)) || Number(form.year) < 2000) {
            newErrors.year = "Yil noto‘g‘ri";
        }
        if (!form.month || isNaN(Number(form.month)) || Number(form.month) < 1 || Number(form.month) > 12) {
            newErrors.month = "Oy 1-12 oralig‘ida bo‘lishi kerak";
        }
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
            student_id: studentId,
            year: Number(form.year),
            month: Number(form.month),
            paid_amount: Number(form.paid_amount),
            required_amount: Number(form.required_amount),
            method: form.method,
            ...(form.discount_percent && { discount_percent: Number(form.discount_percent) }),
            ...(form.comment && { comment: form.comment }),
        };

        try {
            await createPayment(payload).unwrap();
            Alert("To‘lov muvaffaqiyatli qo‘shildi", "success");
            handleClose();
        } catch (error) {
            const errorMessage = error?.data?.message || "Xatolik yuz berdi";
            Alert(errorMessage, "error");
            setErrors({ api: errorMessage });
        }
    };

    const years = getYears();

    return (
        <>
            <Button
                className="bg-accent hover:bg-accent-hover text-white transition-colors flex items-center gap-2"
                onClick={handleOpen}
            >
                <BanknoteArrowDown size={16} /> To‘lov qilish
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="md"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary">
                    Yangi to‘lov qo‘shish
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Select
                                    label="Yil"
                                    value={String(form.year)}
                                    onChange={(val) => handleSelectChange("year", Number(val))}
                                    className="!bg-input-bg !border-input-border text-input-text"
                                    labelProps={{ className: "text-text-secondary" }}
                                >
                                    {years.map((year) => (
                                        <Option key={year} value={String(year)}>
                                            {year}
                                        </Option>
                                    ))}
                                </Select>
                                {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                            </div>
                            <div>
                                <Select
                                    label="Oy"
                                    value={String(form.month)}
                                    onChange={(val) => handleSelectChange("month", Number(val))}
                                    className="!bg-input-bg !border-input-border text-input-text"
                                    labelProps={{ className: "text-text-secondary" }}
                                >
                                    {MONTHS.map((month) => (
                                        <Option key={month.value} value={String(month.value)}>
                                            {month.label}
                                        </Option>
                                    ))}
                                </Select>
                                {errors.month && <p className="text-red-500 text-xs mt-1">{errors.month}</p>}
                            </div>
                        </div>

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
                                    {displayRequired || "—"} so‘m
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
                            Qo‘shish
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </>
    );
}