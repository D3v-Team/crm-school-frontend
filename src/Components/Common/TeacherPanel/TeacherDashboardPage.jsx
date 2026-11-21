import { useSelector } from 'react-redux';
import { Sun } from 'lucide-react';
import TeacherDashboard from './__tabs/TeacherDashboard';
import { useGetUserByIdQuery } from '../../../store/services/user.api';

const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];

const greeting = (hour) => (hour < 11 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli kech');

export default function TeacherDashboardPage() {
    const teacherId = useSelector(s => s.auth.userId);
    const { data } = useGetUserByIdQuery(teacherId, { skip: !teacherId });
    const user = data?.data || data;
    // Ism tartibi har xil (Ism Familiya / FAMILIYA ISM) — to'liq ismni chiroyli harflar bilan ko'rsatamiz
    const displayName = (user?.full_name || '').trim().toLowerCase().replace(/(^|[\s-])\S/g, (m) => m.toUpperCase());
    const now = new Date();

    return (
        <div>
            <div className="teacher-hello">
                <div className="teacher-hello-icon"><Sun size={20} /></div>
                <div style={{ minWidth: 0 }}>
                    <h1>{greeting(now.getHours())}{displayName ? `, ${displayName}` : ''}!</h1>
                    <p>{WEEKDAYS[now.getDay()]}, {now.getDate()}-{MONTHS[now.getMonth()]}</p>
                </div>
            </div>
            <TeacherDashboard teacherId={teacherId} />
        </div>
    );
}
