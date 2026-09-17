import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetGroupsQuery } from '../../../store/services/group.api';
import { Alert } from '../../Other/UI/Alert/Alert';
import {
    Bell, CheckCircle, ChevronDown, DollarSign,
    MessageSquare, Users, AlertCircle,
} from 'lucide-react';
import $api from '../../../store/api';

const MONTHS = [
    'Yanvar','Fevral','Mart','Aprel','May','Iyun',
    'Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr',
];

const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid var(--input-border)', background: 'var(--input-bg)',
    color: 'var(--input-text)', fontSize: '0.875rem', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
    appearance: 'none', paddingRight: 36, cursor: 'pointer',
};
const labelStyle = {
    fontSize: '0.78rem', fontWeight: 600,
    color: 'var(--text-secondary)', display: 'block', marginBottom: 6,
};

export default function CashierPaymentReminder() {
    const now   = new Date();
    const role  = useSelector(s => s.auth?.role);

    const [groupId,     setGroupId]     = useState('');
    const [year,        setYear]        = useState(now.getFullYear());
    const [month,       setMonth]       = useState(now.getMonth() + 1);
    const [onlyDebtors, setOnlyDebtors] = useState(true);
    const [loading,     setLoading]     = useState(false);
    const [sent,        setSent]        = useState(false);

    const { data: groupsData, isLoading: gl } = useGetGroupsQuery({ limit: 200 });
    const groups = groupsData?.data?.records || [];

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupId) { Alert('Guruh tanlanishi kerak', 'error'); return; }
        setLoading(true);
        try {
            await $api.post('/payment/reminder', {
                group_id: groupId,
                year,
                month,
                only_debtors: onlyDebtors,
            });
            Alert("To'lov eslatmasi yuborildi", 'success');
            setSent(true);
            setTimeout(() => setSent(false), 3500);
        } catch (err) {
            Alert(err?.response?.data?.message || 'Xatolik yuz berdi', 'error');
        } finally {
            setLoading(false);
        }
    };

    /* Preview matn */
    const previewDebtors = `⚠️ To'lov eslatmasi\n\nHurmatli Aliyev Vali,\n*Aliyev Sardor* uchun ${month}-oy (${year}) to'lovi kutilmoqda.\n💰 Qarzdorlik: 1 200 000 so'm\nIltimos, o'z vaqtida amalga oshiring.`;
    const previewAll     = `⚠️ To'lov eslatmasi\n\nHurmatli Aliyev Vali,\n*Aliyev Sardor* uchun ${month}-oy (${year}) to'lovi kutilmoqda.\nIltimos, o'z vaqtida amalga oshiring.`;

    return (
        <div>
            {/* Page header */}
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><MessageSquare size={18}/></span>
                    To'lov eslatmasi
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>

                {/* ── Form card ── */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, overflow: 'hidden' }}>
                    {/* Card header */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f59e0b18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <DollarSign size={19} style={{ color: '#f59e0b' }}/>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Eslatma yuborish
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                Guruh bo'yicha ota-onalarga Telegram eslatmasi
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Group */}
                        <div>
                            <label style={labelStyle}>Guruh *</label>
                            <div style={{ position: 'relative' }}>
                                <select value={groupId} onChange={e => setGroupId(e.target.value)}
                                    disabled={gl} style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                    onBlur={e  => e.target.style.borderColor = 'var(--input-border)'}>
                                    <option value="">— Guruh tanlang —</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                                <ChevronDown size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}/>
                            </div>
                        </div>

                        {/* Year + Month */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={labelStyle}>Yil</label>
                                <div style={{ position: 'relative' }}>
                                    <select value={year} onChange={e => setYear(+e.target.value)} style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                        onBlur={e  => e.target.style.borderColor = 'var(--input-border)'}>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <ChevronDown size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}/>
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Oy</label>
                                <div style={{ position: 'relative' }}>
                                    <select value={month} onChange={e => setMonth(+e.target.value)} style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                        onBlur={e  => e.target.style.borderColor = 'var(--input-border)'}>
                                        {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                    </select>
                                    <ChevronDown size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}/>
                                </div>
                            </div>
                        </div>

                        {/* Only debtors toggle */}
                        <div>
                            <label style={labelStyle}>Kimga yuborish?</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {/* Only debtors */}
                                <button type="button" onClick={() => setOnlyDebtors(true)}
                                    style={{
                                        flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                                        border: `2px solid ${onlyDebtors ? '#f59e0b' : 'var(--card-border)'}`,
                                        background: onlyDebtors ? '#f59e0b18' : 'var(--input-bg)',
                                        color: onlyDebtors ? '#f59e0b' : 'var(--text-muted)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                                        fontWeight: onlyDebtors ? 700 : 500, fontSize: '0.78rem',
                                        transition: 'all 0.14s',
                                    }}>
                                    <AlertCircle size={16}/>
                                    Faqat qarzdorlar
                                </button>
                                {/* All */}
                                <button type="button" onClick={() => setOnlyDebtors(false)}
                                    style={{
                                        flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                                        border: `2px solid ${!onlyDebtors ? 'var(--accent)' : 'var(--card-border)'}`,
                                        background: !onlyDebtors ? 'var(--accent-soft)' : 'var(--input-bg)',
                                        color: !onlyDebtors ? 'var(--accent)' : 'var(--text-muted)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                                        fontWeight: !onlyDebtors ? 700 : 500, fontSize: '0.78rem',
                                        transition: 'all 0.14s',
                                    }}>
                                    <Users size={16}/>
                                    Barcha ota-onalar
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={loading || !groupId}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '11px 0', borderRadius: 10, border: 'none',
                                background: '#f59e0b', color: '#fff',
                                fontSize: '0.875rem', fontWeight: 600, cursor: loading || !groupId ? 'not-allowed' : 'pointer',
                                opacity: (loading || !groupId) ? 0.5 : 1, transition: 'opacity 0.15s',
                            }}>
                            {sent
                                ? <><CheckCircle size={16}/> Yuborildi!</>
                                : loading
                                    ? 'Yuborilmoqda...'
                                    : <><Bell size={15}/> Eslatma yuborish</>
                            }
                        </button>
                    </form>
                </div>

                {/* ── Preview card ── */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Xabar ko'rinishi</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {onlyDebtors ? 'Faqat qarzdorlarga' : 'Barcha ota-onalarga'} yuboriladi
                        </div>
                    </div>
                    <div style={{ padding: '18px 20px' }}>
                        {/* Telegram-style dark bubble */}
                        <div style={{ background: '#17212b', borderRadius: 12, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 99, background: '#2b5278', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>B</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>Bot</div>
                            </div>
                            <div style={{
                                background: '#182533', borderRadius: '4px 12px 12px 12px',
                                padding: '10px 14px', maxWidth: 300,
                                color: '#e8eaed', fontSize: '0.82rem', lineHeight: 1.6,
                                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            }}>
                                {onlyDebtors ? previewDebtors : previewAll}
                                <div style={{ textAlign: 'right', fontSize: '0.62rem', color: '#6b8dad', marginTop: 4 }}>
                                    {now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} ✓✓
                                </div>
                            </div>
                        </div>

                        {/* Info note */}
                        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 9, background: 'var(--input-bg)', border: '1px solid var(--card-border)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            {onlyDebtors
                                ? '⚠️ Faqat joriy oy to\'lovi amalga oshirilmagan ota-onalarga yuboriladi. Xabarda qarzdorlik miqdori ko\'rsatiladi.'
                                : '📢 Guruhning barcha ota-onalariga yuboriladi. Xabarda to\'lov eslatmasi, miqdorsiz ko\'rsatiladi.'
                            }
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
