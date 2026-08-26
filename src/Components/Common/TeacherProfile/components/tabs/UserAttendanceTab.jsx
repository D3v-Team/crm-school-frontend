import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLazyGetUserAttendancePageQuery } from '../../../../../store/services/user-attendance.api';
import {
    Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Download, RefreshCw, Camera,
} from 'lucide-react';
import Loading from '../../../../Other/UI/Loadings/Loading';
import $api from '../../../../../store/api';

const STATUS_STYLE = {
    present: { bg: 'var(--success-soft)', color: 'var(--success)', label: 'Keldi'    },
    absent:  { bg: 'var(--danger-soft)',  color: 'var(--danger)',  label: 'Kelmadi'  },
    late:    { bg: 'var(--warning-soft)', color: 'var(--warning)', label: 'Kechikdi' },
};
const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fmtDT = (d) => d ? new Date(d).toLocaleString('uz-UZ') : '—';

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

    const records    = data?.data?.records || data?.data || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || Math.max(1, Math.ceil((pagination.total || records.length) / LIMIT));

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
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>№</th>
                                    <th>Sana / Vaqt</th>
                                    <th>Holat</th>
                                    <th>Izoh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r, i) => {
                                    const st = STATUS_STYLE[r.status] || { bg: 'var(--input-bg)', color: 'var(--text-muted)', label: r.status || '—' };
                                    return (
                                        <tr key={r.id || i}>
                                            <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                                                {(page - 1) * LIMIT + i + 1}
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                                                {fmtDT(r.created_at || r.date || r.timestamp)}
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: st.bg, color: st.color }}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                {r.comment || r.note || '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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
