import { useState, useEffect } from "react";
import { useCreatePaymentMutation } from "../../../../store/services/payment.api";
import { CreditCard, Plus, DollarSign } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField, { Input } from "../../../Other/UI/FormField/FormField";

const METHODS = [
    { value:"cash", label:"Naqd" },
    { value:"card", label:"Karta" },
    { value:"transfer", label:"Pul o'tkazmasi" },
    { value:"bank_account", label:"Bank hisobi" },
];
const MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const fmt = (v) => v ? Number(String(v).replace(/\s/g,"")).toLocaleString("ru-RU") : "";
const parse = (v) => String(v||"").replace(/\s/g,"");

export default function QuickPayment({ student }) {
    const now = new Date();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        paid_amount: "",
        method: "cash",
    });
    const [displayPaid, setDisplayPaid] = useState("");
    const [errors, setErrors] = useState({});
    const [createPayment, { isLoading }] = useCreatePaymentMutation();

    useEffect(() => {
        if (open) {
            setForm({ year: now.getFullYear(), month: now.getMonth() + 1, paid_amount: "", method: "cash" });
            setDisplayPaid("");
            setErrors({});
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "paid_amount") {
            const c = parse(value);
            setForm(p => ({ ...p, paid_amount: c }));
            setDisplayPaid(fmt(c));
        } else {
            setForm(p => ({ ...p, [name]: value }));
        }
    };

    const validate = () => {
        const e = {};
        if (!form.paid_amount || +form.paid_amount <= 0) e.paid_amount = "Musbat summa kiriting";
        setErrors(e);
        return !Object.keys(e).length;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (!validate()) return;
        try {
            await createPayment({
                student_id: student.id,
                year: +form.year,
                month: +form.month,
                paid_amount: +form.paid_amount,
                required_amount: +(student.price || form.paid_amount),
                method: form.method,
            }).unwrap();
            Alert(`${student.full_name} uchun to'lov qo'shildi`, "success");
            setOpen(false);
        } catch (err) {
            Alert(err?.data?.message || "Xatolik", "error");
        }
    };

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    return (
        <>
            <button
                className="action-btn"
                onClick={() => setOpen(true)}
                title="To'lov qo'shish"
                style={{
                    background: 'var(--success-soft)',
                    color: 'var(--success)',
                    border: '1.5px solid var(--card-border)',
                }}
            >
                <CreditCard size={14}/>
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title={`To'lov — ${student.full_name}`} size="sm">
                <form onSubmit={handleSubmit}>
                    <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
                        {/* Year + Month */}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                            <div>
                                <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:500, display:'block', marginBottom:4 }}>Yil</label>
                                <select name="year" value={form.year} onChange={handleChange}
                                    style={{ width:'100%', padding:'9px 12px', background:'var(--input-bg)', border:'1.5px solid var(--input-border)', borderRadius:9, color:'var(--input-text)', fontSize:'0.82rem', outline:'none', cursor:'pointer' }}>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:500, display:'block', marginBottom:4 }}>Oy</label>
                                <select name="month" value={form.month} onChange={handleChange}
                                    style={{ width:'100%', padding:'9px 12px', background:'var(--input-bg)', border:'1.5px solid var(--input-border)', borderRadius:9, color:'var(--input-text)', fontSize:'0.82rem', outline:'none', cursor:'pointer' }}>
                                    {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Amount */}
                        <FormField label="To'langan summa" icon={DollarSign} error={errors.paid_amount} valid={!errors.paid_amount && !!form.paid_amount}>
                            <Input icon={DollarSign} name="paid_amount" value={displayPaid} onChange={handleChange}
                                placeholder="0" error={errors.paid_amount} valid={!errors.paid_amount && !!form.paid_amount}/>
                        </FormField>

                        {/* Kerakli summa */}
                        {student.price && (
                            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
                                <span>Kerakli summa:</span>
                                <strong style={{ color:'var(--text-primary)' }}>
                                    {Number(student.price).toLocaleString('ru-RU')} so'm
                                </strong>
                            </div>
                        )}

                        {/* Method */}
                        <div>
                            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:500, display:'block', marginBottom:4 }}>To'lov usuli</label>
                            <select name="method" value={form.method} onChange={handleChange}
                                style={{ width:'100%', padding:'9px 12px', background:'var(--input-bg)', border:'1.5px solid var(--input-border)', borderRadius:9, color:'var(--input-text)', fontSize:'0.82rem', outline:'none', cursor:'pointer' }}>
                                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            <Plus size={14}/> {isLoading ? "Saqlanmoqda..." : "Qo'shish"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
