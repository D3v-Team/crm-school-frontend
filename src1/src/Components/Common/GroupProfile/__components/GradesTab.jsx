// GradesTab.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useLazyGetGradesQuery,
  useCreateGradeMutation,
  useUpdateGradeMutation,
} from '../../../../store/services/grades.api';
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
  CalendarDays,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  History,
  User,
  BookOpen,
  Clock,
  Check,
} from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';

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

// Цвет оценки в зависимости от процента
const getScoreColor = (score) => {
  if (score === null || score === undefined) return 'bg-gray-500/10 text-text-secondary';
  if (score >= 80) return 'bg-green-500/20 text-green-600';
  if (score >= 60) return 'bg-amber-500/20 text-amber-600';
  return 'bg-red-500/20 text-red-600';
};

export default function GradesTab() {
  const { id: groupId } = useParams();

  const [fetchGrades, { data, isLoading, error, refetch }] = useLazyGetGradesQuery();
  const [createGrade] = useCreateGradeMutation();
  const [updateGrade] = useUpdateGradeMutation();

  const [page, setPage] = useState(1);
  const [limit] = useState(100);

  const [dateFrom, setDateFrom] = useState(
    formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  );
  const [dateTo, setDateTo] = useState(
    formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
  );
  const [localData, setLocalData] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [modalScore, setModalScore] = useState('');
  const [modalComment, setModalComment] = useState('');
  const [savingModal, setSavingModal] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGrades({
        group_id: groupId,
        date_from: dateFrom,
        date_to: dateTo,
        page,
        limit,
      });
    }
  }, [groupId, fetchGrades, dateFrom, dateTo, page, limit]);

  useEffect(() => {
    if (data) setLocalData(data);
  }, [data]);

  const records = localData?.data?.records || [];
  const pagination = localData?.data?.pagination || {};
  const totalPages = pagination.total_pages || 1;
  const currentPage = pagination.currentPage || 1;
  const totalCount = pagination.total_count || 0;

  const allDates = useMemo(() => {
    const dates = [];
    let current = parseLocalDate(dateFrom);
    const end = parseLocalDate(dateTo);
    while (current <= end) {
      dates.push(formatLocalDate(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [dateFrom, dateTo]);

  const studentMap = useMemo(() => {
    const map = {};
    records.forEach((student) => {
      const sid = student.student_id;
      if (!sid) return;
      if (!map[sid]) {
        map[sid] = { full_name: student.full_name || 'Noma\'lum', dates: {} };
      }
      student.dates?.forEach(dateEntry => {
        const date = dateEntry.date;
        if (!date) return;
        if (!map[sid].dates[date]) {
          map[sid].dates[date] = [];
        }
        dateEntry.subjects?.forEach(subj => {
          map[sid].dates[date].push({
            subject_name: subj.subject_name || 'Noma\'lum fan',
            score: subj.score,
            grade_id: subj.grade_id,
            comment: subj.comment || '',
            group_schedule_id: subj.group_schedule_id,
          });
        });
      });
    });
    Object.values(map).forEach(student => {
      allDates.forEach(date => {
        if (!student.dates[date]) {
          student.dates[date] = [];
        }
      });
    });
    return map;
  }, [records, allDates]);

  const studentsList = useMemo(() => {
    return Object.entries(studentMap).map(([id, data]) => ({
      id,
      full_name: data.full_name,
    }));
  }, [studentMap]);

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
      subjectName: subject.subject_name,
      score: subject.score,
      gradeId: subject.grade_id,
      groupScheduleId: subject.group_schedule_id,
      comment: subject.comment || '',
    });
    setModalScore(subject.score !== undefined && subject.score !== null ? String(subject.score) : '');
    setModalComment(subject.comment || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSubject(null);
    setModalScore('');
    setModalComment('');
  };

  const handleSaveModal = async () => {
    if (!selectedSubject) return;
    setSavingModal(true);
    try {
      const score = Number(modalScore);
      if (isNaN(score) || score < 0 || score > 100) {
        Alert('Baho 0 dan 100 gacha bo‘lishi kerak', 'warning');
        setSavingModal(false);
        return;
      }
      const { studentId, date, subjectIndex, gradeId, groupScheduleId } = selectedSubject;
      let result;
      if (gradeId) {
        result = await updateGrade({
          id: gradeId,
          data: { score, comment: modalComment },
        }).unwrap();
      } else {
        result = await createGrade({
          student_id: studentId,
          group_schedule_id: groupScheduleId,
          date: date,
          score,
          comment: modalComment,
        }).unwrap();
      }

      setLocalData(prev => {
        if (!prev) return prev;
        const newData = JSON.parse(JSON.stringify(prev));
        const records = newData.data.records;
        for (const rec of records) {
          if (rec.student_id === studentId) {
            for (const d of rec.dates) {
              if (d.date === date) {
                const subj = d.subjects[subjectIndex];
                if (subj && subj.group_schedule_id === groupScheduleId) {
                  subj.score = score;
                  subj.comment = modalComment;
                  if (!gradeId && result?.id) {
                    subj.grade_id = result.id;
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

      Alert('Baho saqlandi', 'success');
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
              Baholar tarixi
            </Typography>
            <Typography className="text-text-secondary text-xs">
              Oylik baholar statistikasi
            </Typography>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Dan</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Gacha</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors text-sm"
            />
          </div>
          <button
            onClick={() => {
              setPage(1);
              fetchGrades({
                group_id: groupId,
                date_from: dateFrom,
                date_to: dateTo,
                page: 1,
                limit,
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
          {studentsList.length === 0 ? (
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
                  {studentsList.map((student) => {
                    const studentData = studentMap[student.id];
                    if (!studentData) return null;
                    return (
                      <tr key={student.id} className="border-b border-border/40 hover:bg-input-bg/20 transition-colors">
                        <td className="px-3 py-2 font-medium text-text-primary sticky left-0 bg-card z-10 shadow-sm">
                          <Link to={`/student/${student.id}`} className="hover:text-accent hover:underline transition-colors">
                            {student.full_name}
                          </Link>                        </td>
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
                                  const score = subject.score;
                                  const displayScore = score !== undefined && score !== null ? score : '—';
                                  const colorClass = getScoreColor(score);
                                  return (
                                    <button
                                      key={`${subject.subject_name}-${idx}`}
                                      onClick={() => openModal(student.id, date, idx)}
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${colorClass} border border-transparent hover:border-accent transition-colors`}
                                      title={`${subject.subject_name}: ${displayScore !== '—' ? displayScore + '%' : 'baholanmagan'}`}
                                      disabled={updating}
                                    >
                                      <span className="truncate max-w-[60px]">{idx + 1}. {subject.subject_name}</span>
                                      <span className="font-bold">{displayScore !== '—' ? displayScore + '%' : '—'}</span>
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
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-accent/10 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
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
                    <User size={14} /> O‘quvchi: {selectedSubject.studentName}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays size={14} /> {parseLocalDate(selectedSubject.date).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
              </div>
            </DialogHeader>
            <DialogBody>
              <div className="space-y-4">
                <div>
                  <Typography className="text-text-secondary text-sm font-medium mb-2">Baho (0-100%)</Typography>
                  <input
                    type="number"
                    value={modalScore}
                    onChange={(e) => setModalScore(e.target.value)}
                    min="0"
                    max="100"
                    step="1"
                    className="w-full px-4 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors"
                    placeholder="0-100"
                    onKeyDown={(e) => {
                      const value = Number(e.target.value + e.key);
                      if (e.key !== 'Backspace' && e.key !== 'Delete' && (isNaN(value) || value > 100)) {
                        e.preventDefault();
                      }
                    }}
                  />
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
                {selectedSubject.score !== undefined && selectedSubject.score !== null && (
                  <div className="text-xs text-text-secondary">
                    Joriy baho: <span className="font-medium">{selectedSubject.score}%</span>
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