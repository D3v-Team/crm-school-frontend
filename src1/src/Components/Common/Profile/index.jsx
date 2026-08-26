import React from 'react';
import { useGetUserByIdQuery } from '../../../store/services/user.api';
import {
  Card,
  CardBody,
  Typography,
  Chip,
} from '@material-tailwind/react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  CreditCard,
  MessageSquare,
  Users,
  BookOpen,
  GraduationCap,
  CalendarDays,
  ListChecks,
} from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export default function Profile() {
  const userId = getCookie('userId');

  const { data, isLoading, error } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="bg-card border border-border shadow-lg rounded-2xl p-8 text-center max-w-md">
          <CardBody>
            <Typography variant="h5" className="text-text-primary mb-2">
              Kirish talab qilinadi
            </Typography>
            <Typography className="text-text-secondary">
              Iltimos, tizimga kiring yoki profilingizni ko‘rish uchun hisobingizga kiring.
            </Typography>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <CardBody>
            <Typography color="red" className="font-medium">
              ❌ Xatolik yuz berdi: {error?.data?.message || 'Nomaʼlum xatolik'}
            </Typography>
          </CardBody>
        </Card>
      </div>
    );
  }

  const user = data?.data || data;

  const renderList = (items, title, Icon) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mt-4 first:mt-0">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon size={18} className="text-accent" />}
          <Typography variant="h6" className="text-text-primary font-semibold text-sm">
            {title}
          </Typography>
          <Chip size="sm" value={items.length} className="bg-accent/20 text-accent" />
        </div>
        <ul className="list-disc list-inside space-y-1 text-text-secondary text-sm">
          {items.map((item, idx) => (
            <li key={idx}>
              {item?.name || item?.title || item?.groupName || `Element ${idx + 1}`}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="">
      <Typography variant="h3" className="text-text-primary font-bold mb-6 flex items-center gap-3">
        <User size={28} className="text-accent" />
        Mening profilim
      </Typography>

      <Card className="bg-card border border-border shadow-lg rounded-2xl overflow-hidden">
        <CardBody className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <User size={40} className="text-accent" />
              </div>
              <div>
                <Typography variant="h5" className="text-text-primary font-semibold">
                  {user?.full_name || 'Ism kiritilmagan'}
                </Typography>
                <Typography className="text-text-secondary text-sm flex items-center gap-1">
                  <Shield size={14} />
                  {user?.role === 'super_admin' ? 'Super Administrator' :
                   user?.role === 'admin' ? 'Administrator' :
                   user?.role === 'teacher' ? 'O‘qituvchi' :
                   user?.role === 'hr' ? 'HR' :
                   user?.role === 'parent' ? 'Ota-ona' :
                   user?.role === 'cashier' ? 'Kassir' : 'Foydalanuvchi'}
                </Typography>
              </div>
            </div>

            <div className="space-y-3">
              {user?.username && (
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-text-secondary" />
                  <div>
                    <Typography className="text-xs text-text-secondary">Username</Typography>
                    <Typography className="text-text-primary">{user.username}</Typography>
                  </div>
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-text-secondary" />
                  <div>
                    <Typography className="text-xs text-text-secondary">Telefon</Typography>
                    <Typography className="text-text-primary">{user.phone}</Typography>
                  </div>
                </div>
              )}
              {user?.createdAt && (
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-text-secondary" />
                  <div>
                    <Typography className="text-xs text-text-secondary">Ro‘yxatdan o‘tgan</Typography>
                    <Typography className="text-text-primary">
                      {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                    </Typography>
                  </div>
                </div>
              )}
              {user?.updatedAt && (
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-text-secondary" />
                  <div>
                    <Typography className="text-xs text-text-secondary">Oxirgi yangilanish</Typography>
                    <Typography className="text-text-primary">
                      {new Date(user.updatedAt).toLocaleDateString('uz-UZ')}
                    </Typography>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user?.chat_id && (
              <div className="flex items-center gap-3">
                <MessageSquare size={18} className="text-text-secondary" />
                <div>
                  <Typography className="text-xs text-text-secondary">Chat ID</Typography>
                  <Typography className="text-text-primary text-sm">{user.chat_id}</Typography>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {renderList(user?.students, "Talabalar", Users)}
            {renderList(user?.teacher_subjects, "O‘qituvchi fanlari", BookOpen)}
            {renderList(user?.homeroom_groups, "Sinf rahbari guruhlari", GraduationCap)}
            {renderList(user?.group_schedules, "Guruh jadvallari", CalendarDays)}
            {renderList(user?.teacher_groups, "O‘qituvchi guruhlari", Users)}
            {renderList(user?.weekly_topics, "Haftalik mavzular", ListChecks)}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}