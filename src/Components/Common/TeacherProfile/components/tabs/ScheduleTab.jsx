import React from 'react';
import { CalendarDays, Trash2 } from 'lucide-react';
import { Typography } from '@material-tailwind/react';

export default function ScheduleTab({ user, onRemove }) {
  const schedules = user?.group_schedules || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-accent" />
          <Typography variant="h6" className="text-text-primary font-semibold">Jadvallar</Typography>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="p-4 text-text-secondary">Jadvallar mavjud emas</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {schedules.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-input-bg/40 border border-border/40">
              <div>
                <div className="text-text-primary font-medium">{s.name || "Noma'lum"}</div>
                <div className="text-text-secondary text-xs">ID: {s.id?.slice(0, 8)}</div>
              </div>
              {onRemove && <button onClick={() => onRemove(s.id)} className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
