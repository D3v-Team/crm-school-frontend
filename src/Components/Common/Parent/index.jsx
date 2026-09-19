import { useEffect, useState } from "react";
import { useLazyGetUsersQuery, useResetPasswordMutation, useResetChatIdMutation } from "../../../store/services/user.api";
import { useUnassignParentMutation } from "../../../store/services/student.api";
import Create from "./__components/Create";
import Edit from "./__components/Edit";
import Delete from "./__components/Delete";
import AddChildren from "./__components/AddChildren";
import Loading from "../../Other/UI/Loadings/Loading";
import { NavLink } from "react-router-dom";
import DebouncedSearchInput from "../../Other/UI/DebouncedSearchInput";
import { Alert } from "../../Other/UI/Alert/Alert";
import Modal from "../../Other/UI/Modal/Modal";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Search, Users, Eye, EyeOff, MessageCircle, MessageCircleOff,
    UserX, AlertTriangle, X, KeyRound, RotateCcw, Check,
} from "lucide-react";

/* ── Reset password modal ── */
function ResetPasswordModal({ user, onClose }) {
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resetPw, { isLoading }] = useResetPasswordMutation();

    const handle = async (e) => {
        e.preventDefault();
        if (newPassword.trim().length < 4) { Alert("Parol kamida 4 ta belgi bo'lishi kerak", 'error'); return; }
        try {
            await resetPw({ id: user.id, data: { new_password: newPassword } }).unwrap();
            Alert(`${user.full_name} paroli yangilandi`, 'success');
            onClose();
        } catch (err) { Alert(err?.data?.message || 'Xatolik', 'error'); }
    };

    return (
        <Modal open onClose={onClose} title="Parolni yangilash" size="sm">
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{user?.full_name}</strong> uchun yangi parol
            </div>
            <form onSubmit={handle}>
                <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Yangi parol *</label>
                    <div style={{ position: 'relative' }}>
                        <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                            placeholder="Yangi parol kiriting" className="search-input" style={{ paddingLeft: 14, paddingRight: 42 }} autoFocus />
                        <button type="button" onClick={() => setShowPassword(value => !value)}
                            title={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                            aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                    <button type="submit" className="btn-submit" disabled={isLoading || !newPassword.trim()}>
                        <Check size={14}/>{isLoading ? 'Yangilanmoqda...' : 'Saqlash'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/* ── Reset chat_id confirm modal ── */
function ResetChatIdModal({ user, onClose }) {
    const [resetChat, { isLoading }] = useResetChatIdMutation();

    const handle = async () => {
        try {
            await resetChat(user.id).unwrap();
            Alert(`${user.full_name} Bot ulanishi uzildi`, 'success');
            onClose();
        } catch (err) { Alert(err?.data?.message || 'Xatolik', 'error'); }
    };

    return (
        <Modal open onClose={onClose} title="Bot ulanishini uzish" size="sm">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '4px 0 8px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={18} style={{ color: 'var(--warning)' }}/>
                </div>
                <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                        <strong>{user?.full_name}</strong> ning Telegram bot ulanishini uzmoqchimisiz?
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Ota-ona qayta /start bosib ulanishi mumkin.
                    </p>
                </div>
            </div>
            <div className="modal-footer">
                <button className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                <button onClick={handle} disabled={isLoading}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, border:'none', background:'var(--warning)', color:'#fff', fontSize:'0.82rem', fontWeight:600, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                    <RotateCcw size={13}/>{isLoading ? 'Uzilmoqda...' : 'Uzish'}
                </button>
            </div>
        </Modal>
    );
}

/* ── Remove child from parent ── */
function RemoveChild({ studentId, studentName, parentId, onSuccess }) {
    const [open, setOpen] = useState(false);
    const [unassign, { isLoading }] = useUnassignParentMutation();

    const handle = async () => {
        try {
            await unassign(studentId).unwrap();
            Alert(`${studentName} ajratildi`, "success");
            if (onSuccess) onSuccess();
            setOpen(false);
        } catch (err) {
            Alert(err?.data?.message || "Xatolik", "error");
        }
    };

    return (
        <>
            <button onClick={() => setOpen(true)}
                style={{ background: 'var(--danger-soft)', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.68rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}
                title={`${studentName}ni ajratish`}>
                <UserX size={10}/> {studentName}
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="Farzandni ajratish" size="sm">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '4px 0 8px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={18} style={{ color: 'var(--danger)' }}/>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                            <strong style={{ color: 'var(--danger)' }}>{studentName}</strong> ni ota-onadan ajratmoqchisiz.
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Qayta biriktirish mumkin.</p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setOpen(false)}>Bekor qilish</button>
                    <button className="btn-delete" onClick={handle} disabled={isLoading}>
                        <UserX size={13}/> {isLoading ? 'Ajratilmoqda...' : 'Ajratish'}
                    </button>
                </div>
            </Modal>
        </>
    );
}

export default function Parent() {
    const [page, setPage] = useState(1);
    const [limit] = useState(30);
    const [search, setSearch] = useState("");
    const [resetPwUser,   setResetPwUser]   = useState(null);
    const [resetChatUser, setResetChatUser] = useState(null);

    const [trigger, { data, isLoading, error }] = useLazyGetUsersQuery();

    const fetchUsers = (p = page, s = search) => {
        trigger({ page: p, limit, role: 'parent', ...(s && { search: s }) });
    };

    useEffect(() => { fetchUsers(1); }, []);
    const handleSearch = () => { setPage(1); fetchUsers(1, search); };
    const handleClear = () => { setSearch(""); setPage(1); fetchUsers(1, ""); };

    const users = data?.data?.records || [];
    const pg = data?.data?.pagination || {};
    const totalPages = pg.total_pages || 1;
    const currentPage = pg.currentPage || 1;

    const goTo = (p) => { setPage(p); fetchUsers(p); };

    return (
        <div>
            <div className="page-toolbar">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:'auto' }}>
                    <span className="page-title-icon"><Users size={18}/></span>
                    <span style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-primary)' }}>Ota-onalar</span>
                </div>
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16}/>
                    <DebouncedSearchInput className="search-input" type="text" placeholder="Ism yoki username..."
                        value={search} onChange={setSearch} onSearch={value => { setPage(1); fetchUsers(1, value); }}/>
                    {search && (
                        <button className="toolbar-clear-btn" onClick={handleClear}><X size={14}/></button>
                    )}
                </div>
                <Create/>
            </div>

            {isLoading && <Loading/>}
            {error && (
                <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 10 }}>
                    Xatolik: {error?.data?.message || "Noma'lum xatolik"}
                </div>
            )}

            {!isLoading && !error && (
                <>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>№</th>
                                    <th>To'liq ism</th>
                                    <th>Telefon</th>
                                    <th>Username</th>
                                    <th>Bot holati</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>Ota-onalar topilmadi</td></tr>
                                ) : users.map((u, i) => {
                                    const botConnected = !!u.chat_id;
                                    return (
                                        <tr key={u.id}>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                                                {(currentPage - 1) * limit + i + 1}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{u.phone || "—"}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{u.username}</td>
                                            <td>
                                                {botConnected ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--success-soft)', color: 'var(--success)' }}>
                                                        <MessageCircle size={11}/> Ulangan
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                                                        <MessageCircleOff size={11}/> Ulanmagan
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <NavLink to={`/parent/${u.id}`}>
                                                        <button className="action-btn action-btn-ghost" title="Profil">
                                                            <Eye size={14}/>
                                                        </button>
                                                    </NavLink>
                                                    <AddChildren parentId={u.id} onAdd={() => fetchUsers(page)}/>
                                                    {/* Parolni yangilash */}
                                                    <button className="action-btn action-btn-ghost" onClick={() => setResetPwUser(u)} title="Parolni yangilash">
                                                        <KeyRound size={14}/>
                                                    </button>
                                                    {/* Bot chat_id reset — faqat ulangan bo'lsa */}
                                                    {u.chat_id && (
                                                        <button className="action-btn" onClick={() => setResetChatUser(u)} title="Bot ulanishini uzish"
                                                            style={{ background: 'var(--warning-soft)', color: 'var(--warning)', border: '1px solid var(--warning)' }}>
                                                            <RotateCcw size={14}/>
                                                        </button>
                                                    )}
                                                    <Edit user={u}/>
                                                    <Delete user={u}/>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        <span/>
                        <div className="pagination-controls">
                            <button className="page-btn" onClick={() => goTo(1)} disabled={currentPage <= 1}><ChevronsLeft size={15}/></button>
                            <button className="page-btn" onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft size={15}/></button>
                            <span className="page-current">{currentPage}</span>
                            <button className="page-btn" onClick={() => goTo(currentPage + 1)} disabled={currentPage >= totalPages}><ChevronRight size={15}/></button>
                            <button className="page-btn" onClick={() => goTo(totalPages)} disabled={currentPage >= totalPages}><ChevronsRight size={15}/></button>
                        </div>
                    </div>
                </>
            )}

            {resetPwUser   && <ResetPasswordModal user={resetPwUser}   onClose={() => setResetPwUser(null)}/>}
            {resetChatUser && <ResetChatIdModal   user={resetChatUser} onClose={() => { setResetChatUser(null); fetchUsers(page); }}/>}
        </div>
    );
}
