import { useEffect, useState } from 'react';
import { useLazyGetGroupScheduleByTeacherQuery } from '../../../../store/services/group-schedule.api';
import { CalendarDays, Clock, Layers, Book, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import Loading from '../../../Other/UI/Loadings/Loading';

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = {
    monday: 'Dushanba', tuesday: 'Seshanba', wednesday: 'Chorshanba',
    thursday: 'Payshanba', friday: 'Juma', saturday: 'Shanba',
};
const DAY_SHORT = { monday: 'DU', tuesday: 'SE', wednesday: 'CH', thursday: 'PA', friday: 'JU', saturday: 'SH' };
const JS_DAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const toMins = (t) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };

const fmtDate = (d) => {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};

const PALETTE = [
    '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4',
];
const colorFor = (id) => {
    if (!id) return PALETTE[0];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % PALETTE.length;
    return PALETTE[h];
};

export default function TeacherSchedule({ teacherId }) {
    const [selectedDate, setSelectedDate] = useState(fmtDate(new Date()));
    const [trigger, { data, isLoading, error }] = useLazyGetGroupScheduleByTeacherQuery();

    const load = (date) => {
        if (teacherId) trigger({ teacherId, date });
    };

    useEffect(() => { load(selectedDate); }, [teacherId, selectedDate]);

    const allSchedule = data?.data?.records || data?.data || [];

    // Group by day_of_week
    const scheduleByDay = DAYS_ORDER.reduce((acc, day) => {
        acc[day] = allSchedule
            .filter(s => s.day_of_week === day)
            .sort((a, b) => toMins(a.start_time) - toMins(b.start_time));
        return acc;
    }, {});

    const todayKey = JS_DAY[new Date(selectedDate).getDay()];

    const changeDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(fmtDate(d));
    };

    if (isLoading) return <Loading />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Date selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                    onClick={() => changeDate(-7)}
                    style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <ChevronLeft size={16} />
                </button>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="search-input"
                    style={{ paddingLeft: 14, width: 160 }}
                />
                <button
                    onClick={() => changeDate(7)}
                    style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    onClick={() => { setSelectedDate(fmtDate(new Date())); load(fmtDate(new Date())); }}
                    className="search-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <RefreshCw size={13} /> Bugun
                </button>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Haftalik jadval · {new Date(selectedDate).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })}
                </span>
            </div>

            {error && (
                <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10 }}>
                    Xatolik: {error?.data?.message}
                </div>
            )}

            {/* Weekly grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                {DAYS_ORDER.map(day => {
                    const items = scheduleByDay[day] || [];
                    const isToday = day === todayKey;
                    return (
                        <div key={day} style={{
                            borderRadius: 14, overflow: 'hidden',
                            border: isToday ? '1.5px solid var(--accent)' : '1px solid var(--card-border)',
                            background: 'var(--card-bg)',
                            boxShadow: isToday ? '0 0 0 3px var(--accent-glow)' : 'none',
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 14px', borderBottom: '1px solid var(--card-border)',
                                background: isToday ? 'var(--accent-soft)' : 'transparent',
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 7,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.72rem', fontWeight: 700,
                                    background: isToday ? 'var(--accent)' : 'var(--input-bg)',
                                    color: isToday ? '#fff' : 'var(--text-muted)',
                                }}>
                                    {DAY_SHORT[day]}
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {DAY_LABELS[day]}
                                </span>
                                {isToday && (
                                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '1px 8px', borderRadius: 99 }}>
                                        Bugun
                                    </span>
                                )}
                                {items.length > 0 && (
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--input-bg)', padding: '1px 7px', borderRadius: 99, marginLeft: 'auto' }}>
                                        {items.length}
                                    </span>
                                )}
                            </div>

                            {items.length === 0 ? (
                                <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                    Dars yo'q
                                </div>
                            ) : (
                                <div>
                                    {items.map(item => {
                                        const clr = colorFor(item.subject_id || item.subject?.id);
                                        return (
                                            <div key={item.id} style={{
                                                display: 'flex', alignItems: 'flex-start', gap: 10,
                                                padding: '10px 14px', borderTop: '1px solid var(--card-border)',
                                            }}>
                                                <div style={{ width: 3, borderRadius: 99, background: clr, flexShrink: 0, alignSelf: 'stretch' }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Clock size={10} /> {item.start_time} – {item.end_time}
                                                    </div>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                                                        {item.subject?.name || '—'}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Layers size={10} /> {item.group?.name || '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
