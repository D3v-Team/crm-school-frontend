import { useState, useEffect } from "react";
import { useUpdatePaymentMutation } from "../../../../store/services/payment.api";
import { Pencil } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";

const METHODS = [
    { value:"cash", label:"Naqd" },
    { value:"card", label:"Karta" },
    { value:"transfer", label:"Pul o'tkazmasi" },
    { value:"bank_account", label:"Bank hisobi" },
];
const fmt = (v) => v ? Number(String(v).replace(/\s/g,"")).toLocaleString("ru-RU") : "";
const parse = (v) => String(v||"").replace(/\s/g,"");

export default function EditPayment({ payment, onUpdate }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ paid_amount:"", required_amount:"", discount_percent:"", method:"cash", comment:"" });
    const [displayPaid, setDisplayPaid] = useState("");
    const [errors, setErrors] = useState({});
    const [updatePayment, { isLoading }] = useUpdatePaymentMutation();

    useEffect(() => {
        if (open && payment) {
            setForm({ paid_amount:parse(payment.paid_amount), required_amount:parse(payment.required_amount), discount_percent:payment.discount_percent||"", method:payment.method||"cash", comment:payment.comment||"" });
            setDisplayPaid(fmt(payment.paid_amount));
            setErrors({});
        }
    }, [open, payment]);

    const handleChange = (e) => {
        const {name,value} = e.target;
        if (name==="paid_amount") { const c=parse(value); setForm(p=>({...p,paid_amount:c})); setDisplayPaid(fmt(c)); }
        else setForm(p=>({...p,[name]:value}));
    };

    const validate = () => {
        const e={};
        if (!form.paid_amount||+form.paid_amount<=0) e.paid_amount="Musbat summa kiriting";
        if (form.discount_percent&&(+form.discount_percent<0||+form.discount_percent>100)) e.discount_percent="0-100 oralig'ida";
        setErrors(e); return !Object.keys(e).length;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await updatePayment({ id:payment.id, data:{ paid_amount:+form.paid_amount, required_amount:+form.required_amount, method:form.method, ...(form.discount_percent&&{discount_percent:+form.discount_percent}), ...(form.comment&&{comment:form.comment}) } }).unwrap();
            Alert("To'lov yangilandi","success");
            if (onUpdate) onUpdate();
            setOpen(false);
        } catch(err) { Alert(err?.data?.message||"Xatolik","error"); }
    };

    return (
        <>
            <button className="action-btn action-btn-primary" onClick={()=>setOpen(true)} title="Tahrirlash"><Pencil size={13}/></button>
            <Modal open={open} onClose={()=>setOpen(false)} title="To'lovni tahrirlash" size="sm">
                <form onSubmit={handleSubmit}>
                    <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                            <div>
                                <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:500, display:'block', marginBottom:4 }}>To'langan summa</label>
                                <input name="paid_amount" value={displayPaid} onChange={handleChange} placeholder="0" className="search-input" style={{ paddingLeft:14 }}/>
                                {errors.paid_amount && <span style={{ fontSize:'0.72rem', color:'var(--danger)' }}>{errors.paid_amount}</span>}
                            </div>
                            <div>
                                <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:500, display:'block', marginBottom:4 }}>Kerakli summa</label>
                                <div className="search-input" style={{ paddingLeft:14, opacity:.7 }}>{fmt(form.required_amount)||"—"} so'm</div>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:500, display:'block', marginBottom:4 }}>Chegirma (%)</label>
                            <input name="discount_percent" value={form.discount_percent} onChange={handleChange} type="number" min="0" max="100" placeholder="0" className="search-input" style={{ paddingLeft:14 }}/>
                        </div>
                        <div>
                            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:500, display:'block', marginBottom:4 }}>To'lov usuli</label>
                            <select name="method" value={form.method} onChange={handleChange} className="field-select no-icon">
                                {METHODS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:500, display:'block', marginBottom:4 }}>Izoh</label>
                            <textarea name="comment" value={form.comment} onChange={handleChange} rows={2} placeholder="Qo'shimcha..." className="search-input" style={{ paddingLeft:14, height:'auto', resize:'vertical' }}/>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={()=>setOpen(false)}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>{isLoading?"Saqlanmoqda...":"Yangilash"}</button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
