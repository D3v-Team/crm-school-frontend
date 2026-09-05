import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetOverviewQuery } from '../../../store/services/statistic.api';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    Users, GraduationCap, Users2, Wallet, CalendarDays,
    TrendingUp, TrendingDown, BookOpen, Trophy, CreditCard,
    RefreshCw, LayoutDashboard, ArrowUpRight, DollarSign,
    Banknote, AlertCircle, CheckCircle2, Clock,
} from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';

/* ─── constants ─────────────────────────────────────── */
const MONTH_NAMES = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
const FULL_MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
const PIE_COLORS  = ['#6366f1', '#f59e0b', '#ef4444'];
const METHOD_COLORS = { cash: '#10b981', card: '#6366f1', transfer: '#f59e0b', bank_account: '#8b5cf6' };
const METHOD_LABELS = { cash: 'Naqd', card: 'Karta', transfer: "O'tkazma", bank_account: 'Bank' };

const fmtMoney = (v) => {
    if (!v && v !== 0) return '—';
    const n = Number(v);
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' mlrd';
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + ' mln';
    if (n >= 1_000)         return (n / 1_000).toFixed(0) + ' ming';
    return n.toLocaleString('ru-RU');
};

const fmtFull = (v) =>
    v != null ? Number(v).toLocaleString('ru-RU') + " so'm" : '—';

const CHART_TOOLTIP = {
    contentStyle: {
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 10,
        color: 'var(--text-primary)',
        fontSize: '0.78rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    },
    cursor: { fill: 'var(--accent-soft)' },
};

/* ─── reusable shell ─────────────────────────────────── */
function Card({ children, style = {}, className = '' }) {
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

function CardHead({ icon: Icon, title, color = 'var(--accent)', action }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px 12px' }}>
            <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={15} style={{ color }} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                {title}
            </span>
            {action}
        </div>
    );
}

/* ─── KPI card (top row) ─────────────────────────────── */
function KpiCard({ icon: Icon, label, value, color, sub, trend }) {
    return (
        <Card>
            <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: color + '18',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Icon size={20} style={{ color }} />
                    </div>
                    {trend != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 600,
                            color: trend >= 0 ? 'var(--success)' : 'var(--danger)',
                            background: (trend >= 0 ? 'var(--success)' : 'var(--danger)') + '12',
                            padding: '3px 8px', borderRadius: 99,
                        }}>
                            {trend >= 0 ? <ArrowUpRight size={11} /> : <TrendingDown size={11} />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>
                    {value}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                {sub && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--card-border)' }}>
                        {sub}
                    </div>
                )}
            </div>
        </Card>
    );
}

/* ─── Payment KPI (big money cards) ─────────────────── */
function PayKpi({ icon: Icon, label, value, color, fullValue }) {
    return (
        <div style={{
            flex: '1 1 180px', padding: '18px 20px',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 16,
            minWidth: 0,
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* bg glow */}
            <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 80, height: 80, borderRadius: '50%',
                background: color + '12', filter: 'blur(16px)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} style={{ color }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color, lineHeight: 1 }}>
                {fmtMoney(fullValue ?? 0)}
                <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>so'm</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {value}
            </div>
        </div>
    );
}

/* ─── Stat mini tiles ────────────────────────────────── */
function MiniStat({ label, value, color = 'var(--text-primary)' }) {
    return (
        <div style={{ flex: '1 1 80px', textAlign: 'center', padding: '12px 8px', background: 'var(--input-bg)', borderRadius: 10 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color, lineHeight: 1 }}>{value ?? 0}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'nowrap' }}>{label}</div>
        </div>
    );
}

/* ─── Progress bar ───────────────────────────────────── */
function ProgressBar({ value, max, color = 'var(--accent)' }) {
    const pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0;
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>To'lov foizi</span>
                <strong style={{ color: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{pct}%</strong>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: 'var(--input-bg)', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: 99, width: `${pct}%`,
                    background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)',
                    transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                }} />
            </div>
        </div>
    );
}

/* ─── Custom tooltip for money charts ───────────────── */
function MoneyTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: 10, padding: '10px 14px', fontSize: '0.78rem',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
                    <strong style={{ color: p.color }}>{fmtFull(p.value)}</strong>
                </div>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════ */
export default function Dashboard() {
    const now = new Date();
    const [filters, setFilters] = useState({ year: now.getFullYear(), month: now.getMonth() + 1, top: 5 });

    const { data, isLoading, error, refetch } = useGetOverviewQuery(filters);
    const overview = data?.data || data;

    const g       = overview?.general;
    const pay     = overview?.payment;
    const ranking = overview?.groups_ranking;

    const authRole    = useSelector(s => s.auth.role);
    const rawPayment  = useSelector(s => s.auth.is_payment);
    // super_admin va cashier uchun to'lov statistikasi har doim ko'rsatiladi
    const is_payment  = authRole === 'super_admin' || authRole === 'cashier' ? true : rawPayment;

    /* ── derived payment data ── */
    const yearlyData = (pay?.yearly_chart || []).map(d => ({
        ...d,
        name: MONTH_NAMES[(d.month ?? 1) - 1] ?? d.month,
    }));

    const pieData = pay?.students_status ? [
        { name: "To'liq",  value: pay.students_status.full_paid    || 0 },
        { name: "Qisman",  value: pay.students_status.partial_paid || 0 },
        { name: "Qarzdor", value: pay.students_status.debtors      || 0 },
    ] : [];

    const methodData = pay?.monthly?.by_method
        ? Object.entries(pay.monthly.by_method).map(([k, v]) => ({
            name: METHOD_LABELS[k] || k,
            value: v.total_paid || 0,
            count: v.count || 0,
            fill: METHOD_COLORS[k] || '#6366f1',
        }))
        : [];

    const totalPaid     = pay?.monthly?.total_paid     ?? 0;
    const totalRequired = pay?.monthly?.total_required ?? 0;
    const totalDebt     = pay?.monthly?.total_debt     ?? 0;

    const totalUsers = g?.users ? Object.values(g.users).reduce((a, b) => a + b, 0) : 0;

    const yearOptions = [];
    for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 1; y++) yearOptions.push(y);

    if (isLoading) return <Loading />;
    if (error) return (
        <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} />
            Xatolik: {error?.data?.message || "Noma'lum xatolik"}
        </div>
    );

    const curMonthName = FULL_MONTHS[(filters.month ?? 1) - 1];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ══ Header ══════════════════════════════════════ */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LayoutDashboard size={18} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                            Boshqaruv paneli
                        </h1>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {curMonthName} {filters.year}
                        </p>
                    </div>
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
                    <select className="search-select" style={{ minWidth: 110 }} value={filters.month}
                        onChange={e => setFilters(p => ({ ...p, month: +e.target.value }))}>
                        {FULL_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                    </select>
                    <button onClick={refetch} className="btn-refresh" title="Yangilash">
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* ══ KPI Row ══════════════════════════════════════ */}
            <div className="dash-kpi-grid">
                <KpiCard
                    icon={GraduationCap} label="O'quvchilar" color="#6366f1"
                    value={g?.students?.total ?? 0}
                    sub={g?.students ? `Faol: ${g.students.active ?? 0} · Nofaol: ${g.students.inactive ?? 0}` : undefined}
                />
                <KpiCard
                    icon={Users} label="Xodimlar" color="#10b981"
                    value={totalUsers}
                />
                <KpiCard
                    icon={BookOpen} label="Guruhlar" color="#f59e0b"
                    value={g?.groups_count ?? 0}
                />
                <KpiCard
                    icon={TrendingUp} label="Fanlar" color="#8b5cf6"
                    value={g?.subjects_count ?? 0}
                />
                <KpiCard
                    icon={Users2} label="Ota-onalar" color="#ec4899"
                    value={g?.parents?.total ?? 0}
                    sub={g?.parents ? `Bot: ${g.parents.linked_to_bot ?? 0} · Ulanmagan: ${g.parents.not_linked ?? 0}` : undefined}
                />
            </div>

            {/* ══ Payment section (only if is_payment) ════════ */}
            {is_payment && (
                <>
                    {/* ── Payment KPI big cards ── */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ width: 4, height: 18, borderRadius: 2, background: 'var(--accent)' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                To'lov statistikasi — {curMonthName}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                            <PayKpi
                                icon={DollarSign} label="Oylik kerakli summa"
                                color="#3b82f6"
                                fullValue={totalRequired}
                                value={`${pay?.monthly?.students_count ?? 0} ta o'quvchi`}
                            />
                            <PayKpi
                                icon={CheckCircle2} label="To'langan"
                                color="#10b981"
                                fullValue={totalPaid}
                                value={`${pay?.monthly?.payments_count ?? 0} ta to'lov`}
                            />
                            <PayKpi
                                icon={AlertCircle} label="Qarz (oy bo'yicha)"
                                color={totalDebt > 0 ? '#ef4444' : '#10b981'}
                                fullValue={totalDebt}
                                value={totalDebt > 0 ? `${pay?.students_status?.debtors ?? 0} ta qarzdor` : "Qarz yo'q 🎉"}
                            />
                            {pay?.daily && (
                                <PayKpi
                                    icon={CalendarDays} label={`Kunlik — ${pay.daily.date ?? ''}`}
                                    color="#8b5cf6"
                                    fullValue={pay.daily.total_paid}
                                    value={`${pay.daily.payments_count ?? 0} ta to'lov bugun`}
                                />
                            )}
                        </div>
                    </div>

                    {/* ── Progress bar ── */}
                    {totalRequired > 0 && (
                        <Card style={{ padding: '16px 20px' }}>
                            <ProgressBar value={totalPaid} max={totalRequired} />
                            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                                {[
                                    { label: "To'liq to'lagan",  value: pay?.students_status?.full_paid    ?? 0, color: '#6366f1' },
                                    { label: "Qisman to'lagan",  value: pay?.students_status?.partial_paid ?? 0, color: '#f59e0b' },
                                    { label: "Hech to'lamagan", value: pay?.students_status?.debtors       ?? 0, color: '#ef4444' },
                                ].map((s, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                                        <span style={{ color: 'var(--text-muted)' }}>{s.label}:</span>
                                        <strong style={{ color: s.color }}>{s.value} ta</strong>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* ── Charts grid ── */}
                    <div className="dash-charts-grid">
                        {/* Area chart — yillik dinamika */}
                        <Card className="dash-chart-area">
                            <CardHead icon={TrendingUp} title={`${filters.year}-yil to'lovlar dinamikasi`} color="#6366f1" />
                            <div style={{ padding: '8px 16px 18px' }}>
                                {yearlyData.length === 0 ? (
                                    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                        Ma'lumot yo'q
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <AreaChart data={yearlyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.22} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gradReq" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                                            <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                                                tickFormatter={v => fmtMoney(v)} />
                                            <Tooltip content={<MoneyTooltip />} />
                                            <Area type="monotone" dataKey="total_required" name="Kerakli"
                                                stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3"
                                                fill="url(#gradReq)" dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
                                            <Area type="monotone" dataKey="total_paid" name="To'langan"
                                                stroke="#6366f1" strokeWidth={2.5}
                                                fill="url(#gradPaid)" dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Card>

                        {/* Pie chart — to'lov holati */}
                        <Card className="dash-chart-pie">
                            <CardHead icon={CreditCard} title="O'quvchilar to'lov holati" color="#8b5cf6" />
                            <div style={{ padding: '8px 16px 18px' }}>
                                {pieData.every(d => d.value === 0) ? (
                                    <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                        Ma'lumot yo'q
                                    </div>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height={140}>
                                            <PieChart>
                                                <Pie data={pieData} dataKey="value" nameKey="name"
                                                    cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3}>
                                                    {pieData.map((_, i) => (
                                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}
                                                            stroke="var(--card-bg)" strokeWidth={2} />
                                                    ))}
                                                </Pie>
                                                <Tooltip {...CHART_TOOLTIP} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
                                            {pieData.map((item, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i], flexShrink: 0 }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{item.value}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* ── Payment methods bar ── */}
                    {methodData.length > 0 && (
                        <Card>
                            <CardHead icon={Wallet} title={`To'lov usullari — ${curMonthName}`} color="#10b981" />
                            <div style={{ padding: '8px 16px 18px' }}>
                                <ResponsiveContainer width="100%" height={175}>
                                    <BarChart data={methodData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                                            tickFormatter={v => fmtMoney(v)} />
                                        <Tooltip content={<MoneyTooltip />} />
                                        <Bar dataKey="value" name="Summa" radius={[7, 7, 0, 0]}>
                                            {methodData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                {/* Method detail pills */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                                    {methodData.map((m, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '7px 14px', borderRadius: 10,
                                            background: m.fill + '12',
                                            border: `1px solid ${m.fill}28`,
                                            flex: '1 1 130px',
                                        }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.fill, flexShrink: 0 }} />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.name}</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: m.fill }}>{fmtMoney(m.value)} so'm</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.count} ta to'lov</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* ── Students status detail ── */}
                    {g?.students && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                            <Card>
                                <CardHead icon={GraduationCap} title="O'quvchilar" color="#6366f1" />
                                <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                                    <MiniStat label="Faol"   value={g.students.active   ?? 0} color="var(--success)" />
                                    <MiniStat label="Nofaol" value={g.students.inactive ?? 0} color="var(--danger)"  />
                                    <MiniStat label="Jami"   value={g.students.total    ?? 0} color="var(--accent)"  />
                                </div>
                            </Card>
                            {g?.parents && (
                                <Card>
                                    <CardHead icon={Users2} title="Ota-onalar" color="#ec4899" />
                                    <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                                        <MiniStat label="Jami"        value={g.parents.total         ?? 0} color="#ec4899"          />
                                        <MiniStat label="Bot ulangan" value={g.parents.linked_to_bot ?? 0} color="var(--success)"  />
                                        <MiniStat label="Ulanmagan"   value={g.parents.not_linked    ?? 0} color="var(--text-muted)"/>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ══ Non-payment view (is_payment=false) ══════════ */}
            {!is_payment && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                    {g?.students && (
                        <Card>
                            <CardHead icon={GraduationCap} title="O'quvchilar holati" color="#6366f1" />
                            <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                                <MiniStat label="Faol"   value={g.students.active   ?? 0} color="var(--success)" />
                                <MiniStat label="Nofaol" value={g.students.inactive ?? 0} color="var(--danger)"  />
                                <MiniStat label="Jami"   value={g.students.total    ?? 0} color="var(--accent)"  />
                            </div>
                        </Card>
                    )}
                    {g?.parents && (
                        <Card>
                            <CardHead icon={Users2} title="Ota-onalar" color="#ec4899" />
                            <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
                                <MiniStat label="Jami"        value={g.parents.total         ?? 0} color="#ec4899"          />
                                <MiniStat label="Bot ulangan" value={g.parents.linked_to_bot ?? 0} color="var(--success)"  />
                                <MiniStat label="Ulanmagan"   value={g.parents.not_linked    ?? 0} color="var(--text-muted)"/>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* ══ Top groups (always visible) ══════════════════ */}
            {ranking?.top && ranking.top.length > 0 && (
                <Card>
                    <CardHead icon={Trophy} title="Top guruhlar" color="#f59e0b" />
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--accent-soft)' }}>
                                    {['#', 'Guruh', "O'quvchilar", "O'rt. baho", 'Davomat', 'Ball'].map((h, hi) => (
                                        <th key={hi} style={{
                                            padding: '10px 16px',
                                            textAlign: hi === 0 ? 'center' : hi >= 2 ? 'center' : 'left',
                                            fontWeight: 700, color: 'var(--accent)',
                                            fontSize: '0.68rem', textTransform: 'uppercase',
                                            letterSpacing: '0.06em', whiteSpace: 'nowrap',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.top.map((grp, i) => {
                                    const medals     = ['#f59e0b', '#94a3b8', '#cd7f32'];
                                    const medal      = i < 3 ? medals[i] : null;
                                    const scoreColor = grp.score > 500 ? 'var(--success)' : grp.score > 200 ? 'var(--warning)' : 'var(--text-muted)';
                                    const attColor   = grp.attendance_rate >= 80 ? 'var(--success)' : grp.attendance_rate >= 50 ? 'var(--warning)' : 'var(--danger)';
                                    const gradeColor = grp.avg_grade >= 80 ? 'var(--success)' : grp.avg_grade >= 60 ? 'var(--warning)' : 'var(--danger)';
                                    return (
                                        <tr key={grp.group_id || i}
                                            style={{ borderTop: '1px solid var(--card-border)', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-soft)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: 8, margin: '0 auto',
                                                    background: medal ? medal + '20' : 'var(--input-bg)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 800, fontSize: '0.82rem', color: medal || 'var(--text-muted)',
                                                }}>
                                                    {medal ? ['🥇','🥈','🥉'][i] : i + 1}
                                                </div>
                                            </td>
                                            <td style={{ padding: '11px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {grp.group_name || grp.name || '—'}
                                            </td>
                                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                    {grp.students_count ?? '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                                                {grp.avg_grade != null ? (
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: gradeColor + '18', color: gradeColor }}>
                                                        {grp.avg_grade}%
                                                    </span>
                                                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                            </td>
                                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                                                {grp.attendance_rate != null ? (
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: attColor + '18', color: attColor }}>
                                                        {grp.attendance_rate}%
                                                    </span>
                                                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                            </td>
                                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: scoreColor }}>
                                                    {grp.score ?? '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
