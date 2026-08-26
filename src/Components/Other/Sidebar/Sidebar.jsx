import { NavLink, useLocation } from "react-router-dom";
import { SIDEBAR_CONFIG } from "../../../app/navigation/sidebar.config";
import { useAppSelector } from "../../../store/hooks";
import { useGetUserByIdQuery } from "../../../store/services/user.api";
import Cookies from 'js-cookie';
import { GraduationCap, ChevronRight } from "lucide-react";

export default function Sidebar({ open }) {
    const location = useLocation();
    const roleFromStore = useAppSelector((s) => s.auth?.role);
    const userId = useAppSelector((s) => s.auth?.userId);
    const role = roleFromStore || Cookies.get('role') || null;

    const { data: userData } = useGetUserByIdQuery(userId, { skip: !userId });
    const schoolName = userData?.data?.school?.name || userData?.school?.name || 'CRM School';

    const menuItems = SIDEBAR_CONFIG.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        if (!role) return false;
        return item.roles.includes(role);
    });

    /* Check if current path matches item or any of its childPaths */
    const isItemActive = (item) => {
        const cur = location.pathname;
        if (cur === item.path || cur.startsWith(item.path + '/')) return true;
        if (item.childPaths) {
            return item.childPaths.some(cp => cur.startsWith(cp));
        }
        return false;
    };

    const roleLabel =
        role === 'super_admin' ? 'Super Admin' :
        role === 'admin'       ? 'Admin'       :
        role === 'teacher'     ? "O'qituvchi"  :
        role === 'parent'      ? 'Ota-ona'     :
        role === 'hr'          ? 'HR'          :
        role === 'cashier'     ? 'Kassir'      :
        role === 'dev'         ? 'Developer'   :
        role ? role : 'Foydalanuvchi';

    const roleInitial = roleLabel.charAt(0).toUpperCase();

    return (
        <aside
            style={{
                background: 'var(--sidebar-bg)',
                borderColor: 'var(--sidebar-border)',
                boxShadow: 'var(--shadow-lg)',
            }}
            className={`
                fixed inset-y-0 left-0 z-50
                flex flex-col
                border-r
                overflow-hidden
                transition-all duration-300 ease-in-out
                ${open ? "w-[72px]" : "w-[260px]"}
            `}
        >
            {/* Logo area */}
            <div
                className={`flex items-center gap-3 px-4 py-4 flex-shrink-0 ${open ? 'justify-center px-0' : ''}`}
                style={{ borderBottom: '1px solid var(--card-border)' }}
            >
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                        background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                        boxShadow: '0 4px 12px var(--accent-glow)',
                    }}
                >
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                {!open && (
                    <div className="overflow-hidden">
                        <div className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                            {schoolName}
                        </div>
                        <div className="text-[11px] leading-tight truncate" style={{ color: 'var(--text-muted)' }}>
                            Boshqaruv tizimi
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation — flex-1, no overflow so no scroll */}
            <nav
                className={`flex-1 py-3 flex flex-col gap-0.5 ${open ? 'px-2' : 'px-3'}`}
                style={{ overflowY: 'auto', overflowX: 'hidden' }}
            >
                {!open && (
                    <div className="px-2 pb-2 pt-1">
                        <span
                            className="text-[10px] font-semibold tracking-widest uppercase"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            Menyu
                        </span>
                    </div>
                )}

                {menuItems.map((item, idx) => {
                    const Icon = item.icon;
                    const forceActive = isItemActive(item);
                    return (
                        <NavLink
                            key={item.path + idx}
                            to={item.path}
                            title={open ? item.label : undefined}
                            className="group relative"
                            style={{ textDecoration: 'none' }}
                        >
                            {({ isActive: navActive }) => {
                                const isActive = forceActive || navActive;
                                return (
                                <div
                                    className={`
                                        flex items-center gap-3 rounded-xl transition-all duration-200 font-medium
                                        ${open ? 'justify-center p-3' : 'px-3 py-2.5'}
                                    `}
                                    style={isActive ? {
                                        background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                                        boxShadow: '0 4px 14px var(--accent-glow)',
                                        color: '#fff',
                                    } : {
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    {/* Hover bg for inactive */}
                                    {!isActive && (
                                        <span
                                            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                                            style={{ background: 'var(--accent-soft)' }}
                                        />
                                    )}

                                    <Icon
                                        className={`flex-shrink-0 relative z-10 transition-transform duration-200 group-hover:scale-110 ${isActive ? '' : 'group-hover:text-[var(--accent)]'}`}
                                        style={{ width: 18, height: 18 }}
                                    />

                                    {!open && (
                                        <span className="text-sm relative z-10 truncate flex-1">
                                            {item.label}
                                        </span>
                                    )}

                                    {isActive && !open && (
                                        <ChevronRight
                                            className="w-3.5 h-3.5 ml-auto relative z-10"
                                            style={{ color: 'rgba(255,255,255,0.6)' }}
                                        />
                                    )}

                                    {/* Tooltip for collapsed */}
                                    {open && (
                                        <div
                                            className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap z-50
                                                opacity-0 group-hover:opacity-100 pointer-events-none
                                                transition-all duration-200 translate-x-1 group-hover:translate-x-0"
                                            style={{
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                boxShadow: 'var(--shadow-md)',
                                                border: '1px solid var(--card-border)',
                                            }}
                                        >
                                            {item.label}
                                        </div>
                                    )}
                                </div>
                                );
                            }}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User section at bottom */}
            <div
                className={`flex items-center gap-3 p-3 flex-shrink-0 ${open ? 'justify-center' : ''}`}
                style={{ borderTop: '1px solid var(--card-border)' }}
            >
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
                >
                    {roleInitial}
                </div>
                {!open && (
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {roleLabel}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            Tizimda
                        </div>                    </div>
                )}
            </div>
        </aside>
    );
}
