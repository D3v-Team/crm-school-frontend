import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetGroupByIdQuery } from '../../../store/services/group.api';
import { useLazyGetTeacherGroupsByGroupIdQuery } from '../../../store/services/theacher-group.api';
import { useLazyGetTeacherSubjectsByTeacherIdQuery } from '../../../store/services/teacher-subject.api';
import { useLazyGetStudentsQuery } from '../../../store/services/student.api';
import { Users, User, Calendar, BookOpen, Layers, ClipboardList, ArrowLeft } from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';
import StudentsTab   from './__components/StudentsTab';
import ScheduleTab   from './__components/ScheduleTab';
import AttendanceTab from './__components/AttendanceTab';
import GradesTab     from './__components/GradesTab';
import TeachersTab   from './__components/TeachersTab';

/* ── Tab bar ── */
function Tabs({ tabs, active, onChange }) {
    return (
        <div style={{ display:'flex', gap:4, padding:'4px', background:'var(--input-bg)', borderRadius:12, border:'1px solid var(--card-border)', marginBottom:20, overflowX:'auto' }}>
            {tabs.map(t => (
                <button key={t.key} onClick={() => onChange(t.key)} style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:'8px 16px', borderRadius:9, border:'none', cursor:'pointer',
                    fontSize:'0.82rem', fontWeight: active===t.key ? 600 : 500,
                    background: active===t.key ? 'var(--accent)' : 'transparent',
                    color: active===t.key ? '#fff' : 'var(--text-secondary)',
                    transition:'all 0.15s', whiteSpace:'nowrap',
                }}>
                    <t.icon size={14}/>{t.label}
                </button>
            ))}
        </div>
    );
}

/* Admin ko'radigan barcha tablar */
const ADMIN_TABS = [
    { key:'students',   label:"O'quvchilar",   icon: Users        },
    { key:'teachers',   label:"O'qituvchilar", icon: Users        },
    { key:'schedule',   label:'Jadvallar',      icon: Calendar     },
    { key:'attendance', label:'Davomat',        icon: ClipboardList },
    { key:'grades',     label:'Baholar',        icon: BookOpen     },
];

/* Teacher ko'radigan tablar — faqat jadval, davomat, baholar */
const TEACHER_TABS = [
    { key:'schedule',   label:'Jadvallar', icon: Calendar     },
    { key:'attendance', label:'Davomat',   icon: ClipboardList },
    { key:'grades',     label:'Baholar',   icon: BookOpen     },
];

/* Compact inline subject list for the overview card's teacher chip */
function TeacherSubjectsInline({ teacherId }) {
    const [fetch, { data, isLoading }] = useLazyGetTeacherSubjectsByTeacherIdQuery();
    useEffect(() => { if (teacherId) fetch(teacherId); }, [teacherId]);
    const subjects = data?.data || [];
    if (isLoading || !subjects.length) return null;
    const names = subjects.map(i => i.subject?.name).filter(Boolean).join(', ');
    if (!names) return null;
    return (
        <div style={{ fontSize:'0.68rem', color:'var(--accent)', fontWeight:600, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {names}
        </div>
    );
}

export default function GroupProfile() {
    const { id } = useParams();
    const navigate  = useNavigate();
    const role      = useSelector(s => s.auth.role);
    const userId    = useSelector(s => s.auth.userId);
    const isTeacher = role === 'teacher';

    const tabs        = isTeacher ? TEACHER_TABS : ADMIN_TABS;
    const [tab, setTab] = useState(isTeacher ? 'schedule' : 'students');

    const { data: groupData, isLoading: groupLoading, error: groupError } = useGetGroupByIdQuery(id, { skip: !id });
    const [fetchTeachers, { data: teachersData }] = useLazyGetTeacherGroupsByGroupIdQuery();
    const [fetchStudents, { data: studentsData }] = useLazyGetStudentsQuery();

    useEffect(() => {
        if (id) {
            fetchTeachers(id);
            fetchStudents({ group_id: id, limit: 100 });
        }
    }, [id]);

    const group    = groupData?.data || groupData;
    const allTeachers = teachersData?.data?.records || teachersData?.data || [];
    const students = (group?.students?.length ? group.students : null)
        || studentsData?.data?.records
        || [];

    /* Teacher rolida faqat o'zining kartasini ko'rsatamiz */
    const visibleTeachers = isTeacher
        ? allTeachers.filter(item => item.teacher?.id === userId || item.teacher_id === userId)
        : allTeachers;

    if (groupLoading) return <Loading/>;
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
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, padding:'20px 24px', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:18, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:18 }}>
                        <div style={{ width:60, height:60, borderRadius:14, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', fontWeight:700, border:'2px solid var(--card-border)', flexShrink:0 }}>
                            {initials}
                        </div>
                        <div>
                            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-primary)', margin:'0 0 4px' }}>{group?.name}</h2>
                            {group?.homeroom_teacher && (
                                <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:5 }}>
                                    <User size={13}/> Sinf rahbari: <strong style={{ color:'var(--text-primary)' }}>{group.homeroom_teacher.full_name}</strong>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
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
                        {group?.homeroom_teacher?.phone && (
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ width:28, height:28, borderRadius:7, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <User size={13} style={{ color:'var(--accent)' }}/>
                                </div>
                                <div>
                                    <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Telefon</div>
                                    <div style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--text-primary)' }}>{group.homeroom_teacher.phone}</div>
                                </div>
                            </div>
                        )}
                        {/* O'quvchilar soni — faqat admin ko'radi */}
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

                {/* ── Teachers section ──
                    Admin: barcha o'qituvchilar
                    Teacher: faqat o'zining kartasi
                */}
           
            </div>

            {/* ── Tabs card ── */}
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, padding:'20px 24px' }}>
                <Tabs tabs={tabs} active={tab} onChange={setTab} />
                {tab === 'students'   && <StudentsTab students={students} />}
                {tab === 'teachers'   && <TeachersTab />}
                {tab === 'schedule'   && <ScheduleTab groupId={id} />}
                {tab === 'attendance' && <AttendanceTab groupId={id} students={students} />}
                {tab === 'grades'     && <GradesTab />}
            </div>
        </div>
    );
}