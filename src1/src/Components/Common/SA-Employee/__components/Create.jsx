import { useState } from "react";
import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Select,
    Option,
} from "@material-tailwind/react";
import { useCreateUserMutation } from "../../../../store/services/user.api";
import { User, UserCircle, Phone, Key, Eye, EyeOff } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";

const ROLES = ["super_admin", "admin", "teacher", "parent", "hr", "cashier"];

// Переводы ролей на узбекский (латиница)
const ROLE_LABELS = {
    super_admin: "Super administrator",
    admin: "Administrator",
    teacher: "O‘qituvchi",
    parent: "Ota-ona",
    hr: "HR",
    cashier: "Kassir",
};

export default function Create() {
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        full_name: "",
        username: "",
        phone: "+998",
        role: "teacher",
        password: "",
    });
    const [errors, setErrors] = useState({});

    const [createUser, { isLoading }] = useCreateUserMutation();

    // Доступные роли: все, кроме parent и super_admin
    const availableRoles = ROLES.filter(
        (r) => r !== "parent" && r !== "super_admin"
    );

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setForm({
            full_name: "",
            username: "",
            phone: "+998",
            role: "teacher",
            password: "",
        });
        setErrors({});
        setShowPassword(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Для телефона: всегда начинается с "+998"
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

    const handleRoleChange = (value) => {
        setForm((prev) => ({ ...prev, role: value }));
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
        if (!form.role) newErrors.role = "Rol tanlash majburiy";
        if (!form.password || form.password.length < 6) {
            newErrors.password = "Parol kamida 6 ta belgi bo‘lishi kerak";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await createUser(form).unwrap();
            Alert("Foydalanuvchi muvaffaqiyatli yaratildi", "success");
            handleClose();
        } catch (error) {
            const errorMessage = error?.data?.message || "Xatolik yuz berdi";
            // Показываем тост-уведомление об ошибке
            Alert(errorMessage, "error");
            // Также устанавливаем ошибку в форму (если нужно)
            setErrors({ api: errorMessage });
        }
    };

    return (
        <>
            <Button className="bg-accent hover:bg-accent-hover text-white transition-colors" onClick={handleOpen}>
                Yaratish
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="sm"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary">
                    Yangi xodim yaratish
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
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.full_name}
                                </p>
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
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.username}
                                </p>
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
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.phone}
                                </p>
                            )}
                        </div>

                        {/* Role - Material Tailwind Select */}
                        <div className="w-full">
                            <Select
                                label="Rol"
                                value={form.role}
                                onChange={handleRoleChange}
                                color="primary"
                                className="bg-input-bg border-input-border text-input-text"
                                error={!!errors.role}
                            >
                                {availableRoles.map((role) => (
                                    <Option key={role} value={role}>
                                        {ROLE_LABELS[role] || role.replace("_", " ").toUpperCase()}
                                    </Option>
                                ))}
                            </Select>
                            {errors.role && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.role}
                                </p>
                            )}
                        </div>

                        {/* Password with eye */}
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary z-10" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Parol"
                                className={`
                                    w-full pl-10 pr-12 py-2.5 rounded-lg border-2
                                    bg-input-bg border-input-border text-input-text 
                                    placeholder:text-input-placeholder
                                    focus:border-accent focus:outline-none transition-colors
                                    ${errors.password ? "border-red-500" : ""}
                                    ${!errors.password && form.password ? "border-green-500" : ""}
                                `}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-accent transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.password}
                                </p>
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
                            Yaratish
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </>
    );
}