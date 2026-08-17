// Student.jsx
import { useEffect, useState } from "react";
import { useLazyGetStudentsQuery } from "../../../store/services/student.api";
import Create from "./__components/Create";
import Edit from "./__components/Edit";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, RefreshCw, Eye } from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";
import Delete from "./__components/Delete";
import { NavLink } from "react-router-dom";
import { Button } from "@material-tailwind/react";
import AddGroup from "./__components/AddGroup";

export default function Student() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [isActiveFilter, setIsActiveFilter] = useState(null);

    const [trigger, { data, isLoading, error }] = useLazyGetStudentsQuery();

    const fetchStudents = (pageNum = page, searchTerm = search, activeFilter = isActiveFilter) => {
        const params = {
            page: pageNum,
            limit,
            ...(searchTerm && { search: searchTerm }),
            ...(activeFilter !== null && { is_active: activeFilter }),
        };
        console.log("📤 Запрос на получение студентов:", params);
        trigger(params);
    };

    useEffect(() => {
        fetchStudents(1);
    }, []);

    useEffect(() => {
        if (page > 1) {
            fetchStudents(page);
        }
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        fetchStudents(1, search, isActiveFilter);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleClear = () => {
        setSearch("");
        setIsActiveFilter(null);
        setPage(1);
        fetchStudents(1, "", null);
    };

    const handleFilterChange = (e) => {
        const value = e.target.value;
        let filter = null;
        if (value === "active") filter = true;
        else if (value === "inactive") filter = false;
        setIsActiveFilter(filter);
        setPage(1);
        fetchStudents(1, search, filter);
    };

    useEffect(() => {
        if (data) {
            console.log("📦 Данные студентов получены:", data);
        }
        if (error) {
            console.error("❌ Ошибка:", error);
        }
    }, [data, error]);

    const students = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;
    const totalCount = pagination.total_count || 0;

    const handlePrevPage = () => {
        if (currentPage > 1) {
            const newPage = currentPage - 1;
            setPage(newPage);
            fetchStudents(newPage);
        }
    };
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const newPage = currentPage + 1;
            setPage(newPage);
            fetchStudents(newPage);
        }
    };
    const handleFirstPage = () => {
        if (currentPage !== 1) {
            setPage(1);
            fetchStudents(1);
        }
    };
    const handleLastPage = () => {
        if (currentPage !== totalPages) {
            setPage(totalPages);
            fetchStudents(totalPages);
        }
    };

    return (
        <div className="mt-[10px]">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold text-text-primary">O‘quvchilar</h1>
                <div className="flex gap-2">
                    <Create />

                </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-2 mb-4 shadow-md">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                        <input
                            type="text"
                            placeholder="Ism yoki telefon bo‘yicha qidirish..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none transition-colors"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    </div>

                    <select
                        value={
                            isActiveFilter === null ? "all"
                                : isActiveFilter === true ? "active" : "inactive"
                        }
                        onChange={handleFilterChange}
                        className="px-4 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors"
                    >
                        <option value="all">Barcha</option>
                        <option value="active">Faol</option>
                        <option value="inactive">Nofaol</option>
                    </select>

                    <button
                        onClick={handleSearch}
                        className="px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors font-medium"
                    >
                        Qidirish
                    </button>

                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-text-secondary hover:text-accent transition-colors"
                    >
                        Tozalash
                    </button>
                </div>
            </div>

            {isLoading && <Loading />}
            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg">
                    Xatolik yuz berdi: {error.data?.message || error.status || "Noma'lum xatolik"}
                </div>
            )}

            {!isLoading && !error && (
                <>
                    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-md">
                        <table className="w-full text-sm text-text-primary">
                            <thead className="bg-[var(--card-bg)]/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">№</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">To‘liq ism</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Telefon</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Narx</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Holat</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Guruh</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Ota-ona</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-text-secondary">
                                            O‘quvchilar topilmadi
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student, index) => (
                                        <tr key={student.id} className="border-b border-border hover:bg-[var(--accent)]/5 transition-colors last:border-0">
                                            <td className="px-4 py-3 font-mono text-xs">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium">{student.full_name}</td>
                                            <td className="px-4 py-3">{student.phone || "—"}</td>
                                            <td className="px-4 py-3">
                                                {student.price ? Number(student.price).toLocaleString('ru-RU') + ' so‘m' : "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${student.is_active
                                                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                                    : "bg-red-500/20 text-red-600 dark:text-red-400"
                                                    }`}>
                                                    {student.is_active ? "Faol" : "Nofaol"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {student.group?.name || student.group_name || "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {student.parent?.full_name || student.parent_name || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-text-secondary text-xs">
                                                <div className="flex items-center gap-2">
                                                    <NavLink to={`/student/${student.id}`}>
                                                        <Button
                                                            className="p-2 bg-accent hover:bg-accent-hover text-white transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </NavLink>
                                                    <AddGroup onAdd={fetchStudents} studentID={student.id} />
                                                    <Edit student={student} />
                                                    <Delete student={student} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between mt-4 gap-2">
                        <div className="text-sm text-text-secondary">
                            {totalCount > 0 ? (
                                <>Jami {totalCount} ta o‘quvchi, {currentPage} / {totalPages} sahifa</>
                            ) : (
                                <>Ma'lumot yo‘q</>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleFirstPage} disabled={currentPage <= 1} className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                <ChevronsLeft className="w-5 h-5" />
                            </button>
                            <button onClick={handlePrevPage} disabled={currentPage <= 1} className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="px-3 py-1 rounded-lg bg-accent/10 text-accent font-medium">{currentPage}</span>
                            <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <button onClick={handleLastPage} disabled={currentPage >= totalPages} className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                <ChevronsRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}