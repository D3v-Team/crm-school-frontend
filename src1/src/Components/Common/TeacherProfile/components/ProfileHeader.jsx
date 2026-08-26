import React from 'react';
import { Typography, Chip } from '@material-tailwind/react';
import { User, Shield, Phone, Mail, Calendar, CreditCard } from 'lucide-react';

export default function ProfileHeader({ user }) {
  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <User size={48} className="text-accent" />
        </div>
        <div className="flex-1">
          <Typography variant="h4" className="text-text-primary font-bold">
            {user?.full_name}
          </Typography>
          <Typography className="text-text-secondary flex items-center gap-1">
            <Shield size={16} /> O‘qituvchi
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-text-secondary" />
              <Typography className="text-text-primary text-sm">{user?.phone || '—'}</Typography>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-text-secondary" />
              <Typography className="text-text-primary text-sm">{user?.username || '—'}</Typography>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-text-secondary" />
              <Typography className="text-text-primary text-sm">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('uz-UZ') : '—'}
              </Typography>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
