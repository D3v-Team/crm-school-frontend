/* eslint-disable react/prop-types */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useUnassignGroupMutation } from "../../../store/services/student.api";
import { groupApi } from "../../../store/services/group.api";
import AddGroup from "../Student/__components/AddGroup";
import { Alert } from "../../Other/UI/Alert/Alert";
import Modal from "../../Other/UI/Modal/Modal";
import { CalendarDays, Layers, Trash2, X } from "lucide-react";

const joinedDate = (group) => {
    const date = group?.StudentGroup?.joined_at || group?.joined_at;
    return date ? new Date(date).toLocaleDateString("uz-UZ") : "—";
};

export default function GroupsSection({ student, onRefresh }) {
    const dispatch = useDispatch();
    const role = useSelector((state) => state.auth?.role);
    const canManage = role === "admin" || role === "super_admin";
    const [removeGroup, { isLoading }] = useUnassignGroupMutation();
    const [pendingGroup, setPendingGroup] = useState(null);
    const groups = student?.groups || [];

    const confirmRemove = async () => {
        if (!pendingGroup) return;
        try {
            await removeGroup({ id: student.id, data: { group_id: pendingGroup.id } }).unwrap();
            dispatch(groupApi.util.invalidateTags([{ type: "Group" }]));
            Alert("O'quvchi guruhdan chiqarildi", "success");
            setPendingGroup(null);
            onRefresh();
        } catch (error) {
            Alert(error?.data?.message || "Guruhdan chiqarib bo'lmadi", "error");
        }
    };

    return (
        <section style={{ marginTop: 18, borderTop: "1px solid var(--card-border)", paddingTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-primary)", fontWeight: 700 }}>
                    <Layers size={15} style={{ color: "var(--accent)" }} /> Guruhlar ({groups.length})
                </div>
                {canManage && student.is_active && <AddGroup studentID={student.id} onAdd={onRefresh} assignedGroups={groups} buttonText="Guruhga qo'shish" />}
            </div>
            {groups.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>O&apos;quvchi hech qaysi guruhga biriktirilmagan.</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 8 }}>
                    {groups.map((group) => (
                        <div key={group.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 11px", borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--card-border)" }}>
                            <div style={{ minWidth: 0 }}>
                                <Link to={`/group/${group.id}`} style={{ fontSize: "0.82rem", fontWeight: 650, color: "var(--text-primary)", textDecoration: "none" }}>{group.name}</Link>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 8px", marginTop: 3, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                    <span>{group.teacher?.full_name || "O\u0027qituvchi belgilanmagan"}</span>
                                    <span>{group.subject?.name || "Fan belgilanmagan"}</span>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><CalendarDays size={10} />{joinedDate(group)}</span>
                                </div>
                            </div>
                            {canManage && student.is_active && (
                                <button className="action-btn action-btn-danger" title="Ushbu guruhdan chiqarish" onClick={() => setPendingGroup(group)}>
                                    <Trash2 size={13} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <Modal open={!!pendingGroup} onClose={() => setPendingGroup(null)} title="Guruhdan chiqarish" size="sm">
                <p style={{ color: "var(--text-primary)" }}>
                    <strong>{student.full_name}</strong> o&apos;quvchisini <strong>{pendingGroup?.name}</strong> guruhidan chiqarasizmi? Boshqa guruhlaridagi a&apos;zoligi o&apos;zgarmaydi.
                </p>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setPendingGroup(null)}><X size={14} /> Bekor qilish</button>
                    <button className="btn-delete" disabled={isLoading} onClick={confirmRemove}><Trash2 size={14} /> {isLoading ? "Chiqarilmoqda..." : "Chiqarish"}</button>
                </div>
            </Modal>
        </section>
    );
}
