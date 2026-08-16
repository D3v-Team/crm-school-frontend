import { lazy } from 'react';
import { ROLES } from '../permissions/roles';

export const ROUTES = [
    {
        path: '/dashboard',
        component: lazy(() => import('../../Components/Common/SA-Dashboard')),
        roles: [ROLES.SUPER_ADMIN],
    },
    {
        path: '/sa/employee',
        component: lazy(() => import('../../Components/Common/SA-Employee')),
        roles: [ROLES.SUPER_ADMIN],
    },
    {
        path: '/profile',
        component: lazy(() => import('../../Components/Common/Profile')),
        roles: null,
    },
    {
        path: '/ad/dashboard',
        component: lazy(() => import('../../Components/Common/AD-Dashboard')),
        roles: [ROLES.ADMIN],
    },
    {
        path: '/ad/teachers',
        component: lazy(() => import('../../Components/Common/Teacher')),
        roles: [ROLES.ADMIN],
    },
    {
        path: '/ad/student',
        component: lazy(() => import('../../Components/Common/Student')),
        roles: [ROLES.ADMIN],
    },
    {
        path: '/ad/subjects',
        component: lazy(() => import('../../Components/Common/Subject')),
        roles: [ROLES.ADMIN],
    },
    {
        path: '/ad/groups',
        component: lazy(() => import('../../Components/Common/Groups')),
        roles: [ROLES.ADMIN],
    },
    {
        path: '/teacher/:id',
        component: lazy(() => import('../../Components/Common/TeacherProfile')),
        roles: [ROLES.ADMIN],
    },
];

