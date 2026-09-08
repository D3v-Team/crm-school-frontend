import { useState } from 'react';
import { useSendPaymentReminderMutation } from '../../../store/services/bot.api';
import { useGetGroupsQuery } from '../../../store/services/group.api';
import { Alert } from '../../Other/UI/Alert/Alert';
import { Bell, CheckCircle, ChevronDown, DollarSign, MessageSquare } from 'lucide-react';

const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid var(--input-border)', background: 'var(--input-bg)',
    color: 'var(--input-text)', fontSize: '0.875rem', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
    appearance: 'none', paddingRight: 36, cursor: 'pointer',
};

export default function CashierPaymentReminder() {
    const [groupId, setGroupId] = useState('');
    const [sent, setSent] = useState(false);

    const { data: groupsData, isLoading: gl } = useGetGroupsQuery({ limit: 200 });
    const groups = groupsData?.data?.records || [];

    const [sendReminder, { isLoading }] = useSendPaymentReminderMutation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupId) { Alert("Guruh tanlanishi kerak", 'error'); return; }
        try {
            await sendReminder({ group_id: groupId }).unwrap();
            Alert("To'lov eslatmasi yuborildi", 'success');
            setSent(true);
            setTimeout(() => setSent(false), 3000);
            setGroupId('');
        } catch (err) {
            Alert(err?.data?.message || 'Xatolik yuz berdi', 'error');
        }
    };

    return (
        <div>
            {/* Page header */}
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><MessageSquare size={18} /></span>
                    To'lov eslatmasi
                </div>
            </div>

            {/* Card */}
            <div style={{
                maxWidth: 480,
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 16,
                overflow: 'hidden',
            }}>
                {/* Card header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--card-border)',
                    display: 'flex', alignItems: 'center', gap: 12,
                }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 11,
                        background: '#f59e0b18',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <DollarSign size={19} style={{ color: '#f59e0b' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            To'lov eslatmasi
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Guruh bo'yicha qarzdor ota-onalarga eslatma yuborish
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                            Guruh *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={groupId}
                                onChange={e => setGroupId(e.target.value)}
                                disabled={gl}
                                style={inputStyle}
                                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
                            >
                                <option value="">— Guruh tanlang —</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={15} style={{
                                position: 'absolute', right: 10, top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)', pointerEvents: 'none',
                            }} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !groupId}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            padding: '11px 0', borderRadius: 10, border: 'none',
                            background: '#f59e0b', color: '#fff',
                            fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                            opacity: (isLoading || !groupId) ? 0.5 : 1, transition: 'opacity 0.15s',
                        }}
                    >
                        {sent
                            ? <><CheckCircle size={16} /> Yuborildi!</>
                            : isLoading
                                ? 'Yuborilmoqda...'
                                : <><Bell size={15} /> Eslatma yuborish</>
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}
