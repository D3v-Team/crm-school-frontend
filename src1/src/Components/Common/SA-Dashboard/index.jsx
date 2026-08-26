import React, { useState, useEffect } from 'react';
import { useGetOverviewQuery } from '../../../store/services/statistic.api';
import {
    Card,
    CardBody,
    CardHeader,
    Typography,
    Button,
    Select,
    Option,
} from '@material-tailwind/react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from 'recharts';
import {
    Users,
    UserCircle,
    BookOpen,
    GraduationCap,
    Users2,
    Wallet,
    CalendarDays,
    TrendingUp,
    PieChart as PieChartIcon,
    Trophy,
    CreditCard,
    DollarSign,
    Home,
} from 'lucide-react';
import Loading from '../../Other/UI/Loadings/Loading';

export default function Dashboard() {

    // Получаем текущие год и месяц
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Состояние фильтров: только год и месяц (дата и top удалены)
    const [filters, setFilters] = useState({
        year: currentYear,
        month: currentMonth,
        top: 3, // фиксировано
    });

    const { data, isLoading, error, refetch } = useGetOverviewQuery(filters);
    const overview = data?.data || data;

    // Обработчик для select (Material Tailwind передаёт значение)
    const handleSelectChange = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: parseInt(value) }));
    };

    // Подготовка данных для графиков
    const yearlyData = overview?.payment?.yearly_chart || [];
    const studentStatusData = overview?.payment?.students_status
        ? [
            { name: "To'liq to'lagan", value: overview.payment.students_status.full_paid || 0 },
            { name: "Qisman to'lagan", value: overview.payment.students_status.partial_paid || 0 },
            { name: "Qarzdorlar", value: overview.payment.students_status.debtors || 0 },
        ]
        : [];

    const monthlyMethods = overview?.payment?.monthly?.by_method
        ? Object.entries(overview.payment.monthly.by_method).map(([key, val]) => ({
            name: key === 'bank_account' ? 'Bank' : key.charAt(0).toUpperCase() + key.slice(1),
            count: val.count || 0,
            total: val.total_paid || 0,
        }))
        : [];

    const userRoles = overview?.general?.users
        ? Object.entries(overview.general.users).map(([role, count]) => ({
            name: role === 'hr' ? 'HR' : role.charAt(0).toUpperCase() + role.slice(1),
            value: count,
        }))
        : [];

    const chartColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

    // ---------- Вспомогательные компоненты ----------
    const StatCard = ({ icon: Icon, title, value, color = 'text-accent' }) => (
        <Card className="bg-card border border-border shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl h-full">
            <CardBody className="p-4 text-center flex flex-col items-center justify-center h-full">
                <div className={`mb-1 ${color}`}>
                    <Icon size={24} strokeWidth={1.5} />
                </div>
                <Typography variant="small" className="text-text-secondary font-medium uppercase tracking-wider text-xs">
                    {title}
                </Typography>
                <Typography variant="h5" className="text-text-primary font-bold mt-0.5">
                    {value}
                </Typography>
            </CardBody>
        </Card>
    );

    const StatGrid = ({ items }) => (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {items.map((item, idx) => (
                <div key={idx} className="bg-input-bg/50 rounded-lg p-2 text-center border border-border/40">
                    <Typography variant="small" className="text-text-secondary text-xs">
                        {item.label}
                    </Typography>
                    <Typography variant="h6" className="text-text-primary font-semibold text-sm">
                        {item.value}
                    </Typography>
                </div>
            ))}
        </div>
    );

    // ---------- Рендеринг ----------
    if (isLoading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-page p-6">
                <Card className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                    <CardBody>
                        <Typography color="red" className="font-medium">
                            ❌ Xatolik: {JSON.stringify(error)}
                        </Typography>
                    </CardBody>
                </Card>
            </div>
        );
    }

    const g = overview?.general;
    const pay = overview?.payment;
    const ranking = overview?.groups_ranking;

    // Опции для года (последние 10 лет)
    const yearOptions = [];
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
        yearOptions.push(y);
    }

    // Месяцы (на узбекском)
    const monthNames = [
        'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
        'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];

    return (
        <div className="min-h-screen ">
            <div className=" mx-auto">
                {/* Заголовок */}
                <div className="mb-8">
                    <Typography variant="h2" className="text-text-primary font-bold flex items-center gap-3">
                        <Home size={30} className="text-accent" />
                        Umumiy statistika
                    </Typography>
                    <Typography variant="small" className="text-text-secondary mt-1">
                        {new Date().toLocaleDateString('uz-UZ')} dagi ma'lumotlar
                    </Typography>
                </div>

                {/* Панель фильтров с Select */}
                <Card className="bg-card border border-border shadow-lg rounded-2xl mb-8">
                    <CardBody className="p-5 flex flex-wrap items-end gap-4">
                        <div className="min-w-[150px] flex-1">
                            <Select
                                label="Yil"
                                value={filters.year.toString()}
                                onChange={(val) => handleSelectChange('year', val)}
                                className="!bg-input-bg !border-input-border text-input-text"
                                labelProps={{ className: 'text-text-secondary' }}
                            >
                                {yearOptions.map((year) => (
                                    <Option key={year} value={year.toString()}>
                                        {year}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        <div className="min-w-[160px] flex-1">
                            <Select
                                label="Oy"
                                value={filters.month.toString()}
                                onChange={(val) => handleSelectChange('month', val)}
                                className="!bg-input-bg !border-input-border text-input-text"
                                labelProps={{ className: 'text-text-secondary' }}
                            >
                                {monthNames.map((name, idx) => (
                                    <Option key={idx + 1} value={(idx + 1).toString()}>
                                        {name}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        <Button
                            onClick={refetch}
                            className="bg-accent hover:bg-accent-hover text-white font-medium px-8 rounded-xl shadow-md hover:shadow-lg transition-all h-11 flex items-center"
                        >
                            Yangilash
                        </Button>
                    </CardBody>
                </Card>

                {/* Основные метрики */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    <StatCard icon={GraduationCap} title="Talabalar" value={g?.students?.total ?? 0} color="text-blue-500" />
                    <StatCard icon={Users} title="Foydalanuvchilar" value={g?.users ? Object.values(g.users).reduce((a, b) => a + b, 0) : 0} color="text-green-500" />
                    <StatCard icon={BookOpen} title="Siniflar" value={g?.groups_count ?? 0} color="text-orange-500" />
                    <StatCard icon={TrendingUp} title="Fanlar" value={g?.subjects_count ?? 0} color="text-purple-500" />
                    <StatCard icon={Users2} title="Ota-onalar" value={g?.parents?.total ?? 0} color="text-pink-500" />
                </div>

                {/* Детальные блоки */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    {g?.students && (
                        <Card className="bg-card border border-border shadow-lg rounded-2xl h-full">
                            <CardBody className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <UserCircle size={20} className="text-blue-500" />
                                    <Typography variant="h6" className="text-text-primary font-semibold text-base">
                                        Talabalar holati
                                    </Typography>
                                </div>
                                <StatGrid
                                    items={[
                                        { label: 'Faol', value: g.students.active ?? 0 },
                                        { label: 'Nofaol', value: g.students.inactive ?? 0 },
                                        { label: 'Jami', value: g.students.total ?? 0 },
                                    ]}
                                />
                            </CardBody>
                        </Card>
                    )}

                    {g?.parents && (
                        <Card className="bg-card border border-border shadow-lg rounded-2xl h-full">
                            <CardBody className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users2 size={20} className="text-pink-500" />
                                    <Typography variant="h6" className="text-text-primary font-semibold text-base">
                                        Ota-onalar
                                    </Typography>
                                </div>
                                <StatGrid
                                    items={[
                                        { label: 'Jami', value: g.parents.total ?? 0 },
                                        { label: 'Botga ulangan', value: g.parents.linked_to_bot ?? 0 },
                                        { label: 'Ulanganmagan', value: g.parents.not_linked ?? 0 },
                                    ]}
                                />
                            </CardBody>
                        </Card>
                    )}

                    {userRoles.length > 0 && (
                        <Card className="bg-card border border-border shadow-lg rounded-2xl h-full">
                            <CardBody className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users size={20} className="text-green-500" />
                                    <Typography variant="h6" className="text-text-primary font-semibold text-base">
                                        Foydalanuvchi rollari
                                    </Typography>
                                </div>
                                <StatGrid items={userRoles.map((role) => ({ label: role.name, value: role.value }))} />
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Платежи */}
                {pay && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                        <Card className="bg-card border border-border shadow-lg rounded-2xl">
                            <CardBody className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Wallet size={20} className="text-yellow-500" />
                                    <Typography variant="h6" className="text-text-primary font-semibold text-base">
                                        Oylik to'lovlar ({pay.monthly?.month}/{pay.monthly?.year})
                                    </Typography>
                                </div>
                                <StatGrid
                                    items={[
                                        { label: 'Kerakli', value: pay.monthly?.total_required ?? 0 },
                                        { label: "To'langan", value: pay.monthly?.total_paid ?? 0 },
                                        { label: 'Qarz', value: pay.monthly?.total_debt ?? 0 },
                                        { label: "To'lovlar soni", value: pay.monthly?.payments_count ?? 0 },
                                    ]}
                                />
                            </CardBody>
                        </Card>
                        <Card className="bg-card border border-border shadow-lg rounded-2xl">
                            <CardBody className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CalendarDays size={20} className="text-indigo-500" />
                                    <Typography variant="h6" className="text-text-primary font-semibold text-base">
                                        Kunlik to'lovlar ({pay.daily?.date})
                                    </Typography>
                                </div>
                                <StatGrid
                                    items={[
                                        { label: "To'langan", value: pay.daily?.total_paid ?? 0 },
                                        { label: "To'lovlar soni", value: pay.daily?.payments_count ?? 0 },
                                    ]}
                                />
                            </CardBody>
                        </Card>
                    </div>
                )}

                {/* Графики */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card className="bg-card border border-border shadow-lg rounded-2xl">
                        <div className="flex items-center p-4 gap-2">
                            <Trophy size={20} className="text-yellow-500" />
                            <Typography variant="h6" className="text-text-primary font-semibold text-base">
                                Eng yaxshi siniflar
                            </Typography>
                        </div>
                        <CardBody className="h-72 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                                    <XAxis dataKey="month" tickFormatter={(m) => `${m}`} stroke="var(--text-secondary)" />
                                    <YAxis stroke="var(--text-secondary)" />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--card-bg)',
                                            borderColor: 'var(--card-border)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                    <Legend wrapperStyle={{ color: 'var(--text-primary)' }} />
                                    <Bar dataKey="total_paid" name="To'langan" fill={chartColors[0]} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardBody>
                    </Card>

                    <Card className="bg-card border border-border shadow-lg rounded-2xl">
                        <div className="flex items-center p-4 gap-2">
                            <PieChartIcon size={20} className="text-purple-500" />
                            <Typography variant="h6" className="text-text-primary font-semibold text-base">
                                Talabalar to'lov holati
                            </Typography>
                        </div>
                        <CardBody className="h-72 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={studentStatusData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {studentStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--card-bg)',
                                            borderColor: 'var(--card-border)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardBody>
                    </Card>
                </div>

                {/* Методы оплаты */}
                {monthlyMethods.length > 0 && (
                    <Card className="bg-card border border-border shadow-lg rounded-2xl mb-8">
                        <div className="flex items-center p-4 gap-2">
                            <CreditCard size={20} className="text-emerald-500" />
                            <Typography variant="h6" className="text-text-primary font-semibold text-base">
                                To'lov usullari (oylik)
                            </Typography>
                        </div>
                        <CardBody className="h-64 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyMethods} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" />
                                    <YAxis stroke="var(--text-secondary)" />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--card-bg)',
                                            borderColor: 'var(--card-border)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                    <Legend wrapperStyle={{ color: 'var(--text-primary)' }} />
                                    <Bar dataKey="total" name="Summa" fill={chartColors[2]} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardBody>
                    </Card>
                )}

                {/* Топ групп */}
                {ranking?.top && ranking.top.length > 0 && (
                    <Card className="bg-card border border-border shadow-lg rounded-2xl mb-8">
                        <CardHeader floated={false} className="p-4 pb-0">
                            <div className="flex items-center gap-2">
                                <Trophy size={20} className="text-yellow-500" />
                                <Typography variant="h6" className="text-text-primary font-semibold text-base">
                                    Eng yaxshi siniflar
                                </Typography>
                            </div>
                        </CardHeader>
                                <CardBody className="p-4 overflow-x-auto">
                                    <div className="w-full">
                                        <table className="min-w-full w-full text-left">
                                            <thead>
                                                <tr className="border-border/40">
                                                    <th className="text-text-secondary font-semibold p-3">#</th>
                                                    <th className="text-text-secondary font-semibold p-3">Nomi</th>
                                                    <th className="text-text-secondary font-semibold p-3">Soni</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ranking.top.slice(0, 3).map((group, idx) => (
                                                    <tr key={idx} className="border-border/20">
                                                        <td className="text-text-primary p-3">{idx + 1}</td>
                                                        <td className="text-text-primary p-3">
                                                            {group.name || group.groupName || group.title || '—'}
                                                        </td>
                                                        <td className="text-text-primary p-3">
                                                            {group.count || group.students || group.value || '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardBody>
                    </Card>
                )}

                {/* Дополнительные поля (отладка) */}
                {overview && (() => {
                    const extra = Object.keys(overview).filter(k => !['general', 'groups_ranking', 'payment'].includes(k));
                    if (extra.length === 0) return null;
                    return (
                        <Card className="bg-card border border-border shadow-lg rounded-2xl">
                            <CardBody className="p-4">
                                <Typography variant="h6" className="text-text-primary mb-2 flex items-center gap-2 text-base">
                                    <DollarSign size={18} className="text-gray-400" />
                                    Qo'shimcha maydonlar
                                </Typography>
                                <pre className="bg-input-bg/70 p-3 rounded-xl overflow-auto text-sm text-text-primary border border-border/40">
                                    {JSON.stringify(
                                        extra.reduce((acc, k) => ({ ...acc, [k]: overview[k] }), {}),
                                        null,
                                        2
                                    )}
                                </pre>
                            </CardBody>
                        </Card>
                    );
                })()}
            </div>
        </div>
    );
}