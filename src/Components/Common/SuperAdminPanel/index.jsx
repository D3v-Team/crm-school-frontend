import { useEffect, useState } from 'react';
import {
    useLazyGetUsersQuery, useCreateUserMutation,
    useUpdateUserMutation, useDeleteUserMutation,
    useUpdateIsPaymentMutation, useResetPasswordMutation,
} from '../../../store/services/user.api';
import {
    Users, Plus, Pencil, Trash2, AlertTriangle,
    RefreshCw, Search, ToggleLeft, ToggleRight,
    KeyRound, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';
import Modal from '../../Other/UI/Modal/Modal';
import { Alert } from '../../Other/UI/Alert/Alert';

const ROLE_OPTIONS = [
    { value: 'admin',   label: 'Admin'      },
    { value: 'teacher', label: "O'qituvchi" },
    { value: 'hr',      label: 'HR'         },
    { value: 'cashier', label: 'Kassir'     },
];
const ROLE_FILTER = [
    { value: '', label: 'Barcha rollar' },
    ...ROLE_OPTIONS,
];
const ROLE_BADGE = {
    admin:       { label: 'Admin',       bg: 'var(--accent-soft)',   color: 'var(--accent)'   },
    teacher:     { label: "O'qituvchi",  bg: 'var(--success-soft)',  color: 'var(--success)'  },
    hr:          { label: 'HR',          bg: 'var(--warning-soft)',  color: 'var(--warning)'  },
    cashier:     { label: 'Kassir',      bg: '#f0fdf4',              color: '#16a34a'          },
    super_admin: { label: 'Super Admin', bg: '#fdf4ff',              color: '#9333ea'          },
};

// Jadvalda ko'rinmasligi kerak bo'lgan rollar
const HIDDEN_ROLES = ['super_admin', 'dev', 'parent'];

const sel = { width: '100%', padding: '9px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--input-border)', borderRadius: 9, color: 'var(--input-text)', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' };

/* ─── Create / Edit form ─── */
function UserFormModal({ user, onClose, onSaved }) {
    const isEdit = !!user;
    const [form, setForm] = useState({
        full_name: user?.full_name || '',
        username:  user?.username  || '',
        phone:     user?.phone     || '',
        role:      user?.role      || 'admin',
        password:  '',
    });
    const [errors, setErrors] = useState({});
    const [create, { isLoading: cl }] = useCreateUserMutation();
    const [update, { isLoading: ul }] = useUpdateUserMutation();

    const validate = () => {
        const e = {};
        if (!form.full_name.trim()) e.full_name = 'Ism kiritilishi kerak';
        if (!form.username.trim())  e.username  = 'Username kiritilishi kerak';
        if (!form.phone.trim())     e.phone     = 'Telefon kiritilishi kerak';
        if (!isEdit && !form.password.trim()) e.password = 'Parol kiritilishi kerak';
        setErrors(e);
        return !Object.keys(e).length;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            const payload = {
                full_name: form.full_name.trim(),
                username:  form.username.trim(),
                phone:     form.phone.trim(),
                role:      form.role,
                ...((!isEdit || form.password) && { password: form.password }),
            };
            if (isEdit) await update({ id: user.id, data: payload }).unwrap();
            else        await create(payload).unwrap();
            Alert(isEdit ? 'Xodim yangilandi' : "Xodim qo'shildi", 'success');
            onSaved();
            onClose();
        } catch (err) { Alert(err?.data?.message || 'Xatolik', 'error'); }
    };

    const fld = (label, key, type = 'text', placeholder = '') => (
        <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>{label}</label>
            <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder} className="search-input" style={{ paddingLeft: 14 }} />
            {errors[key] && <span style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>{errors[key]}</span>}
        </div>
    );

    return (
        <Modal open onClose={onClose} title={isEdit ? 'Xodimni tahrirlash' : "Yangi xodim qo'shish"} size="sm">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    {fld("To'liq ism *", 'full_name', 'text',     'John Doe')}
                    {fld('Username *',   'username',  'text',     'john_doe')}
                    {fld('Telefon *',    'phone',     'text',     '+998901234567')}
                    {!isEdit && fld('Parol *', 'password', 'password', '••••••••')}
                    {isEdit && (
                        <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Yangi parol (ixtiyoriy)</label>
                            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                placeholder="O'zgartirmaslik uchun bo'sh qoldiring" className="search-input" style={{ paddingLeft: 14 }} />
                        </div>
                    )}
                    <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Rol *</label>
                        <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={sel}>
                            {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                    <button type="submit" className="btn-submit" disabled={cl || ul}>
                        <Plus size={14} />{cl || ul ? 'Saqlanmoqda...' : isEdit ? 'Yangilash' : "Qo'shish"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/* ─── Delete modal ─── */
function DeleteUserModal({ user, onClose, onSaved }) {
    const [del, { isLoading }] = useDeleteUserMutation();
    const handle = async () => {
        try { await del(user.id).unwrap(); Alert("Xodim o'chirildi", 'success'); onSaved(); onClose(); }
        catch (err) { Alert(err?.data?.message || 'Xatolik', 'error'); }
    };
    return (
        <Modal open onClose={onClose} title="Xodimni o'chirish" size="sm">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '4px 0 8px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
                </div>
                <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                        <strong>{user?.full_name}</strong> ni o'chirmoqchimisiz?
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

/* ─── Reset password modal ─── */
function ResetPasswordModal({ user, onClose }) {
    const [newPassword, setNewPassword] = useState('');
    const [resetPw, { isLoading }] = useResetPasswordMutation();
    const handle = async (e) => {
        e.preventDefault();
        if (!newPassword.trim()) return;
        try {
            await resetPw({ id: user.id, data: { new_password: newPassword } }).unwrap();
            Alert("Parol yangilandi", 'success');
            onClose();
        } catch (err) { Alert(err?.data?.message || 'Xatolik', 'error'); }
    };
    return (
        <Modal open onClose={onClose} title={`Parolni yangilash — ${user?.full_name}`} size="sm">
            <form onSubmit={handle}>
                <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Yangi parol *</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Yangi parol kiriting" className="search-input" style={{ paddingLeft: 14 }} autoFocus />
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                    <button type="submit" className="btn-submit" disabled={isLoading || !newPassword.trim()}>
                        <KeyRound size={14} />{isLoading ? 'Yangilanmoqda...' : 'Yangilash'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/* ─── Main ─── */
export default function SuperAdminPanel() {
    const [page, setPage]     = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [addOpen, setAddOpen]     = useState(false);
    const [editUser, setEditUser]   = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);
    const [resetPwUser, setResetPwUser] = useState(null);

    const [trigger, { data, isLoading, error }] = useLazyGetUsersQuery();
    const [togglePayment, { isLoading: toggling }] = useUpdateIsPaymentMutation();

    const fetch = (p = page, s = search, r = roleFilter) => {
        trigger({ page: p, limit: 15, ...(s && { search: s }), ...(r && { role: r }) });
    };

    useEffect(() => { fetch(1); }, []);

    // Faqat xodim rollarini ko'rsatamiz — super_admin, dev, parent chiqmasin
    const users      = (data?.data?.records || []).filter(u => !HIDDEN_ROLES.includes(u.role));
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages  || 1;
    const curPage    = pagination.currentPage  || 1;

    const goTo = (p) => { setPage(p); fetch(p); };

    const handleTogglePayment = async (user) => {
        try {
            await togglePayment({ id: user.id, data: { is_payment: !user.is_payment } }).unwrap();
            Alert(`To'lov holati ${!user.is_payment ? 'yoqildi' : "o'chirildi"}`, 'success');
            fetch(curPage);
        } catch (err) { Alert(err?.data?.message || 'Xatolik', 'error'); }
    };

    const saved = () => fetch(curPage);

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><Users size={18} /></span>
                    Xodimlar boshqaruvi
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-create" onClick={() => setAddOpen(true)}>
                        <Plus size={15} /> Xodim qo'shish
                    </button>
                    <button className="btn-refresh" onClick={() => fetch(curPage)} title="Yangilash">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="search-bar">
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16} />
                    <input className="search-input" type="text" placeholder="Ism yoki username..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetch(1, search, roleFilter); } }} />
                </div>
                <select className="search-select" value={roleFilter}
                    onChange={e => { setRoleFilter(e.target.value); setPage(1); fetch(1, search, e.target.value); }}>
                    {ROLE_FILTER.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button className="search-btn" onClick={() => { setPage(1); fetch(1, search, roleFilter); }}>Qidirish</button>
                <button className="clear-btn" onClick={() => { setSearch(''); setRoleFilter(''); setPage(1); fetch(1, '', ''); }}>Tozalash</button>
            </div>

            {isLoading && <Loading />}
            {error && <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10 }}>Xatolik: {error?.data?.message}</div>}

            {!isLoading && !error && (
                <>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>№</th>
                                    <th>To'liq ism</th>
                                    <th>Username</th>
                                    <th>Telefon</th>
                                    <th>Rol</th>
                                    <th>To'lov</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>Xodimlar topilmadi</td></tr>
                                ) : users.map((u, i) => {
                                    const badge = ROLE_BADGE[u.role] || { label: u.role, bg: 'var(--input-bg)', color: 'var(--text-muted)' };
                                    return (
                                        <tr key={u.id}>
                                            <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{(curPage - 1) * 15 + i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{u.username}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                                            <td>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: badge.bg, color: badge.color }}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleTogglePayment(u)}
                                                    disabled={toggling}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, transition: 'background 0.15s' }}
                                                    title={u.is_payment ? "To'lovni o'chirish" : "To'lovni yoqish"}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--input-bg)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    {u.is_payment
                                                        ? <ToggleRight size={22} style={{ color: 'var(--success)' }} />
                                                        : <ToggleLeft  size={22} style={{ color: 'var(--text-muted)' }} />
                                                    }
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: u.is_payment ? 'var(--success)' : 'var(--text-muted)' }}>
                                                        {u.is_payment ? 'Faol' : "O'chirilgan"}
                                                    </span>
                                                </button>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 5 }}>
                                                    <button className="action-btn action-btn-primary" onClick={() => setEditUser(u)} title="Tahrirlash"><Pencil size={13} /></button>
                                                    <button className="action-btn action-btn-ghost" onClick={() => setResetPwUser(u)} title="Parolni yangilash" style={{ fontSize: 11 }}><KeyRound size={13} /></button>
                                                    <button className="action-btn action-btn-danger" onClick={() => setDeleteUser(u)} title="O'chirish"><Trash2 size={13} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {users.length > 0 && `Jami ${users.length} ta xodim (shu sahifada)`}
                        </span>
                        <div className="pagination-controls">
                            <button className="page-btn" onClick={() => goTo(1)} disabled={curPage <= 1}><ChevronsLeft size={15} /></button>
                            <button className="page-btn" onClick={() => goTo(curPage - 1)} disabled={curPage <= 1}><ChevronLeft size={15} /></button>
                            <span className="page-current">{curPage}</span>
                            <button className="page-btn" onClick={() => goTo(curPage + 1)} disabled={curPage >= totalPages}><ChevronRight size={15} /></button>
                            <button className="page-btn" onClick={() => goTo(totalPages)} disabled={curPage >= totalPages}><ChevronsRight size={15} /></button>
                        </div>
                    </div>
                </>
            )}

            {addOpen    && <UserFormModal onClose={() => setAddOpen(false)}    onSaved={saved} />}
            {editUser   && <UserFormModal user={editUser}  onClose={() => setEditUser(null)}   onSaved={saved} />}
            {deleteUser && <DeleteUserModal user={deleteUser} onClose={() => setDeleteUser(null)} onSaved={saved} />}
            {resetPwUser && <ResetPasswordModal user={resetPwUser} onClose={() => setResetPwUser(null)} />}
        </div>
    );
}