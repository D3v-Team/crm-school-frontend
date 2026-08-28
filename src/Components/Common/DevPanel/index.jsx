import { useState, useEffect } from 'react';
import {
    useGetSchoolsQuery, useCreateSchoolMutation,
    useUpdateSchoolMutation, useDeleteSchoolMutation,
} from '../../../store/services/school.api';
import { useCreateSuperAdminMutation, useLazyGetUsersQuery } from '../../../store/services/user.api';
import {
    Building2, Plus, Pencil, Trash2, AlertTriangle,
    RefreshCw, Users, KeyRound, Search,
} from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';
import Modal from '../../Other/UI/Modal/Modal';
import { Alert } from '../../Other/UI/Alert/Alert';

/* ─── School CRUD ─── */
function SchoolForm({ initial, onSubmit, onClose, loading }) {
    const [name, setName] = useState(initial?.name || '');
    const handleSubmit = (e) => { e.preventDefault(); if (!name.trim()) return; onSubmit({ name: name.trim() }); };
    return (
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Maktab nomi *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Maktab nomini kiriting..."
                    className="search-input" style={{ paddingLeft: 14 }} autoFocus />
            </div>
            <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                <button type="submit" className="btn-submit" disabled={loading || !name.trim()}>
                    <Plus size={14} />{loading ? 'Saqlanmoqda...' : initial ? 'Yangilash' : "Qo'shish"}
                </button>
            </div>
        </form>
    );
}

function DeleteSchoolModal({ school, onClose }) {
    const [del, { isLoading }] = useDeleteSchoolMutation();
    const handle = async () => {
        try { await del(school.id).unwrap(); Alert("Maktab o'chirildi", 'success'); onClose(); }
        catch (err) { Alert(err?.data?.message || 'Xatolik', 'error'); }
    };
    return (
        <Modal open={!!school} onClose={onClose} title="Maktabni o'chirish" size="sm">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '4px 0 8px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
                </div>
                <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                        <strong>"{school?.name}"</strong> maktabini o'chirmoqchimisiz?
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Bu amalni qaytarib bo'lmaydi.</p>
                </div>
            </div>
            <div className="modal-footer">
                <button className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                <button className="btn-delete" onClick={handle} disabled={isLoading}>
                    <Trash2 size={13} />{isLoading ? "O'chirilmoqda..." : "O'chirish"}
                </button>
            </div>
        </Modal>
    );
}

/* ─── Super Admin Create ─── */
function CreateSuperAdminModal({ schools, open, onClose }) {
    const [form, setForm] = useState({ full_name: '', username: '', phone: '', password: '', school_id: '' });
    const [errors, setErrors] = useState({});
    const [create, { isLoading }] = useCreateSuperAdminMutation();

    const validate = () => {
        const e = {};
        if (!form.full_name.trim()) e.full_name = 'Ism kiritilishi kerak';
        if (!form.username.trim())  e.username  = 'Username kiritilishi kerak';
        if (!form.phone.trim())     e.phone     = 'Telefon kiritilishi kerak';
        if (!form.password.trim())  e.password  = 'Parol kiritilishi kerak';
        if (!form.school_id)        e.school_id = 'Maktab tanlanishi kerak';
        setErrors(e);
        return !Object.keys(e).length;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await create({ ...form }).unwrap();
            Alert("Super Admin yaratildi", 'success');
            setForm({ full_name: '', username: '', phone: '', password: '', school_id: '' });
            onClose();
        } catch (err) { Alert(err?.data?.message || 'Xatolik', 'error'); }
    };

    const inp = { paddingLeft: 14 };
    const fld = (label, key, type = 'text', placeholder = '') => (
        <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>{label}</label>
            <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder} className="search-input" style={inp} />
            {errors[key] && <span style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>{errors[key]}</span>}
        </div>
    );

    return (
        <Modal open={open} onClose={onClose} title="Super Admin yaratish" size="sm">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    {fld("To'liq ism *",    'full_name', 'text',     "Aziz Azizov")}
                    {fld('Username *',       'username',  'text',     "aziz_admin")}
                    {fld('Telefon *',        'phone',     'text',     "998901234567")}
                    {fld('Parol *',          'password',  'password', "••••••••")}
                    <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Maktab *</label>
                        <select value={form.school_id}
                            onChange={e => setForm(p => ({ ...p, school_id: e.target.value }))}
                            style={{ width: '100%', padding: '9px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--input-border)', borderRadius: 9, color: 'var(--input-text)', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}>
                            <option value="">Maktab tanlang</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {errors.school_id && <span style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>{errors.school_id}</span>}
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                    <button type="submit" className="btn-submit" disabled={isLoading}>
                        <Plus size={14} />{isLoading ? 'Yaratilmoqda...' : "Yaratish"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/* ─── Main ─── */
export default function DevPanel() {
    const [tab, setTab] = useState('schools');
    const [addOpen, setAddOpen] = useState(false);
    const [editSchool, setEditSchool] = useState(null);
    const [deleteSchool, setDeleteSchool] = useState(null);
    const [saOpen, setSaOpen] = useState(false);
    const [saSearch, setSaSearch] = useState('');

    const { data: schoolsData, isLoading: sl, refetch } = useGetSchoolsQuery({});
    const [createSchool, { isLoading: creating }] = useCreateSchoolMutation();
    const [updateSchool, { isLoading: updating }] = useUpdateSchoolMutation();
    const [fetchSuperAdmins, { data: saData, isLoading: sal }] = useLazyGetUsersQuery();

    useEffect(() => {
        if (tab === 'super_admins') fetchSuperAdmins({ role: 'super_admin', limit: 100, ...(saSearch && { search: saSearch }) });
    }, [tab, saSearch]);

    const schools = schoolsData?.data?.records || schoolsData?.data || [];
    const superAdmins = saData?.data?.records || [];

    const TABS = [
        { key: 'schools',      label: 'Maktablar',     icon: Building2 },
        { key: 'super_admins', label: 'Super Adminlar', icon: Users     },
    ];

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><KeyRound size={18} /></span>
                    Developer paneli
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--input-bg)', borderRadius: 12, border: '1px solid var(--card-border)', marginBottom: 20, width: 'fit-content' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, border: 'none',
                        cursor: 'pointer', fontSize: '0.82rem', fontWeight: tab === t.key ? 600 : 500,
                        background: tab === t.key ? 'var(--accent)' : 'transparent',
                        color: tab === t.key ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s',
                    }}>
                        <t.icon size={14} />{t.label}
                    </button>
                ))}
            </div>

            {/* ── SCHOOLS ── */}
            {tab === 'schools' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
                        <button className="btn-refresh" onClick={refetch}><RefreshCw size={15} /></button>
                        <button className="btn-create" onClick={() => setAddOpen(true)}>
                            <Plus size={15} /> Maktab qo'shish
                        </button>
                    </div>

                    {sl ? <Loading /> : schools.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                            <Building2 size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }} />
                            <p>Maktablar topilmadi</p>
                        </div>
                    ) : (
                        <div className="data-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr><th>№</th><th>Maktab nomi</th><th>Yaratilgan</th><th>Amallar</th></tr>
                                </thead>
                                <tbody>
                                    {schools.map((s, i) => (
                                        <tr key={s.id}>
                                            <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{i + 1}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Building2 size={15} style={{ color: 'var(--accent)' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {s.createdAt ? new Date(s.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="action-btn action-btn-primary" onClick={() => setEditSchool(s)} title="Tahrirlash"><Pencil size={13} /></button>
                                                    <button className="action-btn action-btn-danger" onClick={() => setDeleteSchool(s)} title="O'chirish"><Trash2 size={13} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Add Modal */}
                    <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Yangi maktab qo'shish" size="sm">
                        <SchoolForm
                            onSubmit={async (data) => {
                                try { await createSchool(data).unwrap(); Alert("Maktab qo'shildi", 'success'); setAddOpen(false); }
                                catch (err) { Alert(err?.data?.message || 'Xatolik', 'error'); }
                            }}
                            onClose={() => setAddOpen(false)}
                            loading={creating}
                        />
                    </Modal>

                    {/* Edit Modal */}
                    <Modal open={!!editSchool} onClose={() => setEditSchool(null)} title="Maktabni tahrirlash" size="sm">
                        {editSchool && (
                            <SchoolForm
                                initial={editSchool}
                                onSubmit={async (data) => {
                                    try { await updateSchool({ id: editSchool.id, data }).unwrap(); Alert('Maktab yangilandi', 'success'); setEditSchool(null); }
                                    catch (err) { Alert(err?.data?.message || 'Xatolik', 'error'); }
                                }}
                                onClose={() => setEditSchool(null)}
                                loading={updating}
                            />
                        )}
                    </Modal>

                    <DeleteSchoolModal school={deleteSchool} onClose={() => setDeleteSchool(null)} />
                </div>
            )}

            {/* ── SUPER ADMINS ── */}
            {tab === 'super_admins' && (
                <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                        <div className="search-input-wrap">
                            <Search className="search-icon" size={16} />
                            <input className="search-input" type="text" placeholder="Qidirish..."
                                value={saSearch} onChange={e => setSaSearch(e.target.value)} />
                        </div>
                        <button className="btn-create" onClick={() => setSaOpen(true)}>
                            <Plus size={15} /> Super Admin yaratish
                        </button>
                    </div>

                    {sal ? <Loading /> : superAdmins.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                            <Users size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }} />
                            <p>Super adminlar topilmadi</p>
                        </div>
                    ) : (
                        <div className="data-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr><th>№</th><th>To'liq ism</th><th>Username</th><th>Telefon</th><th>Maktab</th></tr>
                                </thead>
                                <tbody>
                                    {superAdmins.map((u, i) => (
                                        <tr key={u.id}>
                                            <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{u.username}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{u.school?.name || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <CreateSuperAdminModal schools={schools} open={saOpen} onClose={() => setSaOpen(false)} />
                </div>
            )}
        </div>
    );
}
