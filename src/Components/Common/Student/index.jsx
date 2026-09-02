import { useEffect, useState } from "react";
import { useLazyGetStudentsQuery } from "../../../store/services/student.api";
import Create from "./__components/Create";
import Edit from "./__components/Edit";
import Delete from "./__components/Delete";
import AddGroup from "./__components/AddGroup";
import ArchiveStudent from "./__components/Archive";
import QuickPayment from "./__components/QuickPayment";
import Loading from "../../Other/UI/Loadings/Loading";
import { NavLink } from "react-router-dom";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Search, Users, Eye, RefreshCw, Camera, CameraOff, X,
} from "lucide-react";
import { useAppSelector } from "../../../store/hooks";
import Cookies from "js-cookie";
import DebouncedSearchInput from "../../Other/UI/DebouncedSearchInput";

export default function Student() {
    const roleFromStore = useAppSelector(s => s.auth?.role);
    const role = roleFromStore || Cookies.get('role');
    const isTeacher = role === 'teacher';

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    // Default: show only active students
    const [isActiveFilter, setIsActiveFilter] = useState(true);

    const [trigger, { data, isLoading, error }] = useLazyGetStudentsQuery();

    const fetchStudents = (p = page, s = search, f = isActiveFilter) => {
        trigger({ page: p, limit, ...(s && { search: s }), ...(f !== null && { is_active: f }) });
    };

    useEffect(() => { fetchStudents(1); }, []);
    const handleSearch = () => { setPage(1); fetchStudents(1, search, isActiveFilter); };
    const handleClear = () => { setSearch(""); setPage(1); fetchStudents(1, "", isActiveFilter); };

    const handleFilterChange = (e) => {
        const v = e.target.value;
        const f = v === "active" ? true : false; // only active / inactive
        setIsActiveFilter(f);
        setPage(1);
        fetchStudents(1, search, f);
    };

    const showingActive = isActiveFilter !== false; // true = active tab

    const students = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;

    const goTo = (p) => { setPage(p); fetchStudents(p); };

    return (
        <div>
            <div className="page-toolbar">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:'auto' }}>
                    <span className="page-title-icon"><Users size={18}/></span>
                    <span style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-primary)' }}>O'quvchilar</span>
                </div>
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16}/>
                    <DebouncedSearchInput className="search-input" type="text" placeholder="Ism yoki telefon..."
                        value={search} onChange={setSearch} onSearch={value => { setPage(1); fetchStudents(1, value, isActiveFilter); }}/>
                    {search && (
                        <button className="toolbar-clear-btn" onClick={handleClear}><X size={14}/></button>
                    )}
                </div>
                <select className="search-select" value={isActiveFilter ? "active" : "inactive"} onChange={handleFilterChange}>
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                </select>
                {!isTeacher && <Create/>}
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
                                    <th>Kamera</th>
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
                                ) : students.map((s, i) => {
                                    const cameraLinked = !!s.hikvision_code;
                                    return (
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
                                            {/* Camera status */}
                                            <td>
                                                {cameraLinked ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--success-soft)', color: 'var(--success)' }}>
                                                        <Camera size={11} /> Ulangan
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                                                        <CameraOff size={11} /> Ulanmagan
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <NavLink to={`/student/${s.id}`}>
                                                        <button className="action-btn action-btn-ghost" title="Ko'rish">
                                                            <Eye size={14} />
                                                        </button>
                                                    </NavLink>
                                                    {!isTeacher && <AddGroup onAdd={() => fetchStudents(page)} studentID={s.id} />}
                                                    {!isTeacher && <Edit student={s} />}
                                                    {/* Faol: Arxivlash; Nofaol: Arxivdan chiqarish + O'chirish */}
                                                    {!isTeacher && <ArchiveStudent student={s} />}
                                                    {!isTeacher && !s.is_active && <Delete student={s} />}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
