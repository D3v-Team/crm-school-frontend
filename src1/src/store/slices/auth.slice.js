// store/slices/auth.slice.js
import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const initialState = {
    token: Cookies.get('token') || null,
    refreshToken: Cookies.get('refresh_token') || null,
    jti: Cookies.get('jti') || null,
    userId: Cookies.get('userId') || Cookies.get('us_nesw') || null,
    role: Cookies.get('role') || null,
    isAuthenticated: !!Cookies.get('token'),
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuth(state, action) {
            const payload = action.payload || {};

            const token =
                payload.token ||
                payload.access_token ||
                payload.tokens?.access_token ||
                payload.tokens?.accessToken ||
                null;

            const refreshToken =
                payload.refresh_token || payload.tokens?.refresh_token || payload.tokens?.refreshToken || null;

            const jti = payload.jti || payload.tokens?.jti || null;
            const userId = payload.user?.id || payload.userId || payload.user_id || null;
            const role = payload.role || payload.user?.role || null;

            state.token = token;
            state.refreshToken = refreshToken;
            state.jti = jti;
            state.userId = userId;
            state.role = role;
            state.isAuthenticated = !!token;

            if (token) Cookies.set('token', token);
            if (refreshToken) Cookies.set('refresh_token', refreshToken);
            if (jti) Cookies.set('jti', jti);
            if (userId) {
                Cookies.set('userId', userId);
                Cookies.remove('us_nesw');
            }
            if (role) Cookies.set('role', role);
        },
        logout(state) {
            state.token = null;
            state.refreshToken = null;
            state.jti = null;
            state.userId = null;
            state.role = null;
            state.isAuthenticated = false;

            Cookies.remove('token');
            Cookies.remove('refresh_token');
            Cookies.remove('jti');
            Cookies.remove('userId');
            Cookies.remove('us_nesw');
            Cookies.remove('role');
        },
    },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;
