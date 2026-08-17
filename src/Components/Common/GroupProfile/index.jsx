// GroupProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Input,
} from '@material-tailwind/react';
import {
  Users,
  User,
  Calendar,
  BookOpen,
  GraduationCap,
  Phone,
  Mail,
  Check,
  X,
  Clock,
  Save,
} from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';
import { useGetGroupByIdQuery } from '../../../store/services/group.api';
import { useLazyGetTeacherGroupsByGroupIdQuery } from '../../../store/services/theacher-group.api';
// TODO: agar backendda tayyor bo'lsa, quyidagi ikkita hookni ulang:
// import { useLazyGetStudentGroupsByGroupIdQuery } from '../../../store/services/student-group.api';
// import { useMarkAttendanceMutation, useSetGradeMutation } from '../../../store/services/attendance.api';

const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'Keldi', icon: Check, color: 'text-green-600', bg: 'bg-green-500/10 border-green-500/40' },
  { value: 'absent', label: 'Kelmadi', icon: X, color: 'text-red-600', bg: 'bg-red-500/10 border-red-500/40' },
  { value: 'late', label: 'Kechikdi', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/40' },
];

const GRADE_OPTIONS = [2, 3, 4, 5];

export default function GroupProfile() {
  const { id } = useParams();
  const {
    data: groupData,
    isLoading: groupLoading,
    error: groupError,
  } = useGetGroupByIdQuery(id, { skip: !id });

  const [fetchTeachers, { data: teachersData, isLoading: teachersLoading }] =
    useLazyGetTeacherGroupsByGroupIdQuery();

  useEffect(() => {
    if (id) fetchTeachers(id);
  }, [id, fetchTeachers]);

  const group = groupData?.data || groupData;
  const teachers = teachersData?.data || [];

  // Vaqtinchalik demo ro'yxat — student.api ulanganda group?.students ga almashtiring
  const students = group?.students || [];

  // studentId -> 'present' | 'absent' | 'late'
  const [attendance, setAttendance] = useState({});
  // studentId -> 2..5
  const [grades, setGrades] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAttendance = (studentId, value) => {
    setAttendance((prev) => ({ ...prev, [studentId]: value }));
    setDirty(true);
  };

  const handleGrade = (studentId, value) => {
    setGrades((prev) => ({ ...prev, [studentId]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: real API bilan almashtiring, masalan:
      // await Promise.all(
      //   Object.entries(attendance).map(([studentId, status]) =>
      //     markAttendance({ groupId: id, studentId, status })
      //   )
      // );
      await new Promise((r) => setTimeout(r, 400));
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  if (groupLoading) return <Loading />;
  if (groupError) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <CardBody>
            <Typography color="red">Xatolik: {groupError?.data?.message}</Typography>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="">
      <Typography variant="h3" className="text-text-primary font-bold mb-6 flex items-center gap-3">
        <Users size={28} className="text-accent" />
        Guruh profili
      </Typography>

      {/* Guruh haqida ma'lumot */}
      <Card className="bg-card border border-border shadow-lg rounded-2xl mb-6">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Users size={32} className="text-accent" />
              </div>
              <div>
                <Typography variant="h4" className="text-text-primary font-bold">
                  {group?.name}
                </Typography>
                {group?.homeroom_teacher && (
                  <Typography className="text-text-secondary flex items-center gap-1">
                    <User size={16} /> Sinf rahbari: {group.homeroom_teacher.full_name}
                  </Typography>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 md:ml-auto">
              {group?.start_date && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Calendar size={18} />
                  <span>Boshlanish: {new Date(group.start_date).toLocaleDateString('uz-UZ')}</span>
                </div>
              )}
              {group?.createdAt && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Calendar size={18} />
                  <span>Yaratilgan: {new Date(group.createdAt).toLocaleDateString('uz-UZ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group?.homeroom_teacher?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-text-secondary" />
                <span className="text-text-secondary">Telefon:</span>
                <span className="text-text-primary">{group.homeroom_teacher.phone}</span>
              </div>
            )}
            {group?.homeroom_teacher?.username && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-text-secondary" />
                <span className="text-text-secondary">Username:</span>
                <span className="text-text-primary">{group.homeroom_teacher.username}</span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* O'qituvchilar */}
      <Card className="bg-card border border-border shadow-lg rounded-2xl mb-6">
        <CardBody className="p-5">
          <Typography variant="h5" className="text-text-primary font-bold mb-4 flex items-center gap-2">
            <User size={20} className="text-accent" /> O‘qituvchilar
          </Typography>

          {teachersLoading ? (
            <Loading />
          ) : teachers.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-text-secondary">
              <User size={32} className="mb-2 opacity-30" />
              <Typography>Hozircha o‘qituvchilar mavjud emas</Typography>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teachers.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-input-bg/50 border border-border/40"
                >
                  <User size={20} className="text-accent/70" />
                  <div>
                    <Typography className="text-text-primary font-medium">
                      {item.teacher?.full_name || "Noma'lum"}
                    </Typography>
                    <Typography className="text-text-secondary text-xs">
                      {item.teacher?.username || ''}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* O'quvchilar: davomat va baholar */}
      <Card className="bg-card border border-border shadow-lg rounded-2xl">
        <CardBody className="p-5">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h5" className="text-text-primary font-bold flex items-center gap-2">
              <GraduationCap size={20} className="text-accent" /> O‘quvchilar
            </Typography>

            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition
                ${dirty && !saving
                  ? 'bg-accent text-white hover:opacity-90'
                  : 'bg-input-bg/60 text-text-secondary cursor-not-allowed'}`}
            >
              <Save size={16} />
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>

          {students.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-text-secondary">
              <GraduationCap size={32} className="mb-2 opacity-30" />
              <Typography>Hozircha o‘quvchilar mavjud emas</Typography>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/40">
              {/* Header row */}
              <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-4 pb-2 text-xs uppercase tracking-wide text-text-secondary">
                <span>O‘quvchi</span>
                <span>Davomat</span>
                <span>Baho</span>
              </div>

              {students.map((student) => {
                const currentAttendance = attendance[student.id];
                const currentGrade = grades[student.id];

                return (
                  <div
                    key={student.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 md:gap-4 items-center py-3"
                  >
                    {/* Ism */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-accent" />
                      </div>
                      <div>
                        <Typography className="text-text-primary font-medium">
                          {student.full_name || "Noma'lum"}
                        </Typography>
                        {student.username && (
                          <Typography className="text-text-secondary text-xs">
                            {student.username}
                          </Typography>
                        )}
                      </div>
                    </div>

                    {/* Davomat */}
                    <div className="flex items-center gap-1.5">
                      {ATTENDANCE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const active = currentAttendance === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            title={opt.label}
                            onClick={() => handleAttendance(student.id, opt.value)}
                            className={`flex items-center justify-center w-9 h-9 rounded-lg border transition
                              ${active ? opt.bg : 'bg-input-bg/40 border-border/40 text-text-secondary hover:border-border'}`}
                          >
                            <Icon size={16} className={active ? opt.color : ''} />
                          </button>
                        );
                      })}
                    </div>

                    {/* Baho */}
                    <div className="flex items-center gap-1.5">
                      {GRADE_OPTIONS.map((g) => {
                        const active = currentGrade === g;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleGrade(student.id, g)}
                            className={`w-9 h-9 rounded-lg border text-sm font-semibold transition
                              ${active
                                ? 'bg-accent text-white border-accent'
                                : 'bg-input-bg/40 border-border/40 text-text-secondary hover:border-border'}`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}