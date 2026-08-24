import { useState, useEffect } from "react";
import { useUpdateUserMutation } from "../../../../store/services/user.api";
import { User, UserCircle, Phone, Pencil } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField, { Input } from "../../../Other/UI/FormField/FormField";

export default function Edit({ user }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ full_name: "", username: "", phone: "+998", password: "" });
    const [errors, setErrors] = useState({});
    const [updateUser, { isLoading }] = useUpdateUserMutation();

    const isEditable = user && !["super_admin", "parent"].includes(user.role);

    useEffect(() => {
        if (open && user) {
            setForm({ full_name: user.full_name || "", username: user.username || "", phone: user.phone || "+998", password: "" });
            setErrors({});
        }
    }, [open, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "phone") {
            if (!value.startsWith("+998")) return;
            if (/^\d*$/.test(value.slice(4))) setForm(p => ({ ...p, phone: value }));
            return;
        }
        setForm(p => ({ ...p, [name]: value }));
    };

    const validate = () => {
        const e = {};
        if (!form.full_name.trim()) e.full_name = "To'liq ism majburiy";
        if (!form.username.trim()) e.username = "Username majburiy";
        if (!form.phone || form.phone === "+998") e.phone = "Telefon majburiy";
        if (form.password && form.password.length < 6) e.password = "Parol kamida 6 ta belgi";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        const payload = { full_name: form.full_name, username: form.username, phone: form.phone };
        if (form.password) payload.password = form.password;
        try {
            await updateUser({ id: user.id, data: payload }).unwrap();
            Alert("Muvaffaqiyatli yangilandi", "success");
            setOpen(false);
        } catch (err) {
            Alert(err?.data?.message || "Xatolik yuz berdi", "error");
        }
    };

    if (!isEditable) return null;

    return (
        <>
            <button className="action-btn action-btn-primary" onClick={() => setOpen(true)} title="Tahrirlash">
                <Pencil size={14} />
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="O'qituvchini tahrirlash">
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                        <FormField label="To'liq ism" icon={User} error={errors.full_name} valid={!errors.full_name && !!form.full_name}>
                            <Input icon={User} name="full_name" value={form.full_name} onChange={handleChange}
                                placeholder="Ism familiya" error={errors.full_name} valid={!errors.full_name && !!form.full_name} />
                        </FormField>
                        <FormField label="Username" icon={UserCircle} error={errors.username} valid={!errors.username && !!form.username}>
                            <Input icon={UserCircle} name="username" value={form.username} onChange={handleChange}
                                placeholder="username" error={errors.username} valid={!errors.username && !!form.username} />
                        </FormField>
                        <FormField label="Telefon" icon={Phone} error={errors.phone} valid={!errors.phone && form.phone !== "+998"}>
                            <Input icon={Phone} name="phone" value={form.phone} onChange={handleChange}
                                placeholder="+998XXXXXXXXX" error={errors.phone} valid={!errors.phone && form.phone !== "+998"} />
                        </FormField>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            {isLoading ? "Saqlanmoqda..." : "Yangilash"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
