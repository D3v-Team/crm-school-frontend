import { useEffect, useState } from "react";
import { useLazyGetStudentsQuery } from "../../../store/services/student.api";
import Create from "./__components/Create";
import Edit from "./__components/Edit";
import Delete from "./__components/Delete";
import AddGroup from "./__components/AddGroup";
import Loading from "../../Other/UI/Loadings/Loading";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Users, Eye, RefreshCw } from "lucide-react";

export default function Student() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [isActiveFilter, setIsActiveFilter] = useState(null);

    const [trigger, { data, isLoading, error }] = useLazyGetStudentsQuery();

    const fetchStudents = (p = page, s = search, f = isActiveFilter) => {
        trigger({ page: p, limit, ...(s && { search: s }), ...(f !== null && { is_active: f }) });
    };

    useEffect(() => { fetchStudents(1); }, []);

    const handleSearch = () => { setPage(1); fetchStudents(1, search, isActiveFilter); };
    const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };
    const handleClear = () => { setSearch(""); setIsActiveFilter(null); setPage(1); fetchStudents(1, "", null); };
    const handleFilterChange = (e) => {
        const v = e.target.value;
        const f = v === "active" ? true : v === "inactive" ? false : null;
        setIsActiveFilter(f);
        setPage(1);
        fetchStudents(1, search, f);
    };

    const students = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;

    const goTo = (p) => { setPage(p); fetchStudents(p); };

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><Users size={18} /></span>
                    O'quvchilar
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Create />
                    <button className="btn-refresh" onClick={() => fetchStudents(page)} title="Yangilash">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            <div className="search-bar">
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16} />
                    <input className="search-input" type="text" placeholder="Ism yoki telefon bo'yicha..."
                        value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleKeyDown} />
                </div>
                <select className="search-select"
                    value={isActiveFilter === null ? "all" : isActiveFilter ? "active" : "inactive"}
                    onChange={handleFilterChange}>
                    <option value="all">Barcha</option>
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                </select>
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
                                    <th>Narx</th>
                                    <th>Holat</th>
                                    <th>Guruh</th>
                                    <th>Ota-ona</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                                            O'quvchilar topilmadi
                                        </td>
                                    </tr>
                                ) : students.map((s, i) => (
                                    <tr key={s.id}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                                            {(currentPage - 1) * limit + i + 1}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{s.phone || "—"}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            {s.price ? Number(s.price).toLocaleString('ru-RU') + " so\u2018m" : "—"}
                                        </td>
                                        <td>
                                            <span className={s.is_active ? 'badge badge-active' : 'badge badge-inactive'}>
                                                {s.is_active ? "Faol" : "Nofaol"}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{s.group?.name || s.group_name || "—"}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{s.parent?.full_name || s.parent_name || "—"}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <NavLink to={`/student/${s.id}`}>
                                                    <button className="action-btn action-btn-ghost" title="Ko'rish">
                                                        <Eye size={14} />
                                                    </button>
                                                </NavLink>
                                                <AddGroup onAdd={fetchStudents} studentID={s.id} />
                                                <Edit student={s} />
                                                <Delete student={s} />
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
