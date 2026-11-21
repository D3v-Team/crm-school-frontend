import Cookies from 'js-cookie';

/**
 * Login holatini saqlash: brauzer yopilib qayta ochilganda ham foydalanuvchi tizimda qoladi.
 * Muddatsiz (session) cookie brauzer yopilishi bilan o'chadi — shuning uchun muddat beramiz.
 * Muddat backend REFRESH_TOKEN_TIME (15 kun) ga teng. Har bir refreshda tokenlar qayta
 * yoziladi, ya'ni muddat ham yangilanadi: tizimga muntazam kirgan o'qituvchi qayta login qilmaydi.
 */
export const AUTH_COOKIE_DAYS = 15;

const options = () => ({
    expires: AUTH_COOKIE_DAYS,
    sameSite: 'Lax',
    secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    path: '/',
});

export const setAuthCookie = (key, value) => {
    if (value === undefined || value === null || value === '') return;
    Cookies.set(key, String(value), options());
};

export const removeAuthCookie = (key) => {
    Cookies.remove(key, { path: '/' });
    Cookies.remove(key); // eski (path ko'rsatilmagan) cookie'lar uchun
};

/* Avval muddatsiz saqlangan cookie'larni (eski versiyadan) muddatli qilib qayta yozamiz,
   aks holda hozir tizimda bo'lganlar brauzerni yopishi bilan baribir chiqib ketadi. */
const PERSISTED_KEYS = ['token', 'refresh_token', 'jti', 'userId', 'role', 'is_payment'];
export const persistExistingAuthCookies = () => {
    if (!Cookies.get('token') && !Cookies.get('refresh_token')) return;
    PERSISTED_KEYS.forEach((key) => {
        const value = Cookies.get(key);
        if (value) setAuthCookie(key, value);
    });
};

/* Rol bo'yicha bosh sahifa */
export const homePathFor = (role) => ({
    dev: '/dev/panel',
    teacher: '/teacher/dashboard',
    parent: '/parent/dashboard',
}[role] || '/dashboard');
