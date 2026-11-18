/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Briefcase, Download, Phone, Plus, User } from "lucide-react";
import Modal from "../../Other/UI/Modal/Modal";
import FormField, { Input } from "../../Other/UI/FormField/FormField";
import Loading from "../../Other/UI/Loadings/Loading";
import { Alert } from "../../Other/UI/Alert/Alert";
import $api from "../../../store/api";
import {
    useCreateUserMutation, useGetUserByIdQuery, useUpdateUserMutation,
} from "../../../store/services/user.api";
import { getErrorMessages, readBlobError } from "../../../utils/errors";
import UserDeleteDialog from "../Shared/UserDeleteDialog";
import { downloadBlob, filenameFromDisposition, maxRangeEnd, validateExcelRange } from "../../../utils/files";

const PHONE_RE = /^\+?\d{9,15}$/;

function ErrorList({ messages }) {
    if (!messages.length) return null;
    return (
        <div role="alert" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: 10, padding: "8px 12px", fontSize: "0.78rem" }}>
            {messages.map((message, index) => <div key={index}>{message}</div>)}
        </div>
    );
}

/* ─── Qo'shish / tahrirlash ───
   Xodim tizimga kirmaydi: username va parol ko'rsatilmaydi (TZ 1.4).
   Tahrirlashda `username` GET /user/:id dan o'zgartirmasdan qaytariladi (TZ 1.5). */
export function StaffFormModal({ staff, roles, rolesLoading, onClose }) {
    const isEdit = Boolean(staff?.id);
    const { data: detailData, isFetching: detailLoading, error: detailError } = useGetUserByIdQuery(staff?.id, { skip: !isEdit, refetchOnMountOrArgChange: true });
    const detail = detailData?.data || detailData;
    const [form, setForm] = useState({ full_name: "", phone: "", role: "" });
    const [errors, setErrors] = useState({});
    const [serverErrors, setServerErrors] = useState([]);
    const [createUser, { isLoading: creating }] = useCreateUserMutation();
    const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
    const saving = creating || updating;

    useEffect(() => {
        if (!isEdit) return;
        const source = detail?.id ? detail : staff;
        setForm({ full_name: source.full_name || "", phone: source.phone || "", role: source.role || "" });
    }, [isEdit, detail, staff]);

    const set = (key) => (event) => {
        const value = event.target.value;
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: "" }));
        setServerErrors([]);
    };

    const validate = () => {
        const next = {};
        if (!form.full_name.trim()) next.full_name = "F.I.Sh. kiritilishi kerak";
        const phone = form.phone.replace(/[\s()-]/g, "");
        if (!phone) next.phone = "Telefon kiritilishi kerak";
        else if (!PHONE_RE.test(phone)) next.phone = "Telefon raqami noto'g'ri (masalan +998901234567)";
        if (!isEdit && !form.role) next.role = "Lavozim tanlanishi kerak";
        setErrors(next);
        return !Object.keys(next).length;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) return;
        const phone = form.phone.replace(/[\s()-]/g, "");
        try {
            if (isEdit) {
                if (!detail?.username) {
                    setServerErrors(["Xodim ma'lumoti to'liq yuklanmadi, qayta urinib ko'ring"]);
                    return;
                }
                await updateUser({ id: staff.id, data: { full_name: form.full_name.trim(), username: detail.username, phone } }).unwrap();
                Alert("Xodim ma'lumotlari yangilandi", "success");
            } else {
                await createUser({ full_name: form.full_name.trim(), phone, role: form.role }).unwrap();
                Alert("Xodim qo'shildi", "success");
            }
            onClose(true);
        } catch (error) {
            const messages = getErrorMessages(error);
            setServerErrors(messages.length ? messages : ["Xatolik yuz berdi"]);
        }
    };

    return (
        <Modal open onClose={() => !saving && onClose(false)} title={isEdit ? "Xodimni tahrirlash" : "Xodim qo'shish"} size="sm">
            {isEdit && detailLoading && !detail ? <Loading /> : (
                <form onSubmit={handleSubmit}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {detailError && <ErrorList messages={getErrorMessages(detailError).length ? getErrorMessages(detailError) : ["Xodim ma'lumotini yuklab bo'lmadi"]} />}
                        <FormField label="F.I.Sh. *" icon={User} error={errors.full_name}>
                            <Input icon={User} value={form.full_name} onChange={set("full_name")} placeholder="Karimov Alisher" error={errors.full_name} autoFocus />
                        </FormField>
                        <FormField label="Telefon *" icon={Phone} error={errors.phone}>
                            <Input icon={Phone} value={form.phone} onChange={set("phone")} placeholder="+998901234567" inputMode="tel" error={errors.phone} />
                        </FormField>
                        {isEdit ? (
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                Lavozim: <strong style={{ color: "var(--text-primary)" }}>{roles.find((role) => role.value === form.role)?.label || staff.role_label || form.role || "—"}</strong> (o&apos;zgartirib bo&apos;lmaydi)
                            </div>
                        ) : (
                            <FormField label="Lavozim *" icon={Briefcase} error={errors.role}>
                                <select className={`field-select${errors.role ? " error" : form.role ? " valid" : ""}`} value={form.role} onChange={set("role")} disabled={rolesLoading}>
                                    <option value="">{rolesLoading ? "Yuklanmoqda..." : "Lavozimni tanlang"}</option>
                                    {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                                </select>
                            </FormField>
                        )}
                        <ErrorList messages={serverErrors} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => onClose(false)} disabled={saving}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={saving || (isEdit && !detail?.username)}>
                            <Plus size={14} /> {saving ? "Saqlanmoqda..." : isEdit ? "Saqlash" : "Qo'shish"}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}

/* ─── O'chirish (arxivlash) ─── */
export function StaffDeleteModal({ staff, onClose }) {
    return (
        <UserDeleteDialog
            user={staff}
            subject="xodimni"
            onClose={onClose}
            extra={staff.has_face_id ? (
                <p style={{ fontSize: "0.78rem", color: "var(--warning)", margin: "4px 0 0" }}>
                    Xodimning Face ID si bor. Avval Face ID ni o&apos;chirish tavsiya qilinadi, aks holda qurilmada qolib ketishi mumkin.
                </p>
            ) : null}
        />
    );
}

/* ─── Excel: barcha xodimlar kirdi-chiqdisi (≤ 93 kun) ─── */
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function StaffExcelModal({ onClose }) {
    const now = new Date();
    const [startDate, setStartDate] = useState(isoDate(new Date(now.getFullYear(), now.getMonth(), 1)));
    const [endDate, setEndDate] = useState(isoDate(now));
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async (event) => {
        event.preventDefault();
        const rangeError = validateExcelRange(startDate, endDate);
        if (rangeError) { setError(rangeError); return; }
        setDownloading(true);
        setError("");
        try {
            const response = await $api.get("/user-attendance/excel", { params: { startDate, endDate }, responseType: "blob" });
            downloadBlob(response.data, filenameFromDisposition(response.headers?.["content-disposition"], `xodimlar-davomati-${startDate}-${endDate}.xlsx`));
            onClose();
        } catch (requestError) {
            setError(await readBlobError(requestError, "Excel yuklab bo'lmadi"));
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Modal open onClose={() => !downloading && onClose()} title="Xodimlar davomati — Excel" size="sm">
            <form onSubmit={handleDownload}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <label style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Dan
                        <input type="date" className="search-input" style={{ paddingLeft: 14, marginTop: 4 }} value={startDate}
                            max={endDate || undefined}
                            onChange={(event) => { setStartDate(event.target.value); setError(""); }} />
                    </label>
                    <label style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Gacha
                        <input type="date" className="search-input" style={{ paddingLeft: 14, marginTop: 4 }} value={endDate}
                            min={startDate || undefined} max={maxRangeEnd(startDate)}
                            onChange={(event) => { setEndDate(event.target.value); setError(""); }} />
                    </label>
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "8px 0 0" }}>Oraliq ko&apos;pi bilan 93 kun.</p>
                {error && <div role="alert" style={{ marginTop: 10, color: "var(--danger)", fontSize: "0.78rem", whiteSpace: "pre-line" }}>{error}</div>}
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={downloading}>Bekor qilish</button>
                    <button type="submit" className="btn-submit" disabled={downloading}>
                        <Download size={14} /> {downloading ? "Yuklanmoqda..." : "Yuklab olish"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
