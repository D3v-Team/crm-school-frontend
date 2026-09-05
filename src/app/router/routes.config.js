import { lazy } from 'react';
import { ROLES } from '../permissions/roles';

const { SUPER_ADMIN, ADMIN, TEACHER, HR, CASHIER, DEV } = ROLES;

export const ROUTES = [
    // ── Dashboard ───────────────────────────────────────
    {
        path: '/dashboard',
        component: lazy(() => import('../../Components/Common/SA-Dashboard')),
        roles: [SUPER_ADMIN, ADMIN, HR, CASHIER],
    },

    // ── Developer Panel ───────────────────────────────────
    {
        path: '/dev/panel',
        component: lazy(() => import('../../Components/Common/DevPanel')),
        roles: [DEV],
    },

    // ── Super Admin Panel ─────────────────────────────────
    {
        path: '/sa/employees',
        component: lazy(() => import('../../Components/Common/SuperAdminPanel')),
        roles: [SUPER_ADMIN],
    },

    // ── Super Admin (eski) ───────────────────────────────
    {
        path: '/sa/employee',
        component: lazy(() => import('../../Components/Common/SA-Employee')),
        roles: [SUPER_ADMIN],
    },

    // ── Admin ────────────────────────────────────────────
    {
        path: '/ad/teachers',
        component: lazy(() => import('../../Components/Common/Teacher')),
        roles: [ADMIN],
    },
    {
        path: '/ad/student',
        component: lazy(() => import('../../Components/Common/Student')),
        roles: [ADMIN],
    },
    {
        path: '/ad/subjects',
        component: lazy(() => import('../../Components/Common/Subject')),
        roles: [ADMIN],
    },
    {
        path: '/ad/groups',
        component: lazy(() => import('../../Components/Common/Groups')),
        roles: [ADMIN],
    },
    {
        path: '/parents',
        component: lazy(() => import('../../Components/Common/Parent')),
        roles: [ADMIN, SUPER_ADMIN],
    },
    {
        path: '/payments',
        component: lazy(() => import('../../Components/Common/Payment')),
        roles: [ADMIN, SUPER_ADMIN, CASHIER],
    },
    {
        path: '/bot-notify',
        component: lazy(() => import('../../Components/Common/BotNotify')),
        roles: [ADMIN, SUPER_ADMIN],
    },

    // ── Teacher Panel ────────────────────────────────────
    {
        path: '/teacher/dashboard',
        component: lazy(() => import('../../Components/Common/TeacherPanel/TeacherDashboardPage')),
        roles: [TEACHER],
    },
    {
        path: '/teacher/groups',
        component: lazy(() => import('../../Components/Common/TeacherPanel/TeacherGroupsPage')),
        roles: [TEACHER],
    },
    {
        path: '/teacher/schedule',
        component: lazy(() => import('../../Components/Common/TeacherPanel/TeacherSchedulePage')),
        roles: [TEACHER],
    },
    {
        path: '/teacher/topics',
        component: lazy(() => import('../../Components/Common/TeacherPanel/TeacherTopicsPage')),
        roles: [TEACHER],
    },
    {
        path: '/teacher/subjects',
        component: lazy(() => import('../../Components/Common/TeacherPanel/TeacherSubjectsPage')),
        roles: [TEACHER],
    },

    // ── Parent Panel ─────────────────────────────────────
    {
        path: '/parent/dashboard',
        component: lazy(() => import('../../Components/Common/ParentPanel/ParentDashboardPage')),
        roles: ['parent'],
    },
    {
        path: '/parent/attendance',
        component: lazy(() => import('../../Components/Common/ParentPanel/ParentAttendancePage')),
        roles: ['parent'],
    },
    {
        path: '/parent/grades',
        component: lazy(() => import('../../Components/Common/ParentPanel/ParentGradesPage')),
        roles: ['parent'],
    },

    // ── Cashier Panel ─────────────────────────────────────
    {
        path: '/cashier/students',
        component: lazy(() => import('../../Components/Common/CashierPanel/CashierStudents')),
        roles: [CASHIER],
    },
    {
        path: '/cashier/groups',
        component: lazy(() => import('../../Components/Common/CashierPanel/CashierGroups')),
        roles: [CASHIER],
    },

    // ── Profile (hammaga) ────────────────────────────────
    {
        path: '/profile',
        component: lazy(() => import('../../Components/Common/Profile')),
        roles: null,
    },

    // ── Detail pages ─────────────────────────────────────
    {
        path: '/teacher/:id',
        component: lazy(() => import('../../Components/Common/TeacherProfile')),
        roles: [ADMIN, TEACHER],
    },
    {
        path: '/group/:id',
        component: lazy(() => import('../../Components/Common/GroupProfile')),
        roles: [ADMIN, TEACHER, CASHIER],
    },
    {
        path: '/student/:id',
        component: lazy(() => import('../../Components/Common/StudentProfile')),
        roles: [ADMIN, TEACHER, CASHIER],
    },
    {
        path: '/parent/:id',
        component: lazy(() => import('../../Components/Common/ParentProfile')),
        roles: [ADMIN, SUPER_ADMIN],
    },
];
