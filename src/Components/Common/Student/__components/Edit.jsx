import { useState, useEffect } from "react";
import { useUpdateStudentMutation } from "../../../../store/services/student.api";
import { User, Phone, DollarSign, Pencil } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField, { Input } from "../../../Other/UI/FormField/FormField";

export default function Edit({ student }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ full_name: "", phone: "+998", price: "" });
    const [displayPrice, setDisplayPrice] = useState("");
    const [errors, setErrors] = useState({});
    const [updateStudent, { isLoading }] = useUpdateStudentMutation();

    useEffect(() => {
        if (open && student) {
            const price = student.price ? String(student.price) : "";
            setForm({ full_name: student.full_name || "", phone: student.phone || "+998", price });
            setDisplayPrice(price ? Number(price).toLocaleString("ru-RU") : "");
            setErrors({});
        }
    }, [open, student]);

    const handleClose = () => {
        setOpen(false);
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "phone") {
            if (!value.startsWith("+998")) return;
            const rest = value.slice(4);
            if (/^\d*$/.test(rest)) setForm(p => ({ ...p, phone: value }));
            return;
        }
        setForm(p => ({ ...p, [name]: value }));
    };

    const handlePriceChange = (e) => {
        const digits = e.target.value.replace(/\s/g, "");
        if (digits && !/^\d+$/.test(digits)) return;
        setForm(p => ({ ...p, price: digits }));
        setDisplayPrice(digits ? Number(digits).toLocaleString("ru-RU") : "");
    };

    const validate = () => {
        const e = {};
        if (!form.full_name.trim()) e.full_name = "To'liq ism majburiy";
        if (!form.phone || form.phone === "+998") e.phone = "Telefon raqam majburiy";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await updateStudent({
                id: student.id,
                data: {
                    full_name: form.full_name.trim(),
                    phone: form.phone.trim(),
                    ...(form.price && { price: Number(form.price) }),
                },
            }).unwrap();
            Alert("O'quvchi muvaffaqiyatli yangilandi", "success");
            handleClose();
        } catch (err) {
            Alert(err?.data?.message || "Xatolik yuz berdi", "error");
        }
    };

    return (
        <>
            <button className="action-btn action-btn-primary" onClick={() => setOpen(true)} title="Tahrirlash">
                <Pencil size={14} />
            </button>

            <Modal open={open} onClose={handleClose} title="O'quvchini tahrirlash" size="sm">
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <FormField label="To'liq ism" icon={User} error={errors.full_name} valid={!errors.full_name && !!form.full_name}>
                            <Input
                                icon={User}
                                name="full_name"
                                value={form.full_name}
                                onChange={handleChange}
                                placeholder="Ism familiya"
                                error={errors.full_name}
                                valid={!errors.full_name && !!form.full_name}
                            />
                        </FormField>

                        <FormField label="Telefon" icon={Phone} error={errors.phone} valid={!errors.phone && form.phone !== "+998"}>
                            <Input
                                icon={Phone}
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+998XXXXXXXXX"
                                error={errors.phone}
                                valid={!errors.phone && form.phone !== "+998"}
                            />
                        </FormField>

                        <FormField label="To'lov miqdori" icon={DollarSign} error={errors.price} valid={!errors.price && !!form.price}>
                            <Input
                                icon={DollarSign}
                                value={displayPrice}
                                onChange={handlePriceChange}
                                placeholder="0"
                                error={errors.price}
                                valid={!errors.price && !!form.price}
                            />
                        </FormField>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={handleClose} disabled={isLoading}>
                            Bekor qilish
                        </button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            {isLoading ? "Saqlanmoqda..." : "Yangilash"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
