import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useLazyGetStudentsQuery } from "../../../store/services/student.api";
import { useCreatePaymentMutation } from "../../../store/services/payment.api";
import Loading from "../../Other/UI/Loadings/Loading";
import Modal from "../../Other/UI/Modal/Modal";
import { Alert } from "../../Other/UI/Alert/Alert";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Search, Users, X, RefreshCw, Wallet, Eye, CreditCard, Plus,
} from "lucide-react";
import DebouncedSearchInput from "../../Other/UI/DebouncedSearchInput";

const MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const METHODS = [
    { value: "cash",         label: "Naqd"            },
    { value: "card",         label: "Karta"           },
    { value: "transfer",     label: "Pul o'tkazmasi"  },
    { value: "bank_account", label: "Bank hisobi"     },
];

const fmt     = (v) => v ? Number(String(v).replace(/\s/g, '')).toLocaleString("ru-RU") : "";
const parseNum = (v) => String(v || "").replace(/\s/g, "");

const sel = {
    padding: "9px 12px", background: "var(--input-bg)",
    border: "1.5px solid var(--input-border)", borderRadius: 9,
    color: "var(--input-text)", fontSize: "0.82rem", outline: "none", cursor: "pointer",
    width: "100%", minWidth: 0, boxSizing: "border-box", display: "block",
};

/* ── To'lov qo'shish modal ── */
function AddPaymentModal({ student, open, onClose, onSuccess }) {
    const now = new Date();
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
    const [form, setForm] = useState({
        year: now.getFullYear(), month: now.getMonth() + 1,
        paid_amount: "", required_amount: "", discount_percent: "",
        method: "cash", comment: "",
    });
    const [baseRequired, setBaseRequired] = useState("");
    const [displayPaid, setDisplayPaid] = useState("");
    const [errors, setErrors] = useState({});
    const [create, { isLoading }] = useCreatePaymentMutation();

    useEffect(() => {
        if (open && student) {
            const req = student.price ? String(student.price) : "";
            setBaseRequired(req);
            setForm({ year: now.getFullYear(), month: now.getMonth() + 1, paid_amount: "", required_amount: req, discount_percent: "", method: "cash", comment: "" });
            setDisplayPaid(""); setErrors({});
        }
    }, [open, student]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "paid_amount") {
            const c = parseNum(value);
            setForm(p => ({ ...p, paid_amount: c }));
            setDisplayPaid(fmt(c));
        } else if (name === "required_amount") {
            const c = parseNum(value);
            setBaseRequired(c);
            setForm(p => {
                const disc = +p.discount_percent || 0;
                return { ...p, required_amount: disc > 0 ? String(Math.round(+c * (1 - disc / 100))) : c };
            });
        } else if (name === "discount_percent") {
            const disc = Math.min(100, Math.max(0, +value || 0));
            const base = +baseRequired || +form.required_amount;
            const newReq = disc > 0 ? String(Math.round(base * (1 - disc / 100))) : String(base);
            setForm(p => ({ ...p, discount_percent: value, required_amount: newReq }));
        } else {
            setForm(p => ({ ...p, [name]: value }));
        }
    };

    const validate = () => {
        const e = {};
        if (!form.paid_amount || +form.paid_amount <= 0) e.paid_amount = "Musbat summa kiriting";
        if (!form.required_amount || +form.required_amount <= 0) e.required_amount = "Kerakli summani kiriting";
        setErrors(e); return !Object.keys(e).length;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault(); if (!validate()) return;
        try {
            await create({
                student_id: student.id, year: +form.year, month: +form.month,
                paid_amount: +form.paid_amount, required_amount: +form.required_amount,
                method: form.method,
                ...(form.discount_percent && { discount_percent: +form.discount_percent }),
                ...(form.comment && { comment: form.comment }),
            }).unwrap();
            Alert("To'lov qo'shildi", "success");
            onSuccess?.(); onClose();
        } catch (err) { Alert(err?.data?.message || "Xatolik", "error"); }
    };

    return (
        <Modal open={open} onClose={onClose} title={`To'lov — ${student?.full_name || ""}`} size="sm">
            <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    {/* Student strip */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "var(--accent-soft)", border: "1px solid var(--card-border)" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                                {(student?.full_name || "?").charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{student?.full_name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{student?.phone || "—"} · {student?.group?.name || "—"}</div>
                        </div>
                        {student?.price > 0 && (
                            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                                {Number(student.price).toLocaleString("ru-RU")} so'm
                            </div>
                        )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>Yil</label>
                            <select name="year" value={form.year} onChange={handleChange} style={sel}>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>Oy</label>
                            <select name="month" value={form.month} onChange={handleChange} style={sel}>
                                {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>To'langan summa *</label>
                            <input name="paid_amount" value={displayPaid} onChange={handleChange}
                                placeholder="0" className="search-input" style={{ paddingLeft: 14 }} />
                            {errors.paid_amount && <span style={{ fontSize: "0.72rem", color: "var(--danger)" }}>{errors.paid_amount}</span>}
                        </div>
                        <div>
                            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>Kerakli summa *</label>
                            <input name="required_amount" value={fmt(form.required_amount)}
                                onChange={handleChange} placeholder="0" className="search-input" style={{ paddingLeft: 14 }} />
                            {errors.required_amount && <span style={{ fontSize: "0.72rem", color: "var(--danger)" }}>{errors.required_amount}</span>}
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>To'lov usuli</label>
                        <select name="method" value={form.method} onChange={handleChange} style={sel}>
                            {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>Chegirma (%)</label>
                        <input name="discount_percent" value={form.discount_percent} onChange={handleChange}
                            type="number" min="0" max="100" placeholder="0"
                            className="search-input" style={{ paddingLeft: 14 }} />
                        {+form.discount_percent > 0 && +baseRequired > 0 && (
                            <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem" }}>
                                <span style={{ color: "var(--text-muted)", textDecoration: "line-through" }}>{Number(baseRequired).toLocaleString("ru-RU")} so'm</span>
                                <span style={{ color: "var(--danger)", fontWeight: 600 }}>−{form.discount_percent}%</span>
                                <span style={{ color: "var(--success)", fontWeight: 700 }}>= {Number(form.required_amount).toLocaleString("ru-RU")} so'm</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>Izoh (ixtiyoriy)</label>
                        <textarea name="comment" value={form.comment} onChange={handleChange} rows={2}
                            placeholder="Qo'shimcha..." className="search-input" style={{ paddingLeft: 14, height: "auto", resize: "vertical" }} />
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                    <button type="submit" className="btn-submit" disabled={isLoading}>
                        <Plus size={14} />{isLoading ? "Saqlanmoqda..." : "To'lov qo'shish"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/* ── Main ── */
export default function CashierStudents() {
    const [page, setPage]           = useState(1);
    const [search, setSearch]       = useState("");
    const [isActiveFilter, setIsActiveFilter] = useState(true);
    const [payStudent, setPayStudent] = useState(null);

    const [trigger, { data, isLoading, error }] = useLazyGetStudentsQuery();

    const fetchStudents = (p = page, s = search, f = isActiveFilter) => {
        trigger({ page: p, limit: 15, ...(s && { search: s }), is_active: f });
    };

    useEffect(() => { fetchStudents(1); }, []);

    const students    = data?.data?.records || [];
    const pagination  = data?.data?.pagination || {};
    const totalPages  = pagination.total_pages  || 1;
    const currentPage = pagination.currentPage  || 1;

    const goTo = (p) => { setPage(p); fetchStudents(p); };

    return (
        <div>
            <div className="page-toolbar">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
                    <span className="page-title-icon"><Users size={18} /></span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>O'quvchilar</span>
                </div>
                <div className="search-input-wrap">
                    <Search className="search-icon" size={16} />
                    <DebouncedSearchInput
                        className="search-input" type="text" placeholder="Ism yoki telefon..."
                        value={search} onChange={setSearch}
                        onSearch={val => { setPage(1); fetchStudents(1, val, isActiveFilter); }}
                    />
                    {search && (
                        <button className="toolbar-clear-btn" onClick={() => { setSearch(""); setPage(1); fetchStudents(1, "", isActiveFilter); }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    className="search-select"
                    value={isActiveFilter ? "active" : "inactive"}
                    onChange={e => { const f = e.target.value === "active"; setIsActiveFilter(f); setPage(1); fetchStudents(1, search, f); }}
                >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                </select>
                <button className="btn-refresh" onClick={() => fetchStudents(page)} title="Yangilash">
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
                                    <th>To'liq ism</th>
                                    <th>Telefon</th>
                                    <th>Narx</th>
                                    <th>Holat</th>
                                    <th>Guruh</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
                                            O'quvchilar topilmadi
                                        </td>
                                    </tr>
                                ) : students.map((s, i) => (
                                    <tr key={s.id}>
                                        <td style={{ color: "var(--text-muted)", fontSize: "0.78rem", fontFamily: "monospace" }}>
                                            {(currentPage - 1) * 15 + i + 1}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                                        <td style={{ color: "var(--text-secondary)" }}>{s.phone || "—"}</td>
                                        <td>
                                            {s.price ? (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)" }}>
                                                    <Wallet size={12} />
                                                    {Number(s.price).toLocaleString("ru-RU")} so'm
                                                </span>
                                            ) : "—"}
                                        </td>
                                        <td>
                                            <span className={s.is_active ? "badge badge-active" : "badge badge-inactive"}>
                                                {s.is_active ? "Faol" : "Nofaol"}
                                            </span>
                                        </td>
                                        <td style={{ color: "var(--text-secondary)" }}>{s.group?.name || "—"}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                <NavLink to={`/student/${s.id}`}>
                                                    <button className="action-btn action-btn-ghost" title="Ko'rish">
                                                        <Eye size={14} />
                                                    </button>
                                                </NavLink>
                                                <button
                                                    className="action-btn action-btn-primary"
                                                    onClick={() => setPayStudent(s)}
                                                    title="To'lov qo'shish"
                                                >
                                                    <CreditCard size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            Jami {pagination.total_count || 0} ta o'quvchi
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

            <AddPaymentModal
                student={payStudent}
                open={!!payStudent}
                onClose={() => setPayStudent(null)}
                onSuccess={() => fetchStudents(page)}
            />
        </div>
    );
}
