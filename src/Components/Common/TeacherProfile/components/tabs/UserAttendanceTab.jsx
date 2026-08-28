import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLazyGetUserAttendancePageQuery } from '../../../../../store/services/user-attendance.api';
import {
    Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Download, Camera, LogIn, LogOut, CalendarDays,
} from 'lucide-react';
import Loading from '../../../../Other/UI/Loadings/Loading';
import $api from '../../../../../store/api';

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

const DAY_LABELS = {
    0: 'Yakshanba', 1: 'Dushanba', 2: 'Seshanba', 3: 'Chorshanba',
    4: 'Payshanba', 5: 'Juma', 6: 'Shanba',
};

const MONTH_LABELS = [
    'Yanvar','Fevral','Mart','Aprel','May','Iyun',
    'Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr',
];

/* ISO string yoki "HH:MM" ni "HH:MM" ga parse qiladi */
function parseTime(val) {
    if (!val) return '—';
    if (val.includes('T') || val.includes('Z')) {
        const d = new Date(val);
        return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return val;
}

function fmtDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return {
        day: d.getDate(),
        month: MONTH_LABELS[d.getMonth()],
        year: d.getFullYear(),
        weekday: DAY_LABELS[d.getDay()],
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
    };
}

/* ── Single day card ── */
function DayCard({ record }) {
    const date  = record?.date;
    const times = record?.records || record?.entries || [];
    const df    = fmtDate(date);
    const ins   = times.filter(r => r.type === 'IN');
    const outs  = times.filter(r => r.type === 'OUT');

    return (
        <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 12,
            overflow: 'hidden',
        }}>
            {/* Date header */}
            <div style={{
                background: df.isWeekend ? 'var(--danger-soft)' : 'var(--accent-soft)',
                borderBottom: '1px solid var(--card-border)',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: df.isWeekend ? 'var(--danger)' : 'var(--accent)',
                        lineHeight: 1,
                    }}>
                        {df.day}
                    </span>
                    <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: df.isWeekend ? 'var(--danger)' : 'var(--accent)' }}>
                            {df.month}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                            {df.weekday}
                        </div>
                    </div>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    fontSize: '0.62rem', fontWeight: 600,
                    padding: '2px 7px', borderRadius: 99,
                    background: times.length > 0 ? 'var(--success-soft)' : 'var(--input-bg)',
                    color: times.length > 0 ? 'var(--success)' : 'var(--text-muted)',
                }}>
                    <Clock size={9} />
                    {times.length}
                </div>
            </div>

            {/* IN / OUT */}
            <div style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
                {/* Kirdi */}
                <div style={{
                    flex: 1,
                    background: ins.length > 0 ? 'var(--success-soft)' : 'var(--input-bg)',
                    border: `1px solid ${ins.length > 0 ? 'var(--success)' : 'var(--card-border)'}`,
                    borderRadius: 8, padding: '6px 8px',
                    display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <LogIn size={11} style={{ color: ins.length > 0 ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: ins.length > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                            Kirdi
                        </span>
                    </div>
                    {ins.length > 0 ? ins.map((r, i) => (
                        <div key={i} style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '0.02em' }}>
                            {parseTime(r.time)}
                        </div>
                    )) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</div>
                    )}
                </div>

                {/* Chiqdi */}
                <div style={{
                    flex: 1,
                    background: outs.length > 0 ? 'var(--danger-soft)' : 'var(--input-bg)',
                    border: `1px solid ${outs.length > 0 ? 'var(--danger)' : 'var(--card-border)'}`,
                    borderRadius: 8, padding: '6px 8px',
                    display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <LogOut size={11} style={{ color: outs.length > 0 ? 'var(--danger)' : 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: outs.length > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                            Chiqdi
                        </span>
                    </div>
                    {outs.length > 0 ? outs.map((r, i) => (
                        <div key={i} style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--danger)', letterSpacing: '0.02em' }}>
                            {parseTime(r.time)}
                        </div>
                    )) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UserAttendanceTab({ user }) {
    const { id } = useParams();
    const userId = id || user?.id;

    const now = new Date();
    const [startDate, setStartDate] = useState(toISO(new Date(now.getFullYear(), now.getMonth(), 1)));
    const [endDate,   setEndDate]   = useState(toISO(now));
    const [page, setPage] = useState(1);
    const LIMIT = 15;

    const [downloading, setDownloading] = useState(false);
    const [fetchPage, { data, isLoading, error }] = useLazyGetUserAttendancePageQuery();

    const load = (p = page) => {
        if (!userId) return;
        fetchPage({ user_id: userId, page: p, limit: LIMIT, startDate, endDate });
    };

    useEffect(() => { load(1); setPage(1); }, [userId, startDate, endDate]);

    // API: { data: { records: [{date, records:[{type,time}]}], pagination } }
    //   or: { data: [{date, records:[{type,time}]}] }
    const raw = data?.data;
    const records = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.records)
            ? raw.records
            : [];
    const pagination = raw?.pagination || {};
    const totalPages = pagination.total_pages || Math.max(1, Math.ceil((pagination.total_count || records.length) / LIMIT));

    const goTo = (p) => { setPage(p); load(p); };

    /* ── Excel download ── */
    const handleExcel = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const resp = await $api.get('/user-attendance/excel', {
                params: { startDate, endDate, user_id: userId },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const a   = document.createElement('a');
            a.href = url;
            a.download = `kirdi-chiqdi-${userId?.slice(0,8)}-${startDate}-${endDate}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Excel yuklab olishda xatolik:', e);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filter bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
                <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Dan</label>
                    <input type="date" value={startDate}
                        onChange={e => { setStartDate(e.target.value); setPage(1); }}
                        className="search-input" style={{ paddingLeft: 14, width: 150 }} />
                </div>
                <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Gacha</label>
                    <input type="date" value={endDate}
                        onChange={e => { setEndDate(e.target.value); setPage(1); }}
                        className="search-input" style={{ paddingLeft: 14, width: 150 }} />
                </div>

                <button
                    onClick={handleExcel}
                    disabled={downloading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 14px', borderRadius: 9, border: 'none',
                        background: downloading ? 'var(--input-bg)' : '#10b981',
                        color: downloading ? 'var(--text-muted)' : '#fff',
                        fontSize: '0.82rem', fontWeight: 600, cursor: downloading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                    }}>
                    <Download size={14} />
                    {downloading ? 'Yuklanmoqda...' : 'Excel'}
                </button>
            </div>

            {error && (
                <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10 }}>
                    Xatolik: {error?.data?.message || "Ma'lumot topilmadi"}
                </div>
            )}

            {isLoading ? <Loading /> : records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <Camera size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }} />
                    <p>Kirdi-chiqdi ma'lumotlari topilmadi</p>
                </div>
            ) : (
                <>
                    {/* Cards grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: 8,
                    }}>
                        {records.map((record, i) => (
                            <DayCard key={record.date || i} record={record} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Sahifa {page} / {totalPages}
                            </span>
                            <div className="pagination-controls">
                                <button className="page-btn" onClick={() => goTo(1)} disabled={page <= 1}><ChevronsLeft size={15} /></button>
                                <button className="page-btn" onClick={() => goTo(page - 1)} disabled={page <= 1}><ChevronLeft size={15} /></button>
                                <span className="page-current">{page}</span>
                                <button className="page-btn" onClick={() => goTo(page + 1)} disabled={page >= totalPages}><ChevronRight size={15} /></button>
                                <button className="page-btn" onClick={() => goTo(totalPages)} disabled={page >= totalPages}><ChevronsRight size={15} /></button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
