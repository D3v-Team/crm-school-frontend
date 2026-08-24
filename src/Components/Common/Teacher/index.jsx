import { useEffect, useState } from "react";
import { useLazyGetUsersQuery } from "../../../store/services/user.api";
import Create from "./__components/Create";
import Edit from "./__components/Edit";
import Delete from "./__components/Delete";
import Loading from "../../Other/UI/Loadings/Loading";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Users, Eye, RefreshCw } from "lucide-react";

export default function Teacher() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");

    const [trigger, { data, isLoading, error }] = useLazyGetUsersQuery();

    const fetchUsers = (p = page, s = search) => {
        trigger({ page: p, limit, role: 'teacher', ...(s && { search: s }) });
    };

    useEffect(() => { fetchUsers(1); }, []);

    const handleSearch = () => { setPage(1); fetchUsers(1, search); };
    const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };
    const handleClear = () => { setSearch(""); setPage(1); fetchUsers(1, ""); };

    const users = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;

    const goTo = (p) => { setPage(p); fetchUsers(p); };

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><Users size={18} /></span>
                    O'qituvchilar
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Create />
                    <button className="btn-refresh" onClick={() => fetchUsers(page)} title="Yangilash">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            <div className="search-bar">
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16} />
                    <input className="search-input" type="text" placeholder="Ism yoki username bo'yicha..."
                        value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleKeyDown} />
                </div>
                <button className="search-btn" onClick={handleSearch}>Qidirish</button>
                <button className="clear-btn" onClick={handleClear}>Tozalash</button>
            </div>

            {isLoading && <Loading />}
            {error && (
                <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 10 }}>
                    Xatolik: {error.data?.message || "Noma'lum xatolik"}
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
                                    <th>Rol</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>O'qituvchilar topilmadi</td></tr>
                                ) : users.map((u, i) => (
                                    <tr key={u.id}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                                            {(currentPage - 1) * limit + i + 1}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{u.phone || "—"}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{u.username}</td>
                                        <td>
                                            <span className="badge badge-teacher">O'qituvchi</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <NavLink to={`/teacher/${u.id}`}>
                                                    <button className="action-btn action-btn-ghost" title="Ko'rish">
                                                        <Eye size={14} />
                                                    </button>
                                                </NavLink>
                                                <Edit user={u} />
                                                <Delete user={u} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        <span />
                        <div className="pagination-controls">
                            <button className="page-btn" onClick={() => goTo(1)} disabled={currentPage <= 1}><ChevronsLeft size={15} /></button>
                            <button className="page-btn" onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft size={15} /></button>
                            <span className="page-current">{currentPage}</span>
                            <button className="page-btn" onClick={() => goTo(currentPage + 1)} disabled={currentPage >= totalPages}><ChevronRight size={15} /></button>
                            <button className="page-btn" onClick={() => goTo(totalPages)} disabled={currentPage >= totalPages}><ChevronsRight size={15} /></button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
