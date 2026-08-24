import { useState } from "react";
import { useGetGroupsQuery } from "../../../../store/services/group.api";
import { Plus } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import { useParams } from "react-router-dom";
import { useCreateTeacherGroupMutation } from "../../../../store/services/theacher-group.api";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField from "../../../Other/UI/FormField/FormField";

export default function AddGroup({ onAdd }) {
    const [open, setOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [error, setError] = useState("");
    const { id } = useParams();

    const { data: groupsData, isLoading: groupsLoading } = useGetGroupsQuery({ limit: 100 });
    const [createTeacherGroup, { isLoading }] = useCreateTeacherGroupMutation();
    const groups = groupsData?.data?.records || [];

    const handleClose = () => { setOpen(false); setSelectedGroupId(""); setError(""); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedGroupId) { setError("Guruh tanlanishi kerak"); return; }
        try {
            await createTeacherGroup({ teacher_id: id, group_id: selectedGroupId }).unwrap();
            Alert("Guruh muvaffaqiyatli biriktirildi", "success");
            if (onAdd) onAdd();
            handleClose();
        } catch (err) {
            Alert(err?.data?.message || "Xatolik yuz berdi", "error");
        }
    };

    return (
        <>
            <button className="btn-create" onClick={() => setOpen(true)}>
                <Plus size={14} /> Qo'shish
            </button>
            <Modal open={open} onClose={handleClose} title="Guruh biriktirish" size="sm">
                <form onSubmit={handleSubmit}>
                    <FormField label="Guruh" error={error}>
                        <select
                            className={`field-select no-icon${error ? ' error' : selectedGroupId ? ' valid' : ''}`}
                            value={selectedGroupId}
                            onChange={e => { setSelectedGroupId(e.target.value); setError(""); }}
                            disabled={groupsLoading}
                        >
                            <option value="">Guruh tanlang</option>
                            {groupsLoading && <option disabled>Yuklanmoqda...</option>}
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </FormField>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={handleClose}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            {isLoading ? "Saqlanmoqda..." : "Biriktirish"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
