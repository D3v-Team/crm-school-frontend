import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCreatePaymentMutation } from "../../../store/services/payment.api";
import { Plus, DollarSign } from "lucide-react";
import { Alert } from "../../Other/UI/Alert/Alert";
import Modal from "../../Other/UI/Modal/Modal";
import FormField, { Input } from "../../Other/UI/FormField/FormField";

const METHODS = [
    { value: "cash", label: "Naqd" },
    { value: "card", label: "Karta" },
    { value: "transfer", label: "Pul o'tkazmasi" },
    { value: "bank_account", label: "Bank hisobi" },
];
const MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const fmt = (v) => v ? Number(String(v).replace(/\s/g, "")).toLocaleString("ru-RU") : "";
const parse = (v) => String(v || "").replace(/\s/g, "");

export default function AddPayment({ requiredAmount, onAdd }) {
    const { id: studentId } = useParams();
    const now = new Date();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1, paid_amount: "", required_amount: "", discount_percent: "", method: "cash", comment: "" });
    const [displayPaid, setDisplayPaid] = useState("");
    const [errors, setErrors] = useState({});
    const [createPayment, { isLoading }] = useCreatePaymentMutation();

    useEffect(() => {
        if (open) {
            const c = parse(requiredAmount || "");
            setForm(p => ({ ...p, required_amount: c, paid_amount: "", discount_percent: "" }));
            setDisplayPaid("");
            setErrors({});
        }
    }, [open, requiredAmount]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "paid_amount") { const c = parse(value); setForm(p => ({ ...p, paid_amount: c })); setDisplayPaid(fmt(c)); }
        else setForm(p => ({ ...p, [name]: value }));
    };

    const validate = () => {
        const e = {};
        if (!form.paid_amount || +form.paid_amount <= 0) e.paid_amount = "Musbat summa kiriting";
        if (!form.required_amount || +form.required_amount <= 0) e.required_amount = "Kerakli summani kiriting";
        setErrors(e);
        return !Object.keys(e).length;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await createPayment({ student_id: studentId, year: +form.year, month: +form.month, paid_amount: +form.paid_amount, required_amount: +form.required_amount, method: form.method, ...(form.discount_percent && { discount_percent: +form.discount_percent }), ...(form.comment && { comment: form.comment }) }).unwrap();
            Alert("To'lov qo'shildi", "success");
            if (onAdd) onAdd();
            setOpen(false);
        } catch (err) {
            Alert(err?.data?.message || "Xatolik", "error");
        }
    };

    const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

    return (
        <>
            <button className="btn-create" onClick={() => setOpen(true)} style={{ fontSize: '0.8rem', padding: '7px 14px' }}>
                <Plus size={14} /> To'lov qo'shish
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="Yangi to'lov" size="sm">
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Yil</label>
                                <select name="year" value={form.year} onChange={handleChange} className="field-select no-icon">
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Oy</label>
                                <select name="month" value={form.month} onChange={handleChange} className="field-select no-icon">
                                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <FormField label="To'langan summa" icon={DollarSign} error={errors.paid_amount}>
                                <Input icon={DollarSign} name="paid_amount" value={displayPaid} onChange={handleChange} placeholder="0" error={errors.paid_amount} />
                            </FormField>
                            <div>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Kerakli summa</label>
                                <div className="search-input" style={{ paddingLeft: 14, opacity: 0.7 }}>{fmt(form.required_amount) || "—"} so'm</div>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>To'lov usuli</label>
                            <select name="method" value={form.method} onChange={handleChange} className="field-select no-icon">
                                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Chegirma (%)</label>
                            <input name="discount_percent" value={form.discount_percent} onChange={handleChange} type="number" min="0" max="100" placeholder="0" className="search-input" style={{ paddingLeft: 14 }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Izoh</label>
                            <textarea name="comment" value={form.comment} onChange={handleChange} rows={2} placeholder="Qo'shimcha..." className="search-input" style={{ paddingLeft: 14, height: 'auto', resize: 'vertical' }} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>{isLoading ? "Saqlanmoqda..." : "Qo'shish"}</button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
