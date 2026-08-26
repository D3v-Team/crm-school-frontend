import { useSelector } from 'react-redux';
import { Book } from 'lucide-react';
import TeacherSubjects from './__tabs/TeacherSubjects';

export default function TeacherSubjectsPage() {
    const teacherId = useSelector(s => s.auth.userId);
    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><Book size={18} /></span>
                    Fanlar
                </div>
            </div>
            <TeacherSubjects teacherId={teacherId} />
        </div>
    );
}
