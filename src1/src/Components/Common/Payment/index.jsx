// Payment.jsx
import { useState, useEffect, useCallback } from "react";
import { useLazyGetPaymentsQuery } from "../../../store/services/payment.api";
import { useLazyGetStudentsQuery } from "../../../store/services/student.api";
import {
    Card,
    CardBody,
    Typography,
    Chip,
    Spinner,
    Input,
} from "@material-tailwind/react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    RefreshCw,
    User,
    Users,
    DollarSign,
    Calendar,
    Clock,
    CreditCard,
} from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";
import EditPayment from "./__components/EditPayment";
import DeletePayment from "../StudentProfile/DeletePayment";

const MONTHS = [
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

export default function Payment() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [searchStudent, setSearchStudent] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [students, setStudents] = useState([]);
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);

    const [trigger, { data, isLoading, error, refetch }] = useLazyGetPaymentsQuery();
    const [fetchStudents, { data: studentsData, isLoading: studentsLoading }] = useLazyGetStudentsQuery();

    // Загружаем студентов для поиска
    useEffect(() => {
        if (searchStudent.length > 1) {
            fetchStudents({ search: searchStudent, limit: 10 });
        }
    }, [searchStudent, fetchStudents]);

    useEffect(() => {
        if (studentsData) {
            const records = studentsData?.data?.records || [];
            setStudents(records);
        }
    }, [studentsData]);

    const fetchPayments = useCallback(() => {
        const params = {
            page,
            limit,
            year,
            month,
            ...(selectedStudentId && { student_id: selectedStudentId }),
        };
        trigger(params);
    }, [page, year, month, selectedStudentId, trigger, limit]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const payments = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;
    const totalCount = pagination.total_count || 0;

    const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

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

    const handleStudentSelect = (student) => {
        setSelectedStudentId(student.id);
        setSearchStudent(student.full_name);
        setShowStudentDropdown(false);
        setPage(1);
    };

    const handleClearStudent = () => {
        setSelectedStudentId("");
        setSearchStudent("");
        setShowStudentDropdown(false);
        setPage(1);
    };

    if (isLoading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="mt-[10px]">
                <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                    <CardBody>
                        <Typography color="red">
                            Xatolik: {error?.data?.message || "Noma'lum xatolik"}
                        </Typography>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="mt-[10px]">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold text-text-primary flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-accent" />
                    To‘lovlar
                </h1>
                <button
                    onClick={refetch}
                    className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent transition-colors"
                    title="Yangilash"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Фильтры */}
            <div className="bg-card border border-border rounded-lg p-3 mb-4 shadow-md">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-32">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Yil</label>
                        <select
                            value={year}
                            onChange={(e) => {
                                setYear(Number(e.target.value));
                                setPage(1);
                            }}
                            className="w-full px-4 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors"
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
                            className="w-full px-4 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors"
                        >
                            {MONTHS.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px] relative">
                        <label className="block text-sm font-medium text-text-secondary mb-1">O‘quvchi</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ism yoki telefon bo‘yicha qidirish..."
                                value={searchStudent}
                                onChange={(e) => {
                                    setSearchStudent(e.target.value);
                                    setShowStudentDropdown(true);
                                    if (!e.target.value) {
                                        setSelectedStudentId("");
                                    }
                                }}
                                onFocus={() => setShowStudentDropdown(true)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none transition-colors"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                            {selectedStudentId && (
                                <button
                                    onClick={handleClearStudent}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-accent"
                                >
                                    ✕
                                </button>
                            )}
                            {showStudentDropdown && searchStudent.length > 1 && (
                                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {studentsLoading ? (
                                        <div className="p-2 text-text-secondary">Yuklanmoqda...</div>
                                    ) : students.length === 0 ? (
                                        <div className="p-2 text-text-secondary">O‘quvchilar topilmadi</div>
                                    ) : (
                                        students.map((student) => (
                                            <div
                                                key={student.id}
                                                className="p-2 hover:bg-accent/10 cursor-pointer transition-colors"
                                                onClick={() => handleStudentSelect(student)}
                                            >
                                                <Typography className="text-text-primary">
                                                    {student.full_name}
                                                </Typography>
                                                <Typography className="text-text-secondary text-xs">
                                                    {student.phone}
                                                </Typography>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Таблица платежей */}
            {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-input-bg/30 rounded-xl border border-border/40">
                    <CreditCard className="w-16 h-16 text-text-secondary/30 mb-3" />
                    <Typography className="text-text-secondary text-base font-medium">
                        To‘lovlar mavjud emas
                    </Typography>
                    <Typography className="text-text-secondary text-sm mt-1">
                        Hozircha hech qanday to‘lov qilinmagan
                    </Typography>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-md">
                        <table className="w-full text-sm text-text-primary">
                            <thead className="bg-[var(--card-bg)]/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">№</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">O‘quvchi</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Guruh</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Davri</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">To‘langan</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Kerakli</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Chegirma</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Usul</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Sana</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Izoh</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment, index) => (
                                    <tr
                                        key={payment.id}
                                        className="border-b border-border hover:bg-[var(--accent)]/5 transition-colors last:border-0"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium">
                                            {payment.student?.full_name || "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {payment.student?.group?.name || "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {payment.year}/{String(payment.month).padStart(2, "0")}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">
                                            {Number(payment.paid_amount).toLocaleString("ru-RU")} so‘m
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {Number(payment.required_amount).toLocaleString("ru-RU")} so‘m
                                        </td>
                                        <td className="px-4 py-3">
                                            {payment.discount_percent && Number(payment.discount_percent) > 0
                                                ? `${payment.discount_percent}%`
                                                : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-600 dark:text-green-400">
                                                {methodLabels[payment.method] || payment.method}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-text-secondary">
                                            {new Date(payment.createdAt).toLocaleDateString("uz-UZ")}
                                            <br />
                                            {new Date(payment.createdAt).toLocaleTimeString("uz-UZ", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary text-xs max-w-[150px] truncate">
                                            {payment.comment || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary text-xs max-w-[150px] truncate">
                                            <div className="flex items-center gap-2">
                                                <EditPayment payment={payment} onUpdate={() => {
                                                    // Обновляем список: перезагружаем текущую страницу
                                                    fetchPayments();
                                                }} />
                                                <DeletePayment paymentId={payment.id} onDelete={() => {
                                                    // Обновляем список: перезагружаем текущую страницу
                                                    fetchPayments();
                                                }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Пагинация */}
                    <div className="flex flex-wrap items-center justify-between mt-4 gap-2">
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
                </>
            )}
        </div>
    );
}