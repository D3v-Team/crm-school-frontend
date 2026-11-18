import { useEffect, useState } from "react";
import { useLazyGetGroupsQuery } from "../../../store/services/group.api";
import { useGetUsersQuery } from "../../../store/services/user.api";
import { useGetSubjectsQuery } from "../../../store/services/subject.api";
import Create from "./__components/Create";
import Delete from "./__components/Delete";
import Edit from "./__components/Edit";
import Loading from "../../Other/UI/Loadings/Loading";
import { NavLink, useSearchParams } from "react-router-dom";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Search, Layers, Eye, X, UserX,
} from "lucide-react";
import { useAppSelector } from "../../../store/hooks";
import Cookies from "js-cookie";
import DebouncedSearchInput from "../../Other/UI/DebouncedSearchInput";

const recordsOf = (response) => response?.data?.records || response?.records || [];
const formatDate = (date) => date ? new Date(date).toLocaleDateString("uz-UZ") : "—";

export default function Groups() {
    const role = useAppSelector((state) => state.auth?.role) || Cookies.get("role");
    const isTeacher = role === "teacher";
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    // "Guruhlarga o'tish" (o'qituvchini o'chirishdan) — /ad/groups?teacher_id=<id>
    const [searchParams, setSearchParams] = useSearchParams();
    const [teacherId, setTeacherId] = useState(() => searchParams.get("teacher_id") || "");
    const [subjectId, setSubjectId] = useState("");
    const [fetchGroups, { data, isLoading, error }] = useLazyGetGroupsQuery();
    const { data: teachersData, isSuccess: teachersLoaded } = useGetUsersQuery({ role: "teacher", limit: 200 }, { skip: isTeacher });
    const { data: subjectsData } = useGetSubjectsQuery({ limit: 200 });
    const teachers = recordsOf(teachersData);
    /* Faol o'qituvchilar (arxivdagilar GET /user?role=teacher ga kirmaydi). Ro'yxat to'liq
       yuklangandagina "Rahbar arxivda" belgisini qo'yamiz, aks holda noto'g'ri belgi chiqadi. */
    const teachersTotal = teachersData?.data?.pagination?.total_count;
    const activeTeacherIds = teachersLoaded && (teachersTotal == null || teachersTotal <= teachers.length)
        ? new Set(teachers.map((teacher) => String(teacher.id)))
        : null;
    const teacherArchived = (group) => Boolean(activeTeacherIds) && !activeTeacherIds.has(String(group.teacher?.id || group.teacher_id || ""));
    const subjects = recordsOf(subjectsData);
    const groups = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const currentPage = pagination.currentPage || page;
    const totalPages = pagination.total_pages || 1;

    const loadGroups = (nextPage = page, nextSearch = search, nextTeacherId = teacherId, nextSubjectId = subjectId) => {
        fetchGroups({
            page: nextPage,
            limit,
            ...(nextSearch.trim() && { search: nextSearch.trim() }),
            ...(!isTeacher && nextTeacherId && { teacher_id: nextTeacherId }),
            ...(!isTeacher && nextSubjectId && { subject_id: nextSubjectId }),
        });
    };

    useEffect(() => {
        const initialTeacherId = searchParams.get("teacher_id");
        fetchGroups({ page: 1, limit, ...(!isTeacher && initialTeacherId && { teacher_id: initialTeacherId }) });
    // faqat birinchi ochilishda URL dagi filtr bilan yuklaymiz
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchGroups, limit]);

    const changeSearch = (value) => {
        setSearch(value);
        setPage(1);
        loadGroups(1, value);
    };
    const clearSearch = () => changeSearch("");
    const handleTeacherChange = (event) => {
        const nextTeacherId = event.target.value;
        setTeacherId(nextTeacherId);
        setSearchParams(nextTeacherId ? { teacher_id: nextTeacherId } : {}, { replace: true });
        setPage(1);
        loadGroups(1, search, nextTeacherId, subjectId);
    };
    const handleSubjectChange = (event) => {
        const nextSubjectId = event.target.value;
        setSubjectId(nextSubjectId);
        setPage(1);
        loadGroups(1, search, teacherId, nextSubjectId);
    };
    const goTo = (nextPage) => {
        setPage(nextPage);
        loadGroups(nextPage);
    };

    return (
        <div>
            <div className="page-toolbar">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
                    <span className="page-title-icon"><Layers size={18} /></span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {isTeacher ? "Mening guruhlarim" : "Guruhlar"}
                    </span>
                </div>
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16} />
                    <DebouncedSearchInput
                        className="search-input"
                        type="text"
                        placeholder="Guruh nomi..."
                        value={search}
                        onChange={setSearch}
                        onSearch={changeSearch}
                    />
                    {search && <button className="toolbar-clear-btn" onClick={clearSearch}><X size={14} /></button>}
                </div>
                {!isTeacher && (
                    <>
                        <select className="search-select" value={teacherId} onChange={handleTeacherChange}>
                            <option value="">Barcha o&apos;qituvchilar</option>
                            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
                        </select>
                        <select className="search-select" value={subjectId} onChange={handleSubjectChange}>
                            <option value="">Barcha fanlar</option>
                            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                        </select>
                        <Create />
                    </>
                )}
            </div>

            {isLoading && <Loading />}
            {error && (
                <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)", padding: "12px 16px", borderRadius: 10 }}>
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
                                    <th>O&apos;qituvchi</th>
                                    <th>Fan</th>
                                    <th>O&apos;quvchilar</th>
                                    <th>Boshlangan sana</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
                                            {isTeacher ? "Sizga biriktirilgan guruhlar yo'q" : "Guruhlar topilmadi"}
                                        </td>
                                    </tr>
                                ) : groups.map((group, index) => (
                                    <tr key={group.id}>
                                        <td style={{ color: "var(--text-muted)", fontSize: "0.78rem", fontFamily: "monospace" }}>
                                            {(currentPage - 1) * limit + index + 1}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{group.name}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                <span>{group.teacher?.full_name || "—"}</span>
                                                {!isTeacher && teacherArchived(group) && (
                                                    <>
                                                        <span title="Guruh o'qituvchisi (sinf rahbari) arxivlangan" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)", whiteSpace: "nowrap" }}>
                                                            <UserX size={11} /> Rahbar arxivda
                                                        </span>
                                                        <Edit group={group} variant="assign" />
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td>{group.subject?.name || "Fan belgilanmagan"}</td>
                                        <td>{group.students_count ?? group.students?.length ?? 0}</td>
                                        <td>{formatDate(group.start_date)}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <NavLink to={`/group/${group.id}`}>
                                                    <button className="action-btn action-btn-ghost" title="Ko'rish"><Eye size={14} /></button>
                                                </NavLink>
                                                {!isTeacher && <Edit group={group} />}
                                                {!isTeacher && <Delete group={group} />}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {(totalPages > 1 || !isTeacher) && (
                        <div className="pagination">
                            <span>Jami {pagination.total_count || groups.length} ta guruh</span>
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
