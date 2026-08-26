// AddChildren.jsx
import { useState, useEffect } from 'react';
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Typography } from '@material-tailwind/react';
import { Search, UserPlus, X, User } from 'lucide-react';
import { useAssignParentMutation, useLazyGetStudentsQuery } from '../../../../store/services/student.api';
import { Alert } from '../../../Other/UI/Alert/Alert';

export default function AddChildren({ onAdd, parentId }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [fetchStudents, { data, isLoading, error }] = useLazyGetStudentsQuery();
  const [assignParent, { isLoading: isAssigning }] = useAssignParentMutation();

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSearch('');
    setStudents([]);
  };

  useEffect(() => {
    if (open) {
      fetchStudents({ limit: 100, search: search || undefined });
    }
  }, [open, fetchStudents, search]);

  useEffect(() => {
    if (data) {
      const allStudents = data?.data?.records || [];
      setStudents(allStudents.filter(s => s.parent_id === null));
    }
  }, [data]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleAssign = async (studentId) => {
    try {
      await assignParent({ id: studentId, data: { parent_id: parentId } }).unwrap();
      Alert('O‘quvchi ota-onaga biriktirildi', 'success');
      if (onAdd) onAdd();
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err) {
      Alert(err?.data?.message || 'Xatolik yuz berdi', 'error');
    }
  };

  if (!parentId) return null;

  const filteredStudents = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  return (
    <>
      <Button
        className="bg-accent p-2 hover:bg-accent-hover text-white transition-colors"
        onClick={handleOpen}
      >
        <UserPlus className='w-5 h-5' />
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
            Farzand qo‘shish
          </span>
          <button onClick={handleClose} className="text-text-secondary hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Ism yoki telefon bo‘yicha qidirish..."
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
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-input-bg/30 rounded-xl border border-border/40">
              <User className="w-16 h-16 text-text-secondary/30 mb-3" />
              <Typography className="text-text-secondary text-base font-medium">
                {search ? 'Hech qanday o‘quvchi topilmadi' : 'Barcha o‘quvchilar allaqachon ota-onaga biriktirilgan'}
              </Typography>
              {search && (
                <Typography className="text-text-secondary text-sm mt-1">
                  Qidiruv so‘zini o‘zgartirib ko‘ring
                </Typography>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-input-bg/40 border border-border/40 hover:border-accent/40 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <Typography className="text-text-primary font-medium text-sm truncate">
                      {student.full_name}
                    </Typography>
                    <Typography className="text-text-secondary text-xs truncate">
                      {student.phone || 'Telefon yo‘q'}
                    </Typography>
                  </div>
                  <Button
                    size="sm"
                    className="ml-2 bg-accent hover:bg-accent-hover text-white transition-colors p-1.5 min-w-[32px] h-8"
                    onClick={() => handleAssign(student.id)}
                    disabled={isAssigning}
                    loading={isAssigning}
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
            disabled={isAssigning}
          >
            Yopish
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}