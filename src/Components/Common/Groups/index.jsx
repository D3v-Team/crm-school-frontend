import { useEffect, useState } from "react";
import { useLazyGetGroupsQuery } from "../../../store/services/group.api";
import { useGetUserByIdQuery } from "../../../store/services/user.api";
import Create from "./__components/Create";
import Delete from "./__components/Delete";
import Edit from "./__components/Edit";
import Loading from "../../Other/UI/Loadings/Loading";
import { NavLink } from "react-router-dom";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Search, Layers, Eye, RefreshCw, X,
} from "lucide-react";
import { useAppSelector } from "../../../store/hooks";
import Cookies from "js-cookie";
import DebouncedSearchInput from "../../Other/UI/DebouncedSearchInput";

export default function Groups() {
    const roleFromStore = useAppSelector(s => s.auth?.role);
    const userIdFromStore = useAppSelector(s => s.auth?.userId);
    const role  = roleFromStore  || Cookies.get('role');
    const userId = userIdFromStore || Cookies.get('userId');
    const isTeacher = role === 'teacher';

    /* ── Admin state ── */
    const [page, setPage]     = useState(1);
    const [limit]             = useState(10);
    const [search, setSearch] = useState("");

    const [triggerAll, { data: allData, isLoading: allLoading, error: allError }] = useLazyGetGroupsQuery();

    /* ── Teacher state: fetch own profile to get homeroom_groups ── */
    const {
        data: profileData,
        isLoading: profileLoading,
        error: profileError,
        refetch: refetchProfile,
    } = useGetUserByIdQuery(userId, { skip: !isTeacher || !userId });

    useEffect(() => {
        if (!isTeacher) triggerAll({ page: 1, limit });
    }, [isTeacher]);

    /* ── Derived data ── */
    const teacherGroups = (profileData?.data?.homeroom_groups || profileData?.homeroom_groups || []);
    const filteredTeacherGroups = search
        ? teacherGroups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()))
        : teacherGroups;

    const groups      = isTeacher ? filteredTeacherGroups : (allData?.data?.records || []);
    const pagination  = isTeacher ? {} : (allData?.data?.pagination || {});
    const totalPages  = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;
    const isLoading   = isTeacher ? profileLoading : allLoading;
    const error       = isTeacher ? profileError   : allError;

    /* ── Handlers ── */
    const fetchGroups = (p = page, s = search) => {
        if (!isTeacher) triggerAll({ page: p, limit, ...(s && { search: s }) });
    };
    const handleSearch  = () => { setPage(1); fetchGroups(1, search); };
    const handleClear   = () => { setSearch(""); if (!isTeacher) { setPage(1); fetchGroups(1, ""); } };
    const goTo          = (p) => { setPage(p); fetchGroups(p); };

    return (
        <div>
            <div className="page-toolbar">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:'auto' }}>
                    <span className="page-title-icon"><Layers size={18}/></span>
                    <span style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-primary)' }}>
                        {isTeacher ? "Mening guruhlarim" : "Guruhlar"}
                    </span>
                </div>
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16}/>
                    <DebouncedSearchInput className="search-input" type="text" placeholder="Guruh nomi..."
                        value={search} onChange={setSearch} onSearch={value => { if (!isTeacher) { setPage(1); fetchGroups(1, value); } }}/>
                    {search && (
                        <button className="toolbar-clear-btn" onClick={handleClear}><X size={14}/></button>
                    )}
                </div>
                {!isTeacher && <Create/>}
                <button className="btn-refresh" onClick={() => isTeacher ? refetchProfile() : fetchGroups(page)} title="Yangilash">
                    <RefreshCw size={15}/>
                </button>
            </div>

            {isLoading && <Loading />}
            {error && (
                <div style={{
                    background: 'var(--danger-soft)', border: '1px solid var(--danger)',
                    color: 'var(--danger)', padding: '12px 16px', borderRadius: 10,
                }}>
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
                                    <th>Nomi</th>
                                    <th>Boshlanish sanasi</th>
                                    <th>Sinf rahbari</th>
                                    <th>Telefon</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                                            {isTeacher ? "Sizga biriktirilgan guruhlar yo'q" : "Guruhlar topilmadi"}
                                        </td>
                                    </tr>
                                ) : groups.map((g, i) => (
                                    <tr key={g.id}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                                            {isTeacher ? i + 1 : (currentPage - 1) * limit + i + 1}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{g.name}</td>
                                        <td>
                                            {g.start_date
                                                ? new Date(g.start_date).toLocaleDateString('uz-UZ')
                                                : "—"}
                                        </td>
                                        <td>
                                            {g.homeroom_teacher?.full_name || g.homeroom_teacher_name
                                                /* For homeroom_groups the teacher IS the user */
                                                || (isTeacher ? "Siz" : "—")}
                                        </td>
                                        <td style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>
                                            {g.homeroom_teacher?.phone || "—"}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <NavLink to={`/group/${g.id}`}>
                                                    <button className="action-btn action-btn-ghost" title="Ko'rish">
                                                        <Eye size={14} />
                                                    </button>
                                                </NavLink>
                                                {!isTeacher && <Edit group={g} />}
                                                {!isTeacher && <Delete group={g} />}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {!isTeacher && (
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
                    )}
                </>
            )}
        </div>
    );
}
