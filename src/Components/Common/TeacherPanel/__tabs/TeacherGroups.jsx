import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useLazyGetTeacherGroupsByTeacherIdQuery } from '../../../../store/services/theacher-group.api';
import { Layers, Users, Eye, Book, User } from 'lucide-react';
import Loading from '../../../Other/UI/Loadings/Loading';

export default function TeacherGroups({ teacherId }) {
    const [fetchGroups, { data, isLoading, error }] = useLazyGetTeacherGroupsByTeacherIdQuery();

    useEffect(() => {
        if (teacherId) fetchGroups(teacherId);
    }, [teacherId]);

    const groups = data?.data?.records || data?.data || [];

    if (isLoading) return <Loading />;
    if (error) return (
        <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10 }}>
            Xatolik: {error?.data?.message}
        </div>
    );

    if (groups.length === 0) return (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Layers size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }} />
            <p>Guruhlar topilmadi</p>
        </div>
    );

    return (
        <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Jami <strong style={{ color: 'var(--text-primary)' }}>{groups.length}</strong> ta guruh
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 10 }}>
                {groups.map(item => {
                    const group = item.group || item;
                    const subjectName = item.subject?.name || group.subject?.name;
                    const initials = (group?.name || '?').slice(0, 2).toUpperCase();
                    return (
                        <div key={item.id} style={{
                            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                            borderRadius: 12, padding: '13px 14px',
                            display: 'flex', flexDirection: 'column', gap: 10,
                            transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'var(--accent)';
                                e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--card-border)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: 'var(--accent-soft)', color: 'var(--accent)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.82rem', fontWeight: 700, flexShrink: 0,
                                    border: '2px solid var(--card-border)',
                                }}>
                                    {initials}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                        {group?.name || '—'}
                                    </div>
                                    {subjectName && (
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                            <Book size={11} /> {subjectName}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {group?.start_date && (
                                    <span style={{
                                        fontSize: '0.66rem', padding: '2px 7px', borderRadius: 6,
                                        background: 'var(--input-bg)', color: 'var(--text-muted)',
                                        border: '1px solid var(--card-border)',
                                    }}>
                                        {new Date(group.start_date).toLocaleDateString('uz-UZ')}
                                    </span>
                                )}
                                {group?.students?.length != null && (
                                    <span style={{
                                        fontSize: '0.66rem', padding: '2px 7px', borderRadius: 6,
                                        background: 'var(--accent-soft)', color: 'var(--accent)',
                                        border: '1px solid var(--card-border)',
                                        display: 'flex', alignItems: 'center', gap: 4,
                                    }}>
                                        <Users size={10} /> {group.students.length} ta
                                    </span>
                                )}
                            </div>

                            {group?.homeroom_teacher && String(group.homeroom_teacher.id) !== String(teacherId) && (() => {
                                const classTeacher = group.homeroom_teacher;
                                return (
                                    <div style={{ padding: '7px 9px', borderRadius: 8, background: 'var(--accent-soft)', border: '1px solid var(--card-border)', display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                                        <User size={12} style={{ color:'var(--accent)', flexShrink:0 }} />
                                        <div style={{ minWidth:0 }}>
                                            <div style={{ fontSize: '0.61rem', color: 'var(--text-muted)', lineHeight:1.1 }}>Sinf rahbari</div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{classTeacher.full_name || classTeacher.name || '—'}</div>
                                        </div>
                                        {classTeacher.phone && <span style={{ marginLeft:'auto', fontSize: '0.64rem', color: 'var(--text-secondary)', whiteSpace:'nowrap' }}>{classTeacher.phone}</span>}
                                    </div>
                                );
                            })()}

                            <NavLink to={`/group/${group?.id}`} style={{ textDecoration: 'none' }}>
                                <button style={{
                                    width: '100%', padding: '7px 10px', borderRadius: 8,
                                    border: '1.5px solid var(--card-border)', background: 'var(--input-bg)',
                                    color: 'var(--text-secondary)', cursor: 'pointer',
                                    fontSize: '0.74rem', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    transition: 'all 0.15s',
                                }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'var(--accent)';
                                        e.currentTarget.style.color = 'var(--accent)';
                                        e.currentTarget.style.background = 'var(--accent-soft)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'var(--card-border)';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                        e.currentTarget.style.background = 'var(--input-bg)';
                                    }}
                                >
                                    <Eye size={13} /> Ko'rish
                                </button>
                            </NavLink>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
