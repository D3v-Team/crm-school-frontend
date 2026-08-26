import { useGetUserByIdQuery } from '../../../store/services/user.api';
import { User, Phone, AtSign, Calendar, Clock, Shield, BookOpen, Users } from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const ROLE_MAP = {
    super_admin: 'Super Admin',
    admin: 'Administrator',
    teacher: "O'qituvchi",
    hr: 'HR',
    parent: 'Ota-ona',
    cashier: 'Kassir',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : null;

function InfoRow({ icon: Icon, label, value }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1 }}>{label}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>{value}</div>
            </div>
        </div>
    );
}

/* ── O'qituvchi guruhlari — katta chiroyli cardlar ── */
function TeacherGroupsSection({ items }) {
    if (!items?.length) return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ opacity: .2, margin: '0 auto 10px', display: 'block' }} />
            <p style={{ fontSize: '0.875rem' }}>Guruh biriktirilmagan</p>
        </div>
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {items.map((item) => {
                const group   = item.group   || item;
                const subject = item.subject || group.subject;
                const name = group?.name || '';
                const initials = name ? name.slice(0, 2).toUpperCase() : 'GR';                const studentCount = group?.students?.length ?? group?.student_count ?? null;

                return (
                    <div key={item.id} style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--card-border)',
                        borderRadius: 16,
                        padding: '18px 20px',
                        display: 'flex', flexDirection: 'column', gap: 12,
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
                        {/* Avatar + name + subject */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 13,
                                background: 'var(--accent-soft)', color: 'var(--accent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem', fontWeight: 800, flexShrink: 0,
                                border: '2px solid var(--card-border)',
                            }}>
                                {initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {group?.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Noma'lum guruh</span>}
                                </div>
                                {subject?.name && (
                                    <div style={{ fontSize: '0.73rem', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <BookOpen size={11} /> {subject.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                            {group?.start_date && (
                                <span style={{ fontSize: '0.70rem', padding: '2px 9px', borderRadius: 7, background: 'var(--input-bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)' }}>
                                    📅 {new Date(group.start_date).toLocaleDateString('uz-UZ')}
                                </span>
                            )}
                            {studentCount != null && (
                                <span style={{ fontSize: '0.70rem', padding: '2px 9px', borderRadius: 7, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Users size={10} /> {studentCount} o'quvchi
                                </span>
                            )}
                            {group?.status && (
                                <span style={{
                                    fontSize: '0.70rem', padding: '2px 9px', borderRadius: 7, fontWeight: 600,
                                    background: group.status === 'active' ? 'var(--success-soft)' : 'var(--warning-soft)',
                                    color: group.status === 'active' ? 'var(--success)' : 'var(--warning)',
                                    border: '1px solid var(--card-border)',
                                }}>
                                    {group.status === 'active' ? '✓ Faol' : group.status}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function Profile() {
    const userId = getCookie('userId');
    const { data, isLoading, error } = useGetUserByIdQuery(userId, { skip: !userId });

    if (!userId) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <User size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p>Kirish talab qilinadi</p>
            </div>
        </div>
    );

    if (isLoading) return <Loading />;
    if (error) return (
        <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: 16, borderRadius: 12 }}>
            Xatolik: {error?.data?.message || "Noma'lum xatolik"}
        </div>
    );

    const user = data?.data || data;
    const rawName = user?.full_name || '';
    const initials = rawName
        ? rawName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
        : (user?.username?.[0] || 'U').toUpperCase();
    const role = ROLE_MAP[user?.role] || user?.role || 'Foydalanuvchi';
    const isTeacher = user?.role === 'teacher';

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><User size={18} /></span>
                    Mening profilim
                </div>
            </div>

            {/* Main info card */}
            <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: 16, padding: '24px', boxShadow: 'var(--shadow-md)', marginBottom: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
                    <div style={{
                        width: 70, height: 70, borderRadius: 18, flexShrink: 0,
                        background: 'var(--accent-soft)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem', fontWeight: 700, border: '2px solid var(--card-border)',
                    }}>
                        {initials}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                            {user?.full_name || "Noma'lum"}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Shield size={13} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>{role}</span>
                            {user?.school?.name && (
                                <>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>·</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{user.school.name}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, borderTop: '1px solid var(--card-border)', paddingTop: 20 }}>
                    <InfoRow icon={AtSign}   label="Username"           value={user?.username} />
                    <InfoRow icon={Phone}    label="Telefon"            value={user?.phone} />
                    <InfoRow icon={Calendar} label="Ro'yxatdan o'tgan" value={fmtDate(user?.createdAt)} />
                    <InfoRow icon={Clock}    label="Yangilanish"        value={fmtDate(user?.updatedAt)} />
                </div>
            </div>

            {/* Teacher groups section */}
            {isTeacher && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                

                    {/* Sinf rahbari guruhlari */}
                    {user?.homeroom_groups !== undefined && (
                        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={15} style={{ color: 'var(--accent)' }} />
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Sinf rahbari guruhlari
                                </span>
                                {user?.homeroom_groups?.length > 0 && (
                                    <span style={{ fontSize: '0.72rem', background: 'var(--accent-soft)', color: 'var(--accent)', padding: '1px 8px', borderRadius: 99, fontWeight: 600 }}>
                                        {user.homeroom_groups.length}
                                    </span>
                                )}
                            </div>
                            {!user?.homeroom_groups?.length ? (
                                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    Yo'q
                                </div>
                            ) : (
                                <TeacherGroupsSection items={user.homeroom_groups} />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
