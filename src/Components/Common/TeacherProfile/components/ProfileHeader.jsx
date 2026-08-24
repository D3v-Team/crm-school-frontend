import { User, Shield, Phone, AtSign, Calendar } from 'lucide-react';

const ROLE_MAP = {
    teacher: "O'qituvchi",
    admin: "Administrator",
    super_admin: "Super Admin",
    hr: "HR",
    cashier: "Kassir",
};

export default function ProfileHeader({ user }) {
    if (!user) return null;

    const initials = (user.full_name || "?")
        .split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

    const role = ROLE_MAP[user.role] || user.role || "Foydalanuvchi";

    const meta = [
        { icon: Phone,    label: "Telefon",    value: user.phone    },
        { icon: AtSign,   label: "Username",   value: user.username },
        { icon: Calendar, label: "Ro'yxatdan", value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('uz-UZ') : null },
    ].filter(m => m.value);

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
                width: 72, height: 72, borderRadius: 18, flexShrink: 0,
                background: 'var(--accent-soft)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700, border: '2px solid var(--card-border)',
            }}>
                {initials || <User size={32} />}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                    {user.full_name || "—"}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <Shield size={13} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>{role}</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {meta.map(({ icon: Icon, label, value }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={13} style={{ color: 'var(--accent)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1 }}>{label}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>{value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
