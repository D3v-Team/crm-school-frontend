// ScheduleTab.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useLazyGetGroupScheduleByGroupIdQuery,
  useDeleteGroupScheduleMutation,
  useCreateGroupScheduleMutation,
} from '../../../../store/services/group-schedule.api';
import { useGetSubjectsQuery } from '../../../../store/services/subject.api';
import { useLazyGetUsersQuery } from '../../../../store/services/user.api';
import {
  Typography,
  Spinner,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Select,
  Option,
} from '@material-tailwind/react';
import { Clock, User, BookOpen, Trash2, Plus, CalendarDays, Users, Hourglass, CalendarCheck2 } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';

// Sunday intentionally excluded — 6-day school week
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

const EMPTY_FORM = {
  subject_id: '',
  teacher_id: '',
  day_of_week: 'monday',
  start_time: '',
  end_time: '',
};

// stable accent per subject, purely visual grouping — used for the dot + time chip
const PALETTE = [
  { dot: 'bg-sky-500', chip: 'bg-sky-500/10 text-sky-600', ring: 'ring-sky-500/20' },
  { dot: 'bg-violet-500', chip: 'bg-violet-500/10 text-violet-600', ring: 'ring-violet-500/20' },
  { dot: 'bg-amber-500', chip: 'bg-amber-500/10 text-amber-600', ring: 'ring-amber-500/20' },
  { dot: 'bg-emerald-500', chip: 'bg-emerald-500/10 text-emerald-600', ring: 'ring-emerald-500/20' },
  { dot: 'bg-rose-500', chip: 'bg-rose-500/10 text-rose-600', ring: 'ring-rose-500/20' },
  { dot: 'bg-cyan-500', chip: 'bg-cyan-500/10 text-cyan-600', ring: 'ring-cyan-500/20' },
];
const colorFor = (id) => {
  if (!id) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % PALETTE.length;
  return PALETTE[hash];
};

const toMinutes = (t) => {
  const [h, m] = (t || '0:0').split(':').map(Number);
  return h * 60 + m;
};

const groupByDay = (records) => {
  const grouped = records
    .filter((item) => item.day_of_week !== 'sunday')
    .reduce((acc, item) => {
      const day = item.day_of_week;
      if (!acc[day]) acc[day] = [];
      acc[day].push(item);
      return acc;
    }, {});
  Object.values(grouped).forEach((list) => list.sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time)));
  return grouped;
};

export default function ScheduleTab({ groupId: groupIdProp }) {
  const params = useParams();
  const groupId = groupIdProp || params.id;
  const today = JS_DAY_TO_KEY[new Date().getDay()];

  const [trigger, { data, isLoading, error, refetch }] = useLazyGetGroupScheduleByGroupIdQuery();
  const [deleteSchedule, { isLoading: isDeleting }] = useDeleteGroupScheduleMutation();
  const { data: subjectsData, isLoading: subjectsLoading } = useGetSubjectsQuery({ limit: 100 });
  const [fetchTeachers, { data: teachersData, isLoading: teachersLoading }] = useLazyGetUsersQuery();
  const [createSchedule, { isLoading: isCreating }] = useCreateGroupScheduleMutation();

  // scheduleMap is the single source of truth rendered on screen. It's kept
  // in local state (instead of deriving straight from `data` on every
  // render) so create/delete can update it optimistically — the row
  // appears/disappears immediately instead of waiting for a refetch
  // round-trip to land.
  const [scheduleMap, setScheduleMap] = useState({});
  const [subjectsMap, setSubjectsMap] = useState({});
  const [teachersMap, setTeachersMap] = useState({});
  const subjects = subjectsData?.data?.records || [];
  const teachers = teachersData?.data?.records || [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (groupId) trigger(groupId);
  }, [groupId, trigger]);

  useEffect(() => {
    if (groupId) fetchTeachers({ role: 'teacher', limit: 100 });
  }, [groupId, fetchTeachers]);

  useEffect(() => {
    if (subjectsData) {
      const records = subjectsData?.data?.records || [];
      setSubjectsMap(records.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {}));
    }
  }, [subjectsData]);

  useEffect(() => {
    if (teachersData) {
      const records = teachersData?.data?.records || [];
      setTeachersMap(records.reduce((acc, t) => ({ ...acc, [t.id]: t.full_name }), {}));
    }
  }, [teachersData]);

  useEffect(() => {
    if (data) {
      const records = data?.data || data || [];
      setScheduleMap(groupByDay(records));
    }
  }, [data]);

  const stats = useMemo(() => {
    const all = Object.values(scheduleMap).flat();
    const totalMinutes = all.reduce((sum, i) => sum + Math.max(0, toMinutes(i.end_time) - toMinutes(i.start_time)), 0);
    const teacherCount = new Set(all.map((i) => i.teacher_id)).size;
    return {
      count: all.length,
      hours: Math.round((totalMinutes / 60) * 10) / 10,
      teacherCount,
    };
  }, [scheduleMap]);

  const handleDelete = async (item) => {
    if (isDeleting) return;
    const subjectName = subjectsMap[item.subject_id] || 'Dars';
    const day = item.day_of_week;

    // optimistic: remove instantly, roll back if the API call fails
    setScheduleMap((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((i) => i.id !== item.id),
    }));

    try {
      await deleteSchedule(item.id).unwrap();
    } catch (err) {
      // rollback
      setScheduleMap((prev) => {
        const list = [...(prev[day] || []), item].sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
        return { ...prev, [day]: list };
      });
      Alert(err?.data?.message || 'Xatolik yuz berdi', 'error');
      return;
    }

    Alert(`"${subjectName}" darsi o'chirildi`, 'success');
    // background sync — re-run GET with the groupId using the lazy trigger
    trigger(groupId).catch(() => {});
  };

  const handleOpen = (day) => {
    setForm({ ...EMPTY_FORM, day_of_week: day || 'monday' });
    setErrors({});
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setErrors({});
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.subject_id) newErrors.subject_id = 'Fan tanlanishi kerak';
    if (!form.teacher_id) newErrors.teacher_id = "O'qituvchi tanlanishi kerak";
    if (!form.day_of_week) newErrors.day_of_week = 'Kun tanlanishi kerak';
    if (!form.start_time) newErrors.start_time = 'Boshlanish vaqti majburiy';
    if (!form.end_time) newErrors.end_time = 'Tugash vaqti majburiy';
    if (form.start_time && form.end_time && form.start_time >= form.end_time) {
      newErrors.end_time = "Tugash vaqti boshlanish vaqtidan kechroq bo'lishi kerak";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // IMPORTANT: only the createSchedule call is allowed to trigger the error
  // path. Anything that runs after a confirmed success (local insert,
  // refetch, closing the dialog) is isolated so it can never flip a
  // successful create into an error alert.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Optimistic insert: add a temporary row so the UI updates immediately
    const tempId = `temp-${Date.now()}`;
    const tempItem = { id: tempId, group_id: groupId, ...form };

    setScheduleMap((prev) => {
      const list = [...(prev[form.day_of_week] || []), tempItem].sort(
        (a, b) => toMinutes(a.start_time) - toMinutes(b.start_time)
      );
      return { ...prev, [form.day_of_week]: list };
    });

    // close dialog immediately for snappy UX
    handleClose();

    try {
      const created = await createSchedule({ group_id: groupId, ...form }).unwrap();
      const saved = created?.data || created || null;

      if (saved) {
        // ensure id and day fields
        const finalItem = { ...saved, id: saved.id || tempId, day_of_week: saved.day_of_week || form.day_of_week };
        // replace temp row with saved row
        setScheduleMap((prev) => {
          const day = finalItem.day_of_week || form.day_of_week;
          const list = (prev[day] || []).map((it) => (it.id === tempId ? finalItem : it));
          // if temp wasn't present for some reason, append
          if (!list.some((it) => it.id === finalItem.id)) list.push(finalItem);
          list.sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
          return { ...prev, [day]: list };
        });
      }

      Alert("Dars jadvaliga muvaffaqiyatli qo'shildi", 'success');
      // background sync — re-run GET with the groupId using the lazy trigger
      trigger(groupId).catch(() => {});
    } catch (err) {
      // remove temp row on failure
      setScheduleMap((prev) => {
        const day = form.day_of_week;
        return { ...prev, [day]: (prev[day] || []).filter((i) => i.id !== tempId) };
      });
      const msg = err?.data?.message || 'Xatolik yuz berdi';
      Alert(msg, 'error');
      setErrors({ api: msg });
    }
  };

  const fieldClass = (field) =>
    `w-full px-3.5 py-2.5 rounded-lg border bg-input-bg text-input-text text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 transition-colors ${
      errors[field] ? 'border-red-500' : 'border-input-border'
    }`;

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 text-sm p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
          <span className="text-red-500 font-bold">!</span>
        </div>
        <div>
          <p className="text-red-500 font-medium">Jadvalni yuklab bo'lmadi</p>
          <p className="text-red-500/70 text-xs mt-0.5">{error?.data?.message || "Noma'lum xatolik"}</p>
          <button onClick={() => refetch()} className="text-red-500 text-xs font-medium underline mt-2">
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <CalendarDays className="text-accent" size={20} />
          </div>
          <div>
            <Typography variant="h5" className="text-text-primary font-semibold leading-tight">
              Dars jadvali
            </Typography>
            <Typography className="text-text-secondary text-xs">
              Haftalik dars taqsimoti
            </Typography>
          </div>
        </div>
        <Button
          className="bg-accent hover:bg-accent-hover text-white transition-colors flex items-center gap-2 shadow-sm normal-case rounded-xl"
          onClick={() => handleOpen()}
        >
          <Plus size={16} /> Dars qo'shish
        </Button>
      </div>

      {/* Stats */}
      {stats.count > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/50">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <BookOpen size={16} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <Typography className="text-text-primary font-semibold leading-none">{stats.count}</Typography>
              <Typography className="text-text-secondary text-xs mt-1">dars / hafta</Typography>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/50">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Hourglass size={16} className="text-amber-500" />
            </div>
            <div className="min-w-0">
              <Typography className="text-text-primary font-semibold leading-none">{stats.hours} soat</Typography>
              <Typography className="text-text-secondary text-xs mt-1">umumiy yuklama</Typography>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/50">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Users size={16} className="text-emerald-500" />
            </div>
            <div className="min-w-0">
              <Typography className="text-text-primary font-semibold leading-none">{stats.teacherCount}</Typography>
              <Typography className="text-text-secondary text-xs mt-1">o'qituvchi</Typography>
            </div>
          </div>
        </div>
      )}

      {/* Weekly grid — Mon–Sat */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DAYS_ORDER.map((day) => {
          const items = scheduleMap[day] || [];
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
                  : 'border-border/50 shadow-sm hover:shadow-md'
              }`}
            >
              <div
                className={`px-4 py-2.5 border-b flex items-center justify-between ${
                  isToday ? 'border-accent/20 bg-accent/[0.06]' : 'border-border/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
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
                    <span className="text-[11px] text-text-secondary bg-input-bg px-1.5 py-0.5 rounded-full shrink-0">
                      {items.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleOpen(day)}
                  className="text-text-secondary/50 hover:text-accent hover:bg-accent/10 rounded-md p-1 transition-colors shrink-0"
                  title={`${DAY_LABELS[day]} kuniga dars qo'shish`}
                >
                  <Plus size={15} />
                </button>
              </div>

              {isEmpty ? (
                <button
                  onClick={() => handleOpen(day)}
                  className="w-full py-7 flex flex-col items-center justify-center gap-1.5 text-text-secondary/40 hover:text-accent hover:bg-accent/5 transition-colors"
                >
                  <Plus size={18} />
                  <span className="text-xs">Dars qo'shish</span>
                </button>
              ) : (
                <div className="divide-y divide-border/30">
                  {items.map((item) => {
                    const color = colorFor(item.subject_id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-2 px-4 py-3 hover:bg-input-bg/30 transition-colors group animate-in fade-in duration-200"
                      >
                        <div className="flex gap-2.5 min-w-0">
                          <span className={`w-1 rounded-full mt-0.5 self-stretch shrink-0 ${color.dot}`} />
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <span className={`inline-flex w-fit items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${color.chip}`}>
                              <Clock size={11} />
                              {item.start_time}–{item.end_time}
                            </span>
                            <span className="text-text-primary font-medium text-sm truncate">
                              {subjectsMap[item.subject_id] || item.subject_id?.slice(0, 8)}
                            </span>
                            <span className="flex items-center gap-1 text-text-secondary text-xs truncate">
                              <User size={12} className="shrink-0" />
                              <span className="truncate">
                                {teachersMap[item.teacher_id] || item.teacher_id?.slice(0, 8)}
                              </span>
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={isDeleting}
                          className="text-text-secondary/30 hover:text-red-500 hover:bg-red-500/10 rounded-md p-1 transition-colors disabled:opacity-50 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="O'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog
        open={open}
        handler={handleClose}
        size="sm"
        className="bg-card text-text-primary border border-border rounded-2xl"
      >
        <DialogHeader className="text-text-primary border-b border-border/50 pb-4">
          Yangi dars qo'shish
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pt-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Fan</label>
              <Select
                value={form.subject_id || undefined}
                onChange={(val) => setForm((prev) => ({ ...prev, subject_id: val }))}
                disabled={subjectsLoading}
                label={subjectsLoading ? 'Yuklanmoqda...' : 'Fanni tanlang'}
                className="!bg-input-bg !border-input-border text-input-text"
                labelProps={{ className: 'text-text-secondary' }}
                error={!!errors.subject_id}
              >
                {subjects.length === 0 ? (
                  <Option disabled>Fanlar topilmadi</Option>
                ) : (
                  subjects.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name}
                    </Option>
                  ))
                )}
              </Select>
              {errors.subject_id && <p className="text-red-500 text-xs mt-1">{errors.subject_id}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">O'qituvchi</label>
              <Select
                value={form.teacher_id || undefined}
                onChange={(val) => setForm((prev) => ({ ...prev, teacher_id: val }))}
                disabled={teachersLoading}
                label={teachersLoading ? 'Yuklanmoqda...' : "O'qituvchini tanlang"}
                className="!bg-input-bg !border-input-border text-input-text"
                labelProps={{ className: 'text-text-secondary' }}
                error={!!errors.teacher_id}
              >
                {teachers.length === 0 ? (
                  <Option disabled>O'qituvchilar topilmadi</Option>
                ) : (
                  teachers.map((t) => (
                    <Option key={t.id} value={t.id}>
                      {t.full_name}
                    </Option>
                  ))
                )}
              </Select>
              {errors.teacher_id && <p className="text-red-500 text-xs mt-1">{errors.teacher_id}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Kun</label>
              <div className="grid grid-cols-3 gap-2">
                {DAYS_ORDER.map((d) => {
                  const active = form.day_of_week === d;
                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setForm((prev) => ({ ...prev, day_of_week: d }))}
                      className={`py-2 rounded-lg border text-xs font-semibold transition-colors ${
                        active
                          ? 'border-accent bg-accent text-white'
                          : 'border-input-border bg-input-bg text-text-secondary hover:border-accent/50'
                      }`}
                    >
                      {DAY_SHORT[d]}
                    </button>
                  );
                })}
              </div>
              {errors.day_of_week && <p className="text-red-500 text-xs mt-1">{errors.day_of_week}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Boshlanish vaqti</label>
                <input
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                  className={fieldClass('start_time')}
                />
                {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Tugash vaqti</label>
                <input
                  type="time"
                  name="end_time"
                  value={form.end_time}
                  onChange={handleChange}
                  className={fieldClass('end_time')}
                />
                {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time}</p>}
              </div>
            </div>

            {errors.api && (
              <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {errors.api}
              </p>
            )}
          </DialogBody>

          <DialogFooter className="gap-2 border-t border-border/50 pt-4">
            <Button
              variant="text"
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors normal-case rounded-xl"
              onClick={handleClose}
              disabled={isCreating}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent-hover text-white transition-colors normal-case rounded-xl"
              loading={isCreating}
              disabled={isCreating}
            >
              Qo'shish
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}