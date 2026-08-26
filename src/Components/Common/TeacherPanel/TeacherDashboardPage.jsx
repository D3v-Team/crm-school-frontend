import { useSelector } from 'react-redux';
import { LayoutDashboard } from 'lucide-react';
import TeacherDashboard from './__tabs/TeacherDashboard';

export default function TeacherDashboardPage() {
    const teacherId = useSelector(s => s.auth.userId);
    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><LayoutDashboard size={18} /></span>
                    Dashboard
                </div>
            </div>
            <TeacherDashboard teacherId={teacherId} />
        </div>
    );
}
