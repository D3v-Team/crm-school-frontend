import { useState, useEffect } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import { useUpdateUserMutation, useUpdateIsPaymentMutation } from "../../../../store/services/user.api";
import { User, UserCircle, Phone, Key, Eye, EyeOff, Pencil } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";

export default function Edit({ user }) {
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        full_name: "",
        username: "",
        phone: "+998",
        password: "",
        is_payment: false,
    });
    const [errors, setErrors] = useState({});
    const [updateUser, { isLoading }] = useUpdateUserMutation();
    const [updateIsPayment, { isLoading: isUpdatingPayment }] = useUpdateIsPaymentMutation();

    // Заполняем форму при открытии
    useEffect(() => {
        if (open && user) {
            setForm({
                full_name: user.full_name || "",
                username: user.username || "",
                phone: user.phone || "+998",
                password: "",
                is_payment: typeof user.is_payment !== 'undefined' ? Boolean(user.is_payment) : false,
            });
            setErrors({});
            setShowPassword(false);
        }
    }, [open, user]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setForm({
            full_name: "",
            username: "",
            phone: "+998",
            password: "",
        });
        setErrors({});
        setShowPassword(false);
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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const validate = () => {
        const newErrors = {};
        if (!form.full_name.trim()) newErrors.full_name = "To‘liq ism majburiy";
        if (!form.username.trim()) newErrors.username = "Username majburiy";
        if (!form.phone.trim() || form.phone === "+998") {
            newErrors.phone = "Telefon raqam majburiy";
        }
        if (form.password && form.password.length < 6) {
            newErrors.password = "Parol kamida 6 ta belgi bo‘lishi kerak";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        // Отправляем только разрешённые поля
        const updateData = {
            full_name: form.full_name,
            username: form.username,
            phone: form.phone,
        };
        if (form.password) {
            updateData.password = form.password;
        }

        try {
            await updateUser({ id: user.id, data: updateData }).unwrap();

            if (user && user.role === 'admin') {
                try {
                    await updateIsPayment({ id: user.id, data: { is_payment: !!form.is_payment } }).unwrap();
                } catch (err) {
                    const msg = err?.data?.message || "To'lov huquqini yangilashda xatolik";
                    Alert(msg, "error");
                    setErrors({ api: msg });
                    return;
                }
            }

            Alert("Foydalanuvchi muvaffaqiyatli yangilandi", "success");
            handleClose();
        } catch (error) {
            const errorMessage = error?.data?.message || "Xatolik yuz berdi";
            Alert(errorMessage, "error");
            setErrors({ api: errorMessage });
        }
    };

    // Блокируем редактирование для суперадмина и родителя (доп. защита)
    const isPaymentEditable = user && user.role === 'admin';
    const isSubmitting = isLoading || isUpdatingPayment;

    return (
        <>
            <Button
                className="p-2 bg-accent hover:bg-accent-hover text-white transition-colors"
                onClick={handleOpen}
            >
                <Pencil className="w-5 h-5" />
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="sm"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary">
                    Ota-onani tahrirlash
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

                        {/* Username */}
                        <div className="relative">
                            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary z-10" />
                            <input
                                type="text"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="Username"
                                className={`
                                    w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                                    bg-input-bg border-input-border text-input-text 
                                    placeholder:text-input-placeholder
                                    focus:border-accent focus:outline-none transition-colors
                                    ${errors.username ? "border-red-500" : ""}
                                    ${!errors.username && form.username ? "border-green-500" : ""}
                                `}
                            />
                            {errors.username && (
                                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
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
                        {isPaymentEditable && (
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-sm text-text-primary">
                                    <input
                                        type="checkbox"
                                        name="is_payment"
                                        checked={form.is_payment}
                                        onChange={(e) => setForm((prev) => ({ ...prev, is_payment: e.target.checked }))}
                                        className="w-4 h-4"
                                    />
                                    To'lov yaratish huquqi
                                </label>
                            </div>
                        )}
                    </DialogBody>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="text"
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Bekor qilish
                        </Button>
                        <Button
                            type="submit"
                            className="bg-accent hover:bg-accent-hover text-white transition-colors"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Yangilash
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </>
    );
}