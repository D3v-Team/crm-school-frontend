import { NavLink, useLocation } from "react-router-dom";
import { SIDEBAR_CONFIG } from "../../../app/navigation/sidebar.config";
import { useAppSelector } from "../../../store/hooks";
import { useGetUserByIdQuery } from "../../../store/services/user.api";
import Cookies from 'js-cookie';
import { GraduationCap, ChevronRight, X } from "lucide-react";

export default function Sidebar({ open, mobileOpen, isMobile, onClose }) {
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

    const isItemActive = (item) => {
        const cur = location.pathname;
        if (cur === item.path || cur.startsWith(item.path + '/')) return true;
        if (item.childPaths) return item.childPaths.some(cp => cur.startsWith(cp));
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

    // Desktop: collapsed = open prop is true → width 72px
    // Mobile:  drawer — slides in when mobileOpen=true
    const isCollapsed = !isMobile && open;
    const sidebarWidth = isCollapsed ? 72 : 260;

    const mobileStyle = isMobile ? {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        width: 270,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: mobileOpen ? 'var(--shadow-xl)' : 'none',
    } : {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        width: sidebarWidth,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
    };

    return (
        <aside
            style={{
                background: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--sidebar-border)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                ...mobileStyle,
            }}
        >
            {/* Logo area */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: isCollapsed ? '16px 0' : '14px 16px',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    borderBottom: '1px solid var(--card-border)',
                    flexShrink: 0,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                        style={{
                            width: 36, height: 36, borderRadius: 12,
                            background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                            boxShadow: '0 4px 12px var(--accent-glow)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <GraduationCap style={{ width: 18, height: 18, color: '#fff' }} />
                    </div>
                    {!isCollapsed && (
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                                {schoolName}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                Boshqaruv tizimi
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile close button */}
                {isMobile && (
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: 9, border: 'none',
                            background: 'var(--accent-soft)', color: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0,
                        }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav
                style={{
                    flex: 1,
                    padding: isCollapsed ? '12px 8px' : '12px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {!isCollapsed && (
                    <div style={{ padding: '0 8px 8px', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Menyu
                    </div>
                )}

                {menuItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item);
                    return (
                        <NavLink
                            key={item.path + idx}
                            to={item.path}
                            title={isCollapsed ? item.label : undefined}
                            onClick={isMobile ? onClose : undefined}
                            style={{ textDecoration: 'none' }}
                            className="group relative"
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: isCollapsed ? 0 : 10,
                                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                                    padding: isCollapsed ? '10px' : '10px 12px',
                                    borderRadius: 12,
                                    transition: 'all 0.15s ease',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    background: isActive
                                        ? 'linear-gradient(135deg, var(--accent), #7c3aed)'
                                        : 'transparent',
                                    boxShadow: isActive ? '0 4px 14px var(--accent-glow)' : 'none',
                                    color: isActive ? '#fff' : 'var(--text-secondary)',
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--accent-soft)'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <Icon style={{ width: 18, height: 18, flexShrink: 0, position: 'relative', zIndex: 1 }} />

                                {!isCollapsed && (
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1, position: 'relative', zIndex: 1, whiteSpace: 'nowrap' }}>
                                        {item.label}
                                    </span>
                                )}

                                {isActive && !isCollapsed && (
                                    <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                                )}

                                {/* Tooltip for collapsed desktop */}
                                {isCollapsed && (
                                    <div
                                        className="group-hover:opacity-100"
                                        style={{
                                            position: 'absolute',
                                            left: '100%',
                                            marginLeft: 10,
                                            padding: '6px 12px',
                                            borderRadius: 9,
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            boxShadow: 'var(--shadow-md)',
                                            border: '1px solid var(--card-border)',
                                            fontSize: '0.78rem',
                                            fontWeight: 500,
                                            whiteSpace: 'nowrap',
                                            opacity: 0,
                                            pointerEvents: 'none',
                                            zIndex: 100,
                                            transition: 'opacity 0.15s ease',
                                        }}
                                    >
                                        {item.label}
                                    </div>
                                )}
                            </div>
                        </NavLink>
                    );
                })}
            </nav>

            {/* User section */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isCollapsed ? 0 : 10,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '12px 0' : '12px 16px',
                    borderTop: '1px solid var(--card-border)',
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        width: 36, height: 36, borderRadius: 12,
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.875rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}
                >
                    {roleInitial}
                </div>
                {!isCollapsed && (
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {roleLabel}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tizimda</div>
                    </div>
                )}
            </div>
        </aside>
    );
}
