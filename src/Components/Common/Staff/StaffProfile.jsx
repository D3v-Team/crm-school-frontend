import { Fragment, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Hand, LogIn, LogOut, Phone, UserCog } from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";
import Modal from "../../Other/UI/Modal/Modal";
import { Alert } from "../../Other/UI/Alert/Alert";
import { useGetUserByIdQuery } from "../../../store/services/user.api";
import { useCreateUserAttendanceMutation, useGetUserAttendancePageQuery } from "../../../store/services/user-attendance.api";
import UserFaceActions from "../TeacherProfile/UserFaceActions";
import { getErrorMessage } from "../../../utils/errors";
import { FaceBadge, Pagination, StaffAvatar, useStaffRoles } from "./shared";

const LIMIT = 30; // bitta sahifa = 30 kun (TZ 1.7)
const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

const timeText = (value) => {
    if (!value) return "—";
    if (String(value).includes("T")) {
        const date = new Date(value);
        return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
    return String(value).slice(0, 5);
};
const dateText = (value) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return { label: value || "—", weekday: "" };
    return { label: date.toLocaleDateString("uz-UZ"), weekday: WEEKDAYS[date.getDay()] };
};

/* Keldi = kunning birinchi IN, Ketdi = oxirgi OUT */
const summarize = (entries) => {
    const sorted = [...entries].sort((a, b) => String(a.time).localeCompare(String(b.time)));
    const firstIn = sorted.find((entry) => entry.type === "IN");
    const lastOut = [...sorted].reverse().find((entry) => entry.type === "OUT");
    return { sorted, firstIn, lastOut };
};

export default function StaffProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [expanded, setExpanded] = useState(null);
    const [markOpen, setMarkOpen] = useState(false);

    const { labelOf } = useStaffRoles();
    const { data: userData, isLoading: userLoading, error: userError } = useGetUserByIdQuery(id, { skip: !id });
    const staff = userData?.data || userData;
    const { data, isLoading, isFetching, error } = useGetUserAttendancePageQuery({ user_id: id, page, limit: LIMIT }, { skip: !id });
    const [createAttendance, { isLoading: marking }] = useCreateUserAttendanceMutation();

    const raw = data?.data;
    const days = Array.isArray(raw) ? raw : raw?.records || [];
    const pagination = raw?.pagination || {};
    const totalPages = pagination.total_pages || 1;

    const handleMark = async () => {
        try {
            await createAttendance(id).unwrap();
            Alert("Davomat qo'lda belgilandi", "success");
            setMarkOpen(false);
        } catch (requestError) {
            Alert(getErrorMessage(requestError), "error");
        }
    };

    if (userLoading) return <Loading />;
    if (userError) {
        return (
            <div role="alert" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)", padding: 16, borderRadius: 12 }}>
                Xatolik: {getErrorMessage(userError, "Xodim topilmadi")}
            </div>
        );
    }

    const hasFace = staff?.has_face_id ?? Boolean(staff?.hikvision_code);

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><UserCog size={18} /></span>
                    Xodim davomati
                </div>
                <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--input-bg)", border: "1.5px solid var(--card-border)", borderRadius: 9, padding: "7px 14px", cursor: "pointer", fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    <ArrowLeft size={14} /> Orqaga
                </button>
            </div>

            <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 16, padding: "18px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                    <StaffAvatar name={staff?.full_name} photoUrl={staff?.photo_url} size={56} />
                    <div style={{ minWidth: 0 }}>
                        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>{staff?.full_name || "—"}</h2>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                            <span style={{ color: "var(--accent)", fontWeight: 600 }}>{staff?.role_label || labelOf(staff?.role)}</span>
                            {staff?.phone && <span><Phone size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{staff.phone}</span>}
                            <span>Face ID: <FaceBadge hasFace={hasFace} /></span>
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <UserFaceActions userId={id} userName={staff?.full_name || "—"} hasFace={hasFace} targetRole={staff?.role} />
                    <button className="btn-create" onClick={() => setMarkOpen(true)} title="Qurilma ishlamagan kun uchun">
                        <Hand size={14} /> Qo&apos;lda belgilash
                    </button>
                </div>
            </div>

            <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 16, padding: "16px 18px" }}>
                {isLoading ? <Loading /> : error ? (
                    <div role="alert" style={{ color: "var(--danger)", padding: 12, background: "var(--danger-soft)", borderRadius: 10 }}>
                        Xatolik: {getErrorMessage(error, "Davomatni yuklab bo'lmadi")}
                    </div>
                ) : days.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>Keldi-ketdi ma&apos;lumotlari hali yo&apos;q</div>
                ) : (
                    <>
                        <div className="data-table-wrap" style={{ opacity: isFetching ? 0.6 : 1 }}>
                            <table className="data-table">
                                <thead>
                                    <tr><th>Sana</th><th>Keldi</th><th>Ketdi</th><th>Yozuvlar</th><th /></tr>
                                </thead>
                                <tbody>
                                    {days.map((day) => {
                                        const entries = day.records || day.entries || [];
                                        const { sorted, firstIn, lastOut } = summarize(entries);
                                        const { label, weekday } = dateText(day.date);
                                        const isOpen = expanded === day.date;
                                        return (
                                            <Fragment key={day.date}>
                                                <tr style={{ cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : day.date)}>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{label}</div>
                                                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{weekday}</div>
                                                    </td>
                                                    <td style={{ color: firstIn ? "var(--success)" : "var(--text-muted)", fontWeight: 700 }}>
                                                        <LogIn size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{timeText(firstIn?.time)}
                                                    </td>
                                                    <td style={{ color: lastOut ? "var(--danger)" : "var(--text-muted)", fontWeight: 700 }}>
                                                        <LogOut size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{timeText(lastOut?.time)}
                                                    </td>
                                                    <td style={{ color: "var(--text-secondary)" }}>{entries.length}</td>
                                                    <td style={{ color: "var(--text-muted)" }}>{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                                                </tr>
                                                {isOpen && (
                                                    <tr>
                                                        <td colSpan={5} style={{ background: "var(--input-bg)" }}>
                                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                                {sorted.map((entry, index) => (
                                                                    <span key={`${entry.type}-${entry.time}-${index}`} style={{
                                                                        fontSize: "0.75rem", fontWeight: 600, padding: "3px 9px", borderRadius: 99,
                                                                        background: entry.type === "IN" ? "var(--success-soft)" : "var(--danger-soft)",
                                                                        color: entry.type === "IN" ? "var(--success)" : "var(--danger)",
                                                                    }}>
                                                                        {entry.type === "IN" ? "Keldi" : "Ketdi"} {timeText(entry.time)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={pagination.currentPage || page} totalPages={totalPages} totalCount={pagination.total_count || 0} onChange={(next) => setPage(Math.max(1, Math.min(next, totalPages)))} unit="kun" />
                    </>
                )}
            </div>

            <Modal open={markOpen} onClose={() => !marking && setMarkOpen(false)} title="Qo'lda belgilash" size="sm">
                <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", margin: 0 }}>
                    <strong>{staff?.full_name}</strong> uchun hozirgi vaqt bilan yozuv qo&apos;shiladi.
                    Har bosilganda navbatma-navbat <strong>Keldi (IN)</strong> / <strong>Ketdi (OUT)</strong> yoziladi.
                </p>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setMarkOpen(false)} disabled={marking}>Bekor qilish</button>
                    <button className="btn-submit" onClick={handleMark} disabled={marking}>
                        <Hand size={14} /> {marking ? "Belgilanmoqda..." : "Tasdiqlash"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
