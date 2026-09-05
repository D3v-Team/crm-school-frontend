import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useLazyGetGroupsQuery } from "../../../store/services/group.api";
import Loading from "../../Other/UI/Loadings/Loading";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Search, Layers, X, RefreshCw, Eye,
} from "lucide-react";
import DebouncedSearchInput from "../../Other/UI/DebouncedSearchInput";

export default function CashierGroups() {
    const [page, setPage]     = useState(1);
    const [search, setSearch] = useState("");

    const [trigger, { data, isLoading, error }] = useLazyGetGroupsQuery();

    const fetchGroups = (p = page, s = search) => {
        trigger({ page: p, limit: 10, ...(s && { search: s }) });
    };

    useEffect(() => { fetchGroups(1); }, []);

    const groups      = data?.data?.records || [];
    const pagination  = data?.data?.pagination || {};
    const totalPages  = pagination.total_pages  || 1;
    const currentPage = pagination.currentPage  || 1;

    const goTo = (p) => { setPage(p); fetchGroups(p); };

    return (
        <div>
            {/* Header */}
            <div className="page-toolbar">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
                    <span className="page-title-icon"><Layers size={18} /></span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>Guruhlar</span>
                </div>
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16} />
                    <DebouncedSearchInput
                        className="search-input" type="text" placeholder="Guruh nomi..."
                        value={search} onChange={setSearch}
                        onSearch={val => { setPage(1); fetchGroups(1, val); }}
                    />
                    {search && (
                        <button className="toolbar-clear-btn" onClick={() => { setSearch(""); setPage(1); fetchGroups(1, ""); }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <button className="btn-refresh" onClick={() => fetchGroups(page)} title="Yangilash">
                    <RefreshCw size={15} />
                </button>
            </div>

            {isLoading && <Loading />}
            {error && (
                <div style={{ color: "var(--danger)", padding: 12, background: "var(--danger-soft)", borderRadius: 10 }}>
                    Xatolik: {error?.data?.message}
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
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
                                            Guruhlar topilmadi
                                        </td>
                                    </tr>
                                ) : groups.map((g, i) => (
                                    <tr key={g.id}>
                                        <td style={{ color: "var(--text-muted)", fontSize: "0.78rem", fontFamily: "monospace" }}>
                                            {(currentPage - 1) * 10 + i + 1}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{g.name}</td>
                                        <td style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                                            {g.start_date ? new Date(g.start_date).toLocaleDateString("uz-UZ") : "—"}
                                        </td>
                                        <td style={{ color: "var(--text-secondary)" }}>{g.homeroom_teacher?.full_name || "—"}</td>
                                        <td>
                                            <NavLink to={`/group/${g.id}`}>
                                                <button className="action-btn action-btn-ghost" title="Ko'rish">
                                                    <Eye size={14} />
                                                </button>
                                            </NavLink>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            Jami {pagination.total_count || groups.length} ta guruh
                        </span>
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
