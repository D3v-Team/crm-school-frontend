import { useEffect, useState } from "react";
import { useLazyGetUsersQuery } from "../../../store/services/user.api";
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
    Search, Users, RefreshCw, Eye, MessageCircle, MessageCircleOff,
    UserX, AlertTriangle, X,
} from "lucide-react";

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
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
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
                <button className="btn-refresh" onClick={() => fetchUsers(page)} title="Yangilash"><RefreshCw size={15}/></button>
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
                                                    {/* Profile link */}
                                                    <NavLink to={`/parent/${u.id}`}>
                                                        <button className="action-btn action-btn-ghost" title="Profil">
                                                            <Eye size={14}/>
                                                        </button>
                                                    </NavLink>
                                                    <AddChildren parentId={u.id} onAdd={() => fetchUsers(page)}/>
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
        </div>
    );
}
