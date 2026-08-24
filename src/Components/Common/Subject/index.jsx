import { useEffect, useState } from "react";
import { useLazyGetSubjectsQuery } from "../../../store/services/subject.api";
import Create from "./__components/Create";
import Edit from "./__components/Edit";
import Delete from "./__components/Delete";
import { Search, BookOpen, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";

export default function Subject() {
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [search, setSearch] = useState("");

    const [trigger, { data, isLoading, error }] = useLazyGetSubjectsQuery();

    const fetchSubjects = (pageNum = page, searchTerm = search) => {
        trigger({ page: pageNum, limit, ...(searchTerm && { search: searchTerm }) });
    };

    useEffect(() => { fetchSubjects(1); }, []);

    const handleSearch = () => { setPage(1); fetchSubjects(1, search); };
    const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };
    const handleClear = () => { setSearch(""); setPage(1); fetchSubjects(1, ""); };

    const subjects = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;

    const goTo = (p) => { setPage(p); fetchSubjects(p); };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><BookOpen size={18} /></span>
                    Fanlar
                </div>
                <Create />
            </div>

            {/* Search */}
            <div className="search-bar">
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16} />
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Fan nomi bo'yicha qidirish..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
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
                    {subjects.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                            <BookOpen size={48} style={{ opacity: 0.25, margin: '0 auto 12px' }} />
                            <p>Fanlar topilmadi</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                            {subjects.map((subject) => (
                                <div key={subject.id} className="data-card">
                                    <div className="data-card-icon">
                                        <BookOpen size={18} />
                                    </div>
                                    <span className="data-card-name">{subject.name}</span>
                                    <div className="data-card-actions">
                                        <Edit subject={subject} />
                                        <Delete subject={subject} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
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
