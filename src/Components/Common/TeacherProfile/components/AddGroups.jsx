// AddGroup.jsx
import { useState } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Select, Option } from "@material-tailwind/react";
import { useGetGroupsQuery } from "../../../../store/services/group.api";
import { Users, Plus } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";
import { useParams } from "react-router-dom";
import { useCreateTeacherGroupMutation } from "../../../../store/services/theacher-group.api";

export default function AddGroup({ onAdd }) {
    const [open, setOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [errors, setErrors] = useState({});
    const { id } = useParams();

    const { data: groupsData, isLoading: groupsLoading } = useGetGroupsQuery({ limit: 100 });
    const [createTeacherGroup, { isLoading }] = useCreateTeacherGroupMutation();

    const groups = groupsData?.data?.records || [];

    const handleOpen = () => {
        setOpen(true);
        setSelectedGroupId("");
        setErrors({});
    };
    const handleClose = () => {
        setOpen(false);
        setSelectedGroupId("");
        setErrors({});
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
            await createTeacherGroup({
                teacher_id: id,
                group_id: selectedGroupId,
            }).unwrap();
            Alert("Guruh o‘qituvchiga muvaffaqiyatli biriktirildi", "success");
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
                className="bg-accent hover:bg-accent-hover text-white transition-colors flex items-center gap-1"
                onClick={handleOpen}
                size="sm"
            >
                <Plus size={16} /> Qo‘shish
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="sm"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary">
                    O‘qituvchiga guruh biriktirish
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        <div>
                            <Select
                                label="Guruh"
                                value={selectedGroupId}
                                onChange={(val) => setSelectedGroupId(val)}
                                className="!bg-input-bg !border-input-border text-input-text"
                                labelProps={{ className: "text-text-secondary" }}
                                disabled={groupsLoading}
                            >
                                {groupsLoading ? (
                                    <Option value="" disabled>Yuklanmoqda...</Option>
                                ) : groups.length === 0 ? (
                                    <Option value="" disabled>Guruhlar topilmadi</Option>
                                ) : (
                                    groups.map((group) => (
                                        <Option key={group.id} value={group.id}>
                                            {group.name}
                                        </Option>
                                    ))
                                )}
                            </Select>
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
                            Biriktirish
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </>
    );
}