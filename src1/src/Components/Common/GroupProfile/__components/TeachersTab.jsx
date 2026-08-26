import React from 'react';
import { Typography } from '@material-tailwind/react';
import { User } from 'lucide-react';
import Loading from '../../../Other/UI/Loadings/Loading';
import AddTeacherToGroup from './AddTeacher';
import { useParams } from 'react-router-dom';
import DeleteTeacherGroup from './DeleteTeacher';

export default function TeachersTab({ teachers, loading, onRefresh }) {


  console.log(teachers)

  const { id } = useParams()

  if (loading) return <Loading />;

  if (teachers.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-text-secondary">
        <User size={32} className="mb-2 opacity-30" />
        <Typography>Hozircha o‘qituvchilar mavjud emas</Typography>
      </div>
    );
  }
  return (
    <div >
      <div className='flex items-center justify-between mb-4'>
        <h1 className="text-2xl font-bold text-text-primary">O‘qituvchilar</h1>
        <AddTeacherToGroup groupId={id} onAdd={() => onRefresh && onRefresh()} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {teachers.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-input-bg/50 border border-border/40 justify-between"
          >
            <User size={20} className="text-accent/70" />
            <div className="flex-1 min-w-0 mx-3">
              <Typography className="text-text-primary font-medium">
                {item.teacher?.full_name || "Noma'lum"}
              </Typography>
              <Typography className="text-text-secondary text-xs">
                {item.teacher?.username || ''}
              </Typography>
            </div>
            <div className="flex-shrink-0">
              <DeleteTeacherGroup
                teacherGroupId={item.id}
                teacherName={item.teacher?.full_name}
                onSuccess={() => onRefresh && onRefresh()}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}