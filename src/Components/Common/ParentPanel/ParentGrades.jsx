import { useEffect, useState } from 'react';
import { useLazyGetMyChildrenGradesQuery } from '../../../store/services/grades.api';
import { BookOpen, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '—';
const scoreColor = (s) => s == null ? 'var(--text-muted)' : s >= 80 ? 'var(--success)' : s >= 60 ? 'var(--warning)' : 'var(--danger)';
const scoreBg    = (s) => s == null ? 'var(--input-bg)'  : s >= 80 ? 'var(--success-soft)' : s >= 60 ? 'var(--warning-soft)' : 'var(--danger-soft)';

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function ParentGrades() {
    const now = new Date();
    const [dateFrom, setDateFrom] = useState(toISO(new Date(now.getFullYear(), now.getMonth(), 1)));
    const [dateTo,   setDateTo]   = useState(toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)));

    const [fetchGrades, { data, isLoading, error }] = useLazyGetMyChildrenGradesQuery();

    const load = () => fetchGrades({ date_from: dateFrom, date_to: dateTo });

    useEffect(() => { load(); }, []);

    /* Flatten all grades from all children */
    const raw = data?.data?.records || data?.data || [];

    /* Determine structure: could be array of {student, dates:[]} or flat grades */
    const rows = [];
    raw.forEach(item => {
        if (item.dates) {
            /* Grouped by student → date → subjects structure */
            item.dates?.forEach(de => {
                de.subjects?.forEach(sb => {
                    rows.push({
                        id:           sb.grade_id || `${item.student_id}-${de.date}-${sb.subject_name}`,
                        student_name: item.full_name || item.student?.full_name || '—',
                        date:         de.date,
                        subject_name: sb.subject_name || sb.subject?.name || '—',
                        score:        sb.score,
                        comment:      sb.comment || '',
                    });
                });
            });
        } else {
            /* Flat list */
            rows.push({
                id:           item.id,
                student_name: item.student?.full_name || '—',
                date:         item.date,
                subject_name: item.subject?.name || item.subject_name || '—',
                score:        item.score,
                comment:      item.comment || '',
            });
        }
    });

    rows.sort((a, b) => new Date(b.date) - new Date(a.date));

    /* Pagination */
    const LIMIT = 20;
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(rows.length / LIMIT));
    const paged = rows.slice((page - 1) * LIMIT, page * LIMIT);

    const avg = rows.length
        ? Math.round(rows.filter(r => r.score != null).reduce((s, r) => s + r.score, 0) / rows.filter(r => r.score != null).length)
        : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filter bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
                <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Dan</label>
                    <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                        className="search-input" style={{ paddingLeft: 14, width: 150 }} />
                </div>
                <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Gacha</label>
                    <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                        className="search-input" style={{ paddingLeft: 14, width: 150 }} />
                </div>
           

                {avg != null && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: scoreBg(avg), border: `1px solid ${scoreColor(avg)}` }}>
                        <BookOpen size={14} style={{ color: scoreColor(avg) }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: scoreColor(avg) }}>
                            O'rtacha: {avg}%
                        </span>
                    </div>
                )}
            </div>

            {error && (
                <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10 }}>
                    Xatolik: {error?.data?.message}
                </div>
            )}

            {isLoading ? <Loading /> : rows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <BookOpen size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }} />
                    <p>Ushbu davr uchun baholar topilmadi</p>
                </div>
            ) : (
                <>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>№</th>
                                    <th>O'quvchi</th>
                                    <th>Sana</th>
                                    <th>Fan</th>
                                    <th>Baho</th>
                                    <th>Izoh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((r, i) => (
                                    <tr key={r.id}>
                                        <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                                            {(page - 1) * LIMIT + i + 1}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{fmtDate(r.date)}</td>
                                        <td>{r.subject_name}</td>
                                        <td>
                                            {r.score != null ? (
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: scoreBg(r.score), color: scoreColor(r.score) }}>
                                                    {r.score}%
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.comment || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Jami {rows.length} ta baho</span>
                            <div className="pagination-controls">
                                <button className="page-btn" onClick={() => setPage(1)} disabled={page <= 1}>«</button>
                                <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft size={15} /></button>
                                <span className="page-current">{page}</span>
                                <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><ChevronRight size={15} /></button>
                                <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>»</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
