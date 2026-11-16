/* eslint-disable react/prop-types */
import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { BASE_URL } from "../../../store/api";
import { useGetStaffRolesQuery } from "../../../store/services/user.api";

/* Backend `/uploads/...` ni hozircha tarqatmasligi mumkin — shuning uchun onError da bosh harflar. */
const photoSrc = (url) => {
    if (!url) return null;
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const initialsOf = (name) =>
    (name || "?").trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "?";

export function StaffAvatar({ name, photoUrl, size = 36 }) {
    const [failed, setFailed] = useState(false);
    const src = photoSrc(photoUrl);
    const box = {
        width: size, height: size, borderRadius: size / 3.2, flexShrink: 0,
        border: "1.5px solid var(--card-border)", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--accent-soft)", color: "var(--accent)",
        fontSize: size * 0.36, fontWeight: 700,
    };
    if (!src || failed) return <div style={box} aria-hidden="true">{initialsOf(name)}</div>;
    return (
        <div style={box}>
            <img src={src} alt={name || ""} onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
    );
}

export function FaceBadge({ hasFace }) {
    return (
        <span style={{
            fontSize: "0.7rem", fontWeight: 600, padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap",
            background: hasFace ? "var(--success-soft)" : "var(--input-bg)",
            color: hasFace ? "var(--success)" : "var(--text-muted)",
            border: `1px solid ${hasFace ? "var(--success)" : "var(--card-border)"}`,
        }}>
            {hasFace ? "Bor" : "Yo'q"}
        </span>
    );
}

/* Lavozimlar ro'yxati backenddan olinadi (TZ 1.2) — frontendda qattiq yozilmaydi. */
export function useStaffRoles() {
    const { data, isLoading, error } = useGetStaffRolesQuery();
    const roles = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    const labelOf = (value) => roles.find((role) => role.value === value)?.label || value || "—";
    return { roles, labelOf, isLoading, error };
}

export function Pagination({ page, totalPages, totalCount, onChange, unit = "ta" }) {
    return (
        <div className="pagination">
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {totalCount > 0 ? `Jami ${totalCount} ${unit}` : ""}
            </span>
            <div className="pagination-controls">
                <button className="page-btn" onClick={() => onChange(1)} disabled={page <= 1}><ChevronsLeft size={15} /></button>
                <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page <= 1}><ChevronLeft size={15} /></button>
                <span className="page-current">{page} / {Math.max(totalPages, 1)}</span>
                <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page >= totalPages}><ChevronRight size={15} /></button>
                <button className="page-btn" onClick={() => onChange(totalPages)} disabled={page >= totalPages}><ChevronsRight size={15} /></button>
            </div>
        </div>
    );
}
