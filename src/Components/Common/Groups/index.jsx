import { useEffect, useState } from "react";
import { useLazyGetGroupsQuery } from "../../../store/services/group.api";
import Create from "./__components/Create";
import Delete from "./__components/Delete";
import Edit from "./__components/Edit";
import Loading from "../../Other/UI/Loadings/Loading";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Layers, Eye, RefreshCw } from "lucide-react";

export default function Groups() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [trigger, { data, isLoading, error }] = useLazyGetGroupsQuery();

    const fetchGroups = (p = page, s = search) => {
        trigger({ page: p, limit, ...(s && { search: s }) });
    };

    useEffect(() => { fetchGroups(1); }, []);

    const groups = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;

    const goTo = (p) => { setPage(p); fetchGroups(p); };
    const handleSearch = () => { setPage(1); fetchGroups(1, search); };
    const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };
    const handleClear = () => { setSearch(""); setPage(1); fetchGroups(1, ""); };

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><Layers size={18} /></span>
                    Guruhlar
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Create />
                    <button className="btn-refresh" onClick={() => fetchGroups(page)} title="Yangilash">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            <div className="search-bar">
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16} />
                    <input className="search-input" type="text" placeholder="Guruh nomi bo'yicha qidirish..."
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
                                    <th>Nomi</th>
                                    <th>Boshlanish sanasi</th>
                                    <th>Sinf rahbari</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>Guruhlar topilmadi</td></tr>
                                ) : groups.map((g, i) => (
                                    <tr key={g.id}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                                            {(currentPage - 1) * limit + i + 1}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{g.name}</td>
                                        <td>{g.start_date ? new Date(g.start_date).toLocaleDateString('uz-UZ') : "—"}</td>
                                        <td>{g.homeroom_teacher?.full_name || g.homeroom_teacher_name || "—"}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <NavLink to={`/group/${g.id}`}>
                                                    <button className="action-btn action-btn-ghost" title="Ko'rish"><Eye size={14} /></button>
                                                </NavLink>
                                                <Edit group={g} />
                                                <Delete group={g} />
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
