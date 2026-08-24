import { lazy } from 'react';
import { ROLES } from '../permissions/roles';

const { SUPER_ADMIN, ADMIN, TEACHER, HR, CASHIER } = ROLES;

export const ROUTES = [
    // Dashboard — admin va boshqalar uchun (teacher emas)
    {
        path: '/dashboard',
        component: lazy(() => import('../../Components/Common/SA-Dashboard')),
        roles: [SUPER_ADMIN, ADMIN, HR, CASHIER],
    },

    // Super admin only
    {
        path: '/sa/employee',
        component: lazy(() => import('../../Components/Common/SA-Employee')),
        roles: [SUPER_ADMIN],
    },

    // Admin + Teacher
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
        roles: [ADMIN, TEACHER],
    },
    {
        path: '/ad/groups',
        component: lazy(() => import('../../Components/Common/Groups')),
        roles: [ADMIN, TEACHER],
    },

    // Profile — hammaga ochiq
    {
        path: '/profile',
        component: lazy(() => import('../../Components/Common/Profile')),
        roles: null,
    },

    // Detail pages
    {
        path: '/teacher/:id',
        component: lazy(() => import('../../Components/Common/TeacherProfile')),
        roles: [ADMIN, TEACHER],
    },
    {
        path: '/group/:id',
        component: lazy(() => import('../../Components/Common/GroupProfile')),
        roles: [ADMIN, TEACHER],
    },
    {
        path: '/student/:id',
        component: lazy(() => import('../../Components/Common/StudentProfile')),
        roles: [ADMIN, TEACHER],
    },
];
