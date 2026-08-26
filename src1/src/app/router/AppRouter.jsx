// router/AppRouter.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import MainLayout from '../layout/MainLayout';
import ErrorPage from '../../Components/Other/ErrorPage/ErrorPage';
import RoleGuard from './RoleGuard';
import { ROUTES } from './routes.config';
import Loading from '../../Components/Other/UI/Loadings/Loading';
import Login from '../../Components/Common/Login';

export default function AppRouter() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                {ROUTES.map((r) => {
                    const Component = r.component;
                    return (
                        <Route
                            key={r.path}
                            element={<RoleGuard allow={r.roles} />}
                        >
                            <Route
                                path={r.path}
                                element={
                                    <Suspense fallback={<Loading />}>
                                        <Component />
                                    </Suspense>
                                }
                            />
                        </Route>
                    );
                })}
                {/* Catch-all route: unknown paths -> ErrorPage */}
            </Route>

            <Route
                path="/"
                element={<Navigate to="/login" replace />}
            />

            <Route
                path="/login"
                element={
                    <Suspense fallback={<Loading />}>
                        <Login />
                    </Suspense>
                }
            />

            <Route
                path="*"
                element={
                    <Suspense fallback={<Loading />}>
                        <ErrorPage />
                    </Suspense>
                }
            />
        </Routes>
    );
}
