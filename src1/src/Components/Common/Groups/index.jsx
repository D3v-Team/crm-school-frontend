// Groups.jsx
import { useEffect, useState } from "react";
import { useLazyGetGroupsQuery } from "../../../store/services/group.api";
import Create from "./__components/Create";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, RefreshCw, Users, Eye } from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";
import Delete from "./__components/Delete";
import Edit from "./__components/Edit";
import { NavLink } from "react-router-dom";
import { Button } from "@material-tailwind/react";

export default function Groups() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");

    const [trigger, { data, isLoading, error }] = useLazyGetGroupsQuery();

    const fetchGroups = (pageNum = page, searchTerm = search) => {
        const params = {
            page: pageNum,
            limit,
            ...(searchTerm && { search: searchTerm }),
        };
        trigger(params);
    };

    useEffect(() => {
        fetchGroups(1);
    }, []);

    useEffect(() => {
        if (page > 1) {
            fetchGroups(page);
        }
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        fetchGroups(1, search);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleClear = () => {
        setSearch("");
        setPage(1);
        fetchGroups(1, "");
    };

    const groups = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;
    const totalCount = pagination.total_count || 0;

    const handlePrevPage = () => {
        if (currentPage > 1) {
            const newPage = currentPage - 1;
            setPage(newPage);
            fetchGroups(newPage);
        }
    };
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const newPage = currentPage + 1;
            setPage(newPage);
            fetchGroups(newPage);
        }
    };
    const handleFirstPage = () => {
        if (currentPage !== 1) {
            setPage(1);
            fetchGroups(1);
        }
    };
    const handleLastPage = () => {
        if (currentPage !== totalPages) {
            setPage(totalPages);
            fetchGroups(totalPages);
        }
    };

    return (
        <div className="mt-[10px]">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold text-text-primary flex items-center gap-3">
                    <Users className="w-8 h-8 text-accent" />
                    Siniflar
                </h1>
                <div className="flex gap-2">
                    <Create />
                    <button
                        onClick={() => fetchGroups(page)}
                        className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent transition-colors"
                        title="Yangilash"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-2 mb-4 shadow-md">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                        <input
                            type="text"
                            placeholder="Guruh nomi bo‘yicha qidirish..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none transition-colors"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    </div>

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
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Nomi</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Boshlanish sanasi</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Sinf rahbari</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-text-secondary">
                                            Siniflar topilmadi
                                        </td>
                                    </tr>
                                ) : (
                                    groups.map((group, index) => (
                                        <tr key={group.id} className="border-b border-border hover:bg-[var(--accent)]/5 transition-colors last:border-0">
                                            <td className="px-4 py-3 font-mono text-xs">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium">{group.name}</td>
                                            <td className="px-4 py-3">
                                                {group.start_date ? new Date(group.start_date).toLocaleDateString('uz-UZ') : "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {group.homeroom_teacher?.full_name || group.homeroom_teacher_name || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-text-secondary text-xs">
                                                <div className="flex items-center gap-2">
                                                    <NavLink to={`/group/${group.id}`}>
                                                        <Button
                                                            className="p-2 bg-accent hover:bg-accent-hover text-white transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </NavLink>
                                                    <Edit group={group} />
                                                    <Delete group={group} />
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
                                <>Jami {totalCount} ta guruh, {currentPage} / {totalPages} sahifa</>
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