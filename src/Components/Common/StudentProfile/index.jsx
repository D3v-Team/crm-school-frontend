import { useParams } from "react-router-dom";
import { useGetStudentByIdQuery } from "../../../store/services/student.api";
import { User, Phone, Users, DollarSign, Calendar, AtSign, CheckCircle, XCircle } from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";

export default function StudentProfile() {
    const { id } = useParams();
    const { data, isLoading, error } = useGetStudentByIdQuery(id, { skip: !id });

    const student = data?.data || data;

    if (isLoading) return <Loading />;
    if (error) return (
        <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: 16, borderRadius: 12 }}>
            Xatolik: {error?.data?.message || "Noma'lum xatolik"}
        </div>
    );
    if (!student) return null;

    const initials = (student.full_name || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

    const meta = [
        { icon: Phone,      label: "Telefon",  value: student.phone },
        { icon: DollarSign, label: "To'lov",   value: student.price ? Number(student.price).toLocaleString('ru-RU') + " so\u2018m" : null },
        { icon: Users,      label: "Guruh",    value: student.group?.name || student.group_name },
        { icon: User,       label: "Ota-ona",  value: student.parent?.full_name || student.parent_name },
        { icon: Calendar,   label: "Qo'shilgan", value: student.createdAt ? new Date(student.createdAt).toLocaleDateString('uz-UZ') : null },
    ].filter(m => m.value);

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><User size={18} /></span>
                    O'quvchi profili
                </div>
            </div>

            {/* Main info card */}
            <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: 16, padding: '24px', boxShadow: 'var(--shadow-md)', marginBottom: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
                    {/* Avatar */}
                    <div style={{
                        width: 68, height: 68, borderRadius: 16, flexShrink: 0,
                        background: 'var(--accent-soft)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem', fontWeight: 700, border: '2px solid var(--card-border)',
                    }}>
                        {initials}
                    </div>

                    <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {student.full_name}
                            </h2>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 10px', borderRadius: 99,
                                fontSize: '0.72rem', fontWeight: 600,
                                background: student.is_active ? 'var(--success-soft)' : 'var(--danger-soft)',
                                color: student.is_active ? 'var(--success)' : 'var(--danger)',
                            }}>
                                {student.is_active
                                    ? <><CheckCircle size={11} /> Faol</>
                                    : <><XCircle size={11} /> Nofaol</>
                                }
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12 }}>
                            {meta.map(({ icon: Icon, label, value }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            </div>

            {/* Parent info */}
            {student.parent && (
                <div style={{
                    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                    borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--shadow-sm)',
                }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={13} style={{ color: 'var(--accent)' }} />
                        </span>
                        Ota-ona ma'lumotlari
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        {[
                            { label: "Ism",    value: student.parent.full_name },
                            { label: "Telefon", value: student.parent.phone },
                            { label: "Username", value: student.parent.username },
                        ].filter(i => i.value).map(({ label, value }) => (
                            <div key={label} style={{ minWidth: 140 }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
