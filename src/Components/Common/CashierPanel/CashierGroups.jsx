import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useLazyGetGroupsQuery } from "../../../store/services/group.api";
import { useGetUsersQuery } from "../../../store/services/user.api";
import { useGetSubjectsQuery } from "../../../store/services/subject.api";
import Loading from "../../Other/UI/Loadings/Loading";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Search, Layers, X, RefreshCw, Eye,
} from "lucide-react";
import DebouncedSearchInput from "../../Other/UI/DebouncedSearchInput";

export default function CashierGroups() {
    const [page, setPage]     = useState(1);
    const [search, setSearch] = useState("");
    const [teacherId, setTeacherId] = useState("");
    const [subjectId, setSubjectId] = useState("");

    const [trigger, { data, isLoading, error }] = useLazyGetGroupsQuery();
    const { data: teachersData } = useGetUsersQuery({ role: "teacher", limit: 200 });
    const { data: subjectsData } = useGetSubjectsQuery({ limit: 200 });
    const teachers = teachersData?.data?.records || [];
    const subjects = subjectsData?.data?.records || [];

    const fetchGroups = (p = page, s = search, teacher = teacherId, subject = subjectId) => {
        trigger({ page: p, limit: 10, ...(s && { search: s }), ...(teacher && { teacher_id: teacher }), ...(subject && { subject_id: subject }) });
    };

    useEffect(() => { trigger({ page: 1, limit: 10 }); }, [trigger]);

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
                <select className="search-select" value={teacherId} onChange={(event) => {
                    const nextTeacherId = event.target.value;
                    setTeacherId(nextTeacherId);
                    setPage(1);
                    fetchGroups(1, search, nextTeacherId, subjectId);
                }}>
                    <option value="">Barcha o&apos;qituvchilar</option>
                    {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
                </select>
                <select className="search-select" value={subjectId} onChange={(event) => {
                    const nextSubjectId = event.target.value;
                    setSubjectId(nextSubjectId);
                    setPage(1);
                    fetchGroups(1, search, teacherId, nextSubjectId);
                }}>
                    <option value="">Barcha fanlar</option>
                    {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
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
                                    <th>O&apos;qituvchi</th>
                                    <th>Fan</th>
                                    <th>O&apos;quvchilar</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
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
                                        <td style={{ color: "var(--text-secondary)" }}>{g.teacher?.full_name || "—"}</td>
                                        <td style={{ color: "var(--text-secondary)" }}>{g.subject?.name || "Fan belgilanmagan"}</td>
                                        <td style={{ color: "var(--text-secondary)" }}>{g.students_count ?? 0}</td>
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
