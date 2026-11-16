import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Download, Pencil, Plus, RefreshCw, Search, Trash2, UserCog, X } from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";
import DebouncedSearchInput from "../../Other/UI/DebouncedSearchInput";
import { useGetStaffQuery } from "../../../store/services/user.api";
import UserFaceActions from "../TeacherProfile/UserFaceActions";
import { getErrorMessage } from "../../../utils/errors";
import { FaceBadge, Pagination, StaffAvatar, useStaffRoles } from "./shared";
import { StaffDeleteModal, StaffExcelModal, StaffFormModal } from "./StaffModals";

const LIMIT = 30; // backend eng kami 30 qaytaradi (TZ 1.3)

/**
 * "Xodimlar" — tizimga kirmaydigan maktab xodimlari (qorovul, farrosh, oshpaz...).
 * Faqat super_admin va admin uchun. Asosiy "Foydalanuvchilar" ro'yxatida bular chiqmaydi.
 */
export default function Staff() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [formStaff, setFormStaff] = useState(null); // null | {} (yangi) | staff (tahrir)
    const [deleteStaff, setDeleteStaff] = useState(null);
    const [excelOpen, setExcelOpen] = useState(false);

    const { roles, labelOf, isLoading: rolesLoading } = useStaffRoles();
    const { data, isLoading, isFetching, error, refetch } = useGetStaffQuery({
        page,
        limit: LIMIT,
        ...(role && { role }),
        ...(search.trim() && { search: search.trim() }),
    });

    const records = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const totalCount = pagination.total_count ?? records.length;
    const currentPage = pagination.currentPage || page;
    const hasFilters = Boolean(role || search.trim());

    // Filtr yoki qidiruv o'zgarsa — 1-sahifaga qaytamiz
    const applySearch = (value) => { setSearch(value); setPage(1); };
    const changeRole = (event) => { setRole(event.target.value); setPage(1); };
    const clearFilters = () => { setSearchInput(""); setSearch(""); setRole(""); setPage(1); };
    const goTo = (next) => setPage(Math.max(1, Math.min(next, totalPages)));

    // Oxirgi sahifadagi yagona yozuv o'chirilsa, bitta oldingi sahifaga o'tamiz
    const closeDelete = (deleted) => {
        if (deleted && records.length === 1 && page > 1) setPage(page - 1);
        setDeleteStaff(null);
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><UserCog size={18} /></span>
                    Xodimlar
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn-create" onClick={() => setFormStaff({})}>
                        <Plus size={15} /> Xodim qo&apos;shish
                    </button>
                    <button className="btn-refresh" onClick={() => setExcelOpen(true)} title="Barcha xodimlar davomati (Excel)">
                        <Download size={15} />
                    </button>
                    <button className="btn-refresh" onClick={refetch} title="Yangilash" disabled={isFetching}>
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            <div className="search-bar">
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16} />
                    <DebouncedSearchInput
                        className="search-input"
                        type="text"
                        placeholder="Ism yoki telefon..."
                        value={searchInput}
                        onChange={setSearchInput}
                        onSearch={applySearch}
                    />
                    {searchInput && <button className="toolbar-clear-btn" onClick={() => { setSearchInput(""); applySearch(""); }}><X size={14} /></button>}
                </div>
                <select className="search-select" value={role} onChange={changeRole} disabled={rolesLoading}>
                    <option value="">Hammasi</option>
                    {roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                {hasFilters && <button className="clear-btn" onClick={clearFilters}>Tozalash</button>}
            </div>

            {isLoading ? <Loading /> : error ? (
                <div role="alert" style={{ color: "var(--danger)", padding: 12, background: "var(--danger-soft)", borderRadius: 10, whiteSpace: "pre-line" }}>
                    Xatolik: {getErrorMessage(error, "Xodimlarni yuklab bo'lmadi")}
                </div>
            ) : (
                <>
                    <div className="data-table-wrap" style={{ opacity: isFetching ? 0.6 : 1, transition: "opacity 0.15s" }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Rasm</th>
                                    <th>F.I.Sh.</th>
                                    <th>Lavozim</th>
                                    <th>Telefon</th>
                                    <th>Face ID</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
                                            {hasFilters ? "Bu filtr bo'yicha xodim topilmadi" : "Hozircha xodim qo'shilmagan"}
                                        </td>
                                    </tr>
                                ) : records.map((staff) => (
                                    <tr key={staff.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/staff/${staff.id}`)}>
                                        <td><StaffAvatar name={staff.full_name} photoUrl={staff.photo_url} /></td>
                                        <td style={{ fontWeight: 600 }}>{staff.full_name}</td>
                                        <td>{staff.role_label || labelOf(staff.role)}</td>
                                        <td style={{ color: "var(--text-secondary)" }}>{staff.phone || "—"}</td>
                                        <td><FaceBadge hasFace={staff.has_face_id} /></td>
                                        <td onClick={(event) => event.stopPropagation()}>
                                            <div style={{ display: "flex", gap: 5 }}>
                                                <button className="action-btn action-btn-ghost" title="Davomat" onClick={() => navigate(`/staff/${staff.id}`)}>
                                                    <CalendarDays size={13} />
                                                </button>
                                                <UserFaceActions compact userId={staff.id} userName={staff.full_name} hasFace={staff.has_face_id} targetRole={staff.role} />
                                                <button className="action-btn action-btn-primary" title="Tahrirlash" onClick={() => setFormStaff(staff)}>
                                                    <Pencil size={13} />
                                                </button>
                                                <button className="action-btn action-btn-danger" title="O'chirish" onClick={() => setDeleteStaff(staff)}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={currentPage} totalPages={totalPages} totalCount={totalCount} onChange={goTo} unit="ta xodim" />
                </>
            )}

            {formStaff && (
                <StaffFormModal
                    staff={formStaff.id ? formStaff : null}
                    roles={roles}
                    rolesLoading={rolesLoading}
                    onClose={(saved) => { setFormStaff(null); if (saved && !formStaff.id) setPage(1); }}
                />
            )}
            {deleteStaff && <StaffDeleteModal staff={deleteStaff} onClose={closeDelete} />}
            {excelOpen && <StaffExcelModal onClose={() => setExcelOpen(false)} />}
        </div>
    );
}
