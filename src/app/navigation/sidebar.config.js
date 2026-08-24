import { ROLES } from '../permissions/roles';
import { Users, LayoutDashboard, Book, Layers } from 'lucide-react';

const { SUPER_ADMIN, ADMIN, TEACHER, HR, CASHIER } = ROLES;

export const SIDEBAR_CONFIG = [
    {
        label: 'Boshqaruv paneli',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: [SUPER_ADMIN, ADMIN, HR, CASHIER],
    },
    {
        label: 'Xodimlar',
        path: '/sa/employee',
        icon: Users,
        roles: [SUPER_ADMIN],
    },
    {
        label: 'Ustozlar',
        path: '/ad/teachers',
        icon: Users,
        roles: [ADMIN],
    },
    {
        label: "O'quvchilar",
        path: '/ad/student',
        icon: Users,
        roles: [ADMIN],
    },
    {
        label: 'Fanlar',
        path: '/ad/subjects',
        icon: Book,
        roles: [ADMIN, TEACHER],
    },
    {
        label: 'Guruhlar',
        path: '/ad/groups',
        icon: Layers,
        roles: [ADMIN, TEACHER],
    },
];
