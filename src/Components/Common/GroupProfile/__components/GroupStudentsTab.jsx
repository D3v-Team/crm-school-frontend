/* eslint-disable react/prop-types */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { groupApi, useAddStudentToGroupMutation, useGetGroupStudentsQuery, useRemoveStudentFromGroupMutation } from "../../../../store/services/group.api";
import { studentApi, useLazyGetStudentsQuery } from "../../../../store/services/student.api";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Loading from "../../../Other/UI/Loadings/Loading";
import Modal from "../../../Other/UI/Modal/Modal";
import { Plus, Search, Trash2, Users, X } from "lucide-react";

const getStudents = (response) => response?.data?.students || response?.students || [];
const getRecords = (response) => response?.data?.records || [];
const joinedDate = (date) => date ? new Date(date).toLocaleDateString("uz-UZ") : "—";

export default function GroupStudentsTab({ groupId }) {
    const dispatch = useDispatch();
    const role = useSelector((state) => state.auth?.role);
    const canManage = role === "admin" || role === "super_admin";
    const { data, isLoading, error } = useGetGroupStudentsQuery(groupId, { skip: !groupId });
    const [addStudent, { isLoading: isAdding }] = useAddStudentToGroupMutation();
    const [removeStudent, { isLoading: isRemoving }] = useRemoveStudentFromGroupMutation();
    const [fetchStudents, { data: searchData, isLoading: isSearching, error: searchError }] = useLazyGetStudentsQuery();
    const [addOpen, setAddOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [pendingRemove, setPendingRemove] = useState(null);
    const students = getStudents(data);
    const candidates = getRecords(searchData);

    const openAdd = () => {
        setSearch("");
        setAddOpen(true);
        fetchStudents({ page: 1, limit: 30, is_active: true });
    };
    const searchStudents = (event) => {
        event.preventDefault();
        fetchStudents({ page: 1, limit: 30, is_active: true, ...(search.trim() && { search: search.trim() }) });
    };
    const add = async (studentId) => {
        try {
            await addStudent({ groupId, student_id: studentId }).unwrap();
            dispatch(studentApi.util.invalidateTags([{ type: "Student" }]));
            Alert("O'quvchi guruhga qo'shildi", "success");
        } catch (requestError) {
            Alert(requestError?.data?.message || "O'quvchini guruhga qo'shib bo'lmadi", "error");
        }
    };
    const remove = async () => {
        if (!pendingRemove) return;
        try {
            await removeStudent({ groupId, studentId: pendingRemove.id }).unwrap();
            dispatch(studentApi.util.invalidateTags([{ type: "Student" }]));
            dispatch(groupApi.util.invalidateTags([{ type: "Group" }]));
            Alert("O'quvchi guruhdan chiqarildi", "success");
            setPendingRemove(null);
        } catch (requestError) {
            Alert(requestError?.data?.message || "O'quvchini guruhdan chiqarib bo'lmadi", "error");
        }
    };

    if (isLoading) return <Loading />;
    if (error) return <div role="alert" style={{ color: "var(--danger)", padding: 12, background: "var(--danger-soft)", borderRadius: 10 }}>Xatolik: {error?.data?.message || "O'quvchilarni yuklab bo'lmadi"}</div>;

    return (
        <div>
            <div className="group-students-toolbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Users size={16} style={{ color: "var(--accent)" }} />
                    <strong style={{ color: "var(--text-primary)" }}>Guruh o&apos;quvchilari</strong>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{students.length} ta</span>
                </div>
                {canManage && <button className="btn-create" onClick={openAdd}><Plus size={14} /> O&apos;quvchi qo&apos;shish</button>}
            </div>
            <div className="group-students-desktop-table data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr><th>O&apos;quvchi</th><th>Telefon</th><th>Ota-ona</th><th>Guruhga qo&apos;shilgan</th>{canManage && <th>Amallar</th>}</tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr><td colSpan={canManage ? 5 : 4} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Guruhda o&apos;quvchi yo&apos;q</td></tr>
                        ) : students.map((student) => (
                            <tr key={student.id}>
                                <td><Link to={`/student/${student.id}`} style={{ color: "var(--text-primary)", fontWeight: 600 }}>{student.full_name}</Link></td>
                                <td>{student.phone || "—"}</td>
                                <td>{student.parent?.full_name || "—"}</td>
                                <td>{joinedDate(student.joined_at || student.StudentGroup?.joined_at)}</td>
                                {canManage && <td><button className="action-btn action-btn-danger" title="Guruhdan chiqarish" onClick={() => setPendingRemove(student)}><Trash2 size={14} /></button></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="group-students-mobile-list">
                {students.length === 0 ? (
                    <div className="group-student-mobile-empty">Guruhda o&apos;quvchi yo&apos;q</div>
                ) : students.map((student) => (
                    <article key={student.id} className="group-student-mobile-card">
                        <div className="group-student-mobile-header">
                            <Link to={`/student/${student.id}`} style={{ color: "var(--text-primary)", fontWeight: 700, textDecoration: "none", minWidth: 0 }}>
                                {student.full_name}
                            </Link>
                            {canManage && (
                                <button
                                    className="action-btn action-btn-danger"
                                    title="Guruhdan chiqarish"
                                    aria-label={`${student.full_name} guruhdan chiqarish`}
                                    onClick={() => setPendingRemove(student)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        <div className="group-student-mobile-details">
                            <div><span>Telefon</span><strong>{student.phone || "—"}</strong></div>
                            <div><span>Ota-ona</span><strong>{student.parent?.full_name || "—"}</strong></div>
                            <div><span>Guruhga qo&apos;shilgan</span><strong>{joinedDate(student.joined_at || student.StudentGroup?.joined_at)}</strong></div>
                        </div>
                    </article>
                ))}
            </div>

            <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Guruhga o'quvchi qo'shish" size="md">
                <form onSubmit={searchStudents} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ism yoki telefon bo'yicha qidirish" />
                    <button className="btn-submit" type="submit" disabled={isSearching}><Search size={14} /> Qidirish</button>
                </form>
                {searchError && <p role="alert" style={{ color: "var(--danger)" }}>{searchError?.data?.message || "O'quvchilarni qidirib bo'lmadi"}</p>}
                {isSearching ? <Loading /> : (
                    <div style={{ maxHeight: 340, overflowY: "auto" }}>
                        {candidates.filter((student) => !students.some((current) => current.id === student.id)).map((student) => (
                            <div key={student.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--card-border)" }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{student.full_name}</div>
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{student.phone || "—"}</div>
                                </div>
                                <button type="button" className="action-btn action-btn-success" title="Qo'shish" disabled={isAdding} onClick={() => add(student.id)}><Plus size={14} /></button>
                            </div>
                        ))}
                        {!searchError && !candidates.some((student) => !students.some((current) => current.id === student.id)) && (
                            <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Qo&apos;shish uchun o&apos;quvchi topilmadi</p>
                        )}
                    </div>
                )}
            </Modal>
            <Modal open={!!pendingRemove} onClose={() => setPendingRemove(null)} title="Guruhdan chiqarish" size="sm">
                <p style={{ color: "var(--text-primary)" }}><strong>{pendingRemove?.full_name}</strong> o&apos;quvchisini ushbu guruhdan chiqarasizmi? Boshqa guruhlaridagi a&apos;zoligi o&apos;zgarmaydi.</p>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setPendingRemove(null)}><X size={14} /> Bekor qilish</button>
                    <button className="btn-delete" disabled={isRemoving} onClick={remove}><Trash2 size={14} /> {isRemoving ? "Chiqarilmoqda..." : "Chiqarish"}</button>
                </div>
            </Modal>
        </div>
    );
}
