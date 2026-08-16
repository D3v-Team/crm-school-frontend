// TopicsTab.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ListChecks, CalendarDays, ChevronLeft, ChevronRight, BookOpen, Users, Calendar } from 'lucide-react';
import { Typography } from '@material-tailwind/react';
import { useLazyGetWeeklyTopicsQuery } from '../../../../../store/services/weekly-topic.api';
import Loading from '../../../../Other/UI/Loadings/Loading';

// Returns monday of current week + offset weeks as YYYY-MM-DD
function getThisMonday(offset = 0) {
    const today = new Date();
    const day = today.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + offset * 7);
    return monday.toISOString().slice(0, 10);
}

function formatWeekRange(mondayStr) {
    const monday = new Date(mondayStr);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d) =>
        d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${fmt(monday)} – ${fmt(sunday)}`;
}

export default function TopicsTab() {
    const { id: teacher_id } = useParams();
    const [weekOffset, setWeekOffset] = useState(0);
    const [page, setPage] = useState(1);
    const weekStartDate = getThisMonday(weekOffset);

    const [trigger, { data, isLoading, isFetching, error }] = useLazyGetWeeklyTopicsQuery();

    // Reset to page 1 when week changes
    useEffect(() => {
        setPage(1);
    }, [weekOffset]);

    useEffect(() => {
        if (teacher_id) {
            trigger({ teacher_id, week_start_date: weekStartDate, page });
        }
    }, [teacher_id, weekStartDate, page, trigger]);

    const records = data?.data?.records || [];
    const totalCount = data?.data?.pagination?.total_count ?? records.length;
    const totalPages = data?.data?.pagination?.total_pages ?? 1;

    const goBack = () => setWeekOffset((o) => o - 1);
    const goForward = () => setWeekOffset((o) => o + 1);
    const goToday = () => { setWeekOffset(0); setPage(1); };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-accent" />
                    <Typography variant="h6" className="text-text-primary font-semibold">
                        Haftalik mavzular
                    </Typography>
                    {!isLoading && !isFetching && (
                        <span className="text-xs text-text-secondary bg-input-bg/60 border border-border/40 rounded-full px-2 py-0.5">
                            {totalCount} ta
                        </span>
                    )}
                </div>

                {/* Week navigator */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goBack}
                        className="p-1.5 rounded-lg border border-border/60 text-text-secondary hover:text-accent hover:border-accent/50 transition-all"
                        title="Oldingi hafta"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-input-bg/50 border border-border/50 min-w-[190px] justify-center">
                        <CalendarDays size={14} className="text-accent flex-shrink-0" />
                        <span className="text-text-primary text-xs font-medium">
                            {formatWeekRange(weekStartDate)}
                        </span>
                    </div>

                    <button
                        onClick={goForward}
                        className="p-1.5 rounded-lg border border-border/60 text-text-secondary hover:text-accent hover:border-accent/50 transition-all"
                        title="Keyingi hafta"
                    >
                        <ChevronRight size={16} />
                    </button>

                    {weekOffset !== 0 && (
                        <button
                            onClick={goToday}
                            className="text-xs text-accent border border-accent/40 rounded-lg px-2.5 py-1.5 hover:bg-accent/10 transition-all"
                        >
                            Joriy hafta
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            {isLoading || isFetching ? (
                <Loading />
            ) : error ? (
                <div className="text-red-500 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    Xatolik: {error?.data?.message || "Ma'lumot yuklanmadi"}
                </div>
            ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center bg-input-bg/30 rounded-xl border border-border/40">
                    <ListChecks className="w-16 h-16 text-text-secondary/30 mb-3" />
                    <Typography className="text-text-secondary text-base font-medium">
                        Bu hafta uchun mavzular topilmadi
                    </Typography>
                    <Typography className="text-text-secondary text-sm mt-1">
                        Boshqa haftani tanlang
                    </Typography>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {records.map((topic) => (
                            <div
                                key={topic.id}
                                className="p-4 rounded-xl bg-input-bg/40 border border-border/40 hover:border-accent/40 hover:shadow-md transition-all duration-200 flex flex-col gap-2"
                            >
                                {/* Topic */}
                                <div className="flex items-start gap-2">
                                    <BookOpen className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                    <Typography className="text-text-primary font-semibold text-sm leading-snug">
                                        {topic.topic || 'Mavzu'}
                                    </Typography>
                                </div>

                                <div className="flex flex-col gap-1.5 pl-6">
                                    {/* Group */}
                                    {topic.group?.name && (
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                                            <span className="text-text-secondary text-xs">{topic.group.name}</span>
                                        </div>
                                    )}

                                    {/* Subject */}
                                    {topic.subject?.name && (
                                        <div className="flex items-center gap-1.5">
                                            <ListChecks className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                                            <span className="text-text-secondary text-xs">{topic.subject.name}</span>
                                        </div>
                                    )}

                                    {/* Week start date */}
                                    {topic.week_start_date && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                                            <span className="text-text-secondary text-xs">
                                                {new Date(topic.week_start_date).toLocaleDateString('uz-UZ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-5">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-lg border border-border/60 text-text-secondary hover:text-accent hover:border-accent/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <span className="text-text-secondary text-sm px-2">
                                {page} / {totalPages}
                            </span>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-lg border border-border/60 text-text-secondary hover:text-accent hover:border-accent/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
