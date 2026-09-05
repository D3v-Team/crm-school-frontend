import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useLazyGetStudentsQuery } from "../../../store/services/student.api";
import Loading from "../../Other/UI/Loadings/Loading";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Search, Users, X, RefreshCw, Wallet, Eye,
} from "lucide-react";
import DebouncedSearchInput from "../../Other/UI/DebouncedSearchInput";

export default function CashierStudents() {
    const [page, setPage]           = useState(1);
    const [search, setSearch]       = useState("");
    const [isActiveFilter, setIsActiveFilter] = useState(true);

    const [trigger, { data, isLoading, error }] = useLazyGetStudentsQuery();

    const fetchStudents = (p = page, s = search, f = isActiveFilter) => {
        trigger({ page: p, limit: 15, ...(s && { search: s }), is_active: f });
    };

    useEffect(() => { fetchStudents(1); }, []);

    const students    = data?.data?.records || [];
    const pagination  = data?.data?.pagination || {};
    const totalPages  = pagination.total_pages  || 1;
    const currentPage = pagination.currentPage  || 1;

    const goTo = (p) => { setPage(p); fetchStudents(p); };

    return (
        <div>
            {/* Header */}
            <div className="page-toolbar">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
                    <span className="page-title-icon"><Users size={18} /></span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>O'quvchilar</span>
                </div>
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16} />
                    <DebouncedSearchInput
                        className="search-input" type="text" placeholder="Ism yoki telefon..."
                        value={search} onChange={setSearch}
                        onSearch={val => { setPage(1); fetchStudents(1, val, isActiveFilter); }}
                    />
                    {search && (
                        <button className="toolbar-clear-btn" onClick={() => { setSearch(""); setPage(1); fetchStudents(1, "", isActiveFilter); }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    className="search-select"
                    value={isActiveFilter ? "active" : "inactive"}
                    onChange={e => { const f = e.target.value === "active"; setIsActiveFilter(f); setPage(1); fetchStudents(1, search, f); }}
                >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                </select>
                <button className="btn-refresh" onClick={() => fetchStudents(page)} title="Yangilash">
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
                                    <th>To'liq ism</th>
                                    <th>Telefon</th>
                                    <th>Narx</th>
                                    <th>Holat</th>
                                    <th>Guruh</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
                                            O'quvchilar topilmadi
                                        </td>
                                    </tr>
                                ) : students.map((s, i) => (
                                    <tr key={s.id}>
                                        <td style={{ color: "var(--text-muted)", fontSize: "0.78rem", fontFamily: "monospace" }}>
                                            {(currentPage - 1) * 15 + i + 1}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                                        <td style={{ color: "var(--text-secondary)" }}>{s.phone || "—"}</td>
                                        <td>
                                            {s.price ? (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)" }}>
                                                    <Wallet size={12} />
                                                    {Number(s.price).toLocaleString("ru-RU")} so'm
                                                </span>
                                            ) : "—"}
                                        </td>
                                        <td>
                                            <span className={s.is_active ? "badge badge-active" : "badge badge-inactive"}>
                                                {s.is_active ? "Faol" : "Nofaol"}
                                            </span>
                                        </td>
                                        <td style={{ color: "var(--text-secondary)" }}>{s.group?.name || "—"}</td>
                                        <td>
                                            <NavLink to={`/student/${s.id}`}>
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
                            Jami {pagination.total_count || 0} ta o'quvchi
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
