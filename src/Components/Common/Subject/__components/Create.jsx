import { useState } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import { useCreateSubjectMutation } from "../../../../store/services/subject.api";
import { BookOpen, X } from "lucide-react";
import { Alert } from "../../../Other/UI/Alert/Alert";

export default function Create() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [errors, setErrors] = useState({});

    const [createSubject, { isLoading }] = useCreateSubjectMutation();

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setName("");
        setErrors({});
    };

    const validate = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = "Fan nomi majburiy";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await createSubject({ name: name.trim() }).unwrap();
            Alert("Fan muvaffaqiyatli yaratildi", "success");
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
                className="bg-accent hover:bg-accent-hover text-white transition-colors"
                onClick={handleOpen}
            >
                Yaratish
            </Button>

            <Dialog
                open={open}
                handler={handleClose}
                size="sm"
                className="bg-card text-text-primary border border-border"
            >
                <DialogHeader className="text-text-primary flex items-center justify-between">
                    <span>Yangi fan yaratish</span>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <DialogBody className="flex flex-col gap-4">
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary z-10" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Fan nomi"
                                className={`
                                    w-full pl-10 pr-4 py-2.5 rounded-lg border-2
                                    bg-input-bg border-input-border text-input-text 
                                    placeholder:text-input-placeholder
                                    focus:border-accent focus:outline-none transition-colors
                                    ${errors.name ? "border-red-500" : ""}
                                    ${!errors.name && name ? "border-green-500" : ""}
                                `}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
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
                            Yaratish
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </>
    );
}