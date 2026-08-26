// ScheduleTab.jsx – только история посещаемости с модалкой
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useLazyGetAttendanceQuery,
  useCreateAttendanceMutation,
  useUpdateAttendanceMutation,
} from '../../../../store/services/attedance.api';
import {
  Typography,
  Spinner,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
} from '@material-tailwind/react';
import {
  Clock,
  CalendarDays,
  Check,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  History,
  User,
  BookOpen,
} from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';

const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'Keldi', icon: Check, color: 'bg-green-500/20 text-green-600' },
  { value: 'absent', label: 'Kelmadi', icon: X, color: 'bg-red-500/20 text-red-600' },
  { value: 'late', label: 'Kechikdi', icon: Clock, color: 'bg-amber-500/20 text-amber-600' },
];

const STATUS_MAP = {
  present: 'Keldi',
  absent: 'Kelmadi',
  late: 'Kechikdi',
};

const DAY_LABELS = {
  monday: 'Dushanba',
  tuesday: 'Seshanba',
  wednesday: 'Chorshanba',
  thursday: 'Payshanba',
  friday: 'Juma',
  saturday: 'Shanba',
  sunday: 'Yakshanba',
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function ScheduleTab({ groupId: groupIdProp, students = [] }) {
  const params = useParams();
  const groupId = groupIdProp || params.id;

  const [fetchHistory, { data, isLoading, error, refetch }] = useLazyGetAttendanceQuery();
  const [createAttendance] = useCreateAttendanceMutation();
  const [updateAttendance] = useUpdateAttendanceMutation();

  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(100);
  const [historyDateFrom, setHistoryDateFrom] = useState(
    formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  );
  const [historyDateTo, setHistoryDateTo] = useState(
    formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
  );
  const [localData, setLocalData] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalComment, setModalComment] = useState('');
  const [savingModal, setSavingModal] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchHistory({
        group_id: groupId,
        date_from: historyDateFrom,
        date_to: historyDateTo,
        page: historyPage,
        limit: historyLimit,
      });
    }
  }, [groupId, fetchHistory, historyDateFrom, historyDateTo, historyPage, historyLimit]);

  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const records = localData?.data?.records || [];
  const pagination = localData?.data?.pagination || {};
  const totalPages = pagination.total_pages || 1;
  const currentPage = pagination.currentPage || 1;
  const totalCount = pagination.total_count || 0;

  const allDates = useMemo(() => {
    const dates = [];
    let current = parseLocalDate(historyDateFrom);
    const end = parseLocalDate(historyDateTo);
    while (current <= end) {
      dates.push(formatLocalDate(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [historyDateFrom, historyDateTo]);

  const studentMap = useMemo(() => {
    const map = {};
    records.forEach(student => {
      const sid = student.student_id;
      map[sid] = { full_name: student.full_name, dates: {} };
      student.dates?.forEach(dateEntry => {
        const date = dateEntry.date;
        map[sid].dates[date] = [];
        dateEntry.subjects?.forEach(subj => {
          map[sid].dates[date].push({
            subject_id: subj.subject_id,
            name: subj.subject_name,
            status: subj.status,
            attendance_id: subj.attendance_id,
            group_schedule_id: subj.group_schedule_id,
            teacher_name: subj.teacher_name,
            comment: subj.comment || '',
          });
        });
      });
    });
    records.forEach(student => {
      const sid = student.student_id;
      allDates.forEach(date => {
        if (!map[sid].dates[date]) {
          map[sid].dates[date] = [];
        }
      });
    });
    return map;
  }, [records, allDates]);

  const historyStudents = records.length > 0
    ? records.map(r => ({ id: r.student_id, full_name: r.full_name }))
    : students.map(s => ({ id: s.id, full_name: s.full_name }));

  const openModal = (studentId, date, subjectIndex) => {
    const studentData = studentMap[studentId];
    if (!studentData) return;
    const subjects = studentData.dates[date] || [];
    if (subjectIndex >= subjects.length) return;
    const subject = subjects[subjectIndex];
    setSelectedSubject({
      studentId,
      studentName: studentData.full_name,
      date,
      subjectIndex,
      subjectName: subject.name,
      teacherName: subject.teacher_name,
      status: subject.status,
      attendanceId: subject.attendance_id,
      groupScheduleId: subject.group_schedule_id,
      comment: subject.comment || '',
    });
    setModalStatus(subject.status || '');
    setModalComment(subject.comment || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSubject(null);
    setModalStatus('');
    setModalComment('');
  };

  const handleSaveModal = async () => {
    if (!selectedSubject) return;
    setSavingModal(true);
    try {
      const { studentId, date, subjectIndex, attendanceId, groupScheduleId } = selectedSubject;
      let result;
      if (attendanceId) {
        result = await updateAttendance({
          id: attendanceId,
          data: { status: modalStatus, comment: modalComment },
        }).unwrap();
      } else {
        result = await createAttendance({
          student_id: studentId,
          group_schedule_id: groupScheduleId,
          date: date,
          status: modalStatus || 'present',
          comment: modalComment,
        }).unwrap();
      }
      setLocalData(prev => {
        if (!prev) return prev;
        const newData = { ...prev };
        const records = newData.data.records;
        for (const rec of records) {
          if (rec.student_id === studentId) {
            for (const d of rec.dates) {
              if (d.date === date) {
                const subj = d.subjects[subjectIndex];
                if (subj && subj.subject_id === selectedSubject.subjectId) {
                  subj.status = modalStatus;
                  subj.comment = modalComment;
                  if (!attendanceId && result?.id) {
                    subj.attendance_id = result.id;
                  }
                  break;
                }
              }
            }
            break;
          }
        }
        return newData;
      });
      Alert('Ma\'lumot saqlandi', 'success');
      closeModal();
    } catch (err) {
      Alert(err?.data?.message || 'Xatolik', 'error');
    } finally {
      setSavingModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        Xatolik: {error?.data?.message || "Noma'lum xatolik"}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent/10">
            <History className="text-accent" size={20} />
          </div>
          <div>
            <Typography variant="h5" className="text-text-primary font-semibold leading-tight">
              Davomat tarixi
            </Typography>
            <Typography className="text-text-secondary text-xs">
              Oylik davomat statistikasi
            </Typography>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Dan</label>
            <input
              type="date"
              value={historyDateFrom}
              onChange={(e) => {
                setHistoryDateFrom(e.target.value);
                setHistoryPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Gacha</label>
            <input
              type="date"
              value={historyDateTo}
              onChange={(e) => {
                setHistoryDateTo(e.target.value);
                setHistoryPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors text-sm"
            />
          </div>
          <button
            onClick={() => {
              setHistoryPage(1);
              fetchHistory({
                group_id: groupId,
                date_from: historyDateFrom,
                date_to: historyDateTo,
                page: 1,
                limit: historyLimit,
              });
            }}
            className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          >
            <RefreshCw size={14} /> Yangilash
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-input-bg/30 overflow-hidden shadow-md animate-in fade-in duration-300">
        <div className="p-5 overflow-x-auto">
          {historyStudents.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <Typography>O‘quvchilar topilmadi</Typography>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-text-primary border-collapse">
                <thead>
                  <tr className="bg-input-bg/50 border-b border-border">
                    <th className="px-3 py-2 text-left font-semibold text-text-secondary sticky left-0 bg-card z-10 shadow-sm min-w-[120px]">
                      O‘quvchi
                    </th>
                    {allDates.map((date) => {
                      const dayOfWeek = parseLocalDate(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                      const isSunday = dayOfWeek === 'sunday';
                      return (
                        <th
                          key={date}
                          className={`px-3 py-2 text-center font-semibold min-w-[140px] ${isSunday ? 'text-red-500 bg-red-50/10 rounded-[10px]' : 'text-text-secondary'}`}
                        >
                          {parseLocalDate(date).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })}
                          <span className="block text-[10px] font-normal text-text-secondary/70">
                            {DAY_LABELS[dayOfWeek]}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {historyStudents.map((student) => {
                    const studentData = studentMap[student.id];
                    if (!studentData) {
                      return (
                        <tr key={student.id} className="border-b border-border/40 hover:bg-input-bg/20 transition-colors">
                          <td className="px-3 py-2 font-medium text-text-primary sticky left-0 bg-card z-10 shadow-sm">
                            <Link
                              to={`/student/${student.id}`}
                              className="hover:text-accent hover:underline transition-colors"
                            >
                              {student.full_name}
                            </Link>
                          </td>
                          {allDates.map((date) => (
                            <td key={date} className="px-3 py-2 text-center text-text-secondary/50 text-xs">
                              —
                            </td>
                          ))}
                        </tr>
                      );
                    }
                    return (
                      <tr key={student.id} className="border-b border-border/40 hover:bg-input-bg/20 transition-colors">
                        <td className="px-3 py-2 font-medium text-text-primary sticky left-0 bg-card z-10 shadow-sm">
                          <Link
                            to={`/student/${student.id}`}
                            className="hover:text-accent hover:underline transition-colors"
                          >
                            {student.full_name}
                          </Link>
                        </td>
                        {allDates.map((date) => {
                          const subjects = studentData.dates[date] || [];
                          if (subjects.length === 0) {
                            return (
                              <td key={date} className="px-3 py-2 text-center text-text-secondary/50 text-xs">
                                —
                              </td>
                            );
                          }
                          return (
                            <td key={date} className="px-3 py-2">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {subjects.map((subject, idx) => {
                                  const status = subject.status;
                                  const colorClass = status === 'present' ? 'bg-green-500/20 text-green-600' :
                                                      status === 'absent' ? 'bg-red-500/20 text-red-600' :
                                                      status === 'late' ? 'bg-amber-500/20 text-amber-600' :
                                                      'bg-gray-500/10 text-text-secondary';
                                  const statusLabel = STATUS_MAP[status] || '—';
                                  return (
                                    <button
                                      key={`${subject.subject_id}-${idx}`}
                                      onClick={() => openModal(student.id, date, idx)}
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${colorClass} border border-transparent hover:border-accent transition-colors`}
                                      title={`${subject.name}: ${statusLabel}`}
                                      disabled={updating}
                                    >
                                      <span className="truncate max-w-[60px]">{idx+1}. {subject.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-text-secondary">
                Jami {totalCount} ta yozuv, {currentPage} / {totalPages} sahifa
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-accent/10 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setHistoryPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-accent/10 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модалка */}
      <Dialog
        open={modalOpen}
        handler={closeModal}
        size="md"
        className="bg-card text-text-primary border border-border"
      >
        {selectedSubject && (
          <>
            <DialogHeader className="text-text-primary flex flex-wrap items-center justify-between gap-3">
              <div>
                <Typography variant="h5" className="font-bold">
                  {selectedSubject.subjectName}
                </Typography>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-text-secondary">
                  <span className="flex items-center gap-1">
                    <User size={14} /> {selectedSubject.teacherName || 'Noma\'lum o‘qituvchi'}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays size={14} /> {parseLocalDate(selectedSubject.date).toLocaleDateString('uz-UZ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} /> O‘quvchi:{' '}
                    <Link
                      to={`/student/${selectedSubject.studentId}`}
                      className="hover:text-accent hover:underline transition-colors font-medium"
                    >
                      {selectedSubject.studentName}
                    </Link>
                  </span>
                </div>
              </div>
            </DialogHeader>
            <DialogBody>
              <div className="space-y-4">
                <div>
                  <Typography className="text-text-secondary text-sm font-medium mb-2">Holat</Typography>
                  <div className="flex flex-wrap gap-2">
                    {ATTENDANCE_OPTIONS.map(opt => {
                      const active = modalStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setModalStatus(opt.value)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                            active
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-border/40 bg-input-bg/40 text-text-secondary hover:border-accent/50'
                          }`}
                        >
                          <opt.icon size={16} className={active ? 'text-accent' : 'text-text-secondary'} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-2">Izoh</label>
                  <textarea
                    value={modalComment}
                    onChange={(e) => setModalComment(e.target.value)}
                    rows="3"
                    placeholder="Qo‘shimcha ma'lumot..."
                    className="w-full px-4 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
                {selectedSubject.status && (
                  <div className="text-xs text-text-secondary">
                    Joriy holat: <span className={`font-medium ${
                      selectedSubject.status === 'present' ? 'text-green-600' :
                      selectedSubject.status === 'absent' ? 'text-red-600' :
                      'text-amber-600'
                    }`}>{STATUS_MAP[selectedSubject.status]}</span>
                  </div>
                )}
              </div>
            </DialogBody>
            <DialogFooter className="gap-2">
              <Button
                variant="text"
                className="text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                onClick={closeModal}
                disabled={savingModal}
              >
                Bekor qilish
              </Button>
              <Button
                className="bg-accent hover:bg-accent-hover text-white transition-colors flex items-center gap-2"
                onClick={handleSaveModal}
                loading={savingModal}
                disabled={savingModal}
              >
                <Check size={16} /> Saqlash
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}