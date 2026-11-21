/* eslint-disable react/prop-types */
import { NavLink, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SIDEBAR_CONFIG } from '../../../app/navigation/sidebar.config';

/* Har bir rol uchun pastki panelda turadigan asosiy bo'limlar (qolganlari "Menyu" da) */
const PRIMARY_PATHS = {
    teacher:     ['/teacher/dashboard', '/teacher/groups', '/teacher/schedule', '/teacher/topics'],
    admin:       ['/dashboard', '/ad/student', '/ad/groups', '/ad/teachers'],
    super_admin: ['/dashboard', '/ad/student', '/ad/groups', '/payments'],
    cashier:     ['/dashboard', '/cashier/students', '/payments', '/cashier/expenses'],
    parent:      ['/parent/dashboard', '/parent/attendance', '/parent/grades'],
};

/* Qisqa yozuvlar — pastki panelda joy kam */
const SHORT_LABELS = {
    '/teacher/dashboard': 'Bugun',
    '/teacher/groups': 'Guruhlar',
    '/teacher/schedule': 'Jadval',
    '/teacher/topics': 'Mavzular',
    '/dashboard': 'Panel',
    '/ad/student': "O'quvchilar",
    '/ad/groups': 'Guruhlar',
    '/ad/teachers': 'Ustozlar',
    '/payments': "To'lovlar",
    '/cashier/students': "O'quvchilar",
    '/cashier/expenses': 'Xarajat',
    '/parent/dashboard': 'Bosh sahifa',
    '/parent/attendance': "Yo'qlama",
    '/parent/grades': 'Baholar',
};

const isActive = (item, pathname) =>
    pathname === item.path
    || pathname.startsWith(`${item.path}/`)
    || (item.childPaths || []).some((childPath) => pathname.startsWith(childPath));

/**
 * Telefon uchun pastki navigatsiya (ilova ko'rinishi): asosiy 3–4 bo'lim + "Menyu" (to'liq ro'yxat).
 */
export default function BottomNav({ role, onMenu, menuOpen }) {
    const { pathname } = useLocation();
    const roleItems = SIDEBAR_CONFIG.filter((item) => !item.roles?.length || item.roles.includes(role));
    const preferred = PRIMARY_PATHS[role];
    const items = (preferred
        ? preferred.map((path) => roleItems.find((item) => item.path === path)).filter(Boolean)
        : roleItems
    ).slice(0, 4);

    if (!items.length) return null;

    return (
        <nav className="bottom-nav" aria-label="Asosiy bo'limlar">
            {items.map((item) => {
                const Icon = item.icon;
                const active = !menuOpen && isActive(item, pathname);
                return (
                    <NavLink key={item.path} to={item.path} className={`bottom-nav-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                        <span className="bottom-nav-icon"><Icon size={20} /></span>
                        <span className="bottom-nav-label">{SHORT_LABELS[item.path] || item.label}</span>
                    </NavLink>
                );
            })}
            <button type="button" className={`bottom-nav-item${menuOpen ? ' is-active' : ''}`} onClick={onMenu} aria-expanded={menuOpen}>
                <span className="bottom-nav-icon"><Menu size={20} /></span>
                <span className="bottom-nav-label">Menyu</span>
            </button>
        </nav>
    );
}
