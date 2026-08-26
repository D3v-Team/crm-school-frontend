import { LayoutDashboard } from 'lucide-react';
import ParentDashboard from './ParentDashboard';

export default function ParentDashboardPage() {
    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><LayoutDashboard size={18} /></span>
                    Bosh sahifa
                </div>
            </div>
            <ParentDashboard />
        </div>
    );
}
