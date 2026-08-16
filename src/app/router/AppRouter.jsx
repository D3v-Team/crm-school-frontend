// router/AppRouter.jsx
import { Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import MainLayout from '../layout/MainLayout';
import ErrorPage from '../../Components/Other/ErrorPage/ErrorPage';
import RoleGuard from './RoleGuard';
import { ROUTES } from './routes.config';
import Loading from '../../Components/Other/UI/Loadings/Loading';
import Login from '../../Components/Common/Login';

export default function AppRouter() {
    return (
        <Suspense fallback={<Loading/>}>
            <Routes>
                <Route element={<MainLayout />}>
                    {ROUTES.map(r => (
                        <Route key={r.path} element={<RoleGuard allow={r.roles} />}>
                            <Route path={r.path} element={<r.component />} />
                        </Route>
                    ))}
                    {/* Catch-all route: unknown paths -> ErrorPage */}
                </Route>
                    <Route path="/login" element={<Login/>} />
                    <Route path="*" element={<ErrorPage />} />
            </Routes>
        </Suspense>
    );
}
