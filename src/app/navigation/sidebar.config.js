// navigation/sidebar.config.js
import { ROLES } from '../permissions/roles';
import { Users, LayoutDashboard, Settings, Book, Layers } from 'lucide-react';

export const SIDEBAR_CONFIG = [
    {
        label: 'Boshqaruv paneli',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.SUPER_ADMIN],
    },
    {
        label: 'Boshqaruv paneli',
        path: '/ad/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.ADMIN],
    },
    {
        label: 'Ustozlar',
        path: '/ad/teachers',
        icon: Users,
        roles: [ROLES.ADMIN],
    },
    {
        label: 'Xodimlar',
        path: '/sa/employee',
        icon: Users,
        roles: [ROLES.SUPER_ADMIN],
    },
    {
        label: 'O‘quvchilar',
        path: '/ad/student',
        icon: Users,
        roles: [ROLES.ADMIN],
    },
    {
        label: 'Fanlar',
        path: '/ad/subjects',
        icon: Book,
        roles: [ROLES.ADMIN],
    },
    {
        label: 'Guruhlar',
        path: '/ad/groups',
        icon: Layers,
        roles: [ROLES.ADMIN],
    },
];
