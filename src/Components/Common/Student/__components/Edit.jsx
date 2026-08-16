// __components/Edit.jsx
import { useState, useEffect } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import { useUpdateStudentMutation } from "../../../../store/services/student.api";
import { User, Phone, DollarSign, Pencil } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";

export default function Edit({ student }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        full_name: "",
        phone: "+998",
        price: "",
    });
    const [displayPrice, setDisplayPrice] = useState("");
    const [errors, setErrors] = useState({});

    const [updateStudent, { isLoading }] = useUpdateStudentMutation();

    // Заполняем форму при открытии
    useEffect(() => {
        if (open && student) {
            const price = student.price ? String(student.price) : "";
            setForm({
                full_name: student.full_name || "",
                phone: student.phone || "+998",
                price: price,
            });
            setDisplayPrice(price ? Number(price).toLocaleString("ru-RU") : "");
            setErrors({});
        }
    }, [open, student]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setForm({
            full_name: "",
            phone: "+998",
            price: "",
        });
        setDisplayPrice("");
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "phone") {
            if (!value.startsWith("+998")) {
                setForm((prev) => ({ ...prev, phone: "+998" }));
                return;
            }
            const prefix = "+998";
            const rest = value.slice(prefix.length);
            if (/^\d*$/.test(rest)) {
                setForm((prev) => ({ ...prev, phone: value }));
            }
            return;
        }

        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePriceChange = (e) => {
        const raw = e.target.value;
        const digits = raw.replace(/\s/g, "");
        if (digits && !/^\d+$/.test(digits)) return;
        setForm((prev) => ({ ...prev, price: digits }));
        if (digits) {
            setDisplayPrice(Number(digits).toLocaleString("ru-RU"));
        } else {
            setDisplayPrice("");
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!form.full_name.trim()) newErrors.full_name = "To‘liq ism majburiy";
        if (!form.phone.trim() || form.phone === "+998") {
            newErrors.phone = "Telefon raqam majburiy";
        }
        if (form.price && (isNaN(Number(form.price)) || Number(form.price) < 0)) {
            newErrors.price = "To‘g‘ri summa kiriting";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            ...(form.price && { price: Number(form.price) }),
        };

        try {
            await updateStudent({ id: student.id, data: payload }).unwrap();
            Alert("O‘quvchi muvaffaqiyatli yangilandi", "success");
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
                size="sm"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary">
                    O‘quvchini tahrirlash
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        {/* Full name */}
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary z-10" />
                            <input
                                type="text"
                                name="full_name"
                                value={form.full_name}
                                onChange={handleChange}
                                placeholder="To‘liq ism"
                                className={`
                                    w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                                    bg-input-bg border-input-border text-input-text 
                                    placeholder:text-input-placeholder
                                    focus:border-accent focus:outline-none transition-colors
                                    ${errors.full_name ? "border-red-500" : ""}
                                    ${!errors.full_name && form.full_name ? "border-green-500" : ""}
                                `}
                            />
                            {errors.full_name && (
                                <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary z-10" />
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="Telefon raqam (+998)"
                                className={`
                                    w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                                    bg-input-bg border-input-border text-input-text 
                                    placeholder:text-input-placeholder
                                    focus:border-accent focus:outline-none transition-colors
                                    ${errors.phone ? "border-red-500" : ""}
                                    ${!errors.phone && form.phone !== "+998" ? "border-green-500" : ""}
                                `}
                            />
                            {errors.phone && (
                                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                            )}
                        </div>

                        {/* Price */}
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary z-10" />
                            <input
                                type="text"
                                name="price"
                                value={displayPrice}
                                onChange={handlePriceChange}
                                placeholder="To‘lov miqdori (ixtiyoriy)"
                                className={`
                                    w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                                    bg-input-bg border-input-border text-input-text 
                                    placeholder:text-input-placeholder
                                    focus:border-accent focus:outline-none transition-colors
                                    ${errors.price ? "border-red-500" : ""}
                                    ${!errors.price && form.price ? "border-green-500" : ""}
                                `}
                            />
                            {errors.price && (
                                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
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
                            Yangilash
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </>
    );
}