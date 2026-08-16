import { useEffect, useState } from "react";
import { useLazyGetUsersQuery } from "../../../store/services/user.api";
import Create from "./__components/Create";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, RefreshCw } from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";
import Edit from "./__components/Edit";
import Delete from "./__components/Delete";

const ROLES = [
    { value: "", label: "Barcha rollar" },
    { value: "admin", label: "Admin" },
    { value: "teacher", label: "O‘qituvchi" },
    { value: "hr", label: "HR" },
    { value: "cashier", label: "Kassir" },
];

const DEFAULT_ROLES = ROLES.map(r => r.value).filter(v => v && v !== 'super_admin' && v !== 'parent').join(',');

export default function SA_Employee() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");

    const [trigger, { data, isLoading, error }] = useLazyGetUsersQuery();

    const fetchUsers = (pageNum = page) => {
        const roleParam = role && role.length > 0 ? role : DEFAULT_ROLES;
        const params = {
            page: pageNum,
            limit,
            ...(search && { search }),
            ...(roleParam && { role: roleParam }),
        };
        console.log("📤 Отправляем запрос с параметрами:", params);
        trigger(params);
    };

    useEffect(() => {
        fetchUsers(1);
    }, []);

    useEffect(() => {
        if (page > 1) {
            fetchUsers(page);
        }
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        fetchUsers(1);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleClear = () => {
        setSearch("");
        setRole("");
        setPage(1);
        fetchUsers(1);
    };

    useEffect(() => {
        if (data) {
            console.log("📦 Данные получены:", data);
        }
        if (error) {
            console.error("❌ Ошибка:", error);
        }
    }, [data, error]);

    const users = data?.data?.records || [];
    const pagination = data?.data?.pagination || {};
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.currentPage || 1;
    const totalCount = pagination.total_count || 0;

    const handlePrevPage = () => {
        if (currentPage > 1) {
            const newPage = currentPage - 1;
            setPage(newPage);
            fetchUsers(newPage);
        }
    };
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const newPage = currentPage + 1;
            setPage(newPage);
            fetchUsers(newPage);
        }
    };
    const handleFirstPage = () => {
        if (currentPage !== 1) {
            setPage(1);
            fetchUsers(1);
        }
    };
    const handleLastPage = () => {
        if (currentPage !== totalPages) {
            setPage(totalPages);
            fetchUsers(totalPages);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleDateString("uz-UZ", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="mt-[10px]">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold text-text-primary">Xodimlar</h1>
                <div className="flex gap-2">
                    <Create />
                    <button
                        onClick={() => fetchUsers(page)}
                        className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent transition-colors"
                        title="Yangilash"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Блок фильтров с фоном как у карточки */}
            <div className="bg-card border border-border rounded-lg p-2 mb-4 shadow-md">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                        <input
                            type="text"
                            placeholder="Ism yoki username bo‘yicha qidirish..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text placeholder:text-input-placeholder focus:border-accent focus:outline-none transition-colors"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    </div>

                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="px-4 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors"
                    >
                        {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={handleSearch}
                        className="px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors font-medium"
                    >
                        Qidirish
                    </button>

                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-text-secondary hover:text-accent transition-colors"
                    >
                        Tozalash
                    </button>
                </div>
            </div>

            {isLoading && <Loading />}
            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg">
                    Xatolik yuz berdi: {error.data?.message || error.status || "Noma'lum xatolik"}
                </div>
            )}

            {!isLoading && !error && (
                <>
                    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-md">
                        <table className="w-full text-sm text-text-primary">
                            <thead className="bg-[var(--card-bg)]/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">№</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">To‘liq ism</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Telefon</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Username</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Rol</th>
                                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-text-secondary">
                                            Xodimlar topilmadi
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, index) => (
                                        <tr key={user.id} className="border-b border-border hover:bg-[var(--accent)]/5 transition-colors last:border-0">
                                            <td className="px-4 py-3 font-mono text-xs">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium">{user.full_name}</td>
                                            <td className="px-4 py-3">{user.phone || "—"}</td>
                                            <td className="px-4 py-3">{user.username}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${user.role === "super_admin" ? "bg-purple-500/20 text-purple-600 dark:text-purple-400" :
                                                        user.role === "admin" ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" :
                                                            user.role === "teacher" ? "bg-green-500/20 text-green-600 dark:text-green-400" :
                                                                user.role === "hr" ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                                                                    user.role === "cashier" ? "bg-orange-500/20 text-orange-600 dark:text-orange-400" :
                                                                        "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                                                    }`}>
                                                    {user.role === "super_admin" && "Super Admin"}
                                                    {user.role === "admin" && "Admin"}
                                                    {user.role === "teacher" && "O‘qituvchi"}
                                                    {user.role === "parent" && "Ota-ona"}
                                                    {user.role === "hr" && "HR"}
                                                    {user.role === "cashier" && "Kassir"}
                                                    {!["super_admin", "admin", "teacher", "parent", "hr", "cashier"].includes(user.role) && user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-text-secondary text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Edit user={user} />
                                                    <Delete user={user} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between mt-4 gap-2">
                        <div className="text-sm text-text-secondary">
                            {totalCount > 0 ? (
                                <>Jami {totalCount} ta xodim, {currentPage} / {totalPages} sahifa</>
                            ) : (
                                <>Ma'lumot yo‘q</>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleFirstPage} disabled={currentPage <= 1} className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                <ChevronsLeft className="w-5 h-5" />
                            </button>
                            <button onClick={handlePrevPage} disabled={currentPage <= 1} className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="px-3 py-1 rounded-lg bg-accent/10 text-accent font-medium">{currentPage}</span>
                            <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <button onClick={handleLastPage} disabled={currentPage >= totalPages} className="p-2 rounded-lg border border-border bg-card text-text-primary hover:bg-[var(--accent)]/10 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                <ChevronsRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}