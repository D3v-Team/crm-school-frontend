import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetGroupByIdQuery } from '../../../store/services/group.api';
import { useLazyGetGroupScheduleByGroupIdQuery } from '../../../store/services/group-schedule.api';
import {
    Users, User, Calendar, BookOpen, Layers,
    ClipboardList, ArrowLeft, SplitSquareHorizontal, Columns2, DoorOpen,
} from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';
import GroupStudentsTab from './__components/GroupStudentsTab';
import GroupDebtorsTab from './__components/StudentsTab';
import ScheduleTab   from './__components/ScheduleTab';
import AttendanceTab from './__components/AttendanceTab';
import GradesTab     from './__components/GradesTab';
import EntryExitTab  from './__components/EntryExitTab';

/* ── Admin tabs ── */
const ADMIN_TABS = [
    { key:'students',   label:"O'quvchilar",   icon: Users        },
    { key:'schedule',   label:'Jadvallar',      icon: Calendar     },
    { key:'attendance', label:'Davomat',        icon: ClipboardList },
    { key:'grades',     label:'Baholar',        icon: BookOpen     },
    { key:'entryexit',  label:'Kirdi-chiqdi',   icon: DoorOpen     },
];

const TEACHER_TABS = [
    { key:'students',   label:"O'quvchilar", icon: Users },
    { key:'schedule',   label:'Jadvallar', icon: Calendar     },
    { key:'attendance', label:'Davomat',   icon: ClipboardList },
    { key:'grades',     label:'Baholar',   icon: BookOpen     },
];

/* ── Tab bar with merge button ── */
function Tabs({ tabs, active, onChange, merged, onMergeToggle, isTeacher }) {
    const showMerge = !isTeacher && (active === 'attendance' || active === 'grades' || merged);
    return (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {/* Tab buttons */}
            <div style={{ display:'flex', gap:4, padding:'4px', background:'var(--input-bg)', borderRadius:12, border:'1px solid var(--card-border)', overflowX:'auto', flex:'1 1 auto' }}>
                {tabs.map(t => {
                    /* merged holatda attendance va grades yashiriladi */
                    if (merged && (t.key === 'attendance' || t.key === 'grades')) return null;
                    /* active faqat joriy tab key ga mos kelsa */
                    const isActive = !merged && active === t.key;
                    return (
                        <button key={t.key} onClick={() => onChange(t.key)} style={{
                            display:'flex', alignItems:'center', gap:6,
                            padding:'8px 14px', borderRadius:9, border:'none', cursor:'pointer',
                            fontSize:'0.82rem', fontWeight: isActive ? 600 : 500,
                            background: isActive ? 'var(--accent)' : 'transparent',
                            color: isActive ? '#fff' : 'var(--text-secondary)',
                            transition:'all 0.15s', whiteSpace:'nowrap', flexShrink:0,
                        }}>
                            <t.icon size={14}/>{t.label}
                        </button>
                    );
                })}
                {/* Merged tab — faqat merged holatda ko'rinadi */}
                {merged && (
                    <button style={{
                        display:'flex', alignItems:'center', gap:6,
                        padding:'8px 14px', borderRadius:9, border:'none', cursor:'default',
                        fontSize:'0.82rem', fontWeight:600,
                        background:'var(--accent)', color:'#fff',
                        whiteSpace:'nowrap', flexShrink:0,
                    }}>
                        <Columns2 size={14}/> Davomat + Baholar
                    </button>
                )}
            </div>

            {/* Merge toggle — faqat admin/non-teacher uchun */}
            {showMerge && (
                <button
                    onClick={onMergeToggle}
                    title={merged ? 'Ajratish' : 'Davomat + Baholani birlashtirish'}
                    style={{
                        display:'flex', alignItems:'center', gap:6,
                        padding:'8px 14px', borderRadius:10,
                        border:`1.5px solid ${merged ? 'var(--accent)' : 'var(--card-border)'}`,
                        background: merged ? 'var(--accent-soft)' : 'var(--input-bg)',
                        color: merged ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize:'0.78rem', fontWeight:600, cursor:'pointer',
                        transition:'all 0.15s', whiteSpace:'nowrap', flexShrink:0,
                    }}
                >
                    <SplitSquareHorizontal size={14}/>
                    {merged ? 'Ajratish' : 'Birlashtirish'}
                </button>
            )}
        </div>
    );
}

export default function GroupProfile() {
    const { id } = useParams();
    const navigate  = useNavigate();
    const role      = useSelector(s => s.auth.role);
    const isTeacher = role === 'teacher';
    const isCashier = role === 'cashier';

    const tabs = isTeacher ? TEACHER_TABS : ADMIN_TABS.filter(t =>
        role !== 'cashier' || t.key === 'students'
    );
    const [tab, setTab] = useState(isTeacher ? 'merged' : 'students');
    const [merged, setMerged] = useState(isTeacher ? true : false);
    const [showInitialLoading, setShowInitialLoading] = useState(true);

    const handleTabChange = (key) => {
        setTab(key);
        if (key !== 'attendance' && key !== 'grades' && key !== 'merged') {
            setMerged(false);
        }
    };

    const handleMergeToggle = () => {
        if (merged) {
            setMerged(false);
            setTab('attendance');
        } else {
            setMerged(true);
            setTab('merged');
        }
    };

    const { data: groupData, isLoading: groupLoading, error: groupError } = useGetGroupByIdQuery(id, { skip: !id });
    /* Guruh jadvalidan unique fanlar (admin uchun) */
    const [fetchSchedule, { data: scheduleData }] = useLazyGetGroupScheduleByGroupIdQuery();

    useEffect(() => {
        if (groupLoading) {
            setShowInitialLoading(true);
            return undefined;
        }
        const timer = setTimeout(() => setShowInitialLoading(false), 400);
        return () => clearTimeout(timer);
    }, [groupLoading]);

    useEffect(() => {
        if (id) fetchSchedule(id);
    }, [id, fetchSchedule]);

    const group    = groupData?.data || groupData;
    // Faqat guruhga tegishli studentlar — group.students to'g'ri ma'lumot
    const students = group?.students || [];

    const teacherSubjectId = group?.subject_id || group?.subject?.id || null;

    /* Admin uchun — guruh jadvalidan unique fanlar */
    const scheduleRecords = useMemo(() => {
        if (!scheduleData) return [];
        // axiosBaseQuery: result.data → hook.data
        // Backend javob: { status, data: [...] }  yoki  { status, data: { records: [...] } }
        const raw = scheduleData;
        // 1) To'g'ridan-to'g'ri array
        if (Array.isArray(raw)) return raw;
        const d = raw?.data;
        // 2) data — array
        if (Array.isArray(d)) return d;
        // 3) data.records — array
        if (Array.isArray(d?.records)) return d.records;
        // 4) data.data — array (nested)
        if (Array.isArray(d?.data)) return d.data;
        // 5) data.data.records — array
        if (Array.isArray(d?.data?.records)) return d.data.records;
        return [];
    }, [scheduleData]);
    const groupSubjects = useMemo(() => {
        const groupSubject = group?.subject || (group?.subject_id ? { id: group.subject_id, name: group.subject_name } : null);
        if (groupSubject?.id) return [{ id: groupSubject.id, name: groupSubject.name || "Fan" }];
        if (!Array.isArray(scheduleRecords) || !scheduleRecords.length) return [];
        const seen = new Set();
        return scheduleRecords
            .filter(s => s.subject_id && (s.subject?.name || s.subject_name))
            .filter(s => { if (seen.has(s.subject_id)) return false; seen.add(s.subject_id); return true; })
            .map(s => ({ id: s.subject_id, name: s.subject?.name || s.subject_name || s.subject_id }));
    }, [group, scheduleRecords]);

    if (groupLoading || showInitialLoading) return <Loading/>;
    if (groupError) return (
        <div style={{ background:'var(--danger-soft)', border:'1px solid var(--danger)', color:'var(--danger)', padding:16, borderRadius:12 }}>
            Xatolik: {groupError?.data?.message}
        </div>
    );

    const initials = (group?.name||'?').slice(0,2).toUpperCase();

    return (
        <div>
            <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                <div className="page-title">
                    <span className="page-title-icon"><Layers size={18}/></span>
                    Guruh profili
                </div>
                <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--input-bg)', border:'1.5px solid var(--card-border)', borderRadius:9, padding:'7px 14px', cursor:'pointer', fontSize:'0.78rem', color:'var(--text-secondary)', fontWeight:600 }}>
                    <ArrowLeft size={14}/> Orqaga
                </button>
            </div>

            {/* ── Group info card ── */}
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, padding:'16px 18px', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:18, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:18 }}>
                        <div style={{ width:56, height:56, borderRadius:14, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', fontWeight:700, border:'2px solid var(--card-border)', flexShrink:0 }}>
                            {initials}
                        </div>
                        <div>
                            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-primary)', margin:'0 0 4px' }}>{group?.name}</h2>
                            <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', maxWidth:'100%' }}>
                                    <User size={13}/> O'qituvchi: <strong style={{ color:'var(--text-primary)' }}>{group?.teacher?.full_name || "Belgilanmagan"}</strong>
                            </div>
                            <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', maxWidth:'100%', marginTop:4 }}>
                                    <BookOpen size={13}/> Fan: <strong style={{ color:'var(--text-primary)' }}>{group?.subject?.name || "Fan belgilanmagan"}</strong>
                                </div>
                        </div>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:14 }}>
                        {group?.start_date && (
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ width:28, height:28, borderRadius:7, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <Calendar size={13} style={{ color:'var(--accent)' }}/>
                                </div>
                                <div>
                                    <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Boshlanish</div>
                                    <div style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--text-primary)' }}>{new Date(group.start_date).toLocaleDateString('uz-UZ')}</div>
                                </div>
                            </div>
                        )}
                        {!isTeacher && (
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ width:28, height:28, borderRadius:7, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <Users size={13} style={{ color:'var(--accent)' }}/>
                                </div>
                                <div>
                                    <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>O'quvchilar</div>
                                    <div style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--text-primary)' }}>{students.length} ta</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Tabs card ── */}
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, padding:'16px 18px' }}>
                <Tabs
                    tabs={tabs}
                    active={tab}
                    onChange={handleTabChange}
                    merged={merged}
                    onMergeToggle={handleMergeToggle}
                    isTeacher={isTeacher}
                />

                {tab === 'students' && (
                    isCashier
                        ? <GroupDebtorsTab students={students} />
                        : <><GroupStudentsTab groupId={id} />{!isTeacher && <div style={{ marginTop: 24 }}><GroupDebtorsTab students={students} /></div>}</>
                )}
                {tab === 'schedule'              && <ScheduleTab groupId={id} />}
                {tab === 'attendance' && !merged  && <AttendanceTab groupId={id} students={students} merged={false} groupSubjects={groupSubjects} teacherSubjectId={teacherSubjectId} scheduleRecords={Array.isArray(scheduleRecords) ? scheduleRecords : []} />}
                {tab === 'grades'     && !merged  && <GradesTab students={students} groupSubjects={groupSubjects} teacherSubjectId={teacherSubjectId} scheduleRecords={Array.isArray(scheduleRecords) ? scheduleRecords : []} />}
                {(tab === 'merged' || merged)     && <AttendanceTab groupId={id} students={students} merged={true} groupSubjects={groupSubjects} teacherSubjectId={teacherSubjectId} scheduleRecords={Array.isArray(scheduleRecords) ? scheduleRecords : []} />}
                {tab === 'entryexit'              && <EntryExitTab groupId={id} />}
            </div>
        </div>
    );
}
