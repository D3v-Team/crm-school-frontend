// ScheduleTab.jsx
import React, { useMemo } from 'react';
import { CalendarDays, Clock, User, BookOpen, Trash2, CalendarCheck2 } from 'lucide-react';
import { Typography } from '@material-tailwind/react';

// Порядок дней недели (пн-сб)
const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = {
  monday: 'Dushanba',
  tuesday: 'Seshanba',
  wednesday: 'Chorshanba',
  thursday: 'Payshanba',
  friday: 'Juma',
  saturday: 'Shanba',
};
const DAY_SHORT = {
  monday: 'DU',
  tuesday: 'SE',
  wednesday: 'CH',
  thursday: 'PA',
  friday: 'JU',
  saturday: 'SH',
};
// JS getDay(): 0=Sunday..6=Saturday — map onto our Mon-Sat keys
const JS_DAY_TO_KEY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Цветовая палитра для предметов (по subject_id) — точка + чип времени
const PALETTE = [
  { dot: 'bg-sky-500', chip: 'bg-sky-500/10 text-sky-600' },
  { dot: 'bg-violet-500', chip: 'bg-violet-500/10 text-violet-600' },
  { dot: 'bg-amber-500', chip: 'bg-amber-500/10 text-amber-600' },
  { dot: 'bg-emerald-500', chip: 'bg-emerald-500/10 text-emerald-600' },
  { dot: 'bg-rose-500', chip: 'bg-rose-500/10 text-rose-600' },
  { dot: 'bg-cyan-500', chip: 'bg-cyan-500/10 text-cyan-600' },
];
const colorFor = (id) => {
  if (!id) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % PALETTE.length;
  return PALETTE[hash];
};

export default function ScheduleTab({ user, onRemove }) {
  const schedules = user?.group_schedules || [];
  const today = JS_DAY_TO_KEY[new Date().getDay()];

  // Строим карту предметов для быстрого доступа по subject_id
  const subjectsMap = useMemo(() => {
    const map = {};
    (user?.teacher_subjects || []).forEach((sub) => {
      map[sub.subject_id] = sub.name;
    });
    return map;
  }, [user]);

  // Строим карту учителей для быстрого доступа по teacher_id
  const teachersMap = useMemo(() => {
    const map = {};
    (user?.teacher_groups || []).forEach((tg) => {
      if (tg.teacher) {
        map[tg.teacher_id] = tg.teacher.full_name;
      }
    });
    return map;
  }, [user]);

  // Группируем занятия по дням
  const grouped = useMemo(() => {
    const map = {};
    schedules.forEach((item) => {
      const day = item.day_of_week;
      if (!map[day]) map[day] = [];
      map[day].push(item);
    });
    Object.keys(map).forEach((day) => {
      map[day].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    });
    return map;
  }, [schedules]);

  const hasSchedule = schedules.length > 0;

  // Форматирует время (обрезает секунды)
  const formatTime = (time) => (time ? time.slice(0, 5) : '—');

  if (!hasSchedule) {
    return (
      <div className="p-8 text-text-secondary bg-card rounded-xl border border-dashed border-border/60 text-center">
        <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <Typography className="text-sm">Jadvallar mavjud emas</Typography>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
          <CalendarDays size={18} className="text-accent" />
        </div>
        <div>
          <Typography variant="h6" className="text-text-primary font-semibold leading-tight">
            Dars jadvali
          </Typography>
          <Typography className="text-text-secondary text-xs">Haftalik taqsimot</Typography>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DAYS_ORDER.map((day) => {
          const items = grouped[day] || [];
          const isEmpty = items.length === 0;
          const isToday = day === today;

          return (
            <div
              key={day}
              className={`rounded-xl overflow-hidden border bg-card transition-shadow duration-200 ${
                isToday
                  ? 'border-accent/40 ring-1 ring-accent/15 shadow-sm'
                  : isEmpty
                  ? 'border-dashed border-border/50'
                  : 'border-border/50 shadow-sm'
              }`}
            >
              <div
                className={`px-4 py-2.5 border-b flex items-center gap-2 ${
                  isToday ? 'border-accent/20 bg-accent/[0.06]' : 'border-border/40'
                }`}
              >
                <span
                  className={`w-7 h-7 flex items-center justify-center shrink-0 rounded-md text-[11px] font-bold ${
                    isToday ? 'bg-accent text-white' : 'bg-input-bg text-text-secondary'
                  }`}
                >
                  {DAY_SHORT[day]}
                </span>
                <Typography className="text-text-primary font-semibold text-sm truncate">
                  {DAY_LABELS[day]}
                </Typography>
                {isToday && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full shrink-0">
                    <CalendarCheck2 size={10} /> Bugun
                  </span>
                )}
                {!isEmpty && !isToday && (
                  <span className="text-[11px] text-text-secondary bg-input-bg px-1.5 py-0.5 rounded-full shrink-0 ml-auto">
                    {items.length}
                  </span>
                )}
              </div>

              {isEmpty ? (
                <div className="py-7 flex flex-col items-center justify-center gap-1.5 text-text-secondary/40">
                  <span className="text-xs">Dars yo'q</span>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {items.map((item) => {
                    const subjectName = subjectsMap[item.subject_id] || item.subject_id?.slice(0, 8);
                    const teacherName = teachersMap[item.teacher_id] || item.teacher_id?.slice(0, 8);
                    const color = colorFor(item.subject_id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-2 px-4 py-3 group"
                      >
                        <div className="flex gap-2.5 min-w-0">
                          <span className={`w-1 rounded-full mt-0.5 self-stretch shrink-0 ${color.dot}`} />
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <span className={`inline-flex w-fit items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${color.chip}`}>
                              <Clock size={11} />
                              {formatTime(item.start_time)}–{formatTime(item.end_time)}
                            </span>
                            <span className="flex items-center gap-1 text-text-primary font-medium text-sm truncate">
                              <BookOpen size={12} className="text-text-secondary shrink-0" />
                              {subjectName}
                            </span>
                            {teacherName && (
                              <span className="flex items-center gap-1 text-text-secondary text-xs truncate">
                                <User size={12} className="shrink-0" />
                                <span className="truncate">{teacherName}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        {onRemove && (
                          <button
                            onClick={() => onRemove(item.id)}
                            className="text-text-secondary/30 hover:text-red-500 hover:bg-red-500/10 rounded-md p-1 transition-colors shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="O'chirish"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}