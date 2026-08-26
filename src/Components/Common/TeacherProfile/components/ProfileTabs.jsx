import { useState } from 'react';
import { BookOpen, Layers, CalendarDays, ListChecks, Camera } from 'lucide-react';
import SubjectsTab from './tabs/SubjectsTab';
import GroupsTab   from './tabs/GroupsTab';
import ScheduleTab from './tabs/ScheduleTab';
import TopicsTab   from './tabs/TopicsTab';
import UserAttendanceTab from './tabs/UserAttendanceTab';

const TABS = [
    { key:'subjects',    label:'Fanlar',        icon: BookOpen     },
    { key:'groups',      label:'Guruhlar',      icon: Layers       },
    { key:'schedule',    label:'Jadvallar',     icon: CalendarDays },
    { key:'topics',      label:'Mavzular',      icon: ListChecks   },
    { key:'attendance',  label:'Kirdi-Chiqdi',  icon: Camera       },
];

export default function ProfileTabs({ user, subjects }) {
    const [active, setActive] = useState('subjects');

    return (
        <div>
            {/* Tab bar */}
            <div style={{ display:'flex', gap:4, padding:'4px', background:'var(--input-bg)', borderRadius:12, border:'1px solid var(--card-border)', marginBottom:20, overflowX:'auto' }}>
                {TABS.map(({ key, label, icon: Icon }) => {
                    const isActive = active === key;
                    return (
                        <button key={key} onClick={() => setActive(key)} style={{
                            display:'flex', alignItems:'center', gap:6,
                            padding:'8px 16px', borderRadius:9, border:'none', cursor:'pointer',
                            fontSize:'0.82rem', fontWeight: isActive ? 600 : 500,
                            background: isActive ? 'var(--accent)' : 'transparent',
                            color: isActive ? '#fff' : 'var(--text-secondary)',
                            transition:'all 0.15s', whiteSpace:'nowrap',
                        }}>
                            <Icon size={14}/>{label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {active === 'subjects'   && <SubjectsTab />}
            {active === 'groups'     && <GroupsTab user={user} />}
            {active === 'schedule'   && <ScheduleTab user={user} />}
            {active === 'topics'     && <TopicsTab user={user} />}
            {active === 'attendance' && <UserAttendanceTab user={user} />}
        </div>
    );
}
