// ScheduleTab.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, Clock, BookOpen, Users } from 'lucide-react';
import { Typography } from '@material-tailwind/react';
import { useLazyGetScheduleByTeacherQuery } from '../../../../../store/services/group-schedule.api';
import Loading from '../../../../Other/UI/Loadings/Loading';

const DAY_LABELS = {
    monday:    'Dushanba',
    tuesday:   'Seshanba',
    wednesday: 'Chorshanba',
    thursday:  'Payshanba',
    friday:    'Juma',
    saturday:  'Shanba',
    sunday:    'Yakshanba',
};

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Returns current week's monday date as YYYY-MM-DD
function getThisMonday() {
    const today = new Date();
    const day = today.getDay(); // 0=Sun, 1=Mon ...
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday.toISOString().slice(0, 10);
}

export default function ScheduleTab() {
    const { id } = useParams();
    const [selectedDate, setSelectedDate] = useState(getThisMonday);
    const [trigger, { data, isLoading, error }] = useLazyGetScheduleByTeacherQuery();

    useEffect(() => {
        if (id && selectedDate) {
            trigger({ teacher_id: id, date: selectedDate });
        }
    }, [id, selectedDate, trigger]);

    const schedules = data?.data || [];

    // Group by day_of_week, sorted by DAY_ORDER
    const grouped = DAY_ORDER.reduce((acc, day) => {
        const items = schedules
            .filter((s) => s.day_of_week === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
        if (items.length > 0) acc[day] = items;
        return acc;
    }, {});

    const hasDays = Object.keys(grouped).length > 0;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-accent" />
                    <Typography variant="h6" className="text-text-primary font-semibold">
                        Dars jadvali
                    </Typography>
                </div>
                <div className="flex items-center gap-2">
                    <Typography className="text-text-secondary text-sm">Hafta sanasi:</Typography>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-input-bg border border-border text-text-primary rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
                    />
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <Loading />
            ) : error ? (
                <div className="text-red-500 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    Xatolik: {error?.data?.message || "Ma'lumot yuklanmadi"}
                </div>
            ) : !hasDays ? (
                <div className="flex flex-col items-center justify-center py-14 text-center bg-input-bg/30 rounded-xl border border-border/40">
                    <CalendarDays className="w-16 h-16 text-text-secondary/30 mb-3" />
                    <Typography className="text-text-secondary text-base font-medium">
                        Bu hafta uchun dars jadvali mavjud emas
                    </Typography>
                    <Typography className="text-text-secondary text-sm mt-1">
                        Boshqa haftani tanlang
                    </Typography>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {Object.entries(grouped).map(([day, lessons]) => (
                        <div key={day}>
                            {/* Day label */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-px flex-1 bg-border/40" />
                                <span className="text-xs font-semibold text-accent uppercase tracking-wider px-2">
                                    {DAY_LABELS[day]}
                                </span>
                                <div className="h-px flex-1 bg-border/40" />
                            </div>

                            {/* Lessons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {lessons.map((lesson) => (
                                    <div
                                        key={lesson.id}
                                        className="p-4 rounded-xl bg-input-bg/40 border border-border/40 hover:border-accent/40 hover:shadow-md transition-all duration-200"
                                    >
                                        {/* Time */}
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Clock className="w-4 h-4 text-accent" />
                                            <span className="text-accent font-semibold text-sm">
                                                {lesson.start_time?.slice(0, 5)} – {lesson.end_time?.slice(0, 5)}
                                            </span>
                                        </div>

                                        {/* Subject */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <BookOpen className="w-4 h-4 text-text-secondary flex-shrink-0" />
                                            <Typography className="text-text-primary font-medium text-sm">
                                                {lesson.subject?.name || '—'}
                                            </Typography>
                                        </div>

                                        {/* Group */}
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-text-secondary flex-shrink-0" />
                                            <Typography className="text-text-secondary text-xs">
                                                {lesson.group?.name || '—'}
                                                {lesson.group?.start_date && (
                                                    <span className="ml-1 opacity-60">
                                                        ({new Date(lesson.group.start_date).toLocaleDateString('uz-UZ')})
                                                    </span>
                                                )}
                                            </Typography>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
