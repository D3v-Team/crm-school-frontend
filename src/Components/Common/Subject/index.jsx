import { useEffect, useState } from "react";
import { useLazyGetSubjectsQuery } from "../../../store/services/subject.api";
import Create from "./__components/Create";
import Edit from "./__components/Edit";
import Delete from "./__components/Delete";
import { Search, BookOpen, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, RefreshCw, X } from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";
import { useAppSelector } from "../../../store/hooks";
import Cookies from "js-cookie";
import DebouncedSearchInput from "../../Other/UI/DebouncedSearchInput";

export default function Subject() {
    const roleFromStore = useAppSelector(s => s.auth?.role);
    const role = roleFromStore || Cookies.get('role');
    const isTeacher = role === 'teacher';

    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [search, setSearch] = useState("");

    const [trigger, { data, isLoading, error }] = useLazyGetSubjectsQuery();

    const fetchSubjects = (pageNum = page, searchTerm = search) => {
        trigger({ page: pageNum, limit, ...(searchTerm && { search: searchTerm }) });
    };

    useEffect(() => { fetchSubjects(1); }, []);
    const handleSearch = () => { setPage(1); fetchSubjects(1, search); };
    const handleClear = () => { setSearch(""); setPage(1); fetchSubjects(1, ""); };

    const subjects = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;

    const goTo = (p) => { setPage(p); fetchSubjects(p); };

    return (
        <div>
            <div className="page-toolbar">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:'auto' }}>
                    <span className="page-title-icon"><BookOpen size={18}/></span>
                    <span style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-primary)' }}>Fanlar</span>
                </div>
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16}/>
                    <DebouncedSearchInput className="search-input" type="text" placeholder="Fan nomi..."
                        value={search} onChange={setSearch} onSearch={value => { setPage(1); fetchSubjects(1, value); }}/>
                    {search && (
                        <button className="toolbar-clear-btn" onClick={handleClear}><X size={14}/></button>
                    )}
                </div>
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
                    {subjects.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                            <BookOpen size={48} style={{ opacity: 0.25, margin: '0 auto 12px' }} />
                            <p>Fanlar topilmadi</p>
                        </div>
                    ) : (
                        <div className="subject-grid">
                            {subjects.map((subject) => (
                                <div key={subject.id} className="data-card" style={{ padding:'14px 16px', position:'relative', minWidth:0 }}>
                                    {/* Edit + Delete — top right */}
                                    <div style={{ position:'absolute', top:10, right:10, display:'flex', gap:5 }}>
                                        {!isTeacher && <Edit subject={subject} />}
                                        {!isTeacher && <Delete subject={subject} />}
                                    </div>
                                    {/* Name */}
                                    <span className="data-card-name" style={{ paddingRight:60, display:'block', lineHeight:1.4, overflowWrap:'anywhere', wordBreak:'break-word' }}>
                                        {subject.name}
                                    </span>
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
