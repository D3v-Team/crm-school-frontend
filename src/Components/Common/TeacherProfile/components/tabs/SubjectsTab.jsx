import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Typography } from '@material-tailwind/react';
import { BookOpen } from 'lucide-react';
import AddSubject from '../AddSubject';
import DeleteSubject from '../DeleteSubject';
import { useLazyGetTeacherSubjectsByTeacherIdQuery } from '../../../../../store/services/teacher-subject.api';
import Loading from '../../../../Other/UI/Loadings/Loading';

export default function SubjectsTab() {
    const { id } = useParams(); // teacher_id из URL
    const [trigger, { data, isLoading, error, refetch }] = useLazyGetTeacherSubjectsByTeacherIdQuery();

    useEffect(() => {
        if (id) {
            trigger(id);
        }
    }, [id, trigger]);

    // Обработчик обновления списка после добавления/удаления
    const handleRefresh = () => {
        if (id) trigger(id);
    };

    if (isLoading) return <Loading />;
    if (error) {
        return (
            <div className="text-red-500 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                Xatolik yuz berdi: {error?.data?.message || "Noma'lum xatolik"}
            </div>
        );
    }

    // Извлекаем массив объектов, каждый содержит teacher_subject_id и subject
    const teacherSubjects = data?.data || [];

    return (
        <div className="mb-6 last:mb-0">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    <Typography variant="h6" className="text-text-primary font-semibold">
                        Fanlar
                    </Typography>
              
                </div>
                <AddSubject  onAdd={handleRefresh} />
            </div>

            {teacherSubjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-input-bg/30 rounded-xl border border-border/40">
                    <BookOpen className="w-16 h-16 text-text-secondary/30 mb-3" />
                    <Typography className="text-text-secondary text-base font-medium">
                        Hozircha fanlar mavjud emas
                    </Typography>
                    <Typography className="text-text-secondary text-sm mt-1">
                        O‘qituvchiga fan biriktirish uchun "Qo‘shish" tugmasini bosing
                    </Typography>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {teacherSubjects.map((item) => (
                        <div
                            key={item.teacher_subject_id}
                            className="flex items-center justify-between p-4 rounded-xl bg-input-bg/40 border border-border/40 hover:border-accent/40 hover:shadow-md transition-all duration-200 group"
                        >
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-accent/70 flex-shrink-0" />
                                <div>
                                    <Typography className="text-text-primary font-medium">
                                        {item.subject?.name || 'Noma\'lum fan'}
                                    </Typography>
                                    {item.subject?.createdAt && (
                                        <Typography className="text-text-secondary text-xs">
                                            Qo‘shilgan: {new Date(item.subject.createdAt).toLocaleDateString('uz-UZ')}
                                        </Typography>
                                    )}
                                </div>
                            </div>
                            <DeleteSubject
                                teacherSubjectId={item.teacher_subject_id}
                                subjectName={item.subject?.name || 'Fan'}
                                onRemove={handleRefresh}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}