import React from 'react';
import { ListChecks, Trash2 } from 'lucide-react';
import { Typography } from '@material-tailwind/react';

export default function TopicsTab({ user, onRemove }) {
  const topics = user?.weekly_topics || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-accent" />
          <Typography variant="h6" className="text-text-primary font-semibold">Haftalik mavzular</Typography>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="p-4 text-text-secondary">Haftalik mavzular mavjud emas</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topics.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-input-bg/40 border border-border/40">
              <div>
                <div className="text-text-primary font-medium">{t.name || t.title || 'Mavzu'}</div>
                <div className="text-text-secondary text-xs">ID: {t.id?.slice(0, 8)}</div>
              </div>
              {onRemove && <button onClick={() => onRemove(t.id)} className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
