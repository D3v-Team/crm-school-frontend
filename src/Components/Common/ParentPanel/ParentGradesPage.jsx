import { BookOpen } from 'lucide-react';
import ParentGrades from './ParentGrades';

export default function ParentGradesPage() {
    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><BookOpen size={18} /></span>
                    Baholar
                </div>
            </div>
            <ParentGrades />
        </div>
    );
}
