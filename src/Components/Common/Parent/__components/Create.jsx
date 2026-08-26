import { useState } from "react";
import { useCreateUserMutation } from "../../../../store/services/user.api";
import { User, UserCircle, Phone, Key, Eye, EyeOff, Plus } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField, { Input } from "../../../Other/UI/FormField/FormField";

export default function Create() {
    const [open, setOpen] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [form, setForm] = useState({ full_name:"", username:"", phone:"+998", role:"parent", password:"" });
    const [errors, setErrors] = useState({});
    const [createUser, { isLoading }] = useCreateUserMutation();

    const handleClose = () => { setOpen(false); setForm({ full_name:"", username:"", phone:"+998", role:"parent", password:"" }); setErrors({}); setShowPwd(false); };

    const handleChange = (e) => {
        const {name,value} = e.target;
        if (name==="phone") { if(!value.startsWith("+998"))return; if(/^\d*$/.test(value.slice(4)))setForm(p=>({...p,phone:value})); return; }
        setForm(p=>({...p,[name]:value}));
    };

    const validate = () => {
        const e={};
        if (!form.full_name.trim()) e.full_name="To'liq ism majburiy";
        if (!form.username.trim()) e.username="Username majburiy";
        if (!form.phone||form.phone==="+998") e.phone="Telefon majburiy";
        if (!form.password||form.password.length<6) e.password="Parol kamida 6 ta belgi";
        setErrors(e); return !Object.keys(e).length;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try { await createUser(form).unwrap(); Alert("Ota-ona yaratildi","success"); handleClose(); }
        catch(err){ Alert(err?.data?.message||"Xatolik","error"); }
    };

    return (
        <>
            <button className="btn-create" onClick={()=>setOpen(true)}><Plus size={15}/>Yaratish</button>
            <Modal open={open} onClose={handleClose} title="Yangi ota-ona yaratish">
                <form onSubmit={handleSubmit}>
                    <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
                        <FormField label="To'liq ism" icon={User} error={errors.full_name} valid={!errors.full_name&&!!form.full_name}>
                            <Input icon={User} name="full_name" value={form.full_name} onChange={handleChange} placeholder="Ism familiya" error={errors.full_name} valid={!errors.full_name&&!!form.full_name}/>
                        </FormField>
                        <FormField label="Username" icon={UserCircle} error={errors.username} valid={!errors.username&&!!form.username}>
                            <Input icon={UserCircle} name="username" value={form.username} onChange={handleChange} placeholder="username" error={errors.username} valid={!errors.username&&!!form.username}/>
                        </FormField>
                        <FormField label="Telefon" icon={Phone} error={errors.phone} valid={!errors.phone&&form.phone!=="+998"}>
                            <Input icon={Phone} name="phone" value={form.phone} onChange={handleChange} placeholder="+998XXXXXXXXX" error={errors.phone} valid={!errors.phone&&form.phone!=="+998"}/>
                        </FormField>
                        <FormField label="Parol" icon={Key} error={errors.password} valid={!errors.password&&!!form.password}>
                            <div style={{ position:'relative' }}>
                                <Key size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none',zIndex:1 }}/>
                                <Input icon={Key} name="password" type={showPwd?"text":"password"} value={form.password} onChange={handleChange} placeholder="Parol (min 6)" error={errors.password} valid={!errors.password&&!!form.password}/>
                                <button type="button" onClick={()=>setShowPwd(p=>!p)} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',zIndex:2 }}>
                                    {showPwd?<EyeOff size={15}/>:<Eye size={15}/>}
                                </button>
                            </div>
                        </FormField>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={handleClose}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>{isLoading?"Saqlanmoqda...":"Yaratish"}</button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
