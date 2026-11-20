/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useLazyGetStudentsQuery } from "../../../../store/services/student.api";
import { useCreatePaymentMutation } from "../../../../store/services/payment.api";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import { Plus, Search, X } from "lucide-react";

const MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const METHODS = [
    { value: "cash", label: "Naqd" },
    { value: "card", label: "Karta" },
    { value: "transfer", label: "Pul o'tkazmasi" },
    { value: "bank_account", label: "Bank hisobi" },
];

const fmt = (value) => value ? Number(String(value).replace(/\s/g, "")).toLocaleString("ru-RU") : "";
const parseNum = (value) => String(value || "").replace(/\s/g, "");
const selectStyle = {
    padding: "9px 12px", background: "var(--input-bg)",
    border: "1.5px solid var(--input-border)", borderRadius: 9,
    color: "var(--input-text)", fontSize: "0.82rem", outline: "none", cursor: "pointer",
    width: "100%", minWidth: 0, boxSizing: "border-box", display: "block",
};

export default function AddPaymentModal({ student, open, onClose, onSuccess }) {
    const now = new Date();
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
    const [selectedStudent, setSelectedStudent] = useState(student || null);
    const [studentSearch, setStudentSearch] = useState("");
    const [fetchStudents, { data: studentsData, isLoading: studentsLoading }] = useLazyGetStudentsQuery();
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
        if (open) setSelectedStudent(student || null);
    }, [open, student]);

    useEffect(() => {
        if (!open || selectedStudent) return;
        const search = studentSearch.trim();
        if (search.length < 2) return;
        const timer = setTimeout(() => fetchStudents({ search, limit: 10 }), 300);
        return () => clearTimeout(timer);
    }, [open, selectedStudent, studentSearch, fetchStudents]);

    useEffect(() => {
        if (!open || !selectedStudent) return;
        const currentDate = new Date();
        const required = selectedStudent.price ? String(selectedStudent.price) : "";
        setBaseRequired(required);
        setForm({
            year: currentDate.getFullYear(), month: currentDate.getMonth() + 1,
            paid_amount: "", required_amount: required, discount_percent: "",
            method: "cash", comment: "",
        });
        setDisplayPaid("");
        setErrors({});
    }, [open, selectedStudent]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        if (name === "paid_amount") {
            const amount = parseNum(value);
            setForm((previous) => ({ ...previous, paid_amount: amount }));
            setDisplayPaid(fmt(amount));
        } else if (name === "required_amount") {
            const amount = parseNum(value);
            setBaseRequired(amount);
            setForm((previous) => {
                const discount = +previous.discount_percent || 0;
                return {
                    ...previous,
                    required_amount: discount > 0
                        ? String(Math.round(+amount * (1 - discount / 100)))
                        : amount,
                };
            });
        } else if (name === "discount_percent") {
            const discount = Math.min(100, Math.max(0, +value || 0));
            const base = +baseRequired || +form.required_amount;
            const required = discount > 0 ? String(Math.round(base * (1 - discount / 100))) : String(base);
            setForm((previous) => ({ ...previous, discount_percent: value, required_amount: required }));
        } else {
            setForm((previous) => ({ ...previous, [name]: value }));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationErrors = {};
        if (!form.paid_amount || +form.paid_amount <= 0) validationErrors.paid_amount = "Musbat summa kiriting";
        if (!form.required_amount || +form.required_amount <= 0) validationErrors.required_amount = "Kerakli summani kiriting";
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length) return;

        try {
            await create({
                student_id: selectedStudent.id,
                year: +form.year,
                month: +form.month,
                paid_amount: +form.paid_amount,
                required_amount: +form.required_amount,
                method: form.method,
                ...(form.discount_percent && { discount_percent: +form.discount_percent }),
                ...(form.comment && { comment: form.comment }),
            }).unwrap();
            Alert("To'lov qo'shildi", "success");
            onSuccess?.();
            onClose();
        } catch (error) {
            Alert(error?.data?.message || "Xatolik", "error");
        }
    };

    const students = studentsData?.data?.records || [];

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={selectedStudent ? `To'lov — ${selectedStudent.full_name || ""}` : "O'quvchini tanlang"}
            size="sm"
        >
            {!selectedStudent ? (
                <div>
                    <div className="search-input-wrap" style={{ position: "relative", marginBottom: 8 }}>
                        <Search className="search-icon" size={16} />
                        <input
                            className="search-input"
                            value={studentSearch}
                            onChange={(event) => setStudentSearch(event.target.value)}
                            placeholder="O'quvchi ismini kiriting..."
                            autoFocus
                        />
                        {studentSearch && (
                            <button className="toolbar-clear-btn" onClick={() => setStudentSearch("")} type="button">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                        {studentsLoading ? (
                            <div style={{ padding: 12, color: "var(--text-muted)", fontSize: "0.82rem" }}>Yuklanmoqda...</div>
                        ) : studentSearch.trim().length < 2 ? (
                            <div style={{ padding: 12, color: "var(--text-muted)", fontSize: "0.82rem" }}>Kamida 2 ta harf kiriting</div>
                        ) : students.length === 0 ? (
                            <div style={{ padding: 12, color: "var(--text-muted)", fontSize: "0.82rem" }}>O&apos;quvchi topilmadi</div>
                        ) : students.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelectedStudent(item)}
                                style={{
                                    display: "block", width: "100%", padding: "10px 12px", textAlign: "left",
                                    background: "transparent", border: 0, borderBottom: "1px solid var(--card-border)",
                                    color: "var(--text-primary)", cursor: "pointer",
                                }}
                            >
                                <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 600 }}>{item.full_name}</span>
                                <span style={{ display: "block", marginTop: 2, color: "var(--text-muted)", fontSize: "0.72rem" }}>{item.phone || "—"}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "var(--accent-soft)", border: "1px solid var(--card-border)" }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                                    {(selectedStudent.full_name || "?").charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{selectedStudent.full_name}</div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                    {selectedStudent.phone || "—"} · {(selectedStudent.groups || []).map((group) => group.name).filter(Boolean).join(", ") || "—"}
                                </div>
                            </div>
                            {selectedStudent.price > 0 && (
                                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                                    {Number(selectedStudent.price).toLocaleString("ru-RU")} so&apos;m
                                </div>
                            )}
                        </div>
                        {!student && (
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => { setSelectedStudent(null); setStudentSearch(""); }}
                            >
                                Boshqa o&apos;quvchini tanlash
                            </button>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div>
                                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>Yil</label>
                                <select name="year" value={form.year} onChange={handleChange} style={selectStyle}>
                                    {years.map((year) => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>Oy</label>
                                <select name="month" value={form.month} onChange={handleChange} style={selectStyle}>
                                    {MONTHS.map((month, index) => <option key={index + 1} value={index + 1}>{month}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div>
                                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>To&apos;langan summa *</label>
                                <input name="paid_amount" value={displayPaid} onChange={handleChange} placeholder="0" className="search-input" style={{ paddingLeft: 14 }} />
                                {errors.paid_amount && <span style={{ fontSize: "0.72rem", color: "var(--danger)" }}>{errors.paid_amount}</span>}
                            </div>
                            <div>
                                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>Kerakli summa *</label>
                                <input name="required_amount" value={fmt(form.required_amount)} onChange={handleChange} placeholder="0" className="search-input" style={{ paddingLeft: 14 }} />
                                {errors.required_amount && <span style={{ fontSize: "0.72rem", color: "var(--danger)" }}>{errors.required_amount}</span>}
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>To&apos;lov usuli</label>
                            <select name="method" value={form.method} onChange={handleChange} style={selectStyle}>
                                {METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>Chegirma (%)</label>
                            <input name="discount_percent" value={form.discount_percent} onChange={handleChange} type="number" min="0" max="100" placeholder="0" className="search-input" style={{ paddingLeft: 14 }} />
                            {+form.discount_percent > 0 && +baseRequired > 0 && (
                                <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem" }}>
                                    <span style={{ color: "var(--text-muted)", textDecoration: "line-through" }}>{Number(baseRequired).toLocaleString("ru-RU")} so&apos;m</span>
                                    <span style={{ color: "var(--danger)", fontWeight: 600 }}>−{form.discount_percent}%</span>
                                    <span style={{ color: "var(--success)", fontWeight: 700 }}>= {Number(form.required_amount).toLocaleString("ru-RU")} so&apos;m</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 4 }}>Izoh (ixtiyoriy)</label>
                            <textarea name="comment" value={form.comment} onChange={handleChange} rows={2} placeholder="Qo'shimcha..." className="search-input" style={{ paddingLeft: 14, height: "auto", resize: "vertical" }} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            <Plus size={14} />{isLoading ? "Saqlanmoqda..." : "To&apos;lov qo&apos;shish"}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
