import { useState, useEffect } from "react";
import { useCreateGroupMutation } from "../../../../store/services/group.api";
import { useLazyGetUsersQuery } from "../../../../store/services/user.api";
import { BookOpen, Calendar, Users, Plus } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField, { Input } from "../../../Other/UI/FormField/FormField";

export default function Create() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: "", start_date: "", homeroom_teacher_id: "" });
    const [errors, setErrors] = useState({});
    const [teachers, setTeachers] = useState([]);

    const [createGroup, { isLoading }] = useCreateGroupMutation();
    const [fetchTeachers, { data: teachersData, isLoading: teachersLoading }] = useLazyGetUsersQuery();

    useEffect(() => {
        if (open) {
            const today = new Date().toISOString().split('T')[0];
            setForm(p => ({ ...p, start_date: p.start_date || today }));
            fetchTeachers({ role: 'teacher', limit: 100 });
        }
    }, [open]);

    useEffect(() => {
        if (!teachersData) return;
        const records = teachersData?.data?.records || teachersData?.records || teachersData?.data || [];
        setTeachers(Array.isArray(records) ? records : []);
    }, [teachersData]);

    const handleClose = () => { setOpen(false); setForm({ name: "", start_date: "", homeroom_teacher_id: "" }); setErrors({}); };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Guruh nomi majburiy";
        if (!form.start_date) e.start_date = "Boshlanish sanasi majburiy";
        if (!form.homeroom_teacher_id) e.homeroom_teacher_id = "Sinf rahbari tanlanishi kerak";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await createGroup({ name: form.name.trim(), start_date: form.start_date, homeroom_teacher_id: form.homeroom_teacher_id }).unwrap();
            Alert("Guruh muvaffaqiyatli yaratildi", "success");
            handleClose();
        } catch (err) {
            Alert(err?.data?.message || "Xatolik yuz berdi", "error");
        }
    };

    return (
        <>
            <button className="btn-create" onClick={() => setOpen(true)}>
                <Plus size={15} /> Yaratish
            </button>
            <Modal open={open} onClose={handleClose} title="Yangi guruh yaratish" size="sm">
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <FormField label="Guruh nomi" icon={BookOpen} error={errors.name} valid={!errors.name && !!form.name}>
                            <Input icon={BookOpen} name="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="5-A" error={errors.name} valid={!errors.name && !!form.name} />
                        </FormField>

                        <FormField label="Boshlanish sanasi" icon={Calendar} error={errors.start_date} valid={!errors.start_date && !!form.start_date}>
                            <Input icon={Calendar} type="date" name="start_date" value={form.start_date}
                                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                                error={errors.start_date} valid={!errors.start_date && !!form.start_date} />
                        </FormField>

                        <FormField label="Sinf rahbari" icon={Users} error={errors.homeroom_teacher_id}>
                            <div style={{ position: 'relative' }}>
                                <Users size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: errors.homeroom_teacher_id ? 'var(--danger)' : 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
                                <select
                                    className={`field-select${errors.homeroom_teacher_id ? ' error' : form.homeroom_teacher_id ? ' valid' : ''}`}
                                    value={form.homeroom_teacher_id}
                                    onChange={e => setForm(p => ({ ...p, homeroom_teacher_id: e.target.value }))}
                                    disabled={teachersLoading}
                                >
                                    <option value="">Sinf rahbarini tanlang</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                </select>
                            </div>
                        </FormField>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={handleClose}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            {isLoading ? "Saqlanmoqda..." : "Yaratish"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
