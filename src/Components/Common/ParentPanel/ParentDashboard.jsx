import { useEffect } from 'react';
import { useLazyGetParentQuery } from '../../../store/services/statistic.api';
import {
    Users, TrendingUp, BookOpen, CheckCircle,
    BarChart2, GraduationCap, Star, AlertCircle,
} from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';

const scoreColor = (v) => v >= 80 ? 'var(--success)' : v >= 60 ? 'var(--warning)' : 'var(--danger)';
const scoreBg    = (v) => v >= 80 ? 'var(--success-soft)' : v >= 60 ? 'var(--warning-soft)' : 'var(--danger-soft)';

export default function ParentDashboard() {
    const now = new Date();
    const [fetchParent, { data: parentData, isLoading: pl }] = useLazyGetParentQuery();

    useEffect(() => {
        fetchParent({ year: now.getFullYear(), month: now.getMonth() + 1 });
    }, []);

    const list = parentData?.data || [];

    if (pl) return <Loading />;

    if (!list.length) return (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }} />
            <p>Farzandlar topilmadi</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {list.map(child => {
                const curr = child.current?.overall || {};
                const prev = child.previous?.overall || {};
                const diff = child.diff || {};
                const bySub = child.current?.by_subject || [];

                return (
                    <div key={child.student_id} style={{
                        background: 'var(--card-bg)',
                        border: '1.5px solid var(--card-border)',
                        borderRadius: 18,
                        padding: '22px 24px',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        {/* Student header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: 14,
                                background: 'var(--accent-soft)', color: 'var(--accent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem', fontWeight: 800, flexShrink: 0,
                                border: '2px solid var(--card-border)',
                            }}>
                                {(child.full_name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {child.full_name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <GraduationCap size={13} style={{ color: 'var(--accent)' }} />
                                    {child.group || '—'}
                                </div>
                            </div>
                        </div>

                        {/* Current period stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
                            {[
                                {
                                    icon: CheckCircle,
                                    label: 'Davomat',
                                    value: curr.attendance_rate != null ? `${curr.attendance_rate}%` : '—',
                                    color: curr.attendance_rate != null ? scoreColor(curr.attendance_rate) : 'var(--text-muted)',
                                    bg:    curr.attendance_rate != null ? scoreBg(curr.attendance_rate)   : 'var(--input-bg)',
                                },
                                {
                                    icon: Star,
                                    label: "O'rtacha baho",
                                    value: curr.avg_grade != null ? `${curr.avg_grade}%` : '—',
                                    color: curr.avg_grade != null ? scoreColor(curr.avg_grade) : 'var(--text-muted)',
                                    bg:    curr.avg_grade != null ? scoreBg(curr.avg_grade)   : 'var(--input-bg)',
                                },
                            ].map((c, i) => (
                                <div key={i} style={{
                                    background: c.bg, borderRadius: 16, padding: '16px 22px',
                                    display: 'flex', alignItems: 'center', gap: 16,
                                    border: `1.5px solid ${c.color}44`,
                                    boxShadow: `0 2px 12px ${c.color}11`,
                                }}>
                                    <div style={{ width: 50, height: 50, borderRadius: 13, background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <c.icon size={22} style={{ color: c.color }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 5 }}>{c.label}</div>
                                    </div>
                                </div>
                            ))}

                            {/* Diff cards */}
                            {diff.attendance_rate != null && (
                                <div style={{
                                    background: diff.attendance_rate >= 0 ? 'var(--success-soft)' : 'var(--danger-soft)',
                                    borderRadius: 16, padding: '16px 22px',
                                    display: 'flex', alignItems: 'center', gap: 16,
                                    border: `1.5px solid ${diff.attendance_rate >= 0 ? 'var(--success)' : 'var(--danger)'}44`,
                                }}>
                                    <div style={{ width: 50, height: 50, borderRadius: 13, background: (diff.attendance_rate >= 0 ? 'var(--success)' : 'var(--danger)') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <TrendingUp size={22} style={{ color: diff.attendance_rate >= 0 ? 'var(--success)' : 'var(--danger)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: diff.attendance_rate >= 0 ? 'var(--success)' : 'var(--danger)', lineHeight: 1 }}>
                                            {diff.attendance_rate >= 0 ? '+' : ''}{diff.attendance_rate}%
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 5 }}>Davomat o'zgarishi</div>
                                    </div>
                                </div>
                            )}
                            {diff.avg_grade != null && (
                                <div style={{
                                    background: diff.avg_grade >= 0 ? 'var(--success-soft)' : 'var(--danger-soft)',
                                    borderRadius: 16, padding: '16px 22px',
                                    display: 'flex', alignItems: 'center', gap: 16,
                                    border: `1.5px solid ${diff.avg_grade >= 0 ? 'var(--success)' : 'var(--danger)'}44`,
                                }}>
                                    <div style={{ width: 50, height: 50, borderRadius: 13, background: (diff.avg_grade >= 0 ? 'var(--success)' : 'var(--danger)') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <BarChart2 size={22} style={{ color: diff.avg_grade >= 0 ? 'var(--success)' : 'var(--danger)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: diff.avg_grade >= 0 ? 'var(--success)' : 'var(--danger)', lineHeight: 1 }}>
                                            {diff.avg_grade >= 0 ? '+' : ''}{diff.avg_grade}%
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 5 }}>Baho o'zgarishi</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* By subject breakdown */}
                        {bySub.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <BookOpen size={14} /> Fanlar bo'yicha
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {bySub.map(s => (
                                        <div key={s.subject_id} style={{
                                            display: 'flex', alignItems: 'center', gap: 14,
                                            padding: '14px 18px', borderRadius: 12,
                                            background: 'var(--input-bg)', border: '1px solid var(--card-border)',
                                        }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {s.subject_name}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: s.attendance_rate != null ? scoreBg(s.attendance_rate) : 'var(--input-bg)', color: s.attendance_rate != null ? scoreColor(s.attendance_rate) : 'var(--text-muted)' }}>
                                                    {s.attendance_rate != null ? `${s.attendance_rate}%` : '—'} davomat
                                                </span>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: s.avg_grade != null ? scoreBg(s.avg_grade) : 'var(--input-bg)', color: s.avg_grade != null ? scoreColor(s.avg_grade) : 'var(--text-muted)' }}>
                                                    {s.avg_grade != null ? `${s.avg_grade}%` : '—'} baho
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                 
                    </div>
                );
            })}
        </div>
    );
}
