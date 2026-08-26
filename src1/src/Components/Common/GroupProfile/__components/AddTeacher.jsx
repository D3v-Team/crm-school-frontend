// AddTeacherToGroup.jsx
import { useState, useEffect } from 'react';
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Typography } from '@material-tailwind/react';
import { useLazyGetUsersQuery } from '../../../../store/services/user.api';
import { UserPlus, X, User, Search } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useCreateTeacherGroupMutation } from '../../../../store/services/theacher-group.api';

export default function AddTeacherToGroup({ groupId, onAdd }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [fetchTeachers, { data, isLoading, error }] = useLazyGetUsersQuery();
  const [addTeacher, { isLoading: isAdding }] = useCreateTeacherGroupMutation();

  useEffect(() => {
    if (open) {
      fetchTeachers({ role: 'teacher', limit: 100, search: search || undefined });
    }
  }, [open, fetchTeachers, search]);

  useEffect(() => {
    if (data) {
      setTeachers(data?.data?.records || []);
    }
  }, [data]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSearch('');
    setTeachers([]);
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const handleAdd = async (teacherId) => {
    try {
      await addTeacher({ teacher_id: teacherId, group_id: groupId }).unwrap();
      Alert('O‘qituvchi guruhga qo‘shildi', 'success');
      if (onAdd) onAdd();
      setTeachers(prev => prev.filter(t => t.id !== teacherId));
    } catch (err) {
      Alert(err?.data?.message || 'Xatolik yuz berdi', 'error');
    }
  };

  return (
    <>
      <Button
        className="bg-accent hover:bg-accent-hover text-white transition-colors flex items-center gap-2"
        onClick={handleOpen}
        size="sm"
      >
        <UserPlus size={16} /> Qo‘shish
      </Button>

      <Dialog
        open={open}
        handler={handleClose}
        size="lg"
        className="bg-card text-text-primary border border-border"
      >
        <DialogHeader className="text-text-primary flex justify-between items-center">
          <span className="flex items-center gap-2">
            <UserPlus size={20} className="text-accent" />
            O‘qituvchi qo‘shish
          </span>
          <button onClick={handleClose} className="text-text-secondary hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Ism yoki username bo‘yicha qidirish..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8 text-accent" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              Xatolik: {error?.data?.message || "Noma'lum xatolik"}
            </div>
          ) : teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-input-bg/30 rounded-xl border border-border/40">
              <User className="w-16 h-16 text-text-secondary/30 mb-3" />
              <Typography className="text-text-secondary text-base font-medium">
                {search ? 'Hech qanday o‘qituvchi topilmadi' : 'O‘qituvchilar mavjud emas'}
              </Typography>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-input-bg/40 border border-border/40 hover:border-accent/40 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <Typography className="text-text-primary font-medium text-sm truncate">
                      {teacher.full_name}
                    </Typography>
                    <Typography className="text-text-secondary text-xs truncate">
                      {teacher.username || 'Username yo‘q'}
                    </Typography>
                  </div>
                  <Button
                    size="sm"
                    className="ml-2 bg-accent hover:bg-accent-hover text-white transition-colors p-1.5 min-w-[32px] h-8"
                    onClick={() => handleAdd(teacher.id)}
                    disabled={isAdding}
                    loading={isAdding}
                  >
                    <UserPlus size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogBody>
        <DialogFooter className="gap-2">
          <Button
            variant="text"
            className="text-text-secondary hover:bg-[var(--accent)]/10 transition-colors"
            onClick={handleClose}
            disabled={isAdding}
          >
            Yopish
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}