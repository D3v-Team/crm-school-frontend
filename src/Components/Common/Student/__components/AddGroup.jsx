// __components/AddGroup.jsx
import { useState, useEffect } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import { useAssignGroupMutation } from "../../../../store/services/student.api";
import { useLazyGetGroupsQuery } from "../../../../store/services/group.api";
import { Plus } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";

export default function AddGroup({ studentID, onAdd }) {
    const [open, setOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [errors, setErrors] = useState({});
    const [groups, setGroups] = useState([]);

    const [fetchGroups, { data: groupsData, isLoading: groupsLoading }] = useLazyGetGroupsQuery();
    const [assignGroup, { isLoading }] = useAssignGroupMutation();

    useEffect(() => {
        if (open) {
            fetchGroups({ limit: 100 });
        }
    }, [open, fetchGroups]);

    useEffect(() => {
        if (groupsData) {
            const records = groupsData?.data?.records || [];
            setGroups(records);
        }
    }, [groupsData]);

    const handleOpen = () => {
        setOpen(true);
        setSelectedGroupId("");
        setErrors({});
    };
    const handleClose = () => {
        setOpen(false);
        setSelectedGroupId("");
        setErrors({});
        setGroups([]);
    };

    const validate = () => {
        const newErrors = {};
        if (!selectedGroupId) newErrors.group = "Guruh tanlanishi kerak";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await assignGroup({
                id: studentID,
                data: { group_id: selectedGroupId },
            }).unwrap();
            Alert("O‘quvchi guruhga muvaffaqiyatli qo‘shildi", "success");
            if (onAdd) onAdd();
            handleClose();
        } catch (error) {
            const errorMessage = error?.data?.message || "Xatolik yuz berdi";
            Alert(errorMessage, "error");
            setErrors({ api: errorMessage });
        }
    };

    return (
        <>
            <Button
                className="p-2 bg-accent hover:bg-accent-hover text-white transition-colors"
                onClick={handleOpen}
                title="Guruhga qo‘shish"
            >
                <Plus className="w-4 h-4" />
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="sm"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary">
                    O‘quvchini guruhga qo‘shish
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                                Guruh
                            </label>
                            <select
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors"
                                disabled={groupsLoading}
                            >
                                <option value="">Guruhni tanlang</option>
                                {groupsLoading ? (
                                    <option disabled>Yuklanmoqda...</option>
                                ) : groups.length === 0 ? (
                                    <option disabled>Guruhlar topilmadi</option>
                                ) : (
                                    groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            {errors.group && (
                                <p className="text-red-500 text-xs mt-1">{errors.group}</p>
                            )}
                        </div>
                    </DialogBody>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="text"
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Bekor qilish
                        </Button>
                        <Button
                            type="submit"
                            className="bg-accent hover:bg-accent-hover text-white transition-colors"
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            Qo‘shish
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </>
    );
}