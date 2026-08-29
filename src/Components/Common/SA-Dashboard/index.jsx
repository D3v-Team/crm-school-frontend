import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetOverviewQuery } from '../../../store/services/statistic.api';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
    Users, GraduationCap, Users2, Wallet, CalendarDays,
    TrendingUp, BookOpen, Trophy, CreditCard,
    RefreshCw, LayoutDashboard,
} from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';

/* ─── constants ─────────────────────────────────────── */
const MONTH_NAMES = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
const FULL_MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
const PIE_COLORS  = ['#6366f1','#f59e0b','#ef4444'];
const CHART_TOOLTIP = {
    contentStyle: {
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 10,
        color: 'var(--text-primary)',
        fontSize: '0.78rem',
        boxShadow: 'var(--shadow-md)',
    },
    cursor: { fill: 'var(--accent-soft)' },
};

/* ─── reusables ──────────────────────────────────────── */
function DashCard({ children, style = {}, className = '' }) {
    return (
        <div className={className} style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 16,
            overflow: 'hidden',
            minWidth: 0,
            ...style,
        }}>
            {children}
        </div>
    );
}

function CardHead({ icon: Icon, title, color = 'var(--accent)' }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px 14px' }}>
            <div style={{
                width: 32, height: 32, borderRadius: 9,
                padding: 6, flexShrink: 0,
                background: color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={15} style={{ color }} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {title}
            </span>
        </div>
    );
}

function KpiCard({ icon: Icon, label, value, color }) {
    return (
        <DashCard>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                    background: color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={19} style={{ color }} />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                        {value}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {label}
                    </div>
                </div>
            </div>
        </DashCard>
    );
}

function StatRow({ items }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', borderTop: '1px solid var(--card-border)' }}>
            {items.map((item, i) => (
                <div key={i} style={{
                    flex: '1 1 70px', textAlign: 'center', padding: '11px 8px',
                    background: 'var(--input-bg)',
                    borderRight: i < items.length - 1 ? '1px solid var(--card-border)' : 'none',
                    marginTop: 1,
                }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.value ?? 0}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap' }}>
                        {item.label}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── main ──────────────────────────────────────────── */
export default function Dashboard() {
    const now = new Date();
    const [filters, setFilters] = useState({ year: now.getFullYear(), month: now.getMonth() + 1, top: 5 });

    const { data, isLoading, error, refetch } = useGetOverviewQuery(filters);
    const overview = data?.data || data;

    const g       = overview?.general;
    const pay     = overview?.payment;
    const ranking = overview?.groups_ranking;

    const yearlyData = (pay?.yearly_chart || []).map(d => ({
        ...d, name: MONTH_NAMES[(d.month ?? 1) - 1] ?? d.month,
    }));

    const is_payment = useSelector(s => s.auth.is_payment);

    const pieData = pay?.students_status ? [
        { name: "To'liq",  value: pay.students_status.full_paid    || 0 },
        { name: "Qisman",  value: pay.students_status.partial_paid || 0 },
        { name: "Qarzdor", value: pay.students_status.debtors      || 0 },
    ] : [];

    const methodData = pay?.monthly?.by_method
        ? Object.entries(pay.monthly.by_method).map(([k, v]) => ({
            name: k === 'bank_account' ? 'Bank' : k.charAt(0).toUpperCase() + k.slice(1),
            value: v.total_paid || 0,
        })) : [];

    const totalUsers = g?.users ? Object.values(g.users).reduce((a, b) => a + b, 0) : 0;

    const yearOptions = [];
    for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 1; y++) yearOptions.push(y);

    if (isLoading) return <Loading />;
    if (error) return (
        <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: 16, borderRadius: 12 }}>
            Xatolik: {error?.data?.message || "Noma'lum xatolik"}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LayoutDashboard size={17} style={{ color: 'var(--accent)' }} />
                    </div>
                    <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        Boshqaruv paneli
                    </h1>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                    padding: '8px 12px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 12,
                }}>
                    <select className="search-select" style={{ minWidth: 75 }} value={filters.year}
                        onChange={e => setFilters(p => ({ ...p, year: +e.target.value }))}>
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select className="search-select" style={{ minWidth: 105 }} value={filters.month}
                        onChange={e => setFilters(p => ({ ...p, month: +e.target.value }))}>
                        {FULL_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                    </select>
                    <button onClick={refetch} className="btn-refresh" title="Yangilash">
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* ── KPI row: always 5 cols on desktop, wrap on small ── */}
            <div className="dash-kpi-grid">
                <KpiCard icon={GraduationCap} label="O'quvchilar"  value={g?.students?.total ?? 0}  color="#6366f1" />
                <KpiCard icon={Users}         label="Xodimlar"      value={totalUsers}                color="#10b981" />
                <KpiCard icon={BookOpen}      label="Guruhlar"      value={g?.groups_count ?? 0}     color="#f59e0b" />
                <KpiCard icon={TrendingUp}    label="Fanlar"        value={g?.subjects_count ?? 0}   color="#8b5cf6" />
                <KpiCard icon={Users2}        label="Ota-onalar"    value={g?.parents?.total ?? 0}   color="#ec4899" />
            </div>

            {/* ── Detail cards ── */}
            {is_payment ? (
                <div className="dash-detail-grid">
                    {g?.students && (
                        <DashCard>
                            <CardHead icon={GraduationCap} title="O'quvchilar" color="#6366f1" />
                            <StatRow items={[
                                { label: 'Faol',   value: g.students.active   ?? 0 },
                                { label: 'Nofaol', value: g.students.inactive ?? 0 },
                                { label: 'Jami',   value: g.students.total    ?? 0 },
                            ]} />
                        </DashCard>
                    )}
                    {g?.parents && (
                        <DashCard>
                            <CardHead icon={Users2} title="Ota-onalar" color="#ec4899" />
                            <StatRow items={[
                                { label: 'Jami',        value: g.parents.total         ?? 0 },
                                { label: 'Bot ulangan', value: g.parents.linked_to_bot ?? 0 },
                                { label: 'Ulanmagan',   value: g.parents.not_linked    ?? 0 },
                            ]} />
                        </DashCard>
                    )}
                    {pay?.monthly && (
                        <DashCard>
                            <CardHead icon={Wallet} title={`Oylik — ${FULL_MONTHS[(filters.month ?? 1) - 1]}`} color="#f59e0b" />
                            <StatRow items={[
                                { label: 'Kerakli',   value: pay.monthly.total_required ?? 0 },
                                { label: "To'langan", value: pay.monthly.total_paid     ?? 0 },
                                { label: 'Qarz',      value: pay.monthly.total_debt     ?? 0 },
                            ]} />
                        </DashCard>
                    )}
                    {pay?.daily && (
                        <DashCard>
                            <CardHead icon={CalendarDays} title={`Kunlik — ${pay.daily.date ?? ''}`} color="#6366f1" />
                            <StatRow items={[
                                { label: "To'langan",  value: pay.daily.total_paid     ?? 0 },
                                { label: "To'lovlar",  value: pay.daily.payments_count ?? 0 },
                            ]} />
                        </DashCard>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                    {g?.students && (
                        <DashCard>
                            <CardHead icon={GraduationCap} title="O'quvchilar holati" color="#6366f1" />
                            <div style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                    {[
                                        { label: 'Faol',   value: g.students.active   ?? 0, color: 'var(--success)' },
                                        { label: 'Nofaol', value: g.students.inactive ?? 0, color: 'var(--danger)'  },
                                        { label: 'Jami',   value: g.students.total    ?? 0, color: 'var(--accent)'  },
                                    ].map((item, i) => (
                                        <div key={i} style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--input-bg)', borderRadius: 12 }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 5 }}>{item.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </DashCard>
                    )}
                    {g?.parents && (
                        <DashCard>
                            <CardHead icon={Users2} title="Ota-onalar" color="#ec4899" />
                            <div style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                    {[
                                        { label: 'Jami',        value: g.parents.total         ?? 0, color: '#ec4899' },
                                        { label: 'Bot ulangan', value: g.parents.linked_to_bot ?? 0, color: 'var(--success)' },
                                        { label: 'Ulanmagan',   value: g.parents.not_linked    ?? 0, color: 'var(--text-muted)' },
                                    ].map((item, i) => (
                                        <div key={i} style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--input-bg)', borderRadius: 12 }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 5 }}>{item.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </DashCard>
                    )}
                </div>
            )}

            {/* ── Charts ── */}
            {is_payment && (
                <div className="dash-charts-grid">
                    {/* Area chart — spans 2 cols on wide, full width on narrow */}
                    <DashCard className="dash-chart-area">
                        <CardHead icon={TrendingUp} title="Yillik to'lovlar dinamikasi" color="#6366f1" />
                        <div style={{ padding: '14px 16px 18px' }}>
                            {yearlyData.length === 0 ? (
                                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    Ma'lumot yo'q
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                    <AreaChart data={yearlyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip {...CHART_TOOLTIP} />
                                        <Area type="monotone" dataKey="total_paid" name="To'langan"
                                            stroke="#6366f1" strokeWidth={2.5} fill="url(#areaGrad)"
                                            dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </DashCard>

                    {/* Pie chart */}
                    <DashCard className="dash-chart-pie">
                        <CardHead icon={CreditCard} title="To'lov holati" color="#8b5cf6" />
                        <div style={{ padding: '14px 16px 18px' }}>
                            {pieData.every(d => d.value === 0) ? (
                                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    Ma'lumot yo'q
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <ResponsiveContainer width={130} height={160} style={{ flexShrink: 0 }}>
                                        <PieChart>
                                            <Pie data={pieData} dataKey="value" nameKey="name"
                                                cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3}>
                                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip {...CHART_TOOLTIP} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 90 }}>
                                        {pieData.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 9, height: 9, borderRadius: 3, background: PIE_COLORS[i], flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </DashCard>
                </div>
            )}

            {/* ── Payment methods bar ── */}
            {is_payment && methodData.length > 0 && (
                <DashCard>
                    <CardHead icon={Wallet} title="To'lov usullari (oylik)" color="#10b981" />
                    <div style={{ padding: '14px 16px 18px' }}>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={methodData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip {...CHART_TOOLTIP} />
                                <Bar dataKey="value" name="Summa" fill="#10b981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </DashCard>
            )}

            {/* ── Top groups ── */}
            {ranking?.top && ranking.top.length > 0 && (
                <DashCard>
                    <CardHead icon={Trophy} title="Top guruhlar" color="#f59e0b" />
                    <div style={{ padding: '8px 0 0' }}>
                        {ranking.top.slice(0, 5).map((grp, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '11px 20px',
                                borderTop: '1px solid var(--card-border)',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-soft)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{
                                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                                    background: i === 0 ? '#f59e0b18' : i === 1 ? '#6366f118' : 'var(--input-bg)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '0.78rem',
                                    color: i === 0 ? '#f59e0b' : i === 1 ? '#6366f1' : 'var(--text-muted)',
                                }}>
                                    {i + 1}
                                </div>
                                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {grp.name || grp.groupName || grp.title || '—'}
                                </span>
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: 700,
                                    background: 'var(--accent-soft)', color: 'var(--accent)',
                                    padding: '2px 10px', borderRadius: 99, flexShrink: 0,
                                }}>
                                    {grp.count ?? grp.students ?? grp.value ?? '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </DashCard>
            )}
        </div>
    );
}
