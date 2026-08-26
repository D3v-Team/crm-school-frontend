import { useSelector } from 'react-redux';
import { BookOpen } from 'lucide-react';
import TeacherTopics from './__tabs/TeacherTopics';

export default function TeacherTopicsPage() {
    const teacherId = useSelector(s => s.auth.userId);
    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><BookOpen size={18} /></span>
                    Mavzular
                </div>
            </div>
            <TeacherTopics teacherId={teacherId} />
        </div>
    );
}
