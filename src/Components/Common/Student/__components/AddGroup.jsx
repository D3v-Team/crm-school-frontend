import { useState, useEffect } from "react";
import { useAssignGroupMutation } from "../../../../store/services/student.api";
import { useLazyGetGroupsQuery } from "../../../../store/services/group.api";
import { Layers } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import Modal from "../../../Other/UI/Modal/Modal";
import FormField from "../../../Other/UI/FormField/FormField";

export default function AddGroup({ studentID, onAdd }) {
    const [open, setOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [error, setError] = useState("");
    const [groups, setGroups] = useState([]);

    const [fetchGroups, { data: groupsData, isLoading: groupsLoading }] = useLazyGetGroupsQuery();
    const [assignGroup, { isLoading }] = useAssignGroupMutation();

    useEffect(() => {
        if (open) fetchGroups({ limit: 100 });
    }, [open]);

    useEffect(() => {
        if (groupsData) setGroups(groupsData?.data?.records || []);
    }, [groupsData]);

    const handleClose = () => { setOpen(false); setSelectedGroupId(""); setError(""); setGroups([]); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedGroupId) { setError("Guruh tanlanishi kerak"); return; }
        try {
            await assignGroup({ id: studentID, data: { group_id: selectedGroupId } }).unwrap();
            Alert("O'quvchi guruhga qo'shildi", "success");
            if (onAdd) onAdd();
            handleClose();
        } catch (err) {
            Alert(err?.data?.message || "Xatolik yuz berdi", "error");
        }
    };

    return (
        <>
            <button className="action-btn action-btn-success" onClick={() => setOpen(true)} title="Guruhga qo'shish">
                <Layers size={14} />
            </button>
            <Modal open={open} onClose={handleClose} title="Guruhga qo'shish" size="sm">
                <form onSubmit={handleSubmit}>
                    <FormField label="Guruh" error={error}>
                        <select
                            className={`field-select no-icon${error ? ' error' : selectedGroupId ? ' valid' : ''}`}
                            value={selectedGroupId}
                            onChange={e => { setSelectedGroupId(e.target.value); setError(""); }}
                            disabled={groupsLoading}
                        >
                            <option value="">Guruhni tanlang</option>
                            {groupsLoading && <option disabled>Yuklanmoqda...</option>}
                            {!groupsLoading && groups.length === 0 && <option disabled>Guruhlar topilmadi</option>}
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </FormField>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={handleClose}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            {isLoading ? "Qo'shilmoqda..." : "Qo'shish"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
