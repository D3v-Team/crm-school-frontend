// Subject.jsx
import { useEffect, useState } from "react";
import { useLazyGetSubjectsQuery } from "../../../store/services/subject.api";
import Create from "./__components/Create";
import Edit from "./__components/Edit";
import Delete from "./__components/Delete";
import { Search, RefreshCw, BookOpen, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";

export default function Subject() {
    const [page, setPage] = useState(1);
    const [limit] = useState(12); // больше карточек на страницу
    const [search, setSearch] = useState("");

    const [trigger, { data, isLoading, error }] = useLazyGetSubjectsQuery();

    const fetchSubjects = (pageNum = page, searchTerm = search) => {
        const params = {
            page: pageNum,
            limit,
            ...(searchTerm && { search: searchTerm }),
        };
        trigger(params);
    };

    useEffect(() => {
        fetchSubjects(1);
    }, []);

    useEffect(() => {
        if (page > 1) {
            fetchSubjects(page);
        }
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        fetchSubjects(1, search);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleClear = () => {
        setSearch("");
        setPage(1);
        fetchSubjects(1, "");
    };

    const subjects = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;
    const totalCount = pagination.total_count || 0;

    const handlePrevPage = () => {
        if (currentPage > 1) {
            const newPage = currentPage - 1;
            setPage(newPage);
            fetchSubjects(newPage);
        }
    };
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const newPage = currentPage + 1;
            setPage(newPage);
            fetchSubjects(newPage);
        }
    };
    const handleFirstPage = () => {
        if (currentPage !== 1) {
            setPage(1);
            fetchSubjects(1);
        }
    };
    const handleLastPage = () => {
        if (currentPage !== totalPages) {
            setPage(totalPages);
            fetchSubjects(totalPages);
        }
    };

    return (
        <div className="mt-[10px]">
            {/* Заголовок и кнопки */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold text-text-primary flex items-center gap-3">
                    Fanlar
                </h1>
                <div className="flex gap-2">
                    <Create />
                 
                </div>
            </div>

            {/* Поисковая строка */}
            <div className="bg-card border border-border rounded-lg p-3 mb-6 shadow-md">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                        <input
                            type="text"
                            placeholder="Fan nomi bo‘yicha qidirish..."
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

            {/* Состояния загрузки/ошибки */}
            {isLoading && <Loading />}
            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg">
                    Xatolik yuz berdi: {error.data?.message || error.status || "Noma'lum xatolik"}
                </div>
            )}

            {/* Список карточек */}
            {!isLoading && !error && (
                <>
                    {subjects.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg">Fanlar topilmadi</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {subjects.map((subject) => (
                                <div
                                    key={subject.id}
                                    className="bg-card border border-border rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-5 flex flex-col items-center text-center group"
                                >
                                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                                        <BookOpen className="w-8 h-8 text-accent" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                                        {subject.name}
                                    </h3>
                      
                                    <div className="flex items-center gap-3 mt-2">
                                        <Edit subject={subject} />
                                        <Delete subject={subject} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Пагинация */}
                    <div className="flex flex-wrap items-center justify-between mt-6 gap-2">
                        <div className="text-sm text-text-secondary">
                            {totalCount > 0 ? (
                                <>Jami {totalCount} ta fan, {currentPage} / {totalPages} sahifa</>
                            ) : (
                                <>Ma'lumot yo‘q</>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleFirstPage}
                                disabled={currentPage <= 1}
                                className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronsLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage <= 1}
                                className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="px-3 py-1 rounded-lg bg-accent/10 text-accent font-medium">
                                {currentPage}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage >= totalPages}
                                className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleLastPage}
                                disabled={currentPage >= totalPages}
                                className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronsRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}