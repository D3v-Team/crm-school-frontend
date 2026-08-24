import { useState } from 'react';
import { BookOpen, GraduationCap, CalendarDays, ListChecks } from 'lucide-react';
import SubjectsTab from './tabs/SubjectsTab';
import GroupsTab from './tabs/GroupsTab';
import ScheduleTab from './tabs/ScheduleTab';
import TopicsTab from './tabs/TopicsTab';

const TABS = [
    { key: 'subjects',  label: 'Fanlar',    icon: BookOpen      },
    { key: 'groups',    label: 'Guruhlar',  icon: GraduationCap },
    { key: 'schedule',  label: 'Jadvallar', icon: CalendarDays  },
    { key: 'topics',    label: 'Mavzular',  icon: ListChecks    },
];

export default function ProfileTabs({ user, subjects }) {
    const [active, setActive] = useState('subjects');

    return (
        <div>
            {/* Tab bar */}
            <div style={{
                display: 'flex', gap: 4, padding: '4px',
                background: 'var(--input-bg)', borderRadius: 12,
                border: '1px solid var(--card-border)',
                marginBottom: 20, overflowX: 'auto',
            }}>
                {TABS.map(({ key, label, icon: Icon }) => {
                    const isActive = active === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setActive(key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', borderRadius: 9, border: 'none',
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                fontSize: '0.82rem', fontWeight: isActive ? 600 : 500,
                                transition: 'all 0.15s',
                                background: isActive ? 'var(--accent)' : 'transparent',
                                color: isActive ? '#fff' : 'var(--text-secondary)',
                            }}
                        >
                            <Icon size={14} />
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            <div>
                {active === 'subjects'  && <SubjectsTab subjectsList={subjects} />}
                {active === 'groups'    && <GroupsTab   user={user} />}
                {active === 'schedule'  && <ScheduleTab user={user} />}
                {active === 'topics'    && <TopicsTab   user={user} />}
            </div>
        </div>
    );
}
