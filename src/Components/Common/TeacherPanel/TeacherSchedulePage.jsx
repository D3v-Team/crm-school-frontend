import { useSelector } from 'react-redux';
import { CalendarDays } from 'lucide-react';
import TeacherSchedule from './__tabs/TeacherSchedule';

export default function TeacherSchedulePage() {
    const teacherId = useSelector(s => s.auth.userId);
    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><CalendarDays size={18} /></span>
                    Dars jadvali
                </div>
            </div>
            <TeacherSchedule teacherId={teacherId} />
        </div>
    );
}
