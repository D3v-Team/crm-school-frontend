import { CalendarDays } from 'lucide-react';
import ParentAttendance from './ParentAttendance';

export default function ParentAttendancePage() {
    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><CalendarDays size={18} /></span>
                    Yo'qlama
                </div>
            </div>
            <ParentAttendance />
        </div>
    );
}
