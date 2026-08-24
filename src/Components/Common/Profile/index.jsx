import { useGetUserByIdQuery } from '../../../store/services/user.api';
import { User, Phone, AtSign, Calendar, Clock, Shield, BookOpen, Users, GraduationCap, CalendarDays, ListChecks } from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const ROLE_MAP = {
    super_admin: "Super Admin",
    admin: "Administrator",
    teacher: "O'qituvchi",
    hr: "HR",
    parent: "Ota-ona",
    cashier: "Kassir",
};

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

function ListSection({ title, items, icon: Icon }) {
    if (!items || items.length === 0) return null;
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={13} style={{ color: 'var(--accent)' }} />
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
                <span style={{ fontSize: '0.72rem', background: 'var(--accent-soft)', color: 'var(--accent)', padding: '1px 8px', borderRadius: 99, fontWeight: 600 }}>
                    {items.length}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((item, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderRadius: 9, background: 'var(--input-bg)', border: '1px solid var(--card-border)', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        {item?.name || item?.title || item?.groupName || `Element ${i + 1}`}
                    </div>
                ))}
            </div>
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
    const initials = (user?.full_name || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
    const role = ROLE_MAP[user?.role] || user?.role || "Foydalanuvchi";

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><User size={18} /></span>
                    Mening profilim
                </div>
            </div>

            {/* Main info */}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Shield size={13} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>{role}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, borderTop: '1px solid var(--card-border)', paddingTop: 20 }}>
                    <InfoRow icon={AtSign}   label="Username"           value={user?.username} />
                    <InfoRow icon={Phone}    label="Telefon"            value={user?.phone} />
                    <InfoRow icon={Calendar} label="Ro'yxatdan o'tgan" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('uz-UZ') : null} />
                    <InfoRow icon={Clock}    label="Yangilanish"       value={user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('uz-UZ') : null} />
                </div>
            </div>

            {/* Lists */}
            {(user?.teacher_subjects?.length > 0 || user?.homeroom_groups?.length > 0 || user?.teacher_groups?.length > 0) && (
                <div style={{
                    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                    borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--shadow-sm)',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24,
                }}>
                    <ListSection title="O'qituvchi fanlari"       items={user?.teacher_subjects}   icon={BookOpen} />
                    <ListSection title="Sinf rahbari guruhlari"   items={user?.homeroom_groups}    icon={GraduationCap} />
                    <ListSection title="O'qituvchi guruhlari"     items={user?.teacher_groups}     icon={Users} />
                    <ListSection title="Jadvallar"                items={user?.group_schedules}    icon={CalendarDays} />
                    <ListSection title="Haftalik mavzular"        items={user?.weekly_topics}      icon={ListChecks} />
                </div>
            )}
        </div>
    );
}
