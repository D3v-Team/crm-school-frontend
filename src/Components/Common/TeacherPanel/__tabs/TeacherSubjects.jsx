import { useEffect } from 'react';
import { useLazyGetTeacherSubjectsByTeacherIdQuery } from '../../../../store/services/teacher-subject.api';
import { Book } from 'lucide-react';
import Loading from '../../../Other/UI/Loadings/Loading';

export default function TeacherSubjects({ teacherId }) {
    const [fetchSubjects, { data, isLoading, error }] = useLazyGetTeacherSubjectsByTeacherIdQuery();

    useEffect(() => {
        if (teacherId) fetchSubjects(teacherId);
    }, [teacherId]);

    const subjects = data?.data?.records || data?.data || [];

    if (isLoading) return <Loading />;
    if (error) return (
        <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10 }}>
            Xatolik: {error?.data?.message}
        </div>
    );

    if (subjects.length === 0) return (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Book size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }} />
            <p>Fan biriktirilmagan</p>
        </div>
    );

    return (
        <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Jami <strong style={{ color: 'var(--text-primary)' }}>{subjects.length}</strong> ta fan
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {subjects.map(item => {
                    const subject = item.subject || item;
                    return (
                        <div key={item.id} style={{
                            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                            borderRadius: 14, padding: '16px 18px',
                            display: 'flex', alignItems: 'center', gap: 14,
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
                            <div style={{
                                width: 42, height: 42, borderRadius: 11,
                                background: 'var(--accent-soft)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <Book size={18} style={{ color: 'var(--accent)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                                    {subject?.name || '—'}
                                </div>
                                {subject?.description && (
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {subject.description}
                                    </div>
                                )}
                                {item.created_at && (
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        {new Date(item.created_at).toLocaleDateString('uz-UZ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
