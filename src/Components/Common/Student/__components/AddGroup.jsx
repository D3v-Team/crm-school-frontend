import { useState, useEffect, useRef } from "react";
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
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const groupsListRef = useRef(null);
    const requestedPageRef = useRef(1);

    const [fetchGroups, { data: groupsData, isLoading: groupsLoading, isFetching: groupsFetching }] = useLazyGetGroupsQuery();
    const [assignGroup, { isLoading }] = useAssignGroupMutation();

    useEffect(() => {
        if (open) {
            setPage(1);
            setGroups([]);
            requestedPageRef.current = 1;
            fetchGroups({ page: 1, limit: 30 });
        }
    }, [open, fetchGroups]);

    useEffect(() => {
        if (!groupsData) return;
        const newGroups = groupsData?.data?.records || [];
        const pagination = groupsData?.data?.pagination || {};
        const loadedPage = pagination.currentPage || pagination.current_page || requestedPageRef.current;
        setGroups(previous => loadedPage === 1
            ? newGroups
            : [...previous, ...newGroups.filter(group => !previous.some(item => item.id === group.id))]);
        setPage(loadedPage);
        setTotalPages(pagination.total_pages || 1);
    }, [groupsData]);

    const handleGroupsScroll = (event) => {
        const list = event.currentTarget;
        const isNearBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 24;
        if (isNearBottom && !groupsFetching && page < totalPages) {
            const nextPage = page + 1;
            requestedPageRef.current = nextPage;
            fetchGroups({ page: nextPage, limit: 30 });
        }
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedGroupId("");
        setError("");
        setGroups([]);
        setPage(1);
        setTotalPages(1);
        requestedPageRef.current = 1;
        if (groupsListRef.current) groupsListRef.current.scrollTop = 0;
    };

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
                            ref={groupsListRef}
                            onScroll={handleGroupsScroll}
                            disabled={groupsLoading && groups.length === 0}
                        >
                            <option value="">{groupsLoading && groups.length === 0 ? "Yuklanmoqda..." : "Guruhni tanlang"}</option>
                            {!groupsLoading && groups.length === 0 && <option disabled>Guruhlar topilmadi</option>}
                            {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                            {groupsFetching && <option disabled>Yuklanmoqda...</option>}
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
