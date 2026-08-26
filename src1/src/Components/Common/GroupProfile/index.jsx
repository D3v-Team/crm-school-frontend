// GroupProfile.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  Typography,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
} from '@material-tailwind/react';
import {
  Users,
  User,
  Calendar,
  Phone,
  Mail,
} from 'lucide-react';

import { useGetGroupByIdQuery } from '../../../store/services/group.api';
import { useLazyGetTeacherGroupsByGroupIdQuery } from '../../../store/services/theacher-group.api';
import TeachersTab from './__components/TeachersTab';
import ScheduleTab from './__components/ScheduleTab';
import AttendanceTab from './__components/AttendanceTab';

import Loading from '../../Other/UI/Loadings/Loading';
import StudentTab from './__components/StudentsTab';
import GradesTab from './__components/GradesTab';

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
  const teachers = teachersData?.data?.records || [];
  const students = group?.students || []; // временно, пока не будет отдельного API

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
    <div className="mt-[10px]">
      <Typography variant="h3" className="text-text-primary font-bold mb-6 flex items-center gap-3">
        <Users size={28} className="text-accent" />
        Guruh profili
      </Typography>

      {/* Информация о группе */}
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

        </CardBody>
      </Card>

      {/* Вкладки */}
      <Card className="bg-card border border-border shadow-lg rounded-2xl">
        <CardBody className="p-4">
          <Tabs value="student" className="w-full">
            <TabsHeader
              className="bg-input-bg/50 rounded-xl p-1 overflow-x-auto"
              indicatorProps={{
                className: "bg-accent shadow-none rounded-lg",
              }}
            >
              <Tab
                value="student"
                className="text-text-secondary data-[active=true]:text-white data-[active=true]:bg-accent data-[active=true]:rounded-lg transition-all duration-200 font-medium"
              >
                <Users size={18} className="inline mr-1.5" /> O'quvchilar
              </Tab>


              <Tab
                value="schedule"
                className="text-text-secondary data-[active=true]:text-white data-[active=true]:bg-accent data-[active=true]:rounded-lg transition-all duration-200 font-medium"
              >
                <Calendar size={18} className="inline mr-1.5" /> Jadvallar
              </Tab>
              <Tab
                value="attendance"
                className="text-text-secondary data-[active=true]:text-white data-[active=true]:bg-accent data-[active=true]:rounded-lg transition-all duration-200 font-medium"
              >
                <Users size={18} className="inline mr-1.5" /> Davomat
              </Tab>
              <Tab
                value="grades"
                className="text-text-secondary data-[active=true]:text-white data-[active=true]:bg-accent data-[active=true]:rounded-lg transition-all duration-200 font-medium"
              >
                <Users size={18} className="inline mr-1.5" /> Baholash
              </Tab>
            </TabsHeader>
            <TabsBody className="mt-4">
              <TabPanel value="student" className="p-0">
                <StudentTab students={students}ƒ  />
              </TabPanel>
              <TabPanel value="schedule" className="p-0">
                <ScheduleTab groupId={id} />
              </TabPanel>
              <TabPanel value="attendance" className="p-0">
                <AttendanceTab students={students} />
              </TabPanel>
              <TabPanel value="grades" className="p-0">
                <GradesTab students={students} />
              </TabPanel>
            </TabsBody>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}