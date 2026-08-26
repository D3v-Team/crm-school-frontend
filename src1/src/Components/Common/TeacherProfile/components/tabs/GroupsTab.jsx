// GroupsTab.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Typography } from '@material-tailwind/react';
import { Users } from 'lucide-react';
import Loading from '../../../../Other/UI/Loadings/Loading';
import AddGroup from '../AddGroups';
import DeleteGroup from '../DeleteGroups';
import { useLazyGetTeacherGroupsByTeacherIdQuery } from '../../../../../store/services/theacher-group.api';

export default function GroupsTab() {
    const { id } = useParams();
    const [trigger, { data, isLoading, error }] = useLazyGetTeacherGroupsByTeacherIdQuery();

    useEffect(() => {
        if (id) trigger(id);
    }, [id, trigger]);

    const handleAdd = () => {
        if (id) trigger(id);
    };
    const handleRemove = () => {
        if (id) trigger(id);
    };

    if (isLoading) return <Loading />;
    if (error) {
        return (
            <div className="text-red-500 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                Xatolik: {error?.data?.message || "Noma'lum xatolik"}
            </div>
        );
    }

    const groups =
        data?.data?.records || (Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);

    return (
        <div className="mb-6 last:mb-0">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    <Typography variant="h6" className="text-text-primary font-semibold">
                        Siniflar
                    </Typography>
                </div>
                <AddGroup onAdd={handleAdd} />
            </div>

            {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-input-bg/30 rounded-xl border border-border/40">
                    <Users className="w-16 h-16 text-text-secondary/30 mb-3" />
                    <Typography className="text-text-secondary text-base font-medium">
                        Hozircha siniflar mavjud emas
                    </Typography>
                    <Typography className="text-text-secondary text-sm mt-1">
                        O‘qituvchiga guruh biriktirish uchun "Qo‘shish" tugmasini bosing
                    </Typography>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {groups.map((item) => (
                        <div
                            key={item.teacher_group_id || item.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-input-bg/40 border border-border/40 hover:border-accent/40 hover:shadow-md transition-all duration-200 group"
                        >
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-accent/70 flex-shrink-0" />
                                <div>
                                    <Typography className="text-text-primary font-medium">
                                        {item.group?.name || "Noma'lum guruh"}
                                    </Typography>
                                    {item.group?.start_date && (
                                        <Typography className="text-text-secondary text-xs">
                                            Boshlanish: {new Date(item.group.start_date).toLocaleDateString('uz-UZ')}
                                        </Typography>
                                    )}
                                </div>
                            </div>
                            <DeleteGroup
                                teacherGroupId={item.teacher_group_id || item.id}
                                groupName={item.group?.name || "Guruh"}
                                onRemove={handleRemove}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}