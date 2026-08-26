import { useSelector } from 'react-redux';
import { Layers } from 'lucide-react';
import TeacherGroups from './__tabs/TeacherGroups';

export default function TeacherGroupsPage() {
    const teacherId = useSelector(s => s.auth.userId);
    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><Layers size={18} /></span>
                    Guruhlar
                </div>
            </div>
            <TeacherGroups teacherId={teacherId} />
        </div>
    );
}
