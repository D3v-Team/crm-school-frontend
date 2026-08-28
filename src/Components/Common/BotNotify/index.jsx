import { useState, useRef, useEffect } from 'react';
import { useSendBroadcastMutation, useSendPaymentReminderMutation } from '../../../store/services/bot.api';
import { useGetGroupsQuery } from '../../../store/services/group.api';
import { Alert } from '../../Other/UI/Alert/Alert';
import {
    Send, Bell, Users, MessageSquare, DollarSign,
    CheckCircle, Image, X, Plus, Trash2, ChevronDown,
} from 'lucide-react';

/* ── shared styles ── */
const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid var(--input-border)', background: 'var(--input-bg)',
    color: 'var(--input-text)', fontSize: '0.875rem', outline: 'none',
    resize: 'vertical', transition: 'border-color 0.2s', boxSizing: 'border-box',
};
const labelStyle = {
    fontSize: '0.78rem', fontWeight: 600,
    color: 'var(--text-secondary)', display: 'block', marginBottom: 6,
};

/* ── Card wrapper ── */
function NotifyCard({ icon: Icon, color, title, description, children }) {
    return (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={19} style={{ color }} />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{description}</div>
                </div>
            </div>
            <div style={{ padding: '18px 20px' }}>{children}</div>
        </div>
    );
}

/* ── Broadcast Form ── */
function BroadcastForm() {
    const [text,     setText]     = useState('');
    const [photo,    setPhoto]    = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [buttons,  setButtons]  = useState([]); // [{text, url}]
    const [sent,     setSent]     = useState(false);
    const fileRef = useRef();

    const [sendBroadcast, { isLoading }] = useSendBroadcastMutation();

    const addButton = () => setButtons(b => [...b, { text: '', url: '' }]);
    const removeButton = (i) => setButtons(b => b.filter((_, idx) => idx !== i));
    const updateButton = (i, field, val) =>
        setButtons(b => b.map((btn, idx) => idx === i ? { ...btn, [field]: val } : btn));

    const handlePhoto = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
    };
    const removePhoto = () => {
        setPhoto(null);
        setPhotoPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) { Alert('Xabar matni majburiy', 'error'); return; }

        // Validate buttons
        const validButtons = buttons.filter(b => b.text.trim());

        const formData = new FormData();
        formData.append('text', text.trim());

        if (validButtons.length > 0) {
            // Convert to Telegram inline_keyboard format
            const inlineKeyboard = validButtons.map(b => ([{ text: b.text, url: b.url || undefined }]));
            formData.append('buttons', JSON.stringify(inlineKeyboard));
        }

        if (photo) formData.append('photo', photo);

        try {
            await sendBroadcast(formData).unwrap();
            Alert('Xabar muvaffaqiyatli yuborildi', 'success');
            setSent(true);
            setTimeout(() => setSent(false), 3000);
            setText(''); setButtons([]); removePhoto();
        } catch (err) {
            Alert(err?.data?.message || 'Xatolik yuz berdi', 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Text */}
            <div>
                <label style={labelStyle}>Xabar matni *</label>
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={5}
                    placeholder="Barcha foydalanuvchilarga yuboriladi..."
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                    {text.length} belgi
                </div>
            </div>

            {/* Photo */}
            <div>
                <label style={labelStyle}>Rasm (ixtiyoriy)</label>
                {photoPreview ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={photoPreview} alt="preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 10, border: '1.5px solid var(--card-border)' }} />
                        <button type="button" onClick={removePhoto} style={{
                            position: 'absolute', top: 6, right: 6,
                            width: 26, height: 26, borderRadius: 99, border: 'none',
                            background: 'rgba(0,0,0,0.6)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                        }}>
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button type="button" onClick={() => fileRef.current?.click()} style={{
                        width: '100%', padding: '20px', borderRadius: 10,
                        border: '1.5px dashed var(--card-border)', background: 'var(--input-bg)',
                        color: 'var(--text-muted)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontSize: '0.82rem', transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                        <Image size={16} /> Rasm yuklash
                    </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
            </div>

            {/* Inline buttons */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ ...labelStyle, margin: 0 }}>Inline tugmalar (ixtiyoriy)</label>
                    <button type="button" onClick={addButton} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 7, border: '1.5px solid var(--accent)',
                        background: 'var(--accent-soft)', color: 'var(--accent)',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    }}>
                        <Plus size={12} /> Tugma qo'shish
                    </button>
                </div>
                        {buttons.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {buttons.map((btn, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <input
                                            placeholder="Tugma matni"
                                            value={btn.text}
                                            onChange={e => updateButton(i, 'text', e.target.value)}
                                            style={{ ...inputStyle, padding: '8px 12px', resize: 'none', flex: '1 1 120px', minWidth: 0 }}
                                            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                            onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
                                        />
                                        <input
                                            placeholder="URL (ixtiyoriy)"
                                            value={btn.url}
                                            onChange={e => updateButton(i, 'url', e.target.value)}
                                            style={{ ...inputStyle, padding: '8px 12px', resize: 'none', flex: '2 1 160px', minWidth: 0 }}
                                            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                            onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
                                        />
                                        <button type="button" onClick={() => removeButton(i)} style={{
                                            width: 34, height: 34, borderRadius: 8, border: 'none',
                                            background: 'var(--danger-soft)', color: 'var(--danger)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', flexShrink: 0,
                                        }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
            </div>

            <button type="submit" disabled={isLoading || !text.trim()} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', borderRadius: 10, border: 'none',
                background: 'var(--accent)', color: '#fff',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                opacity: (isLoading || !text.trim()) ? 0.5 : 1, transition: 'opacity 0.15s',
            }}>
                {sent
                    ? <><CheckCircle size={16} /> Yuborildi!</>
                    : isLoading
                        ? 'Yuborilmoqda...'
                        : <><Send size={15} /> Yuborish</>
                }
            </button>
        </form>
    );
}

/* ── Payment Reminder Form ── */
function PaymentReminderForm() {
    const [groupId, setGroupId] = useState('');
    const [sent,    setSent]    = useState(false);

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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Group selector */}
            <div>
                <label style={labelStyle}>Guruh *</label>
                <div style={{ position: 'relative' }}>
                    <select
                        value={groupId}
                        onChange={e => setGroupId(e.target.value)}
                        disabled={gl}
                        style={{
                            ...inputStyle,
                            resize: 'none',
                            appearance: 'none',
                            paddingRight: 36,
                            cursor: 'pointer',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
                    >
                        <option value="">— Guruh tanlang —</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
            </div>

 

            <button type="submit" disabled={isLoading || !groupId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', borderRadius: 10, border: 'none',
                background: '#f59e0b', color: '#fff',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                opacity: (isLoading || !groupId) ? 0.5 : 1, transition: 'opacity 0.15s',
            }}>
                {sent
                    ? <><CheckCircle size={16} /> Yuborildi!</>
                    : isLoading
                        ? 'Yuborilmoqda...'
                        : <><Bell size={15} /> Eslatma yuborish</>
                }
            </button>
        </form>
    );
}

/* ── Main Page ── */
export default function BotNotify() {
    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><MessageSquare size={18} /></span>
                    Bot xabarnomalar
                </div>
            </div>

        

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                <NotifyCard
                    icon={Users}
                    color="var(--accent)"
                    title="Ommaviy xabar (Broadcast)"
                    description="Barcha foydalanuvchilarga xabar, rasm va inline tugmalar bilan yuborish"
                >
                    <BroadcastForm />
                </NotifyCard>

                <NotifyCard
                    icon={DollarSign}
                    color="#f59e0b"
                    title="To'lov eslatmasi"
                    description="Guruh bo'yicha qarzdor ota-onalarga eslatma yuborish"
                >
                    <PaymentReminderForm />
                </NotifyCard>
            </div>
        </div>
    );
}
