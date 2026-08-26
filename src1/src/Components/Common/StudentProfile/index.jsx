// StudentProfile.jsx
import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useGetStudentByIdQuery } from "../../../store/services/student.api";
import { useLazyGetPaymentsQuery } from "../../../store/services/payment.api";
import { useLazyGetAttendanceQuery } from "../../../store/services/attedance.api";
import { useLazyGetGradesQuery } from "../../../store/services/grades.api";
import {
    Card,
    CardBody,
    Typography,
    Chip,
    Button,
    Tabs,
    TabsHeader,
    TabsBody,
    Tab,
    TabPanel,
    Select,
    Option,
    Spinner,
} from "@material-tailwind/react";
import {
    User,
    Phone,
    DollarSign,
    Calendar,
    Clock,
    Users,
    ArrowLeft,
    Edit,
    CreditCard,
    GraduationCap,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CheckCircle2,
    XCircle,
    Timer,
    Award,
    ClipboardList,
    RefreshCw,
} from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";
import Payment from "./Payment";
import DeletePayment from "./DeletePayment";
import EditPayment from "./EditPayment";
// PaymentsTab – вкладка с платежами в виде карточек (полная ширина)
// PaymentsTab – вкладка с платежами в виде карточек (полная ширина, обычные select, зелёный чип для метода)
function PaymentsTab({ studentId }) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [page, setPage] = useState(1);
    const [limit] = useState(6);
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [trigger, { data, isLoading, error }] = useLazyGetPaymentsQuery();

    useEffect(() => {
        if (studentId) {
            trigger({ student_id: studentId, year, month, page, limit });
        }
    }, [studentId, year, month, page, limit, trigger]);

    const payments = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;
    const totalCount = pagination.total_count || 0;

    const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);
    const months = [
        { value: 1, label: "Yanvar" },
        { value: 2, label: "Fevral" },
        { value: 3, label: "Mart" },
        { value: 4, label: "Aprel" },
        { value: 5, label: "May" },
        { value: 6, label: "Iyun" },
        { value: 7, label: "Iyul" },
        { value: 8, label: "Avgust" },
        { value: 9, label: "Sentyabr" },
        { value: 10, label: "Oktyabr" },
        { value: 11, label: "Noyabr" },
        { value: 12, label: "Dekabr" },
    ];

    const methodLabels = {
        cash: "Naqd",
        card: "Karta",
        transfer: "Pul o‘tkazmasi",
        bank_account: "Bank hisobi",
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setPage(currentPage - 1);
    };
    const handleNextPage = () => {
        if (currentPage < totalPages) setPage(currentPage + 1);
    };
    const handleFirstPage = () => {
        if (currentPage !== 1) setPage(1);
    };
    const handleLastPage = () => {
        if (currentPage !== totalPages) setPage(totalPages);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Spinner className="h-8 w-8 text-accent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                Xatolik: {error?.data?.message || "Noma'lum xatolik"}
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full">
            {/* Фильтры – обычные select */}
            <div className="flex flex-wrap gap-3 items-end">
                <div className="w-32">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Yil</label>
                    <select
                        value={year}
                        onChange={(e) => {
                            setYear(Number(e.target.value));
                            setPage(1);
                        }}
                        className="w-full px-2 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="w-40">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Oy</label>
                    <select
                        value={month}
                        onChange={(e) => {
                            setMonth(Number(e.target.value));
                            setPage(1);
                        }}
                        className="w-full px-2 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors"
                    >
                        {months.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Список карточек */}
            {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-input-bg/30 rounded-xl border border-border/40 w-full">
                    <CreditCard className="w-16 h-16 text-text-secondary/30 mb-3" />
                    <Typography className="text-text-secondary text-base font-medium">
                        To‘lovlar mavjud emas
                    </Typography>
                    <Typography className="text-text-secondary text-sm mt-1">
                        Ushbu o‘quvchi uchun hali to‘lov qilinmagan
                    </Typography>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 w-full">
                    {payments.map((payment) => (
                        <div
                            key={payment.id}
                            className="p-4 rounded-xl bg-input-bg/40 border border-border/40 hover:shadow-md transition-shadow w-full"
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <Typography className="text-2xl font-bold text-text-primary">
                                            {Number(payment.paid_amount).toLocaleString("ru-RU")} so‘m
                                        </Typography>
                                        <Typography className="text-sm text-text-secondary">
                                            Kerakli: {Number(payment.required_amount).toLocaleString("ru-RU")} so‘m
                                        </Typography>
                                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400">
                                            {methodLabels[payment.method] || payment.method}
                                        </span>
                                    </div>
                                    {/* Зелёный чип для метода оплаты */}

                                    <div className="flex items-center gap-2">
                                        <EditPayment payment={payment} onUpdate={() => {
                                            // Обновляем список: перезагружаем текущую страницу
                                            trigger({ student_id: studentId, year, month, page, limit })
                                        }} />
                                        <DeletePayment paymentId={payment.id} onDelete={() => {
                                            // Обновляем список: перезагружаем текущую страницу
                                            trigger({ student_id: studentId, year, month, page, limit });
                                        }} />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        To‘lov davri: {payment.year}/{String(payment.month).padStart(2, "0")}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        Yaratilgan: {new Date(payment.createdAt).toLocaleDateString("uz-UZ")}
                                    </span>
                                    <span className="text-xs">
                                        {new Date(payment.createdAt).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    {payment.discount_percent && Number(payment.discount_percent) > 0 && (
                                        <span className="text-green-500 text-xs font-medium">
                                            Chegirma: {payment.discount_percent}%
                                        </span>
                                    )}
                                </div>

                                {payment.comment && (
                                    <Typography className="text-text-secondary text-sm italic border-t border-border/30 pt-2 mt-1">
                                        Izoh: {payment.comment}
                                    </Typography>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Пагинация */}
            {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between mt-4 gap-2 w-full">
                    <div className="text-sm text-text-secondary">
                        {totalCount > 0 && (
                            <>Jami {totalCount} ta to‘lov, {currentPage} / {totalPages} sahifa</>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleFirstPage}
                            disabled={currentPage <= 1}
                            className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronsLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage <= 1}
                            className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="px-3 py-1 rounded-lg bg-accent/10 text-accent font-medium">
                            {currentPage}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages}
                            className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleLastPage}
                            disabled={currentPage >= totalPages}
                            className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronsRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// AttendanceGradesSection – блок ВНИЗУ страницы (не таб), объединяет
// давомат (/api/attendance) и baho (/api/grade) по sana + fan в один список
// ─────────────────────────────────────────────────────────────────────────

// Форматирует дату в YYYY-MM-DD по локальному времени (Toshkent, UTC+5),
// не используя toISOString(), чтобы не терять день из-за сдвига UTC.
const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
};

const ATTENDANCE_STATUS_MAP = {
    present: { label: "Keldi", className: "bg-green-500/15 text-green-600", icon: CheckCircle2 },
    absent: { label: "Kelmadi", className: "bg-red-500/15 text-red-600", icon: XCircle },
    late: { label: "Kechikdi", className: "bg-amber-500/15 text-amber-600", icon: Timer },
};

const DAY_LABELS = {
    monday: "Dushanba",
    tuesday: "Seshanba",
    wednesday: "Chorshanba",
    thursday: "Payshanba",
    friday: "Juma",
    saturday: "Shanba",
    sunday: "Yakshanba",
};

// В ответе /api/grade оценка приходит в поле "score"
const extractGradeValue = (subj) => {
    if (!subj) return null;
    const candidate = subj.score;
    return candidate === undefined || candidate === null || candidate === "" ? null : candidate;
};

const gradeColorClass = (value) => {
    const num = Number(value);
    if (isNaN(num)) return "bg-input-bg text-text-secondary";
    if (num >= 8) return "bg-green-500/15 text-green-600";
    if (num >= 5) return "bg-amber-500/15 text-amber-600";
    return "bg-red-500/15 text-red-600";
};

function AttendanceGradesSection({ studentId }) {
    const now = new Date();
    const [dateFrom, setDateFrom] = useState(
        formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
    );
    const [dateTo, setDateTo] = useState(formatLocalDate(now));

    const [fetchAttendance, { data: attendanceData, isLoading: attendanceLoading, isFetching: attendanceFetching, error: attendanceError }] =
        useLazyGetAttendanceQuery();
    const [fetchGrades, { data: gradesData, isLoading: gradesLoading, isFetching: gradesFetching, error: gradesError }] =
        useLazyGetGradesQuery();

    const loadData = () => {
        if (!studentId) return;
        fetchAttendance({ student_id: studentId, date_from: dateFrom, date_to: dateTo, page: 1 });
        fetchGrades({ student_id: studentId, date_from: dateFrom, date_to: dateTo, page: 1 });
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId, dateFrom, dateTo]);

    const isLoading = attendanceLoading || gradesLoading || attendanceFetching || gradesFetching;
    const hasError = attendanceError || gradesError;

    // Объединяем davomat va baho в один список.
    // ВАЖНО: в один день по одному и тому же предмету может быть несколько
    // уроков (разные пары/смены) — они отличаются по group_schedule_id.
    // Поэтому ключ склейки — "sana + group_schedule_id", а не "sana + fan".
    const mergedRows = useMemo(() => {
        const rowsMap = {};

        const attendanceRecords = attendanceData?.data?.records || [];
        const myAttendance = attendanceRecords.find((r) => r.student_id === studentId);
        myAttendance?.dates?.forEach((dateEntry) => {
            dateEntry.subjects?.forEach((subj) => {
                const key = `${dateEntry.date}__${subj.group_schedule_id}`;
                rowsMap[key] = {
                    ...(rowsMap[key] || {}),
                    date: dateEntry.date,
                    day_of_week: dateEntry.day_of_week,
                    group_schedule_id: subj.group_schedule_id,
                    subject_id: subj.subject_id,
                    subject_name: subj.subject_name,
                    teacher_name: subj.teacher_name,
                    status: subj.status,
                    attendance_comment: subj.comment || "",
                };
            });
        });

        const gradeRecords = gradesData?.data?.records || [];
        const myGrades = gradeRecords.find((r) => r.student_id === studentId);
        myGrades?.dates?.forEach((dateEntry) => {
            dateEntry.subjects?.forEach((subj) => {
                const key = `${dateEntry.date}__${subj.group_schedule_id}`;
                rowsMap[key] = {
                    ...(rowsMap[key] || {}),
                    date: dateEntry.date,
                    day_of_week: dateEntry.day_of_week,
                    group_schedule_id: subj.group_schedule_id,
                    subject_id: subj.subject_id,
                    subject_name: subj.subject_name,
                    teacher_name: rowsMap[key]?.teacher_name || subj.teacher_name,
                    grade: extractGradeValue(subj),
                    grade_comment: subj.comment || "",
                };
            });
        });

        return Object.values(rowsMap).sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date); // yangi sanalar tepada
            return (a.subject_name || "").localeCompare(b.subject_name || "");
        });
    }, [attendanceData, gradesData, studentId]);

    // Statistikalar + davomat foizi
    const stats = useMemo(() => {
        const total = mergedRows.length;
        const present = mergedRows.filter((r) => r.status === "present").length;
        const absent = mergedRows.filter((r) => r.status === "absent").length;
        const late = mergedRows.filter((r) => r.status === "late").length;
        const marked = present + absent + late; // faqat belgilangan darslar
        const attendancePercent = marked > 0 ? Math.round((present / marked) * 100) : null;

        const graded = mergedRows.filter((r) => r.grade !== null && r.grade !== undefined);
        const avgGrade = graded.length > 0
            ? (graded.reduce((sum, r) => sum + (Number(r.grade) || 0), 0) / graded.length).toFixed(1)
            : null;

        return { total, present, absent, late, marked, attendancePercent, avgGrade, gradedCount: graded.length };
    }, [mergedRows]);

    return (
        <Card className="bg-card border border-border shadow-lg rounded-2xl mt-6">
            <CardBody className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-accent/10">
                            <ClipboardList className="text-accent" size={20} />
                        </div>
                        <div>
                            <Typography variant="h5" className="text-text-primary font-semibold leading-tight">
                                Davomat va baholar
                            </Typography>
                            <Typography className="text-text-secondary text-xs">
                                Tanlangan davr uchun barcha darslar bo‘yicha davomat va baho
                            </Typography>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 items-end">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Dan</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Gacha</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors text-sm"
                            />
                        </div>
                        <button
                            onClick={loadData}
                            disabled={isLoading}
                            className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Yangilash
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Spinner className="h-8 w-8 text-accent" />
                    </div>
                ) : hasError ? (
                    <div className="text-red-500 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        Xatolik: {attendanceError?.data?.message || gradesError?.data?.message || "Noma'lum xatolik"}
                    </div>
                ) : mergedRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-input-bg/30 rounded-xl border border-border/40">
                        <ClipboardList className="w-16 h-16 text-text-secondary/30 mb-3" />
                        <Typography className="text-text-secondary text-base font-medium">
                            Ma'lumotlar topilmadi
                        </Typography>
                        <Typography className="text-text-secondary text-sm mt-1">
                            Tanlangan davrda dars, davomat yoki baho qayd etilmagan
                        </Typography>
                    </div>
                ) : (
                    <>
                        {/* Краткая статистика */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                            <div className="rounded-xl border border-border/60 bg-input-bg/30 p-3 text-center">
                                <Typography className="text-text-secondary text-xs mb-1">Keldi</Typography>
                                <Typography className="text-green-600 text-xl font-bold">{stats.present}</Typography>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-input-bg/30 p-3 text-center">
                                <Typography className="text-text-secondary text-xs mb-1">Kelmadi</Typography>
                                <Typography className="text-red-500 text-xl font-bold">{stats.absent}</Typography>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-input-bg/30 p-3 text-center">
                                <Typography className="text-text-secondary text-xs mb-1">Kechikdi</Typography>
                                <Typography className="text-amber-500 text-xl font-bold">{stats.late}</Typography>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-input-bg/30 p-3 text-center">
                                <Typography className="text-text-secondary text-xs mb-1">O‘rtacha baho</Typography>
                                <Typography className="text-accent text-xl font-bold">
                                    {stats.avgGrade !== null ? stats.avgGrade : "—"}
                                </Typography>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-input-bg/30 p-3 text-center col-span-2 sm:col-span-1">
                                <Typography className="text-text-secondary text-xs mb-1">Davomat foizi</Typography>
                                <Typography
                                    className={`text-xl font-bold ${stats.attendancePercent === null
                                        ? "text-text-secondary"
                                        : stats.attendancePercent >= 80
                                            ? "text-green-600"
                                            : stats.attendancePercent >= 50
                                                ? "text-amber-500"
                                                : "text-red-500"
                                        }`}
                                >
                                    {stats.attendancePercent !== null ? `${stats.attendancePercent}%` : "—"}
                                </Typography>
                            </div>
                        </div>

                        {/* Umumiy davomat progress-bar */}
                        {stats.attendancePercent !== null && (
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-1.5">
                                    <Typography className="text-text-secondary text-xs">
                                        Davomat: {stats.present} / {stats.marked} dars ({stats.attendancePercent}%)
                                    </Typography>
                                </div>
                                <div className="h-2.5 w-full rounded-full bg-input-bg overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${stats.attendancePercent >= 80
                                            ? "bg-green-500"
                                            : stats.attendancePercent >= 50
                                                ? "bg-amber-500"
                                                : "bg-red-500"
                                            }`}
                                        style={{ width: `${stats.attendancePercent}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Единая таблица davomat + baho. Sana — <th scope="row"> (birinchi ustun sarlavha sifatida) */}
                        <div className="overflow-x-auto rounded-xl border border-border/60">
                            <table className="w-full text-sm text-text-primary border-collapse">
                                <thead>
                                    <tr className="bg-input-bg/50 border-b border-border">
                                        <th scope="col" className="px-4 py-3 text-left font-semibold text-text-secondary sticky left-0 bg-input-bg/50 z-10">
                                            № / Sana
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left font-semibold text-text-secondary">Fan</th>
                                        <th scope="col" className="px-4 py-3 text-left font-semibold text-text-secondary">O‘qituvchi</th>
                                        <th scope="col" className="px-4 py-3 text-left font-semibold text-text-secondary">Davomat</th>
                                        <th scope="col" className="px-4 py-3 text-left font-semibold text-text-secondary">Baho</th>
                                        <th scope="col" className="px-4 py-3 text-left font-semibold text-text-secondary">Izoh</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mergedRows.map((row, index) => {
                                        const statusInfo = ATTENDANCE_STATUS_MAP[row.status];
                                        const StatusIcon = statusInfo?.icon;
                                        const hasGrade = row.grade !== null && row.grade !== undefined;
                                        const comments = [row.attendance_comment, row.grade_comment].filter(Boolean);
                                        const dayLabel = DAY_LABELS[row.day_of_week] || "";
                                        return (
                                            <tr
                                                key={`${row.date}__${row.group_schedule_id}`}
                                                className="border-b border-border/40 hover:bg-input-bg/20 transition-colors"
                                            >
                                                <th
                                                    scope="row"
                                                    className="px-4 py-3 text-left font-medium whitespace-nowrap sticky left-0 bg-card z-10"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-accent/10 text-accent text-[11px] font-bold flex-shrink-0">
                                                            {index + 1}
                                                        </span>
                                                        <div className="leading-tight">
                                                            <span className="block text-text-primary font-semibold">
                                                                {parseLocalDate(row.date).toLocaleDateString("uz-UZ", {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                })}
                                                            </span>
                                                            {dayLabel && (
                                                                <span className="block text-[10px] font-normal text-text-secondary/70">
                                                                    {dayLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </th>
                                                <td className="px-4 py-3 font-medium">{row.subject_name || "—"}</td>
                                                <td className="px-4 py-3 text-text-secondary">{row.teacher_name || "—"}</td>
                                                <td className="px-4 py-3">
                                                    {statusInfo ? (
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${statusInfo.className}`}
                                                        >
                                                            {StatusIcon && <StatusIcon size={14} />}
                                                            {statusInfo.label}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-text-secondary/60">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {hasGrade ? (
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${gradeColorClass(row.grade)}`}
                                                        >
                                                            <Award size={14} />
                                                            {row.grade}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-text-secondary/60">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-text-secondary text-xs max-w-[220px]">
                                                    {comments.length > 0 ? comments.join(" · ") : "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
}

export default function StudentProfile() {
    const { id } = useParams();
    const {
        data: studentData,
        isLoading: studentLoading,
        error: studentError,
    } = useGetStudentByIdQuery(id, { skip: !id });

    const student = studentData?.data || studentData;

    if (!id) {
        return (
            <div className="p-6">
                <Card className="bg-card border border-border shadow-lg rounded-2xl p-6 text-center">
                    <CardBody>
                        <Typography variant="h5" className="text-text-primary">
                            ID topilmadi
                        </Typography>
                        <Typography className="text-text-secondary">
                            Iltimos, to‘g‘ri URL manzilni kiriting.
                        </Typography>
                    </CardBody>
                </Card>
            </div>
        );
    }

    if (studentLoading) return <Loading />;

    if (studentError) {
        return (
            <div className="p-6">
                <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                    <CardBody>
                        <Typography color="red">
                            Xatolik: {studentError?.data?.message || "Noma'lum xatolik"}
                        </Typography>
                    </CardBody>
                </Card>
            </div>
        );
    }

    const getInitials = (name) => {
        if (!name) return "?";
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return parts[0][0] + parts[1][0];
        }
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <div className="mt-[10px]">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Typography variant="h3" className="text-text-primary font-bold flex items-center gap-3">
                        <User size={28} className="text-accent" />
                        O‘quvchi profili
                    </Typography>
                </div>
                <Payment requiredAmount={student?.price} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-card border border-border shadow-lg rounded-2xl lg:col-span-1">
                    <CardBody className="p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center mb-4 border-2 border-accent/20">
                                <span className="text-4xl font-bold text-accent">
                                    {getInitials(student?.full_name)}
                                </span>
                            </div>
                            <Typography variant="h5" className="text-text-primary font-bold">
                                {student?.full_name}
                            </Typography>
                            <Chip
                                size="sm"
                                value={student?.is_active ? "Faol" : "Nofaol"}
                                color={student?.is_active ? "green" : "red"}
                                className="ml-2"
                            />
                            <div className="mt-6 space-y-3 w-full">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-input-bg/30 border border-border/30">
                                    <Phone size={18} className="text-text-secondary flex-shrink-0" />
                                    <div className="text-left">
                                        <Typography className="text-text-secondary text-xs">Telefon</Typography>
                                        <Typography className="text-text-primary">
                                            {student?.phone || "—"}
                                        </Typography>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-input-bg/30 border border-border/30">
                                    <DollarSign size={18} className="text-text-secondary flex-shrink-0" />
                                    <div className="text-left">
                                        <Typography className="text-text-secondary text-xs">Narx</Typography>
                                        <Typography className="text-text-primary">
                                            {student?.price
                                                ? Number(student.price).toLocaleString("ru-RU") + " so‘m"
                                                : "—"}
                                        </Typography>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-input-bg/30 border border-border/30">
                                    <Calendar size={18} className="text-text-secondary flex-shrink-0" />
                                    <div className="text-left">
                                        <Typography className="text-text-secondary text-xs">Ro‘yxatdan o‘tgan</Typography>
                                        <Typography className="text-text-primary">
                                            {student?.createdAt
                                                ? new Date(student.createdAt).toLocaleDateString("uz-UZ")
                                                : "—"}
                                        </Typography>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-input-bg/30 border border-border/30">
                                    <Clock size={18} className="text-text-secondary flex-shrink-0" />
                                    <div className="text-left">
                                        <Typography className="text-text-secondary text-xs">Oxirgi yangilanish</Typography>
                                        <Typography className="text-text-primary">
                                            {student?.updatedAt
                                                ? new Date(student.updatedAt).toLocaleDateString("uz-UZ")
                                                : "—"}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-card border border-border shadow-lg rounded-2xl lg:col-span-2">
                    <CardBody className="p-4">
                        <Tabs value="group" className="w-full">
                            <TabsHeader
                                className="bg-input-bg/50 rounded-xl p-1 overflow-x-auto"
                                indicatorProps={{
                                    className: "bg-accent shadow-none rounded-lg",
                                }}
                            >
                                <Tab
                                    value="group"
                                    className="text-text-secondary data-[active=true]:text-white data-[active=true]:bg-accent data-[active=true]:rounded-lg transition-all duration-200 font-medium"
                                >
                                    <GraduationCap size={18} className="inline mr-1.5" /> Guruh
                                </Tab>
                                <Tab
                                    value="parent"
                                    className="text-text-secondary data-[active=true]:text-white data-[active=true]:bg-accent data-[active=true]:rounded-lg transition-all duration-200 font-medium"
                                >
                                    <UserCircle size={18} className="inline mr-1.5" /> Ota-ona
                                </Tab>
                                <Tab
                                    value="payments"
                                    className="text-text-secondary data-[active=true]:text-white data-[active=true]:bg-accent data-[active=true]:rounded-lg transition-all duration-200 font-medium"
                                >
                                    <CreditCard size={18} className="inline mr-1.5" /> To‘lovlar
                                </Tab>
                            </TabsHeader>
                            <TabsBody className="mt-4">
                                <TabPanel value="group" className="p-0">
                                    {student?.group ? (
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl bg-input-bg/40 border border-border/40">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <GraduationCap size={18} className="text-accent" />
                                                    <Typography className="text-text-secondary text-sm">
                                                        Guruh nomi
                                                    </Typography>
                                                </div>
                                                <Typography className="text-text-primary font-medium text-lg">
                                                    {student.group.name}
                                                </Typography>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 rounded-xl bg-input-bg/40 border border-border/40">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Calendar size={18} className="text-accent" />
                                                        <Typography className="text-text-secondary text-sm">
                                                            Boshlanish sanasi
                                                        </Typography>
                                                    </div>
                                                    <Typography className="text-text-primary">
                                                        {student.group.start_date
                                                            ? new Date(student.group.start_date).toLocaleDateString("uz-UZ")
                                                            : "—"}
                                                    </Typography>
                                                </div>

                                                <div className="p-4 rounded-xl bg-input-bg/40 border border-border/40">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Users size={18} className="text-accent" />
                                                        <Typography className="text-text-secondary text-sm">
                                                            Sinf rahbari
                                                        </Typography>
                                                    </div>
                                                    {student.group.homeroom_teacher ? (
                                                        <Link
                                                            to={`/teacher/${student.group.homeroom_teacher.id}`}
                                                            className="text-text-primary hover:text-accent hover:underline transition-colors font-mono text-sm"
                                                        >
                                                            {student.group.homeroom_teacher.full_name}
                                                        </Link>
                                                    ) : (
                                                        <Typography className="text-text-primary font-mono text-sm">
                                                            {student.group.homeroom_teacher_id ? 'ID: ' + student.group.homeroom_teacher_id : '—'}
                                                        </Typography>
                                                    )}
                                                </div>
                                            </div>

                                            {student.group_assigned_at && (
                                                <div className="p-4 rounded-xl bg-input-bg/40 border border-border/40">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Clock size={18} className="text-accent" />
                                                        <Typography className="text-text-secondary text-sm">
                                                            Guruhga qo‘shilgan vaqt
                                                        </Typography>
                                                    </div>
                                                    <Typography className="text-text-primary">
                                                        {new Date(student.group_assigned_at).toLocaleString("uz-UZ")}
                                                    </Typography>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center bg-input-bg/30 rounded-xl border border-border/40">
                                            <GraduationCap className="w-16 h-16 text-text-secondary/30 mb-3" />
                                            <Typography className="text-text-secondary text-base font-medium">
                                                O‘quvchi hali guruhga biriktirilmagan
                                            </Typography>
                                            <Typography className="text-text-secondary text-sm mt-1">
                                                Admin yoki HR tomonidan guruh biriktirilishi mumkin
                                            </Typography>
                                        </div>
                                    )}
                                </TabPanel>
                                <TabPanel value="parent" className="p-0">
                                    {student?.parent ? (
                                        <div className=" space-y-4">
                                            {/* Карточка родителя */}
                                            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-accent/5 to-transparent border border-border/40">
                                                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                                                    <UserCircle size={32} className="text-accent" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <Typography className="text-text-primary font-semibold text-lg truncate">
                                                        {student.parent.full_name}
                                                    </Typography>
                                                    {student.parent.username && (
                                                        <Typography className="text-text-secondary text-sm truncate">
                                                            @{student.parent.username}
                                                        </Typography>
                                                    )}
                                                </div>
                                                <Chip
                                                    size="sm"
                                                    value="Ota-ona"
                                                    color="blue"
                                                    className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                />
                                            </div>

                                            {/* Детали */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-3 p-3 rounded-xl bg-input-bg/30 border border-border/30">
                                                    <Phone size={18} className="text-text-secondary flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <Typography className="text-text-secondary text-xs">Telefon</Typography>
                                                        <Typography className="text-text-primary font-medium truncate">
                                                            {student.parent.phone || '—'}
                                                        </Typography>
                                                    </div>
                                                </div>

                                                {student.parent.createdAt && (
                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-input-bg/30 border border-border/30">
                                                        <Calendar size={18} className="text-text-secondary flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <Typography className="text-text-secondary text-xs">Ro‘yxatdan o‘tgan</Typography>
                                                            <Typography className="text-text-primary font-medium truncate">
                                                                {new Date(student.parent.createdAt).toLocaleDateString('uz-UZ')}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                )}

                                                {student.parent.chat_id && (
                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-input-bg/30 border border-border/30 md:col-span-2">
                                                        <MessageCircle size={18} className="text-text-secondary flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <Typography className="text-text-secondary text-xs">Chat ID</Typography>
                                                            <Typography className="text-text-primary font-medium truncate">
                                                                {student.parent.chat_id}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                )}

                                                {student.parent.email && (
                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-input-bg/30 border border-border/30 md:col-span-2">
                                                        <Mail size={18} className="text-text-secondary flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <Typography className="text-text-secondary text-xs">Email</Typography>
                                                            <Typography className="text-text-primary font-medium truncate">
                                                                {student.parent.email}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center bg-input-bg/30 rounded-xl border border-border/40">
                                            <UserCircle size={48} className="text-text-secondary/30 mb-3" />
                                            <Typography className="text-text-secondary text-base font-medium">
                                                Ota-ona ma'lumotlari mavjud emas
                                            </Typography>
                                            <Typography className="text-text-secondary text-sm mt-1">
                                                O‘quvchiga ota-ona biriktirilmagan
                                            </Typography>
                                        </div>
                                    )}
                                </TabPanel>
                                <TabPanel value="payments" className="p-0">
                                    <PaymentsTab studentId={id} />
                                </TabPanel>
                            </TabsBody>
                        </Tabs>
                    </CardBody>
                </Card>
            </div>
            {/* Davomat va baholar – alohida blok, tab emas, sahifa pastida */}
            <AttendanceGradesSection studentId={id} />
        </div>
    );
}