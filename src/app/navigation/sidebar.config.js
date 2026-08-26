import { ROLES } from '../permissions/roles';
import {
    Users, LayoutDashboard, Book, Layers,
    CreditCard, UserCheck, MessageSquare, CalendarDays,
    BookOpen, Building2,
} from 'lucide-react';

const { DEV, SUPER_ADMIN, ADMIN, TEACHER, HR, CASHIER } = ROLES;

export const SIDEBAR_CONFIG = [
    // ── Developer ────────────────────────────────────────
    {
        label: 'Maktablar',
        path: '/dev/panel',
        icon: Building2,
        roles: [DEV],
    },

    // ── Dashboard (Admin, HR, Cashier) ───────────────────
    {
        label: 'Boshqaruv paneli',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: [SUPER_ADMIN, ADMIN, HR, CASHIER],
    },

    // ── Super Admin ──────────────────────────────────────
    {
        label: 'Xodimlar',
        path: '/sa/employees',
        icon: Users,
        roles: [SUPER_ADMIN],
    },

    // ── Admin ────────────────────────────────────────────
    {
        label: 'Ustozlar',
        path: '/ad/teachers',
        icon: Users,
        roles: [ADMIN],
        childPaths: ['/teacher/'],
    },
    {
        label: "O'quvchilar",
        path: '/ad/student',
        icon: Users,
        roles: [ADMIN],
        childPaths: ['/student/'],
    },
    {
        label: 'Ota-onalar',
        path: '/parents',
        icon: UserCheck,
        roles: [ADMIN, SUPER_ADMIN],
        childPaths: ['/parent/'],
    },
    {
        label: 'Fanlar',
        path: '/ad/subjects',
        icon: Book,
        roles: [ADMIN],
    },
    {
        label: 'Guruhlar',
        path: '/ad/groups',
        icon: Layers,
        roles: [ADMIN],
        childPaths: ['/group/'],
    },
    {
        label: "To'lovlar tarixi",
        path: '/payments',
        icon: CreditCard,
        roles: [SUPER_ADMIN, ADMIN, CASHIER],
    },
    {
        label: 'Bot xabarnomalar',
        path: '/bot-notify',
        icon: MessageSquare,
        roles: [ADMIN, SUPER_ADMIN],
    },

    // ── Teacher ──────────────────────────────────────────
    {
        label: 'Dashboard',
        path: '/teacher/dashboard',
        icon: LayoutDashboard,
        roles: [TEACHER],
    },
  
    {
        label: 'Dars jadvali',
        path: '/teacher/schedule',
        icon: CalendarDays,
        roles: [TEACHER],
    },
    {
        label: 'Mavzular',
        path: '/teacher/topics',
        icon: BookOpen,
        roles: [TEACHER],
    },
      {
        label: 'Guruhlar',
        path: '/teacher/groups',
        icon: Layers,
        roles: [TEACHER],
        childPaths: ['/group/'],
    },
    {
        label: 'Fanlar',
        path: '/teacher/subjects',
        icon: Book,
        roles: [TEACHER],
    },

    // ── Parent ───────────────────────────────────────────
    {
        label: 'Bosh sahifa',
        path: '/parent/dashboard',
        icon: LayoutDashboard,
        roles: ['parent'],
    },
    {
        label: "Yo'qlama",
        path: '/parent/attendance',
        icon: CalendarDays,
        roles: ['parent'],
    },
    {
        label: 'Baholar',
        path: '/parent/grades',
        icon: BookOpen,
        roles: ['parent'],
    },
];
