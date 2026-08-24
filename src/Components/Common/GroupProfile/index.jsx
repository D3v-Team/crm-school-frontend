import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetGroupByIdQuery } from '../../../store/services/group.api';
import { useLazyGetTeacherGroupsByGroupIdQuery } from '../../../store/services/theacher-group.api';
import { Users, User, Calendar, Check, X, Clock, Save, BookOpen } from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';

const ATTENDANCE = [
    { value: 'present', label: 'Keldi',    icon: Check, color: 'var(--success)', bg: 'var(--success-soft)' },
    { value: 'absent',  label: 'Kelmadi',  icon: X,     color: 'var(--danger)',  bg: 'var(--danger-soft)'  },
    { value: 'late',    label: 'Kechikdi', icon: Clock,  color: 'var(--warning)', bg: 'var(--warning-soft)' },
];
const GRADES = [2, 3, 4, 5];

export default function GroupProfile() {
    const { id } = useParams();
    const { data: groupData, isLoading: groupLoading, error: groupError } = useGetGroupByIdQuery(id, { skip: !id });
    const [fetchTeachers, { data: teachersData, isLoading: teachersLoading }] = useLazyGetTeacherGroupsByGroupIdQuery();

    useEffect(() => { if (id) fetchTeachers(id); }, [id]);

    const group = groupData?.data || groupData;
    const teachers = teachersData?.data || [];
    const students = group?.students || [];

    const [attendance, setAttendance] = useState({});
    const [grades, setGrades] = useState({});
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 400));
        setDirty(false);
        setSaving(false);
    };

    if (groupLoading) return <Loading />;
    if (groupError) return (
        <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: 16, borderRadius: 12 }}>
            Xatolik: {groupError?.data?.message || "Noma'lum xatolik"}
        </div>
    );

    const initials = (group?.name || "?").slice(0, 2).toUpperCase();

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><Users size={18} /></span>
                    Guruh profili
                </div>
            </div>

            {/* Group info card */}
            <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--shadow-md)', marginBottom: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: 14, flexShrink: 0,
                        background: 'var(--accent-soft)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', fontWeight: 700, border: '2px solid var(--card-border)',
                    }}>
                        {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                            {group?.name}
                        </h2>
                        {group?.homeroom_teacher && (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                                <User size={13} /> Sinf rahbari: <strong style={{ color: 'var(--text-primary)' }}>{group.homeroom_teacher.full_name}</strong>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                            {group?.start_date && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={13} style={{ color: 'var(--accent)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Boshlanish</div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                            {new Date(group.start_date).toLocaleDateString('uz-UZ')}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {group?.homeroom_teacher?.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={13} style={{ color: 'var(--accent)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Telefon</div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                            {group.homeroom_teacher.phone}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Teachers */}
            <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--shadow-sm)', marginBottom: 16,
            }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={13} style={{ color: 'var(--accent)' }} />
                    </span>
                    O'qituvchilar
                </h3>
                {teachersLoading ? <Loading /> : teachers.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>
                        O'qituvchilar yo'q
                    </p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                        {teachers.map(item => (
                            <div key={item.id} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 14px', borderRadius: 10,
                                background: 'var(--input-bg)', border: '1px solid var(--card-border)',
                            }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <User size={14} style={{ color: 'var(--accent)' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {item.teacher?.full_name || "Noma'lum"}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {item.teacher?.username || ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Students + attendance */}
            <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--shadow-sm)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={13} style={{ color: 'var(--accent)' }} />
                        </span>
                        O'quvchilar
                    </h3>
                    <button
                        onClick={handleSave}
                        disabled={!dirty || saving}
                        className="btn-submit"
                        style={{ opacity: (!dirty || saving) ? 0.4 : 1 }}
                    >
                        <Save size={14} /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                </div>

                {students.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '30px 0' }}>
                        O'quvchilar yo'q
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Table header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, padding: '8px 12px', borderBottom: '1px solid var(--card-border)' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>O'quvchi</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Davomat</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Baho</span>
                        </div>

                        {students.map(s => {
                            const curAtt = attendance[s.id];
                            const curGrade = grades[s.id];
                            return (
                                <div key={s.id} style={{
                                    display: 'grid', gridTemplateColumns: '1fr auto auto',
                                    gap: 12, alignItems: 'center', padding: '10px 12px',
                                    borderRadius: 10, transition: 'background 0.15s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-soft)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <User size={14} style={{ color: 'var(--accent)' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.full_name}</div>
                                            {s.phone && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.phone}</div>}
                                        </div>
                                    </div>

                                    {/* Attendance */}
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {ATTENDANCE.map(({ value, label, icon: Icon, color, bg }) => {
                                            const active = curAtt === value;
                                            return (
                                                <button key={value} title={label} onClick={() => { setAttendance(p => ({ ...p, [s.id]: value })); setDirty(true); }}
                                                    style={{
                                                        width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${active ? color : 'var(--card-border)'}`,
                                                        background: active ? bg : 'var(--input-bg)',
                                                        color: active ? color : 'var(--text-muted)',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                                                    }}>
                                                    <Icon size={13} />
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Grades */}
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {GRADES.map(g => {
                                            const active = curGrade === g;
                                            return (
                                                <button key={g} onClick={() => { setGrades(p => ({ ...p, [s.id]: g })); setDirty(true); }}
                                                    style={{
                                                        width: 30, height: 30, borderRadius: 7,
                                                        border: `1.5px solid ${active ? 'var(--accent)' : 'var(--card-border)'}`,
                                                        background: active ? 'var(--accent)' : 'var(--input-bg)',
                                                        color: active ? '#fff' : 'var(--text-secondary)',
                                                        fontSize: '0.78rem', fontWeight: 600,
                                                        cursor: 'pointer', transition: 'all 0.15s',
                                                    }}>
                                                    {g}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
